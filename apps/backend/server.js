import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import internalOrderRouter from './src/routes/internalOrderRoutes.js';
import adminRouter from './src/routes/admin.js';

dotenv.config();

// Initialize monitoring services
initializeSentry();
initializeNewRelic();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for accurate IP addresses behind reverse proxies (Render, etc)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // In production, allow specific origins
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://graphene-frontend.onrender.com',
        'https://graphene-security.com',
        'https://www.graphene-security.com'
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow localhost origins
      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ];
      
      if (devOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development for testing
      }
    }
  }
};

app.use(cors(corsOptions));


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
app.use('/uploads', express.static('src/uploads', {
  setHeaders: (res, path) => {
    // Security headers for static files
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache for images
    
    // Restrict file types
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.substring(path.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      res.status(403).end();
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

// Routes
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/support', supportRouter);

// Admin routes
app.use('/api/admin', adminRouter);

// Internal admin routes (secured with API key)
app.use('/api/internal', internalOrderRouter);

// Health check endpoint with database connectivity check
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Perform a simple database operation to verify connectivity
    if (dbState === 1) {
      await mongoose.connection.db.admin().ping();
    }
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus[dbState],
        connected: dbState === 1
      },
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'error',
        connected: false
      },
      error: 'Database health check failed'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Add Sentry error handler before our custom error handler
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler
app.use((error, req, res, _next) => {
  // Generate request ID for tracking
  const requestId = crypto.randomBytes(16).toString('hex');
  
  logError(error, { 
    context: 'global_error_handler', 
    url: req.url, 
    method: req.method,
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Determine status code
  const statusCode = error.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request' 
      : error.message,
    requestId,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  });
}

export default app;