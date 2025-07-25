import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShippingMethod from '../models/ShippingMethod.js';

dotenv.config();

const debugShippingRates = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get all shipping methods
    const methods = await ShippingMethod.find({});
    console.log('📦 Current Shipping Methods:');
    console.log('============================');
    
    methods.forEach(method => {
      console.log(`\n${method.name} (${method.code}):`);
      console.log(`  Active: ${method.isActive}`);
      console.log(`  Base Cost: £${method.baseCost}`);
      console.log(`  Supported Countries: ${method.criteria.supportedCountries.join(', ')}`);
      console.log(`  Weight Range: ${method.criteria.minWeight}g - ${method.criteria.maxWeight}g`);
      console.log(`  Order Value Range: £${method.criteria.minOrderValue} - £${method.criteria.maxOrderValue}`);
      console.log(`  Free Shipping Threshold: ${method.criteria.freeShippingThreshold ? '£' + method.criteria.freeShippingThreshold : 'None'}`);
    });

    // Test common scenarios
    console.log('\n\n🧪 Testing Common Shipping Scenarios:');
    console.log('======================================');

    const testScenarios = [
      {
        name: 'UK Address (London)',
        cart: { items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: 79.99 }], totalValue: 79.99 },
        address: { country: 'GB', stateProvince: 'England', city: 'London' }
      },
      {
        name: 'Ireland Address (Dublin)', 
        cart: { items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: 79.99 }], totalValue: 79.99 },
        address: { country: 'IE', stateProvince: 'Dublin', city: 'Dublin' }
      },
      {
        name: 'US Address (New York)',
        cart: { items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: 150.00 }], totalValue: 150.00 },
        address: { country: 'US', stateProvince: 'NY', city: 'New York' }
      },
      {
        name: 'Canada Address (Toronto)',
        cart: { items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: 150.00 }], totalValue: 150.00 },
        address: { country: 'CA', stateProvince: 'ON', city: 'Toronto' }
      },
      {
        name: 'Germany Address (Berlin)',
        cart: { items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: 150.00 }], totalValue: 150.00 },
        address: { country: 'DE', stateProvince: 'Berlin', city: 'Berlin' }
      },
      {
        name: 'Unsupported Country (Spain)',
        cart: { items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: 150.00 }], totalValue: 150.00 },
        address: { country: 'ES', stateProvince: 'Madrid', city: 'Madrid' }
      },
      {
        name: 'Low Value International Order (US)',
        cart: { items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: 50.00 }], totalValue: 50.00 },
        address: { country: 'US', stateProvince: 'NY', city: 'New York' }
      }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n📍 ${scenario.name}:`);
      console.log(`   Cart Value: £${scenario.cart.totalValue}`);
      console.log(`   Country: ${scenario.address.country}`);
      
      const rates = await ShippingMethod.calculateRatesForCart(scenario.cart, scenario.address);
      
      if (rates.length === 0) {
        console.log('   ❌ No shipping methods available');
        console.log('   🔍 Checking why:');
        
        // Check each method individually
        for (const method of methods) {
          const calculation = method.calculateCost(scenario.cart, scenario.address);
          if (calculation === null) {
            const reasons = [];
            if (!method.criteria.supportedCountries.includes(scenario.address.country)) {
              reasons.push(`Country ${scenario.address.country} not supported (supports: ${method.criteria.supportedCountries.join(', ')})`);
            }
            if (scenario.cart.totalValue < method.criteria.minOrderValue) {
              reasons.push(`Order value £${scenario.cart.totalValue} below minimum £${method.criteria.minOrderValue}`);
            }
            if (scenario.cart.totalValue > method.criteria.maxOrderValue) {
              reasons.push(`Order value £${scenario.cart.totalValue} above maximum £${method.criteria.maxOrderValue}`);
            }
            console.log(`      ${method.name}: ${reasons.join(', ')}`);
          }
        }
      } else {
        console.log('   ✅ Available shipping methods:');
        rates.forEach(rate => {
          const freeText = rate.isFreeShipping ? ' (FREE)' : '';
          console.log(`      ${rate.name}: £${rate.cost}${freeText} (${rate.estimatedDelivery})`);
        });
      }
    }

    console.log('\n💡 Recommendations:');
    console.log('===================');
    console.log('1. If no methods available for your country, add it to supportedCountries');
    console.log('2. Consider adding more countries to shipping method configurations');
    console.log('3. Check if order value meets minimum requirements for international shipping');
    console.log('4. Verify cart has valid products with weights');

  } catch (error) {
    console.error('Error debugging shipping rates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

debugShippingRates();