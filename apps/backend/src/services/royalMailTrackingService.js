// Royal Mail Tracking API V2 client (thin, read-only).
// Portal: developer.royalmail.net — "Tracking for Server-Side App".
// Auth is IBM API Connect headers (X-IBM-Client-Id / X-IBM-Client-Secret)
// issued when you register an app on the portal. Everything is INERT until
// both env vars are set (see isRoyalMailConfigured).
import logger from '../utils/logger.js';

const DEFAULT_BASE = 'https://api.royalmail.net/mailpieces/v2';

// Event codes that mean the item is in the customer's hands: delivered,
// left in safe place, delivered to a neighbour, collected from a Post
// Office / customer service point.
const DELIVERED_EVENT_CODES = ['EVKOP', 'EVKSP', 'EVKDN', 'EVKLC', 'EVPLC'];

export const isRoyalMailConfigured = () =>
  Boolean(process.env.ROYAL_MAIL_API_CLIENT_ID && process.env.ROYAL_MAIL_API_CLIENT_SECRET);

// Map a Royal Mail tracking summary to one of our order statuses, or null
// when the event warrants no transition.
export const mapRoyalMailStatus = (summary) => {
  if (!summary) return null;

  if (DELIVERED_EVENT_CODES.includes(summary.lastEventCode)) {
    return 'delivered';
  }

  // "Out for delivery" has no stable event code across services — phrase-match
  // the human-readable fields (case-insensitive).
  const haystack = `${summary.lastEventName || ''} ${summary.statusDescription || ''} ${summary.statusCategory || ''}`.toLowerCase();
  if (haystack.includes('out for delivery')) {
    return 'out_for_delivery';
  }

  logger.debug(`Royal Mail event not actionable: code=${summary.lastEventCode} line="${summary.summaryLine || ''}"`);
  return null;
};

// Fetch the latest tracking summary for one mail piece. Returns the summary
// object, or null on any failure — never throws (polling must survive bad
// responses and network blips).
export const fetchTrackingSummary = async (trackingNumber) => {
  if (!isRoyalMailConfigured()) return null;

  try {
    const base = process.env.ROYAL_MAIL_API_BASE || DEFAULT_BASE;
    const response = await fetch(
      `${base}/summary?mailPieceId=${encodeURIComponent(trackingNumber)}`,
      {
        headers: {
          'X-IBM-Client-Id': process.env.ROYAL_MAIL_API_CLIENT_ID,
          'X-IBM-Client-Secret': process.env.ROYAL_MAIL_API_CLIENT_SECRET,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      logger.warn(`Royal Mail tracking lookup failed for ${trackingNumber}: HTTP ${response.status}`);
      return null;
    }

    const payload = await response.json();
    // Summary responses return an array of mail pieces; we asked for one id
    return payload?.mailPieces?.[0]?.summary || null;
  } catch (error) {
    logger.warn(`Royal Mail tracking lookup error for ${trackingNumber}: ${error.message}`);
    return null;
  }
};
