// MUST resolve the URL the same way as cartService (utils/apiConfig) — a
// divergent base sends cart traffic and payment traffic to different
// origins, so the cart cookie set by one is invisible to the other and
// checkout fails with "Cart is empty" / "No cart session found".
import { API_BASE_URL } from '../utils/apiConfig';

// Cart lookups key on the cartSessionId cookie (guests) or the user id from
// the Bearer token (logged in) — send the token when present, like cartService.
const getAuthToken = () => localStorage.getItem('authToken');

const authHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Get available payment methods
export const getPaymentMethods = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/methods`, {
      method: 'GET',
      headers: authHeaders(),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch payment methods');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};


// Payment method types and their display information
export const paymentMethodTypes = {
  paypal: {
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: 'PayPalIcon',
    supportsInstantPayment: true
  }
};

// Helper to validate payment method selection
export const validatePaymentMethod = (paymentMethod) => {
  if (!paymentMethod) {
    throw new Error('Payment method is required');
  }

  if (!paymentMethodTypes[paymentMethod.type]) {
    throw new Error('Invalid payment method type');
  }

  return true;
};

// Helper to check if payment method requires additional setup
export const requiresPaymentMethodSetup = () => {
  return false; // PayPal doesn't require additional setup
};


// PayPal payment functions

// Create PayPal order
export const createPayPalOrder = async (checkoutData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/paypal/create-order`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(checkoutData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create PayPal order');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
};

// Capture PayPal payment. `customerEmail` is the guest receipt address —
// required by the backend for guest checkout.
export const capturePayPalPayment = async ({ paypalOrderId, payerId, customerEmail }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/paypal/capture`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        paypalOrderId,
        payerId,
        ...(customerEmail ? { customerEmail } : {})
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to capture PayPal payment');
    }

    return data;
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    throw error;
  }
};