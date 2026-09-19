import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminOrderDetailsPage from '../AdminOrderDetailsPage';

vi.mock('../../services/adminService', () => ({
  getOrderById: vi.fn(),
  isAdminAuthenticated: vi.fn(),
  formatCurrency: vi.fn((amount) => `£${amount}`),
  updateOrderStatus: vi.fn(),
  issueRefund: vi.fn(),
  allocateDevice: vi.fn(),
  releaseDevice: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ orderId: 'order-1' })
  };
});

import * as adminService from '../../services/adminService';

const ITEM_ID = 'item-1';
const VALID_IMEI = '123456789012345';

const orderFixture = (overrides = {}) => ({
  _id: 'order-1',
  orderNumber: 'ORD-1-001',
  status: 'processing',
  paymentStatus: 'completed',
  totalAmount: 999.99,
  subtotal: 989.99,
  tax: 0,
  shipping: 10,
  totalRefundedAmount: 0,
  refundHistory: [],
  statusHistory: [],
  createdAt: '2026-09-14T10:00:00Z',
  updatedAt: '2026-09-14T10:00:00Z',
  customerEmail: 'customer@example.com',
  customer: {
    _id: 'customer-1',
    firstName: 'Test',
    lastName: 'Customer',
    email: 'customer@example.com',
    phone: '+44 1234 567890'
  },
  paymentMethod: { type: 'paypal', name: 'PayPal' },
  shippingMethod: { id: 'sm-1', name: 'Standard Shipping', cost: 10, estimatedDelivery: '3-5 business days' },
  shippingAddress: { fullName: 'Test Customer', addressLine1: '1 Test St', city: 'Leeds', postalCode: 'LS1 1AA', country: 'GB' },
  billingAddress: { fullName: 'Test Customer', addressLine1: '1 Test St', city: 'Leeds', postalCode: 'LS1 1AA', country: 'GB' },
  items: [{
    _id: ITEM_ID,
    productId: 'p1',
    productName: 'GrapheneOS Pixel 9 Pro',
    productSlug: 'grapheneos-pixel-9-pro',
    variationId: 'v1',
    sku: 'PIX-9PRO-V1',
    condition: 'good',
    color: 'Obsidian',
    storage: '256GB',
    quantity: 1,
    unitPrice: 999.99,
    totalPrice: 999.99,
    devices: []
  }],
  ...overrides
});

const renderComponent = () => render(
  <BrowserRouter>
    <AdminOrderDetailsPage />
  </BrowserRouter>
);

describe('AdminOrderDetailsPage — Devices / IMEIs', () => {
  let loadCount;

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    loadCount = 0;
    let currentOrder = orderFixture();
    adminService.getOrderById.mockImplementation(async () => {
      loadCount += 1;
      // After a successful allocation the page re-fetches the order with the
      // device snapshot present
      const order = loadCount > 1 && adminService.allocateDevice.mock.results.length > 0
        ? orderFixture({
            items: [{
              ...orderFixture().items[0],
              devices: [{ deviceId: 'dev-1', imei: VALID_IMEI, serialNumber: 'SN-1' }]
            }]
          })
        : currentOrder;
      return { data: { order } };
    });
  });

  it('shows allocation progress per item with a scan input when incomplete', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('devices-card')).toBeInTheDocument();
    });
    expect(screen.getByText('0 of 1 allocated')).toBeInTheDocument();
    expect(screen.getByTestId(`allocate-input-${ITEM_ID}`)).toBeInTheDocument();
  });

  it('renders Items Ordered from real schema fields (no invented names)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('GrapheneOS Pixel 9 Pro').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/good · Obsidian · 256GB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('SKU: PIX-9PRO-V1').length).toBeGreaterThan(0);
    // Real money fields render — no £NaN anywhere on the page
    expect(screen.getAllByText('£999.99').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toContain('NaN');
  });

  it('allocates a scanned IMEI to the order item (JIT flow)', async () => {
    adminService.allocateDevice.mockResolvedValue({
      data: { itemAllocation: { itemId: ITEM_ID, allocated: 1, required: 1 } }
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId(`allocate-input-${ITEM_ID}`)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId(`allocate-input-${ITEM_ID}`), { target: { value: VALID_IMEI } });
    fireEvent.click(screen.getByTestId(`allocate-button-${ITEM_ID}`));

    await waitFor(() => {
      expect(screen.getByTestId('device-success')).toHaveTextContent('allocated');
    });
    expect(adminService.allocateDevice).toHaveBeenCalledWith(
      expect.objectContaining({ imei: VALID_IMEI, orderId: 'order-1', orderItemId: ITEM_ID })
    );
  });

  it('rejects an IMEI that is not 15 digits without calling the API', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId(`allocate-input-${ITEM_ID}`)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId(`allocate-input-${ITEM_ID}`), { target: { value: '123' } });
    fireEvent.click(screen.getByTestId(`allocate-button-${ITEM_ID}`));

    expect(await screen.findByTestId('device-error')).toHaveTextContent('15 digits');
    expect(adminService.allocateDevice).not.toHaveBeenCalled();
  });

  it('shows assigned IMEIs with a Release action once allocated', async () => {
    adminService.getOrderById.mockReset();
    adminService.getOrderById.mockResolvedValue({
      data: {
        order: orderFixture({
          items: [{ ...orderFixture().items[0], devices: [{ deviceId: 'dev-1', imei: VALID_IMEI }] }]
        })
      }
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('1 of 1 allocated')).toBeInTheDocument();
    });
    expect(screen.getByText(VALID_IMEI)).toBeInTheDocument();
    expect(screen.getByTestId(`release-device-${VALID_IMEI}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`allocate-input-${ITEM_ID}`)).not.toBeInTheDocument();
  });

  it('releases an allocated device back to stock', async () => {
    adminService.getOrderById.mockReset();
    let withDevice = true;
    adminService.getOrderById.mockImplementation(async () => ({
      data: {
        order: withDevice
          ? orderFixture({ items: [{ ...orderFixture().items[0], devices: [{ deviceId: 'dev-1', imei: VALID_IMEI }] }] })
          : orderFixture()
      }
    }));
    adminService.releaseDevice.mockImplementation(async () => { withDevice = false; return { success: true }; });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId(`release-device-${VALID_IMEI}`)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`release-device-${VALID_IMEI}`));

    await waitFor(() => {
      expect(screen.getByTestId('device-success')).toHaveTextContent('released back to stock');
    });
    expect(adminService.releaseDevice).toHaveBeenCalledWith('dev-1', expect.any(String));
  });
});

describe('AdminOrderDetailsPage — device-verification refund override', () => {
  const openRefundModal = async () => {
    renderComponent2();
    // The Issue Refund section opens the modal via its action button (the
    // h2 is not clickable)
    const openButton = await screen.findByRole('button', { name: /issue refund/i });
    fireEvent.click(openButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Refund$/ })).toBeInTheDocument();
    });
  };

  const renderComponent2 = () => render(
    <BrowserRouter>
      <AdminOrderDetailsPage />
    </BrowserRouter>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    adminService.isAdminAuthenticated.mockReturnValue(true);
    adminService.getOrderById.mockResolvedValue({ data: { order: orderFixture({ status: 'delivered' }) } });
  });

  it('blocks the refund after a 409 and requires explicit override confirmation', async () => {
    const blockedError = new Error('Refund blocked: failed IMEI device verification');
    blockedError.status = 409;
    blockedError.data = { blocked: true, quarantinedDevices: 1, mismatchedReturns: 1 };
    adminService.issueRefund.mockRejectedValueOnce(blockedError);

    await openRefundModal();

    fireEvent.change(screen.getByLabelText(/Refund Amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Refund Reason/i), { target: { value: 'Return approved' } });
    fireEvent.click(screen.getByRole('button', { name: /^Refund$/ }));

    await waitFor(() => {
      expect(adminService.issueRefund).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByTestId('refund-block-warning', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByTestId('refund-block-warning')).toHaveTextContent('Quarantined devices: 1');
    // Refund stays blocked until the checkbox is confirmed
    expect(screen.getByRole('button', { name: /^Refund$/ })).toBeDisabled();
  });

  it('resubmits with overrideDeviceMismatch once the admin confirms', async () => {
    const blockedError = new Error('Refund blocked: failed IMEI device verification');
    blockedError.status = 409;
    blockedError.data = { blocked: true, quarantinedDevices: 1, mismatchedReturns: 1 };
    adminService.issueRefund
      .mockRejectedValueOnce(blockedError)
      .mockResolvedValueOnce({ success: true });

    await openRefundModal();

    fireEvent.change(screen.getByLabelText(/Refund Amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Refund Reason/i), { target: { value: 'Return approved' } });
    fireEvent.click(screen.getByRole('button', { name: /^Refund$/ }));

    await waitFor(() => {
      expect(screen.getByTestId('refund-block-warning')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('override-confirm-checkbox'));

    const refundButton = screen.getByRole('button', { name: /^Refund$/ });
    await waitFor(() => {
      expect(refundButton).not.toBeDisabled();
    });
    fireEvent.click(refundButton);

    await waitFor(() => {
      expect(adminService.issueRefund).toHaveBeenCalledTimes(2);
    });
    expect(adminService.issueRefund).toHaveBeenLastCalledWith('order-1', expect.objectContaining({
      overrideDeviceMismatch: true
    }));
  });

  it('processes a normal refund with no block UI', async () => {
    adminService.issueRefund.mockResolvedValue({ success: true });

    await openRefundModal();
    fireEvent.change(screen.getByLabelText(/Refund Amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Refund Reason/i), { target: { value: 'Customer request' } });
    fireEvent.click(screen.getByRole('button', { name: /^Refund$/ }));

    await waitFor(() => {
      expect(adminService.issueRefund).toHaveBeenCalledWith('order-1', expect.not.objectContaining({
        overrideDeviceMismatch: true
      }));
    });
  });
});
