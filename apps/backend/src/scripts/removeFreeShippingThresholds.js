import mongoose from 'mongoose';
import ShippingMethod from '../models/ShippingMethod.js';
import dotenv from 'dotenv';

dotenv.config();

const removeFreeShippingThresholds = async () => {
  console.log('🔄 Removing Free Shipping Thresholds from Shipping Methods');
  console.log('========================================================');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all shipping methods that have freeShippingThreshold field
    const methodsWithThreshold = await ShippingMethod.find({
      'criteria.freeShippingThreshold': { $exists: true }
    });

    console.log(`📊 Found ${methodsWithThreshold.length} shipping methods with free shipping thresholds`);

    if (methodsWithThreshold.length === 0) {
      console.log('✅ No shipping methods found with free shipping thresholds. Update not needed.');
      return;
    }

    // List methods that will be updated
    methodsWithThreshold.forEach((method, index) => {
      console.log(`   ${index + 1}. ${method.name} (${method.code}) - Threshold: £${method.criteria.freeShippingThreshold || 'null'}`);
    });

    // Remove freeShippingThreshold field from all shipping methods
    const updateResult = await ShippingMethod.updateMany(
      { 'criteria.freeShippingThreshold': { $exists: true } },
      { $unset: { 'criteria.freeShippingThreshold': '' } }
    );

    console.log(`\n✅ Successfully updated ${updateResult.modifiedCount} shipping methods`);
    console.log(`   - Matched: ${updateResult.matchedCount} documents`);
    console.log(`   - Modified: ${updateResult.modifiedCount} documents`);

    // Verify the update
    const remainingWithThreshold = await ShippingMethod.find({
      'criteria.freeShippingThreshold': { $exists: true }
    });

    if (remainingWithThreshold.length === 0) {
      console.log('✅ Verification: No shipping methods have free shipping thresholds anymore');
    } else {
      console.log(`❌ Warning: ${remainingWithThreshold.length} shipping methods still have free shipping thresholds`);
    }

    // Show updated methods
    const allMethods = await ShippingMethod.find({});
    console.log(`\n📋 Updated Shipping Methods (${allMethods.length} total):`);
    allMethods.forEach((method, index) => {
      const hasThreshold = method.criteria.freeShippingThreshold !== undefined;
      console.log(`   ${index + 1}. ${method.name} (${method.code}) - £${method.baseCost} - ${hasThreshold ? '⚠️ Still has threshold' : '✅ No threshold'}`);
    });

  } catch (error) {
    console.error('❌ Error updating shipping methods:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

removeFreeShippingThresholds().catch(console.error);