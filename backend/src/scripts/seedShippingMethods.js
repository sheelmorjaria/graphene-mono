import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShippingMethod from '../models/ShippingMethod.js';

dotenv.config();

const shippingMethods = [
  {
    name: 'Standard Shipping',
    code: 'STANDARD',
    description: 'Regular delivery service with tracking',
    estimatedDeliveryDays: { min: 5, max: 7 },
    baseCost: 7.99, // £7.99
    criteria: {
      minWeight: 0,
      maxWeight: 20000, // 20kg
      minOrderValue: 0,
      maxOrderValue: 999999.99,
      supportedCountries: ['GB', 'IE'],
      freeShippingThreshold: 60.00 // £60
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
    name: 'Express Shipping',
    code: 'EXPRESS',
    description: 'Fast delivery service with priority handling',
    estimatedDeliveryDays: { min: 2, max: 3 },
    baseCost: 15.99, // £15.99
    criteria: {
      minWeight: 0,
      maxWeight: 15000, // 15kg
      minOrderValue: 0,
      maxOrderValue: 999999.99,
      supportedCountries: ['GB', 'IE'],
      freeShippingThreshold: 120.00 // £120
    },
    pricing: {
      weightRate: 0.0016, // £0.0016 per gram over base
      baseWeight: 500, // 0.5kg included in base cost
      dimensionalWeightFactor: 4000
    },
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Next Day Delivery',
    code: 'NEXTDAY',
    description: 'Next business day delivery',
    estimatedDeliveryDays: { min: 1, max: 1 },
    baseCost: 31.99, // £31.99
    criteria: {
      minWeight: 0,
      maxWeight: 10000, // 10kg
      minOrderValue: 40.00, // £40
      maxOrderValue: 999999.99,
      supportedCountries: ['GB'],
      freeShippingThreshold: null // No free shipping for next day
    },
    pricing: {
      weightRate: 0.004, // £0.004 per gram over base
      baseWeight: 250, // 0.25kg included in base cost
      dimensionalWeightFactor: 3000
    },
    isActive: true,
    displayOrder: 3
  },
  {
    name: 'Economy Shipping',
    code: 'ECONOMY',
    description: 'Budget-friendly delivery option',
    estimatedDeliveryDays: { min: 7, max: 14 },
    baseCost: 3.99, // £3.99
    criteria: {
      minWeight: 0,
      maxWeight: 25000, // 25kg
      minOrderValue: 0,
      maxOrderValue: 999999.99,
      supportedCountries: ['GB', 'IE'],
      freeShippingThreshold: 40.00 // £40
    },
    pricing: {
      weightRate: 0.0004, // £0.0004 per gram over base
      baseWeight: 2000, // 2kg included in base cost
      dimensionalWeightFactor: 6000
    },
    isActive: true,
    displayOrder: 4
  },
  {
    name: 'International Shipping',
    code: 'INTERNATIONAL',
    description: 'International delivery service',
    estimatedDeliveryDays: { min: 10, max: 21 },
    baseCost: 23.99, // £23.99
    criteria: {
      minWeight: 0,
      maxWeight: 30000, // 30kg
      minOrderValue: 80.00, // £80
      maxOrderValue: 999999.99,
      supportedCountries: ['US', 'CA', 'DE', 'FR', 'AU', 'JP'],
      freeShippingThreshold: 160.00 // £160
    },
    pricing: {
      weightRate: 0.0024, // £0.0024 per gram over base
      baseWeight: 500, // 0.5kg included in base cost
      dimensionalWeightFactor: 4000
    },
    isActive: true,
    displayOrder: 5
  }
];

const seedShippingMethods = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing shipping methods
    await ShippingMethod.deleteMany({});
    console.log('Cleared existing shipping methods');

    // Insert new shipping methods
    const insertedMethods = await ShippingMethod.insertMany(shippingMethods);
    console.log(`Inserted ${insertedMethods.length} shipping methods:`);
    
    insertedMethods.forEach(method => {
      console.log(`- ${method.name} (${method.code}): $${method.baseCost} - ${method.formattedDelivery}`);
    });

    console.log('\nShipping methods seeded successfully!');
    
    // Test rate calculation
    console.log('\nTesting rate calculation...');
    const testCart = {
      items: [
        { productId: 'test', name: 'Test Product', quantity: 1, weight: 500, unitPrice: 79.99 }
      ],
      totalValue: 79.99
    };
    
    const testAddress = { country: 'GB', stateProvince: 'England', city: 'London' };
    const rates = await ShippingMethod.calculateRatesForCart(testCart, testAddress);
    
    console.log('Available rates for test cart:');
    rates.forEach(rate => {
      console.log(`- ${rate.name}: $${rate.cost} (${rate.estimatedDelivery})`);
    });

  } catch (error) {
    console.error('Error seeding shipping methods:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedShippingMethods();