import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const colorImageMap = {
  'Stormy Black': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'
  ],
  'Sorta Seafoam': [
    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80&tint=lightblue',
    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&tint=lightblue'
  ],
  'Sea': [
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80&tint=teal',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&tint=teal'
  ],
  'Snow': [
    'https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=800&q=80',
    'https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=800&q=80&crop=entropy&cs=tinysrgb&fit=max&fm=jpg'
  ],
  'Charcoal': [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&brightness=0.8',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&brightness=0.8'
  ],
  'Coral': [
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80&tint=coral',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&tint=coral'
  ],
  'Lemongrass': [
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80&tint=yellow',
    'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&tint=yellow'
  ]
};

const updatePhoneVariantImages = async () => {
  try {
    console.log('🔄 Starting phone variant image update...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Find all smartphone products with variations
    const products = await Product.find({
      category: { $exists: true }
    }).populate('category');

    const phoneProducts = products.filter(p => 
      p.category && p.category.slug === 'smartphones' && p.variations && p.variations.length > 0
    );

    console.log(`📱 Found ${phoneProducts.length} phone products with variations`);

    let updatedCount = 0;

    for (const product of phoneProducts) {
      let productUpdated = false;
      
      for (let i = 0; i < product.variations.length; i++) {
        const variation = product.variations[i];
        
        if (variation.color && colorImageMap[variation.color]) {
          // Update the variation with color-specific images
          product.variations[i].images = colorImageMap[variation.color];
          productUpdated = true;
          console.log(`🎨 Updated ${product.name} - ${variation.color} with variant images`);
        }
      }
      
      if (productUpdated) {
        await product.save();
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} phone products with variant-specific images`);
    
  } catch (error) {
    console.error('❌ Error updating phone variant images:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the update if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePhoneVariantImages()
    .then(() => {
      console.log('🎉 Phone variant image update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phone variant image update failed:', error);
      process.exit(1);
    });
}

export default updatePhoneVariantImages;