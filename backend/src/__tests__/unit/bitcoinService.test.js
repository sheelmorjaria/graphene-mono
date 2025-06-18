import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BitcoinService from '../../services/bitcoinService.js';
import { setupMSW, mockApiResponse, mockApiError } from '../../test/msw-setup.js';

// Setup MSW for HTTP mocking
setupMSW();

describe('BitcoinService Unit Tests', () => {
  let bitcoinService;
  
  beforeEach(() => {
    bitcoinService = BitcoinService;
    vi.clearAllMocks();
    
    // Reset cache
    bitcoinService.rateCache = {
      rate: null,
      timestamp: null
    };
    
    // Set test environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-api-key';
    bitcoinService.blockonomicsApiKey = 'test-api-key';
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Exchange Rate Functionality', () => {
    it('should fetch fresh exchange rate from CoinGecko', async () => {
      // Override default MSW response with specific rate
      mockApiResponse('https://api.coingecko.com/api/v3/simple/price', {
        bitcoin: { gbp: 45000.50 }
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result).toEqual({
        rate: 45000.50,
        timestamp: expect.any(Date),
        cached: false
      });
    });

    it('should return cached rate when still valid', async () => {
      // Set up cache with fresh data
      const cachedRate = 45000.50;
      const cachedTimestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      bitcoinService.rateCache = {
        rate: cachedRate,
        timestamp: cachedTimestamp
      };

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result).toEqual({
        rate: cachedRate,
        timestamp: new Date(cachedTimestamp),
        cached: true
      });
    });

    it('should fetch fresh rate when cache is expired', async () => {
      // Set up expired cache
      const expiredTimestamp = Date.now() - (16 * 60 * 1000); // 16 minutes ago
      bitcoinService.rateCache = {
        rate: 40000,
        timestamp: expiredTimestamp
      };

      // Override default MSW response
      mockApiResponse('https://api.coingecko.com/api/v3/simple/price', {
        bitcoin: { gbp: 45000.50 }
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result.cached).toBe(false);
      expect(result.rate).toBe(45000.50);
    });

    it('should handle CoinGecko API errors', async () => {
      // Mock API error using MSW
      mockApiError('https://api.coingecko.com/api/v3/simple/price', {
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(bitcoinService.getBtcExchangeRate())
        .rejects.toThrow('Bitcoin exchange rate service temporarily unavailable');
    });
  });

  describe('Currency Conversion', () => {
    beforeEach(() => {
      // Mock the exchange rate method
      vi.spyOn(bitcoinService, 'getBtcExchangeRate').mockResolvedValue({
        rate: 45000,
        timestamp: new Date(),
        cached: false
      });
    });

    it('should convert GBP to BTC correctly', async () => {
      const gbpAmount = 450; // £450
      const result = await bitcoinService.convertGbpToBtc(gbpAmount);

      expect(result).toEqual({
        btcAmount: 0.01, // 450 / 45000 = 0.01 BTC
        exchangeRate: 45000,
        exchangeRateTimestamp: expect.any(Date)
      });
    });

    it('should round to 8 decimal places', async () => {
      bitcoinService.getBtcExchangeRate.mockResolvedValue({
        rate: 33333.33333333,
        timestamp: new Date(),
        cached: false
      });

      const result = await bitcoinService.convertGbpToBtc(100);
      
      // Result should be rounded to 8 decimal places
      expect(result.btcAmount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(8);
    });

    it('should handle conversion errors', async () => {
      bitcoinService.getBtcExchangeRate.mockRejectedValue(new Error('Rate fetch failed'));

      await expect(bitcoinService.convertGbpToBtc(100))
        .rejects.toThrow('Rate fetch failed');
    });
  });

  describe('Bitcoin Address Generation', () => {
    it('should generate a new Bitcoin address via Blockonomics', async () => {
      // MSW will automatically handle this with default handlers
      const result = await bitcoinService.generateBitcoinAddress();

      expect(result).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    });

    it('should handle API key validation', async () => {
      const originalApiKey = bitcoinService.blockonomicsApiKey;
      bitcoinService.blockonomicsApiKey = undefined;

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Failed to generate Bitcoin address');
        
      // Restore API key
      bitcoinService.blockonomicsApiKey = originalApiKey;
    });

    it('should handle API errors', async () => {
      mockApiError('https://www.blockonomics.co/api/new_address', {
        method: 'post',
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Failed to generate Bitcoin address');
    });
  });

  describe('Utility Functions', () => {
    it('should format Bitcoin amounts correctly', () => {
      expect(bitcoinService.formatBitcoinAmount(0.123456789)).toBe(0.12345679);
      expect(bitcoinService.formatBitcoinAmount(1.0)).toBe(1.0);
      expect(bitcoinService.formatBitcoinAmount(0.00000001)).toBe(0.00000001);
    });

    it('should convert between satoshis and BTC', () => {
      expect(bitcoinService.satoshisToBtc(100000000)).toBe(1.0);
      expect(bitcoinService.satoshisToBtc(1)).toBe(0.00000001);
      
      expect(bitcoinService.btcToSatoshis(1.0)).toBe(100000000);
      expect(bitcoinService.btcToSatoshis(0.00000001)).toBe(1);
    });

    it('should validate payment confirmations correctly', () => {
      expect(bitcoinService.isPaymentConfirmed(0)).toBe(false);
      expect(bitcoinService.isPaymentConfirmed(1)).toBe(false);
      expect(bitcoinService.isPaymentConfirmed(2)).toBe(true);
      expect(bitcoinService.isPaymentConfirmed(5)).toBe(true);
    });

    it('should check payment expiry correctly', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago

      expect(bitcoinService.isPaymentExpired(futureDate)).toBe(false);
      expect(bitcoinService.isPaymentExpired(pastDate)).toBe(true);
    });

    it('should validate payment amounts with tolerance', () => {
      const expectedAmount = 0.01;
      
      // Exact amount
      expect(bitcoinService.isPaymentSufficient(0.01, expectedAmount)).toBe(true);
      
      // Slightly over
      expect(bitcoinService.isPaymentSufficient(0.0101, expectedAmount)).toBe(true);
      
      // Within tolerance (1% = 0.0001)
      expect(bitcoinService.isPaymentSufficient(0.0099, expectedAmount)).toBe(true);
      
      // Below tolerance
      expect(bitcoinService.isPaymentSufficient(0.0098, expectedAmount)).toBe(false);
    });
  });

  describe('Payment Creation', () => {
    beforeEach(() => {
      vi.spyOn(bitcoinService, 'generateBitcoinAddress')
        .mockResolvedValue('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      vi.spyOn(bitcoinService, 'convertGbpToBtc').mockResolvedValue({
        btcAmount: 0.01,
        exchangeRate: 25000,
        exchangeRateTimestamp: new Date()
      });
    });

    it('should create complete Bitcoin payment data', async () => {
      const result = await bitcoinService.createBitcoinPayment(250);

      expect(result).toEqual({
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.01,
        bitcoinExchangeRate: 25000,
        bitcoinExchangeRateTimestamp: expect.any(Date),
        bitcoinPaymentExpiry: expect.any(Date)
      });

      // Check that expiry is about 24 hours from now
      const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const actualExpiry = new Date(result.bitcoinPaymentExpiry);
      const timeDiff = Math.abs(expectedExpiry - actualExpiry);
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should handle address generation failures', async () => {
      vi.spyOn(bitcoinService, 'generateBitcoinAddress')
        .mockRejectedValue(new Error('Address generation failed'));

      await expect(bitcoinService.createBitcoinPayment(250))
        .rejects.toThrow('Address generation failed');
    });

    it('should handle exchange rate failures', async () => {
      vi.spyOn(bitcoinService, 'convertGbpToBtc')
        .mockRejectedValue(new Error('Exchange rate failed'));

      await expect(bitcoinService.createBitcoinPayment(250))
        .rejects.toThrow('Exchange rate failed');
    });
  });

  describe('Transaction Information', () => {
    it('should get Bitcoin address info', async () => {
      // MSW will automatically handle this with default handlers
      const result = await bitcoinService.getBitcoinAddressInfo('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      expect(result).toEqual({
        balance: 1000000,
        unconfirmedBalance: 500000,
        txCount: 5
      });
    });

    it('should get transaction details', async () => {
      // MSW will automatically handle this with default handlers
      const result = await bitcoinService.getTransactionDetails('test-tx-hash');

      expect(result).toEqual({
        confirmations: 6,
        blockHeight: 700000,
        timestamp: 1640995200,
        fee: 1000,
        size: 250,
        outputs: []
      });
    });

    it('should handle address info API errors', async () => {
      mockApiError('https://www.blockonomics.co/api/balance', {
        method: 'post',
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(bitcoinService.getBitcoinAddressInfo('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'))
        .rejects.toThrow('Failed to fetch Bitcoin address information');
    });

    it('should handle transaction details API errors', async () => {
      mockApiError('https://www.blockonomics.co/api/tx_detail/test-tx-hash', {
        status: 404,
        statusText: 'Not Found'
      });

      await expect(bitcoinService.getTransactionDetails('test-tx-hash'))
        .rejects.toThrow('Failed to fetch transaction details');
    });
  });
});