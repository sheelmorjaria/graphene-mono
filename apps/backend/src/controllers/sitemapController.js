import Product from '../models/Product.js';
import { logError } from '../utils/logger.js';

// Public pages safe to advertise to crawlers. Deliberately excludes
// account, cart, checkout, admin and auth routes.
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/flash-service', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact-us', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/shipping', changefreq: 'monthly', priority: '0.5' },
  { path: '/refunds', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' }
];

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const buildUrlEntry = (baseUrl, { path, changefreq = 'weekly', priority = '0.5', lastmod }) => (
  '  <url>\n' +
  `    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>\n` +
  (lastmod ? `    <lastmod>${lastmod.toISOString()}</lastmod>\n` : '') +
  `    <changefreq>${changefreq}</changefreq>\n` +
  `    <priority>${priority}</priority>\n` +
  '  </url>'
);

// GET /sitemap.xml — dynamically generated from the live catalog so product
// slugs are always real (the old static file listed invented slugs).
export const getSitemap = async (req, res) => {
  try {
    const baseUrl = (process.env.FRONTEND_URL || 'https://graphene-security.com').replace(/\/$/, '');

    const products = await Product.find({ isActive: true })
      .select('slug updatedAt')
      .sort({ createdAt: 1 })
      .lean();

    const entries = [
      ...STATIC_ROUTES.map((route) => buildUrlEntry(baseUrl, route)),
      ...products
        .filter((product) => product.slug)
        .map((product) => buildUrlEntry(baseUrl, {
          path: `/products/${product.slug}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: product.updatedAt
        }))
    ];

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      entries.join('\n') +
      '\n</urlset>';

    res.status(200).set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }).send(xml);
  } catch (error) {
    logError(error, { context: 'sitemap_generation' });
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>sitemap unavailable</error>');
  }
};
