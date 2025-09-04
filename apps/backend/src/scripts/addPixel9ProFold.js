import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const addPixel9ProFoldProducts = async () => {
  console.log('🔥 Adding Pixel 9 Pro Fold products to database...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import models
    const { default: Product } = await import('../models/Product.js');
    const { default: Category } = await import('../models/Category.js');

    // Get smartphones category
    const smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
    if (!smartphonesCategory) {
      throw new Error('Smartphones category not found');
    }

    const pixel9ProFoldProducts = [
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
        category: smartphonesCategory._id,
        isActive: true
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
        category: smartphonesCategory._id,
        isActive: true
      }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const productData of pixel9ProFoldProducts) {
      try {
        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          slug: productData.slug
        });

        if (existingProduct) {
          console.log(`⏭️  Product already exists: ${productData.name}`);
          skippedCount++;
          continue;
        }

        // Create new product
        const product = new Product(productData);
        await product.save();
        
        console.log(`✅ Added: ${product.name} - £${product.price}`);
        addedCount++;

      } catch (productError) {
        console.error(`❌ Failed to add ${productData.name}:`, productError.message);
        skippedCount++;
      }
    }

    console.log('\n🎉 Process completed!');
    console.log(`   ✅ Added: ${addedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);

    // Verify the products were added
    console.log('\n🔍 Verifying Pixel 9 Pro Fold products...');
    const pixel9ProFolds = await Product.find({ 
      name: { $regex: /pixel.*9.*pro.*fold/i }
    }).select('name price stockQuantity');

    console.log(`Found ${pixel9ProFolds.length} Pixel 9 Pro Fold products:`);
    pixel9ProFolds.forEach(product => {
      console.log(`  - ${product.name} (${product.stockQuantity} in stock) - £${product.price}`);
    });

    return { addedCount, skippedCount, totalFound: pixel9ProFolds.length };

  } catch (error) {
    console.error('❌ Error adding products:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the script
addPixel9ProFoldProducts()
  .then((result) => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });