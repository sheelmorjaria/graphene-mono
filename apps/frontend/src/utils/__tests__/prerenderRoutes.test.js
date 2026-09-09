import { describe, it, expect } from 'vitest';
import { isPrerenderableRoute, prerenderOutputPath, PRERENDER_SEED_ROUTES } from '../prerenderRoutes.js';

// The allowlist is the safety-critical piece of prerendering: baking admin or
// account pages into static HTML (with any rendered data) would leak them to
// anyone who fetches the file directly.

describe('isPrerenderableRoute', () => {
  it('allows public catalog and content pages', () => {
    for (const route of [
      '/', '/products', '/products/grapheneos-pixel-7a', '/faq', '/shipping',
      '/flash-service', '/contact-us', '/refunds', '/privacy', '/terms'
    ]) {
      expect(isPrerenderableRoute(route), route).toBe(true);
    }
  });

  it('never allows admin, account, cart, checkout or auth routes', () => {
    for (const route of [
      '/admin', '/admin/orders', '/admin/settings', '/cart', '/checkout',
      '/checkout/success', '/login', '/register', '/forgot-password',
      '/reset-password', '/verify-email', '/profile', '/addresses',
      '/orders', '/orders/123', '/my-account/returns', '/account/privacy',
      '/change-password', '/search'
    ]) {
      expect(isPrerenderableRoute(route), route).toBe(false);
    }
  });

  it('rejects non-path, traversal and protocol-relative values', () => {
    for (const route of [
      'https://evil.example.com', '//evil.example.com', '../secrets',
      '/products/../../../etc', 'products', '', null, undefined, '/products/../..'
    ]) {
      expect(isPrerenderableRoute(route), String(route)).toBe(false);
    }
  });

  it('does not allow arbitrary top-level routes just because they start with /', () => {
    expect(isPrerenderableRoute('/wp-admin')).toBe(false);
    expect(isPrerenderableRoute('/internal-dashboard')).toBe(false);
  });
});

describe('prerenderOutputPath', () => {
  it('maps the root to the SPA shell and sub-routes to nested index files', () => {
    expect(prerenderOutputPath('/')).toBe('/index.html');
    expect(prerenderOutputPath('/products')).toBe('/products/index.html');
    expect(prerenderOutputPath('/products/grapheneos-pixel-7a')).toBe('/products/grapheneos-pixel-7a/index.html');
  });
});

describe('PRERENDER_SEED_ROUTES', () => {
  it('contains only prerenderable routes', () => {
    for (const route of PRERENDER_SEED_ROUTES) {
      expect(isPrerenderableRoute(route), route).toBe(true);
    }
  });
});
