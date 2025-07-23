import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const sampleCategories = [
  {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Privacy-focused smartphones with GrapheneOS'
  },
  {
    name: 'Accessories',
    slug: 'accessories', 
    description: 'Phone accessories and peripherals'
  },
  {
    name: 'Cases',
    slug: 'cases',
    description: 'Protective cases for GrapheneOS devices'
  }
];

const sampleProducts = [
  // Smartphones
  {
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    shortDescription: 'Premium privacy-focused smartphone with GrapheneOS pre-installed',
    longDescription: 'The Pixel 9 Pro with GrapheneOS offers the ultimate in mobile privacy and security. This device features a stunning 6.3-inch OLED display with 120Hz refresh rate, advanced triple-camera system with computational photography, and the latest Titan M security chip. GrapheneOS provides hardened security with app sandboxing, network permission controls, and anti-exploitation mitigations while maintaining full Android app compatibility.',
    price: 899.99,
    images: [
      'https://example.com/pixel9pro-front.jpg',
      'https://example.com/pixel9pro-back.jpg',
      'https://example.com/pixel9pro-side.jpg',
      'https://example.com/pixel9pro-camera.jpg'
    ],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 25,
    attributes: [
      { name: 'Display', value: '6.3" OLED, 120Hz' },
      { name: 'Storage', value: '256GB' },
      { name: 'RAM', value: '12GB' },
      { name: 'Color', value: 'Obsidian' },
      { name: 'Camera', value: '50MP Triple Camera' },
      { name: 'OS', value: 'GrapheneOS (Android 14)' },
      { name: 'Battery', value: '5000mAh' },
      { name: 'Connectivity', value: '5G, WiFi 6E, Bluetooth 5.3' }
    ],
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 9',
    slug: 'grapheneos-pixel-9',
    shortDescription: 'High-performance privacy smartphone with GrapheneOS',
    longDescription: 'The standard Pixel 9 with GrapheneOS pre-installed offers the perfect balance of performance, privacy, and value. Featuring a 6.1-inch OLED display, Google Tensor G4 processor, and advanced AI capabilities, all secured with GrapheneOS hardened security features. Includes enhanced app permissions, secure boot verification, and privacy-focused defaults.',
    price: 799.99,
    images: [
      'https://example.com/pixel9-front.jpg',
      'https://example.com/pixel9-back.jpg',
      'https://example.com/pixel9-lifestyle.jpg'
    ],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 32,
    attributes: [
      { name: 'Display', value: '6.1" OLED, 90Hz' },
      { name: 'Storage', value: '128GB' },
      { name: 'RAM', value: '8GB' },
      { name: 'Color', value: 'Porcelain' },
      { name: 'Camera', value: '50MP Dual Camera' },
      { name: 'OS', value: 'GrapheneOS (Android 14)' },
      { name: 'Battery', value: '4700mAh' },
      { name: 'Processor', value: 'Google Tensor G4' }
    ],
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 8 Pro',
    slug: 'grapheneos-pixel-8-pro',
    shortDescription: 'Previous generation flagship with GrapheneOS',
    longDescription: 'Pixel 8 Pro with GrapheneOS. Excellent value with proven hardware and maximum privacy protection.',
    price: 699.99,
    images: ['https://example.com/pixel8pro-1.jpg'],
    condition: 'excellent',
    stockStatus: 'in_stock',
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 8',
    slug: 'grapheneos-pixel-8',
    shortDescription: 'Reliable privacy smartphone with GrapheneOS',
    longDescription: 'Pixel 8 with GrapheneOS pre-configured. Great performance and battery life with privacy-first approach.',
    price: 599.99,
    images: ['https://example.com/pixel8-1.jpg'],
    condition: 'excellent',
    stockStatus: 'in_stock',
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 7 Pro',
    slug: 'grapheneos-pixel-7-pro',
    shortDescription: 'Previous generation Pro model with GrapheneOS',
    longDescription: 'Pixel 7 Pro with GrapheneOS. Still excellent performance with comprehensive privacy features.',
    price: 549.99,
    images: ['https://example.com/pixel7pro-1.jpg'],
    condition: 'good',
    stockStatus: 'in_stock',
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 7',
    slug: 'grapheneos-pixel-7',
    shortDescription: 'Budget-friendly GrapheneOS smartphone',
    longDescription: 'Pixel 7 with GrapheneOS. Affordable entry point into privacy-focused mobile computing.',
    price: 449.99,
    images: ['https://example.com/pixel7-1.jpg'],
    condition: 'good',
    stockStatus: 'in_stock',
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 6 Pro (Refurbished)',
    slug: 'grapheneos-pixel-6-pro-refurb',
    shortDescription: 'Refurbished Pixel 6 Pro with fresh GrapheneOS install',
    longDescription: 'Professionally refurbished Pixel 6 Pro with GrapheneOS. Great value for privacy-conscious users.',
    price: 399.99,
    images: ['https://example.com/pixel6pro-1.jpg'],
    condition: 'fair',
    stockStatus: 'in_stock',
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 6 (Refurbished)',
    slug: 'grapheneos-pixel-6-refurb',
    shortDescription: 'Budget refurbished Pixel 6 with GrapheneOS',
    longDescription: 'Refurbished Pixel 6 with GrapheneOS pre-installed. Most affordable way to get GrapheneOS.',
    price: 299.99,
    images: ['https://example.com/pixel6-1.jpg'],
    condition: 'fair',
    stockStatus: 'in_stock',
    category: 'smartphones'
  },

  // Accessories
  {
    name: 'USB-C Privacy Cable',
    slug: 'usb-c-privacy-cable',
    shortDescription: 'Secure USB-C cable with data blocking',
    longDescription: 'Premium USB-C cable with built-in data line blocking for secure charging without data transfer risk.',
    price: 29.99,
    images: ['https://example.com/usb-cable-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Faraday Pouch',
    slug: 'faraday-pouch',
    shortDescription: 'Signal-blocking pouch for maximum privacy',
    longDescription: 'Professional-grade Faraday pouch that blocks all RF signals including WiFi, Bluetooth, and cellular.',
    price: 39.99,
    images: ['https://example.com/faraday-pouch-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Privacy Screen Protector',
    slug: 'privacy-screen-protector',
    shortDescription: 'Anti-spy screen protector for Pixel devices',
    longDescription: 'Tempered glass screen protector with privacy filter that prevents shoulder surfing.',
    price: 24.99,
    images: ['https://example.com/screen-protector-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Wireless Charging Pad',
    slug: 'wireless-charging-pad',
    shortDescription: 'Secure wireless charging for GrapheneOS devices',
    longDescription: 'Qi-compatible wireless charging pad optimized for GrapheneOS devices with power delivery control.',
    price: 49.99,
    images: ['https://example.com/wireless-charger-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Audio Privacy Adapter',
    slug: 'audio-privacy-adapter',
    shortDescription: 'USB-C to 3.5mm adapter with privacy features',
    longDescription: 'Digital audio adapter that prevents audio fingerprinting and provides clean sound output.',
    price: 19.99,
    images: ['https://example.com/audio-adapter-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Car Mount Kit',
    slug: 'car-mount-kit',
    shortDescription: 'Secure car mount for GrapheneOS devices',
    longDescription: 'Professional car mount with adjustable positioning and cable management for GrapheneOS phones.',
    price: 34.99,
    images: ['https://example.com/car-mount-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Portable Battery Pack',
    slug: 'portable-battery-pack',
    shortDescription: 'High-capacity power bank for extended use',
    longDescription: 'Premium 20,000mAh battery pack with multiple charging ports and power delivery support.',
    price: 59.99,
    images: ['https://example.com/battery-pack-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },

  // Cases
  {
    name: 'Rugged Pixel 9 Pro Case',
    slug: 'rugged-pixel-9-pro-case',
    shortDescription: 'Military-grade protection for Pixel 9 Pro',
    longDescription: 'Ultra-protective case with reinforced corners and shock absorption for maximum device protection.',
    price: 44.99,
    images: ['https://example.com/case-9pro-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Minimalist Pixel 9 Case',
    slug: 'minimalist-pixel-9-case',
    shortDescription: 'Slim protection for Pixel 9',
    longDescription: 'Ultra-thin case that preserves the original design while providing essential protection.',
    price: 24.99,
    images: ['https://example.com/case-9-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Leather Pixel 8 Pro Case',
    slug: 'leather-pixel-8-pro-case',
    shortDescription: 'Premium leather case for Pixel 8 Pro',
    longDescription: 'Hand-crafted genuine leather case with card slots and elegant design for professionals.',
    price: 54.99,
    images: ['https://example.com/case-8pro-leather-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Clear Pixel 8 Case',
    slug: 'clear-pixel-8-case',
    shortDescription: 'Crystal clear protection for Pixel 8',
    longDescription: 'Transparent case that showcases your device while providing drop protection and scratch resistance.',
    price: 19.99,
    images: ['https://example.com/case-8-clear-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Pixel 7 Pro Battery Case',
    slug: 'pixel-7-pro-battery-case',
    shortDescription: 'Extended battery case for Pixel 7 Pro',
    longDescription: 'Protective case with built-in 5000mAh battery for all-day power and protection.',
    price: 79.99,
    images: ['https://example.com/case-7pro-battery-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Wallet Pixel 7 Case',
    slug: 'wallet-pixel-7-case',
    shortDescription: 'All-in-one wallet case for Pixel 7',
    longDescription: 'Leather wallet case with card storage, cash pocket, and magnetic closure for convenience.',
    price: 39.99,
    images: ['https://example.com/case-7-wallet-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Waterproof Pixel 6 Pro Case',
    slug: 'waterproof-pixel-6-pro-case',
    shortDescription: 'IP68 waterproof case for Pixel 6 Pro',
    longDescription: 'Fully sealed waterproof case rated IP68 for underwater use and extreme conditions.',
    price: 69.99,
    images: ['https://example.com/case-6pro-waterproof-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Pixel 6 Gaming Case',
    slug: 'pixel-6-gaming-case',
    shortDescription: 'Gaming-optimized case for Pixel 6',
    longDescription: 'Ergonomic case designed for mobile gaming with enhanced grip and cooling ventilation.',
    price: 34.99,
    images: ['https://example.com/case-6-gaming-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },

  // Additional products to reach 30
  {
    name: 'GrapheneOS Setup Service',
    slug: 'grapheneos-setup-service',
    shortDescription: 'Professional GrapheneOS installation and setup',
    longDescription: 'Expert installation and configuration of GrapheneOS on your compatible device with privacy optimization.',
    price: 149.99,
    images: ['https://example.com/service-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Privacy Consultation',
    slug: 'privacy-consultation',
    shortDescription: 'Personal privacy and security consultation',
    longDescription: 'One-on-one consultation session to optimize your GrapheneOS setup and digital privacy practices.',
    price: 99.99,
    images: ['https://example.com/consultation-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Universal Case Stand',
    slug: 'universal-case-stand',
    shortDescription: 'Adjustable stand for any phone case',
    longDescription: 'Universal phone stand that works with most cases and provides multiple viewing angles.',
    price: 16.99,
    images: ['https://example.com/stand-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Anti-Spy Camera Cover Set',
    slug: 'camera-cover-set',
    shortDescription: 'Physical camera privacy covers',
    longDescription: 'Set of sliding camera covers for front and rear cameras to ensure complete visual privacy.',
    price: 12.99,
    images: ['https://example.com/camera-cover-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'GrapheneOS Sticker Pack',
    slug: 'grapheneos-sticker-pack',
    shortDescription: 'Official GrapheneOS branded stickers',
    longDescription: 'High-quality vinyl stickers featuring the GrapheneOS logo and privacy-themed designs.',
    price: 8.99,
    images: ['https://example.com/stickers-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  },
  {
    name: 'Pixel Universal Flip Case',
    slug: 'pixel-universal-flip-case',
    shortDescription: 'Classic flip case for multiple Pixel models',
    longDescription: 'Traditional flip case compatible with Pixel 6, 7, and 8 series with magnetic closure.',
    price: 29.99,
    images: ['https://example.com/flip-case-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'cases'
  },
  {
    name: 'Premium Cleaning Kit',
    slug: 'premium-cleaning-kit',
    shortDescription: 'Professional device cleaning and maintenance kit',
    longDescription: 'Complete cleaning kit with microfiber cloths, cleaning solution, and tools for maintaining your GrapheneOS device.',
    price: 22.99,
    images: ['https://example.com/cleaning-kit-1.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    category: 'accessories'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create categories first and get their IDs
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`📂 Created ${createdCategories.length} categories`);

    // Create a mapping of category slugs to IDs
    const categoryMap = createdCategories.reduce((map, category) => {
      map[category.slug] = category._id;
      return map;
    }, {});

    // Update products with category IDs and add missing fields
    const productsWithCategories = sampleProducts.map((product, _index) => ({
      ...product,
      category: categoryMap[product.category],
      // Add stockQuantity if not present
      stockQuantity: product.stockQuantity || Math.floor(Math.random() * 50) + 5,
      // Add default attributes if not present
      attributes: product.attributes || [
        { name: 'Condition', value: product.condition || 'new' },
        { name: 'Category', value: product.category || 'accessories' }
      ]
    }));

    // Create products
    const createdProducts = await Product.insertMany(productsWithCategories);
    console.log(`📱 Created ${createdProducts.length} products`);

    console.log('✅ Database seeding completed successfully!');
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Products: ${createdProducts.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;