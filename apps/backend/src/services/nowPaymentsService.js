import axios from 'axios';
import crypto from 'crypto';
import logger, { logError } from '../utils/logger.js';

// NowPayments API configuration
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// CoinGecko API for exchange rates (fallback)
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Exchange rate cache configuration
const EXCHANGE_RATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let exchangeRateCache = {
  rate: null,
  timestamp: null,
  validUntil: null
};

// Monero configuration
const MONERO_REQUIRED_CONFIRMATIONS = 10;
const MONERO_PAYMENT_WINDOW_HOURS = 24;
const MONERO_CURRENCY_CODE = 'xmr';

class NowPaymentsService {
  constructor() {
    this.apiKey = NOWPAYMENTS_API_KEY;
    this.ipnSecret = NOWPAYMENTS_IPN_SECRET;
    this.baseURL = NOWPAYMENTS_API_URL;
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
   * Fetch current XMR/GBP exchange rate using NowPayments estimate endpoint
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

      // Fetch fresh rate from NowPayments estimate endpoint
      const response = await axios.get(`${this.baseURL}/estimate`, {
        params: {
          amount: 1,
          currency_from: 'gbp',
          currency_to: MONERO_CURRENCY_CODE
        },
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 10000
      });

      if (!response.data || !response.data.estimated_amount) {
        // Fallback to CoinGecko if NowPayments estimate fails
        return await this.getExchangeRateFromCoinGecko();
      }

      const gbpToXmr = parseFloat(response.data.estimated_amount);
      
      // Validate the exchange rate
      if (!gbpToXmr || gbpToXmr <= 0 || !isFinite(gbpToXmr)) {
        throw new Error('Invalid exchange rate received from NowPayments API');
      }
      
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
      logError(error, { context: 'nowpayments_exchange_rate_fetch' });
      
      // Try CoinGecko as fallback
      try {
        return await this.getExchangeRateFromCoinGecko();
      } catch (fallbackError) {
        logError(fallbackError, { context: 'coingecko_exchange_rate_fallback' });
        
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
  }

  /**
   * Fallback method to get exchange rate from CoinGecko
   * @returns {Promise<{rate: number, validUntil: Date}>}
   */
  async getExchangeRateFromCoinGecko() {
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
      throw new Error('Invalid exchange rate received from CoinGecko API');
    }
    
    const gbpToXmr = 1 / xmrToGbp;
    const now = Date.now();
    const validUntil = now + EXCHANGE_RATE_CACHE_DURATION;

    // Update cache
    exchangeRateCache = {
      rate: gbpToXmr,
      timestamp: now,
      validUntil: validUntil
    };

    logger.info(`Monero exchange rate updated from CoinGecko: 1 GBP = ${gbpToXmr.toFixed(8)} XMR`);

    return {
      rate: gbpToXmr,
      validUntil: new Date(validUntil)
    };
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
   * Create a new Monero payment request via NowPayments
   * @param {Object} paymentData - Payment request data
   * @returns {Promise<Object>} - NowPayments payment response
   */
  async createPaymentRequest(paymentData) {
    try {
      if (!this.apiKey) {
        throw new Error('NowPayments API key not configured');
      }

      const { orderId, amount, currency = 'GBP', customerEmail } = paymentData;

      // First, get an estimate to determine the XMR amount
      const estimateResponse = await axios.get(`${this.baseURL}/estimate`, {
        params: {
          amount: amount,
          currency_from: currency.toLowerCase(),
          currency_to: MONERO_CURRENCY_CODE
        },
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 10000
      });

      if (!estimateResponse.data || !estimateResponse.data.estimated_amount) {
        throw new Error('Unable to get payment estimate from NowPayments');
      }

      const xmrAmount = parseFloat(estimateResponse.data.estimated_amount);

      // Create the payment request payload
      const paymentRequestData = {
        pay_amount: xmrAmount,
        pay_currency: MONERO_CURRENCY_CODE,
        order_id: orderId,
        order_description: `Graphene Security Order ${orderId}`,
        success_url: `${process.env.FRONTEND_URL}/order-confirmation/${orderId}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout`,
        ipn_callback_url: `${process.env.BACKEND_URL}/api/payments/monero/webhook`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false
      };

      // Add customer email if provided
      if (customerEmail) {
        paymentRequestData.customer_email = customerEmail;
      }

      const response = await axios.post(`${this.baseURL}/payment`, paymentRequestData, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (!response.data || !response.data.pay_address) {
        throw new Error('Invalid response from NowPayments API');
      }

      const responseData = response.data;
      
      return {
        paymentId: responseData.payment_id,
        address: responseData.pay_address,
        amount: responseData.pay_amount,
        currency: responseData.pay_currency.toUpperCase(),
        expirationTime: new Date(Date.now() + (MONERO_PAYMENT_WINDOW_HOURS * 60 * 60 * 1000)),
        paymentUrl: responseData.invoice_url || null,
        status: this.mapNowPaymentsStatus(responseData.payment_status),
        expectedAmount: responseData.pay_amount,
        priceAmount: responseData.price_amount,
        priceCurrency: responseData.price_currency
      };
    } catch (error) {
      logError(error, { context: 'nowpayments_payment_request', orderId: paymentData.orderId });
      
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message || error.response.data.error || error.response.statusText;
        throw new Error(`NowPayments API error: ${errorMessage}`);
      }
      
      throw new Error(`Failed to create Monero payment request: ${error.message}`);
    }
  }

  /**
   * Get payment status from NowPayments
   * @param {string} paymentId - NowPayments payment ID
   * @returns {Promise<Object>} - Payment status information
   */
  async getPaymentStatus(paymentId) {
    try {
      if (!this.apiKey) {
        throw new Error('NowPayments API key not configured');
      }

      const response = await axios.get(`${this.baseURL}/payment/${paymentId}`, {
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 10000
      });

      const paymentData = response.data;

      return {
        id: paymentData.payment_id,
        status: this.mapNowPaymentsStatus(paymentData.payment_status),
        confirmations: paymentData.outcome ? paymentData.outcome.confirmations || 0 : 0,
        paid_amount: paymentData.actually_paid || 0,
        payment_address: paymentData.pay_address,
        transaction_hash: paymentData.outcome ? paymentData.outcome.hash : null,
        created_at: paymentData.created_at,
        updated_at: paymentData.updated_at,
        expires_at: paymentData.time_limit ? new Date(paymentData.created_at + paymentData.time_limit * 1000) : null,
        expected_amount: paymentData.pay_amount,
        price_amount: paymentData.price_amount,
        price_currency: paymentData.price_currency
      };
    } catch (error) {
      logError(error, { context: 'nowpayments_payment_status', paymentId });
      
      if (error.response && error.response.status === 404) {
        throw new Error('Payment not found');
      }
      
      throw new Error(`Unable to fetch payment status: ${error.message}`);
    }
  }

  /**
   * Map NowPayments status to our internal status
   * @param {string} nowPaymentsStatus - Status from NowPayments
   * @returns {string} - Mapped status
   */
  mapNowPaymentsStatus(nowPaymentsStatus) {
    const statusMap = {
      'waiting': 'pending',
      'confirming': 'partially_confirmed',
      'confirmed': 'confirmed',
      'sending': 'confirmed',
      'partially_paid': 'underpaid',
      'finished': 'confirmed',
      'failed': 'failed',
      'refunded': 'failed',
      'expired': 'failed'
    };

    return statusMap[nowPaymentsStatus] || 'pending';
  }

  /**
   * Verify NowPayments IPN signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - NowPayments signature header
   * @returns {boolean} - Whether signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.ipnSecret) {
        throw new Error('NowPayments IPN secret not configured');
      }

      const expectedSignature = crypto
        .createHmac('sha512', this.ipnSecret)
        .update(payload)
        .digest('hex');

      // Handle missing or invalid signatures
      if (!signature) {
        return false;
      }
      
      // Ensure both signatures are same length for timing safe comparison
      if (signature.length !== expectedSignature.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logError(error, { context: 'nowpayments_webhook_signature_verification' });
      return false;
    }
  }

  /**
   * Process NowPayments IPN notification
   * @param {Object} webhookData - Webhook payload from NowPayments
   * @returns {Object} - Processed payment information
   */
  processWebhookNotification(webhookData) {
    const {
      payment_id: paymentId,
      payment_status,
      actually_paid,
      pay_amount: expectedAmount,
      outcome,
      order_id: orderId
    } = webhookData;

    const confirmations = outcome ? (outcome.confirmations || 0) : 0;
    const transactionHash = outcome ? outcome.hash : null;

    // Map NowPayments status to our internal status
    const mappedStatus = this.mapNowPaymentsStatus(payment_status);
    
    // Determine final payment status based on confirmations for Monero
    let paymentStatus = mappedStatus;
    
    if (payment_status === 'confirmed' && confirmations >= MONERO_REQUIRED_CONFIRMATIONS) {
      paymentStatus = 'confirmed';
    } else if (payment_status === 'confirmed' && confirmations > 0) {
      paymentStatus = 'partially_confirmed';
    } else if (payment_status === 'partially_paid') {
      paymentStatus = 'underpaid';
    } else if (['failed', 'refunded', 'expired'].includes(payment_status)) {
      paymentStatus = 'failed';
    }

    return {
      paymentId,
      orderId,
      status: paymentStatus,
      confirmations,
      paidAmount: actually_paid || 0,
      expectedAmount: expectedAmount,
      transactionHash,
      isFullyConfirmed: confirmations >= MONERO_REQUIRED_CONFIRMATIONS,
      requiresAction: paymentStatus === 'underpaid' || paymentStatus === 'failed',
      originalStatus: payment_status
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

  /**
   * Get supported currencies from NowPayments
   * @returns {Promise<Array>} - List of supported currencies
   */
  async getSupportedCurrencies() {
    try {
      const response = await axios.get(`${this.baseURL}/currencies`, {
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 10000
      });

      return response.data.currencies || [];
    } catch (error) {
      logError(error, { context: 'nowpayments_supported_currencies' });
      // Return Monero as fallback
      return ['xmr'];
    }
  }

  /**
   * Get minimum payment amount for XMR
   * @returns {Promise<number>} - Minimum payment amount
   */
  async getMinimumPaymentAmount() {
    try {
      const response = await axios.get(`${this.baseURL}/min-amount`, {
        params: {
          currency_from: 'gbp',
          currency_to: MONERO_CURRENCY_CODE
        },
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 10000
      });

      return parseFloat(response.data.min_amount) || 0.001; // Fallback to 0.001 XMR
    } catch (error) {
      logError(error, { context: 'nowpayments_minimum_amount' });
      return 0.001; // Fallback minimum
    }
  }
}

// Export singleton instance
const nowPaymentsService = new NowPaymentsService();
export default nowPaymentsService;