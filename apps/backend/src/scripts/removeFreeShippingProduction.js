import mongoose from 'mongoose';
import ShippingMethod from '../models/ShippingMethod.js';
import dotenv from 'dotenv';

dotenv.config();

// Use production MongoDB URI from environment variable
const PROD_MONGODB_URI = process.env.PROD_MONGODB_URI || process.env.MONGODB_URI;

if (!PROD_MONGODB_URI) {
  console.error('❌ Error: PROD_MONGODB_URI or MONGODB_URI environment variable not set');
  console.log('Please set PROD_MONGODB_URI to your production MongoDB connection string');
  process.exit(1);
}

const removeFreeShippingThresholds = async () => {
  console.log('🔄 Removing Free Shipping Thresholds from Production Database');
  console.log('==============================================================');
  console.log(`📍 Connecting to: ${PROD_MONGODB_URI.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://***@')}`);

  try {
    // Connect to MongoDB
    await mongoose.connect(PROD_MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');

    // Find all shipping methods
    const allMethods = await ShippingMethod.find({});
    console.log(`\n📊 Current Shipping Methods (${allMethods.length} total):`);
    
    allMethods.forEach((method, index) => {
      const threshold = method.criteria?.freeShippingThreshold;
      console.log(`   ${index + 1}. ${method.name} (${method.code})`);
      console.log(`      - Base Cost: £${method.baseCost}`);
      console.log(`      - Free Shipping Threshold: ${threshold ? `£${threshold}` : 'None'}`);
    });

    // Remove freeShippingThreshold field from all shipping methods
    // Use multiple approaches to ensure complete removal
    const updateResult1 = await ShippingMethod.updateMany(
      {},
      { $unset: { 'criteria.freeShippingThreshold': 1 } }
    );

    // Also try removing any top-level freeShippingThreshold
    const updateResult2 = await ShippingMethod.updateMany(
      {},
      { $unset: { 'freeShippingThreshold': 1 } }
    );

    // Manually update each document to ensure clean removal
    for (const method of allMethods) {
      if (method.criteria && method.criteria.freeShippingThreshold !== undefined) {
        delete method.criteria.freeShippingThreshold;
        await method.save();
      }
    }

    console.log('\n✅ Update Results:');
    console.log(`   - UpdateMany 1 (criteria.freeShippingThreshold): ${updateResult1.matchedCount} matched, ${updateResult1.modifiedCount} modified`);
    console.log(`   - UpdateMany 2 (freeShippingThreshold): ${updateResult2.matchedCount} matched, ${updateResult2.modifiedCount} modified`);
    console.log('   - Manual cleanup completed');

    // Verify the update
    const updatedMethods = await ShippingMethod.find({});
    console.log('\n📋 Updated Shipping Methods:');
    
    updatedMethods.forEach((method, index) => {
      const threshold = method.criteria?.freeShippingThreshold;
      console.log(`   ${index + 1}. ${method.name} (${method.code})`);
      console.log(`      - Base Cost: £${method.baseCost}`);
      console.log(`      - Free Shipping: ${threshold ? `⚠️ STILL HAS THRESHOLD: £${threshold}` : '✅ Removed'}`);
    });

    // Final verification
    const remainingWithThreshold = await ShippingMethod.find({
      'criteria.freeShippingThreshold': { $exists: true }
    });

    if (remainingWithThreshold.length === 0) {
      console.log('\n✅ SUCCESS: All free shipping thresholds have been removed!');
    } else {
      console.log(`\n⚠️  WARNING: ${remainingWithThreshold.length} shipping methods still have free shipping thresholds`);
      remainingWithThreshold.forEach(method => {
        console.log(`   - ${method.name}: £${method.criteria.freeShippingThreshold}`);
      });
    }

  } catch (error) {
    console.error('❌ Error updating shipping methods:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
removeFreeShippingThresholds().catch(console.error);