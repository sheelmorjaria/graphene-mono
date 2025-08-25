#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createObjectCsvStringifier } from 'csv-writer';
import Product from './src/models/Product.js';
import Category from './src/models/Category.js';

dotenv.config();

async function exportProductsToCSV() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Fetch all products with their variations
    console.log('Fetching products...');
    const products = await Product.find({})
      .populate('category')
      .sort({ createdAt: -1 });
    
    console.log(`✓ Found ${products.length} products`);

    // Prepare CSV data - flatten variations for each product
    const csvData = [];
    let totalVariations = 0;
    
    products.forEach(product => {
      if (product.variations && product.variations.length > 0) {
        totalVariations += product.variations.length;
        product.variations.forEach((variation, index) => {
          csvData.push({
            // Product base information
            productId: product._id.toString(),
            productName: product.name,
            productSlug: product.slug,
            productSKU: product.sku,
            shortDescription: product.shortDescription || '',
            longDescription: product.longDescription || '',
            baseModel: product.baseModel,
            category: product.category ? product.category.name : '',
            categoryId: product.category ? product.category._id.toString() : '',
            tags: product.tags ? product.tags.join(';') : '',
            productImages: product.images ? product.images.join(';') : '',
            status: product.status,
            isActive: product.isActive,
            
            // Variation information
            variationIndex: index,
            condition: variation.condition || '',
            color: variation.color || '',
            storage: variation.storage || '',
            capacity: variation.capacity || '',
            interface: variation.interface || '',
            variantName: variation.variantName || '',
            price: variation.price,
            salePrice: variation.salePrice || '',
            stockQuantity: variation.stockQuantity,
            stockStatus: variation.stockStatus,
            variationSKU: variation.sku,
            variationImages: variation.images ? variation.images.join(';') : '',
            
            // Shipping information
            weight: product.weight || 100,
            leadTimeMin: product.leadTime?.minDays || 5,
            leadTimeMax: product.leadTime?.maxDays || 7,
            leadTimeText: product.leadTime?.displayText || '5-7 working days',
            dimensionLength: product.dimensions?.length || 10,
            dimensionWidth: product.dimensions?.width || 10,
            dimensionHeight: product.dimensions?.height || 5,
            
            // Attributes (if any)
            attributes: product.attributes ? 
              product.attributes.map(attr => `${attr.name}:${attr.value}`).join(';') : '',
            
            // Timestamps
            createdAt: product.createdAt ? product.createdAt.toISOString() : '',
            updatedAt: product.updatedAt ? product.updatedAt.toISOString() : ''
          });
        });
      } else {
        // Product without variations - still export base information
        csvData.push({
          productId: product._id.toString(),
          productName: product.name,
          productSlug: product.slug,
          productSKU: product.sku,
          shortDescription: product.shortDescription || '',
          longDescription: product.longDescription || '',
          baseModel: product.baseModel,
          category: product.category ? product.category.name : '',
          categoryId: product.category ? product.category._id.toString() : '',
          tags: product.tags ? product.tags.join(';') : '',
          productImages: product.images ? product.images.join(';') : '',
          status: product.status,
          isActive: product.isActive,
          variationIndex: 0,
          condition: '',
          color: '',
          storage: '',
          capacity: '',
          interface: '',
          variantName: '',
          price: 0,
          salePrice: '',
          stockQuantity: 0,
          stockStatus: 'out_of_stock',
          variationSKU: '',
          variationImages: '',
          weight: product.weight || 100,
          leadTimeMin: product.leadTime?.minDays || 5,
          leadTimeMax: product.leadTime?.maxDays || 7,
          leadTimeText: product.leadTime?.displayText || '5-7 working days',
          dimensionLength: product.dimensions?.length || 10,
          dimensionWidth: product.dimensions?.width || 10,
          dimensionHeight: product.dimensions?.height || 5,
          attributes: product.attributes ? 
            product.attributes.map(attr => `${attr.name}:${attr.value}`).join(';') : '',
          createdAt: product.createdAt ? product.createdAt.toISOString() : '',
          updatedAt: product.updatedAt ? product.updatedAt.toISOString() : ''
        });
      }
    });

    console.log(`✓ Total variations: ${totalVariations}`);

    // Create CSV string
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'productId', title: 'Product ID' },
        { id: 'productName', title: 'Product Name' },
        { id: 'productSlug', title: 'Product Slug' },
        { id: 'productSKU', title: 'Product SKU' },
        { id: 'shortDescription', title: 'Short Description' },
        { id: 'longDescription', title: 'Long Description' },
        { id: 'baseModel', title: 'Base Model' },
        { id: 'category', title: 'Category' },
        { id: 'categoryId', title: 'Category ID' },
        { id: 'tags', title: 'Tags (;-separated)' },
        { id: 'productImages', title: 'Product Images (;-separated)' },
        { id: 'status', title: 'Status' },
        { id: 'isActive', title: 'Is Active' },
        { id: 'variationIndex', title: 'Variation Index' },
        { id: 'condition', title: 'Condition' },
        { id: 'color', title: 'Color' },
        { id: 'storage', title: 'Storage' },
        { id: 'capacity', title: 'Capacity' },
        { id: 'interface', title: 'Interface' },
        { id: 'variantName', title: 'Variant Name' },
        { id: 'price', title: 'Price (GBP)' },
        { id: 'salePrice', title: 'Sale Price (GBP)' },
        { id: 'stockQuantity', title: 'Stock Quantity' },
        { id: 'stockStatus', title: 'Stock Status' },
        { id: 'variationSKU', title: 'Variation SKU' },
        { id: 'variationImages', title: 'Variation Images (;-separated)' },
        { id: 'weight', title: 'Weight (g)' },
        { id: 'leadTimeMin', title: 'Lead Time Min (days)' },
        { id: 'leadTimeMax', title: 'Lead Time Max (days)' },
        { id: 'leadTimeText', title: 'Lead Time Display' },
        { id: 'dimensionLength', title: 'Length (cm)' },
        { id: 'dimensionWidth', title: 'Width (cm)' },
        { id: 'dimensionHeight', title: 'Height (cm)' },
        { id: 'attributes', title: 'Attributes (;-separated)' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const csvHeader = csvStringifier.getHeaderString();
    const csvBody = csvStringifier.stringifyRecords(csvData);
    const csvContent = csvHeader + csvBody;

    // Save to file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products-export-${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, csvContent, 'utf8');
    console.log(`\n✅ Products exported successfully to: ${filename}`);
    console.log(`   Total rows: ${csvData.length}`);
    console.log(`   File location: ${filepath}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the export
console.log('🚀 Starting product export to CSV...\n');
exportProductsToCSV();