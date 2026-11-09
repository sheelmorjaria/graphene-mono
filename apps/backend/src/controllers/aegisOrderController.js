import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailService from '../services/emailService.js';
import AegisOrder from '../models/AegisOrder.js';
import Product from '../models/Product.js';
import { getPayPalClient } from './paymentController.js';
import { verifyPayPalWebhookSignature } from '../services/paypalWebhookVerificationService.js';
import logger, { logError, logPaymentEvent } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fixed licence price — single tier, digital delivery, no shipping component.
export const AEGIS_PRICE_GBP = 99.00;

// Automated delivery: the installer kit (built Aegis engine + setup guide,
// zipped) is served from disk. Rebuild/replace the file to ship a new
// version — every paid order's download link serves the current file.
// Resolution order: AEGIS_KIT_PATH env, the repo layout (dev), then the
// container layout — CapRover builds copy apps/backend to /app, which puts
// the artefacts at /app/aegis-kit.
const KIT_FILENAME = 'aegis-installer-kit.zip';
const kitCandidates = () => [
  path.resolve(__dirname, '../..', 'aegis-kit', KIT_FILENAME),        // backend dir (dev + backend-context builds)
  path.resolve(__dirname, '../../../..', 'aegis-kit', KIT_FILENAME), // repo layout (legacy)
  `/app/aegis-kit/${KIT_FILENAME}`                                   // container fallback
];

export const getAegisKitPath = () => {
  if (process.env.AEGIS_KIT_PATH) return process.env.AEGIS_KIT_PATH;
  const candidates = kitCandidates();
  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
};

// The raw signed APK (kept alongside the kit zip by build-kit.sh) — served
// to the web installer for streaming install.
export const getAegisApkPath = () => {
  if (process.env.AEGIS_APK_PATH) return process.env.AEGIS_APK_PATH;
  const kitDir = path.dirname(getAegisKitPath());
  const apk = path.join(kitDir, 'aegis-engine.apk');
  if (fs.existsSync(apk)) return apk;
  return '/app/aegis-kit/aegis-engine.apk';
};

export const getAegisKitFilename = () => path.basename(getAegisKitPath());

// Absolute download URL for emails. BACKEND_URL is the public API origin
// (same env the rest of the app uses for absolute links).
export const aegisDownloadUrlFor = (token) =>
  `${(process.env.BACKEND_URL || 'https://api.graphene-security.com').replace(/\/$/, '')}/api/aegis-orders/download/${token}`;

// Deep link into the web installer with the licence token pre-filled
export const aegisInstallerUrlFor = (token) =>
  `${(process.env.FRONTEND_URL || 'https://graphene-security.com').replace(/\/$/, '')}/aegis/installer?token=${token}`;

const generateDownloadToken = () => crypto.randomBytes(24).toString('base64url');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Naturally sort bare catalog baseModels ("7" < "7 Pro" < "7A" < "10 Pro Fold"
// < "Fold") so the dropdown reads in model order, not ASCII order.
const modelSortKey = (model) => {
  const leadingNumber = model.match(/^(\d+)/);
  if (!leadingNumber) return [9999, model]; // "Fold" sorts after numbered models
  return [Number(leadingNumber[1]), model];
};

/**
 * GET /api/aegis-orders/models
 * Catalog-driven device list for the Aegis purchase dropdown: the store's
 * live baseModels (kept current by the daily price sync), not a hardcoded
 * copy that would drift from the catalog.
 */
export const getAegisModels = async (req, res) => {
  try {
    const baseModels = await Product.distinct('baseModel', { isActive: true });

    const models = baseModels
      .filter(Boolean)
      .sort((a, b) => {
        const [numA, restA] = modelSortKey(a);
        const [numB, restB] = modelSortKey(b);
        return numA - numB || restA.localeCompare(restB);
      })
      .map((baseModel) => ({ value: baseModel, label: `Pixel ${baseModel}` }));

    res.json({ success: true, data: { models } });
  } catch (error) {
    logError(error, { context: 'aegis_models_list' });
    res.status(500).json({ success: false, error: 'Server error occurred while fetching supported models' });
  }
};

/**
 * Create a new Aegis Order
 * POST /api/aegis-orders
 */
export const createAegisOrder = async (req, res) => {
  try {
    const { customerEmail, pixelModel } = req.body;

    if (!customerEmail || !pixelModel) {
      return res.status(400).json({
        success: false,
        error: 'Customer email and Pixel model are required'
      });
    }

    const email = String(customerEmail).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required'
      });
    }

    // Validate the model against the live catalog (not a hardcoded list)
    const model = String(pixelModel).trim();
    const stocked = await Product.exists({ baseModel: model, isActive: true });
    if (!stocked) {
      return res.status(400).json({
        success: false,
        error: `Invalid Pixel model. Only currently stocked models are accepted. Received: ${model}`
      });
    }

    const order = new AegisOrder({
      customerEmail: email,
      pixelModel: model,
      amountGbp: AEGIS_PRICE_GBP
    });

    await order.save();

    logPaymentEvent('aegis_order_created', { orderId: order._id, orderNumber: order.orderNumber, pixelModel: model });

    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        pixelModel: order.pixelModel,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        amountGbp: order.amountGbp,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    logError(error, { context: 'aegis_order_creation' });

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: 'Server error occurred while creating Aegis order' });
  }
};

/**
 * Handle PayPal webhook for Aegis Orders
 * POST /api/aegis-orders/paypal-webhook
 */
export const handleAegisOrderWebhook = async (req, res) => {
  try {
    // Signature verification fails CLOSED (mirrors the flash order webhook).
    const verification = await verifyPayPalWebhookSignature({ headers: req.headers, event: req.body, webhookId: process.env.PAYPAL_AEGIS_WEBHOOK_ID });
    if (!verification.verified) {
      logError(new Error(verification.reason), { context: 'aegis_webhook_signature_rejected' });
      return res.status(401).json({ error: 'Webhook signature verification failed' });
    }

    const webhookEvent = req.body;
    const eventType = webhookEvent.event_type;

    logPaymentEvent('aegis_order_webhook_received', { eventType });

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleAegisPaymentCaptureCompleted(webhookEvent);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handleAegisPaymentCaptureDenied(webhookEvent);
        break;

      default:
        logger.warn(`Unhandled Aegis Order webhook event: ${eventType}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    logError(error, { context: 'aegis_order_webhook_processing' });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle successful payment capture for Aegis Order
 */
const handleAegisPaymentCaptureCompleted = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id; // Aegis Order ID
    const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;
    const captureId = resource.id;
    const payerEmail = resource.payer?.email_address;
    const amount = resource.amount?.value;

    if (!customId) {
      logger.warn('Aegis Order webhook missing custom_id');
      return;
    }

    // PayPal routes webhooks by EVENT TYPE, not by flow — every subscription
    // receives every PAYMENT.CAPTURE.COMPLETED of the app. Anything that
    // isn't a bare 24-hex ObjectId is not one of ours; ignore quietly
    // (store checkout uses JSON refs, flash orders use their own ObjectIds —
    // findById would throw a CastError or hit the wrong collection).
    if (!/^[0-9a-fA-F]{24}$/.test(customId)) {
      logger.info('Aegis Order webhook custom_id is not an Aegis order reference — ignoring event', { customId });
      return;
    }

    const order = await AegisOrder.findById(customId);

    // Refund guard: a retried/delayed CAPTURE.COMPLETED must never resurrect
    // a refunded order.
    if (order?.paymentStatus === 'Refunded') {
      logger.warn('Ignoring CAPTURE.COMPLETED for refunded Aegis Order', { orderId: order._id });
      return;
    }

    // Retry idempotency: already processed this exact capture — skip
    if (order?.paymentStatus === 'Completed' && order.paymentDetails?.paypalTransactionId === captureId) {
      logger.info('Aegis Order capture already processed — skipping webhook replay', { orderId: order._id });
      return;
    }
    if (!order) {
      logger.warn(`Aegis Order not found for webhook: ${customId}`);
      return;
    }

    order.paymentStatus = 'Completed';
    order.orderStatus = 'Paid';
    order.paymentDetails = {
      ...order.paymentDetails,
      paypalOrderId: paypalOrderId || order.paymentDetails.paypalOrderId,
      paypalTransactionId: captureId,
      paypalPayerEmail: payerEmail
    };

    // Automated delivery: mint the download token at first payment
    if (!order.downloadToken) {
      order.downloadToken = generateDownloadToken();
    }

    order.statusHistory.push({
      status: 'Paid',
      timestamp: new Date(),
      note: 'Payment received via PayPal'
    });

    await order.save();

    // Confirmation email AFTER the save so the licence email reflects a
    // persisted Paid order; the capture endpoint's early-return for
    // already-Completed orders means no double-send between the two paths.
    try {
      await emailService.sendAegisOrderConfirmationEmail(order, {
        downloadUrl: aegisDownloadUrlFor(order.downloadToken),
        installUrl: aegisInstallerUrlFor(order.downloadToken)
      });
    } catch (emailError) {
      logError(emailError, { context: 'aegis_webhook_confirmation_email', orderId: order._id });
    }

    logPaymentEvent('aegis_order_payment_completed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paypalOrderId,
      amount
    });

  } catch (error) {
    logError(error, { context: 'aegis_payment_capture_completed_handler' });
  }
};

/**
 * Handle denied payment capture for Aegis Order
 * Note: We don't update the order status - customer can try payment again
 */
const handleAegisPaymentCaptureDenied = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    if (!customId) {
      return;
    }

    // Same event-type routing as the completed handler
    if (!/^[0-9a-fA-F]{24}$/.test(customId)) {
      return;
    }

    const order = await AegisOrder.findById(customId);
    if (!order) {
      return;
    }

    logPaymentEvent('aegis_order_payment_denied', { orderId: order._id });

  } catch (error) {
    logError(error, { context: 'aegis_payment_capture_denied_handler' });
  }
};

/**
 * GET /api/aegis-orders/:id/summary
 * Lightweight public summary (by unguessable order id, same auth level as the
 * rest of this flow) for the payment step.
 */
export const getAegisOrderSummary = async (req, res) => {
  try {
    const order = await AegisOrder.findById(req.params.id)
      .select('orderNumber pixelModel amountGbp paymentStatus orderStatus createdAt');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Aegis order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logError(error, { context: 'aegis_order_summary' });
    res.status(500).json({ success: false, error: 'Server error occurred while fetching Aegis order' });
  }
};

/**
 * POST /api/aegis-orders/:id/paypal/create-order
 * Server-side PayPal order for the Aegis licence (mirrors the flash flow —
 * the client never handles amounts).
 */
export const createAegisOrderPayPalOrder = async (req, res) => {
  try {
    const order = await AegisOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Aegis order not found' });
    }
    if (order.paymentStatus === 'Completed') {
      return res.status(400).json({ success: false, error: 'This order is already paid' });
    }

    const paypalClient = getPayPalClient();
    if (!paypalClient) {
      return res.status(500).json({ success: false, error: 'PayPal payment processing is not available' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://graphene-security.com';
    const orderRequest = {
      intent: 'CAPTURE',
      purchaseUnits: [{
        customId: String(order._id),
        description: `Aegis Hardening Suite Licence - ${order.orderNumber}`,
        amount: {
          currencyCode: 'GBP',
          value: order.amountGbp.toFixed(2)
        }
      }],
      applicationContext: {
        brandName: 'Graphene Security',
        userAction: 'PAY_NOW',
        // Digital licence: no shipping anywhere in the PayPal flow
        shippingPreference: 'NO_SHIPPING',
        returnUrl: `${frontendUrl}/aegis?orderId=${order._id}`,
        cancelUrl: `${frontendUrl}/aegis`
      }
    };

    let paypalOrder;
    try {
      paypalOrder = await paypalClient.ordersController.createOrder({ body: orderRequest });
    } catch (paypalError) {
      logError(paypalError, { context: 'aegis_paypal_create_error', orderRequest });
      return res.status(503).json({
        success: false,
        error: 'PayPal service is temporarily unavailable. Please try again later.'
      });
    }

    order.paymentDetails.paypalOrderId = paypalOrder.result.id;
    order.paymentStatus = 'Pending';
    order.statusHistory.push({ status: 'Pending', note: 'PayPal order created' });
    await order.save();

    logPaymentEvent('aegis_paypal_order_created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paypalOrderId: paypalOrder.result.id,
      amount: order.amountGbp
    });

    res.json({ success: true, data: { paypalOrderId: paypalOrder.result.id } });
  } catch (error) {
    logError(error, { context: 'aegis_paypal_create' });
    res.status(500).json({ success: false, error: 'Server error occurred while creating PayPal order' });
  }
};

/**
 * POST /api/aegis-orders/:id/paypal/capture
 * Captures the approved PayPal order and completes the licence purchase.
 * Idempotent: re-capturing a paid order returns already_paid.
 */
export const captureAegisOrderPayPalOrder = async (req, res) => {
  try {
    const { paypalOrderId, payerId } = req.body;
    if (!paypalOrderId) {
      return res.status(400).json({ success: false, error: 'PayPal order ID is required' });
    }

    const order = await AegisOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Aegis order not found' });
    }

    if (order.paymentStatus === 'Completed') {
      return res.json({ success: true, data: { status: 'already_paid', orderNumber: order.orderNumber } });
    }

    if (order.paymentDetails.paypalOrderId !== paypalOrderId) {
      return res.status(400).json({
        success: false,
        error: 'PayPal order does not match this Aegis order. Please restart the payment.'
      });
    }

    const paypalClient = getPayPalClient();
    if (!paypalClient) {
      return res.status(500).json({ success: false, error: 'PayPal payment processing is not available' });
    }

    let captureResponse;
    try {
      captureResponse = await paypalClient.ordersController.captureOrder({ id: paypalOrderId });
    } catch (paypalError) {
      logError(paypalError, { context: 'aegis_paypal_capture_error', paypalOrderId });
      return res.status(503).json({
        success: false,
        error: 'PayPal service is temporarily unavailable. Please try again later.'
      });
    }

    if (captureResponse.result.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'PayPal payment capture failed' });
    }

    const capture = captureResponse.result.purchaseUnits?.[0]?.payments?.captures?.[0];
    order.paymentStatus = 'Completed';
    order.orderStatus = 'Paid';
    order.paymentDetails.paypalTransactionId = capture?.id || captureResponse.result.id;
    if (payerId) order.paymentDetails.paypalPayerId = payerId;
    order.paymentDetails.paypalPayerEmail = captureResponse.result.payer?.emailAddress;

    // Automated delivery: mint the download token at first payment
    if (!order.downloadToken) {
      order.downloadToken = generateDownloadToken();
    }

    order.statusHistory.push({ status: 'Paid', note: 'PayPal payment captured' });
    await order.save();

    // Confirmation email with the download link — fire-and-forget, never
    // fails the capture
    try {
      await emailService.sendAegisOrderConfirmationEmail(order, {
        downloadUrl: aegisDownloadUrlFor(order.downloadToken),
        installUrl: aegisInstallerUrlFor(order.downloadToken)
      });
    } catch (emailError) {
      logError(emailError, { context: 'aegis_capture_confirmation_email', orderId: order._id });
    }

    logPaymentEvent('aegis_payment_completed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paypalOrderId,
      amount: order.amountGbp
    });

    res.json({
      success: true,
      data: {
        status: 'captured',
        orderNumber: order.orderNumber,
        downloadUrl: aegisDownloadUrlFor(order.downloadToken)
      }
    });
  } catch (error) {
    logError(error, { context: 'aegis_paypal_capture' });
    res.status(500).json({ success: false, error: 'Server error occurred while capturing PayPal payment' });
  }
};

/**
 * GET /api/aegis-orders/download/:token/meta
 * Licence-link validation for the web installer's first step — confirms the
 * token is live and reveals order info, without touching any file.
 */
export const getAegisDownloadMeta = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return res.status(400).json({ success: false, error: 'Invalid download link' });
    }

    const order = await AegisOrder.findOne({ downloadToken: token })
      .select('orderNumber pixelModel amountGbp orderStatus paymentStatus');
    if (!order) {
      return res.status(404).json({ success: false, error: 'Download link not found' });
    }

    if (order.paymentStatus !== 'Completed' || ['Refunded', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(403).json({ success: false, error: 'This download link is no longer active. If you believe this is a mistake, contact support with your order number.' });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        pixelModel: order.pixelModel,
        amountGbp: order.amountGbp
      }
    });
  } catch (error) {
    logError(error, { context: 'aegis_download_meta' });
    res.status(500).json({ success: false, error: 'Server error occurred while checking the download link' });
  }
};

/**
 * GET /api/aegis-orders/download/:token[?file=apk]
 * Automated kit delivery: streams the installer kit zip (default) or the raw
 * signed APK (?file=apk, for the web installer's streaming install) to the
 * holder of the per-order download token. Public by unguessable token —
 * same auth level as the rest of this flow. Refunded/cancelled orders
 * revoke access; the link otherwise lives as long as the licence does.
 */
export const downloadAegisKit = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return res.status(400).json({ success: false, error: 'Invalid download link' });
    }

    const order = await AegisOrder.findOne({ downloadToken: token });
    if (!order) {
      // Deliberately indistinguishable from an expired/revoked link
      return res.status(404).json({ success: false, error: 'Download link not found' });
    }

    if (order.paymentStatus !== 'Completed' || ['Refunded', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(403).json({ success: false, error: 'This download link is no longer active. If you believe this is a mistake, contact support with your order number.' });
    }

    const wantApk = req.query.file === 'apk';
    const filePath = wantApk ? getAegisApkPath() : getAegisKitPath();
    if (!fs.existsSync(filePath)) {
      logError(new Error(`Aegis ${wantApk ? 'APK' : 'installer kit'} missing at ${filePath}`), { context: 'aegis_kit_download' });
      return res.status(503).json({ success: false, error: 'The installer kit is temporarily unavailable. Please try again shortly or contact support.' });
    }

    // Record the download, then stream the file
    await AegisOrder.updateOne(
      { _id: order._id },
      { $inc: { downloadCount: 1 }, $set: { lastDownloadedAt: new Date() } }
    );

    const stat = fs.statSync(filePath);
    res.setHeader('Content-Type', wantApk ? 'application/vnd.android.package-archive' : 'application/zip');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    res.setHeader('Cache-Control', 'no-store');

    logPaymentEvent('aegis_kit_downloaded', { orderId: order._id, orderNumber: order.orderNumber, file: wantApk ? 'apk' : 'kit' });

    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    logError(error, { context: 'aegis_kit_download' });
    res.status(500).json({ success: false, error: 'Server error occurred during download' });
  }
};
