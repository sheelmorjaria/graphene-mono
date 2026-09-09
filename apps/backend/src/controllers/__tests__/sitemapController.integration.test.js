import '../../test/setup.js';
import request from 'supertest';
import express from 'express';
import { vi } from 'vitest';
import Product from '../../models/Product.js';
import { getSitemap } from '../sitemapController.js';

// Sitemap must reflect the LIVE catalog (real slugs, isActive filter) — the
// old static sitemap.xml listed made-up slugs ("google-pixel-9-pro") that
// 404'd under BrowserRouter. AI crawlers discover pages from this file.

let app;

beforeAll(async () => {
  process.env.FRONTEND_URL = 'https://graphene-security.com';
  app = express();
  app.get('/sitemap.xml', getSitemap);
});

const buildProduct = (overrides = {}) => ({
  name: 'GrapheneOS Pixel 7A',
  slug: 'grapheneos-pixel-7a',
  sku: 'PIX-7A',
  baseModel: '7A',
  isActive: true,
  status: 'active',
  variations: [{ condition: 'good', color: 'Black', storage: '128GB', price: 265, stockQuantity: 1, stockStatus: 'in_stock', sku: 'PIX-7A-V1' }],
  ...overrides
});

describe('GET /sitemap.xml', () => {
  it('returns valid XML with content-type and cache headers', async () => {
    const response = await request(app).get('/sitemap.xml');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('xml');
    expect(response.headers['cache-control']).toContain('max-age');
    expect(response.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it('lists static public pages but never account/cart/checkout/admin routes', async () => {
    const response = await request(app).get('/sitemap.xml');
    const xml = response.text;

    expect(xml).toContain('<loc>https://graphene-security.com/products</loc>');
    expect(xml).toContain('<loc>https://graphene-security.com/faq</loc>');
    expect(xml).toContain('<loc>https://graphene-security.com/flash-service</loc>');

    for (const forbidden of ['/admin', '/cart', '/checkout', '/login', '/register', '/profile', '/orders']) {
      expect(xml).not.toContain(`<loc>https://graphene-security.com${forbidden}`);
    }
  });

  it('includes every ACTIVE product slug from the catalog', async () => {
    await Product.create([
      buildProduct(),
      buildProduct({ name: 'GrapheneOS Pixel 9 Pro Fold', slug: 'grapheneos-pixel-9-pro-fold', sku: 'PIX-9PF' })
    ]);

    const xml = (await request(app).get('/sitemap.xml')).text;

    expect(xml).toContain('<loc>https://graphene-security.com/products/grapheneos-pixel-7a</loc>');
    expect(xml).toContain('<loc>https://graphene-security.com/products/grapheneos-pixel-9-pro-fold</loc>');
  });

  it('excludes inactive products', async () => {
    await Product.create(buildProduct({ name: 'Discontinued', slug: 'discontinued-phone', sku: 'DISC', isActive: false }));

    const xml = (await request(app).get('/sitemap.xml')).text;

    expect(xml).not.toContain('discontinued-phone');
  });

  it('serves static routes gracefully when the catalog is empty', async () => {
    const response = await request(app).get('/sitemap.xml');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(response.text).not.toContain('/products/grapheneos-');
  });

  it('returns 500 (not a crash) when the catalog query fails', async () => {
    const findMock = vi.spyOn(Product, 'find').mockRejectedValue(new Error('DB down'));
    const response = await request(app).get('/sitemap.xml');
    findMock.mockRestore();

    expect(response.status).toBe(500);
  });
});
