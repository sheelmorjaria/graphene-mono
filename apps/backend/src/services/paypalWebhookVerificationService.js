// PayPal webhook signature verification via PayPal's REST API
// (POST /v1/notifications/verify-webhook-signature). The SDK v1.x ships no
// controller for this, so it is implemented directly.
//
// FAIL CLOSED by design: missing config, missing transmission headers, or any
// upstream error rejects the event. A forged "payment completed" webhook must
// never mark an order paid.

const REQUIRED_HEADERS = [
  'paypal-auth-algo',
  'paypal-cert-url',
  'paypal-transmission-id',
  'paypal-transmission-sig',
  'paypal-transmission-time'
];

const apiBase = () =>
  process.env.PAYPAL_ENVIRONMENT === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const getAccessToken = async () => {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`PayPal token request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.access_token;
};

// Each webhook SUBSCRIPTION has its own ID (PayPal issues one per app+URL):
// callers pass theirs — orders use PAYPAL_WEBHOOK_ID, flash orders use
// PAYPAL_FLASH_WEBHOOK_ID.
export const verifyPayPalWebhookSignature = async ({ headers = {}, event, webhookId }) => {
  if (!webhookId) {
    return { verified: false, reason: 'Webhook ID is not configured for this endpoint' };
  }

  const missing = REQUIRED_HEADERS.filter((name) => !headers[name]);
  if (missing.length > 0) {
    return { verified: false, reason: `Missing PayPal transmission headers: ${missing.join(', ')}` };
  }

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${apiBase()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        event,
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time']
      })
    });

    if (!response.ok) {
      return { verified: false, reason: `PayPal verification request failed: ${response.status}` };
    }

    const payload = await response.json();
    if (payload.verification_status === 'SUCCESS') {
      return { verified: true };
    }
    return { verified: false, reason: `PayPal verification status: ${payload.verification_status}` };
  } catch (error) {
    return { verified: false, reason: error.message };
  }
};
