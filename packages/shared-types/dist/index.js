"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STOCK_STATUSES = exports.PRODUCT_CONDITIONS = exports.ORDER_STATUSES = exports.PAYMENT_METHODS = void 0;
// Constants
exports.PAYMENT_METHODS = ['paypal', 'bitcoin', 'monero'];
exports.ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
exports.PRODUCT_CONDITIONS = ['new', 'excellent', 'good', 'fair'];
exports.STOCK_STATUSES = ['in_stock', 'out_of_stock', 'low_stock'];
