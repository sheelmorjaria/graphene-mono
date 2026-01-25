import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger, { logError } from './src/utils/logger.js';
import { initializeSentry, initializeNewRelic } from './src/config/monitoring.js';
import app from './src/app.js';

dotenv.config();

// Initialize monitoring services
initializeSentry();
initializeNewRelic();

const PORT = process.env.PORT || 5000;

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