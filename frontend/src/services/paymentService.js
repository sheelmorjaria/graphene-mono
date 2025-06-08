const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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
    const response = await fetch(`${API_BASE_URL}/payment/methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/payment/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

// Capture PayPal payment
export const capturePayPalPayment = async ({ paypalOrderId, payerId }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/paypal/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        paypalOrderId,
        payerId 
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

// Bitcoin payment functions

// Initialize Bitcoin payment
export const initializeBitcoinPayment = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/bitcoin/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ orderId })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to initialize Bitcoin payment');
    }

    return data;
  } catch (error) {
    console.error('Error initializing Bitcoin payment:', error);
    throw error;
  }
};

// Get Bitcoin payment status
export const getBitcoinPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/bitcoin/status/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get Bitcoin payment status');
    }

    return data;
  } catch (error) {
    console.error('Error getting Bitcoin payment status:', error);
    throw error;
  }
};

// Helper function to format Bitcoin amount
export const formatBitcoinAmount = (amount) => {
  return parseFloat(amount.toFixed(8));
};

// Helper function to generate Bitcoin payment QR code data
export const getBitcoinQRData = (address, amount) => {
  return `bitcoin:${address}?amount=${amount}`;
};