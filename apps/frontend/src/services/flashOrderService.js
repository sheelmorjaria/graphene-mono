const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Create a new Flash Order
 * @param {Object} orderData - The flash order data
 * @param {string} orderData.customerEmail - Customer email
 * @param {string} orderData.pixelModel - Pixel model (e.g., 'Pixel 8 Pro')
 * @param {Object} orderData.returnAddress - Return address
 * @param {boolean} orderData.factoryResetConfirmed - Factory reset confirmation
 * @returns {Promise<Object>} The created order
 */
export const createFlashOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/flash-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create flash order');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating flash order:', error);
    throw error;
  }
};

/**
 * Get shipping instructions for a Flash Order (includes PO Box address)
 * Only available after payment is completed
 * @param {string} orderId - The Flash Order ID
 * @returns {Promise<Object>} The order instructions
 */
export const getFlashOrderInstructions = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/flash-orders/${orderId}/instructions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch instructions');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching flash order instructions:', error);
    throw error;
  }
};

/**
 * Supported Pixel models
 */
export const SUPPORTED_PIXEL_MODELS = [
  { value: 'Pixel 6', label: 'Pixel 6' },
  { value: 'Pixel 6 Pro', label: 'Pixel 6 Pro' },
  { value: 'Pixel 6a', label: 'Pixel 6a' },
  { value: 'Pixel 7', label: 'Pixel 7' },
  { value: 'Pixel 7 Pro', label: 'Pixel 7 Pro' },
  { value: 'Pixel 7a', label: 'Pixel 7a' },
  { value: 'Pixel 8', label: 'Pixel 8' },
  { value: 'Pixel 8 Pro', label: 'Pixel 8 Pro' },
  { value: 'Pixel 8a', label: 'Pixel 8a' }
];

/**
 * Flash Order pricing
 */
export const FLASH_ORDER_PRICING = {
  basePrice: 119.99,
  returnShipping: 19.99,
  totalPrice: 139.98
};

/**
 * Format currency for Flash Orders
 */
export const formatFlashOrderCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
