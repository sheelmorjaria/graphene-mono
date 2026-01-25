import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product.js';

dotenv.config();

const fixPixel7ProColors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const product = await Product.findOne({ baseModel: '7 Pro' });

    if (product) {
      console.log('\nProduct:', product.name);
      console.log('Colors BEFORE fix:');
      product.variations.forEach(v => {
        console.log('  -', v.color);
      });

      // Fix colors by removing the "(12GB+128GB) " prefix
      let updated = false;
      product.variations.forEach(v => {
        if (v.color && v.color.includes('(')) {
          const originalColor = v.color;
          // Extract just the color name after the closing parenthesis and space
          const match = v.color.match(/\)\s*(.+)/);
          if (match && match[1]) {
            v.color = match[1].trim();
            console.log(`   Fixed: "${originalColor}" -> "${v.color}"`);
            updated = true;
          }
        }
      });

      if (updated) {
        await product.save();
        console.log('\n✅ Product saved with fixed colors');

        console.log('\nColors AFTER fix:');
        product.variations.forEach(v => {
          console.log('  -', v.color);
        });
      } else {
        console.log('\n⚠️  No color fixes needed');
      }
    } else {
      console.log('Product not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
};

fixPixel7ProColors();
