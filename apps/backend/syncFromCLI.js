import { exec } from "child_process";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Disable buffering
mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 20000);

// Import models from backend
let User, Product;

// Dynamic import to avoid circular dependency issues
const loadModels = async () => {
  try {
    // Check if running from root or backend directory
    const isInBackend = process.cwd().includes('/backend');
    const userPath = isInBackend ? './src/models/User.js' : './backend/src/models/User.js';
    const productPath = isInBackend ? './src/models/Product.js' : './backend/src/models/Product.js';
    
    const userModule = await import(userPath);
    const productModule = await import(productPath);
    User = userModule.default;
    Product = productModule.default;
    console.log("Models loaded successfully");
  } catch (error) {
    console.error("Failed to load models:", error.message);
    throw error;
  }
};

// Connect to MongoDB with retry logic
const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`MongoDB connection attempt ${i + 1}/${retries}...`);

      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4
      });

      console.log(`MongoDB connected: ${conn.connection.host}`);

      // Wait for connection to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Load models after successful connection
      await loadModels();

      // Test the connection with a simple query
      await mongoose.connection.db.admin().ping();
      console.log("MongoDB ping successful");

      return conn;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait before retry
    }
  }
};

// Debug function to see all products in the database
export const debugAllProducts = async () => {
  let connection = null;
  
  try {
    connection = await connectDB();
    
    if (!Product) {
      throw new Error("Product model not initialized");
    }

    console.log("🔍 Debugging ALL products in database...\n");
    
    // Get total count of all products
    const totalCount = await Product.countDocuments();
    console.log(`Total products in database: ${totalCount}\n`);
    
    if (totalCount === 0) {
      console.log("❌ Database is empty - no products found.");
      return { totalCount: 0, products: [] };
    }
    
    // Get all products
    const allProducts = await Product.find({}).select('name slug price condition status isActive').limit(20);
    
    console.log(`Found ${allProducts.length} products (showing first 20):\n`);
    
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   - ID: ${product._id}`);
      console.log(`   - Slug: ${product.slug}`);
      console.log(`   - Price: £${product.price}`);
      console.log(`   - Condition: ${product.condition}`);
      console.log(`   - Status: ${product.status}`);
      console.log(`   - Active: ${product.isActive}`);
      console.log();
    });

    return { totalCount, products: allProducts };

  } catch (error) {
    console.error("❌ Error debugging products:", error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};

// Debug function to see what's actually in the database
export const debugPixelProducts = async () => {
  let connection = null;
  
  try {
    connection = await connectDB();
    
    if (!Product) {
      throw new Error("Product model not initialized");
    }

    console.log("🔍 Debugging Pixel products in database...\n");
    
    // Get all products with "Pixel" in the name 
    const allPixelProducts = await Product.find({
      name: { $regex: /pixel/i }
    }).select('name _id');

    console.log(`Found ${allPixelProducts.length} Pixel products total:\n`);
    
    // Group by name pattern to see patterns
    const modelGroups = {};
    
    allPixelProducts.forEach(product => {
      const model = product.name || 'Unknown';
      if (!modelGroups[model]) {
        modelGroups[model] = [];
      }
      modelGroups[model].push({
        id: product._id,
        name: product.name
      });
    });

    // Display grouped results
    Object.keys(modelGroups).sort().forEach(modelName => {
      console.log(`📱 ${modelName}: ${modelGroups[modelName].length} products`);
      // Show first few examples
      modelGroups[modelName].slice(0, 2).forEach(product => {
        console.log(`   - ${product.name}`);
      });
      if (modelGroups[modelName].length > 2) {
        console.log(`   ... and ${modelGroups[modelName].length - 2} more`);
      }
      console.log();
    });

    // Check specifically for old Pixel models and ALL variants
    console.log("🔍 Checking for old Pixel models (1-5) and ALL variants:\n");
    
    const oldPixelPatterns = [
      {
        name: "Pixel 1-5 base models",
        pattern: /Pixel\s+[1-5](?!\d)/i
      },
      {
        name: "Pixel 1-5 with XL variants", 
        pattern: /Pixel\s+[1-5]\s+XL/i
      },
      {
        name: "Pixel 'a' series (3a, 4a, 5a)",
        pattern: /Pixel\s+[3-5]a/i
      },
      {
        name: "Any Pixel 1-5 variants",
        pattern: /Pixel\s+[1-5][a-zA-Z\s]/i
      },
      {
        name: "Names containing old Pixels",
        pattern: /Pixel\s+[1-5]/i
      }
    ];

    for (const patternInfo of oldPixelPatterns) {
      const query = {
        name: { $regex: patternInfo.pattern }
      };
      
      const matches = await Product.find(query).select('name _id');
      
      console.log(`${patternInfo.name}: ${matches.length} matches`);
      matches.forEach(product => {
        console.log(`   - ID: ${product._id}, Name: "${product.name}"`);
      });
      console.log();
    }

    return modelGroups;

  } catch (error) {
    console.error("❌ Error debugging Pixel products:", error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};

// Enhanced function to remove old Pixel products with better matching
export const removeOldPixelProducts = async (dryRun = false) => {
  let connection = null;
  
  try {
    connection = await connectDB();
    
    if (!Product) {
      throw new Error("Product model not initialized");
    }

    console.log(`${dryRun ? '🧪 DRY RUN: ' : ''}Removing old Pixel products (1-5)...\n`);
    
    // Multiple strategies to find old Pixel products (1-5 and ALL their variants)
    const searchStrategies = [
      // Strategy 1: Comprehensive regex for Pixel 1-5 and all variants
      {
        name: "Comprehensive Pixel 1-5 variants",
        query: {
          name: { $regex: /Pixel\s+[1-5]([a-zA-Z\s]|$)/i }
        }
      },
      // Strategy 2: Specific exact matches for common variants
      {
        name: "Exact variant matches",
        query: {
          name: { $regex: /(Pixel\s+[1-5](a|XL|\s+XL|\s+a|\s+a\s+XL|\s+5G))/i }
        }
      },
      // Strategy 3: Catch any remaining variants with broader patterns
      {
        name: "Broad pattern matching",
        query: {
          name: { $regex: /(Pixel\s+(1|2|3|4|5)(\s|a|XL|Pro)|GrapheneOS\s+Pixel\s+[1-5])/i }
        }
      }
    ];

    let totalFound = 0;
    let totalDeleted = 0;
    const foundProducts = new Set(); // Use Set to avoid duplicates

    // Try each strategy
    for (const strategy of searchStrategies) {
      console.log(`🔍 Strategy: ${strategy.name}`);
      
      const products = await Product.find(strategy.query).select('_id name');
      
      console.log(`   Found ${products.length} products`);
      
      if (products.length > 0) {
        products.forEach(product => {
          if (!foundProducts.has(product._id.toString())) {
            foundProducts.add(product._id.toString());
            console.log(`   - ID: ${product._id}`);
            console.log(`     Name: "${product.name}"`);
            console.log();
          }
        });
      }
    }

    totalFound = foundProducts.size;
    console.log(`\n📊 Total unique old Pixel products found: ${totalFound}`);

    if (totalFound === 0) {
      console.log("✅ No old Pixel products found to remove.");
      return { deletedCount: 0, success: true };
    }

    if (dryRun) {
      console.log("🧪 DRY RUN - No products were actually deleted.");
      return { deletedCount: 0, success: true, foundCount: totalFound };
    }

    // Convert Set back to array of ObjectIds for deletion
    const idsToDelete = Array.from(foundProducts).map(id => new mongoose.Types.ObjectId(id));
    
    console.log(`🗑️  Deleting ${idsToDelete.length} products...`);
    
    const result = await Product.deleteMany({
      _id: { $in: idsToDelete }
    });

    totalDeleted = result.deletedCount;

    console.log(`✅ Successfully removed ${totalDeleted} old Pixel products from the database.`);
    
    return {
      deletedCount: totalDeleted,
      foundCount: totalFound,
      success: true
    };

  } catch (error) {
    console.error("❌ Error removing old Pixel products:", error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};

// Execute CLI command
export const syncFromCLI = async () => {
  return new Promise((resolve, reject) => {
    // Use the CLI tool from current directory (backend)
    // Increase buffer size to handle large output
    exec("./cli-linux-amd64 -query 'Google Pixel'", { 
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    }, (error, stdout, stderr) => {
      if (error) {
        console.error("CLI error:", error);
        return reject(error);
      }
      if (stderr && !stderr.includes("store update error")) {
        console.error("CLI stderr:", stderr);
      }
      resolve(stdout);
    });
  });
};

// Parse CLI output into structured product data
const parseCLIOutput = (cliOutput) => {
  const lines = cliOutput.split('\n');
  const products = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for lines starting with ✱ (price indicator)
    if (line.startsWith('✱')) {
      const priceMatch = line.match(/✱\s*(\d+)\s+(.+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        const nameAndCondition = priceMatch[2];
        
        // Extract condition (A, B, C) from the end and category in brackets
        // Format: "Product Name, Unlocked B [Category]" or "Product Name B [Category]"
        const conditionMatch = nameAndCondition.match(/^(.+?),?\s*(?:Unlocked\s+)?([ABC])\s*\[(.+?)\]$/);
        if (conditionMatch) {
          const productName = conditionMatch[1].trim();
          const condition = conditionMatch[2];
          const category = conditionMatch[3];
          
          // Get URL from next line if it exists
          let url = '';
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('https://')) {
            url = lines[i + 1].trim();
          }
          
          products.push({
            name: productName,
            price: price,
            condition: condition,
            category: category,
            url: url
          });
          
          // Debug log for troubleshooting - only log Android phones
          if (category === 'Android Phones') {
            console.log(`📱 Found Android Phone: ${productName} - £${price} - ${condition}`);
          }
        } else {
          // Debug: Log lines that don't match the pattern
          console.log(`⚠️  Could not parse line ${i + 1}: "${line}"`);
        }
      }
    }
  }
  
  return products;
};

// Filter out old Pixel models (1-5 and variants)
const filterOldPixels = (products) => {
  return products.filter(product => {
    const name = product.name;
    const category = product.category;
    
    // Only include Android phones
    if (category !== 'Android Phones') {
      console.log(`🚫 Skipping non-phone product: ${name} (${category})`);
      return false;
    }
    
    // Skip if it's an old Pixel model (1-5 and variants)
    if (isOldPixelVariant(name)) {
      console.log(`🚫 Skipping old Pixel model: ${name}`);
      return false;
    }
    
    // Only include if it's a Google Pixel phone (name already contains "Google Pixel")
    if (name.includes('Google Pixel')) {
      console.log(`✅ Including: ${name}`);
      return true;
    }
    
    console.log(`🚫 Skipping non-Pixel phone: ${name}`);
    return false;
  });
};

// Helper functions
const extractConditionFromName = (name) => {
  if (!name) return null;
  const lastChar = name.trim().slice(-1);
  if (["A", "B", "C"].includes(lastChar)) {
    return lastChar;
  }
  return null;
};

const extractModelInfo = (name) => {
  if (!name) return null;

  const nameWithoutCondition = name.replace(/\s+[ABC]$/, "");
  const match = nameWithoutCondition.match(
    /Google Pixel\s+(\d+a?)\s*(Pro\s*XL|Pro|Fold)?\s*(\d+GB)?\s*([^,]+)?,?\s*Unlocked?/i
  );

  if (!match) return null;

  const [_, number, variant, storage, color] = match;
  let modelName = `Pixel ${number}`;
  if (variant) {
    modelName += ` ${variant.trim()}`;
  }

  return {
    modelName: modelName.trim(),
    storage: storage || "128GB",
    color: color ? color.trim() : "Unknown",
  };
};

// Function to create a product from CLI data
const createProductFromCLI = async (cliProductData) => {
  const { name, price, condition, url } = cliProductData;
  
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
  const storage = storageMatch ? storageMatch[1] : "128GB";
  
  // Extract color (last word before condition indicators)
  const colorMatch = name.match(/(\w+),?\s*Unlocked/i);
  const color = colorMatch ? colorMatch[1] : "Unknown";

  // Map CLI condition to our schema
  const conditionMap = {
    'A': 'excellent',
    'B': 'good', 
    'C': 'fair'
  };
  
  const mappedCondition = conditionMap[condition] || 'good';

  // Add GrapheneOS service markup of £120 to the CEX price
  const finalPrice = price + 120;

  const product = new Product({
    name: name,
    slug: `${slug}-${randomSuffix}`,
    sku: sku,
    shortDescription: `${name} with GrapheneOS pre-installed`,
    longDescription: `${name} flashed with GrapheneOS for enhanced privacy and security. Sourced from CEX UK.`,
    price: finalPrice,
    condition: mappedCondition,
    stockStatus: 'in_stock',
    stockQuantity: 1, // Since it's second-hand, usually just 1 in stock
    images: ["/images/placeholder.png"],
    attributes: [
      {
        name: "Storage",
        value: storage
      },
      {
        name: "Color", 
        value: color
      },
      {
        name: "OS",
        value: "GrapheneOS"
      },
      {
        name: "Source",
        value: "CEX UK"
      },
      {
        name: "Original Condition",
        value: `Grade ${condition}`
      }
    ],
    status: 'active',
    isActive: true
  });

  return await product.save();
};

// Function to create a product using the new schema (legacy function)
const createProduct = async (productData, adminUser) => {
  const condition = extractConditionFromName(productData.name);
  const modelInfo = extractModelInfo(productData.name);
  
  // Generate SKU and slug
  const sku = `PIXEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  const slug = productData.name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const product = new Product({
    name: productData.name,
    slug: slug,
    sku: sku,
    shortDescription: `${productData.name} with GrapheneOS`,
    longDescription: `${productData.name} flashed with GrapheneOS for enhanced privacy and security.`,
    price: productData.price || 500,
    condition: condition ? getConditionLabel(condition).toLowerCase() : 'excellent',
    stockStatus: 'in_stock',
    stockQuantity: 10,
    images: ["/images/placeholder.png"],
    attributes: [
      {
        name: "Storage",
        value: modelInfo?.storage || "128GB"
      },
      {
        name: "Color", 
        value: modelInfo?.color || "Unknown"
      },
      {
        name: "Condition",
        value: getConditionDescription(condition)
      }
    ],
    status: 'active',
    isActive: true
  });

  return await product.save();
};

// Function to seed sample products
export const seedSampleProducts = async () => {
  let connection = null;
  
  try {
    connection = await connectDB();
    
    if (!Product || !User) {
      throw new Error("Models not initialized properly");
    }

    console.log("🌱 Seeding sample products...\n");
    
    // Check if products already exist
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Database already contains ${existingCount} products. Skipping seed.`);
      return { message: "Database already seeded", count: existingCount };
    }

    // Sample Pixel products data
    const sampleProducts = [
      {
        name: "Google Pixel 8 Pro 128GB Obsidian",
        price: 899,
        condition: "new"
      },
      {
        name: "Google Pixel 8 256GB Hazel", 
        price: 699,
        condition: "new"
      },
      {
        name: "Google Pixel 7 Pro 256GB Snow",
        price: 599,
        condition: "excellent"
      },
      {
        name: "Google Pixel 7 128GB Obsidian",
        price: 499,
        condition: "excellent"
      },
      {
        name: "Google Pixel 6 Pro 128GB Stormy Black",
        price: 399,
        condition: "good"
      }
    ];

    const createdProducts = [];
    
    for (const productData of sampleProducts) {
      // Generate unique SKU and slug
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      const sku = `PIXEL-${timestamp}-${randomSuffix}`.toUpperCase();
      const slug = productData.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const product = new Product({
        name: productData.name,
        slug: `${slug}-${randomSuffix}`,
        sku: sku,
        shortDescription: `${productData.name} with GrapheneOS pre-installed`,
        longDescription: `${productData.name} flashed with GrapheneOS for enhanced privacy and security. Ready to use out of the box.`,
        price: productData.price,
        condition: productData.condition,
        stockStatus: 'in_stock',
        stockQuantity: Math.floor(Math.random() * 10) + 1,
        images: ["/images/placeholder.png"],
        attributes: [
          {
            name: "Storage",
            value: productData.name.includes("256GB") ? "256GB" : "128GB"
          },
          {
            name: "Color", 
            value: productData.name.split(" ").pop()
          },
          {
            name: "OS",
            value: "GrapheneOS"
          }
        ],
        status: 'active',
        isActive: true
      });

      const savedProduct = await product.save();
      createdProducts.push(savedProduct);
      console.log(`✅ Created: ${savedProduct.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${createdProducts.length} sample products!`);
    return { message: "Successfully seeded", count: createdProducts.length, products: createdProducts };

  } catch (error) {
    console.error("❌ Error seeding products:", error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};

// Function to check if a model is an old Pixel (1-5) variant that should be excluded
const isOldPixelVariant = (productName) => {
  if (!productName) return false;
  
  // Comprehensive patterns to match ALL Pixel 1-5 variants
  const oldPixelPatterns = [
    /Pixel\s+[1-5](?!\d)/i,                    // Pixel 1, Pixel 2, etc.
    /Pixel\s+[1-5]\s+XL/i,               // Pixel 2 XL, Pixel 3 XL, etc.
    /Pixel\s+[3-5]a/i,                   // Pixel 3a, Pixel 4a, Pixel 5a
    /Pixel\s+[3-5]a\s+XL/i,              // Pixel 3a XL
    /Pixel\s+4a\s+5G/i,                  // Pixel 4a 5G
    /Pixel\s+[1-5]([a-zA-Z\s])/i,        // Any other Pixel 1-5 variants
  ];
  
  return oldPixelPatterns.some(pattern => pattern.test(productName));
};

const getConditionDescription = (condition) => {
  const descriptions = {
    A: "Excellent condition - Like new with minimal signs of use.",
    B: "Good condition - Light scratches or minor wear.",
    C: "Fair condition - Visible scratches and signs of use.",
  };
  return descriptions[condition] || "Good condition";
};

export const updateAllPixelImages = async () => {
  let connection = null;
  try {
    connection = await connectDB();

    if (!Product) {
      throw new Error("Product model not initialized");
    }

    // Update all products where name contains "Pixel"
    const result = await Product.updateMany(
      { name: { $regex: /pixel/i } },
      { $set: { images: ["/images/placeholder.png"] } }
    );

    console.log(
      `✅ Updated ${result.modifiedCount || result.nModified || 0} Pixel products with new image.`
    );
    return result;
  } catch (error) {
    console.error("❌ Error updating Pixel images:", error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};

const getConditionLabel = (condition) => {
  const labels = {
    A: "Excellent",
    B: "Good",
    C: "Fair",
  };
  return labels[condition] || "Good";
};

// Main sync function
export const syncAndroidPhones = async () => {
  let connection = null;

  try {
    // Connect with retry
    connection = await connectDB();

    // Verify models are available
    if (!User || !Product) {
      throw new Error("Models not initialized properly");
    }

    // Find or create admin user with timeout
    console.log("Looking for admin user...");
    let admin;

    try {
      admin = await User.findOne({ role: 'admin' }).maxTimeMS(5000);
    } catch (userError) {
      console.log("Admin user not found, creating one...");
      admin = new User({
        firstName: "Admin",
        lastName: "User",
        email: "admin@grapheneosstore.com",
        password: "changeme123", // Will be hashed by pre-save middleware
        role: 'admin',
      });
      await admin.save();
    }

    if (!admin) {
      console.log("Creating admin user...");
      admin = new User({
        firstName: "Admin",
        lastName: "User",
        email: "admin@grapheneosstore.com",
        password: "changeme123", // Will be hashed by pre-save middleware
        role: 'admin',
      });
      await admin.save();
    }

    console.log(`Using admin user: ${admin.email}`);

    // Step 1: Remove old Pixel products from database (but keep connection open)
    console.log("\n🗑️  Removing old Pixel products from database...");
    
    // Remove old products without closing connection
    const oldProductQuery = {
      name: { $regex: /Pixel\s+[1-5]([a-zA-Z\s]|$)/i }
    };
    const removeResult = await Product.deleteMany(oldProductQuery);
    console.log(`Removed ${removeResult.deletedCount} old Pixel products`);

    // Step 2: Fetch data from CLI tool
    console.log("\n📡 Fetching Pixel products from CLI...");
    const cliOutput = await syncFromCLI();
    
    // Debug: Log CLI output length and first few lines
    console.log(`📊 CLI output length: ${cliOutput.length} characters`);
    const lines = cliOutput.split('\n');
    console.log(`📊 CLI output lines: ${lines.length}`);
    console.log("📊 First 10 lines:");
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`   ${i + 1}: ${line}`);
    });
    
    // Step 3: Parse CLI output
    console.log("🔄 Parsing CLI output...");
    const rawProducts = parseCLIOutput(cliOutput);
    console.log(`Found ${rawProducts.length} total products from CLI`);

    // Step 4: Filter out old Pixel models and non-phones
    console.log("\n🔍 Filtering products...");
    const filteredProducts = filterOldPixels(rawProducts);
    console.log(`After filtering: ${filteredProducts.length} products to process`);

    if (filteredProducts.length === 0) {
      console.log("⚠️  No suitable products found to sync");
      return { syncedCount: 0, skippedCount: rawProducts.length };
    }

    // Step 5: Process and save products
    console.log("\n💾 Creating products in database...");
    let syncedCount = 0;
    let skippedCount = 0;

    for (const productData of filteredProducts) {
      try {
        // Check if product already exists (by name)
        const existingProduct = await Product.findOne({ 
          name: productData.name 
        });

        if (existingProduct) {
          console.log(`⏭️  Product already exists: ${productData.name}`);
          
          // Add GrapheneOS service markup to the new price
          const newFinalPrice = productData.price + 120;
          
          // Update price if different
          if (existingProduct.price !== newFinalPrice) {
            existingProduct.price = newFinalPrice;
            await existingProduct.save();
            console.log(`   💰 Updated price to £${newFinalPrice} (CEX: £${productData.price} + £120 service)`);
          }
          
          skippedCount++;
          continue;
        }

        // Create new product using the CLI data
        const newProduct = await createProductFromCLI(productData);
        console.log(`✅ Created: ${newProduct.name} - £${newProduct.price} (CEX: £${productData.price} + £120 service)`);
        syncedCount++;

      } catch (productError) {
        console.error(`❌ Failed to create product ${productData.name}:`, productError.message);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Sync completed!`);
    console.log(`   ✅ Created: ${syncedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);
    console.log(`   🗑️  Removed: ${removeResult.deletedCount} old products`);

    return { 
      syncedCount, 
      skippedCount, 
      removedCount: removeResult.deletedCount 
    };

  } catch (error) {
    console.error("Sync error:", error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }
  }
};

// Simple test function
export const testConnection = async () => {
  try {
    await connectDB();
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Successfully connected to database: ${dbName}`);

    // Test creating a simple document
    const testUser = await User.findOne({ role: 'admin' });
    console.log(
      `✅ Database query successful: ${testUser ? "Admin found" : "No admin"}`
    );

    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return false;
  }
};

// Check if this file is being run directly
const isMainModule = () => {
  // Get the current file path
  const currentFilePath = new URL(import.meta.url).pathname;
  // Get the executed script path
  const executedFilePath = process.argv[1];
  
  return currentFilePath === executedFilePath;
};

// Run if executed directly
if (isMainModule()) {
  const command = process.argv[2];
  const isDryRun = process.argv.includes('--dry-run');

  if (command === "test") {
    testConnection().then(() => process.exit(0));
  } else if (command === "debug-all") {
    debugAllProducts()
      .then(() => {
        console.log("\n✅ Debug completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Debug failed:", error.message);
        process.exit(1);
      });
  } else if (command === "debug-pixels") {
    debugPixelProducts()
      .then(() => {
        console.log("\n✅ Debug completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Debug failed:", error.message);
        process.exit(1);
      });
  } else if (command === "seed") {
    seedSampleProducts()
      .then((result) => {
        console.log(`\n✅ Seed completed! ${result.message} - ${result.count} products.`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Seed failed:", error.message);
        process.exit(1);
      });
  } else if (command === "remove-old-pixels") {
    removeOldPixelProducts(isDryRun)
      .then((result) => {
        if (isDryRun) {
          console.log(`\n🧪 DRY RUN completed! Found ${result.foundCount || 0} products that would be deleted.`);
        } else {
          console.log(`\n✅ Removal completed! Deleted ${result.deletedCount} products.`);
        }
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Removal failed:", error.message);
        process.exit(1);
      });
  } else {
    syncAndroidPhones()
      .then(() => {
        console.log("\n✅ Sync completed successfully!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Sync failed:", error.message);
        process.exit(1);
      });
  }
}