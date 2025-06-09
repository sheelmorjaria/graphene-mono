import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import BitcoinService from '../../services/bitcoinService.js';

// Mock fetch for testing
global.fetch = jest.fn();

describe('BitcoinService', () => {
  let bitcoinService;
  
  beforeEach(() => {
    bitcoinService = BitcoinService;
    jest.clearAllMocks();
    
    // Reset cache
    bitcoinService.rateCache = {
      rate: null,
      timestamp: null
    };
    
    // Set test environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.BLOCKONOMICS_API_KEY;
  });

  describe('getBtcExchangeRate', () => {
    it('should fetch fresh exchange rate from CoinGecko', async () => {
      const mockResponse = {
        bitcoin: {
          gbp: 45000.50
        }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(fetch).toHaveBeenCalledWith(
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

      expect(result).toEqual({
        rate: 45000.50,
        timestamp: expect.any(Date),
        cached: false
      });
    });

    it('should return cached rate when still valid', async () => {
      // Set up cache with fresh data
      const cachedRate = 45000.50;
      const cachedTimestamp = Date.now();
      bitcoinService.rateCache = {
        rate: cachedRate,
        timestamp: cachedTimestamp
      };

      const result = await bitcoinService.getBtcExchangeRate();

      expect(fetch).not.toHaveBeenCalled();
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

      const mockResponse = {
        bitcoin: {
          gbp: 45000.50
        }
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await bitcoinService.getBtcExchangeRate();

      expect(fetch).toHaveBeenCalled();
      expect(result.cached).toBe(false);
      expect(result.rate).toBe(45000.50);
    });

    it('should handle CoinGecko API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(bitcoinService.getBtcExchangeRate())
        .rejects.toThrow('Failed to fetch Bitcoin exchange rate');
    });

    it('should handle invalid response format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ invalid: 'response' })
      });

      await expect(bitcoinService.getBtcExchangeRate())
        .rejects.toThrow('Failed to fetch Bitcoin exchange rate');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(bitcoinService.getBtcExchangeRate())
        .rejects.toThrow('Failed to fetch Bitcoin exchange rate');
    });
  });

  describe('convertGbpToBtc', () => {
    beforeEach(() => {
      // Mock the exchange rate method
      bitcoinService.getBtcExchangeRate = jest.fn().mockResolvedValue({
        rate: 45000,
        timestamp: new Date()
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
        timestamp: new Date()
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

  describe('generateBitcoinAddress', () => {
    it('should generate a new Bitcoin address via Blockonomics', async () => {
      const mockAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ address: mockAddress })
      });

      const result = await bitcoinService.generateBitcoinAddress();

      expect(fetch).toHaveBeenCalledWith(
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

      expect(result).toBe(mockAddress);
    });

    it('should handle missing API key', async () => {
      delete process.env.BLOCKONOMICS_API_KEY;
      bitcoinService.blockonomicsApiKey = undefined;

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Blockonomics API key not configured');
    });

    it('should handle Blockonomics API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Failed to generate Bitcoin address');
    });

    it('should handle invalid response format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ error: 'Invalid request' })
      });

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Failed to generate Bitcoin address');
    });
  });

  describe('getBitcoinAddressInfo', () => {
    const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

    it('should fetch Bitcoin address information', async () => {
      const mockResponse = {
        response: [{
          confirmed: 100000000, // 1 BTC in satoshis
          unconfirmed: 50000000, // 0.5 BTC in satoshis
          tx_count: 5
        }]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await bitcoinService.getBitcoinAddressInfo(testAddress);

      expect(fetch).toHaveBeenCalledWith(
        'https://www.blockonomics.co/api/balance',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ addr: testAddress }),
          timeout: 10000
        })
      );

      expect(result).toEqual({
        balance: 100000000,
        unconfirmedBalance: 50000000,
        txCount: 5
      });
    });

    it('should handle empty address info', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: [] })
      });

      const result = await bitcoinService.getBitcoinAddressInfo(testAddress);

      expect(result).toEqual({
        balance: 0,
        unconfirmedBalance: 0,
        txCount: 0
      });
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(bitcoinService.getBitcoinAddressInfo(testAddress))
        .rejects.toThrow('Failed to fetch Bitcoin address information');
    });
  });

  describe('getTransactionDetails', () => {
    const testTxHash = 'abc123def456';

    it('should fetch transaction details', async () => {
      const mockResponse = {
        confirmations: 6,
        block_height: 700000,
        time: 1625097600,
        fee: 5000,
        size: 250,
        out: [
          {
            addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            value: 100000000
          }
        ]
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await bitcoinService.getTransactionDetails(testTxHash);

      expect(fetch).toHaveBeenCalledWith(
        `https://www.blockonomics.co/api/tx_detail/${testTxHash}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Accept': 'application/json'
          }),
          timeout: 10000
        })
      );

      expect(result).toEqual({
        confirmations: 6,
        blockHeight: 700000,
        timestamp: 1625097600,
        fee: 5000,
        size: 250,
        outputs: mockResponse.out
      });
    });

    it('should handle missing transaction', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(bitcoinService.getTransactionDetails(testTxHash))
        .rejects.toThrow('Failed to fetch transaction details');
    });
  });

  describe('createBitcoinPayment', () => {
    beforeEach(() => {
      bitcoinService.generateBitcoinAddress = jest.fn()
        .mockResolvedValue('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      bitcoinService.convertGbpToBtc = jest.fn()
        .mockResolvedValue({
          btcAmount: 0.01,
          exchangeRate: 45000,
          exchangeRateTimestamp: new Date('2023-01-01T12:00:00Z')
        });
    });

    it('should create complete Bitcoin payment data', async () => {
      const orderAmount = 450; // £450
      const result = await bitcoinService.createBitcoinPayment(orderAmount);

      expect(bitcoinService.generateBitcoinAddress).toHaveBeenCalled();
      expect(bitcoinService.convertGbpToBtc).toHaveBeenCalledWith(orderAmount);

      expect(result).toEqual({
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.01,
        bitcoinExchangeRate: 45000,
        bitcoinExchangeRateTimestamp: new Date('2023-01-01T12:00:00Z'),
        bitcoinPaymentExpiry: expect.any(Date)
      });

      // Check expiry is 24 hours from now
      const now = new Date();
      const expiry = result.bitcoinPaymentExpiry;
      const timeDiff = expiry.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      expect(hoursDiff).toBeCloseTo(24, 0);
    });

    it('should handle address generation failure', async () => {
      bitcoinService.generateBitcoinAddress.mockRejectedValue(
        new Error('Address generation failed')
      );

      await expect(bitcoinService.createBitcoinPayment(100))
        .rejects.toThrow('Address generation failed');
    });

    it('should handle conversion failure', async () => {
      bitcoinService.convertGbpToBtc.mockRejectedValue(
        new Error('Exchange rate failed')
      );

      await expect(bitcoinService.createBitcoinPayment(100))
        .rejects.toThrow('Exchange rate failed');
    });
  });

  describe('Validation Methods', () => {
    describe('isPaymentConfirmed', () => {
      it('should require 2 confirmations', () => {
        expect(bitcoinService.isPaymentConfirmed(0)).toBe(false);
        expect(bitcoinService.isPaymentConfirmed(1)).toBe(false);
        expect(bitcoinService.isPaymentConfirmed(2)).toBe(true);
        expect(bitcoinService.isPaymentConfirmed(6)).toBe(true);
      });
    });

    describe('isPaymentExpired', () => {
      it('should check if payment is expired', () => {
        const now = new Date();
        const pastDate = new Date(now.getTime() - 1000); // 1 second ago
        const futureDate = new Date(now.getTime() + 1000); // 1 second from now

        expect(bitcoinService.isPaymentExpired(pastDate)).toBe(true);
        expect(bitcoinService.isPaymentExpired(futureDate)).toBe(false);
      });
    });

    describe('isPaymentSufficient', () => {
      it('should accept exact amount', () => {
        expect(bitcoinService.isPaymentSufficient(1.0, 1.0)).toBe(true);
      });

      it('should accept amount within tolerance', () => {
        // Default 1% tolerance
        expect(bitcoinService.isPaymentSufficient(0.995, 1.0)).toBe(true);
        expect(bitcoinService.isPaymentSufficient(0.99, 1.0)).toBe(false);
      });

      it('should accept custom tolerance', () => {
        // 5% tolerance
        expect(bitcoinService.isPaymentSufficient(0.95, 1.0, 5)).toBe(true);
        expect(bitcoinService.isPaymentSufficient(0.94, 1.0, 5)).toBe(false);
      });

      it('should accept overpayment', () => {
        expect(bitcoinService.isPaymentSufficient(1.1, 1.0)).toBe(true);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('formatBitcoinAmount', () => {
      it('should format Bitcoin amounts correctly', () => {
        expect(bitcoinService.formatBitcoinAmount(0.12345678)).toBe(0.12345678);
        expect(bitcoinService.formatBitcoinAmount(0.123456789)).toBe(0.12345679);
        expect(bitcoinService.formatBitcoinAmount(1)).toBe(1);
      });
    });

    describe('satoshisToBtc', () => {
      it('should convert satoshis to BTC', () => {
        expect(bitcoinService.satoshisToBtc(100000000)).toBe(1);
        expect(bitcoinService.satoshisToBtc(50000000)).toBe(0.5);
        expect(bitcoinService.satoshisToBtc(1)).toBe(0.00000001);
      });
    });

    describe('btcToSatoshis', () => {
      it('should convert BTC to satoshis', () => {
        expect(bitcoinService.btcToSatoshis(1)).toBe(100000000);
        expect(bitcoinService.btcToSatoshis(0.5)).toBe(50000000);
        expect(bitcoinService.btcToSatoshis(0.00000001)).toBe(1);
      });

      it('should round to nearest satoshi', () => {
        expect(bitcoinService.btcToSatoshis(0.000000015)).toBe(2);
        expect(bitcoinService.btcToSatoshis(0.000000014)).toBe(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch timeout errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(bitcoinService.getBtcExchangeRate())
        .rejects.toThrow('Failed to fetch Bitcoin exchange rate');
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      await expect(bitcoinService.getBtcExchangeRate())
        .rejects.toThrow('Failed to fetch Bitcoin exchange rate');
    });

    it('should handle missing environment variables gracefully', async () => {
      delete process.env.BLOCKONOMICS_API_KEY;
      bitcoinService.blockonomicsApiKey = undefined;

      await expect(bitcoinService.generateBitcoinAddress())
        .rejects.toThrow('Blockonomics API key not configured');

      await expect(bitcoinService.getBitcoinAddressInfo('test'))
        .rejects.toThrow('Blockonomics API key not configured');

      await expect(bitcoinService.getTransactionDetails('test'))
        .rejects.toThrow('Blockonomics API key not configured');
    });
  });
});
