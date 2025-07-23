import axios from 'axios';
import crypto from 'crypto';
import logger, { logError } from '../utils/logger.js';

// GloBee API configuration
const GLOBEE_API_URL = process.env.GLOBEE_API_URL || 'https://api.globee.com/v1';
const GLOBEE_API_KEY = process.env.GLOBEE_API_KEY;
const GLOBEE_SECRET = process.env.GLOBEE_SECRET;

// CoinGecko API for exchange rates
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Exchange rate cache configuration
const EXCHANGE_RATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let exchangeRateCache = {
  rate: null,
  timestamp: null,
  validUntil: null
};

// Monero confirmation requirements
const MONERO_REQUIRED_CONFIRMATIONS = 10;
const MONERO_PAYMENT_WINDOW_HOURS = 24;

class MoneroService {
  constructor() {
    this.apiKey = GLOBEE_API_KEY;
    this.secret = GLOBEE_SECRET;
    this.baseURL = GLOBEE_API_URL;
  }

  // For testing purposes, expose cache
  get exchangeRateCache() {
    return exchangeRateCache;
  }

  set exchangeRateCache(value) {
    exchangeRateCache.rate = value.rate;
    exchangeRateCache.timestamp = value.timestamp;
    exchangeRateCache.validUntil = value.validUntil;
  }

  /**
   * Fetch current XMR/GBP exchange rate from CoinGecko with caching
   * @returns {Promise<{rate: number, validUntil: Date}>}
   */
  async getExchangeRate() {
    try {
      const now = Date.now();
      
      // Check if cached rate is still valid
      if (exchangeRateCache.rate && 
          exchangeRateCache.validUntil && 
          now < exchangeRateCache.validUntil) {
        return {
          rate: exchangeRateCache.rate,
          validUntil: new Date(exchangeRateCache.validUntil)
        };
      }

      // Fetch fresh rate from CoinGecko
      const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
        params: {
          ids: 'monero',
          vs_currencies: 'gbp',
          precision: 8
        },
        timeout: 10000
      });

      if (!response.data || !response.data.monero || !response.data.monero.gbp) {
        throw new Error('Invalid response from CoinGecko API');
      }

      const xmrToGbp = response.data.monero.gbp;
      
      // Validate the exchange rate
      if (!xmrToGbp || xmrToGbp <= 0 || !isFinite(xmrToGbp)) {
        throw new Error('Invalid exchange rate received from API');
      }
      
      const gbpToXmr = 1 / xmrToGbp;
      const validUntil = now + EXCHANGE_RATE_CACHE_DURATION;

      // Update cache
      exchangeRateCache = {
        rate: gbpToXmr,
        timestamp: now,
        validUntil: validUntil
      };

      logger.info(`Monero exchange rate updated: 1 GBP = ${gbpToXmr.toFixed(8)} XMR`);

      return {
        rate: gbpToXmr,
        validUntil: new Date(validUntil)
      };
    } catch (error) {
      logError(error, { context: 'monero_exchange_rate_fetch' });
      
      // If we have a cached rate that's not too old (within 1 hour), use it as fallback
      if (exchangeRateCache.rate && 
          exchangeRateCache.timestamp && 
          (Date.now() - exchangeRateCache.timestamp) < (60 * 60 * 1000)) {
        logger.warn('Using cached exchange rate as fallback');
        return {
          rate: exchangeRateCache.rate,
          validUntil: new Date(exchangeRateCache.validUntil)
        };
      }
      
      throw new Error('Unable to fetch current Monero exchange rate');
    }
  }

  /**
   * Convert GBP amount to XMR using current exchange rate
   * @param {number} gbpAmount - Amount in GBP
   * @returns {Promise<{xmrAmount: number, exchangeRate: number, validUntil: Date}>}
   */
  async convertGbpToXmr(gbpAmount) {
    const { rate, validUntil } = await this.getExchangeRate();
    const xmrAmount = gbpAmount * rate;

    return {
      xmrAmount: parseFloat(xmrAmount.toFixed(12)), // Monero has 12 decimal places
      exchangeRate: rate,
      validUntil
    };
  }

  /**
   * Create a new Monero payment request via GloBee
   * @param {Object} paymentData - Payment request data
   * @returns {Promise<Object>} - GloBee payment response
   */
  async createPaymentRequest(paymentData) {
    try {
      if (!this.apiKey) {
        throw new Error('GloBee API key not configured');
      }

      const { orderId, amount, currency = 'XMR', customerEmail } = paymentData;

      const requestData = {
        total: amount,
        currency: currency,
        order_id: orderId,
        customer_email: customerEmail,
        success_url: `${process.env.FRONTEND_URL}/order-confirmation/${orderId}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout`,
        ipn_url: `${process.env.BACKEND_URL}/api/payments/monero/webhook`,
        confirmation_speed: 'high', // Requires 10 confirmations for Monero
        redirect_url: `${process.env.FRONTEND_URL}/payment/monero/${orderId}`
      };

      const response = await axios.post(`${this.baseURL}/payment-request`, requestData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (!response.data || !response.data.payment_address) {
        throw new Error('Invalid response from GloBee API');
      }

      return {
        paymentId: response.data.id,
        address: response.data.payment_address,
        amount: response.data.total,
        currency: response.data.currency,
        expirationTime: response.data.expiration_time,
        paymentUrl: response.data.payment_url,
        status: response.data.status
      };
    } catch (error) {
      logError(error, { context: 'globee_payment_request', orderNumber: paymentData.custom?.order_id });
      
      if (error.response && error.response.data) {
        throw new Error(`GloBee API error: ${error.response.data.message || error.response.statusText}`);
      }
      
      throw new Error(`Failed to create Monero payment request: ${error.message}`);
    }
  }

  /**
   * Get payment status from GloBee
   * @param {string} paymentId - GloBee payment ID
   * @returns {Promise<Object>} - Payment status information
   */
  async getPaymentStatus(paymentId) {
    try {
      if (!this.apiKey) {
        throw new Error('GloBee API key not configured');
      }

      const response = await axios.get(`${this.baseURL}/payment-request/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      return {
        id: response.data.id,
        status: response.data.status,
        confirmations: response.data.confirmations || 0,
        paid_amount: response.data.paid_amount,
        transaction_hash: response.data.transaction_hash,
        payment_address: response.data.payment_address,
        created_at: response.data.created_at,
        expires_at: response.data.expires_at
      };
    } catch (error) {
      logError(error, { context: 'globee_payment_status', paymentId });
      throw new Error(`Unable to fetch payment status: ${error.message}`);
    }
  }

  /**
   * Verify GloBee webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - GloBee signature header
   * @returns {boolean} - Whether signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.secret) {
        throw new Error('GloBee webhook secret not configured');
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(payload)
        .digest('hex');

      // Handle missing or invalid signatures
      if (!signature) {
        return false;
      }
      
      // Handle signatures with 'sha256=' prefix
      const cleanSignature = signature.startsWith('sha256=') ? signature.slice(7) : signature;
      
      // Ensure both signatures are same length for timing safe comparison
      if (cleanSignature.length !== expectedSignature.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logError(error, { context: 'webhook_signature_verification' });
      return false;
    }
  }

  /**
   * Process GloBee webhook notification
   * @param {Object} webhookData - Webhook payload from GloBee
   * @returns {Object} - Processed payment information
   */
  processWebhookNotification(webhookData) {
    const {
      id: paymentId,
      status,
      confirmations = 0,
      paid_amount,
      total_amount,
      transaction_hash,
      order_id: orderId
    } = webhookData;

    // Determine payment status based on confirmations
    let paymentStatus = 'pending';
    
    if (status === 'paid' && confirmations >= MONERO_REQUIRED_CONFIRMATIONS) {
      paymentStatus = 'confirmed';
    } else if (status === 'paid' && confirmations > 0) {
      paymentStatus = 'partially_confirmed';
    } else if (status === 'cancelled' || status === 'expired') {
      paymentStatus = 'failed';
    } else if (status === 'underpaid') {
      paymentStatus = 'underpaid';
    }

    return {
      paymentId,
      orderId,
      status: paymentStatus,
      confirmations,
      paidAmount: paid_amount,
      totalAmount: total_amount,
      transactionHash: transaction_hash,
      isFullyConfirmed: confirmations >= MONERO_REQUIRED_CONFIRMATIONS,
      requiresAction: paymentStatus === 'underpaid' || paymentStatus === 'failed'
    };
  }

  /**
   * Check if a payment window has expired
   * @param {Date} createdAt - When the payment was created
   * @returns {boolean} - Whether the payment window has expired
   */
  isPaymentExpired(createdAt) {
    const now = new Date();
    const expirationTime = new Date(createdAt.getTime() + (MONERO_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000));
    return now > expirationTime;
  }

  /**
   * Calculate Monero payment expiration time
   * @param {Date} createdAt - When the payment was created
   * @returns {Date} - Expiration time
   */
  getPaymentExpirationTime(createdAt = new Date()) {
    return new Date(createdAt.getTime() + (MONERO_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000));
  }

  /**
   * Get required confirmations for Monero
   * @returns {number} - Number of required confirmations
   */
  getRequiredConfirmations() {
    return MONERO_REQUIRED_CONFIRMATIONS;
  }

  /**
   * Get payment window duration in hours
   * @returns {number} - Payment window in hours
   */
  getPaymentWindowHours() {
    return MONERO_PAYMENT_WINDOW_HOURS;
  }

  /**
   * Format XMR amount for display
   * @param {number} amount - XMR amount
   * @returns {string} - Formatted amount
   */
  formatXmrAmount(amount) {
    return parseFloat(amount).toFixed(12).replace(/\.?0+$/, '');
  }
}

// Export singleton instance
const moneroService = new MoneroService();
export default moneroService;