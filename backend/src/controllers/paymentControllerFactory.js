import { PaymentController } from './PaymentController.class.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import bitcoinService from '../services/bitcoinService.js';
import moneroService from '../services/moneroService.js';
import paypalService from '../services/paypalService.js';
import emailService from '../services/emailService.js';
import logger, { logError, logPaymentEvent } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Factory function to create PaymentController with production dependencies
 */
export function createPaymentController(overrides = {}) {
  const dependencies = {
    models: {
      Cart,
      Product,
      Order,
    },
    services: {
      bitcoinService,
      moneroService,
      paypalService,
      emailService,
    },
    database: {
      mongoose,
      startSession: () => mongoose.startSession(),
    },
    logger,
    logError,
    logPaymentEvent,
    ...overrides
  };

  return new PaymentController(dependencies);
}

// Create the default instance
export const paymentController = createPaymentController();

// Export individual controller methods for backward compatibility
export const getPaymentMethods = (req, res) => paymentController.getPaymentMethods(req, res);
export const createPayPalOrder = (req, res) => paymentController.createPayPalOrder(req, res);
export const initializeBitcoinPayment = (req, res) => paymentController.initializeBitcoinPayment(req, res);
export const createMoneroPayment = (req, res) => paymentController.createMoneroPayment(req, res);