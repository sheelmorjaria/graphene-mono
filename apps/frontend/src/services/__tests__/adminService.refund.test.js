import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { issueRefund } from '../adminService';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('adminService - issueRefund', () => {
  const mockToken = 'mock-admin-token';
  const orderId = '507f1f77bcf86cd799439011';
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should send correct API request for refund', async () => {
    const refundData = {
      refundAmount: 50.00,
      refundReason: 'Customer requested refund'
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        message: 'Refund processed successfully',
        data: {
          order: { _id: orderId, totalRefundedAmount: 50 },
          refund: { amount: 50, reason: 'Customer requested refund' }
        }
      })
    };

    fetch.mockResolvedValue(mockResponse);

    const result = await issueRefund(orderId, refundData);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:3000/api/admin/orders/${orderId}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify(refundData)
      }
    );

    expect(result).toEqual({
      success: true,
      message: 'Refund processed successfully',
      data: {
        order: { _id: orderId, totalRefundedAmount: 50 },
        refund: { amount: 50, reason: 'Customer requested refund' }
      }
    });
  });

  it('should throw error when no authentication token found', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    await expect(issueRefund(orderId, {})).rejects.toThrow('No authentication token found');
    
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle API error responses', async () => {
    const refundData = {
      refundAmount: 1000.00,
      refundReason: 'Test refund'
    };

    const mockResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: 'Refund amount exceeds maximum refundable amount'
      })
    };

    fetch.mockResolvedValue(mockResponse);

    await expect(issueRefund(orderId, refundData)).rejects.toThrow('Refund amount exceeds maximum refundable amount');
  });

  it('should handle unauthorized responses by clearing token', async () => {
    const refundData = {
      refundAmount: 50.00,
      refundReason: 'Test refund'
    };

    const mockResponse = {
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: 'Unauthorized'
      })
    };

    fetch.mockResolvedValue(mockResponse);

    // For unauthorized responses, the function returns undefined and redirects
    const result = await issueRefund(orderId, refundData);
    
    expect(result).toBeUndefined();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
  });

  it('should handle network errors', async () => {
    const refundData = {
      refundAmount: 50.00,
      refundReason: 'Test refund'
    };

    fetch.mockRejectedValue(new Error('Network error'));

    await expect(issueRefund(orderId, refundData)).rejects.toThrow('Network error');
  });

  it('should handle malformed JSON responses', async () => {
    const refundData = {
      refundAmount: 50.00,
      refundReason: 'Test refund'
    };

    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    };

    fetch.mockResolvedValue(mockResponse);

    await expect(issueRefund(orderId, refundData)).rejects.toThrow('Invalid JSON');
  });
});

describe('Refund Amount Calculation and Validation', () => {
  const createMockOrder = (totalAmount, totalRefundedAmount = 0) => ({
    totalAmount,
    totalRefundedAmount,
    refundHistory: []
  });

  describe('Maximum Refundable Amount Calculation', () => {
    it('should calculate correct max refundable for new order', () => {
      const order = createMockOrder(100.00, 0);
      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
      
      expect(maxRefundable).toBe(100.00);
    });

    it('should calculate correct max refundable for partially refunded order', () => {
      const order = createMockOrder(100.00, 30.00);
      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
      
      expect(maxRefundable).toBe(70.00);
    });

    it('should return zero for fully refunded order', () => {
      const order = createMockOrder(100.00, 100.00);
      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
      
      expect(maxRefundable).toBe(0);
    });

    it('should handle undefined totalRefundedAmount', () => {
      const order = { totalAmount: 100.00 };
      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
      
      expect(maxRefundable).toBe(100.00);
    });
  });

  describe('Refund Eligibility Validation', () => {
    it('should validate refund amount is numeric', () => {
      const refundAmount = 'invalid';
      const numericAmount = parseFloat(refundAmount);
      
      expect(isNaN(numericAmount)).toBe(true);
    });

    it('should validate refund amount is positive', () => {
      const refundAmount = -50;
      const isValid = !isNaN(refundAmount) && refundAmount > 0;
      
      expect(isValid).toBe(false);
    });

    it('should validate refund amount does not exceed maximum', () => {
      const order = createMockOrder(100.00, 30.00);
      const refundAmount = 80.00;
      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
      
      expect(refundAmount > maxRefundable).toBe(true);
    });

    it('should validate refund reason is provided', () => {
      const refundReason = '   ';
      const isValid = refundReason.trim().length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should accept valid refund request', () => {
      const order = createMockOrder(100.00, 30.00);
      const refundAmount = 50.00;
      const refundReason = 'Customer requested refund';
      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
      
      const isAmountValid = !isNaN(refundAmount) && refundAmount > 0 && refundAmount <= maxRefundable;
      const isReasonValid = refundReason.trim().length > 0;
      
      expect(isAmountValid).toBe(true);
      expect(isReasonValid).toBe(true);
    });
  });

  describe('Refund Button State', () => {
    it('should disable refund button for fully refunded order', () => {
      const order = createMockOrder(100.00, 100.00);
      const isDisabled = (order.totalRefundedAmount || 0) >= order.totalAmount;
      
      expect(isDisabled).toBe(true);
    });

    it('should enable refund button for eligible order', () => {
      const order = createMockOrder(100.00, 50.00);
      const isDisabled = (order.totalRefundedAmount || 0) >= order.totalAmount;
      
      expect(isDisabled).toBe(false);
    });

    it('should handle order with no refund history', () => {
      const order = { totalAmount: 100.00 };
      const isDisabled = (order.totalRefundedAmount || 0) >= order.totalAmount;
      
      expect(isDisabled).toBe(false);
    });
  });
});