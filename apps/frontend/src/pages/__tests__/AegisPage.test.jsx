import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { vi } from 'vitest';
import AegisPage from '../AegisPage';
import * as aegisService from '../../services/aegisService';

vi.mock('../../services/aegisService', async () => {
  const actual = await vi.importActual('../../services/aegisService');
  return {
    ...actual,
    getAegisModels: vi.fn(),
    createAegisOrder: vi.fn()
  };
});

// PayPal SDK wrapper — not under test here
vi.mock('../../components/checkout/AegisPayPalPayment', () => ({
  default: function MockAegisPayPalPayment({ orderId, amount, onSuccess }) {
    return (
      <div data-testid="aegis-paypal-payment">
        <span data-testid="aegis-paypal-order">{orderId}</span>
        <span data-testid="aegis-paypal-amount">{amount}</span>
        <button
          onClick={() => onSuccess({ status: 'captured', downloadUrl: 'https://api.test.example/api/aegis-orders/download/test-token' })}
          data-testid="aegis-paypal-succeed"
        >
          Simulate paid
        </button>
      </div>
    );
  }
}));

const createdOrder = {
  orderId: 'aegis-order-1',
  orderNumber: 'AEG-1700000000-001',
  customerEmail: 'buyer@example.com',
  pixelModel: '7 Pro',
  amountGbp: 99,
  orderStatus: 'Awaiting_Payment',
  paymentStatus: 'Unpaid'
};

describe('AegisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aegisService.getAegisModels.mockResolvedValue({
      models: [
        { value: '7 Pro', label: 'Pixel 7 Pro' },
        { value: '10 Pro Fold', label: 'Pixel 10 Pro Fold' }
      ]
    });
    aegisService.createAegisOrder.mockResolvedValue(createdOrder);
  });

  it('renders the hero, marketing content and FAQ (crawlable)', async () => {
    render(<AegisPage />);

    expect(screen.getByTestId('aegis-hero')).toBeInTheDocument();
    // Hero h1 + the price-card product name
    expect(screen.getAllByText('Aegis Hardening Suite').length).toBeGreaterThan(0);
    expect(screen.getByText('28')).toBeInTheDocument(); // defense count stat

    // Feature groups + FAQ render as plain text
    expect(screen.getByText('Self-wipe triggers')).toBeInTheDocument();
    expect(screen.getByText('Anti-adversary countermeasures')).toBeInTheDocument();
    expect(screen.getByText('Is this legal to use?')).toBeInTheDocument();
  });

  it('populates the model dropdown from the catalog endpoint', async () => {
    render(<AegisPage />);

    await waitFor(() => {
      expect(aegisService.getAegisModels).toHaveBeenCalled();
    });

    const select = screen.getByLabelText(/Pixel model to license/i);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pixel 7 Pro' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pixel 10 Pro Fold' })).toBeInTheDocument();
    });
    expect(select).toBeInTheDocument();
  });

  it('validates email and model before creating an order', async () => {
    render(<AegisPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pixel 7 Pro' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('aegis-buy-button'));
    expect(screen.getByTestId('aegis-form-error')).toHaveTextContent(/valid email/i);
    expect(aegisService.createAegisOrder).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'not-an-email' }
    });
    fireEvent.click(screen.getByTestId('aegis-buy-button'));
    expect(screen.getByTestId('aegis-form-error')).toHaveTextContent(/valid email/i);

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'buyer@example.com' }
    });
    fireEvent.click(screen.getByTestId('aegis-buy-button'));
    expect(screen.getByTestId('aegis-form-error')).toHaveTextContent(/Select the Pixel model/i);
    expect(aegisService.createAegisOrder).not.toHaveBeenCalled();
  });

  it('creates the order and advances to the payment step', async () => {
    render(<AegisPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pixel 7 Pro' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'buyer@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Pixel model to license/i), {
      target: { value: '7 Pro' }
    });
    fireEvent.click(screen.getByTestId('aegis-buy-button'));

    await waitFor(() => {
      expect(aegisService.createAegisOrder).toHaveBeenCalledWith({
        customerEmail: 'buyer@example.com',
        pixelModel: '7 Pro'
      });
    });

    // Payment step: order summary + PayPal buttons
    expect(await screen.findByTestId('aegis-payment-step')).toBeInTheDocument();
    expect(screen.getByText('AEG-1700000000-001')).toBeInTheDocument();
    expect(screen.getByTestId('aegis-paypal-payment')).toBeInTheDocument();
  });

  it('shows the success panel after payment completes', async () => {
    render(<AegisPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pixel 7 Pro' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'buyer@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Pixel model to license/i), {
      target: { value: '7 Pro' }
    });
    fireEvent.click(screen.getByTestId('aegis-buy-button'));

    fireEvent.click(await screen.findByTestId('aegis-paypal-succeed'));

    expect(await screen.findByTestId('aegis-success')).toBeInTheDocument();
    // Automated delivery: direct download button with the capture-provided link
    const downloadButton = screen.getByTestId('aegis-download-button');
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://api.test.example/api/aegis-orders/download/test-token'
    );
    expect(screen.getByText(/same link is in your confirmation email/i)).toBeInTheDocument();
    expect(screen.queryByTestId('aegis-paypal-payment')).not.toBeInTheDocument();
  });

  it('surfaces an order-creation failure without leaving the form', async () => {
    aegisService.createAegisOrder.mockRejectedValue(new Error('Invalid Pixel model'));

    render(<AegisPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pixel 7 Pro' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'buyer@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Pixel model to license/i), {
      target: { value: '7 Pro' }
    });
    fireEvent.click(screen.getByTestId('aegis-buy-button'));

    await waitFor(() => {
      expect(screen.getByTestId('aegis-form-error')).toHaveTextContent(/Invalid Pixel model/i);
    });
    expect(screen.queryByTestId('aegis-payment-step')).not.toBeInTheDocument();
  });

  it('shows an error when the model list fails to load', async () => {
    aegisService.getAegisModels.mockRejectedValue(new Error('Could not load the supported model list.'));

    render(<AegisPage />);

    await waitFor(() => {
      expect(screen.getByTestId('aegis-models-error')).toBeInTheDocument();
    });
  });

  it('preselects the model from the ?model= deep link (product-page cross-sell)', async () => {
    render(<AegisPage />, { initialEntries: ['/aegis?model=7%20Pro'] });

    await waitFor(() => {
      expect(screen.getByLabelText(/Pixel model to license/i)).toHaveValue('7 Pro');
    });
  });

  it('ignores a deep-linked model that is not stocked', async () => {
    render(<AegisPage />, { initialEntries: ['/aegis?model=Pixel%204'] });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Pixel 7 Pro' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Pixel model to license/i)).toHaveValue('');
  });
});
