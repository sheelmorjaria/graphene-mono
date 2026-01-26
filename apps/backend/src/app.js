import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import * as Sentry from '@sentry/node';
import logger, { logError } from './utils/logger.js';
import { metrics } from './config/monitoring.js';
import { globalSanitization } from './middleware/validation.js';

// Import routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import shippingRoutes from './routes/shipping.js';
import supportRoutes from './routes/support.js';
import healthRoutes from './routes/health.js';
import internalOrderRoutes from './routes/internalOrderRoutes.js';
import sitemapRoutes from './routes/sitemap.js';
import webhookRoutes from './routes/webhook.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();

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
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Allowed origins array
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://84.45.134.166:3000',
      'http://84.45.134.166',
      'https://graphene-security.com',
      'https://www.graphene-security.com',
      'https://frontend.graphene-security.com',
      'https://api.graphene-security.com',
      'http://ps848wcgo4skwkgk00w40w48.84.45.134.166.sslip.io',
      'https://ps848wcgo4skwkgk00w40w48.84.45.134.166.sslip.io'
    ];

    // Add FRONTEND_URL from environment if set
    if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    // Coolify deployment URLs (using regex to match any subdomain)
    if (origin.match(/.*\.coolify\.app$/) || origin.match(/.*\.coolify\.io$/)) {
      return callback(null, true);
    }

    // Local network IPs
    if (origin.match(/192\.168\.\d+\.\d+/) || origin.match(/10\.\d+\.\d+\.\d+/) || origin.match(/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/)) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Log blocked origin for debugging
    console.log(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-csrf-token'],
  exposedHeaders: ['set-cookie']
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
  skip: (req) => req.path === '/health' || req.path === '/health/simple' || req.method === 'OPTIONS'
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
  setHeaders: (res, filePath) => {
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
    const fileExtension = path.extname(filePath).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      res.status(403).end();
      return;
    }
  }
}));

// Health check endpoints (accessible before API routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    message: 'Server is running'
  });
});

app.get('/health/simple', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    message: 'Server is running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/internal/orders', internalOrderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api', sitemapRoutes);

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

export default app;