import mongoose from 'mongoose';

/**
 * Helper function to safely get or create a Mongoose model
 * Prevents "Cannot overwrite model" errors in tests
 */
export const getModel = (modelName, schema) => {
  try {
    // Try to get existing model
    return mongoose.model(modelName);
  } catch (error) {
    // Model doesn't exist, create it
    return mongoose.model(modelName, schema);
  }
};

/**
 * Helper function to safely delete a model
 * Useful for test cleanup
 */
export const deleteModel = (modelName) => {
  try {
    delete mongoose.models[modelName];
    delete mongoose.modelSchemas[modelName];
  } catch (error) {
    // Model doesn't exist, ignore
  }
};

/**
 * Helper function to clear all models
 * Useful for complete test cleanup
 */
export const clearAllModels = () => {
  for (const modelName in mongoose.models) {
    delete mongoose.models[modelName];
  }
  for (const schemaName in mongoose.modelSchemas) {
    delete mongoose.modelSchemas[schemaName];
  }
};

/**
 * Helper function to safely import a model for tests
 * Returns the model if it exists, otherwise imports and returns it
 */
export const importModel = async (modelPath, modelName) => {
  try {
    return mongoose.model(modelName);
  } catch (error) {
    const modelModule = await import(modelPath);
    return modelModule.default;
  }
};