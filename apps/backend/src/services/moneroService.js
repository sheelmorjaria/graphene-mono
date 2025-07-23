import nowPaymentsService from './nowPaymentsService.js';
import logger from '../utils/logger.js';

// Legacy wrapper for backward compatibility
// This service now uses NowPayments.io instead of GloBee

/**
 * Legacy MoneroService wrapper for backward compatibility
 * Now uses NowPayments.io instead of GloBee
 */
class MoneroService {
  constructor() {
    // Delegate all operations to the new NowPayments service
    this.nowPayments = nowPaymentsService;
  }

  // For testing purposes, expose cache
  get exchangeRateCache() {
    return this.nowPayments.exchangeRateCache;
  }

  set exchangeRateCache(value) {
    this.nowPayments.exchangeRateCache = value;
  }

  /**
   * Fetch current XMR/GBP exchange rate (now via NowPayments)
   * @returns {Promise<{rate: number, validUntil: Date}>}
   */
  async getExchangeRate() {
    return await this.nowPayments.getExchangeRate();
  }

  /**
   * Convert GBP amount to XMR using current exchange rate
   * @param {number} gbpAmount - Amount in GBP
   * @returns {Promise<{xmrAmount: number, exchangeRate: number, validUntil: Date}>}
   */
  async convertGbpToXmr(gbpAmount) {
    return await this.nowPayments.convertGbpToXmr(gbpAmount);
  }

  /**
   * Create a new Monero payment request (now via NowPayments)
   * @param {Object} paymentData - Payment request data
   * @returns {Promise<Object>} - Payment response
   */
  async createPaymentRequest(paymentData) {
    // Map the data format to maintain backward compatibility
    const nowPaymentsData = {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: 'GBP', // NowPayments expects source currency
      customerEmail: paymentData.customerEmail
    };
    
    const result = await this.nowPayments.createPaymentRequest(nowPaymentsData);
    
    // Map response format for backward compatibility
    return {
      paymentId: result.paymentId,
      address: result.address,
      amount: result.amount,
      currency: result.currency,
      expirationTime: result.expirationTime,
      paymentUrl: result.paymentUrl,
      status: result.status
    };
  }

  /**
   * Get payment status (now from NowPayments)
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} - Payment status information
   */
  async getPaymentStatus(paymentId) {
    const result = await this.nowPayments.getPaymentStatus(paymentId);
    
    // Map response format for backward compatibility
    return {
      id: result.id,
      status: result.status,
      confirmations: result.confirmations,
      paid_amount: result.paid_amount,
      transaction_hash: result.transaction_hash,
      payment_address: result.payment_address,
      created_at: result.created_at,
      expires_at: result.expires_at
    };
  }

  /**
   * Verify webhook signature (now NowPayments IPN)
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Signature header
   * @returns {boolean} - Whether signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    return this.nowPayments.verifyWebhookSignature(payload, signature);
  }

  /**
   * Process webhook notification (now NowPayments IPN)
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} - Processed payment information
   */
  processWebhookNotification(webhookData) {
    const result = this.nowPayments.processWebhookNotification(webhookData);
    
    // Map response format for backward compatibility
    return {
      paymentId: result.paymentId,
      orderId: result.orderId,
      status: result.status,
      confirmations: result.confirmations,
      paidAmount: result.paidAmount,
      totalAmount: result.expectedAmount, // Map expectedAmount to totalAmount
      transactionHash: result.transactionHash,
      isFullyConfirmed: result.isFullyConfirmed,
      requiresAction: result.requiresAction
    };
  }

  /**
   * Check if a payment window has expired
   * @param {Date} createdAt - When the payment was created
   * @returns {boolean} - Whether the payment window has expired
   */
  isPaymentExpired(createdAt) {
    return this.nowPayments.isPaymentExpired(createdAt);
  }

  /**
   * Calculate Monero payment expiration time
   * @param {Date} createdAt - When the payment was created
   * @returns {Date} - Expiration time
   */
  getPaymentExpirationTime(createdAt = new Date()) {
    return this.nowPayments.getPaymentExpirationTime(createdAt);
  }

  /**
   * Get required confirmations for Monero
   * @returns {number} - Number of required confirmations
   */
  getRequiredConfirmations() {
    return this.nowPayments.getRequiredConfirmations();
  }

  /**
   * Get payment window duration in hours
   * @returns {number} - Payment window in hours
   */
  getPaymentWindowHours() {
    return this.nowPayments.getPaymentWindowHours();
  }

  /**
   * Format XMR amount for display
   * @param {number} amount - XMR amount
   * @returns {string} - Formatted amount
   */
  formatXmrAmount(amount) {
    return this.nowPayments.formatXmrAmount(amount);
  }
}

// Export singleton instance
const moneroService = new MoneroService();
export default moneroService;