import { exec } from "child_process";
import fs from "fs";
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
    // Update paths for monorepo structure
    const userPath = './apps/backend/src/models/User.js';
    const productPath = './apps/backend/src/models/Product.js';
    
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

// Parse text output from CLI tool
const parseTextOutput = (textOutput) => {
  const products = [];
  const lines = textOutput.split('\n');
  
  let currentCategory = '';
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Check if it's a category header (no leading whitespace)
    if (!line.startsWith(' ') && !line.startsWith('✱')) {
      currentCategory = line.trim();
      continue;
    }
    
    // Parse product line (starts with ✱ and price)
    const productMatch = line.match(/^✱\s+(\d+)\s+(.+)$/);
    if (productMatch) {
      const [, price, name] = productMatch;
      products.push({
        name: name.trim(),
        price: parseFloat(price),
        category: currentCategory,
        source: 'webuy'
      });
    }
  }
  
  return products;
};

// Execute CLI command
export const syncFromCLI = async (searchQuery = 'PIXEL') => {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(__dirname, 'cli-linux-amd64');
    const command = `${cliPath} -query '${searchQuery}'`;
    
    console.log(`Executing: ${command}`);
    
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error("CLI execution error:", error);
        return reject(error);
      }
      if (stderr) {
        console.error("CLI stderr output:", stderr);
      }
      
      // Log the first part of stdout for debugging
      console.log("CLI output preview:", stdout.substring(0, 200));
      
      resolve(stdout);
    });
  });
};

// Helper functions
const extractConditionFromName = (name) => {
  if (!name) return null;
  
  // Look for condition letter (A, B, or C) before [Android Phones] or at the end
  // Pattern: condition letter followed by optional space and [category] or end of string
  const conditionMatch = name.match(/\s([ABC])(?:\s*\[|$)/);
  if (conditionMatch) {
    return conditionMatch[1];
  }
  
  // Fallback: check if last character is A, B, or C (original logic)
  const lastChar = name.trim().slice(-1);
  if (["A", "B", "C"].includes(lastChar)) {
    return lastChar;
  }
  
  return null;
};

// Exported for the parser regression tests (node --test syncFromCLI.parser.test.js)
export const extractModelInfo = (name) => {
  if (!name) return null;

  // Remove condition letter (A, B, or C) and category from the name for parsing
  const nameWithoutCondition = name
    .replace(/\s+[ABC](?:\s*\[.*?\])?$/, "") // Remove condition + optional category
    .replace(/\s*\[.*?\]$/, ""); // Remove remaining category if any

  // Numbered Pro Fold models ("Pixel 9 Pro Fold", "Pixel 10 Pro Fold") must
  // be matched BEFORE both fold handling below and the general regex: the
  // general regex captures "Pro" as the variant and dumps "Fold 256GB …"
  // into the color field, which both leaves the real fold variations
  // unrepriced AND mis-keys fold quotes onto the non-fold "9 Pro"/"10 Pro"
  // products (prod incident 2026-09-15).
  const proFoldName = nameWithoutCondition.replace(/(?:[,\s]*Unlocked)?[,\s]*$/i, "");
  const proFoldMatch = proFoldName.match(
    /(?:Google\s+)?Pixel\s+(\d+a?)\s+Pro\s+Fold\s*(?:(\d+(?:GB|TB))\+)?(\d+(?:GB|TB))?[,\s-]*(.*)$/i
  );

  if (proFoldMatch) {
    const [_, number, ram, storage, color] = proFoldMatch;
    let actualStorage = storage || ram || "256GB"; // Pro Folds start at 256GB
    let actualColor = (color || "").trim();

    // Storage embedded in the color field (same fallback as the general path)
    const colorStorageMatch = actualColor.match(/(\d+(?:GB|TB))\s+(.+)|(.+)\s+(\d+(?:GB|TB))/i);
    if (colorStorageMatch) {
      if (colorStorageMatch[1] && colorStorageMatch[2]) {
        actualStorage = colorStorageMatch[1];
        actualColor = colorStorageMatch[2].trim();
      } else if (colorStorageMatch[3] && colorStorageMatch[4]) {
        actualColor = colorStorageMatch[3].trim();
        actualStorage = colorStorageMatch[4];
      }
    }

    return {
      modelName: `Pixel ${number} Pro Fold`,
      storage: actualStorage,
      color: cleanColorForMatch(actualColor) || "Unknown",
    };
  }

  // Check for Pixel Fold specifically first
  const foldMatch = nameWithoutCondition.match(
    /(?:Google\s+)?Pixel\s+Fold\s*(\d+GB)?\s*[,-]?\s*([^,]+)?/i
  );
  
  if (foldMatch) {
    const [_, storage, color] = foldMatch;
    return {
      modelName: "Pixel Fold",
      storage: storage || "256GB", // Fold typically comes with 256GB
      color: cleanColorForMatch(color) || "Unknown",
    };
  }

  // Regular Pixel model matching (including Pro and Pro XL variants)
  // Updated pattern to handle RAM+ROM format and TB values (e.g., "12GB+128GB", "12GB+256GB", "1TB")
  const match = nameWithoutCondition.match(
    /Google Pixel\s+(\d+a?)\s*(Pro\s*XL|Pro)?\s*(?:(\d+(?:GB|TB))\+)?(\d+(?:GB|TB))?\s+([^]+?)(?:\s+Unlocked)?$/i
  );

  if (!match) return null;

  const [_, number, variant, ram, storage, colorAndRest] = match;
  let modelName = `Pixel ${number}`;
  if (variant) {
    modelName += ` ${variant.trim()}`;
  }

  // Handle storage that might be in the color field (e.g., "1TB Obsidian")
  let actualStorage = storage || ram || "128GB";
  let actualColor = colorAndRest ? colorAndRest.trim() : "Unknown";
  
  // Check if color field contains storage info (like "1TB Obsidian" or "Obsidian 1TB")
  if (actualColor) {
    const colorStorageMatch = actualColor.match(/(\d+(?:GB|TB))\s+(.+)|(.+)\s+(\d+(?:GB|TB))/i);
    if (colorStorageMatch) {
      if (colorStorageMatch[1] && colorStorageMatch[2]) {
        // Format: "1TB Obsidian"
        actualStorage = colorStorageMatch[1];
        actualColor = colorStorageMatch[2].trim();
      } else if (colorStorageMatch[3] && colorStorageMatch[4]) {
        // Format: "Obsidian 1TB"
        actualColor = colorStorageMatch[3].trim();
        actualStorage = colorStorageMatch[4];
      }
    }
  }
  
  // For Pixel 7 Pro specifically, ensure we're getting the ROM part, not RAM
  if (modelName.includes("7 Pro") && ram && storage) {
    actualStorage = storage; // Use the second part (ROM) after the "+"
  }

  return {
    modelName: modelName.trim(),
    storage: actualStorage,
    // Clean color at the source (trailing commas / parenthesised RAM) so the
    // variation duplicate-check matches existing clean DB variations instead
    // of creating "Obsidian," twins of "Obsidian".
    color: cleanColorForMatch(actualColor) || "Unknown",
  };
};

// Function to create a product using the new schema with variations
const createProduct = async (productData, adminUser) => {
  const condition = extractConditionFromName(productData.name);
  const modelInfo = extractModelInfo(productData.name);
  
  // Generate base SKU and slug (shorter format)
  const baseSku = `PX-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();
  const slug = productData.name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Create variation SKU (shorter format)
  const variationSku = `${baseSku}-${condition || 'E'}-${(modelInfo?.color || 'U').substring(0, 2).toUpperCase()}-${(modelInfo?.storage || '128GB').replace('GB', '')}`;

  // Create the variation object
  const variation = {
    condition: condition ? getConditionLabel(condition).toLowerCase() : 'excellent',
    color: modelInfo?.color || 'Unknown',
    storage: modelInfo?.storage || '128GB',
    price: (productData.price || 0) + 120.00,
    stockQuantity: 10,
    stockStatus: 'in_stock',
    sku: variationSku,
    images: ["/images/placeholder.png"]
  };

  const product = new Product({
    name: productData.name,
    slug: slug,
    sku: baseSku,
    baseModel: modelInfo?.modelName || 'Unknown Pixel',
    shortDescription: `${productData.name} with GrapheneOS Pre-installed - Privacy-Focused Android Alternative`,
    longDescription: `${productData.name} with GrapheneOS Pre-installed. This Privacy-Focused Android Alternative 
     features hardware identical to Google ${modelInfo?.modelName || 'Pixel'}. Custom ROM - GrapheneOS provides enhanced privacy and security while
     maintaining full functionality.`,
    images: ["/images/placeholder.png"],
    variations: [variation],
    attributes: [
      {
        name: "Storage",
        value: modelInfo?.storage || "128GB"
      },
      {
        name: "Model", 
        value: modelInfo?.modelName || "Unknown Pixel"
      }
    ],
    status: 'active',
    isActive: true
  });

  return await product.save();
};


// Function to check if a product should be excluded
const shouldExcludeProduct = (productName) => {
  if (!productName) return false;
  
  // Pixel 6A is not stocked by this store (owner decision 2026-09-15)
  if (/Pixel\s+6A/i.test(productName)) {
    return true;
  }

  // Check if it's a Final Fantasy game
  if (productName.includes('Final Fantasy') && productName.includes('Pixel Remaster')) {
    return true;
  }
  
  // Check if it's a Pixel Watch (not a phone)
  if (productName.includes('Pixel Watch')) {
    return true;
  }
  
  // Check if it's Pixel Buds (earphones, not a phone)
  if (productName.includes('Pixel Buds')) {
    return true;
  }
  
  // Check if it's camera accessories (PIXEL brand, not Google Pixel)
  if (productName.includes('[Camera Accessories]') || 
      productName.includes('Shutter Remote') ||
      productName.includes('Vertax E-')) {
    return true;
  }
  
  // Check if it's a movie named "Pixels"
  if ((productName.includes('Pixels') && 
       (productName.includes('[Blu-Ray Movies]') || 
        productName.includes('[DVD Movies]')))) {
    return true;
  }
  
  // Check if it's a case or accessory (not actual phone)
  if (productName.includes('Case') || 
      productName.includes('[Phone Accessories]') ||
      productName.includes('Grip Case') ||
      productName.includes('Bellroy') ||
      productName.includes('dBrand')) {
    return true;
  }
  
  // Check if it's an old Pixel phone (1-5) variant
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

// Main sync function. noCreate=true adds missing VARIATIONS to EXISTING
// products but never creates a new product (the catalog is curated by the
// owner — e.g. Pixel 6A is deliberately not stocked).
export const syncAndroidPhones = async (searchQuery = 'PIXEL', dryRun = false, noCreate = false) => {
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

    // Execute CLI command to get products
    console.log(`\n📱 Fetching products from CLI with query: ${searchQuery}...`);
    const cliOutput = await syncFromCLI(searchQuery);

    // Parse the text output from CLI
    let products = [];
    try {
      // First, try JSON parsing in case the format changed
      products = JSON.parse(cliOutput);
      console.log(`✅ Found ${products.length} products from CLI (JSON format)`);
    } catch (parseError) {
      // If JSON parsing fails, parse the text format
      console.log("📄 Parsing text format output from CLI...");
      products = parseTextOutput(cliOutput);
      console.log(`✅ Found ${products.length} products from CLI (text format)`);
    }

    // Validate that we have an array
    if (!Array.isArray(products)) {
      throw new Error("Parsed output is not an array of products");
    }

    if (products.length === 0) {
      console.log("⚠️  No products found from CLI");
      return { created: 0, skipped: 0, failed: 0 };
    }

    // Filter out old Pixel models and non-phone products
    console.log("\n🔍 Filtering out old Pixel models and non-phone products...");
    const modernProducts = products.filter(p => !shouldExcludeProduct(p.name));
    const filteredCount = products.length - modernProducts.length;
    
    console.log(`📊 Filtered out ${filteredCount} products (old Pixels, games, etc.)`);
    console.log(`📊 ${modernProducts.length} modern Pixel phones remaining`);

    if (modernProducts.length === 0) {
      console.log("⚠️  No modern products to import after filtering");
      return { created: 0, skipped: filteredCount, failed: 0 };
    }

    if (dryRun) {
      console.log('\n🧪 DRY RUN — no products will be created, updated, or deleted.\n');
    }

    // Clear existing products if requested
    if (!dryRun && process.argv.includes('--clear')) {
      console.log("\n🗑️  Clearing existing products...");
      const deleteResult = await Product.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} existing products`);
    }

    // Group products by base model and merge variations
    console.log("\n🔧 Grouping products by base model...");
    const productGroups = new Map();

    for (const productData of modernProducts) {
      const modelInfo = extractModelInfo(productData.name);
      // Skip items the parser can't identify rather than creating an
      // "Unknown Pixel" placeholder product (rotating stock names).
      if (!modelInfo) {
        console.log(`   ⏭️  Skipping unparseable item: "${productData.name}"`);
        continue;
      }

      if (!productGroups.has(modelInfo.modelName)) {
        productGroups.set(modelInfo.modelName, []);
      }
      productGroups.get(modelInfo.modelName).push(productData);
    }

    console.log(`📊 Found ${productGroups.size} unique base models`);

    // Create products in database
    console.log("\n💾 Creating products in database...");
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let variationsAdded = 0;

    for (const [baseModel, productVariations] of productGroups) {
      try {
        // Check if product already exists by base model
        // DB baseModels are bare ("6", "7 Pro"); the parser emits "Pixel 6".
        // Match either so existing products are UPDATED, never duplicated.
        const existingProduct = await Product.findOne({
          baseModel: { $in: [baseModel, baseModel.replace(/^Pixel\s+/i, '')] }
        });

        if (existingProduct) {
          // Add new variations to existing product
          for (const productData of productVariations) {
            const condition = extractConditionFromName(productData.name);
            const modelInfo = extractModelInfo(productData.name);
            
            // Check if this variation already exists
            const existingVariation = existingProduct.variations.find(v => 
              v.condition === (condition ? getConditionLabel(condition).toLowerCase() : 'excellent') &&
              v.color === (modelInfo?.color || 'Unknown') &&
              v.storage === (modelInfo?.storage || '128GB')
            );

            if (!existingVariation) {
              const variationSku = `${existingProduct.sku}-${condition || 'E'}-${(modelInfo?.color || 'U').substring(0, 2).toUpperCase()}-${(modelInfo?.storage || '128GB').replace('GB', '')}`;
              
              const newVariation = {
                condition: condition ? getConditionLabel(condition).toLowerCase() : 'excellent',
                color: modelInfo?.color || 'Unknown',
                storage: modelInfo?.storage || '128GB',
                price: (productData.price || 0) + 120.00,
                stockQuantity: 10,
                stockStatus: 'in_stock',
                sku: variationSku,
                images: ["/images/placeholder.png"]
              };

              if (!dryRun) existingProduct.variations.push(newVariation);
              variationsAdded++;
            }
          }

          if (!dryRun) await existingProduct.save();
          console.log(`🔄 ${dryRun ? 'Would update' : 'Updated'} existing product: ${baseModel} (${variationsAdded} variation(s) staged)`);
          skipped++;
        } else if (noCreate) {
          console.log(`⏭️  ${dryRun ? 'Would add' : 'Skipping'} ${baseModel}: not in catalog (--no-create) — ${productVariations.length} CeX quote(s) unused`);
          continue;
        } else {
          // Create new product with all variations
          const firstProduct = productVariations[0];
          const modelInfo = extractModelInfo(firstProduct.name);
          
          const baseSku = `PX-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();
          const slug = baseModel.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

          // Create variations for all products in this group
          const variations = productVariations.map((productData, index) => {
            const condition = extractConditionFromName(productData.name);
            const modelInfo = extractModelInfo(productData.name);
            const variationSku = `${baseSku}-${condition || 'E'}-${(modelInfo?.color || 'U').substring(0, 2).toUpperCase()}-${(modelInfo?.storage || '128GB').replace('GB', '')}-${index}`;

            return {
              condition: condition ? getConditionLabel(condition).toLowerCase() : 'excellent',
              color: modelInfo?.color || 'Unknown',
              storage: modelInfo?.storage || '128GB',
              price: (productData.price || 0) + 120.00,
              stockQuantity: 10,
              stockStatus: 'in_stock',
              sku: variationSku,
              images: ["/images/placeholder.png"]
            };
          });

          const product = new Product({
            name: `GrapheneOS ${baseModel}`,
            slug: slug,
            sku: baseSku,
            baseModel: baseModel,
            shortDescription: `${baseModel} with GrapheneOS Pre-installed - Privacy-Focused Android Alternative`,
            longDescription: `${baseModel} with GrapheneOS Pre-installed. This Privacy-Focused Android Alternative 
             features hardware identical to Google ${baseModel}. Custom ROM - GrapheneOS provides enhanced privacy and security while
             maintaining full functionality.`,
            images: ["/images/placeholder.png"],
            variations: variations,
            attributes: [
              {
                name: "Storage",
                value: modelInfo?.storage || "128GB"
              },
              {
                name: "Model", 
                value: baseModel
              }
            ],
            status: 'active',
            isActive: true
          });

          if (!dryRun) await product.save();
          console.log(`${dryRun ? '🧪 Would create' : '✅ Created'}: ${baseModel} with ${variations.length} variations`);
          created++;
          variationsAdded += variations.length;
        }

      } catch (err) {
        console.error(`❌ Failed to create ${baseModel}:`, err.message);
        failed++;
      }
    }

    // Summary
    console.log("\n📊 Import Summary:");
    console.log(`   Total from CLI: ${products.length}`);
    console.log(`   Filtered (old): ${filteredCount}`);
    console.log(`   Base models created: ${created}`);
    console.log(`   Base models updated: ${skipped}`);
    console.log(`   Total variations added: ${variationsAdded}`);
    console.log(`   Failed: ${failed}`);

    return { created, skipped, failed, filtered: filteredCount, variationsAdded };

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

// Normalize a color for variation matching: the CLI names carry trailing
// commas ("Stormy Black, Unlocked") and parenthesised RAM ("(12GB+128GB)
// Obsidian,") while DB colors are clean ("Stormy Black").
// DB baseModels are bare ("6", "7A", "9 Pro XL"); the CLI parser emits
// "Pixel 6" etc. Normalize both to bare for matching.
const cleanBaseModelForMatch = (bm) => (bm || '').replace(/^Pixel\s+/i, '').trim();

const cleanColorForMatch = (color) =>
  (color || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[,;]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

// Match a variation (bare baseModel + color) to a product image shipped in
// apps/frontend/public/images/products/. Files there are named as the
// model+color concatenation ("10profoldmoonstone.jpg",
// "6Prostormyblack.webp"); original-Pixel-Fold files carry a "pixel" prefix
// ("pixelfoldobsidian.webp"). Matching is case-insensitive with whitespace
// stripped; multi-word colors collapse ("Rose Quartz" → "rosequartz").
// Exported for the parser regression tests.
export const findVariationImage = (baseModel, color, files) => {
  const model = (baseModel || '').toLowerCase().replace(/\s+/g, '');
  const colorKey = (color || '').toLowerCase().replace(/\s+/g, '');
  if (!model || !colorKey) return null;

  const candidates = [`pixel${model}${colorKey}`, `${model}${colorKey}`];
  const stem = (f) => f.toLowerCase().replace(/\.[^.]+$/, '');
  const hit = files.find((f) => candidates.includes(stem(f)));
  return hit ? `/images/products/${hit}` : null;
};

// Prices-only sync: fetches supplier (CeX/webuy) prices from the CLI and
// updates the PRICE of EXISTING variations (supplier price + £120 markup —
// same formula as the full sync). Never creates products or variations.
//
//   node syncFromCLI.js prices [--query PIXEL] [--dry-run]   (dry-run is the DEFAULT)
//   node syncFromCLI.js prices --confirm                     (apply changes)
const DEFAULT_PRICE_QUERIES = [
  'PIXEL',
  // One query per model family is NOT enough: CeX returns only ~50 rows per
  // query and sub-families (e.g. 10a under 'PIXEL 10') get truncated
  // nondeterministically between runs. A truncated family then loses its
  // quotes and the stock reconciliation wrongly marks those variations out
  // of stock (prod incident 2026-09-15: 10a collapsed to 1 in-stock
  // variation). Query every stocked model explicitly so each DB baseModel
  // has a dedicated, untruncated quote set.
  'PIXEL 6',
  'PIXEL 6 PRO',
  'PIXEL 7',
  'PIXEL 7 PRO',
  'PIXEL 7A',
  'PIXEL 8',
  'PIXEL 8 PRO',
  'PIXEL 8A',
  'PIXEL 9',
  'PIXEL 9 PRO',
  'PIXEL 9 PRO XL',
  'PIXEL 9A',
  'PIXEL 10',
  'PIXEL 10 PRO',
  'PIXEL 10 PRO XL',
  'PIXEL 10A',
  'PIXEL FOLD',
  'PIXEL 9 PRO FOLD',
  'PIXEL 10 PRO FOLD'
];

export const syncPricesOnly = async (searchQuery = DEFAULT_PRICE_QUERIES, apply = false) => {
  let connection = null;

  try {
    // Parse CLI output first (no DB needed if the fetch fails). A single
    // 'PIXEL' query returns only CeX's top ~50 rows and misses most
    // variations — run one query per model family and merge (dedupe by name).
    const queries = Array.isArray(searchQuery)
      ? searchQuery
      : String(searchQuery).split(',').map((q) => q.trim()).filter(Boolean);
    let products = [];
    const seenNames = new Set();
    for (const q of queries) {
      const cliOutput = await syncFromCLI(q);
      let parsed = [];
      try {
        parsed = JSON.parse(cliOutput);
      } catch {
        parsed = parseTextOutput(cliOutput);
      }
      for (const item of parsed) {
        if (!seenNames.has(item.name)) {
          seenNames.add(item.name);
          products.push(item);
        }
      }
    }
    if (!Array.isArray(products) || products.length === 0) {
      console.log('⚠️  No products parsed from CLI output');
      return { updated: 0, unchanged: 0, unmatched: 0 };
    }

    const modern = products.filter((p) => !shouldExcludeProduct(p.name));
    console.log(`📥 Parsed ${products.length} items, ${modern.length} after filtering\n`);

    // Map CLI items to variation keys (first occurrence wins on duplicates)
    const wanted = new Map();
    for (const item of modern) {
      const modelInfo = extractModelInfo(item.name);
      if (!modelInfo) continue;
      const condition = extractConditionFromName(item.name);
      const key = [
        cleanBaseModelForMatch(modelInfo.modelName),
        condition ? getConditionLabel(condition).toLowerCase() : 'excellent',
        cleanColorForMatch(modelInfo.color),
        modelInfo.storage
      ].join('|');
      if (!wanted.has(key)) {
        wanted.set(key, { ...modelInfo, condition: condition ? getConditionLabel(condition).toLowerCase() : 'excellent', price: item.price + 120.0 });
      }
    }

    connection = await connectDB();
    if (!Product) throw new Error('Product model not initialized');

    const allProducts = await Product.find({}).select('name baseModel variations');
    const warnings = [];
    const pending = [];

    // Stock reconciliation (JIT model: availability = CeX availability).
    // A variation with NO current CeX quote is not purchasable → out of stock.
    // Guard: only apply when the product has at least one quoted variation, so
    // a query-list gap can never wipe an entire product's stock.
    const stockChanges = [];
    for (const product of allProducts) {
      let dirty = false;
      let quotedCount = 0;
      for (const variation of product.variations || []) {
        const key = [cleanBaseModelForMatch(product.baseModel), variation.condition, cleanColorForMatch(variation.color), variation.storage].join('|');
        const target = wanted.get(key);
        if (!target) continue;
        quotedCount++;

        const oldPrice = variation.price;
        const priceChanges = Math.abs((oldPrice || 0) - target.price) >= 0.005;
        if (priceChanges) {
          pending.push({ product: product.name, sku: variation.sku, key, oldPrice, newPrice: target.price, doc: product, variation });
          if (variation.salePrice && variation.salePrice >= target.price) {
            warnings.push(`${variation.sku}: salePrice £${variation.salePrice} ≥ new price £${target.price.toFixed(2)} — sale is now redundant`);
          }
          dirty = true;
        }

        // Back in stock: quoted again after being marked out
        if (variation.stockStatus === 'out_of_stock') {
          stockChanges.push({ product: product.name, sku: variation.sku, to: 'in_stock', doc: product, variation });
          dirty = true;
        }
      }

      if (quotedCount > 0) {
        const quotedKeys = new Set((product.variations || [])
          .filter(v => wanted.has([cleanBaseModelForMatch(product.baseModel), v.condition, cleanColorForMatch(v.color), v.storage].join('|')))
          .map(v => [cleanBaseModelForMatch(product.baseModel), v.condition, cleanColorForMatch(v.color), v.storage].join('|')));
        for (const variation of product.variations || []) {
          const key = [cleanBaseModelForMatch(product.baseModel), variation.condition, cleanColorForMatch(variation.color), variation.storage].join('|');
          if (!quotedKeys.has(key) && variation.stockStatus !== 'out_of_stock') {
            stockChanges.push({ product: product.name, sku: variation.sku, to: 'out_of_stock', doc: product, variation });
            dirty = true;
          }
        }
      }
      if (dirty) product._pricesDirty = true; // marker only; saves happen on apply
    }

    // Report matched CLI items that found no DB variation
    const dbKeys = new Set();
    for (const product of allProducts) {
      for (const v of product.variations || []) {
        dbKeys.add([cleanBaseModelForMatch(product.baseModel), v.condition, cleanColorForMatch(v.color), v.storage].join('|'));
      }
    }
    const unmatched = [...wanted.keys()].filter((k) => !dbKeys.has(k));

    console.log(`📊 Price changes (${pending.length}):`);
    for (const p of pending) {
      const arrow = p.newPrice > p.oldPrice ? '↑' : '↓';
      console.log(`  ${arrow} ${p.product} ${p.key.replace(/[^a-zA-Z0-9 |]/g, '')}`);
      console.log(`     £${(p.oldPrice ?? 0).toFixed(2)} → £${p.newPrice.toFixed(2)}  (${p.sku})`);
    }
    console.log(`\n🔎 CLI items with no matching DB variation: ${unmatched.length}`);
    unmatched.slice(0, 10).forEach((k) => console.log(`   - ${k.replace(/\|/g, ' / ')}`));
    if (unmatched.length > 10) console.log(`   ... and ${unmatched.length - 10} more`);

    if (warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      warnings.forEach((w) => console.log(`   ${w}`));
    }

    if (stockChanges.length > 0) {
      console.log(`\n📦 Stock changes (${stockChanges.length}):`);
      for (const c of stockChanges) {
        console.log(`   ${c.to === 'out_of_stock' ? '🚫 OUT of stock' : '✅ back in stock'}: ${c.sku} (${c.product})`);
      }
    }

    if (!apply) {
      console.log(`\n🧪 DRY RUN — ${pending.length} price(s) and ${stockChanges.length} stock status(es) would change. Re-run with --confirm to apply.`);
      return { updated: 0, changes: pending.length, stockChanges: stockChanges.length, unmatched: unmatched.length };
    }

    for (const p of pending) {
      p.variation.price = p.newPrice;
      await p.doc.save();
    }
    for (const c of stockChanges) {
      c.variation.stockStatus = c.to;
      c.variation.stockQuantity = c.to === 'out_of_stock' ? 0 : Math.max(c.variation.stockQuantity || 0, 10);
      await c.doc.save();
    }
    console.log(`\n✅ Applied ${pending.length} price update(s) and ${stockChanges.length} stock status change(s).`);
    console.log('ℹ️  Note: these updates bypass the admin API, so IndexNow pings did NOT fire — search engines will pick up new prices on their next crawl.');
    return { updated: pending.length, unmatched: unmatched.length };

  } catch (error) {
    console.error('❌ Price sync error:', error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close().catch(() => {});
      console.log('MongoDB connection closed');
    }
  }
};

// Image assignment: variations created by the syncs ship with the
// placeholder image. This command auto-assigns the real product photo from
// apps/frontend/public/images/products/ by matching model+color to the
// filename (see findVariationImage). Never overwrites an existing real
// image unless --migrate-uploads is passed, in which case images pointing
// at the backend's EPHEMERAL /app/uploads (lost on every backend redeploy)
// are repointed to the repo-shipped file when one matches. Dry-run by
// default; --confirm applies.
//
//   node syncFromCLI.js images [--migrate-uploads] [--dry-run]   (dry-run is the DEFAULT)
//   node syncFromCLI.js images --migrate-uploads --confirm       (apply changes)
//
// New photos are sourced from the Windows Pictures folder automatically
// (override with --source <dir>): any <model><color>.webp|jpg|png file there
// that the repo lacks is copied in, so the workflow is just "drop the file in
// Pictures → run images --confirm → deploy".
export const assignVariationImages = async (apply = false, migrateUploads = false) => {
  let connection = null;

  try {
    const imageDir = path.join(__dirname, 'apps/frontend/public/images/products');
    let files = fs
      .readdirSync(imageDir)
      .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
      .sort();

    const sourceArg = process.argv.indexOf('--source');
    const sourceDir = sourceArg !== -1 && process.argv[sourceArg + 1]
      ? process.argv[sourceArg + 1]
      : (fs.existsSync('/mnt/c/Users/sheel/Pictures') ? '/mnt/c/Users/sheel/Pictures' : null);

    if (sourceDir && fs.existsSync(sourceDir)) {
      const sourceFiles = fs.readdirSync(sourceDir).filter((f) => /\.(webp|jpe?g|png)$/i.test(f));
      const missing = sourceFiles.filter((f) => !files.includes(f));
      for (const f of missing) {
        if (apply) {
          fs.copyFileSync(path.join(sourceDir, f), path.join(imageDir, f));
          console.log(`📥 Copied ${f} from ${sourceDir}`);
        } else {
          console.log(`📥 Would copy ${f} from ${sourceDir}`);
        }
      }
      if (missing.length > 0) {
        files = (apply ? fs.readdirSync(imageDir) : [...files, ...missing])
          .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
          .sort();
      }
    }

    console.log(`🖼️  ${files.length} product image file(s) available\n`);

    connection = await connectDB();
    if (!Product) throw new Error('Product model not initialized');

    const allProducts = await Product.find({}).select('name baseModel variations');
    const assignments = [];
    const migrations = [];
    const unmatchable = [];
    const uploadsKept = [];

    for (const product of allProducts) {
      for (const variation of product.variations || []) {
        const label = `${variation.condition}/${variation.color}/${variation.storage}`;
        const usesUploads = (variation.images || []).some((img) => img && img.includes('/uploads/'));

        if (migrateUploads && usesUploads) {
          const image = findVariationImage(product.baseModel, variation.color, files);
          if (image) {
            migrations.push({ sku: variation.sku, label, from: variation.images[0], to: image, doc: product, variation });
          } else {
            uploadsKept.push(`${product.name} — ${label} (${variation.sku})`);
          }
          continue;
        }

        const hasRealImage = (variation.images || []).some(
          (img) => img && !img.includes('placeholder')
        );
        if (hasRealImage) continue;

        const image = findVariationImage(product.baseModel, variation.color, files);
        if (image) {
          assignments.push({
            product: product.name,
            sku: variation.sku,
            label,
            image,
            doc: product,
            variation,
          });
        } else {
          unmatchable.push(`${product.name} — ${label} (${variation.sku})`);
        }
      }
    }

    console.log(`🖼️  Variations without a real image: ${assignments.length + unmatchable.length}`);
    for (const a of assignments) {
      console.log(`   ✅ ${a.sku} (${a.label}) → ${a.image}`);
    }
    if (unmatchable.length > 0) {
      console.log(`\n⚠️  No image file matches ${unmatchable.length} variation(s) — add a file named <model><color>.webp|jpg|png:`);
      unmatchable.forEach((u) => console.log(`   - ${u}`));
    }

    if (migrateUploads) {
      console.log(`\n🔁 /uploads (ephemeral) → repo image migrations: ${migrations.length}`);
      for (const m of migrations) {
        console.log(`   ${m.sku} (${m.label})`);
        console.log(`      ${m.from}`);
        console.log(`      → ${m.to}`);
      }
      if (uploadsKept.length > 0) {
        console.log(`\n⚠️  ${uploadsKept.length} /uploads variation(s) have NO repo file match — left untouched:`);
        uploadsKept.forEach((u) => console.log(`   - ${u}`));
      }
    }

    if (!apply) {
      console.log(`\n🧪 DRY RUN — ${assignments.length} assignment(s) and ${migrations.length} migration(s) would be applied. Re-run with --confirm to apply.`);
      return { changes: assignments.length + migrations.length, unmatchable: unmatchable.length, uploadsKept: uploadsKept.length };
    }

    for (const a of assignments) {
      a.variation.images = [a.image];
      await a.doc.save();
    }
    for (const m of migrations) {
      m.variation.images = [m.to];
      await m.doc.save();
    }
    console.log(`\n✅ Applied ${assignments.length} image assignment(s) and ${migrations.length} migration(s).`);
    console.log('ℹ️  Newly added image files ship with the next frontend deploy.');
    return { updated: assignments.length + migrations.length, unmatchable: unmatchable.length, uploadsKept: uploadsKept.length };

  } catch (error) {
    console.error('❌ Image assignment error:', error.message);
    throw error;
  } finally {
    if (connection && mongoose.connection.readyState === 1) {
      await mongoose.connection.close().catch(() => {});
      console.log('MongoDB connection closed');
    }
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
  
  // Check for search query parameter
  const queryIndex = process.argv.indexOf('--query');
  const searchQuery = queryIndex !== -1 && process.argv[queryIndex + 1]
    ? process.argv[queryIndex + 1]
    : (command === 'prices' ? null : 'PIXEL');

  if (command === "prices") {
    const apply = process.argv.includes('--confirm');
    syncPricesOnly(searchQuery || DEFAULT_PRICE_QUERIES, apply)
      .then((r) => {
        console.log(`\n${apply ? '✅' : '🧪'} Prices command completed — updated: ${r.updated ?? 0}, changes: ${r.changes ?? r.updated ?? 0}, unmatched: ${r.unmatched ?? 0}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Prices command failed:", error.message);
        process.exit(1);
      });
  } else if (command === "images") {
    const apply = process.argv.includes('--confirm');
    const migrateUploads = process.argv.includes('--migrate-uploads');
    assignVariationImages(apply, migrateUploads)
      .then((r) => {
        console.log(`\n${apply ? '✅' : '🧪'} Images command completed — updated: ${r.updated ?? 0}, changes: ${r.changes ?? 0}, no match: ${r.unmatchable ?? 0}, uploads kept: ${r.uploadsKept ?? 0}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Images command failed:", error.message);
        process.exit(1);
      });
  } else if (command === "test") {
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
    syncAndroidPhones(searchQuery, isDryRun, process.argv.includes('--no-create'))
      .then(() => {
        console.log(`\n${isDryRun ? '🧪 DRY RUN completed — nothing was written.' : '✅ Sync completed successfully!'}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Sync failed:", error.message);
        process.exit(1);
      });
  }
}