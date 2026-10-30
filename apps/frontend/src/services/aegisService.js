const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Aegis Hardening Suite service (£99 one-off licence, PayPal-only, guest
 * purchase). Mirrors flashOrderService — the backend is the source of truth
 * for the charged amount; the price here is for display only.
 */
export const AEGIS_PRICE_GBP = 99.00;

/**
 * Format currency for Aegis orders
 */
export const formatAegisCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Get the catalog-driven supported model list for the purchase dropdown
 * @returns {Promise<Object>} { models: [{ value, label }] }
 */
export const getAegisModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/aegis-orders/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch supported models');
    }
    return data.data;
  } catch (error) {
    console.error('Error fetching Aegis models:', error);
    throw error;
  }
};

/**
 * Create a new Aegis Order
 * @param {Object} orderData - { customerEmail, pixelModel }
 * @returns {Promise<Object>} The created order { orderId, orderNumber, ... }
 */
export const createAegisOrder = async (orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/aegis-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create Aegis order');
    }
    return data.data;
  } catch (error) {
    console.error('Error creating Aegis order:', error);
    throw error;
  }
};

/**
 * Get a public summary of an Aegis Order (for the payment step)
 * @param {string} orderId - The Aegis Order ID
 * @returns {Promise<Object>} { orderNumber, amountGbp, paymentStatus, ... }
 */
export const getAegisOrderSummary = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/aegis-orders/${orderId}/summary`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch Aegis order summary');
  }
  return data.data;
};

/**
 * Create a server-side PayPal order for an Aegis order
 * @param {string} orderId - The Aegis Order ID
 * @returns {Promise<Object>} { paypalOrderId }
 */
export const createAegisPayPalPayment = async (orderId) => {
  const response = await fetch(`${API_BASE_URL}/aegis-orders/${orderId}/paypal/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create PayPal order');
  }
  return data.data;
};

/**
 * Capture the approved PayPal payment for an Aegis order
 * @param {string} orderId - The Aegis Order ID
 * @param {Object} params - { paypalOrderId, payerId }
 */
export const captureAegisPayPalPayment = async (orderId, { paypalOrderId, payerId }) => {
  const response = await fetch(`${API_BASE_URL}/aegis-orders/${orderId}/paypal/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ paypalOrderId, payerId })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to capture PayPal payment');
  }
  return data.data;
};
