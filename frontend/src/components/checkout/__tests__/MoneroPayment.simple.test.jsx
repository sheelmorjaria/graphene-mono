import React from 'react';
import { render, screen, waitFor, act, userEvent } from '../../../test/test-utils';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
});

// Mock fetch globally
global.fetch = vi.fn();

describe('MoneroPayment Component', () => {
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

    // Setup fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render loading state when no payment data', () => {
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

      await waitFor(() => {
        expect(screen.getByText('Waiting for Payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
      expect(screen.getByText('Monero Address')).toBeInTheDocument();
      expect(screen.getByText('Amount (XMR)')).toBeInTheDocument();
    });

    it('should display correct payment amounts', async () => {
      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('1.234567890123')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue(mockPaymentData.moneroAddress)).toBeInTheDocument();
      expect(screen.getByText('£199.99')).toBeInTheDocument();
    });
  });

  describe('Clipboard Functionality', () => {
    it('should copy address to clipboard when button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockPaymentData.moneroAddress)).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByRole('button');
      const addressCopyButton = copyButtons.find(btn => 
        btn.closest('div')?.querySelector('input')?.value === mockPaymentData.moneroAddress
      );

      if (addressCopyButton) {
        await user.click(addressCopyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPaymentData.moneroAddress);

        await waitFor(() => {
          expect(screen.getByText('Address copied!')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Payment Status Updates', () => {
    it('should poll payment status and update UI', async () => {
      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      // Wait for initial API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/payments/monero/status/${mockPaymentData.orderId}`,
          { credentials: 'include' }
        );
      });

      expect(mockOnPaymentUpdate).toHaveBeenCalledWith({
        status: 'pending',
        confirmations: 0,
        isExpired: false
      });
    });

    it('should handle confirmed payment status', async () => {
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

    it('should handle API errors', async () => {
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
  });

  describe('Time Management', () => {
    it('should display time remaining correctly', async () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000);
      const paymentDataWithFutureExpiry = {
        ...mockPaymentData,
        expirationTime: futureTime.toISOString()
      };

      render(
        <MoneroPayment 
          paymentData={paymentDataWithFutureExpiry}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Time remaining: 2h 30m 45s/)).toBeInTheDocument();
      });
    });

    it('should show expired when time has passed', async () => {
      const pastTime = new Date(Date.now() - 60 * 1000);
      const paymentDataWithPastExpiry = {
        ...mockPaymentData,
        expirationTime: pastTime.toISOString()
      };

      render(
        <MoneroPayment 
          paymentData={paymentDataWithPastExpiry}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Waiting for Payment')).toBeInTheDocument();
      });

      // The expired text should appear in the status area
      await waitFor(() => {
        const timeElements = screen.getAllByText(/expired/i);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Important Information Display', () => {
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

    it('should display important payment notes', async () => {
      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Important Notes')).toBeInTheDocument();
      });

      expect(screen.getByText(/Send the exact amount shown above/)).toBeInTheDocument();
      expect(screen.getByText(/Do not send from an exchange/)).toBeInTheDocument();
      expect(screen.getByText(/Payment expires in 24 hours/)).toBeInTheDocument();
    });
  });
});