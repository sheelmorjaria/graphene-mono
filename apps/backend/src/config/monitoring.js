import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry for error tracking.
//
// Monitoring is non-essential: a Sentry init failure (bad DSN, config error,
// or the native profiling integration misbehaving) must NEVER prevent the
// server from starting. init() is wrapped in try/catch, and the
// @sentry/profiling-node integration — which has caused native crashes
// (segfaults) in this project — is opt-in via SENTRY_ENABLE_PROFILING=true,
// off by default for a safe startup. Error tracking still works without it.
export const initializeSentry = () => {
  if (process.env.NODE_ENV !== 'production' || !process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry not initialized - missing SENTRY_DSN or not in production');
    return;
  }

  try {
    const enableProfiling = process.env.SENTRY_ENABLE_PROFILING === 'true';
    const integrations = [
      // Enable HTTP calls tracing
      Sentry.httpIntegration({ tracing: true, breadcrumbs: true }),
      // Enable Express.js middleware tracing
      Sentry.expressIntegration(),
      // Enable MongoDB tracing
      Sentry.mongoIntegration()
    ];
    // Native performance profiling is opt-in (off by default) — see comment above.
    if (enableProfiling) {
      integrations.push(nodeProfilingIntegration());
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations,
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Performance Profiling (only meaningful when the profiling integration is loaded)
      profilesSampleRate: enableProfiling ? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0) : 0,
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

    console.log(enableProfiling
      ? '✅ Sentry error tracking initialized (profiling enabled)'
      : '✅ Sentry error tracking initialized');
  } catch (error) {
    console.error('❌ Sentry initialization failed - continuing without Sentry:', error?.message || error);
  }
};

// Initialize New Relic for APM. Non-fatal: the dynamic import is given a
// rejection handler so a failed load can't become an unhandled rejection or
// block startup.
export const initializeNewRelic = () => {
  if (process.env.NODE_ENV !== 'production' || !process.env.NEW_RELIC_LICENSE_KEY) {
    console.log('⚠️  New Relic not initialized - missing license key or not in production');
    return;
  }

  try {
    import('newrelic').catch((error) => {
      console.error('❌ New Relic failed to load - continuing without it:', error?.message || error);
    });
    console.log('✅ New Relic APM initialized');
  } catch (error) {
    console.error('❌ Failed to initialize New Relic:', error?.message || error);
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