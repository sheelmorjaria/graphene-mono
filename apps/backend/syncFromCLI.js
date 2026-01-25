import { exec } from "child_process";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import fs from "fs";
import { createHash } from "crypto";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend public images directory
const PRODUCTS_IMAGES_DIR = path.join(__dirname, '../../frontend/public/images/products');

dotenv.config();

// Disable buffering
mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 20000);

// Import models from backend
let User, Product, Category;

// Dynamic import to avoid circular dependency issues
const loadModels = async () => {
  try {
    // Use absolute paths relative to this file's location
    const userPath = './src/models/User.js';
    const productPath = './src/models/Product.js';
    const categoryPath = './src/models/Category.js';
    
    console.log(`Loading models from: ${userPath}, ${productPath}, and ${categoryPath}`);
    
    const userModule = await import(userPath);
    const productModule = await import(productPath);
    const categoryModule = await import(categoryPath);
    User = userModule.default;
    Product = productModule.default;
    Category = categoryModule.default;
    console.log("Models loaded successfully");
  } catch (error) {
    console.error("Failed to load models:", error.message);
    console.error("Current working directory:", process.cwd());
    throw error;
  }
};

// Ensure products images directory exists
const ensureImagesDirectory = () => {
  if (!fs.existsSync(PRODUCTS_IMAGES_DIR)) {
    fs.mkdirSync(PRODUCTS_IMAGES_DIR, { recursive: true });
    console.log(`✅ Created images directory: ${PRODUCTS_IMAGES_DIR}`);
  }
};

// Download image from URL to local file
const downloadImage = (url, basePath) => {
  return new Promise((resolve, reject) => {
    // Create a safe filename from URL or use a hash
    const urlHash = createHash('md5').update(url).digest('hex');
    // Determine extension from URL or default to png
    let extension = '.png';
    if (url.includes('.jpg') || url.includes('.jpeg')) {
      extension = '.jpg';
    } else if (url.includes('.webp')) {
      extension = '.webp';
    }

    const filename = `${basePath}-${urlHash}${extension}`;
    const filepath = path.join(PRODUCTS_IMAGES_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`   📷 Image already exists: ${filename}`);
      return resolve(`/images/products/${filename}`);
    }

    const protocol = url.startsWith('https') ? https : http;
    const client = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    client.get(url, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          return reject(new Error('Redirect location not found'));
        }
        // Handle relative redirects
        const absoluteRedirectUrl = redirectUrl.startsWith('http')
          ? redirectUrl
          : new URL(redirectUrl, url).href;
        return downloadImage(absoluteRedirectUrl, basePath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download image: ${response.statusCode}`));
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Verify it's actually an image by checking the buffer size
        if (buffer.length < 1000) {
          return reject(new Error('Downloaded file too small, possibly not an image'));
        }

        fs.writeFile(filepath, buffer, (err) => {
          if (err) {
            return reject(err);
          }
          console.log(`   📷 Downloaded image: ${filename}`);
          resolve(`/images/products/${filename}`);
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Download product images from CEX URL
const downloadProductImages = async (productName, productUrl) => {
  try {
    if (!productUrl) {
      console.log(`   ⚠️  No URL provided for ${productName}`);
      return null;
    }

    // Create base filename from product name
    const safeBaseName = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    console.log(`   🔍 Fetching image for: ${productName}`);

    // Try to get the image page from CEX
    // The product page typically has an image we can extract
    const imageUrl = await extractImageUrlFromPage(productUrl);

    if (imageUrl) {
      const imagePath = await downloadImage(imageUrl, safeBaseName);
      return imagePath;
    } else {
      console.log(`   ⚠️  Could not extract image URL for ${productName}`);
      return null;
    }
  } catch (error) {
    console.log(`   ⚠️  Failed to download image for ${productName}: ${error.message}`);
    return null;
  }
};

// Get Google official product image for Pixel phones
// Uses publicly available press kit images
const getGooglePixelImageUrl = (baseModel, color) => {
  // Use a simple, reliable image hosting service or placeholder
  // Since external scraping is unreliable, we'll use a placeholder service
  // that returns device images based on model name

  const modelSlug = baseModel
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Use UI Avatars or similar as a temporary placeholder
  // In production, these should be replaced with actual product photos
  const baseUrl = 'https://ui-avatars.com/api';

  // Create a colorful placeholder with model name
  return `${baseUrl}/?name=${encodeURIComponent(baseModel)}&background=0D8ABC&color=fff&size=500&font-size=0.33`;
};

// Extract image URL from CEX product page
const extractImageUrlFromPage = (productUrl) => {
  return new Promise((resolve, reject) => {
    const protocol = productUrl.startsWith('https') ? https : http;

    protocol.get(productUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          return reject(new Error('Redirect location not found'));
        }
        const absoluteRedirectUrl = redirectUrl.startsWith('http')
          ? redirectUrl
          : new URL(redirectUrl, productUrl).href;
        return extractImageUrlFromPage(absoluteRedirectUrl).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to fetch page: ${response.statusCode}`));
      }

      let html = '';
      response.on('data', (chunk) => {
        html += chunk;
        // Limit response size to prevent memory issues
        if (html.length > 500000) {
          response.destroy();
          resolve(null);
        }
      });

      response.on('end', () => {
        // Try to extract image URL from the HTML
        // CEX typically stores images in a specific format
        // Looking for patterns like: large_boxshots/PRODUCT_ID.jpg or similar

        // Pattern 1: Look for og:image meta tag
        const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
        if (ogImageMatch && ogImageMatch[1]) {
          const imageUrl = ogImageMatch[1].startsWith('http')
            ? ogImageMatch[1]
            : `https://uk.webuy.com${ogImageMatch[1]}`;
          console.log(`   🖼️  Found og:image: ${imageUrl}`);
          return resolve(imageUrl);
        }

        // Pattern 2: Look for product image in JSON-LD structured data
        const jsonLdMatch = html.match(/"image":"([^"]+)"/);
        if (jsonLdMatch && jsonLdMatch[1]) {
          const imageUrl = jsonLdMatch[1].replace(/\\\//g, '/');
          console.log(`   🖼️  Found JSON-LD image: ${imageUrl}`);
          return resolve(imageUrl);
        }

        // Pattern 3: Look for large_boxshots pattern
        const boxshotMatch = html.match(/large_boxshots\/([^\s"']+\.(?:jpg|jpeg|png|webp))/i);
        if (boxshotMatch && boxshotMatch[1]) {
          const imageUrl = `https://uk.webuy.com/productImages/large_boxshots/${boxshotMatch[1]}`;
          console.log(`   🖼️  Found boxshot image: ${imageUrl}`);
          return resolve(imageUrl);
        }

        // Pattern 4: Look for any product image URL
        const imageMatch = html.match(/productImages\/large_boxshots\/([^\s"']+\.(?:jpg|jpeg|png|webp))/i);
        if (imageMatch && imageMatch[0]) {
          const imageUrl = imageMatch[0].startsWith('http')
            ? imageMatch[0]
            : `https://uk.webuy.com/${imageMatch[0]}`;
          console.log(`   🖼️  Found product image: ${imageUrl}`);
          return resolve(imageUrl);
        }

        // Pattern 5: Look for img tag with product image class
        const imgMatch = html.match(/<img[^>]+class="[^"]*product[^"]*"[^>]+src="([^"]+)"/i);
        if (imgMatch && imgMatch[1]) {
          const imageUrl = imgMatch[1].startsWith('http')
            ? imgMatch[1]
            : `https://uk.webuy.com${imgMatch[1]}`;
          console.log(`   🖼️  Found product img: ${imageUrl}`);
          return resolve(imageUrl);
        }

        // Pattern 6: Look for Twitter card image
        const twitterImageMatch = html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i);
        if (twitterImageMatch && twitterImageMatch[1]) {
          const imageUrl = twitterImageMatch[1].startsWith('http')
            ? twitterImageMatch[1]
            : `https://uk.webuy.com${twitterImageMatch[1]}`;
          console.log(`   🖼️  Found twitter:image: ${imageUrl}`);
          return resolve(imageUrl);
        }

        // Pattern 7: Look for any img tag with product/boxshot in src
        const anyImgMatch = html.match(/<img[^>]+src="([^"]*(?:product|boxshot)[^"]*\.(?:jpg|jpeg|png|webp))"[^>]*>/i);
        if (anyImgMatch && anyImgMatch[1]) {
          const imageUrl = anyImgMatch[1].startsWith('http')
            ? anyImgMatch[1]
            : `https://uk.webuy.com${anyImgMatch[1]}`;
          console.log(`   🖼️  Found product/boxshot img: ${imageUrl}`);
          return resolve(imageUrl);
        }

        // Pattern 8: Look for JSON structured data with image
        const jsonScriptMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
        if (jsonScriptMatch) {
          try {
            const jsonData = JSON.parse(jsonScriptMatch[1]);
            if (jsonData.image) {
              const imageUrl = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
              const fullUrl = imageUrl.startsWith('http')
                ? imageUrl
                : `https://uk.webuy.com${imageUrl}`;
              console.log(`   🖼️  Found JSON-LD structured image: ${fullUrl}`);
              return resolve(fullUrl);
            }
          } catch (e) {
            // JSON parse failed, continue to next pattern
          }
        }

        // Pattern 9: Look for any CEX product image pattern with different path formats
        const altPathMatch = html.match(/\/product\/images\/[^"']*?\.(?:jpg|jpeg|png|webp)/i);
        if (altPathMatch && altPathMatch[0]) {
          const imageUrl = `https://uk.webuy.com${altPathMatch[0]}`;
          console.log(`   🖼️  Found alt path image: ${imageUrl}`);
          return resolve(imageUrl);
        }

        console.log(`   ⚠️  No image pattern matched in HTML`);
        resolve(null);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
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

// Execute CLI command with multiple queries to capture all Pixel variants
export const syncFromCLI = async () => {
  const queries = [
    'Google Pixel',            // General Pixel query (captures most models)
    'Google Pixel Fold',       // Specific Fold query (captures all Fold variants)
    'Google Pixel 9 Pro',      // Specific Pixel 9 Pro query
    'Google Pixel 9 Pro XL',   // Specific Pixel 9 Pro XL query
    'Google Pixel 9a',         // Specific Pixel 9a query
    'Google Pixel 10',         // Pixel 10 base model
    'Google Pixel 10 Pro',     // Pixel 10 Pro
    'Google Pixel 10 Pro XL',  // Pixel 10 Pro XL
    'Google Pixel 10 Pro Fold' // Pixel 10 Pro Fold
  ];

  console.log(`📡 Running ${queries.length} CLI queries to capture all Pixel variants...`);
  
  const allOutputs = [];
  
  for (const query of queries) {
    console.log(`   🔍 Query: "${query}"`);
    
    const output = await new Promise((resolve, reject) => {
      exec(`./cli-linux-amd64 -query '${query}'`, { 
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`CLI error for query "${query}":`, error);
          return reject(error);
        }
        if (stderr && !stderr.includes("store update error")) {
          console.error(`CLI stderr for query "${query}":`, stderr);
        }
        resolve(stdout);
      });
    });
    
    console.log(`   📊 Query "${query}" returned ${output.length} characters`);
    allOutputs.push(output);
  }
  
  // Combine all outputs
  const combinedOutput = allOutputs.join('\n\n');
  console.log(`📊 Combined output: ${combinedOutput.length} characters total`);
  
  return combinedOutput;
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
  
  // Deduplicate products that might appear in multiple queries
  // Use name + condition + price as unique key
  const uniqueProducts = [];
  const seenProducts = new Set();
  
  for (const product of products) {
    const uniqueKey = `${product.name}|${product.condition}|${product.price}`;
    if (!seenProducts.has(uniqueKey)) {
      seenProducts.add(uniqueKey);
      uniqueProducts.push(product);
    } else {
      console.log(`🔄 Skipping duplicate: ${product.name} - £${product.price} - ${product.condition}`);
    }
  }
  
  console.log(`📊 Parsed ${products.length} total products, ${uniqueProducts.length} unique after deduplication`);
  
  return uniqueProducts;
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
      // Special handling for Fold products - always include them
      if (name.toLowerCase().includes('fold')) {
        console.log(`✅ Including Fold product: ${name}`);
        return true;
      }
      
      // For non-Fold products, check they're not 6a
      if (name.toLowerCase().includes('6a')) {
        console.log(`🚫 Excluding Pixel 6a: ${name}`);
        return false;
      }
      
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

// Helper function to extract base model from product name
export const extractBaseModel = (productName) => {
  // Handle different Pixel model patterns
  const patterns = [
    // Pixel Fold variants (including 9 Pro Fold)
    /Google Pixel\s+(\d+\s*Pro\s*Fold)/i,          // "9 Pro Fold"
    /Google Pixel\s+(Fold)/i,                      // "Fold"
    // Regular Pixel models including Pro and Pro XL variants
    /Google Pixel\s+(\d+a?\s*(?:Pro\s*XL|Pro|XL))/i, // "9 Pro XL", "9 Pro", "8 Pro", "7a", "6 XL", etc.
    /Google Pixel\s+(\d+a?)/i,                     // "8", "7a", "6", etc.
  ];
  
  for (const pattern of patterns) {
    const match = productName.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return "Unknown";
};

// Helper function to create a clean product name and slug for the base model
const createBaseProductInfo = (baseModel) => {
  const cleanName = `GrapheneOS Pixel ${baseModel}`;
  const slug = cleanName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return { cleanName, slug };
};

// Function to find or create the Smartphones category
const findSmartphonesCategory = async () => {
  // Try to find existing category first
  let category = await Category.findOne({ name: 'Smartphones' });

  if (category) {
    return category;
  }

  // If not found, try to create it
  try {
    category = new Category({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and smartphones'
    });
    await category.save();
    console.log("✅ Created Smartphones category");
    return category;
  } catch (error) {
    // If duplicate key error, fetch and return the existing one
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      console.log("⚠️  Category already exists, fetching existing...");
      category = await Category.findOne({ slug: 'smartphones' });
      if (category) return category;
    }
    throw error;
  }
};

// Function to create or update a product with variations from CLI data
export const createOrUpdateProductFromCLI = async (cliProductData, categoryId) => {
  const { name, price, condition, url } = cliProductData;

  // Extract storage and color from product name
  // Support both GB and TB storage sizes
  const storageMatch = name.match(/(\d+(?:GB|TB))/i);
  const storage = storageMatch ? storageMatch[1].toUpperCase() : "128GB";

  // Extract color from product name
  let color = "Unknown";

  // Extract color from product name
  // Format: "Google Pixel 9 Pro XL 1TB Obsidian, Unlocked B"
  // Steps:
  // 1. Extract the base model (e.g., "9 Pro XL")
  // 2. Remove "Google Pixel " prefix
  // 3. Remove storage (GB/TB)
  // 4. Remove the base model from remaining string
  // 5. Remove ", Unlocked [condition]" suffix
  // 6. Extract the last word(s) as color

  const baseModel = extractBaseModel(name);

  // Remove prefix and storage, then remove base model
  const withoutPrefixAndStorage = name
    .replace(/Google Pixel\s+/i, '')
    .replace(/\d+(?:GB|TB)\s+/i, '');

  // Remove the base model from the remaining string
  const withoutBaseModel = withoutPrefixAndStorage
    .replace(new RegExp(`^${baseModel}\\s+`, 'i'), '')
    .trim();

  // Remove the ", Unlocked [condition]" suffix
  const withoutUnlocked = withoutBaseModel.replace(/,\s*Unlocked\s*[ABC]$/, '').trim();

  // Now extract the last word(s) as color
  // This handles "Obsidian" and "Rose Quartz"
  const colorMatch = withoutUnlocked.match(/(\S+)(?:\s+(\S+))?$/);
  if (colorMatch) {
    // If there's a second group, it's a two-word color like "Rose Quartz"
    color = colorMatch[2] ? `${colorMatch[1]} ${colorMatch[2]}` : colorMatch[1];
  }

  const { cleanName, slug } = createBaseProductInfo(baseModel);

  // Map CLI condition to our schema
  const conditionMap = {
    'A': 'excellent',
    'B': 'good',
    'C': 'fair'
  };

  const mappedCondition = conditionMap[condition] || 'good';

  // Add GrapheneOS service markup of £120 to the CEX price
  const finalPrice = price + 120;

  // Create variation data
  const stockQuantity = 1; // Since it's second-hand, usually just 1 in stock
  const stockStatus = 'in_stock';

  const newVariation = {
    condition: mappedCondition,
    color: color,
    storage: storage,
    price: finalPrice,
    salePrice: null,
    stockQuantity: stockQuantity,
    stockStatus: stockStatus,
    sku: `PIX-${baseModel.replace(/\s/g, '')}-${storage}-${color}-${condition}`.toUpperCase(),
    images: ["/images/placeholder.png"]
  };

  // Check if a product with this base model already exists
  const existingProduct = await Product.findOne({
    baseModel: baseModel,
    slug: { $regex: new RegExp(slug, 'i') }
  });

  if (existingProduct) {
    // Store source URL if not already set and URL is provided
    if (!existingProduct.sourceUrl && url) {
      existingProduct.sourceUrl = url;
    }

    // Check if this exact variation already exists
    const existingVariation = existingProduct.variations.find(v =>
      v.condition === mappedCondition &&
      v.color === color &&
      v.storage === storage
    );

    if (existingVariation) {
      console.log(`⏭️  Variation already exists: ${cleanName} - ${storage} ${color} (${mappedCondition})`);

      // Track if we need to save (price changed or sourceUrl needs to be stored)
      let needsSave = false;

      // Store source URL if not already set (use direct MongoDB update to bypass schema cache)
      if (url) {
        // Check if sourceUrl exists in database directly
        const productInDb = await Product.collection.findOne({ _id: existingProduct._id }, { projection: { sourceUrl: 1 } });
        if (!productInDb.sourceUrl) {
          console.log(`   🔗 Setting sourceUrl in DB: ${url}`);
          await Product.collection.updateOne(
            { _id: existingProduct._id },
            { $set: { sourceUrl: url } }
          );
          needsSave = true;
        } else {
          console.log(`   ℹ️  sourceUrl already set in DB: ${productInDb.sourceUrl}`);
        }
      } else if (!url) {
        console.log(`   ⚠️  No URL provided in CLI data`);
      }

      // Update price if different
      if (existingVariation.price !== finalPrice) {
        existingVariation.price = finalPrice;
        needsSave = true;
      }

      // Save if sourceUrl was updated or price changed
      if (needsSave) {
        await existingProduct.save();
        console.log(`   💰 Updated product data`);
      }

      return existingProduct;
    } else {
      // Add new variation to existing product
      existingProduct.variations.push(newVariation);

      // Update product price range if needed
      const prices = existingProduct.variations.map(v => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      existingProduct.price = minPrice; // Set base price to minimum

      await existingProduct.save();
      console.log(`✅ Added variation: ${cleanName} - ${storage} ${color} (${mappedCondition}) - £${finalPrice}`);
      return existingProduct;
    }
  } else {
    // Create new product with first variation
    const sku = `PIXEL-${baseModel.replace(/\s/g, '')}-BASE`.toUpperCase();

    // Download product image
    let productImagePath = "/images/placeholder.png";
    if (url) {
      try {
        const downloadedPath = await downloadProductImages(cleanName, url);
        if (downloadedPath) {
          productImagePath = downloadedPath;
          newVariation.images = [productImagePath];
        }
      } catch (imageError) {
        console.log(`   ⚠️  Could not download image, using placeholder: ${imageError.message}`);
      }
    }

    const product = new Product({
      name: cleanName,
      slug: slug,
      sku: sku,
      baseModel: baseModel,
      sourceUrl: url,
      category: categoryId,
      shortDescription: `${cleanName} with GrapheneOS Pre-installed - Privacy-Focused Android Alternative`,
      longDescription: `GrapheneOS Pixel ${baseModel} with GrapheneOS Pre-installed. This Privacy-Focused Android Alternative features hardware identical to Google Pixel ${baseModel}. Custom ROM - GrapheneOS provides enhanced privacy and security while maintaining full functionality.`,
      price: finalPrice, // Base price
      images: [productImagePath],
      variations: [newVariation],
      attributes: [
        {
          name: "Base Model",
          value: baseModel
        },
        {
          name: "OS",
          value: "GrapheneOS"
        },
        {
          name: "Available Storage",
          value: storage
        },
        {
          name: "Available Colors",
          value: color
        }
      ],
      status: 'active',
      isActive: true
    });

    const savedProduct = await product.save();
    console.log(`✅ Created new product: ${cleanName} with ${storage} ${color} (${mappedCondition}) - £${finalPrice}`);
    return savedProduct;
  }
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

  // Extract base model for required field
  const baseModel = modelInfo?.modelName || productData.name.replace('Google ', '');
  const productCondition = condition ? getConditionLabel(condition).toLowerCase() : 'excellent';
  const stockQuantity = 10;
  const stockStatus = 'in_stock';
  
  const product = new Product({
    name: productData.name,
    slug: slug,
    sku: sku,
    baseModel: baseModel, // Add required baseModel field
    shortDescription: `${productData.name} with GrapheneOS`,
    longDescription: `${productData.name} flashed with GrapheneOS for enhanced privacy and security.`,
    price: productData.price || 500,
    images: ["/images/placeholder.png"],
    // Add variations structure
    variations: [{
      condition: productCondition,
      color: modelInfo?.color || "Unknown",
      storage: modelInfo?.storage || "128GB",
      price: productData.price || 500,
      salePrice: null,
      stockQuantity: stockQuantity,
      stockStatus: stockStatus,
      sku: `${sku}-VAR1`,
      images: ["/images/placeholder.png"]
    }],
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

      // Extract base model from product name
      const baseModel = productData.name.replace('Google ', '').split(' ').slice(0, 3).join(' ');
      const storage = productData.name.includes("256GB") ? "256GB" : "128GB";
      const color = productData.name.split(" ").pop();
      const stockQuantity = Math.floor(Math.random() * 10) + 1;
      const stockStatus = 'in_stock';

      const product = new Product({
        name: productData.name,
        slug: `${slug}-${randomSuffix}`,
        sku: sku,
        baseModel: baseModel, // Add required baseModel field
        shortDescription: `${productData.name} with GrapheneOS pre-installed`,
        longDescription: `${productData.name} flashed with GrapheneOS for enhanced privacy and security. Ready to use out of the box.`,
        price: productData.price,
        images: ["/images/placeholder.png"],
        // Add variations structure
        variations: [{
          condition: productData.condition,
          color: color,
          storage: storage,
          price: productData.price,
          salePrice: null,
          stockQuantity: stockQuantity,
          stockStatus: stockStatus,
          sku: `${sku}-VAR1`,
          images: ["/images/placeholder.png"]
        }],
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

// Function to check if a model is an old Pixel (1-6a) variant that should be excluded
export const isOldPixelVariant = (productName) => {
  if (!productName) return false;
  
  // Specific patterns to match Pixel 1-6A variants (exclude newer models like Pixel Fold, Pixel 7+)
  const oldPixelPatterns = [
    /\bPixel\s+1\b/i,                     // Pixel 1
    /\bPixel\s+2(\s+XL)?\b/i,             // Pixel 2, Pixel 2 XL
    /\bPixel\s+3(a)?(\s+XL)?\b/i,         // Pixel 3, Pixel 3 XL, Pixel 3a, Pixel 3a XL
    /\bPixel\s+4(a)?(\s+(XL|5G))?\b/i,    // Pixel 4, Pixel 4 XL, Pixel 4a, Pixel 4a XL, Pixel 4a 5G
    /\bPixel\s+5(a)?(\s+XL)?\b/i,         // Pixel 5, Pixel 5a
    /\bPixel\s+6a\b/i,                    // Pixel 6a (exclude this model specifically)
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

// Function to update images for products that have placeholder images
// This downloads actual product images from CEX
export const updateProductImages = async (options = {}) => {
  let connection = null;
  try {
    connection = await connectDB();

    if (!Product) {
      throw new Error("Product model not initialized");
    }

    // Ensure images directory exists
    ensureImagesDirectory();

    console.log("🔍 Finding products with placeholder images...");

    // Find products that need image updates
    const query = options.force
      ? { name: { $regex: /pixel/i } }  // All Pixel products if force flag
      : { images: "/images/placeholder.png", name: { $regex: /pixel/i } };  // Only placeholders

    const products = await Product.find(query);
    console.log(`📊 Found ${products.length} products to update images for`);

    if (products.length === 0) {
      console.log("✅ No products need image updates");
      return { updatedCount: 0, skippedCount: 0 };
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      try {
        console.log(`\n📱 Processing: ${product.name}`);

        // Get the base model and first variation's color
        const baseModel = product.baseModel || extractBaseModel(product.name);
        const firstVariation = product.variations && product.variations.length > 0 ? product.variations[0] : null;
        const color = firstVariation?.color || 'obsidian';

        // Try Google's official Pixel images first (most reliable)
        const googleImageUrl = getGooglePixelImageUrl(baseModel, color);
        console.log(`   🔍 Trying Google image URL: ${googleImageUrl}`);

        // Download the product image
        const safeBaseName = product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50);

        let imagePath = await downloadImage(googleImageUrl, safeBaseName);

        // If Google image fails, try CEX scraping as fallback
        if (!imagePath && product.sourceUrl) {
          console.log(`   ⚠️  Google image failed, trying CEX scraping...`);
          const cexImageUrl = await extractImageUrlFromPage(product.sourceUrl);
          if (cexImageUrl) {
            imagePath = await downloadImage(cexImageUrl, safeBaseName);
          }
        }

        if (!imagePath) {
          console.log(`   ⚠️  Could not download image for ${product.name}`);
          skippedCount++;
          continue;
        }

        // Update product images
        product.images = [imagePath];

        // Also update all variations' images
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach(v => {
            v.images = [imagePath];
          });
        }

        await product.save();
        console.log(`   ✅ Updated image: ${imagePath}`);
        updatedCount++;

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (productError) {
        console.error(`   ❌ Error updating ${product.name}: ${productError.message}`);
        skippedCount++;
      }
    }

    console.log(`\n🎉 Image update completed!`);
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);

    return { updatedCount, skippedCount };

  } catch (error) {
    console.error("❌ Error updating product images:", error.message);
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

// Helper function to generate CEX URL from base model
const generateCexUrl = (baseModel) => {
  if (!baseModel) return null;

  // Clean up the base model
  const cleanModel = baseModel.trim();

  // Map base models to CEX search URLs
  // Format: https://uk.webuy.com/product-search?query=MODEL+PHONE
  const encodedQuery = encodeURIComponent(`${cleanModel} PHONE`);
  return `https://uk.webuy.com/product-search?query=${encodedQuery}`;
};

// Legacy function - kept for backwards compatibility
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
export const syncAndroidPhones = async (options = {}) => {
  let connection = null;

  try {
    // Connect with retry
    connection = await connectDB();

    // Verify models are available
    if (!User || !Product) {
      throw new Error("Models not initialized properly");
    }

    // Ensure images directory exists
    ensureImagesDirectory();

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

    // Step 1: Remove products from database (but keep connection open)
    let totalRemoved = 0;
    
    if (options.clearAll) {
      console.log("\n🗑️  Clearing ALL existing products from database...");
      const result = await Product.deleteMany({});
      totalRemoved = result.deletedCount;
      console.log(`Removed ${totalRemoved} products (full clear)`);
    } else {
      console.log("\n🗑️  Removing old Pixel products from database...");
      
      // Use precise removal patterns that match isOldPixelVariant function
      const oldProductQueries = [
        { name: { $regex: /\bPixel\s+1\b/i } },                     // Pixel 1
        { name: { $regex: /\bPixel\s+2(\s+XL)?\b/i } },             // Pixel 2, Pixel 2 XL
        { name: { $regex: /\bPixel\s+3(a)?(\s+XL)?\b/i } },         // Pixel 3, Pixel 3 XL, Pixel 3a, Pixel 3a XL
        { name: { $regex: /\bPixel\s+4(a)?(\s+(XL|5G))?\b/i } },    // Pixel 4, Pixel 4 XL, Pixel 4a, Pixel 4a XL, Pixel 4a 5G
        { name: { $regex: /\bPixel\s+5(a)?(\s+XL)?\b/i } },         // Pixel 5, Pixel 5a
        { name: { $regex: /\bPixel\s+6a\b/i } }                     // Pixel 6a
      ];
      
      for (const query of oldProductQueries) {
        const result = await Product.deleteMany(query);
        totalRemoved += result.deletedCount;
      }
      console.log(`Removed ${totalRemoved} old Pixel products (1-5 variants only)`);
    }

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

    // Step 4.5: Get the Smartphones category once to avoid race conditions
    console.log("\n📂 Ensuring Smartphones category exists...");
    const category = await findSmartphonesCategory();
    const categoryId = category._id;
    console.log(`✅ Using category: ${category.name} (ID: ${categoryId})`);

    // Step 5: Process and save products
    console.log("\n💾 Creating products in database...");
    let syncedCount = 0;
    let skippedCount = 0;

    for (const productData of filteredProducts) {
      try {
        // Create or update product with grouped variations
        const result = await createOrUpdateProductFromCLI(productData, categoryId);
        
        if (result) {
          syncedCount++;
        } else {
          skippedCount++;
        }

      } catch (productError) {
        console.error(`❌ Failed to create product ${productData.name}:`, productError.message);
        if (productError.errors) {
          console.error("Validation errors:", productError.errors);
        }
        skippedCount++;
      }
    }

    // Get final count of unique products
    const finalProductCount = await Product.countDocuments();
    
    console.log(`\n🎉 Sync completed!`);
    console.log(`   ✅ Processed: ${syncedCount} variations`);
    console.log(`   ⏭️  Skipped: ${skippedCount} variations`);
    console.log(`   🗑️  Removed: ${totalRemoved} old products`);
    console.log(`   📱 Total products in database: ${finalProductCount}`);

    return { 
      syncedCount, 
      skippedCount, 
      removedCount: totalRemoved 
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
  const clearAll = process.argv.includes('--clear');

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
  } else if (command === "update-images") {
    const forceUpdate = process.argv.includes('--force');
    updateProductImages({ force: forceUpdate })
      .then((result) => {
        console.log(`\n✅ Image update completed! Updated ${result.updatedCount} products, skipped ${result.skippedCount}.`);
        process.exit(0);
      })
      .catch((error) => {
        console.error("\n❌ Image update failed:", error.message);
        process.exit(1);
      });
  } else {
    syncAndroidPhones({ clearAll })
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