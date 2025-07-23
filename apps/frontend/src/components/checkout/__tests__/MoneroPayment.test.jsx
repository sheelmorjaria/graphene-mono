import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MoneroPayment from '../MoneroPayment';
import { renderWithProviders } from '../../../test/react-test-utils';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn()
  }
}));

// Mock formatCurrency service
vi.mock('../../../services/paymentService', () => ({
  formatCurrency: vi.fn((amount) => `£${amount.toFixed(2)}`)
}));

// Mock clipboard API (only if not already mocked)
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn()
    },
    configurable: true
  });
}

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

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock successful QR code generation
    const QRCode = await import('qrcode');
    QRCode.default.toDataURL.mockResolvedValue('data:image/png;base64,mockedqrcode');
    
    // Mock successful clipboard API
    navigator.clipboard.writeText.mockResolvedValue();
    
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

    // Clear timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render loading state when no payment data', () => {
      renderWithProviders(<MoneroPayment />);
      
      expect(screen.getByText('Setting up Monero payment...')).toBeInTheDocument();
    });

    it('should render payment details when data is provided', async () => {
      renderWithProviders(
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
      renderWithProviders(
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

    it('should format XMR amounts correctly', async () => {
      const paymentDataWithTrailingZeros = {
        ...mockPaymentData,
        xmrAmount: 2.500000000000
      };

      render(
        <MoneroPayment 
          paymentData={paymentDataWithTrailingZeros}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
      });
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code with correct Monero URI', async () => {
      const QRCode = await import('qrcode');
      
      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(QRCode.default.toDataURL).toHaveBeenCalledWith(
          `monero:${mockPaymentData.moneroAddress}?tx_amount=1.234567890123`,
          expect.objectContaining({
            width: 192,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
        );
      });

      expect(screen.getByAltText('Monero Payment QR Code')).toBeInTheDocument();
    });

    it('should show loading spinner while QR code is generating', async () => {
      const QRCode = await import('qrcode');
      QRCode.default.toDataURL.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner in QR area
    });

    it('should handle QR code generation errors gracefully', async () => {
      const QRCode = await import('qrcode');
      QRCode.default.toDataURL.mockRejectedValue(new Error('QR generation failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error generating QR code:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Clipboard Functionality', () => {
    it('should copy address to clipboard when button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      const addressCopyButton = screen.getAllByRole('button')[0]; // First copy button
      await user.click(addressCopyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPaymentData.moneroAddress);

      await waitFor(() => {
        expect(screen.getByText('Address copied!')).toBeInTheDocument();
      });

      // Test auto-hide after 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Address copied!')).not.toBeInTheDocument();
      });
    });

    it('should copy amount to clipboard when button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      const amountCopyButton = screen.getAllByRole('button')[1]; // Second copy button
      await user.click(amountCopyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('1.234567890123');

      await waitFor(() => {
        expect(screen.getByText('Amount copied!')).toBeInTheDocument();
      });
    });

    it('should handle clipboard errors gracefully', async () => {
      const user = userEvent.setup();
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard access denied'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      const copyButton = screen.getAllByRole('button')[0];
      await user.click(copyButton);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Time Remaining Display', () => {
    it('should display time remaining correctly', async () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000); // 2h 30m 45s
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

    it('should update time remaining every second', async () => {
      const futureTime = new Date(Date.now() + 5 * 1000); // 5 seconds
      const paymentDataWithShortExpiry = {
        ...mockPaymentData,
        expirationTime: futureTime.toISOString()
      };

      render(
        <MoneroPayment 
          paymentData={paymentDataWithShortExpiry}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Time remaining: 0h 0m 5s/)).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Time remaining: 0h 0m 4s/)).toBeInTheDocument();
      });
    });

    it('should show "Expired" when time has passed', async () => {
      const pastTime = new Date(Date.now() - 60 * 1000); // 1 minute ago
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
        expect(screen.getByText(/Expired/)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Status Polling', () => {
    it('should poll payment status every 30 seconds', async () => {
      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      // Initial call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/payments/monero/status/${mockPaymentData.orderId}`,
          { credentials: 'include' }
        );
      });

      fetch.mockClear();

      // Advance time by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should update payment status when received', async () => {
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

    it('should stop polling when payment is confirmed', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            paymentStatus: 'confirmed',
            confirmations: 15,
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
        expect(fetch).toHaveBeenCalled();
      });

      fetch.mockClear();

      // Advance time - should not poll again
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle polling errors', async () => {
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

  describe('Payment Status Display', () => {
    it('should show confirmation progress', async () => {
      const partiallyConfirmedData = {
        ...mockPaymentData,
        confirmations: 5
      };

      // Mock status response
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            paymentStatus: 'partially_confirmed',
            confirmations: 5,
            isExpired: false
          }
        })
      });

      render(
        <MoneroPayment 
          paymentData={partiallyConfirmedData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Awaiting Confirmations (5/10)')).toBeInTheDocument();
      });
    });

    it('should show underpaid status', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            paymentStatus: 'underpaid',
            confirmations: 0,
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
        expect(screen.getByText('Payment Underpaid - Please send the full amount')).toBeInTheDocument();
      });
    });

    it('should show failed payment status', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            paymentStatus: 'failed',
            confirmations: 0,
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
        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
      });
    });
  });

  describe('Exchange Rate Display', () => {
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

    it('should display rate validity time', async () => {
      render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Rate Valid Until:/)).toBeInTheDocument();
      });
    });
  });

  describe('Important Notes Section', () => {
    it('should display all important payment notes', async () => {
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
      expect(screen.getByText(/Network fees are not included/)).toBeInTheDocument();
    });

    it('should show custom payment window hours', async () => {
      const customPaymentData = {
        ...mockPaymentData,
        paymentWindowHours: 12
      };

      render(
        <MoneroPayment 
          paymentData={customPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Payment expires in 12 hours/)).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup timers on unmount', () => {
      const { unmount } = render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      // Verify timers are set
      expect(setTimeout).toHaveBeenCalled();

      unmount();

      // Verify cleanup doesn't throw errors
      act(() => {
        jest.runOnlyPendingTimers();
      });
    });

    it('should handle prop changes correctly', async () => {
      const { rerender } = render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      const newPaymentData = {
        ...mockPaymentData,
        xmrAmount: 2.5
      };

      rerender(
        <MoneroPayment 
          paymentData={newPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
      });
    });
  });
});