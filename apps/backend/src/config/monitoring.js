import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry for error tracking
export const initializeSentry = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        // Enable HTTP calls tracing
        Sentry.httpIntegration({
          tracing: true,
          breadcrumbs: true
        }),
        // Enable Express.js middleware tracing
        Sentry.expressIntegration(),
        // Enable MongoDB tracing
        Sentry.mongoIntegration(),
        // Enable performance profiling
        nodeProfilingIntegration()
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Performance Profiling
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
      // Additional configuration
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        
        // Log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Sentry Error:', hint.originalException || hint.syntheticException);
        }
        
        return event;
      }
    });

    console.log('✅ Sentry error tracking initialized');
  } else {
    console.log('⚠️  Sentry not initialized - missing SENTRY_DSN or not in production');
  }
};

// Initialize New Relic for APM
export const initializeNewRelic = () => {
  if (process.env.NODE_ENV === 'production' && process.env.NEW_RELIC_LICENSE_KEY) {
    try {
      // New Relic should be imported first in your main app file
      import('newrelic');
      console.log('✅ New Relic APM initialized');
    } catch (error) {
      console.error('❌ Failed to initialize New Relic:', error.message);
    }
  } else {
    console.log('⚠️  New Relic not initialized - missing license key or not in production');
  }
};

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
      
      // Send to monitoring service if configured
      if (process.env.NODE_ENV === 'production') {
        // Could integrate with DataDog, CloudWatch, etc.
        // Example: cloudwatch.putMetricData({...})
      }
    });
    
    next();
  },

  // Track payment events
  trackPayment: (paymentMethod, amount, status, orderId) => {
    const metric = {
      event: 'payment_processed',
      paymentMethod,
      amount,
      status,
      orderId,
      timestamp: new Date().toISOString()
    };

    console.info('Payment metric:', metric);

    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track(metric)
      Sentry.addBreadcrumb({
        message: `Payment ${status}`,
        category: 'payment',
        data: { paymentMethod, amount, orderId },
        level: status === 'completed' ? 'info' : 'warning'
      });
    }
  },

  // Track user events
  trackUserEvent: (userId, event, data = {}) => {
    const metric = {
      event,
      userId,
      data,
      timestamp: new Date().toISOString()
    };

    console.info('User event:', metric);

    if (process.env.NODE_ENV === 'production') {
      Sentry.addBreadcrumb({
        message: `User ${event}`,
        category: 'user',
        data: { userId, ...data },
        level: 'info'
      });
    }
  },

  // Track errors
  trackError: (error, context = {}) => {
    console.error('Application error:', error, context);

    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        // Add context
        Object.keys(context).forEach(key => {
          scope.setTag(key, context[key]);
        });
        
        // Capture exception
        Sentry.captureException(error);
      });
    }
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
  initializeSentry,
  initializeNewRelic,
  getHealthMetrics,
  metrics,
  alerts
};