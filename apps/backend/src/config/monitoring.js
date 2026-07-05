// Lightweight in-process metrics collection.
//
// Sentry/New Relic were removed (neither was configured in production).
// Error handling is covered by the custom Express error handler + winston
// logging. This module now only provides a response-time middleware and
// console-based event/metric helpers.

// Health check endpoint data
export const getHealthMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024) // MB
    },
    node: {
      version: process.version,
      environment: process.env.NODE_ENV
    }
  };
};

// Custom metrics collection
export const metrics = {
  // Track API response times
  responseTime: (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      // Log slow requests
      if (duration > 2000) {
        console.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
      }
    });

    next();
  },

  // Track payment events
  trackPayment: (paymentMethod, amount, status, orderId) => {
    console.info('Payment metric:', {
      event: 'payment_processed',
      paymentMethod,
      amount,
      status,
      orderId,
      timestamp: new Date().toISOString()
    });
  },

  // Track user events
  trackUserEvent: (userId, event, data = {}) => {
    console.info('User event:', {
      event,
      userId,
      data,
      timestamp: new Date().toISOString()
    });
  },

  // Track errors
  trackError: (error, context = {}) => {
    console.error('Application error:', error, context);
  }
};

// Alert configuration
export const alerts = {
  // High error rate alert
  checkErrorRate: () => {
    // Implementation would track error rate
    // and send alerts if threshold exceeded
  },

  // Database connection alert
  checkDatabaseHealth: async () => {
    // Implementation would check DB connectivity
    // and send alerts if issues detected
  },

  // Payment processing alert
  checkPaymentHealth: () => {
    // Implementation would monitor payment success rates
    // and alert if below threshold
  }
};

export default {
  getHealthMetrics,
  metrics,
  alerts
};
