import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateSitemap = async () => {
  const hostname = process.env.FRONTEND_URL || 'https://grapheneos-store.com';
  
  // Create sitemap stream
  const smStream = new SitemapStream({ hostname });

  // Static pages
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/products', changefreq: 'daily', priority: 0.9 },
    { url: '/contact-us', changefreq: 'monthly', priority: 0.5 },
    { url: '/login', changefreq: 'monthly', priority: 0.3 },
    { url: '/register', changefreq: 'monthly', priority: 0.3 }
  ];

  // Add static pages
  staticPages.forEach(page => smStream.write(page));

  // Dynamic pages - Products
  try {
    const products = await Product.find({ isActive: true }).select('slug updatedAt');
    
    products.forEach(product => {
      smStream.write({
        url: `/products/${product.slug}`,
        lastmod: product.updatedAt,
        changefreq: 'weekly',
        priority: 0.8,
        img: [
          {
            url: `${hostname}/api/products/${product.slug}/image`,
            title: product.name,
            caption: product.shortDescription
          }
        ]
      });
    });
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // End the stream
  smStream.end();

  // Generate sitemap XML
  const sitemapXML = await streamToPromise(smStream);
  
  return sitemapXML.toString();
};

export const writeSitemapToFile = async () => {
  try {
    const sitemap = await generateSitemap();
    const sitemapPath = path.join(__dirname, '../../../../frontend/public/sitemap.xml');
    
    // Write sitemap to public directory
    const writeStream = createWriteStream(sitemapPath);
    writeStream.write(sitemap);
    writeStream.end();
    
    console.log('Sitemap generated successfully at:', sitemapPath);
    return true;
  } catch (error) {
    console.error('Error writing sitemap to file:', error);
    return false;
  }
};

// Generate sitemap periodically (can be called from a cron job)
export const scheduleSitemapGeneration = () => {
  // Generate immediately
  writeSitemapToFile();
  
  // Regenerate every 24 hours
  setInterval(() => {
    writeSitemapToFile();
  }, 24 * 60 * 60 * 1000);
};