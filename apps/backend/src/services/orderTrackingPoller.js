// Polls Royal Mail tracking for dispatched orders and advances statuses
// automatically: shipped → out_for_delivery → delivered.
//
// Started ONLY from server.js (inside its NODE_ENV !== 'test' boot block) —
// tests import src/app.js, never server.js, so the interval never runs in
// any vitest suite. Inert until Royal Mail API credentials are configured.
import Order from '../models/Order.js';
import emailService from './emailService.js';
import logger from '../utils/logger.js';
import { fetchTrackingSummary, mapRoyalMailStatus, isRoyalMailConfigured } from './royalMailTrackingService.js';
import { isValidStatusTransition } from '../controllers/adminController.js';

const MIN_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

let polling = false;

export const pollShippedOrders = async () => {
  if (!isRoyalMailConfigured()) {
    return { skipped: 'not-configured' };
  }
  if (polling) {
    return { skipped: 'already-running' };
  }

  polling = true;
  const results = { checked: 0, advanced: 0, errors: 0 };
  try {
    const orders = await Order.find({
      status: { $in: ['shipped', 'out_for_delivery'] },
      trackingNumber: { $exists: true, $ne: '' }
    })
      .sort({ createdAt: 1 })
      .limit(50);

    for (const order of orders) {
      results.checked++;
      try {
        const summary = await fetchTrackingSummary(order.trackingNumber);
        const nextStatus = mapRoyalMailStatus(summary);

        // No event, same status, or an illegal jump — leave the order alone
        if (!nextStatus || nextStatus === order.status) continue;
        if (!isValidStatusTransition(order.status, nextStatus)) continue;

        order.status = nextStatus;
        if (nextStatus === 'delivered') {
          // Stamps the start of the 28-day returns window — nothing else
          // in the codebase ever wrote this field (returns 400'd without it)
          order.deliveryDate = summary.lastEventDateTime
            ? new Date(summary.lastEventDateTime)
            : new Date();
        }
        await order.save();

        // The Order pre-save hook auto-appended a {status, timestamp, note}
        // entry on the status change — rewrite its note so history shows why
        // (updatedBy/notes keys are silently stripped by strict mode; `note`
        // is the real field). Second save: status is unmodified now, so the
        // hook does not fire again.
        const last = order.statusHistory[order.statusHistory.length - 1];
        if (last) {
          last.note = `Auto-updated from Royal Mail tracking (${summary.lastEventCode} ${summary.lastEventName})`.slice(0, 200);
          await order.save();
        }

        results.advanced++;
        logger.info(`Order ${order.orderNumber} auto-advanced to ${nextStatus} via Royal Mail tracking`);

        // Parity with the manual admin path: delivered sends an email,
        // out_for_delivery stays silent
        if (nextStatus === 'delivered') {
          try {
            await emailService.sendOrderDeliveredEmail(order);
          } catch (emailError) {
            logger.error(`Delivered email failed for order ${order.orderNumber}: ${emailError.message}`);
          }
        }
      } catch (error) {
        results.errors++;
        logger.warn(`Royal Mail tracking poll failed for order ${order.orderNumber}: ${error.message}`);
      }
    }
    return results;
  } finally {
    polling = false;
  }
};

export const startRoyalMailPoller = () => {
  if (process.env.ROYAL_MAIL_POLLING === 'disabled') {
    logger.info('Royal Mail tracking poller disabled (ROYAL_MAIL_POLLING=disabled)');
    return;
  }
  if (!isRoyalMailConfigured()) {
    logger.info('Royal Mail tracking poller inactive — no API credentials configured');
    return;
  }

  const intervalMs = Math.max(
    MIN_INTERVAL_MS,
    parseInt(process.env.ROYAL_MAIL_POLL_INTERVAL_MS, 10) || DEFAULT_INTERVAL_MS
  );

  const run = () => pollShippedOrders().catch((error) => {
    logger.warn(`Royal Mail tracking poll error: ${error.message}`);
  });

  // First run shortly after boot (DB may still be connecting), then on the
  // interval. unref() so the timers never hold the process open on shutdown.
  setTimeout(run, 60 * 1000).unref();
  setInterval(run, intervalMs).unref();

  logger.info(`Royal Mail tracking poller started (every ${Math.round(intervalMs / 60000)} minutes)`);
};
