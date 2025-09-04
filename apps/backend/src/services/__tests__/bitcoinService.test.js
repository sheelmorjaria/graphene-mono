import { vi } from 'vitest';
import bitcoinService from '../bitcoinService.js';

// Mock node-fetch
vi.mock('node-fetch');

// Import fetch after mocking
const fetch = (await import('node-fetch')).default;

describe('Bitcoin Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear cache
    bitcoinService.rateCache = {
      rate: null,
      timestamp: null
    };
    
    // Reset API call throttling
    bitcoinService.lastApiCallTime = 0;
    
    // Set test environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-api-key';
    bitcoinService.blockonomicsApiKey = 'test-api-key';
    
    // Setup fetch mocks
    fetch.mockClear();
  });

  describe('getBtcExchangeRate', () => {
    it('should fetch exchange rate from CoinGecko', async () => {
      // Mock fetch response for CoinGecko API
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          bitcoin: { gbp: 25000 }
        }),
        ok: true
      };
      fetch.mockResolvedValueOnce(mockResponse);
      
      const result = await bitcoinService.getBtcExchangeRate();

      expect(result).toEqual({
        rate: 25000,
        timestamp: expect.any(Date),
        cached: false
      });
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=gbp',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GrapheneOS-Store/1.0'
          },
          timeout: 10000
        }
      );
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
      // Set up cache with old timestamp (expired)
      bitcoinService.rateCache = {
        rate: 26000,
        timestamp: Date.now() - 70 * 60 * 1000 // 70 minutes ago (expired, cache valid for 60 minutes)
      };
      
      // Reset API call throttling
      bitcoinService.lastApiCallTime = 0;

      // Mock fetch response with a different rate
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          bitcoin: { gbp: 27000 }
        }),
        ok: true
      };
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result.rate).toBe(27000);
      expect(result.cached).toBe(false);
    });

    it('should return fallback rate if API request fails', async () => {
      // Mock fetch rejection
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await bitcoinService.getBtcExchangeRate();

      expect(result).toEqual({
        rate: 87000, // fallback rate
        timestamp: expect.any(Date),
        cached: false,
        fallback: true,
        error: 'Network error'
      });
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
      // Mock fetch response for Blockonomics API
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        }),
        ok: true
      };
      fetch.mockResolvedValueOnce(mockResponse);
      
      const result = await bitcoinService.generateBitcoinAddress();

      expect(result).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      expect(fetch).toHaveBeenCalledWith(
        'https://www.blockonomics.co/api/new_address',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should return mock address if API key is not configured', async () => {
      const originalApiKey = bitcoinService.blockonomicsApiKey;
      bitcoinService.blockonomicsApiKey = undefined;

      const result = await bitcoinService.generateBitcoinAddress();
      
      // Should return one of the mock addresses
      const mockAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
      ];
      
      expect(mockAddresses).toContain(result);
      
      // Restore API key for other tests
      bitcoinService.blockonomicsApiKey = originalApiKey;
    });

    it('should throw error if API request fails', async () => {
      // Mock fetch failure
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(bitcoinService.generateBitcoinAddress()).rejects.toThrow('Failed to generate Bitcoin address');
    });

    it('should throw error if response is invalid and API key is configured', async () => {
      // Ensure API key is configured for this test
      bitcoinService.blockonomicsApiKey = 'test-api-key';
      
      // Mock invalid response (missing address field)
      const mockResponse = {
        json: vi.fn().mockResolvedValue({}), // Missing address field
        ok: true
      };
      fetch.mockResolvedValueOnce(mockResponse);

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
      // Mock fetch response for Blockonomics balance API
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          response: [{
            confirmed: 1000000,
            unconfirmed: 500000,
            tx_count: 5
          }]
        }),
        ok: true
      };
      fetch.mockResolvedValueOnce(mockResponse);
      
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
      // Mock fetch rejection
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(bitcoinService.getBitcoinAddressInfo('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'))
        .rejects.toThrow('Failed to fetch Bitcoin address information');
    });
  });

  describe('getTransactionDetails', () => {
    it('should get transaction details', async () => {
      // Mock fetch response for Blockonomics transaction API
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          confirmations: 6,
          block_height: 700000,
          time: 1640995200,
          fee: 1000,
          size: 250,
          out: []
        }),
        ok: true
      };
      fetch.mockResolvedValueOnce(mockResponse);
      
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
      // Mock fetch rejection
      fetch.mockRejectedValueOnce(new Error('Network error'));

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