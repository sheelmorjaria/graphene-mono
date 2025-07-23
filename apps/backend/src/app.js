import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

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

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();

// Trust proxy for correct IP addresses
app.set('trust proxy', 1);

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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://grapheneos-store.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip validation errors about trust proxy setting during development/testing
  validate: false,
  skip: (req) => {
    // Skip rate limiting for health checks and in test environment
    return req.path === '/api/health' || process.env.NODE_ENV === 'test';
  }
});

app.use('/api/', limiter);

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api', sitemapRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'GrapheneOS Store API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'operational'
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;