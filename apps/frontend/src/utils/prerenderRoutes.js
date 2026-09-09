// Route allowlist for build-time prerendering (see scripts/prerender.mjs).
// Kept in src/utils so vitest covers it: choosing what to prerender is the
// safety-critical decision — admin/account/checkout pages must never be
// baked into static HTML.

// Public routes worth prerendering. Everything else (admin, account, cart,
// checkout, auth) is either private, stateful, or has no crawl value.
export const PRERENDER_SEED_ROUTES = [
  '/products', '/', '/faq', '/flash-service', '/shipping', '/contact-us', '/refunds'
];

const ALLOWED_PREFIXES = [
  '/products',
  '/flash-service',
  '/contact-us',
  '/faq',
  '/shipping',
  '/refunds',
  '/privacy',
  '/terms'
];

const BLOCKED_PREFIXES = [
  '/admin', '/cart', '/checkout', '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/profile', '/addresses', '/orders',
  '/my-account', '/account', '/change-password', '/search'
];

export const isPrerenderableRoute = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  if (path.includes('//') || path.includes('..')) return false;
  if (BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return false;
  // Only the exact root is allowed (sub-paths are app routes like /cart).
  if (path === '/') return true;
  return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
};

// Where a prerendered page lands in dist/ ('/' replaces the SPA shell —
// createRoot re-renders over it in the browser).
export const prerenderOutputPath = (route) => (
  route === '/' ? '/index.html' : `${route}/index.html`
);
