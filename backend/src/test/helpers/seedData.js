import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import Order from '../../models/Order.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import PaymentGateway from '../../models/PaymentGateway.js';
import { createValidProductData, createValidUserData, createValidCategoryData } from './testData.js';

// Seed Categories
export const seedCategories = async () => {
  const categories = [
    createValidCategoryData({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'GrapheneOS-enabled smartphones'
    }),
    createValidCategoryData({
      name: 'Accessories',
      slug: 'accessories',
      description: 'Privacy-focused accessories'
    })
  ];

  const savedCategories = await Category.insertMany(categories);
  return savedCategories;
};

// Seed Products
export const seedProducts = async (categories) => {
  const products = [
    createValidProductData({
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro',
      sku: 'PIXEL9PRO-GRAPHENE',
      shortDescription: 'Privacy-focused Pixel 9 Pro',
      longDescription: 'Google Pixel 9 Pro with GrapheneOS pre-installed',
      price: 999.99,
      category: categories[0]._id,
      stockQuantity: 10,
      images: ['pixel9pro.jpg']
    }),
    createValidProductData({
      name: 'GrapheneOS Pixel 8',
      slug: 'grapheneos-pixel-8',
      sku: 'PIXEL8-GRAPHENE',
      shortDescription: 'Privacy-focused Pixel 8',
      longDescription: 'Google Pixel 8 with GrapheneOS pre-installed',
      price: 799.99,
      category: categories[0]._id,
      stockQuantity: 15,
      images: ['pixel8.jpg']
    }),
    createValidProductData({
      name: 'Privacy Screen Protector',
      slug: 'privacy-screen-protector',
      sku: 'PRIVACY-SCREEN-001',
      shortDescription: 'Anti-spy screen protector',
      longDescription: 'Privacy screen protector for enhanced security',
      price: 29.99,
      category: categories[1]._id,
      stockQuantity: 50,
      images: ['screen-protector.jpg']
    })
  ];

  const savedProducts = await Product.insertMany(products);
  return savedProducts;
};

// Seed Users
export const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  
  const users = [
    {
      ...createValidUserData({
        name: 'Admin User',
        email: 'admin@test.com',
        isAdmin: true
      }),
      password: hashedPassword
    },
    {
      ...createValidUserData({
        name: 'Test Customer',
        email: 'customer@test.com',
        isAdmin: false
      }),
      password: hashedPassword
    }
  ];

  const savedUsers = await User.insertMany(users);
  return savedUsers;
};

// Seed Shipping Methods
export const seedShippingMethods = async () => {
  const shippingMethods = [
    {
      name: 'Standard Shipping',
      identifier: 'standard',
      description: 'Delivery in 5-7 business days',
      basePrice: 10,
      isActive: true,
      estimatedDays: {
        min: 5,
        max: 7
      }
    },
    {
      name: 'Express Shipping',
      identifier: 'express',
      description: 'Delivery in 2-3 business days',
      basePrice: 25,
      isActive: true,
      estimatedDays: {
        min: 2,
        max: 3
      }
    }
  ];

  const savedMethods = await ShippingMethod.insertMany(shippingMethods);
  return savedMethods;
};

// Seed Payment Gateways
export const seedPaymentGateways = async () => {
  const gateways = [
    {
      name: 'PayPal',
      identifier: 'paypal',
      description: 'Pay with PayPal',
      isActive: true,
      settings: {
        environment: 'sandbox',
        clientId: 'test-client-id'
      }
    },
    {
      name: 'Bitcoin',
      identifier: 'bitcoin',
      description: 'Pay with Bitcoin',
      isActive: true,
      settings: {
        confirmations: 2
      }
    },
    {
      name: 'Monero',
      identifier: 'monero',
      description: 'Pay with Monero',
      isActive: true,
      settings: {
        confirmations: 10
      }
    }
  ];

  const savedGateways = await PaymentGateway.insertMany(gateways);
  return savedGateways;
};

// Seed Complete Test Database
export const seedTestDatabase = async () => {
  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    Order.deleteMany({}),
    ShippingMethod.deleteMany({}),
    PaymentGateway.deleteMany({})
  ]);

  // Seed data in order
  const categories = await seedCategories();
  const products = await seedProducts(categories);
  const users = await seedUsers();
  const shippingMethods = await seedShippingMethods();
  const paymentGateways = await seedPaymentGateways();

  return {
    categories,
    products,
    users,
    shippingMethods,
    paymentGateways
  };
};

// Helper to get seeded test data
export const getTestData = async () => {
  const adminUser = await User.findOne({ isAdmin: true });
  const customerUser = await User.findOne({ isAdmin: false });
  const categories = await Category.find();
  const products = await Product.find();
  const shippingMethods = await ShippingMethod.find();
  const paymentGateways = await PaymentGateway.find();

  return {
    adminUser,
    customerUser,
    categories,
    products,
    shippingMethods,
    paymentGateways
  };
};

export default {
  seedCategories,
  seedProducts,
  seedUsers,
  seedShippingMethods,
  seedPaymentGateways,
  seedTestDatabase,
  getTestData
};