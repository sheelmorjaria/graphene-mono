import { jest } from '@jest/globals';

// Mock node-fetch at the module level
const mockFetch = jest.fn();

jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

describe('Bitcoin Service Unit Tests', () => {
  let bitcoinService;

  beforeAll(async () => {
    // Mock environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-api-key';
    
    // Import the service after setting up mocks
    const module = await import('../bitcoinService.js');
    bitcoinService = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    bitcoinService.rateCache = {
      rate: null,
      timestamp: null
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Utility Methods', () => {
    test('should format Bitcoin amounts correctly', () => {
      expect(bitcoinService.formatBitcoinAmount(0.123456789)).toBe(0.12345679);
      expect(bitcoinService.formatBitcoinAmount(1.0)).toBe(1.0);
      expect(bitcoinService.formatBitcoinAmount(0.00000001)).toBe(0.00000001);
    });

    test('should convert between satoshis and BTC', () => {
      expect(bitcoinService.satoshisToBtc(100000000)).toBe(1.0);
      expect(bitcoinService.satoshisToBtc(1)).toBe(0.00000001);
      
      expect(bitcoinService.btcToSatoshis(1.0)).toBe(100000000);
      expect(bitcoinService.btcToSatoshis(0.00000001)).toBe(1);
    });

    test('should correctly validate payment confirmations', () => {
      expect(bitcoinService.isPaymentConfirmed(0)).toBe(false);
      expect(bitcoinService.isPaymentConfirmed(1)).toBe(false);
      expect(bitcoinService.isPaymentConfirmed(2)).toBe(true);
      expect(bitcoinService.isPaymentConfirmed(5)).toBe(true);
    });

    test('should correctly check payment expiry', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago

      expect(bitcoinService.isPaymentExpired(futureDate)).toBe(false);
      expect(bitcoinService.isPaymentExpired(pastDate)).toBe(true);
    });

    test('should correctly validate payment amount with tolerance', () => {
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

  describe('Exchange Rate Caching', () => {
    test('should return cached rate if still valid', async () => {
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

      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should fetch fresh rate when cache is expired', async () => {
      // Set up cache with old timestamp
      bitcoinService.rateCache = {
        rate: 26000,
        timestamp: Date.now() - 20 * 60 * 1000 // 20 minutes ago (expired)
      };

      const mockResponse = {
        bitcoin: {
          gbp: 27000
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result.rate).toBe(27000);
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalled();
    });

    test('should fetch exchange rate from CoinGecko API with correct parameters', async () => {
      const mockResponse = {
        bitcoin: {
          gbp: 25000
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      await bitcoinService.getBtcExchangeRate();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=gbp',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'User-Agent': 'GrapheneOS-Store/1.0'
          }),
          timeout: 10000
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(bitcoinService.getBtcExchangeRate())
        .rejects.toThrow('Failed to fetch Bitcoin exchange rate');
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Currency Conversion', () => {
    beforeEach(() => {
      // Mock getBtcExchangeRate
      jest.spyOn(bitcoinService, 'getBtcExchangeRate').mockResolvedValue({
        rate: 25000,
        timestamp: new Date(),
        cached: false
      });
    });

    test('should convert GBP to BTC correctly', async () => {
      const result = await bitcoinService.convertGbpToBtc(250);

      expect(result).toEqual({
        btcAmount: 0.01,
        exchangeRate: 25000,
        exchangeRateTimestamp: expect.any(Date)
      });
    });

    test('should round to 8 decimal places', async () => {
      const result = await bitcoinService.convertGbpToBtc(333.33);

      expect(result.btcAmount).toBe(0.01333320);
      expect(result.btcAmount.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(8);
    });

    test('should handle conversion errors', async () => {
      jest.spyOn(bitcoinService, 'getBtcExchangeRate').mockRejectedValue(new Error('API Error'));

      await expect(bitcoinService.convertGbpToBtc(250))
        .rejects.toThrow('API Error');
    });
  });

  describe('Bitcoin Address Generation', () => {
    test('should generate Bitcoin address using Blockonomics API', async () => {
      const mockAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ address: mockAddress })
      });

      const result = await bitcoinService.generateBitcoinAddress();

      expect(result).toBe(mockAddress);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.blockonomics.co/api/new_address',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          timeout: 10000
        })
      );
    });

    test('should throw error if API key is not configured', async () => {
      // Create a new service instance without API key
      const originalKey = bitcoinService.blockonomicsApiKey;
      bitcoinService.blockonomicsApiKey = undefined;

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Failed to generate Bitcoin address');

      // Restore the key
      bitcoinService.blockonomicsApiKey = originalKey;
    });

    test('should throw error if API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Failed to generate Bitcoin address');
    });

    test('should throw error if response is invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({}) // Missing address
      });

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Failed to generate Bitcoin address');
    });
  });

  describe('Bitcoin Payment Creation', () => {
    beforeEach(() => {
      jest.spyOn(bitcoinService, 'generateBitcoinAddress')
        .mockResolvedValue('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      jest.spyOn(bitcoinService, 'convertGbpToBtc').mockResolvedValue({
        btcAmount: 0.01,
        exchangeRate: 25000,
        exchangeRateTimestamp: new Date()
      });
    });

    test('should create complete Bitcoin payment data', async () => {
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

    test('should handle address generation failures', async () => {
      jest.spyOn(bitcoinService, 'generateBitcoinAddress')
        .mockRejectedValue(new Error('Address generation failed'));

      await expect(bitcoinService.createBitcoinPayment(250))
        .rejects.toThrow('Address generation failed');
    });

    test('should handle exchange rate failures', async () => {
      jest.spyOn(bitcoinService, 'convertGbpToBtc')
        .mockRejectedValue(new Error('Exchange rate failed'));

      await expect(bitcoinService.createBitcoinPayment(250))
        .rejects.toThrow('Exchange rate failed');
    });
  });

  describe('Transaction Information', () => {
    beforeEach(() => {
      // Ensure API key is available for these tests
      bitcoinService.blockonomicsApiKey = 'test-api-key';
    });

    test('should get Bitcoin address info', async () => {
      const mockResponse = {
        response: [{
          confirmed: 1000000,
          unconfirmed: 500000,
          tx_count: 5
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await bitcoinService.getBitcoinAddressInfo('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      expect(result).toEqual({
        balance: 1000000,
        unconfirmedBalance: 500000,
        txCount: 5
      });
    });

    test('should get transaction details', async () => {
      const mockResponse = {
        confirmations: 6,
        block_height: 700000,
        time: 1640995200,
        fee: 1000,
        size: 250,
        out: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

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
  });
});