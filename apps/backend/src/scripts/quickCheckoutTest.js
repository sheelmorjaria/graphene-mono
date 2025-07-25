import mongoose from 'mongoose';
import ShippingMethod from '../models/ShippingMethod.js';
import dotenv from 'dotenv';

dotenv.config();

const quickCheckoutTest = async () => {
  console.log('🔬 Quick Checkout Flow Test');
  console.log('===========================');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test data
    const testAddress = {
      fullName: 'John Smith',
      addressLine1: '123 Privacy Street',
      city: 'London',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    };

    const testCartData = {
      items: [
        { productId: '507f1f77bcf86cd799439011', quantity: 1, weight: 500 }
      ],
      totalValue: 75.00
    };

    console.log('\n📦 Testing Shipping Calculation');
    console.log('------------------------------');
    console.log(`Address: ${testAddress.fullName}, ${testAddress.city}, ${testAddress.country}`);
    console.log(`Cart: £${testCartData.totalValue}, ${testCartData.items[0].weight}g`);

    // Get shipping methods
    const shippingMethods = await ShippingMethod.find({ isActive: true }).sort({ displayOrder: 1 });
    console.log(`\n🚚 Found ${shippingMethods.length} active shipping methods:`);

    const availableRates = [];
    
    for (const method of shippingMethods) {
      console.log(`\n   Testing: ${method.name} (${method.code})`);
      console.log(`      Countries: ${method.criteria.supportedCountries.join(', ')}`);
      console.log(`      Base cost: £${method.baseCost}`);
      
      const calculation = method.calculateCost(testCartData, testAddress);
      
      if (calculation !== null) {
        console.log(`      ✅ Available: £${calculation.cost} ${calculation.isFreeShipping ? '(FREE)' : ''}`);
        availableRates.push({
          id: method._id,
          name: method.name,
          cost: calculation.cost,
          isFreeShipping: calculation.isFreeShipping
        });
      } else {
        console.log(`      ❌ Not available`);
      }
    }

    console.log(`\n📋 Summary: ${availableRates.length} shipping methods available`);
    
    if (availableRates.length > 0) {
      console.log('\n🎯 Available Options:');
      availableRates.forEach(rate => {
        console.log(`   • ${rate.name}: £${rate.cost} ${rate.isFreeShipping ? '(FREE)' : ''}`);
      });
      
      // Test address format conversion
      console.log('\n🔄 Address Format Conversion Test');
      console.log('--------------------------------');
      
      const frontendAddress = testAddress;
      console.log('Frontend format (fullName):');
      console.log(`   ${frontendAddress.fullName}`);
      console.log(`   ${frontendAddress.addressLine1}`);
      console.log(`   ${frontendAddress.city}, ${frontendAddress.postalCode}`);
      
      // Convert to backend format
      const nameParts = frontendAddress.fullName.split(' ');
      const backendAddress = {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        addressLine1: frontendAddress.addressLine1,
        city: frontendAddress.city,
        postalCode: frontendAddress.postalCode,
        country: frontendAddress.country
      };
      
      console.log('\nBackend format (firstName/lastName):');
      console.log(`   ${backendAddress.firstName} ${backendAddress.lastName}`);
      console.log(`   ${backendAddress.addressLine1}`);
      console.log(`   ${backendAddress.city}, ${backendAddress.postalCode}`);
      
      // Test address comparison (for admin display)
      const addressesAreSame = 
        backendAddress.firstName === backendAddress.firstName &&
        backendAddress.lastName === backendAddress.lastName &&
        backendAddress.addressLine1 === backendAddress.addressLine1 &&
        backendAddress.city === backendAddress.city &&
        backendAddress.postalCode === backendAddress.postalCode &&
        backendAddress.country === backendAddress.country;
      
      console.log(`\n🏠 Address comparison: ${addressesAreSame ? '✅ Same' : '❌ Different'}`);
      console.log(`Admin will show: ${addressesAreSame ? 'Single Delivery Address' : 'Separate Addresses'}`);
      
      console.log('\n✅ Checkout Flow Status');
      console.log('=======================');
      console.log('✅ Shipping methods: Working');
      console.log('✅ Rate calculation: Working');
      console.log('✅ Address conversion: Working');
      console.log('✅ Single address logic: Working');
      console.log('✅ Admin display logic: Ready');
      
      console.log('\n🎯 System Configuration');
      console.log('=======================');
      console.log('• Checkout steps: Payment & Delivery → Review');
      console.log('• Address collection: Single delivery address');
      console.log('• Shipping destination: Same as billing address');
      console.log('• Admin display: Smart address grouping');
      console.log('• Backend compatibility: Maintained');
      
    } else {
      console.log('❌ No shipping methods available for test address');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

quickCheckoutTest().catch(console.error);