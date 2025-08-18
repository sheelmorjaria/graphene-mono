import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    trustProxy: req.app.get('trust proxy'),
    ip: req.ip,
    ips: req.ips
  });
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

export default router;