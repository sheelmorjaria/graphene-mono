import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

// Product image URLs from Unsplash (free to use)
const productImageMap = {
  // Pixel Fold phones
  'Fold': [
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80'
  ],
  '9 Pro Fold': [
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    'https://images.unsplash.com/photo-1611532736579-6b16e2786cda?w=800&q=80'
  ],
  
  // Pixel 9 series
  '9': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80'
  ],
  '9 Pro': [
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
    'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&q=80'
  ],
  '9a': [
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=800&q=80'
  ],
  
  // Pixel 8 series
  '8': [
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80'
  ],
  '8 Pro': [
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    'https://images.unsplash.com/photo-1609692814858-f7cd2f0aaad5?w=800&q=80'
  ],
  '8A': [
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    'https://images.unsplash.com/photo-1598327106026-d9521da673d1?w=800&q=80'
  ],
  
  // Pixel 7 series
  '7': [
    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80',
    'https://images.unsplash.com/photo-1603145733190-59811e3c1e8f?w=800&q=80'
  ],
  '7 Pro': [
    'https://images.unsplash.com/photo-1604054923518-e491a9a6afbb?w=800&q=80',
    'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80'
  ],
  '7A': [
    'https://images.unsplash.com/photo-1557180295-76eee20ae8aa?w=800&q=80',
    'https://images.unsplash.com/photo-1535303311164-664fc9ec6532?w=800&q=80'
  ],
  
  // Pixel 6 series
  '6': [
    'https://images.unsplash.com/photo-1551355738-1875b6664915?w=800&q=80',
    'https://images.unsplash.com/photo-1600956983110-3f36d24590e8?w=800&q=80'
  ],
  '6 Pro': [
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80',
    'https://images.unsplash.com/photo-1525598912003-663126343e1f?w=800&q=80'
  ],
  '6A': [
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
    'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=800&q=80'
  ]
};

const updatePlaceholderImages = async () => {
  try {
    console.log('🔄 Starting placeholder image update...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Find all products with placeholder images
    const products = await Product.find({
      $or: [
        { images: '/images/placeholder.png' },
        { images: { $size: 0 } },
        { images: { $exists: false } }
      ]
    });

    console.log(`📱 Found ${products.length} products with placeholder or missing images`);

    let updatedCount = 0;

    for (const product of products) {
      const baseModel = product.baseModel;
      
      if (productImageMap[baseModel]) {
        // Update the product with proper images
        product.images = productImageMap[baseModel];
        await product.save();
        updatedCount++;
        console.log(`✅ Updated ${product.name} with proper images`);
      } else {
        console.log(`⚠️  No image mapping found for ${product.name} (model: ${baseModel})`);
      }
    }

    console.log(`✅ Updated ${updatedCount} products with proper images`);
    
  } catch (error) {
    console.error('❌ Error updating placeholder images:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the update if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePlaceholderImages()
    .then(() => {
      console.log('🎉 Placeholder image update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Placeholder image update failed:', error);
      process.exit(1);
    });
}

export default updatePlaceholderImages;