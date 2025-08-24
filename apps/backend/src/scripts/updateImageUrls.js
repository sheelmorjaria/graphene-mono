import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const updateImageUrls = async () => {
  try {
    console.log('🔄 Starting image URL update...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Define the production backend URL that needs to be updated
    const oldBackendUrl = 'https://graphene-backend.onrender.com';
    
    // Determine the new base URL based on environment
    const getNewBaseUrl = () => {
      if (process.env.IMAGE_BASE_URL) {
        return process.env.IMAGE_BASE_URL;
      }
      
      // Default to production URL if no env var set
      return oldBackendUrl;
    };

    const newBaseUrl = getNewBaseUrl();
    
    if (oldBackendUrl === newBaseUrl) {
      console.log('ℹ️  No URL changes needed - already using correct base URL');
      return;
    }

    console.log(`🔄 Updating URLs from: ${oldBackendUrl}`);
    console.log(`🎯 Updating URLs to: ${newBaseUrl}`);

    // Find all products with the old backend URL in their images
    const products = await Product.find({
      $or: [
        { images: { $regex: oldBackendUrl } },
        { 'variations.images': { $regex: oldBackendUrl } }
      ]
    });

    console.log(`📱 Found ${products.length} products with old URLs`);

    let updatedCount = 0;

    for (const product of products) {
      let productUpdated = false;
      
      // Update main product images
      if (product.images && product.images.length > 0) {
        const originalImages = [...product.images];
        product.images = product.images.map(url => {
          if (typeof url === 'string' && url.includes(oldBackendUrl)) {
            return url.replace(oldBackendUrl, newBaseUrl);
          }
          return url;
        });
        
        if (JSON.stringify(originalImages) !== JSON.stringify(product.images)) {
          productUpdated = true;
          console.log(`🖼️  Updated main images for ${product.name}`);
        }
      }
      
      // Update variation images
      if (product.variations && product.variations.length > 0) {
        for (let i = 0; i < product.variations.length; i++) {
          const variation = product.variations[i];
          if (variation.images && variation.images.length > 0) {
            const originalVariationImages = [...variation.images];
            variation.images = variation.images.map(url => {
              if (typeof url === 'string' && url.includes(oldBackendUrl)) {
                return url.replace(oldBackendUrl, newBaseUrl);
              }
              return url;
            });
            
            if (JSON.stringify(originalVariationImages) !== JSON.stringify(variation.images)) {
              productUpdated = true;
              console.log(`🎨 Updated variation images for ${product.name} - variation ${i}`);
            }
          }
        }
      }
      
      if (productUpdated) {
        await product.save();
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} products with new image URLs`);
    
  } catch (error) {
    console.error('❌ Error updating image URLs:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the update if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateImageUrls()
    .then(() => {
      console.log('🎉 Image URL update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Image URL update failed:', error);
      process.exit(1);
    });
}

export default updateImageUrls;