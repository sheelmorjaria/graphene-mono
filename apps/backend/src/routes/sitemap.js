import express from 'express';
import { generateSitemap } from '../utils/sitemapGenerator.js';

const router = express.Router();

// GET /api/sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await generateSitemap();
    
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;