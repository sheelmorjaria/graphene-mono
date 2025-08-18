import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkStock = async () => {
  try {
    // Find all products and their current stock levels
    const products = await Product.find({}, { name: 1, stockQuantity: 1, isActive: 1 });
    
    console.log('\n=== Current Stock Levels ===');
    products.forEach(product => {
      const status = product.stockQuantity === 0 ? '❌ OUT OF STOCK' : 
                    product.stockQuantity < 5 ? '⚠️  LOW STOCK' : '✅ IN STOCK';
      console.log(`${product.name}: ${product.stockQuantity} units - ${status}`);
    });

    // Show all Pixel products
    const pixelProducts = await Product.find({ name: /pixel/i }, { name: 1, stockQuantity: 1 });
    console.log('\nAvailable Pixel products:');
    pixelProducts.forEach(product => {
      console.log(`- ${product.name} (Stock: ${product.stockQuantity})`);
    });

  } catch (error) {
    console.error('Error checking stock:', error);
  }
};

const updateAllStock = async () => {
  try {
    console.log('\n=== Updating All Product Stock ===');
    
    // Update all products to have at least 5 units in stock
    const result = await Product.updateMany(
      { stockQuantity: { $lt: 5 } },
      { $set: { stockQuantity: 10, isActive: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} products with low/zero stock`);
    
    // Show updated stock levels
    await checkStock();
    
  } catch (error) {
    console.error('Error updating stock:', error);
  }
};

const main = async () => {
  await connectDB();
  
  const action = process.argv[2] || 'check';
  
  if (action === 'update') {
    await updateAllStock();
  } else {
    await checkStock();
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
};

main().catch(console.error);