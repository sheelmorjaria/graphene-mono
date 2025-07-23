import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { vi } from 'vitest';
import { setupMocks, setupCommonMocks } from './helpers/mockSetup.js';
import { setupAdvancedSessionMocking } from './helpers/sessionMocks.js';

let mongoServer;

// Setup all mocks
setupMocks();
setupCommonMocks();

beforeAll(async () => {
  try {
    // Setup in-memory MongoDB for testing
    mongoServer = await MongoMemoryServer.create({
      instance: {
        // Disable replica set to avoid session-related issues
        replSet: undefined,
        // Use simpler storage engine
        storageEngine: 'wiredTiger'
      }
    });
    const mongoUri = mongoServer.getUri();
    
    // Disconnect from any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to the in-memory database with session-safe options
    await mongoose.connect(mongoUri, {
      // Disable sessions since MongoMemoryServer doesn't fully support them
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    // Wait for connection to be ready
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });
    
    // Enable session mocking for tests
    global.sessionMocks = setupAdvancedSessionMocking();
    
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  try {
    // Clean up session mocks first
    if (global.sessionMocks && global.sessionMocks.cleanup) {
      global.sessionMocks.cleanup();
    }
    
    // Clean up all collections before closing
    if (mongoose.connection.readyState === 1) {
      try {
        // Try to drop database without session
        await mongoose.connection.db.dropDatabase();
      } catch (error) {
        console.warn('Failed to drop test database:', error.message);
        // Try alternative cleanup - drop collections individually
        try {
          const collections = await mongoose.connection.db.collections();
          for (const collection of collections) {
            await collection.drop().catch(() => {}); // Ignore errors
          }
        } catch (collectionError) {
          console.warn('Failed to drop collections individually:', collectionError.message);
        }
      }
    }
    
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Stop mongo server
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
    
    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Error during test cleanup:', error.message);
    // Don't throw - cleanup should be best-effort
  }
}, 30000);

afterEach(async () => {
  try {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      
      // Clean collections sequentially to avoid session conflicts
      for (const collection of Object.values(collections)) {
        try {
          // Use deleteMany without sessions for test cleanup
          await collection.deleteMany({}, { session: null });
        } catch (error) {
          // If that fails, try without any options
          try {
            await collection.deleteMany({});
          } catch (retryError) {
            console.warn(`Failed to clean collection ${collection.collectionName}:`, error.message);
          }
        }
      }
    }
    
    // Clear all mocks
    vi.clearAllMocks();
    vi.restoreAllMocks();
  } catch (error) {
    console.warn('Error during afterEach cleanup:', error.message);
  }
});

// Global test utilities
global.testUtils = {
  async cleanDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  },
  
  async dropAllIndexes() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.dropIndexes();
    }
  }
};

// Test database connection utilities
export const connectTestDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
    }
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }
};

export const disconnectTestDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearTestDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    await Promise.all(
      Object.values(collections).map(async (collection) => {
        try {
          await collection.deleteMany({});
        } catch (error) {
          // Ignore session transaction errors during test cleanup
          if (!error.message.includes('session') && !error.message.includes('Transaction')) {
            throw error;
          }
        }
      })
    );
  }
};

// Process cleanup handlers to prevent hanging tests
const cleanup = async () => {
  try {
    if (global.sessionMocks && global.sessionMocks.cleanup) {
      global.sessionMocks.cleanup();
    }
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error during process cleanup:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);

// Handle uncaught exceptions in tests
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception in tests:', error);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection in tests:', reason);
  await cleanup();
  process.exit(1);
});

// Export mongoServer for external use
export { mongoServer };