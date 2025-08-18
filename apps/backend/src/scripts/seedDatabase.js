import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Load environment variables
dotenv.config();

const sampleCategories = [
  {
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Privacy-focused smartphones with GrapheneOS'
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
    name: 'GrapheneOS Pixel 9 Pro Fold',
    slug: 'grapheneos-pixel-9-pro-fold',
    shortDescription: 'Ultimate foldable privacy smartphone with GrapheneOS',
    longDescription: 'The revolutionary Pixel 9 Pro Fold with GrapheneOS pre-installed combines cutting-edge foldable technology with unparalleled privacy and security. Features a 7.6-inch inner OLED display that unfolds to tablet size, 6.3-inch cover display, Google Tensor G4 processor, and advanced triple camera system. GrapheneOS provides hardened security while maintaining the full foldable Android experience with enhanced privacy controls.',
    price: 1499.99,
    images: [
      'https://example.com/pixel9profold-open.jpg',
      'https://example.com/pixel9profold-closed.jpg',
      'https://example.com/pixel9profold-side.jpg'
    ],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 15,
    attributes: [
      { name: 'Display', value: '7.6" Inner + 6.3" Cover OLED' },
      { name: 'Storage', value: '256GB' },
      { name: 'RAM', value: '16GB' },
      { name: 'Color', value: 'Obsidian' },
      { name: 'Camera', value: '48MP Triple Camera' },
      { name: 'OS', value: 'GrapheneOS (Android 14)' },
      { name: 'Battery', value: '4821mAh' },
      { name: 'Form Factor', value: 'Foldable' }
    ],
    category: 'smartphones'
  },
  {
    name: 'GrapheneOS Pixel 9 Pro Fold 512GB',
    slug: 'grapheneos-pixel-9-pro-fold-512gb',
    shortDescription: 'Premium foldable privacy smartphone with extra storage',
    longDescription: 'The Pixel 9 Pro Fold 512GB variant with GrapheneOS offers maximum storage for your private data. This foldable flagship features dual displays, advanced AI capabilities, and the most sophisticated camera system in a foldable device, all secured with GrapheneOS privacy-first approach.',
    price: 1699.99,
    images: [
      'https://example.com/pixel9profold512-1.jpg',
      'https://example.com/pixel9profold512-2.jpg'
    ],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 10,
    attributes: [
      { name: 'Display', value: '7.6" Inner + 6.3" Cover OLED' },
      { name: 'Storage', value: '512GB' },
      { name: 'RAM', value: '16GB' },
      { name: 'Color', value: 'Porcelain' },
      { name: 'Camera', value: '48MP Triple Camera' },
      { name: 'OS', value: 'GrapheneOS (Android 14)' },
      { name: 'Battery', value: '4821mAh' },
      { name: 'Form Factor', value: 'Foldable' }
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
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Check existing data and clean up unwanted categories
    console.log('🔍 Checking existing data...');
    
    // Remove unwanted categories (accessories, cases)
    const deletedCategories = await Category.deleteMany({ 
      slug: { $in: ['accessories', 'cases'] } 
    });
    if (deletedCategories.deletedCount > 0) {
      console.log(`🧹 Removed ${deletedCategories.deletedCount} unwanted categories`);
    }

    // Remove products from unwanted categories
    const deletedProducts = await Product.deleteMany({ 
      category: { $in: await Category.find({ slug: { $in: ['accessories', 'cases'] } }).select('_id') } 
    });
    if (deletedProducts.deletedCount > 0) {
      console.log(`🧹 Removed ${deletedProducts.deletedCount} non-smartphone products`);
    }

    // Ensure smartphones category exists
    let smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
    if (!smartphonesCategory) {
      smartphonesCategory = await Category.create(sampleCategories[0]);
      console.log('📂 Created smartphones category');
    } else {
      console.log('📂 Smartphones category already exists');
    }

    // Process smartphone products
    console.log('📱 Processing smartphone products...');
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const productData of sampleProducts) {
      try {
        // Check if product already exists (by slug)
        const existingProduct = await Product.findOne({ slug: productData.slug });
        
        if (existingProduct) {
          // Update existing product with new data
          const updatedProduct = await Product.findByIdAndUpdate(
            existingProduct._id,
            {
              ...productData,
              category: smartphonesCategory._id,
              stockQuantity: productData.stockQuantity || existingProduct.stockQuantity || Math.floor(Math.random() * 50) + 5,
              attributes: productData.attributes || [
                { name: 'Condition', value: productData.condition || 'new' },
                { name: 'OS', value: 'GrapheneOS' }
              ]
            },
            { new: true }
          );
          console.log(`🔄 Updated: ${updatedProduct.name}`);
          updatedCount++;
        } else {
          // Create new product
          const newProductData = {
            ...productData,
            category: smartphonesCategory._id,
            stockQuantity: productData.stockQuantity || Math.floor(Math.random() * 50) + 5,
            attributes: productData.attributes || [
              { name: 'Condition', value: productData.condition || 'new' },
              { name: 'OS', value: 'GrapheneOS' }
            ]
          };
          
          const newProduct = await Product.create(newProductData);
          console.log(`✅ Created: ${newProduct.name}`);
          addedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${productData.name}:`, error.message);
        skippedCount++;
      }
    }

    // Get final count of smartphones
    const totalSmartphones = await Product.countDocuments({ category: smartphonesCategory._id });
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`   📱 Smartphones added: ${addedCount}`);
    console.log(`   🔄 Smartphones updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total smartphones in database: ${totalSmartphones}`);
    
    return {
      addedCount,
      updatedCount,
      skippedCount,
      totalSmartphones
    };
    
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
    .then((result) => {
      console.log('🎉 Seeding process completed');
      console.log(`📊 Final summary: ${result.addedCount} added, ${result.updatedCount} updated, ${result.totalSmartphones} total smartphones`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;