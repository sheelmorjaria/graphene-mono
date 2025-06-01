import { loadStripe } from '@stripe/stripe-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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

// Create payment intent
export const createPaymentIntent = async (checkoutData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(checkoutData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Get payment intent details
export const getPaymentIntent = async (paymentIntentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/intent/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch payment intent');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    throw error;
  }
};

// Process payment with Stripe
export const processPayment = async (stripe, elements, clientSecret, billingDetails) => {
  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: billingDetails
        }
      },
      redirect: 'if_required'
    });

    if (error) {
      throw new Error(error.message);
    }

    return paymentIntent;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// Get Stripe instance
export const getStripe = () => stripePromise;

// Payment method types and their display information
export const paymentMethodTypes = {
  card: {
    name: 'Credit or Debit Card',
    description: 'Pay securely with your credit or debit card',
    icon: 'CreditCardIcon',
    supportsInstantPayment: false
  },
  paypal: {
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: 'PayPalIcon',
    supportsInstantPayment: true
  },
  apple_pay: {
    name: 'Apple Pay',
    description: 'Pay with Touch ID or Face ID',
    icon: 'ApplePayIcon',
    supportsInstantPayment: true
  },
  google_pay: {
    name: 'Google Pay',
    description: 'Pay with Google Pay',
    icon: 'GooglePayIcon',
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
export const requiresPaymentMethodSetup = (paymentMethodType) => {
  return paymentMethodType === 'card';
};

// Generate billing details from address
export const generateBillingDetails = (billingAddress, customerInfo = {}) => {
  return {
    name: customerInfo.name || `${billingAddress.firstName} ${billingAddress.lastName}`,
    email: customerInfo.email,
    phone: billingAddress.phoneNumber,
    address: {
      line1: billingAddress.addressLine1,
      line2: billingAddress.addressLine2 || null,
      city: billingAddress.city,
      state: billingAddress.state,
      postal_code: billingAddress.postalCode,
      country: billingAddress.country
    }
  };
};