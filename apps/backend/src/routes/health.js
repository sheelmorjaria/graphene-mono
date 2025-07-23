import express from 'express';
import mongoose from 'mongoose';
import { getHealthMetrics } from '../config/monitoring.js';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  const health = getHealthMetrics();
  res.json(health);
});

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  const health = getHealthMetrics();
  
  try {
    // Check database connectivity
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      connected: dbState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState]
    };

    // Check external services
    const services = {
      database: dbStatus,
      paypal: {
        configured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox'
      },
      bitcoin: {
        configured: !!process.env.BLOCKONOMICS_API_KEY
      },
      monero: {
        configured: !!(process.env.GLOBEE_API_KEY && process.env.GLOBEE_SECRET)
      },
      email: {
        configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      }
    };

    // Determine overall health
    const isHealthy = dbStatus.connected && 
                     Object.values(services).every(service => 
                       typeof service.configured === 'undefined' || service.configured
                     );

    res.json({
      ...health,
      status: isHealthy ? 'healthy' : 'degraded',
      services,
      checks: {
        database: dbStatus.connected ? 'pass' : 'fail',
        paymentGateways: services.paypal.configured ? 'pass' : 'warn',
        cryptocurrency: (services.bitcoin.configured && services.monero.configured) ? 'pass' : 'warn',
        email: services.email.configured ? 'pass' : 'warn'
      }
    });

  } catch (error) {
    res.status(500).json({
      ...health,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Readiness check (for load balancers)
router.get('/ready', async (req, res) => {
  try {
    // Check if app is ready to serve traffic
    const dbConnected = mongoose.connection.readyState === 1;
    
    if (dbConnected) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database not connected' });
    }
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: error.message });
  }
});

// Liveness check (for orchestrators like Kubernetes)
router.get('/live', (req, res) => {
  // Basic liveness check - if this endpoint responds, the app is alive
  res.status(200).json({ status: 'alive' });
});

export default router;