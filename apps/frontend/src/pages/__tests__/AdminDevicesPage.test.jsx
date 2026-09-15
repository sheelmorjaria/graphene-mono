import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDevicesPage from '../AdminDevicesPage';

vi.mock('../../services/adminService', () => ({
  isAdminAuthenticated: vi.fn(() => true),
  getAllDevices: vi.fn(),
  receiveDevice: vi.fn(),
  getProducts: vi.fn()
}));

import * as adminService from '../../services/adminService';

const devicesResponse = (devices) => ({
  data: { devices, pagination: { page: 1, pages: 1, total: devices.length } }
});

const renderComponent = () => render(
  <BrowserRouter>
    <AdminDevicesPage />
  </BrowserRouter>
);

describe('AdminDevicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getProducts.mockResolvedValue({ data: { products: [] } });
  });

  it('renders the devices table with status badges', async () => {
    adminService.getAllDevices.mockResolvedValue(devicesResponse([
      { _id: 'd1', imei: '123456789012345', status: 'quarantined', productName: 'GrapheneOS Pixel 9 Pro', sku: 'PIX-9PRO-V1', createdAt: '2026-09-15T10:00:00Z' },
      { _id: 'd2', imei: '987654321054321', status: 'in_stock', productName: 'GrapheneOS Pixel 10', createdAt: '2026-09-15T11:00:00Z' }
    ]));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('devices-table')).toBeInTheDocument();
    });
    expect(screen.getByText('123456789012345')).toBeInTheDocument();
    expect(screen.getByText('987654321054321')).toBeInTheDocument();
    expect(screen.getByText('quarantined')).toBeInTheDocument();
  });

  it('shows an empty state when there are no devices', async () => {
    adminService.getAllDevices.mockResolvedValue(devicesResponse([]));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/No devices yet/i)).toBeInTheDocument();
    });
  });

  it('shows an error banner when loading fails', async () => {
    adminService.getAllDevices.mockRejectedValue(new Error('Failed to fetch devices'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByTestId('devices-error')).toHaveTextContent('Failed to fetch devices');
    });
  });

  it('opens the receive modal and rejects an IMEI that is not 15 digits', async () => {
    adminService.getAllDevices.mockResolvedValue(devicesResponse([]));
    renderComponent();

    fireEvent.click(await screen.findByTestId('receive-device-button'));
    expect(screen.getByTestId('receive-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/IMEI \(15 digits\)/i), { target: { value: '12345' } });
    fireEvent.click(screen.getByTestId('receive-submit'));

    expect(await screen.findByTestId('receive-error')).toHaveTextContent('exactly 15 digits');
    expect(adminService.receiveDevice).not.toHaveBeenCalled();
  });

  it('receives a valid device into stock', async () => {
    adminService.getAllDevices.mockResolvedValue(devicesResponse([]));
    adminService.getProducts.mockResolvedValue({ data: { products: [{ _id: 'p1', name: 'GrapheneOS Pixel 9 Pro', variations: [] }] } });
    adminService.receiveDevice.mockResolvedValue({ success: true, data: { device: {} } });
    renderComponent();

    fireEvent.click(await screen.findByTestId('receive-device-button'));
    // Products load async into the select — wait for the option first
    await screen.findByRole('option', { name: /Pixel 9 Pro/i });
    fireEvent.change(screen.getByLabelText(/IMEI \(15 digits\)/i), { target: { value: '123456789012345' } });
    fireEvent.change(screen.getByLabelText(/Product/i), { target: { value: 'p1' } });
    fireEvent.click(screen.getByTestId('receive-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('devices-success')).toHaveTextContent('received into stock');
    });
    expect(adminService.receiveDevice).toHaveBeenCalledWith(
      expect.objectContaining({ imei: '123456789012345', productId: 'p1' })
    );
  });

  it('surfaces a duplicate-IMEI 409 from the server in the modal', async () => {
    adminService.getAllDevices.mockResolvedValue(devicesResponse([]));
    adminService.getProducts.mockResolvedValue({ data: { products: [{ _id: 'p1', name: 'GrapheneOS Pixel 9 Pro', variations: [] }] } });
    adminService.receiveDevice.mockRejectedValue(new Error('A device with IMEI 123456789012345 already exists'));
    renderComponent();

    fireEvent.click(await screen.findByTestId('receive-device-button'));
    // Products load async into the select — wait for the option first
    await screen.findByRole('option', { name: /Pixel 9 Pro/i });
    fireEvent.change(screen.getByLabelText(/IMEI \(15 digits\)/i), { target: { value: '123456789012345' } });
    fireEvent.change(screen.getByLabelText(/Product/i), { target: { value: 'p1' } });
    fireEvent.click(screen.getByTestId('receive-submit'));

    expect(await screen.findByTestId('receive-error')).toHaveTextContent('already exists');
  });
});
