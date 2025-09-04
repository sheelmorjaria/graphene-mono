import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      port: process.env.PORT || 5000,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

export default router;