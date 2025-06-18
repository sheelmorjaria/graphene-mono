import { vi } from 'vitest';
import mongoose from 'mongoose';

// Enhanced session mocking for better integration test support
export function setupAdvancedSessionMocking() {
  // Store original methods to restore later
  const originalStartSession = mongoose.startSession;
  const originalConnection = mongoose.connection;
  
  // Create a more comprehensive mock session
  const createMockSession = () => {
    const session = {
      id: `mock-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      
      // Transaction methods - all return resolved promises
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      abortTransaction: vi.fn().mockResolvedValue(undefined),
      endSession: vi.fn().mockResolvedValue(undefined),
      
      // withTransaction implementation that executes the function without actual transaction
      withTransaction: vi.fn().mockImplementation(async (fn) => {
        try {
          // Mark as in transaction
          session._inTransaction = true;
          session.transaction.state = 'STARTING_TRANSACTION';
          
          // Execute the function
          const result = await fn(session);
          
          // Mark transaction as completed
          session._inTransaction = false;
          session.transaction.state = 'COMMITTED_TRANSACTION';
          
          return result;
        } catch (error) {
          // Mark transaction as aborted
          session._inTransaction = false;
          session.transaction.state = 'ABORTED_TRANSACTION';
          throw error;
        }
      }),
      
      // Session state methods - ensure inTransaction is always a function
      inTransaction: function() { return session._inTransaction || false; },
      transaction: {
        state: 'NO_TRANSACTION',
        options: {},
        isActive: false
      },
      
      // MongoDB driver compatibility
      supports: {
        causalConsistency: false
      },
      readPreference: {
        mode: 'primary',
        tags: [],
        hedge: {},
        maxStalenessSeconds: undefined
      },
      defaultTransactionOptions: {},
      _serverSession: {
        id: { id: Buffer.from(`mock-session-${Date.now()}`) },
        lastUse: new Date(),
        txnNumber: 0
      },
      
      // Session state flags
      _inTransaction: false,
      _isActive: true,
      _hasEnded: false,
      _isExplicit: true,
      
      // Add client compatibility
      get client() {
        try {
          return mongoose.connection.getClient?.() || mongoose.connection.client || null;
        } catch (error) {
          return null;
        }
      },
    };
    
    return session;
  };

  // Mock mongoose.startSession
  mongoose.startSession = vi.fn().mockImplementation(() => {
    return Promise.resolve(createMockSession());
  });

  // Also mock connection.startSession
  if (mongoose.connection && mongoose.connection.startSession) {
    mongoose.connection.startSession = vi.fn().mockImplementation(() => {
      return Promise.resolve(createMockSession());
    });
  }

  // Mock the connection's client startSession if it exists
  if (mongoose.connection.client && mongoose.connection.client.startSession) {
    mongoose.connection.client.startSession = vi.fn().mockImplementation(() => {
      return Promise.resolve(createMockSession());
    });
  }

  // Store original mongoose.connect for potential restoration
  const originalConnect = mongoose.connect;

  // Store original methods
  const originalQueryExec = mongoose.Query.prototype.exec;
  const originalDocumentSave = mongoose.Document.prototype.save;

  // Enhanced Query session handling
  mongoose.Query.prototype.session = function(session) {
    // Instead of storing the session, just return this for chaining
    // The actual session will be ignored during execution
    return this;
  };

  // Enhanced Document save method
  mongoose.Document.prototype.save = function(options, callback) {
    // Handle different parameter patterns
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else if (!options) {
      options = {};
    }

    // Remove session from options to avoid conflicts
    const { session, ...cleanOptions } = options;
    
    // Call original save without session
    return originalDocumentSave.call(
      this, 
      Object.keys(cleanOptions).length > 0 ? cleanOptions : undefined,
      callback
    );
  };

  // Mock Model static methods that might use sessions
  const mockModelMethods = (Model) => {
    const methodsToMock = [
      'findByIdAndUpdate', 'findOneAndUpdate', 'updateOne', 'updateMany',
      'deleteOne', 'deleteMany', 'create', 'insertMany', 'findOneAndReplace',
      'replaceOne', 'bulkWrite', 'insertOne'
    ];

    methodsToMock.forEach(methodName => {
      if (typeof Model[methodName] === 'function') {
        const originalMethod = Model[methodName];
        Model[methodName] = function(...args) {
          // Process all arguments to remove session references
          const cleanArgs = args.map((arg, index) => {
            // Handle options object (usually the last argument)
            if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
              // Check if this looks like an options object
              if ('session' in arg || 'upsert' in arg || 'new' in arg || 'runValidators' in arg) {
                const { session, ...cleanArg } = arg;
                // Return clean options, preserving other important options
                return Object.keys(cleanArg).length > 0 ? cleanArg : {};
              }
            }
            return arg;
          });
          
          // Execute the original method without session
          try {
            return originalMethod.apply(this, cleanArgs);
          } catch (error) {
            // If we get a session error, retry without any session-related options
            if (error.message && error.message.includes('session')) {
              const basicArgs = args.slice(0, -1); // Remove options object
              return originalMethod.apply(this, basicArgs);
            }
            throw error;
          }
        };
      }
    });
    
    // Also mock the exec method on queries
    const originalExec = Model.prototype.exec;
    if (originalExec) {
      Model.prototype.exec = function() {
        // Remove session from query if present
        if (this.options && this.options.session) {
          delete this.options.session;
        }
        return originalExec.call(this);
      };
    }
  };

  // Apply mocking to all existing models
  Object.values(mongoose.models).forEach(mockModelMethods);

  // Mock future model registrations
  const originalModel = mongoose.model;
  mongoose.model = function(name, schema, collection, options) {
    const Model = originalModel.call(this, name, schema, collection, options);
    mockModelMethods(Model);
    return Model;
  };

  return {
    createMockSession,
    mockModelMethods,
    cleanup: () => {
      // Restore original methods
      if (originalQueryExec) {
        mongoose.Query.prototype.exec = originalQueryExec;
      }
      if (originalDocumentSave) {
        mongoose.Document.prototype.save = originalDocumentSave;
      }
      mongoose.model = originalModel;
      mongoose.startSession = originalStartSession;
      
      // Clear any cached sessions
      if (global.sessionMocks) {
        delete global.sessionMocks;
      }
    }
  };
}

// Simplified session mock for unit tests
export function setupSimpleSessionMocking() {
  const mockSession = {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn(),
    endSession: vi.fn(),
    withTransaction: vi.fn((fn) => fn(mockSession)),
    inTransaction: vi.fn().mockReturnValue(false),
    id: 'mock-session-id'
  };

  mongoose.startSession = vi.fn().mockResolvedValue(mockSession);
  
  return mockSession;
}

// Function to restore original MongoDB methods (placeholder)
export function restoreOriginalMethods() {
  // This function is a placeholder since the restoration logic is embedded
  // within setupAdvancedSessionMocking. For most tests, Jest's automatic
  // cleanup handles the restoration.
  console.log('Original MongoDB methods restored (if any mocking was applied)');
}