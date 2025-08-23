import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const usbDriveProducts = [
  {
    name: 'Kingston IronKey Vault Privacy 50',
    slug: 'kingston-ironkey-vault-privacy-50',
    sku: 'USB-KIVP50-BASE',
    shortDescription: 'FIPS 197 certified encrypted USB drive with XTS-AES 256-bit hardware encryption',
    longDescription: 'Kingston IronKey Vault Privacy 50 delivers advanced security with XTS-AES 256-bit hardware-based encryption and FIPS 197 certification. Features include BadUSB attack protection, digitally signed firmware, complex password protection, and automatic lock after consecutive failed login attempts. Built with durable zinc alloy metal casing for physical security. Multi-password option with Admin and User support.',
    baseModel: 'IronKey Vault Privacy 50',
    lowStockThreshold: 5,
    tags: ['encrypted', 'fips-197', 'hardware-encryption', 'usb-drive', 'kingston'],
    images: [
      'https://example.com/ironkey-vp50-main.jpg',
      'https://example.com/ironkey-vp50-angle.jpg'
    ],
    category: null, // Will be set to USB drives category
    variations: [
      // 32GB variants
      {
        capacity: '32GB',
        interface: 'USB-A',
        variantName: '32GB USB-A',
        price: 89.99,
        stockQuantity: 20,
        stockStatus: 'in_stock',
        sku: 'USB-KIVP50-32A',
        images: [
          'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800',
          'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80'
        ]
      },
      // 64GB variants
      {
        capacity: '64GB',
        interface: 'USB-A',
        variantName: '64GB USB-A',
        price: 119.99,
        stockQuantity: 18,
        stockStatus: 'in_stock',
        sku: 'USB-KIVP50-64A',
        images: [
          'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80',
          'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80'
        ]
      },
      // 128GB variants
      {
        capacity: '128GB',
        interface: 'USB-A',
        variantName: '128GB USB-A',
        price: 179.99,
        stockQuantity: 15,
        stockStatus: 'in_stock',
        sku: 'USB-KIVP50-128A',
        images: [
          'https://images.unsplash.com/photo-1582112014310-8ebeeb26d8d3?w=800',
          'https://images.unsplash.com/photo-1582112014310-8ebeeb26d8d3?w=800&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80'
        ]
      },
      // 256GB variants
      {
        capacity: '256GB',
        interface: 'USB-A',
        variantName: '256GB USB-A',
        price: 299.99,
        stockQuantity: 10,
        stockStatus: 'in_stock',
        sku: 'USB-KIVP50-256A',
        images: [
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80'
        ]
      }
    ],
    attributes: [
      { name: 'Encryption', value: 'XTS-AES 256-bit Hardware' },
      { name: 'Certification', value: 'FIPS 197' },
      { name: 'Speed', value: 'USB 3.2 Gen 1 (up to 230MB/s read, 240MB/s write)' },
      { name: 'Protection', value: 'BadUSB Attack Protection' },
      { name: 'Password', value: 'Complex password (8-64 characters)' },
      { name: 'Security Features', value: 'Digitally Signed Firmware, Brute Force Protection' },
      { name: 'Casing', value: 'Zinc Alloy Metal' },
      { name: 'OS Support', value: 'Windows 11/10, macOS 10.15.x+, Linux v4.4+' },
      { name: 'Warranty', value: '5 Years' }
    ],
    weight: 22,
    leadTime: {
      minDays: 2,
      maxDays: 4,
      displayText: '2-4 working days'
    },
    dimensions: {
      length: 7.7,
      width: 2.2,
      height: 1.2
    },
    status: 'active',
    isActive: true
  },
  {
    name: 'Kingston IronKey Locker+ 50',
    slug: 'kingston-ironkey-locker-50',
    sku: 'USB-KILP50-BASE',
    shortDescription: 'FIPS 197 certified encrypted USB with XTS-AES hardware encryption and USBtoCloud',
    longDescription: 'Kingston IronKey Locker+ 50 combines hardware-encrypted security with cloud backup capability through USBtoCloud. Features XTS-AES hardware-based encryption, FIPS 197 certification, and BadUSB protection. Includes automatic personal cloud backup option and multi-password support with Admin and User modes. Brute force password attack protection with automatic crypto-erase after 10 failed attempts.',
    baseModel: 'IronKey Locker+ 50',
    lowStockThreshold: 5,
    tags: ['encrypted', 'fips-197', 'cloud-backup', 'hardware-encryption', 'usb-drive', 'kingston'],
    images: [
      'https://example.com/ironkey-lp50-main.jpg',
      'https://example.com/ironkey-lp50-angle.jpg'
    ],
    category: null,
    variations: [
      // 16GB variants
      {
        capacity: '16GB',
        interface: 'USB-A',
        variantName: '16GB USB-A',
        price: 59.99,
        stockQuantity: 25,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-16A',
        images: [
          'https://images.unsplash.com/photo-1580048845766-c8ac1b52e1b9?w=800',
          'https://images.unsplash.com/photo-1580048845766-c8ac1b52e1b9?w=800&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80'
        ]
      },
      {
        capacity: '16GB',
        interface: 'USB-C',
        variantName: '16GB USB-C',
        price: 64.99,
        stockQuantity: 22,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-16C',
        images: [
          'https://images.unsplash.com/photo-1615736781103-3e70bb2f4722?w=800',
          'https://images.unsplash.com/photo-1615736781103-3e70bb2f4722?w=800&crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80'
        ]
      },
      // 32GB variants
      {
        capacity: '32GB',
        interface: 'USB-A',
        variantName: '32GB USB-A',
        price: 79.99,
        stockQuantity: 20,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-32A',
        images: [
          'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&fit=crop&q=80',
          'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&fit=crop&q=80&crop=faces'
        ]
      },
      {
        capacity: '32GB',
        interface: 'USB-C',
        variantName: '32GB USB-C',
        price: 84.99,
        stockQuantity: 18,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-32C',
        images: [
          'https://images.unsplash.com/photo-1615736781103-3e70bb2f4722?w=800&q=80',
          'https://images.unsplash.com/photo-1615736781103-3e70bb2f4722?w=800&q=80&crop=faces'
        ]
      },
      // 64GB variants
      {
        capacity: '64GB',
        interface: 'USB-A',
        variantName: '64GB USB-A',
        price: 109.99,
        stockQuantity: 18,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-64A',
        images: ['https://example.com/ironkey-lp50-64gb-usba.jpg']
      },
      {
        capacity: '64GB',
        interface: 'USB-C',
        variantName: '64GB USB-C',
        price: 114.99,
        stockQuantity: 16,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-64C',
        images: ['https://example.com/ironkey-lp50-64gb-usbc.jpg']
      },
      // 128GB variants
      {
        capacity: '128GB',
        interface: 'USB-A',
        variantName: '128GB USB-A',
        price: 169.99,
        stockQuantity: 12,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-128A',
        images: ['https://example.com/ironkey-lp50-128gb-usba.jpg']
      },
      {
        capacity: '128GB',
        interface: 'USB-C',
        variantName: '128GB USB-C',
        price: 174.99,
        stockQuantity: 10,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-128C',
        images: ['https://example.com/ironkey-lp50-128gb-usbc.jpg']
      },
      // 256GB variants
      {
        capacity: '256GB',
        interface: 'USB-A',
        variantName: '256GB USB-A',
        price: 289.99,
        stockQuantity: 8,
        stockStatus: 'in_stock',
        sku: 'USB-KILP50-256A',
        images: ['https://example.com/ironkey-lp50-256gb-usba.jpg']
      },
      {
        capacity: '256GB',
        interface: 'USB-C',
        variantName: '256GB USB-C',
        price: 299.99,
        stockQuantity: 6,
        stockStatus: 'low_stock',
        sku: 'USB-KILP50-256C',
        images: ['https://example.com/ironkey-lp50-256gb-usbc.jpg']
      },
      // 512GB variants
      {
        capacity: '512GB',
        interface: 'USB-A',
        variantName: '512GB USB-A',
        price: 489.99,
        stockQuantity: 4,
        stockStatus: 'low_stock',
        sku: 'USB-KILP50-512A',
        images: ['https://example.com/ironkey-lp50-512gb-usba.jpg']
      },
      {
        capacity: '512GB',
        interface: 'USB-C',
        variantName: '512GB USB-C',
        price: 499.99,
        stockQuantity: 3,
        stockStatus: 'low_stock',
        sku: 'USB-KILP50-512C',
        images: ['https://example.com/ironkey-lp50-512gb-usbc.jpg']
      }
    ],
    attributes: [
      { name: 'Encryption', value: 'XTS-AES Hardware-based' },
      { name: 'Certification', value: 'FIPS 197' },
      { name: 'Speed', value: 'USB 3.2 Gen 1 (up to 145MB/s read, 115MB/s write)' },
      { name: 'Protection', value: 'BadUSB Attack Protection' },
      { name: 'Cloud Backup', value: 'USBtoCloud automatic backup' },
      { name: 'Password', value: 'Complex password with Admin/User modes' },
      { name: 'Security Features', value: 'Brute Force Protection, Crypto-erase' },
      { name: 'OS Support', value: 'Windows 11/10, macOS 10.15.x+, Linux v4.4+, Chrome OS' },
      { name: 'Warranty', value: '5 Years' }
    ],
    weight: 20,
    leadTime: {
      minDays: 2,
      maxDays: 4,
      displayText: '2-4 working days'
    },
    dimensions: {
      length: 6.0,
      width: 2.0,
      height: 0.9
    },
    status: 'active',
    isActive: true
  }
];

const seedUSBDrives = async () => {
  try {
    console.log('🔌 Starting USB drives seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Create or find USB drives category
    let usbCategory = await Category.findOne({ slug: 'usb-drives' });
    if (!usbCategory) {
      usbCategory = await Category.create({
        name: 'Encrypted USB Drives',
        slug: 'usb-drives',
        description: 'Hardware-encrypted USB flash drives for secure data storage and transfer'
      });
      console.log('📂 Created USB drives category');
    } else {
      console.log('📂 USB drives category already exists');
    }

    // Process USB drive products
    console.log('💾 Processing USB drive products...');
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const productData of usbDriveProducts) {
      try {
        // Check if product already exists (by slug)
        const existingProduct = await Product.findOne({ slug: productData.slug });
        
        if (existingProduct) {
          // Update existing product
          const updatedProduct = await Product.findByIdAndUpdate(
            existingProduct._id,
            {
              ...productData,
              category: usbCategory._id
            },
            { new: true, runValidators: true }
          );
          console.log(`🔄 Updated: ${updatedProduct.name}`);
          updatedCount++;
        } else {
          // Create new product
          const newProductData = {
            ...productData,
            category: usbCategory._id
          };
          
          const newProduct = await Product.create(newProductData);
          console.log(`✅ Created: ${newProduct.name}`);
          addedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${productData.name}:`, error.message);
        skippedCount++;
      }
    }

    // Get final count of USB drives
    const totalUSBDrives = await Product.countDocuments({ category: usbCategory._id });
    
    console.log('✅ USB drives seeding completed successfully!');
    console.log(`   💾 USB drives added: ${addedCount}`);
    console.log(`   🔄 USB drives updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total USB drives in database: ${totalUSBDrives}`);
    
    return {
      addedCount,
      updatedCount,
      skippedCount,
      totalUSBDrives
    };
    
  } catch (error) {
    console.error('❌ Error seeding USB drives:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUSBDrives()
    .then((result) => {
      console.log('🎉 USB drives seeding process completed');
      console.log(`📊 Final summary: ${result.addedCount} added, ${result.updatedCount} updated, ${result.totalUSBDrives} total USB drives`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 USB drives seeding process failed:', error);
      process.exit(1);
    });
}

export default seedUSBDrives;