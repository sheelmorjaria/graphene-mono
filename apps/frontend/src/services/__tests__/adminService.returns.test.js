import { vi } from 'vitest';
import { getAllReturnRequests, getReturnRequestById, updateReturnRequestStatus } from '../adminService';

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

// Mock fetch
global.fetch = jest.fn();

describe('Admin Service - Return Management', () => {
  const mockToken = 'mock-admin-token';
  const mockReturnRequest = {
    _id: '507f1f77bcf86cd799439011',
    returnRequestNumber: '2024010001',
    status: 'pending_review',
    requestDate: '2024-01-01T00:00:00.000Z',
    totalRefundAmount: 699.99,
    customer: {
      _id: '507f1f77bcf86cd799439012',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com'
    },
    order: {
      _id: '507f1f77bcf86cd799439013',
      orderNumber: 'ORD-2024010001'
    },
    items: [{
      productName: 'Google Pixel 8',
      quantity: 1,
      unitPrice: 699.99,
      reason: 'defective_item'
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    
    // Reset fetch mock
    fetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllReturnRequests', () => {
    it('should fetch return requests with default filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          returnRequests: [mockReturnRequest],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalReturnRequests: 1,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await getAllReturnRequests();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/returns?page=1&limit=20&sortBy=requestDate&sortOrder=desc'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        page: 2,
        limit: 10,
        status: 'approved',
        customerQuery: 'john',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        sortBy: 'totalRefundAmount',
        sortOrder: 'asc'
      };

      const mockResponse = {
        success: true,
        data: {
          returnRequests: [],
          pagination: {
            currentPage: 2,
            totalPages: 1,
            totalReturnRequests: 0,
            hasNextPage: false,
            hasPrevPage: true,
            limit: 10
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await getAllReturnRequests(filters);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=approved'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('customerQuery=john'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle authentication errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Unauthorized access'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValueOnce(mockErrorResponse)
      });

      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      await expect(getAllReturnRequests()).rejects.toThrow('Unauthorized access');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminUser');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getAllReturnRequests()).rejects.toThrow('Network error');
    });

    it('should throw error when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(getAllReturnRequests()).rejects.toThrow('No authentication token found');
    });
  });

  describe('getReturnRequestById', () => {
    const returnRequestId = '507f1f77bcf86cd799439011';

    it('should fetch return request details by ID', async () => {
      const mockResponse = {
        success: true,
        data: {
          returnRequest: {
            ...mockReturnRequest,
            adminNotes: 'Customer reported defective screen',
            images: [{
              url: '/images/defect1.jpg',
              description: 'Dead pixels visible'
            }]
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await getReturnRequestById(returnRequestId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/admin/returns/${returnRequestId}`),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Return request not found'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValueOnce(mockErrorResponse)
      });

      await expect(getReturnRequestById(returnRequestId)).rejects.toThrow('Return request not found');
    });

    it('should throw error when return request ID is missing', async () => {
      await expect(getReturnRequestById('')).rejects.toThrow('Return request ID is required');
      await expect(getReturnRequestById(null)).rejects.toThrow('Return request ID is required');
    });

    it('should handle authentication errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: 'Access denied'
        })
      });

      delete window.location;
      window.location = { href: '' };

      await expect(getReturnRequestById(returnRequestId)).rejects.toThrow('Access denied');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminUser');
    });
  });

  describe('updateReturnRequestStatus', () => {
    const returnRequestId = '507f1f77bcf86cd799439011';

    it('should update return request status to approved', async () => {
      const statusData = {
        newStatus: 'approved',
        adminNotes: 'Return approved for defective item'
      };

      const mockResponse = {
        success: true,
        message: 'Return request status updated to approved',
        data: {
          returnRequest: {
            ...mockReturnRequest,
            status: 'approved',
            approvedDate: '2024-01-02T00:00:00.000Z'
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await updateReturnRequestStatus(returnRequestId, statusData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/admin/returns/${returnRequestId}/status`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(statusData)
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should update return request status to rejected with reason', async () => {
      const statusData = {
        newStatus: 'rejected',
        rejectionReason: 'Item shows signs of misuse',
        adminNotes: 'Customer appears to have damaged the item'
      };

      const mockResponse = {
        success: true,
        message: 'Return request status updated to rejected',
        data: {
          returnRequest: {
            ...mockReturnRequest,
            status: 'rejected'
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });

      const result = await updateReturnRequestStatus(returnRequestId, statusData);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/admin/returns/${returnRequestId}/status`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(statusData)
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      const statusData = {
        newStatus: 'rejected'
        // Missing rejectionReason
      };

      const mockErrorResponse = {
        success: false,
        error: 'Rejection reason is required when rejecting a return request'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce(mockErrorResponse)
      });

      await expect(updateReturnRequestStatus(returnRequestId, statusData))
        .rejects.toThrow('Rejection reason is required when rejecting a return request');
    });

    it('should handle invalid status values', async () => {
      const statusData = {
        newStatus: 'invalid_status'
      };

      const mockErrorResponse = {
        success: false,
        error: 'Invalid status value'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValueOnce(mockErrorResponse)
      });

      await expect(updateReturnRequestStatus(returnRequestId, statusData))
        .rejects.toThrow('Invalid status value');
    });

    it('should throw error when return request ID is missing', async () => {
      await expect(updateReturnRequestStatus('', {})).rejects.toThrow('Return request ID is required');
      await expect(updateReturnRequestStatus(null, {})).rejects.toThrow('Return request ID is required');
    });

    it('should handle authentication errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValueOnce({
          success: false,
          error: 'Unauthorized'
        })
      });

      delete window.location;
      window.location = { href: '' };

      await expect(updateReturnRequestStatus(returnRequestId, { newStatus: 'approved' }))
        .rejects.toThrow('Unauthorized');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminUser');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateReturnRequestStatus(returnRequestId, { newStatus: 'approved' }))
        .rejects.toThrow('Network error');
    });
  });
});