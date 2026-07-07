import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShippingMethod from '../models/ShippingMethod.js';

dotenv.config();

const improvedShippingMethods = [
  {
    name: 'Royal Mail Special Delivery',
    code: 'SPECIALDELIVERY',
    description: 'Fully insured delivery guaranteed next working day',
    estimatedDeliveryDays: { min: 1, max: 1 },
    baseCost: 20.45, // £20.45
    criteria: {
      minWeight: 0,
      maxWeight: 20000, // 20kg
      minOrderValue: 0,
      maxOrderValue: 999999.99,
      supportedCountries: ['GB'] // UK only — Royal Mail Special Delivery Guaranteed
    },
    pricing: {
      weightRate: 0.0008, // £0.0008 per gram over base
      baseWeight: 1000, // 1kg included in base cost
      dimensionalWeightFactor: 5000
    },
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'European Shipping',
    code: 'EUROPEAN',
    description: 'Delivery service to European Union countries',
    estimatedDeliveryDays: { min: 7, max: 14 },
    baseCost: 19.99, // £19.99
    criteria: {
      minWeight: 0,
      maxWeight: 25000, // 25kg
      minOrderValue: 50.00, // £50 minimum
      maxOrderValue: 999999.99,
      supportedCountries: [
        'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
        'DE', 'GR', 'HU', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL',
        'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'NO', 'CH', 'IS'
      ],
      freeShippingThreshold: 140.00 // £140
    },
    pricing: {
      weightRate: 0.0020, // £0.0020 per gram over base
      baseWeight: 500, // 0.5kg included in base cost
      dimensionalWeightFactor: 4000
    },
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'International Shipping',
    code: 'INTERNATIONAL',
    description: 'Worldwide delivery service',
    estimatedDeliveryDays: { min: 10, max: 21 },
    baseCost: 29.99, // £29.99
    criteria: {
      minWeight: 0,
      maxWeight: 30000, // 30kg
      minOrderValue: 80.00, // £80 minimum
      maxOrderValue: 999999.99,
      supportedCountries: [
        'US', 'CA', 'AU', 'NZ', 'JP', 'KR', 'SG', 'HK', 'TW',
        'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'UY', 'EC', 'BO',
        'ZA', 'EG', 'MA', 'KE', 'NG', 'GH', 'TN', 'DZ',
        'IN', 'CN', 'TH', 'MY', 'ID', 'PH', 'VN', 'BD'
      ],
      freeShippingThreshold: 200.00 // £200
    },
    pricing: {
      weightRate: 0.0030, // £0.0030 per gram over base
      baseWeight: 500, // 0.5kg included in base cost
      dimensionalWeightFactor: 4000
    },
    isActive: true,
    displayOrder: 4
  }
];

const updateShippingMethods = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing shipping methods
    await ShippingMethod.deleteMany({});
    console.log('Cleared existing shipping methods');

    // Insert improved shipping methods
    const insertedMethods = await ShippingMethod.insertMany(improvedShippingMethods);
    console.log(`\nInserted ${insertedMethods.length} improved shipping methods:`);
    
    insertedMethods.forEach(method => {
      console.log(`✅ ${method.name} (${method.code}):`);
      console.log(`   Cost: £${method.baseCost} | Delivery: ${method.formattedDelivery}`);
      console.log(`   Countries: ${method.criteria.supportedCountries.length} supported`);
      console.log(`   Min Order: £${method.criteria.minOrderValue} | Free Shipping: £${method.criteria.freeShippingThreshold || 'None'}`);
    });

    console.log('\n🌍 Coverage Summary:');
    console.log('===================');
    console.log('✅ UK: Royal Mail Special Delivery (next working day, fully insured)');
    console.log('✅ Europe (29 countries): European shipping'); 
    console.log('✅ Worldwide (34 countries): International shipping');

    console.log('\n🧪 Testing improved coverage...');
    
    // Test the problematic scenarios
    const testScenarios = [
      { name: 'Spain', address: { country: 'ES' }, cartValue: 150 },
      { name: 'Low-value US order', address: { country: 'US' }, cartValue: 50 },
      { name: 'France', address: { country: 'FR' }, cartValue: 100 },
      { name: 'Australia', address: { country: 'AU' }, cartValue: 200 }
    ];

    for (const scenario of testScenarios) {
      const cart = { 
        items: [{ productId: 'test', quantity: 1, weight: 500, unitPrice: scenario.cartValue }], 
        totalValue: scenario.cartValue 
      };
      
      const rates = await ShippingMethod.calculateRatesForCart(cart, scenario.address);
      
      console.log(`\n📍 ${scenario.name} (£${scenario.cartValue}):`);
      if (rates.length === 0) {
        console.log('   ❌ Still no shipping methods available');
      } else {
        console.log('   ✅ Available methods:');
        rates.forEach(rate => {
          const freeText = rate.isFreeShipping ? ' (FREE)' : '';
          console.log(`      ${rate.name}: £${rate.cost}${freeText}`);
        });
      }
    }

  } catch (error) {
    console.error('Error updating shipping methods:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

updateShippingMethods();