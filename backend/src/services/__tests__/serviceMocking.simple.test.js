import { vi } from 'vitest';

describe('External Service Mocking Examples', () => {
  describe('Simple Service Mocking Patterns', () => {
    it('should demonstrate basic function mocking', () => {
      // Create a mock function
      const mockApiCall = vi.fn();
      
      // Set up mock implementation
      mockApiCall.mockResolvedValue({
        success: true,
        data: { id: '123', status: 'completed' }
      });
      
      // Use the mock
      return mockApiCall({ orderId: 'order-123' }).then(result => {
        expect(result.success).toBe(true);
        expect(result.data.id).toBe('123');
        expect(mockApiCall).toHaveBeenCalledWith({ orderId: 'order-123' });
      });
    });

    it('should demonstrate error mocking', async () => {
      const mockServiceCall = vi.fn();
      
      // Mock a service failure
      mockServiceCall.mockRejectedValue(new Error('Service unavailable'));
      
      await expect(mockServiceCall()).rejects.toThrow('Service unavailable');
      expect(mockServiceCall).toHaveBeenCalled();
    });

    it('should demonstrate multiple return values', () => {
      const mockExchangeRate = vi.fn();
      
      // Mock different return values for subsequent calls
      mockExchangeRate
        .mockReturnValueOnce(45000)  // First call returns 45000
        .mockReturnValueOnce(45500)  // Second call returns 45500
        .mockReturnValue(46000);     // All subsequent calls return 46000
      
      expect(mockExchangeRate()).toBe(45000);
      expect(mockExchangeRate()).toBe(45500);
      expect(mockExchangeRate()).toBe(46000);
      expect(mockExchangeRate()).toBe(46000); // Still 46000
      
      expect(mockExchangeRate).toHaveBeenCalledTimes(4);
    });

    it('should demonstrate conditional mocking', () => {
      const mockPaymentProcessor = vi.fn();
      
      // Mock implementation that behaves differently based on input
      mockPaymentProcessor.mockImplementation((amount) => {
        if (amount > 1000) {
          return Promise.resolve({ status: 'requires_review' });
        } else {
          return Promise.resolve({ status: 'approved' });
        }
      });
      
      return Promise.all([
        mockPaymentProcessor(500).then(result => {
          expect(result.status).toBe('approved');
        }),
        mockPaymentProcessor(1500).then(result => {
          expect(result.status).toBe('requires_review');
        })
      ]);
    });

    it('should demonstrate spy functionality', () => {
      // Create an object with methods to spy on
      const paymentService = {
        calculateFee: (amount) => amount * 0.029,
        validateAmount: (amount) => amount > 0
      };
      
      // Spy on methods
      const calculateFeeSpy = vi.spyOn(paymentService, 'calculateFee');
      const validateAmountSpy = vi.spyOn(paymentService, 'validateAmount');
      
      // Use the methods normally
      const fee = paymentService.calculateFee(100);
      const isValid = paymentService.validateAmount(100);
      
      // Verify the spies captured the calls
      expect(calculateFeeSpy).toHaveBeenCalledWith(100);
      expect(validateAmountSpy).toHaveBeenCalledWith(100);
      expect(fee).toBeCloseTo(2.9);
      expect(isValid).toBe(true);
      
      // Clean up spies
      calculateFeeSpy.mockRestore();
      validateAmountSpy.mockRestore();
    });

    it('should demonstrate mock clearing and resetting', () => {
      const mockFunction = vi.fn();
      
      // Use the mock
      mockFunction('first call');
      mockFunction('second call');
      
      expect(mockFunction).toHaveBeenCalledTimes(2);
      
      // Clear the mock (removes call history but keeps implementation)
      mockFunction.mockClear();
      expect(mockFunction).toHaveBeenCalledTimes(0);
      
      // Use again
      mockFunction('after clear');
      expect(mockFunction).toHaveBeenCalledTimes(1);
      
      // Reset the mock (removes call history AND implementation)
      mockFunction.mockReset();
      expect(mockFunction).toHaveBeenCalledTimes(0);
      
      // After reset, mock returns undefined by default
      expect(mockFunction()).toBeUndefined();
    });
  });

  describe('Integration Test Mocking Patterns', () => {
    it('should demonstrate how to mock external services in integration tests', () => {
      // Pattern 1: Create service mock objects
      const mockEmailService = {
        sendOrderConfirmation: vi.fn().mockResolvedValue(true),
        sendPaymentNotification: vi.fn().mockResolvedValue(true),
        sendErrorAlert: vi.fn().mockRejectedValue(new Error('Email service down'))
      };
      
      const mockPaymentGateway = {
        processPayment: vi.fn().mockImplementation((amount) => {
          return Promise.resolve({
            id: `payment-${Date.now()}`,
            status: amount > 1000 ? 'requires_review' : 'approved',
            amount
          });
        }),
        refundPayment: vi.fn().mockResolvedValue({ refundId: 'refund-123' })
      };
      
      // Test using the mocks
      return Promise.all([
        mockEmailService.sendOrderConfirmation({ orderId: '123' }),
        mockPaymentGateway.processPayment(500),
        mockPaymentGateway.processPayment(1500)
      ]).then(([emailResult, payment1, payment2]) => {
        expect(emailResult).toBe(true);
        expect(payment1.status).toBe('approved');
        expect(payment2.status).toBe('requires_review');
        
        expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith({ orderId: '123' });
        expect(mockPaymentGateway.processPayment).toHaveBeenCalledTimes(2);
      });
    });

    it('should demonstrate async service mocking with delays', async () => {
      const mockSlowService = vi.fn();
      
      // Mock a service that takes time to respond
      mockSlowService.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ data: 'processed' }), 10);
        });
      });
      
      const start = Date.now();
      const result = await mockSlowService();
      const duration = Date.now() - start;
      
      expect(result.data).toBe('processed');
      expect(duration).toBeGreaterThanOrEqual(10);
      expect(mockSlowService).toHaveBeenCalled();
    });

    it('should demonstrate mocking with complex response data', () => {
      const mockCryptoService = vi.fn();
      
      // Mock complex response structure
      mockCryptoService.mockResolvedValue({
        currency: 'BTC',
        exchangeRate: 45000,
        address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        metadata: {
          network: 'mainnet',
          confirmations: 0,
          fees: {
            fast: 15,
            medium: 10,
            slow: 5
          }
        }
      });
      
      return mockCryptoService({ amount: 0.001 }).then(response => {
        expect(response.currency).toBe('BTC');
        expect(response.exchangeRate).toBe(45000);
        expect(response.address).toMatch(/^bc1/);
        expect(response.metadata.fees.fast).toBe(15);
        
        expect(mockCryptoService).toHaveBeenCalledWith({ amount: 0.001 });
      });
    });
  });

  describe('Testing Best Practices', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it('should demonstrate proper mock setup and teardown', () => {
      const mockService = vi.fn();
      
      // Setup specific behavior for this test
      mockService.mockResolvedValue({ success: true });
      
      return mockService().then(result => {
        expect(result.success).toBe(true);
        expect(mockService).toHaveBeenCalledTimes(1);
      });
    });

    it('should verify mocks are clean between tests', () => {
      const mockService = vi.fn();
      
      // This test should start with a clean mock
      expect(mockService).toHaveBeenCalledTimes(0);
      
      mockService('test call');
      expect(mockService).toHaveBeenCalledTimes(1);
    });
  });
});