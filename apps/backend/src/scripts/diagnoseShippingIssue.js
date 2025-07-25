import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShippingMethod from '../models/ShippingMethod.js';

dotenv.config();

// Usage: node src/scripts/diagnoseShippingIssue.js [country] [orderValue] [weight]
// Example: node src/scripts/diagnoseShippingIssue.js ES 45.99 800

const diagnoseShippingIssue = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoURI);

    // Get parameters from command line
    const country = process.argv[2] || 'ES'; // Default Spain
    const orderValue = parseFloat(process.argv[3]) || 45.99; // Default low value
    const weight = parseInt(process.argv[4]) || 800; // Default 800g

    console.log('🔍 SHIPPING DIAGNOSIS');
    console.log('=====================');
    console.log(`Country: ${country}`);
    console.log(`Order Value: £${orderValue}`);
    console.log(`Weight: ${weight}g`);

    const testCart = {
      items: [{ productId: 'test', quantity: 1, weight: weight, unitPrice: orderValue }],
      totalValue: orderValue
    };
    
    const testAddress = { country: country, stateProvince: 'Test', city: 'Test' };

    // Get all shipping methods
    const methods = await ShippingMethod.find({ isActive: true });
    console.log(`\n📦 Found ${methods.length} active shipping methods\n`);

    // Test each method individually
    for (const method of methods) {
      console.log(`🚚 ${method.name} (${method.code}):`);
      
      const calculation = method.calculateCost(testCart, testAddress);
      
      if (calculation === null) {
        console.log('   ❌ NOT AVAILABLE');
        
        // Check each criteria
        const reasons = [];
        
        if (!method.criteria.supportedCountries.includes(country)) {
          reasons.push('❌ Country not supported');
          console.log(`      Country ${country} not in supported list: [${method.criteria.supportedCountries.join(', ')}]`);
        } else {
          reasons.push('✅ Country supported');
        }
        
        if (orderValue < method.criteria.minOrderValue) {
          reasons.push('❌ Order value too low');
          console.log(`      Order value £${orderValue} < minimum £${method.criteria.minOrderValue}`);
        } else if (orderValue > method.criteria.maxOrderValue) {
          reasons.push('❌ Order value too high');
          console.log(`      Order value £${orderValue} > maximum £${method.criteria.maxOrderValue}`);
        } else {
          reasons.push('✅ Order value in range');
        }
        
        if (weight < method.criteria.minWeight) {
          reasons.push('❌ Weight too low');
          console.log(`      Weight ${weight}g < minimum ${method.criteria.minWeight}g`);
        } else if (weight > method.criteria.maxWeight) {
          reasons.push('❌ Weight too high');
          console.log(`      Weight ${weight}g > maximum ${method.criteria.maxWeight}g`);
        } else {
          reasons.push('✅ Weight in range');
        }
        
      } else {
        console.log('   ✅ AVAILABLE');
        const freeText = calculation.isFreeShipping ? ' (FREE SHIPPING!)' : '';
        console.log(`      Cost: £${calculation.cost}${freeText}`);
        console.log(`      Delivery: ${method.formattedDelivery}`);
        if (calculation.details) {
          console.log(`      Details: Base £${calculation.details.baseCost} + Weight £${calculation.details.weightCharge.toFixed(2)}`);
        }
      }
      console.log('');
    }

    // Final recommendation
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');
    
    const availableMethods = await ShippingMethod.calculateRatesForCart(testCart, testAddress);
    
    if (availableMethods.length === 0) {
      console.log('❌ NO SHIPPING METHODS AVAILABLE');
      console.log('\nPossible solutions:');
      console.log(`1. Add ${country} to supported countries for existing methods`);
      console.log(`2. Lower minimum order value (current lowest: £${Math.min(...methods.map(m => m.criteria.minOrderValue))})`);
      console.log('3. Increase order value to meet minimums');
      console.log('4. Check if products have valid weights assigned');
    } else {
      console.log('✅ SHIPPING METHODS AVAILABLE:');
      availableMethods.forEach(method => {
        const freeText = method.isFreeShipping ? ' (FREE)' : '';
        console.log(`   ${method.name}: £${method.cost}${freeText}`);
      });
    }

  } catch (error) {
    console.error('Error diagnosing shipping issue:', error);
  } finally {
    await mongoose.disconnect();
  }
};

diagnoseShippingIssue();