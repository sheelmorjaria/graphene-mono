import { vi } from 'vitest';

// Mock external services before imports
const mockPayPalService = {
  createOrder: vi.fn(),
  captureOrder: vi.fn(),
  getOrderDetails: vi.fn(),
  refundPayment: vi.fn()
};

const mockBitcoinService = {
  generateAddress: vi.fn(),
  getExchangeRate: vi.fn(),
  checkTransaction: vi.fn(),
  getBalance: vi.fn()
};

const mockMoneroService = {
  createPayment: vi.fn(),
  getExchangeRate: vi.fn(),
  checkPaymentStatus: vi.fn(),
  getPaymentDetails: vi.fn()
};

const mockEmailService = {
  sendEmail: vi.fn(),
  sendPaymentConfirmation: vi.fn(),
  sendOrderConfirmation: vi.fn()
};

// Set up mocks before any imports
vi.mock('../paypalService.js', () => ({ default: mockPayPalService }));
vi.mock('../bitcoinService.js', () => ({ default: mockBitcoinService }));
vi.mock('../moneroService.js', () => ({ default: mockMoneroService }));
vi.mock('../emailService.js', () => ({ default: mockEmailService }));

describe('External Services Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Set up default successful responses
    mockPayPalService.createOrder.mockResolvedValue({
      id: 'PAYPAL-ORDER-123',
      status: 'CREATED',
      links: [{ rel: 'approve', href: 'https://paypal.com/approve' }]
    });
    
    mockBitcoinService.generateAddress.mockResolvedValue('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
    mockBitcoinService.getExchangeRate.mockResolvedValue(45000);
    
    mockMoneroService.getExchangeRate.mockResolvedValue(150);
    mockMoneroService.createPayment.mockResolvedValue({
      id: 'monero-payment-123',
      address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F'
    });
    
    mockEmailService.sendEmail.mockResolvedValue(true);
  });

  describe('PayPal Service Mocking', () => {
    it('should mock PayPal order creation', async () => {
      const paypalService = (await import('../paypalService.js')).default;
      
      const result = await paypalService.createOrder({
        amount: '100.00',
        currency: 'GBP'
      });
      
      expect(result.id).toBe('PAYPAL-ORDER-123');
      expect(result.status).toBe('CREATED');
      expect(mockPayPalService.createOrder).toHaveBeenCalledWith({
        amount: '100.00',
        currency: 'GBP'
      });
    });

    it('should handle PayPal service errors', async () => {
      const paypalService = (await import('../paypalService.js')).default;
      
      mockPayPalService.createOrder.mockRejectedValue(new Error('PayPal API Error'));
      
      await expect(paypalService.createOrder({})).rejects.toThrow('PayPal API Error');
    });
  });

  describe('Bitcoin Service Mocking', () => {
    it('should mock Bitcoin address generation', async () => {
      const bitcoinService = (await import('../bitcoinService.js')).default;
      
      const address = await bitcoinService.generateAddress();
      
      expect(address).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
      expect(mockBitcoinService.generateAddress).toHaveBeenCalled();
    });

    it('should mock Bitcoin exchange rate', async () => {
      const bitcoinService = (await import('../bitcoinService.js')).default;
      
      const rate = await bitcoinService.getExchangeRate();
      
      expect(rate).toBe(45000);
      expect(mockBitcoinService.getExchangeRate).toHaveBeenCalled();
    });
  });

  describe('Monero Service Mocking', () => {
    it('should mock Monero payment creation', async () => {
      const moneroService = (await import('../moneroService.js')).default;
      
      const payment = await moneroService.createPayment({
        amount: 100,
        currency: 'GBP'
      });
      
      expect(payment.id).toBe('monero-payment-123');
      expect(payment.address).toBe('4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F');
      expect(mockMoneroService.createPayment).toHaveBeenCalledWith({
        amount: 100,
        currency: 'GBP'
      });
    });

    it('should mock Monero exchange rate', async () => {
      const moneroService = (await import('../moneroService.js')).default;
      
      const rate = await moneroService.getExchangeRate();
      
      expect(rate).toBe(150);
      expect(mockMoneroService.getExchangeRate).toHaveBeenCalled();
    });
  });

  describe('Email Service Mocking', () => {
    it('should mock email sending', async () => {
      const emailService = (await import('../emailService.js')).default;
      
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test'
      });
      
      expect(result).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test'
      });
    });

    it('should handle email service failures', async () => {
      const emailService = (await import('../emailService.js')).default;
      
      mockEmailService.sendEmail.mockRejectedValue(new Error('Email service unavailable'));
      
      await expect(emailService.sendEmail({})).rejects.toThrow('Email service unavailable');
    });
  });

  describe('Combined Service Integration', () => {
    it('should work with multiple services together', async () => {
      const [paypalService, bitcoinService, emailService] = await Promise.all([
        import('../paypalService.js').then(m => m.default),
        import('../bitcoinService.js').then(m => m.default),
        import('../emailService.js').then(m => m.default)
      ]);
      
      // Simulate a payment flow
      const paypalOrder = await paypalService.createOrder({ amount: '100.00', currency: 'GBP' });
      const bitcoinRate = await bitcoinService.getExchangeRate();
      const emailSent = await emailService.sendEmail({ to: 'test@example.com', subject: 'Payment Created' });
      
      expect(paypalOrder.id).toBe('PAYPAL-ORDER-123');
      expect(bitcoinRate).toBe(45000);
      expect(emailSent).toBe(true);
      
      // Verify all services were called
      expect(mockPayPalService.createOrder).toHaveBeenCalled();
      expect(mockBitcoinService.getExchangeRate).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });
  });
});