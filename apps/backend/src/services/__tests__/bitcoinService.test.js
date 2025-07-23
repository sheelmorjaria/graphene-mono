import { vi } from 'vitest';
import bitcoinService from '../bitcoinService.js';
import { setupMSW, mockApiResponse, mockApiError } from '../../test/msw-setup.js';

// Setup MSW for HTTP mocking
setupMSW();

describe('Bitcoin Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache
    bitcoinService.rateCache = {
      rate: null,
      timestamp: null
    };
    // Set test environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-api-key';
    bitcoinService.blockonomicsApiKey = 'test-api-key';
  });

  describe('getBtcExchangeRate', () => {
    it('should fetch exchange rate from CoinGecko', async () => {
      // MSW will automatically mock the CoinGecko API with default handlers
      
      const result = await bitcoinService.getBtcExchangeRate();

      expect(result).toEqual({
        rate: 25000,
        timestamp: expect.any(Date),
        cached: false
      });
    });

    it('should return cached rate if still valid', async () => {
      // Set up cache with recent timestamp
      const cachedRate = 26000;
      const cacheTimestamp = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      
      bitcoinService.rateCache = {
        rate: cachedRate,
        timestamp: cacheTimestamp
      };

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result).toEqual({
        rate: cachedRate,
        timestamp: new Date(cacheTimestamp),
        cached: true
      });
    });

    it('should fetch fresh rate if cache is expired', async () => {
      // Set up cache with old timestamp
      bitcoinService.rateCache = {
        rate: 26000,
        timestamp: Date.now() - 20 * 60 * 1000 // 20 minutes ago (expired)
      };

      // Override default response with a different rate
      mockApiResponse('https://api.coingecko.com/api/v3/simple/price', {
        bitcoin: { gbp: 27000 }
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result.rate).toBe(27000);
      expect(result.cached).toBe(false);
    });

    it('should throw error if API request fails', async () => {
      // Mock API error
      mockApiError('https://api.coingecko.com/api/v3/simple/price', {
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(bitcoinService.getBtcExchangeRate()).rejects.toThrow('Bitcoin exchange rate service temporarily unavailable');
    });
  });

  describe('convertGbpToBtc', () => {
    beforeEach(() => {
      // Mock getBtcExchangeRate
      vi.spyOn(bitcoinService, 'getBtcExchangeRate').mockResolvedValue({
        rate: 25000,
        timestamp: new Date(),
        cached: false
      });
    });

    it('should convert GBP to BTC correctly', async () => {
      const result = await bitcoinService.convertGbpToBtc(250);

      expect(result).toEqual({
        btcAmount: 0.01,
        exchangeRate: 25000,
        exchangeRateTimestamp: expect.any(Date)
      });
    });

    it('should round to 8 decimal places', async () => {
      const result = await bitcoinService.convertGbpToBtc(333.33);

      expect(result.btcAmount).toBe(0.01333320);
      expect(result.btcAmount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(8);
    });
  });

  describe('generateBitcoinAddress', () => {
    it('should generate Bitcoin address using Blockonomics API', async () => {
      // MSW will automatically handle the Blockonomics API mock
      
      const result = await bitcoinService.generateBitcoinAddress();

      expect(result).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    });

    it('should throw error if API key is not configured', async () => {
      const originalApiKey = bitcoinService.blockonomicsApiKey;
      bitcoinService.blockonomicsApiKey = undefined;

      await expect(bitcoinService.generateBitcoinAddress()).rejects.toThrow('Failed to generate Bitcoin address');
      
      // Restore API key for other tests
      bitcoinService.blockonomicsApiKey = originalApiKey;
    });

    it('should throw error if API request fails', async () => {
      // Mock API error
      mockApiError('https://www.blockonomics.co/api/new_address', {
        method: 'post',
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(bitcoinService.generateBitcoinAddress()).rejects.toThrow('Failed to generate Bitcoin address');
    });

    it('should throw error if response is invalid', async () => {
      // Mock invalid response (missing address field)
      mockApiResponse('https://www.blockonomics.co/api/new_address', {}, {
        method: 'post'
      });

      await expect(bitcoinService.generateBitcoinAddress()).rejects.toThrow('Failed to generate Bitcoin address');
    });
  });

  describe('createBitcoinPayment', () => {
    beforeEach(() => {
      vi.spyOn(bitcoinService, 'generateBitcoinAddress').mockResolvedValue('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
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

  describe('getBitcoinAddressInfo', () => {
    it('should get Bitcoin address info', async () => {
      // MSW will automatically handle this request with default handlers
      
      const result = await bitcoinService.getBitcoinAddressInfo('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      expect(result).toEqual({
        balance: 1000000,
        unconfirmedBalance: 500000,
        txCount: 5
      });
    });

    it('should throw error if API key is not configured', async () => {
      const originalApiKey = bitcoinService.blockonomicsApiKey;
      bitcoinService.blockonomicsApiKey = undefined;

      await expect(bitcoinService.getBitcoinAddressInfo('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'))
        .rejects.toThrow('Failed to fetch Bitcoin address information');
        
      // Restore API key for other tests
      bitcoinService.blockonomicsApiKey = originalApiKey;
    });

    it('should throw error if API request fails', async () => {
      // Mock API error
      mockApiError('https://www.blockonomics.co/api/balance', {
        method: 'post',
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(bitcoinService.getBitcoinAddressInfo('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'))
        .rejects.toThrow('Failed to fetch Bitcoin address information');
    });
  });

  describe('getTransactionDetails', () => {
    it('should get transaction details', async () => {
      // MSW will automatically handle this request with default handlers
      
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

    it('should throw error if API key is not configured', async () => {
      const originalApiKey = bitcoinService.blockonomicsApiKey;
      bitcoinService.blockonomicsApiKey = undefined;

      await expect(bitcoinService.getTransactionDetails('test-tx-hash'))
        .rejects.toThrow('Failed to fetch transaction details');
        
      // Restore API key for other tests
      bitcoinService.blockonomicsApiKey = originalApiKey;
    });

    it('should throw error if API request fails', async () => {
      // Mock API error
      mockApiError('https://www.blockonomics.co/api/tx_detail/test-tx-hash', {
        status: 404,
        statusText: 'Not Found'
      });

      await expect(bitcoinService.getTransactionDetails('test-tx-hash'))
        .rejects.toThrow('Failed to fetch transaction details');
    });
  });

  describe('payment validation methods', () => {
    it('should correctly validate payment confirmations', () => {
      expect(bitcoinService.isPaymentConfirmed(0)).toBe(false);
      expect(bitcoinService.isPaymentConfirmed(1)).toBe(false);
      expect(bitcoinService.isPaymentConfirmed(2)).toBe(true);
      expect(bitcoinService.isPaymentConfirmed(5)).toBe(true);
    });

    it('should correctly check payment expiry', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago

      expect(bitcoinService.isPaymentExpired(futureDate)).toBe(false);
      expect(bitcoinService.isPaymentExpired(pastDate)).toBe(true);
    });

    it('should correctly validate payment amount with tolerance', () => {
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

  describe('utility methods', () => {
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
  });
});