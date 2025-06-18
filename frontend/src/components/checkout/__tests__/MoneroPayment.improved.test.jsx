import React from 'react';
import { screen, waitFor, userEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MoneroPayment from '../MoneroPayment';
import { testPatterns, actAsync, createComponentTestHelper } from '../../../test/react-test-utils.jsx';

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

describe('MoneroPayment Component - Improved', () => {
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
  });

  describe('Basic Rendering', () => {
    it('should render loading state when no payment data', async () => {
      const helper = createComponentTestHelper().setupTimers();
      
      const { getByText } = helper.render(<MoneroPayment />);
      
      expect(getByText('Setting up Monero payment...')).toBeInTheDocument();
      
      helper.cleanup();
    });

    it('should render payment details when data is provided', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: {
              paymentStatus: 'pending',
              confirmations: 0,
              isExpired: false
            }
          }
        })
        .mockClipboard();

      const { getByText } = helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      // Allow all async operations to complete
      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(getByText('Waiting for Payment')).toBeInTheDocument();
        }, { timeout: 2000 });
      });

      expect(getByText('Payment Instructions')).toBeInTheDocument();
      expect(getByText('Scan QR Code')).toBeInTheDocument();
      expect(getByText('Monero Address')).toBeInTheDocument();
      expect(getByText('Amount (XMR)')).toBeInTheDocument();
      
      helper.cleanup();
    });

    it('should display correct payment amounts', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: { paymentStatus: 'pending', confirmations: 0 }
          }
        });

      const { getByDisplayValue, getByText } = helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(getByDisplayValue('1.234567890123')).toBeInTheDocument();
        }, { timeout: 2000 });
      });

      expect(getByDisplayValue(mockPaymentData.moneroAddress)).toBeInTheDocument();
      expect(getByText('£199.99')).toBeInTheDocument();
      
      helper.cleanup();
    });
  });

  describe('Clipboard Functionality', () => {
    it('should copy address to clipboard when button is clicked', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockClipboard()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: { paymentStatus: 'pending', confirmations: 0 }
          }
        });

      const { getAllByRole, getByDisplayValue } = helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(getByDisplayValue(mockPaymentData.moneroAddress)).toBeInTheDocument();
        }, { timeout: 2000 });
      });

      const user = userEvent.setup();
      const copyButtons = getAllByRole('button');
      const addressCopyButton = copyButtons.find(btn => 
        btn.closest('div')?.querySelector('input')?.value === mockPaymentData.moneroAddress
      );

      if (addressCopyButton) {
        await actAsync(async () => {
          await user.click(addressCopyButton);
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPaymentData.moneroAddress);
      }
      
      helper.cleanup();
    });
  });

  describe('Payment Status Updates', () => {
    it('should poll payment status and update UI', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: {
              paymentStatus: 'pending',
              confirmations: 0,
              isExpired: false
            }
          }
        });

      helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith(
            `/api/payments/monero/status/${mockPaymentData.orderId}`,
            { credentials: 'include' }
          );
        }, { timeout: 2000 });
      });

      expect(mockOnPaymentUpdate).toHaveBeenCalledWith({
        status: 'pending',
        confirmations: 0,
        isExpired: false
      });
      
      helper.cleanup();
    });

    it('should handle confirmed payment status', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: {
              paymentStatus: 'confirmed',
              confirmations: 12,
              isExpired: false
            }
          }
        });

      const { getByText } = helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(mockOnPaymentUpdate).toHaveBeenCalledWith({
            status: 'confirmed',
            confirmations: 12,
            isExpired: false
          });
        }, { timeout: 2000 });
      });

      await actAsync(async () => {
        await waitFor(() => {
          expect(getByText('Payment Confirmed!')).toBeInTheDocument();
        }, { timeout: 2000 });
      });
      
      helper.cleanup();
    });

    it('should handle API errors', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            error: 'Network error'
          }
        });

      helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(mockOnError).toHaveBeenCalledWith('Network error');
        }, { timeout: 2000 });
      });
      
      helper.cleanup();
    });
  });

  describe('Time Management', () => {
    it('should display time remaining correctly', async () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000);
      const paymentDataWithFutureExpiry = {
        ...mockPaymentData,
        expirationTime: futureTime.toISOString()
      };

      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: { paymentStatus: 'pending', confirmations: 0 }
          }
        });

      const { getByText } = helper.render(
        <MoneroPayment 
          paymentData={paymentDataWithFutureExpiry}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(getByText(/Time remaining: 2h 30m 45s/)).toBeInTheDocument();
        }, { timeout: 2000 });
      });
      
      helper.cleanup();
    });

    it('should show expired when time has passed', async () => {
      const pastTime = new Date(Date.now() - 60 * 1000);
      const paymentDataWithPastExpiry = {
        ...mockPaymentData,
        expirationTime: pastTime.toISOString()
      };

      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: { paymentStatus: 'pending', confirmations: 0 }
          }
        });

      const { getAllByText } = helper.render(
        <MoneroPayment 
          paymentData={paymentDataWithPastExpiry}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          const timeElements = getAllByText(/expired/i);
          expect(timeElements.length).toBeGreaterThan(0);
        }, { timeout: 2000 });
      });
      
      helper.cleanup();
    });
  });

  describe('Important Information Display', () => {
    it('should display exchange rate information', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: { paymentStatus: 'pending', confirmations: 0 }
          }
        });

      const { getByText } = helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(getByText(/Exchange Rate:/)).toBeInTheDocument();
          expect(getByText(/1 GBP = 0.00617 XMR/)).toBeInTheDocument();
        }, { timeout: 2000 });
      });
      
      helper.cleanup();
    });

    it('should display important payment notes', async () => {
      const helper = createComponentTestHelper()
        .setupTimers()
        .mockFetch({
          [`/api/payments/monero/status/${mockPaymentData.orderId}`]: {
            success: true,
            data: { paymentStatus: 'pending', confirmations: 0 }
          }
        });

      const { getByText } = helper.render(
        <MoneroPayment 
          paymentData={mockPaymentData}
          onPaymentUpdate={mockOnPaymentUpdate}
          onError={mockOnError}
        />
      );

      await helper.waitForAsync(1000);

      await actAsync(async () => {
        await waitFor(() => {
          expect(getByText('Important Notes')).toBeInTheDocument();
        }, { timeout: 2000 });
      });

      expect(getByText(/Send the exact amount shown above/)).toBeInTheDocument();
      expect(getByText(/Do not send from an exchange/)).toBeInTheDocument();
      expect(getByText(/Payment expires in 24 hours/)).toBeInTheDocument();
      
      helper.cleanup();
    });
  });
});