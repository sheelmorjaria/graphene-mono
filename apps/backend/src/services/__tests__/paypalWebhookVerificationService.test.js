import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifyPayPalWebhookSignature } from '../paypalWebhookVerificationService.js';

// Webhook signature verification is the ONLY thing standing between a forged
// "payment completed" event and a free phone / flashing service. It must
// fail CLOSED: missing config, missing headers, PayPal errors — all reject.

const validHeaders = {
  'paypal-auth-algo': 'SHA256withRSA',
  'paypal-cert-url': 'https://api-m.sandbox.paypal.com/cert',
  'paypal-transmission-id': 'trans-123',
  'paypal-transmission-sig': 'sig-abc',
  'paypal-transmission-time': '2026-09-15T00:00:00Z'
};

const baseEnv = { ...process.env };

describe('verifyPayPalWebhookSignature', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.PAYPAL_CLIENT_ID = 'client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
    process.env.PAYPAL_WEBHOOK_ID = 'webhook-id-1';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.PAYPAL_CLIENT_ID = baseEnv.PAYPAL_CLIENT_ID;
    process.env.PAYPAL_CLIENT_SECRET = baseEnv.PAYPAL_CLIENT_SECRET;
    process.env.PAYPAL_ENVIRONMENT = baseEnv.PAYPAL_ENVIRONMENT;
    process.env.PAYPAL_WEBHOOK_ID = baseEnv.PAYPAL_WEBHOOK_ID;
  });

  it('fails closed when no webhook ID is provided for the endpoint', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const result = await verifyPayPalWebhookSignature({ headers: validHeaders, event: {} });

    expect(result.verified).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when PayPal transmission headers are missing', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const result = await verifyPayPalWebhookSignature({ headers: {}, event: {} });

    expect(result.verified).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('calls PayPal verify with the webhook id, event and header values', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ verification_status: 'SUCCESS' }) });
    global.fetch = fetchMock;
    const event = { id: 'evt-1', event_type: 'PAYMENT.CAPTURE.COMPLETED' };

    const result = await verifyPayPalWebhookSignature({ headers: validHeaders, event, webhookId: 'webhook-id-1' });

    expect(result.verified).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [verifyUrl, verifyOptions] = fetchMock.mock.calls[1];
    expect(verifyUrl).toContain('api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature');
    expect(verifyOptions.headers.Authorization).toBe('Bearer token-1');
    expect(JSON.parse(verifyOptions.body)).toEqual({
      webhook_id: 'webhook-id-1',
      event,
      auth_algo: 'SHA256withRSA',
      cert_url: 'https://api-m.sandbox.paypal.com/cert',
      transmission_id: 'trans-123',
      transmission_sig: 'sig-abc',
      transmission_time: '2026-09-15T00:00:00Z'
    });
  });

  it('rejects when PayPal says the signature is invalid', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ verification_status: 'FAILURE' }) });
    global.fetch = fetchMock;

    const result = await verifyPayPalWebhookSignature({ headers: validHeaders, event: {}, webhookId: 'webhook-id-1' });

    expect(result.verified).toBe(false);
  });

  it('rejects when the token or verify call errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    const result = await verifyPayPalWebhookSignature({ headers: validHeaders, event: {}, webhookId: 'webhook-id-1' });

    expect(result.verified).toBe(false);
  });

  it('targets the live API when PAYPAL_ENVIRONMENT=live', async () => {
    process.env.PAYPAL_ENVIRONMENT = 'live';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ verification_status: 'SUCCESS' }) });
    global.fetch = fetchMock;

    await verifyPayPalWebhookSignature({ headers: validHeaders, event: {}, webhookId: 'webhook-id-1' });

    expect(fetchMock.mock.calls[1][0]).toContain('api-m.paypal.com');
  });
});
