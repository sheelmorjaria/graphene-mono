import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function ensureIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Ensure all indexes are created
    await Product.ensureIndexes();
    console.log('Product indexes ensured');

    // Check existing indexes
    const indexes = await Product.collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // Specifically check for text index
    if (!indexes.product_text_index) {
      console.log('Text index missing! Creating it now...');
      await Product.collection.createIndex(
        { 
          name: 'text', 
          shortDescription: 'text', 
          longDescription: 'text' 
        },
        { 
          weights: { 
            name: 3, 
            shortDescription: 2, 
            longDescription: 1 
          },
          name: 'product_text_index'
        }
      );
      console.log('Text index created successfully');
    } else {
      console.log('Text index already exists');
    }

    await mongoose.connection.close();
    console.log('Done');
  } catch (error) {
    console.error('Error ensuring indexes:', error);
    process.exit(1);
  }
}

ensureIndexes();