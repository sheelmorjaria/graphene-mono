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

const fixProductVariations = async () => {
  console.log('🔧 Fixing product variations structure...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import Product model
    const { default: Product } = await import('../models/Product.js');

    // Find products without variations or with empty variations
    const productsToFix = await Product.find({
      $or: [
        { variations: { $exists: false } },
        { variations: { $size: 0 } },
        { variations: null }
      ]
    });

    console.log(`📱 Found ${productsToFix.length} products to fix\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const product of productsToFix) {
      try {
        console.log(`🔧 Fixing: ${product.name}`);

        // Extract info from existing product for variation
        const stockQuantity = product.stockQuantity || 20; // Default stock
        const stockStatus = stockQuantity === 0 ? 'out_of_stock' : 
          stockQuantity <= 10 ? 'low_stock' : 'in_stock';

        // Extract color from attributes
        const colorAttr = product.attributes?.find(attr => 
          attr.name.toLowerCase().includes('color')
        );
        const color = colorAttr?.value || 'Default';

        // Extract storage from attributes
        const storageAttr = product.attributes?.find(attr => 
          attr.name.toLowerCase().includes('storage')
        );
        const storage = storageAttr?.value || '256GB';

        // Create variation from existing product data
        const variation = {
          condition: product.condition || 'new',
          color: color,
          storage: storage,
          price: product.price || 299.99,
          salePrice: product.salePrice || null,
          stockQuantity: stockQuantity,
          stockStatus: stockStatus,
          sku: product.sku || `${product.name.replace(/[^A-Z0-9]/g, '').substring(0, 10)}-${Date.now()}`,
          images: product.images || []
        };

        // Update product with variations and baseModel
        const updateData = {
          baseModel: product.baseModel || product.name.replace('GrapheneOS ', ''),
          variations: [variation]
        };

        await Product.findByIdAndUpdate(product._id, updateData);
        console.log(`   ✅ Fixed: Added variation with ${stockQuantity} stock (${stockStatus})`);
        fixedCount++;

      } catch (error) {
        console.error(`   ❌ Error fixing ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Fix Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const stillBroken = await Product.find({
      $or: [
        { variations: { $exists: false } },
        { variations: { $size: 0 } },
        { variations: null }
      ]
    });

    console.log(`📱 Products still without variations: ${stillBroken.length}`);

    // Test a few products to see if isInStock() works now
    const testProducts = await Product.find().limit(3);
    console.log('\n🧪 Testing isInStock() method:');
    for (const product of testProducts) {
      const inStock = product.isInStock();
      const totalStock = product.getTotalStock();
      console.log(`   ${product.name}: ${inStock ? '✅ In Stock' : '❌ Out of Stock'} (${totalStock} total)`);
    }

    return {
      totalFound: productsToFix.length,
      fixedCount,
      errorCount,
      stillBroken: stillBroken.length
    };

  } catch (error) {
    console.error('❌ Error fixing variations:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the fix
fixProductVariations()
  .then((result) => {
    console.log('\n✅ Product variations fix completed');
    console.log(`📊 Results: ${result.fixedCount}/${result.totalFound} products fixed`);
    if (result.stillBroken === 0) {
      console.log('🎉 All products now have proper variations!');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error.message);
    process.exit(1);
  });