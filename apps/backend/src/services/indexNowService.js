// IndexNow: notifies participating search engines (Bing, Yandex, ...) that a
// URL's content changed, so updated prices/stock propagate immediately
// instead of waiting for the next crawl. Strictly fire-and-forget — a failed
// ping must never break the admin operation that triggered it.
//
// Setup: set INDEXNOW_KEY on BOTH apps (same value). The backend pings; the
// frontend serves the key file at https://<site>/<key>.txt for verification
// (see server.js). Generate a key at https://www.bing.com/indexnow or any
// 8-128 hex string.

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export const notifyIndexNow = async (urlPaths) => {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !Array.isArray(urlPaths) || urlPaths.length === 0) {
    return;
  }

  const siteUrl = (process.env.FRONTEND_URL || 'https://graphene-security.com').replace(/\/$/, '');
  const host = new URL(siteUrl).host;

  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList: urlPaths.map((path) => `${siteUrl}${path}`)
      })
    });
  } catch (error) {
    console.error('IndexNow ping failed (non-fatal):', error.message);
  }
};
