import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Import Product model
import Product from './src/models/Product.js';

// Function to generate image filename based on base model and color
const getImageFilename = (baseModel, color) => {
  // Normalize the base model and color for filename matching
  // Format examples: 9prohazel.webp, 9proxlobsidian.webp, 10proobsidian.webp

  const modelKey = baseModel
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace('pro', 'pro')  // Keep "pro" as is
    .replace('xl', 'xl');   // Keep "xl" as is

  const colorKey = color.toLowerCase().replace(/\s+/g, '');

  // Try common extensions
  const extensions = ['.webp', '.jpg', '.jpeg', '.png'];

  for (const ext of extensions) {
    const filename = `${modelKey}${colorKey}${ext}`;
    return `/images/products/${filename}`;
  }

  return null;
};

// Function to scan available images in the products folder
const scanAvailableImages = () => {
  const imagesDir = path.join(__dirname, '../../frontend/public/images/products');
  const files = fs.readdirSync(imagesDir);

  // Filter out Zone.Identifier files and non-image files
  const imageFiles = files.filter(f =>
    !f.includes('Zone.Identifier') &&
    (f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'))
  );

  return imageFiles;
};

// Function to find matching image for a base model and color
const findMatchingImage = (baseModel, color, availableImages) => {
  // Normalize base model and color
  const normalizedModel = baseModel.toLowerCase().replace(/\s+/g, '');
  const normalizedColor = color.toLowerCase().replace(/\s+/g, '');

  // Try exact match first
  const exactMatch = availableImages.find(img => {
    const baseName = img.toLowerCase().replace(/\.(webp|jpg|jpeg|png)$/, '');
    return baseName === `${normalizedModel}${normalizedColor}`;
  });

  if (exactMatch) {
    return `/images/products/${exactMatch}`;
  }

  // Try partial match (in case color has spaces or special characters)
  const partialMatch = availableImages.find(img => {
    const baseName = img.toLowerCase().replace(/\.(webp|jpg|jpeg|png)$/, '');
    return baseName.includes(normalizedModel) && baseName.includes(normalizedColor);
  });

  if (partialMatch) {
    return `/images/products/${partialMatch}`;
  }

  return null;
};

// Main function to update all products
const updateAllProductImages = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Scan available images
    console.log('\n📁 Scanning available images...');
    const availableImages = scanAvailableImages();
    console.log(`   Found ${availableImages.length} image files`);

    // Get all products
    console.log('\n📦 Fetching all products...');
    const products = await Product.find({});

    console.log(`   Found ${products.length} products\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Get all unique colors from this product's variations
      const colors = new Set();
      product.variations.forEach(v => {
        if (v.color && v.color !== 'Unknown') {
          colors.add(v.color);
        }
      });

      const colorArray = Array.from(colors);

      if (colorArray.length === 0) {
        console.log(`⏭️  Skipping ${product.name} - No colors found`);
        skippedCount++;
        continue;
      }

      // Find images for each color
      const productImages = [];
      const imageFilenames = [];

      for (const color of colorArray) {
        const imagePath = findMatchingImage(product.baseModel, color, availableImages);

        if (imagePath && !productImages.includes(imagePath)) {
          productImages.push(imagePath);
          const filename = imagePath.split('/').pop();
          imageFilenames.push(`${color}: ${filename}`);
        }
      }

      if (productImages.length > 0) {
        // Update product images
        product.images = productImages;

        // Also update each variation with its specific color image
        product.variations.forEach(variation => {
          if (variation.color && variation.color !== 'Unknown') {
            const variationImage = findMatchingImage(product.baseModel, variation.color, availableImages);
            if (variationImage) {
              variation.images = [variationImage];
            }
          }
        });

        await product.save();
        console.log(`✅ Updated ${product.name}`);
        console.log(`   Images: ${imageFilenames.join(', ')}`);
        updatedCount++;
      } else {
        console.log(`⚠️  No images found for ${product.name} (${product.baseModel})`);
        console.log(`   Looking for colors: ${colorArray.join(', ')}`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Image update completed!');
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('Error updating product images:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the update
updateAllProductImages();
