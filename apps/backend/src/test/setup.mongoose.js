import mongoose from 'mongoose';

/**
 * Mongoose setup utilities for tests
 * Prevents "Cannot overwrite model" errors in test environments
 */

// Store original mongoose.model function
const originalModel = mongoose.model;

// Override mongoose.model to handle existing models gracefully
mongoose.model = function(name, schema, collection, options) {
  try {
    // Try to get existing model
    return originalModel.call(this, name);
  } catch (error) {
    // Model doesn't exist, create it with original function
    return originalModel.call(this, name, schema, collection, options);
  }
};

/**
 * Clear all compiled models - useful for test cleanup
 */
export const clearModels = () => {
  // Clear the models cache
  Object.keys(mongoose.models).forEach(modelName => {
    delete mongoose.models[modelName];
  });
  
  // Clear the model schemas cache
  Object.keys(mongoose.modelSchemas).forEach(schemaName => {
    delete mongoose.modelSchemas[schemaName];
  });
};

/**
 * Reset mongoose.model to original function
 */
export const resetMongooseModel = () => {
  mongoose.model = originalModel;
};

export default mongoose;