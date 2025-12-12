import express from 'express';

const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      message: 'Server is running',
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

// Simple health check endpoint (for load balancers)
router.get('/simple', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    message: 'Server is running'
  });
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

export default router;