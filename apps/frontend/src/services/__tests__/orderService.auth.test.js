import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { placeOrder, getUserOrders, getUserOrderDetails, cancelOrder } from '../orderService';

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock global fetch
global.fetch = vi.fn();

describe('Order Service Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('placeOrder', () => {
    const mockOrderData = {
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      shippingMethod: { id: 'standard', name: 'Standard Shipping' },
      paymentMethod: { type: 'paypal' },
      items: [{ productId: '123', quantity: 1 }]
    };

    it('should include Authorization header with token', async () => {
      const mockToken = 'mock-jwt-token';
      mockLocalStorage.setItem('authToken', mockToken);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { order: { _id: '123' } } })
      });

      await placeOrder(mockOrderData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/orders/place-order'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should throw error when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(placeOrder(mockOrderData)).rejects.toThrow(
        'Authentication required. Please log in.'
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle authentication errors properly', async () => {
      const mockToken = 'invalid-token';
      mockLocalStorage.setItem('authToken', mockToken);
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Access denied. No token provided.' })
      });

      await expect(placeOrder(mockOrderData)).rejects.toThrow(
        'Access denied. No token provided.'
      );
    });
  });

  describe('getUserOrders', () => {
    it('should include Authorization header with token', async () => {
      const mockToken = 'mock-jwt-token';
      mockLocalStorage.setItem('authToken', mockToken);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { orders: [] } })
      });

      await getUserOrders();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user/orders'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should throw error when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(getUserOrders()).rejects.toThrow(
        'Authentication required. Please log in.'
      );

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('getUserOrderDetails', () => {
    it('should include Authorization header with token', async () => {
      const mockToken = 'mock-jwt-token';
      const orderId = '123';
      mockLocalStorage.setItem('authToken', mockToken);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { order: { _id: orderId } } })
      });

      await getUserOrderDetails(orderId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/user/orders/${orderId}`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should throw error when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(getUserOrderDetails('123')).rejects.toThrow(
        'Authentication required. Please log in.'
      );
    });
  });

  describe('cancelOrder', () => {
    it('should include Authorization header with token', async () => {
      const mockToken = 'mock-jwt-token';
      const orderId = '123';
      mockLocalStorage.setItem('authToken', mockToken);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Order cancelled' })
      });

      await cancelOrder(orderId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/user/orders/${orderId}/cancel`),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }),
          method: 'POST'
        })
      );
    });

    it('should throw error when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(cancelOrder('123')).rejects.toThrow(
        'Authentication required. Please log in.'
      );
    });
  });
});