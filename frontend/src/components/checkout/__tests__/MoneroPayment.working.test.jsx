import React from 'react';
import { render, screen, waitFor } from '../../../test/test-utils';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MoneroPayment from '../MoneroPayment';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,mockedqrcode'))
  }
}));

// Mock formatCurrency service
vi.mock('../../../services/paymentService', () => ({
  formatCurrency: vi.fn((amount) => `£${amount.toFixed(2)}`)
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('MoneroPayment Component Basic Tests', () => {
  const mockPaymentData = {
    orderId: 'order-123',
    moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
    xmrAmount: 1.234567890123,
    exchangeRate: 0.00617,
    validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    requiredConfirmations: 10,
    paymentWindowHours: 24,
    orderTotal: 199.99
  };

  const mockOnPaymentUpdate = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    });
    
    // Mock successful payment status fetch
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          paymentStatus: 'pending',
          confirmations: 0,
          isExpired: false
        }
      })
    });
  });

  it('should render loading state when no payment data provided', () => {
    render(<MoneroPayment />);
    
    expect(screen.getByText('Setting up Monero payment...')).toBeInTheDocument();
  });

  it('should render payment details when data is provided', async () => {
    render(
      <MoneroPayment 
        paymentData={mockPaymentData}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    // Wait for component to render and process
    await waitFor(() => {
      expect(screen.getByText('Waiting for Payment')).toBeInTheDocument();
    });

    // Check for key payment elements
    expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByText('Monero Address')).toBeInTheDocument();
    expect(screen.getByText('Amount (XMR)')).toBeInTheDocument();
    expect(screen.getByText('Important Notes')).toBeInTheDocument();
  });

  it('should display correct payment amounts and address', async () => {
    render(
      <MoneroPayment 
        paymentData={mockPaymentData}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      // Check XMR amount is displayed correctly (should format without trailing zeros)
      expect(screen.getByDisplayValue('1.234567890123')).toBeInTheDocument();
    });

    // Check Monero address is displayed
    expect(screen.getByDisplayValue(mockPaymentData.moneroAddress)).toBeInTheDocument();
    
    // Check order total is displayed
    expect(screen.getByText('£199.99')).toBeInTheDocument();
  });

  it('should make initial payment status API call', async () => {
    render(
      <MoneroPayment 
        paymentData={mockPaymentData}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/payments/monero/status/${mockPaymentData.orderId}`,
        { credentials: 'include' }
      );
    });

    // Should call the payment update callback
    expect(mockOnPaymentUpdate).toHaveBeenCalledWith({
      status: 'pending',
      confirmations: 0,
      isExpired: false
    });
  });

  it('should handle payment status updates', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          paymentStatus: 'confirmed',
          confirmations: 12,
          isExpired: false
        }
      })
    });

    render(
      <MoneroPayment 
        paymentData={mockPaymentData}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockOnPaymentUpdate).toHaveBeenCalledWith({
        status: 'confirmed',
        confirmations: 12,
        isExpired: false
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
    });
  });

  it('should handle API errors properly', async () => {
    fetch.mockRejectedValue(new Error('Network error'));

    render(
      <MoneroPayment 
        paymentData={mockPaymentData}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Network error');
    });
  });

  it('should display exchange rate information', async () => {
    render(
      <MoneroPayment 
        paymentData={mockPaymentData}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Exchange Rate:/)).toBeInTheDocument();
      expect(screen.getByText(/1 GBP = 0.00617 XMR/)).toBeInTheDocument();
    });
  });

  it('should display payment instructions and notes', async () => {
    render(
      <MoneroPayment 
        paymentData={mockPaymentData}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
    });

    // Check for important payment instructions
    expect(screen.getByText(/Send exactly/)).toBeInTheDocument();
    expect(screen.getByText(/Payment will be confirmed after 10 network confirmations/)).toBeInTheDocument();
    expect(screen.getByText(/Do not close this page until payment is confirmed/)).toBeInTheDocument();

    // Check for important notes
    expect(screen.getByText('Important Notes')).toBeInTheDocument();
    expect(screen.getByText(/Send the exact amount shown above/)).toBeInTheDocument();
    expect(screen.getByText(/Do not send from an exchange/)).toBeInTheDocument();
    expect(screen.getByText(/Payment expires in 24 hours/)).toBeInTheDocument();
    expect(screen.getByText(/Network fees are not included/)).toBeInTheDocument();
  });

  it('should format XMR amounts correctly', () => {
    const { rerender } = render(
      <MoneroPayment 
        paymentData={{ ...mockPaymentData, xmrAmount: 2.500000000000 }}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();

    rerender(
      <MoneroPayment 
        paymentData={{ ...mockPaymentData, xmrAmount: 0.000000001000 }}
        onPaymentUpdate={mockOnPaymentUpdate}
        onError={mockOnError}
      />
    );

    expect(screen.getByDisplayValue('0.000000001')).toBeInTheDocument();
  });
});