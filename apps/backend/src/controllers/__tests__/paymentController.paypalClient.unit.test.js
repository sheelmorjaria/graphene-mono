import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// Deliberately NO SDK mock — every other suite mocks '@paypal/paypal-server-sdk'
// with a v0.x-era shape (Client exposing .ordersController/.paymentsController),
// which hid the production 503 "Cannot read properties of undefined (reading
// 'ordersCreate')". SDK v1.x ships controllers as standalone classes that take
// the client in their constructor. This test exercises the REAL package.
import { OrdersController, PaymentsController } from '@paypal/paypal-server-sdk';
import { getPayPalClient } from '../paymentController.js';

describe('getPayPalClient — real SDK v1.x shape (no mocks)', () => {
  beforeEach(() => {
    vi.stubEnv('PAYPAL_CLIENT_ID', 'test-client-id');
    vi.stubEnv('PAYPAL_CLIENT_SECRET', 'test-client-secret');
    vi.stubEnv('PAYPAL_ENVIRONMENT', 'sandbox');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes working orders and payments controllers', () => {
    const paypalClient = getPayPalClient();

    expect(paypalClient).not.toBeNull();
    expect(paypalClient.ordersController).toBeInstanceOf(OrdersController);
    expect(typeof paypalClient.ordersController.createOrder).toBe('function');
    expect(typeof paypalClient.ordersController.captureOrder).toBe('function');
    expect(paypalClient.paymentsController).toBeInstanceOf(PaymentsController);
    expect(typeof paypalClient.paymentsController.refundCapturedPayment).toBe('function');
  });

  it('builds a fresh client per call (controllers never share stale creds)', () => {
    const first = getPayPalClient();
    const second = getPayPalClient();

    expect(first).not.toBe(second);
    expect(first.ordersController).not.toBe(second.ordersController);
  });

  it('returns null when either credential is missing', () => {
    vi.stubEnv('PAYPAL_CLIENT_ID', '');
    expect(getPayPalClient()).toBeNull();

    vi.stubEnv('PAYPAL_CLIENT_ID', 'test-client-id');
    vi.stubEnv('PAYPAL_CLIENT_SECRET', '');
    expect(getPayPalClient()).toBeNull();
  });
});
