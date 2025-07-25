import axios from 'axios';
import logger, { logError } from '../utils/logger.js';

class PayPalService {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.baseURL = process.env.PAYPAL_ENVIRONMENT === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
      
      logger.info('PayPal access token obtained');
      return this.accessToken;
    } catch (error) {
      logError(error, { context: 'paypal_auth' });
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  async createOrder(amount, currency = 'GBP', orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const order = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }],
        application_context: {
          brand_name: 'Graphene Security',
          landing_page: 'NO_PREFERENCE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        order,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('PayPal order created', { orderId: response.data.id });
      return response.data;
    } catch (error) {
      logError(error, { context: 'paypal_create_order', orderId });
      throw new Error('Failed to create PayPal order');
    }
  }

  async captureOrder(paypalOrderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${paypalOrderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('PayPal order captured', { orderId: paypalOrderId });
      return response.data;
    } catch (error) {
      logError(error, { context: 'paypal_capture_order', orderId: paypalOrderId });
      throw new Error('Failed to capture PayPal order');
    }
  }

  async refundPayment(captureId, amount, currency = 'GBP') {
    try {
      const accessToken = await this.getAccessToken();
      
      const refundData = amount ? {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        }
      } : {};

      const response = await axios.post(
        `${this.baseURL}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('PayPal refund processed', { captureId, refundId: response.data.id });
      return response.data;
    } catch (error) {
      logError(error, { context: 'paypal_refund', captureId });
      throw new Error('Failed to process PayPal refund');
    }
  }

  async getOrderDetails(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logError(error, { context: 'paypal_get_order', orderId });
      throw new Error('Failed to get PayPal order details');
    }
  }

  async verifyWebhookSignature(headers, body, webhookId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const verificationData = {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: body
      };

      const response = await axios.post(
        `${this.baseURL}/v1/notifications/verify-webhook-signature`,
        verificationData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.verification_status === 'SUCCESS';
    } catch (error) {
      logError(error, { context: 'paypal_verify_webhook' });
      return false;
    }
  }
}

export default new PayPalService();