import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminReturnDetailsPage from '../AdminReturnDetailsPage';

vi.mock('../../services/adminService');

import * as adminService from '../../services/adminService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ returnRequestId: 'ret-1' })
  };
});

const VALID_IMEI = '123456789012345';
const OTHER_IMEI = '987654321054321';

const returnFixture = (overrides = {}) => ({
  _id: 'ret-1',
  returnRequestNumber: '20260915001',
  status: 'item_received',
  order: { _id: 'order-1', orderNumber: 'ORD-1-001', status: 'delivered' },
  items: [{ productName: 'GrapheneOS Pixel 9 Pro', quantity: 1, unitPrice: 999.99, totalRefundAmount: 999.99, reason: 'changed_mind' }],
  totalRefundAmount: 999.99,
  deviceVerification: { status: 'not_started', scans: [] },
  ...overrides
});

const renderComponent = () => render(
  <BrowserRouter>
    <AdminReturnDetailsPage />
  </BrowserRouter>
);

describe('AdminReturnDetailsPage — device verification (IMEI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getReturnRequestById.mockResolvedValue({ data: { returnRequest: returnFixture() } });
    adminService.getOrderById.mockResolvedValue({
      data: { order: { items: [{ devices: [{ imei: VALID_IMEI }] }] } }
    });
  });

  it('shows the shipped IMEIs expected for this return', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('expected-imeis')).toHaveTextContent(VALID_IMEI);
    });
  });

  it('explains when the order has no IMEI-tracked devices (legacy)', async () => {
    adminService.getOrderById.mockResolvedValue({ data: { order: { items: [] } } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('no-expected-imeis')).toBeInTheDocument();
    });
  });

  it('verifies a matching scan with a green result banner', async () => {
    adminService.verifyReturnDevice.mockResolvedValue({
      data: {
        result: 'match',
        message: 'IMEI matches a device shipped on this order',
        expectedImeis: [VALID_IMEI]
      }
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('verify-imei-input')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('verify-imei-input'), { target: { value: VALID_IMEI } });
    fireEvent.click(screen.getByTestId('verify-imei-button'));

    await waitFor(() => {
      expect(screen.getByTestId('verify-result')).toHaveTextContent('IMEI MATCH');
    });
    expect(adminService.verifyReturnDevice).toHaveBeenCalledWith('ret-1', VALID_IMEI);
  });

  it('verifies a mismatching scan with a red banner and the blocked warning', async () => {
    adminService.verifyReturnDevice.mockResolvedValue({
      data: {
        result: 'mismatch',
        message: 'WARNING: returned IMEI does not match a device shipped on this order — refund blocked pending review',
        expectedImeis: [VALID_IMEI]
      }
    });
    // Refresh after the scan flips the verification status to mismatch
    adminService.getReturnRequestById.mockResolvedValueOnce({ data: { returnRequest: returnFixture() } })
      .mockResolvedValue({ data: { returnRequest: returnFixture({ deviceVerification: { status: 'mismatch', scans: [{ scannedImei: OTHER_IMEI, match: false }] } }) } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('verify-imei-input')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('verify-imei-input'), { target: { value: OTHER_IMEI } });
    fireEvent.click(screen.getByTestId('verify-imei-button'));

    await waitFor(() => {
      expect(screen.getByTestId('verify-result')).toHaveTextContent('IMEI MISMATCH');
    });
    await waitFor(() => {
      expect(screen.getByTestId('refund-blocked-banner')).toBeInTheDocument();
    });
  });

  it('rejects an IMEI that is not 15 digits without calling the API', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('verify-imei-input')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('verify-imei-input'), { target: { value: '123' } });
    fireEvent.click(screen.getByTestId('verify-imei-button'));

    expect(await screen.findByTestId('verify-error')).toHaveTextContent('15 digits');
    expect(adminService.verifyReturnDevice).not.toHaveBeenCalled();
  });
});
