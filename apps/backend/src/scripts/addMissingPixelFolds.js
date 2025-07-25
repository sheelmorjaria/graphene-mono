import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ Connected to database');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Create a product from manual data
const createPixelFoldProduct = async (Product, Category, productData) => {
  const { name, price, condition } = productData;
  
  // Generate unique SKU and slug
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 9);
  const sku = `PIXEL-${timestamp}-${randomSuffix}`.toUpperCase();
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Extract storage and color from product name
  const storageMatch = name.match(/(\d+GB)/);
  const storage = storageMatch ? storageMatch[1] : '256GB';
  
  // Extract color
  const colorMatch = name.match(/\b(Obsidian|Porcelain|Hazel|Bay)\b/i);
  const color = colorMatch ? colorMatch[1] : 'Unknown';

  // Map CLI condition to our schema
  const conditionMap = {
    'A': 'excellent',
    'B': 'good', 
    'C': 'fair'
  };
  
  const mappedCondition = conditionMap[condition] || 'good';

  // Add GrapheneOS service markup of £120 to the CEX price
  const finalPrice = price + 120;

  // Get smartphones category
  const smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
  if (!smartphonesCategory) {
    throw new Error('Smartphones category not found');
  }

  const product = new Product({
    name: name,
    slug: `${slug}-${randomSuffix}`,
    sku: sku,
    shortDescription: `${name} with GrapheneOS Pre-installed - Privacy-Focused Android Alternative`,
    longDescription: `${name} with GrapheneOS Pre-installed. This Privacy-Focused Android Alternative features the innovative foldable design of the Google Pixel Fold. Custom ROM - GrapheneOS provides enhanced privacy and security while maintaining full functionality and the unique folding experience.`,
    price: finalPrice,
    condition: mappedCondition,
    stockStatus: 'in_stock',
    stockQuantity: 1,
    images: ['/images/placeholder.png'],
    attributes: [
      {
        name: 'Storage',
        value: storage
      },
      {
        name: 'Color', 
        value: color
      },
      {
        name: 'OS',
        value: 'GrapheneOS'
      },
      {
        name: 'Original Condition',
        value: `Grade ${condition}`
      },
      {
        name: 'Device Type',
        value: 'Foldable'
      }
    ],
    category: smartphonesCategory._id,
    status: 'active',
    isActive: true
  });

  return await product.save();
};

// Add missing Pixel Fold products
const addMissingPixelFolds = async () => {
  console.log('📱 Adding missing regular Pixel Fold products...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import models
    const { default: Product } = await import('../models/Product.js');
    const { default: Category } = await import('../models/Category.js');

    // Define the missing Pixel Fold products from CEX data
    const missingPixelFolds = [
      {
        name: 'Google Pixel Fold 256GB Obsidian',
        price: 385, // C condition
        condition: 'C'
      },
      {
        name: 'Google Pixel Fold 256GB Porcelain', 
        price: 400, // C condition
        condition: 'C'
      },
      {
        name: 'Google Pixel Fold 256GB Obsidian',
        price: 465, // B condition  
        condition: 'B'
      },
      {
        name: 'Google Pixel Fold 256GB Porcelain',
        price: 470, // B condition
        condition: 'B'
      },
      {
        name: 'Google Pixel Fold 512GB Obsidian',
        price: 530, // B condition
        condition: 'B'
      }
    ];

    console.log(`🎯 Adding ${missingPixelFolds.length} missing Pixel Fold products...\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const productData of missingPixelFolds) {
      try {
        // Check if a similar product already exists (by name and condition)
        const existingProduct = await Product.findOne({ 
          name: new RegExp(productData.name.replace(/\s+/g, '\\s+'), 'i'),
          condition: productData.condition.toLowerCase() === 'a' ? 'excellent' : 
            productData.condition.toLowerCase() === 'b' ? 'good' : 'fair'
        });

        if (existingProduct) {
          console.log(`⏭️  Product already exists: ${productData.name} (${productData.condition})`);
          skippedCount++;
          continue;
        }

        // Create the product
        const newProduct = await createPixelFoldProduct(Product, Category, productData);
        console.log(`✅ Created: ${newProduct.name} - £${newProduct.price} (Base: £${productData.price} + £120 service, Grade ${productData.condition})`);
        addedCount++;

      } catch (productError) {
        console.error(`❌ Failed to create product ${productData.name}:`, productError.message);
        skippedCount++;
      }
    }

    console.log('\n🎉 Addition completed!');
    console.log(`   ✅ Added: ${addedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);

    // Verify the results
    console.log('\n🔍 Verifying Pixel Fold products in database...');
    const allFoldProducts = await Product.find({ 
      name: { $regex: /pixel.*fold/i }
    }).select('name price condition');

    console.log(`Found ${allFoldProducts.length} total Pixel Fold products:`);
    allFoldProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.condition}) - £${product.price}`);
    });

    return {
      addedCount,
      skippedCount,
      totalFoldProducts: allFoldProducts.length
    };

  } catch (error) {
    console.error('❌ Error adding Pixel Fold products:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the script
addMissingPixelFolds()
  .then((result) => {
    console.log('\n✅ Pixel Fold addition completed');
    console.log(`Added: ${result.addedCount}, Skipped: ${result.skippedCount}, Total Fold products: ${result.totalFoldProducts}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Pixel Fold addition failed:', error.message);
    process.exit(1);
  });