import mongoose from 'mongoose';
import GeneralSettings from '../models/GeneralSettings.js';
import dotenv from 'dotenv';

dotenv.config();

export const initializeSettings = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Initialize default settings if none exist
    const settings = await GeneralSettings.getCurrentSettings();
    
    console.log('✅ Settings initialized successfully!');
    console.log('Settings:', JSON.stringify(settings, null, 2));
    
    return settings;

  } catch (error) {
    console.error('❌ Error initializing settings:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script only if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSettings();
}