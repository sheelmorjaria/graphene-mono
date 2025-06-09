const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Admin promotion endpoints
export const promotionService = {
  // Get all promotions with pagination, search and filters
  getAllPromotions: async (params = {}) => {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(type && { type }),
      ...(status && { status }),
      sortBy,
      sortOrder
    });

    const response = await fetch(`${API_URL}/admin/promotions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch promotions');
    }

    return response.json();
  },

  // Get single promotion by ID
  getPromotionById: async (promoId) => {
    const response = await fetch(`${API_URL}/admin/promotions/${promoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch promotion');
    }

    return response.json();
  },

  // Create new promotion
  createPromotion: async (promotionData) => {
    const response = await fetch(`${API_URL}/admin/promotions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(promotionData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create promotion');
    }

    return response.json();
  },

  // Update promotion
  updatePromotion: async (promoId, promotionData) => {
    const response = await fetch(`${API_URL}/admin/promotions/${promoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(promotionData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update promotion');
    }

    return response.json();
  },

  // Update promotion status
  updatePromotionStatus: async (promoId, status) => {
    const response = await fetch(`${API_URL}/admin/promotions/${promoId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update promotion status');
    }

    return response.json();
  },

  // Delete promotion (soft delete)
  deletePromotion: async (promoId) => {
    const response = await fetch(`${API_URL}/admin/promotions/${promoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete promotion');
    }

    return response.json();
  },

  // Check code uniqueness
  checkCodeUniqueness: async (code, excludeId = null) => {
    const queryParams = new URLSearchParams({
      code,
      ...(excludeId && { excludeId })
    });

    const response = await fetch(`${API_URL}/admin/promotions/check-code?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check code uniqueness');
    }

    return response.json();
  }
};

export default promotionService;