import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// Deliberately NO SDK mock — every other suite mocks '@paypal/paypal-server-sdk'
// with a v0.x-era shape (Client exposing .ordersController/.paymentsController),
// which hid the production 503 "Cannot read properties of undefined (reading
// 'ordersCreate')". SDK v1.x ships controllers as standalone classes that take
// the client in their constructor. This test exercises the REAL package.
import {
  OrdersController,
  PaymentsController,
  ArgumentsValidationError
} from '@paypal/paypal-server-sdk';
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

  // SDK v1.x validates request bodies against camelCase JS schemas BEFORE any
  // network call (wire format is still snake_case — the SDK serializes). A body
  // the SDK rejects with ArgumentsValidationError never reaches PayPal, which is
  // exactly the prod failure "Some properties are missing: purchaseUnits".
  describe('request-body schema contract (camelCase in)', () => {
    const captureError = (promise) => promise.then(() => null, (e) => e);

    it('validates the camelCase create-order body and moves past schema checks', async () => {
      const { ordersController } = getPayPalClient();
      const error = await captureError(ordersController.createOrder({
        body: {
          intent: 'CAPTURE',
          purchaseUnits: [{
            customId: 'checkout-ref',
            amount: {
              currencyCode: 'GBP',
              value: '285.45',
              breakdown: {
                itemTotal: { currencyCode: 'GBP', value: '265.00' },
                shipping: { currencyCode: 'GBP', value: '20.45' }
              }
            },
            items: [{ name: 'Pixel 7A', unitAmount: { currencyCode: 'GBP', value: '265.00' }, quantity: '1' }],
            shipping: {
              name: { fullName: 'Test Buyer' },
              address: {
                addressLine1: '1 Main St',
                adminArea2: 'London',
                adminArea1: 'London',
                postalCode: 'W1 1AA',
                countryCode: 'GB'
              }
            }
          }],
          applicationContext: {
            brandName: 'Graphene Security',
            landingPage: 'NO_PREFERENCE',
            userAction: 'PAY_NOW',
            returnUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel'
          }
        }
      }));

      // Dummy creds → the call fails at auth/network, but NOT at validation.
      expect(error).not.toBeNull();
      expect(error).not.toBeInstanceOf(ArgumentsValidationError);
    });

    it('rejects a snake_case create-order body with ArgumentsValidationError pre-network', async () => {
      const { ordersController } = getPayPalClient();
      const error = await captureError(ordersController.createOrder({
        body: {
          intent: 'CAPTURE',
          purchase_units: [{ amount: { currency_code: 'GBP', value: '1.00' } }],
          application_context: { return_url: 'https://example.com/success' }
        }
      }));

      expect(error).toBeInstanceOf(ArgumentsValidationError);
    });

    it('validates the camelCase refund body and rejects snake_case amounts', async () => {
      const { paymentsController } = getPayPalClient();

      const camel = await captureError(paymentsController.refundCapturedPayment({
        captureId: 'CAP-123',
        body: { amount: { currencyCode: 'GBP', value: '285.45' } }
      }));
      expect(camel).not.toBeNull();
      expect(camel).not.toBeInstanceOf(ArgumentsValidationError);

      const snake = await captureError(paymentsController.refundCapturedPayment({
        captureId: 'CAP-123',
        body: { amount: { currency_code: 'GBP', value: '285.45' } }
      }));
      expect(snake).toBeInstanceOf(ArgumentsValidationError);
    });
  });
});
