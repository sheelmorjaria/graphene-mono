import { vi } from 'vitest';
import axios from 'axios';
import moneroService from '../moneroService.js';

describe('MoneroService Simple Tests', () => {
  let axiosGetSpy;
  let axiosPostSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set test environment variables
    process.env.GLOBEE_API_KEY = 'test-globee-api-key';
    process.env.GLOBEE_SECRET = 'test-webhook-secret';
    
    // Mock axios methods using spyOn
    axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValue({ data: {} });
    axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    
    // Reset cache
    moneroService.exchangeRateCache = {
      rate: null,
      timestamp: null,
      validUntil: null
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getExchangeRate', () => {
    it('should fetch exchange rate from CoinGecko API', async () => {
      const mockResponse = {
        data: {
          monero: { gbp: 161.23 }
        }
      };

      axiosGetSpy.mockResolvedValueOnce(mockResponse);

      const result = await moneroService.getExchangeRate();

      expect(axiosGetSpy).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price',
        expect.objectContaining({
          params: {
            ids: 'monero',
            vs_currencies: 'gbp',
            precision: 8
          },
          timeout: 10000
        })
      );

      expect(result.rate).toBeCloseTo(0.00620333, 5);
      expect(result.validUntil).toBeInstanceOf(Date);
    });

    it('should handle network errors', async () => {
      axiosGetSpy.mockRejectedValueOnce(new Error('Network error'));

      await expect(moneroService.getExchangeRate()).rejects.toThrow(
        'Unable to fetch current Monero exchange rate'
      );
    });
  });

  describe('convertGbpToXmr', () => {
    it('should convert GBP to XMR correctly', async () => {
      // Mock getExchangeRate
      vi.spyOn(moneroService, 'getExchangeRate').mockResolvedValue({
        rate: 0.01,
        validUntil: new Date(Date.now() + 5 * 60 * 1000)
      });

      const result = await moneroService.convertGbpToXmr(100);

      expect(result.xmrAmount).toBe(1); // 100 * 0.01
      expect(result.exchangeRate).toBe(0.01);
    });
  });

  describe('utility methods', () => {
    it('should format XMR amounts correctly', () => {
      expect(moneroService.formatXmrAmount(1.000000000000)).toBe('1');
      expect(moneroService.formatXmrAmount(1.234567890123)).toBe('1.234567890123');
    });

    it('should return correct constants', () => {
      expect(moneroService.getRequiredConfirmations()).toBe(10);
      expect(moneroService.getPaymentWindowHours()).toBe(24);
    });
  });
});