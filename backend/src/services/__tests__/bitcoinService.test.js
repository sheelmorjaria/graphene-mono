import { jest } from '@jest/globals';

// Mock node-fetch before importing bitcoinService
const mockFetch = jest.fn();

// Mock the module first
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

// Import after mocking
const { default: bitcoinService } = await import('../bitcoinService.js');

describe('Bitcoin Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache
    bitcoinService.rateCache = {
      rate: null,
      timestamp: null
    };
    // Reset environment variables
    process.env.BLOCKONOMICS_API_KEY = undefined;
  });

  describe('getBtcExchangeRate', () => {
    it('should fetch exchange rate from CoinGecko', async () => {
      const mockResponse = {
        bitcoin: {
          gbp: 25000
        }
      };

      const mockJsonResponse = jest.fn().mockResolvedValue(mockResponse);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: mockJsonResponse
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result).toEqual({
        rate: 25000,
        timestamp: expect.any(Date),
        cached: false
      });

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
      expect(mockJsonResponse).toHaveBeenCalled();
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

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch fresh rate if cache is expired', async () => {
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

      const mockJsonResponse = jest.fn().mockResolvedValue(mockResponse);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: mockJsonResponse
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result.rate).toBe(27000);
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalled();
      expect(mockJsonResponse).toHaveBeenCalled();
    });

    it('should throw error if API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(bitcoinService.getBtcExchangeRate()).rejects.toThrow('Failed to fetch Bitcoin exchange rate');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('convertGbpToBtc', () => {
    beforeEach(() => {
      // Mock getBtcExchangeRate
      jest.spyOn(bitcoinService, 'getBtcExchangeRate').mockResolvedValue({
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
    beforeEach(() => {
      process.env.BLOCKONOMICS_API_KEY = 'test-api-key';
    });

    it('should generate Bitcoin address using Blockonomics API', async () => {
      const mockAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      
      const mockJsonResponse = jest.fn().mockResolvedValue({ address: mockAddress });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: mockJsonResponse
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
      expect(mockJsonResponse).toHaveBeenCalled();
    });

    it('should throw error if API key is not configured', async () => {
      delete process.env.BLOCKONOMICS_API_KEY;

      await expect(bitcoinService.generateBitcoinAddress()).rejects.toThrow('Blockonomics API key not configured');
    });

    it('should throw error if API request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(bitcoinService.generateBitcoinAddress()).rejects.toThrow('Failed to generate Bitcoin address');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('createBitcoinPayment', () => {
    beforeEach(() => {
      jest.spyOn(bitcoinService, 'generateBitcoinAddress').mockResolvedValue('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      jest.spyOn(bitcoinService, 'convertGbpToBtc').mockResolvedValue({
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