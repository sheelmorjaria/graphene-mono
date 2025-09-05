import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import logger, { logError } from './src/utils/logger.js';
import { initializeSentry, initializeNewRelic, metrics } from './src/config/monitoring.js';
import { globalSanitization } from './src/middleware/validation.js';
import productsRouter from './src/routes/products.js';
import authRouter from './src/routes/auth.js';
import userRouter from './src/routes/user.js';
import cartRouter from './src/routes/cart.js';
import shippingRouter from './src/routes/shipping.js';
import paymentRouter from './src/routes/payment.js';
import supportRouter from './src/routes/support.js';
import healthRouter from './src/routes/health.js';
import internalOrderRouter from './src/routes/internalOrderRoutes.js';
import sitemapRouter from './src/routes/sitemap.js';
import adminRouter from './src/routes/admin.js';
import webhookRouter from './src/routes/webhook.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { notFound } from './src/middleware/notFound.js';

dotenv.config();

// Initialize monitoring services
initializeSentry();
initializeNewRelic();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for accurate IP addresses behind reverse proxies (Render, etc)
// Use specific trust proxy setting for security in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy (Render's load balancer)
} else {
  app.set('trust proxy', 'loopback'); // Only trust localhost in development
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://fonts.googleapis.com'],
      fontSrc: ['\'self\'', 'https://fonts.gstatic.com'],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      scriptSrc: ['\'self\''],
      connectSrc: ['\'self\'']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// CORS configuration (must be before rate limiting)
const corsOptions = {
  credentials: true,
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://graphene-security.com',
    'https://www.graphene-security.com',
    'http://ps848wcgo4skwkgk00w40w48.84.45.134.166.sslip.io',
    'https://ps848wcgo4skwkgk00w40w48.84.45.134.166.sslip.io',
    /192\.168\.\d+\.\d+/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-csrf-token']
};

app.use(cors(corsOptions));

// Rate limiting (after CORS so preflight requests get proper headers)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks and OPTIONS preflight requests
  skip: (req) => req.path === '/health' || req.method === 'OPTIONS'
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global input sanitization
app.use(globalSanitization);

// Sentry middleware is automatically set up by the expressIntegration in monitoring.js

// Add custom metrics middleware
app.use(metrics.responseTime);

// Static file serving for uploaded images with security headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Security headers for static files
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache for images
    
    // CORS headers for cross-origin image loading (needed for production)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Restrict file types
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.substring(path.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      res.status(403).end();
      return;
    }
  }
}));

// Database connection with pooling and retry logic
const connectDB = async () => {
  const mongoURI = process.env.NODE_ENV === 'test' 
    ? process.env.MONGODB_TEST_URI 
    : process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
  
  const options = {
    // Connection pooling options
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    
    // Retry options
    retryWrites: true,
    retryReads: true,
  };
  
  let retries = 5;
  
  while (retries) {
    try {
      await mongoose.connect(mongoURI, options);
      logger.info('MongoDB connected successfully with connection pooling');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logError(err, { context: 'mongodb_connection_error' });
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });
      
      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
      });
      
      break;
    } catch (error) {
      retries -= 1;
      logError(error, { context: 'mongodb_connection_attempt', retriesLeft: retries });
      
      if (!retries) {
        logger.error('Failed to connect to MongoDB after 5 attempts');
        process.exit(1);
      }
      
      logger.info(`Retrying MongoDB connection in 5 seconds... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/support', supportRouter);
app.use('/api/health', healthRouter);
app.use('/api/internal/orders', internalOrderRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api', sitemapRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Graphene Security API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'operational'
  });
});

// Robots.txt endpoint
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /

# API endpoints should not be indexed
# The API is meant for programmatic access only`);
});

// Favicon endpoint (prevents 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// 404 handler
app.use(notFound);

// Add Sentry error handler before our custom error handler
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Simple health check endpoint (before database connection)
app.get('/health/simple', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    message: 'Server is running'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  console.log('🚀 Starting GrapheneOS Backend Server...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'configured' : 'not configured'}`);
  
  // Start server first, then connect to database
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Connect to database after server is running
    connectDB().catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      logger.error('Database connection failed during startup');
      // Don't exit - let health check handle this
    });
  });

  server.on('error', (error) => {
    console.error('❌ Server failed to start:', error.message);
    logger.error('Server startup error:', error);
    process.exit(1);
  });
}

export default app;