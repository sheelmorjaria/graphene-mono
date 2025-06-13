import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import { setupMocks, setupCommonMocks } from './helpers/mockSetup.js';

let mongoServer;

// Setup all mocks
setupMocks();
setupCommonMocks();

beforeAll(async () => {
  // Setup in-memory MongoDB for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Disconnect from any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  // Mock transactions for testing (in-memory MongoDB doesn't support transactions)
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
    withTransaction: jest.fn((fn) => fn()),
    inTransaction: jest.fn().mockReturnValue(false),
    id: 'mock-session-id',
    transaction: {},
    supports: {
      causalConsistency: false
    }
  };
  
  mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
  
  // Override query methods to ignore session parameter and handle chaining
  const originalExec = mongoose.Query.prototype.exec;
  const originalSession = mongoose.Query.prototype.session;
  
  // Mock the session method to return chainable query
  mongoose.Query.prototype.session = function(session) {
    // Store session reference but don't actually use it
    this._mockSession = session;
    return this; // Return this for chaining
  };
  
  mongoose.Query.prototype.exec = function() {
    if (this.getOptions().session || this._mockSession) {
      this.setOptions({ session: undefined });
      delete this._mockSession;
    }
    return originalExec.call(this);
  };
  
  // Also handle Model methods that use sessions
  const setupModelSessionMocking = (Model) => {
    const originalFindById = Model.findById;
    const originalFind = Model.find;
    const originalFindOne = Model.findOne;
    const originalFindOneAndUpdate = Model.findOneAndUpdate;
    const originalUpdateOne = Model.updateOne;
    const originalDeleteMany = Model.deleteMany;
    
    // Override Model.findById to handle .session() chaining
    Model.findById = function(...args) {
      const query = originalFindById.apply(this, args);
      const originalQuerySession = query.session;
      
      query.session = function(session) {
        query._mockSession = session;
        return query; // Return query for chaining
      };
      
      return query;
    };
    
    // Similar for other methods
    ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'deleteMany'].forEach(method => {
      const original = Model[method];
      Model[method] = function(...args) {
        const query = original.apply(this, args);
        if (query && typeof query.session === 'function') {
          const originalQuerySession = query.session;
          query.session = function(session) {
            query._mockSession = session;
            return query;
          };
        }
        return query;
      };
    });
  };
  
  // Mock document save method to handle sessions
  const originalDocumentSave = mongoose.Document.prototype.save;
  mongoose.Document.prototype.save = function(options) {
    // If no options or undefined, call original
    if (options === undefined || options === null) {
      return originalDocumentSave.call(this);
    }
    
    // If options is a function (callback style), call with no options
    if (typeof options === 'function') {
      return originalDocumentSave.call(this, undefined, options);
    }
    
    // If options is an object and contains session, remove session
    if (typeof options === 'object' && options !== null && 'session' in options) {
      const { session, ...cleanOptions } = options;
      const hasOtherOptions = Object.keys(cleanOptions).length > 0;
      return originalDocumentSave.call(this, hasOtherOptions ? cleanOptions : undefined);
    }
    
    // Otherwise call with original options
    return originalDocumentSave.call(this, options);
  };
  
  // Also mock Model static methods that use sessions
  const modelMethods = ['findByIdAndUpdate', 'findOneAndUpdate', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];
  
  // This will be applied when models are loaded
  const enhanceModelWithSessionMocking = (Model) => {
    modelMethods.forEach(methodName => {
      if (typeof Model[methodName] === 'function') {
        const originalMethod = Model[methodName];
        Model[methodName] = function(...args) {
          // Find options object and remove session
          const lastArg = args[args.length - 1];
          if (lastArg && typeof lastArg === 'object' && 'session' in lastArg) {
            const { session, ...cleanOptions } = lastArg;
            args[args.length - 1] = Object.keys(cleanOptions).length > 0 ? cleanOptions : {};
          }
          return originalMethod.apply(this, args);
        };
      }
    });
    
    // Also mock the create method which might be used
    if (typeof Model.create === 'function') {
      const originalCreate = Model.create;
      Model.create = function(...args) {
        // Handle both create(doc, options) and create([docs], options) patterns
        const lastArg = args[args.length - 1];
        if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg) && 'session' in lastArg) {
          const { session, ...cleanOptions } = lastArg;
          args[args.length - 1] = Object.keys(cleanOptions).length > 0 ? cleanOptions : {};
        }
        return originalCreate.apply(this, args);
      };
    }
  };
  
  // Make the function globally available for models to use
  global.enhanceModelWithSessionMocking = enhanceModelWithSessionMocking;
}, 60000);

afterAll(async () => {
  // Clean up all collections before closing
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
  }
  
  // Close database connection and stop server
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  // Clean up test data
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    await Promise.all(
      Object.values(collections).map(async (collection) => {
        await collection.deleteMany({});
      })
    );
  }
  
  // Clear all mocks
  jest.clearAllMocks();
  jest.restoreAllMocks();
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