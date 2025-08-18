import { exec } from "child_process";
import { isOldPixelVariant, extractBaseModel } from './syncFromCLI.js';

// Test CLI parsing specifically for Fold products
const testCLIParsing = async () => {
  console.log('🧪 Testing CLI parsing for Fold products...\n');

  // Get CLI output
  console.log('📡 Fetching data from CLI...');
  const cliOutput = await new Promise((resolve, reject) => {
    exec("./cli-linux-amd64 -query 'Google Pixel Fold'", { 
      maxBuffer: 1024 * 1024 * 10 
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

  console.log(`📊 CLI output length: ${cliOutput.length} characters\n`);

  // Parse the output
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
          }
        }
      }
    }
    
    return products;
  };

  const rawProducts = parseCLIOutput(cliOutput);
  console.log(`🔄 Parsed ${rawProducts.length} total products\n`);

  // Show all Android phones
  const androidPhones = rawProducts.filter(p => p.category === 'Android Phones');
  console.log(`📱 Found ${androidPhones.length} Android phones:\n`);

  androidPhones.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} - £${product.price} - ${product.condition}`);
    console.log(`   Category: ${product.category}`);
    
    // Test filtering functions
    const isOld = isOldPixelVariant(product.name);
    const baseModel = extractBaseModel(product.name);
    const isFold = product.name.toLowerCase().includes('fold');
    const is6a = product.name.toLowerCase().includes('6a');
    
    console.log(`   isOldPixelVariant: ${isOld}`);
    console.log(`   extractBaseModel: "${baseModel}"`);
    console.log(`   isFold: ${isFold}`);
    console.log(`   is6a: ${is6a}`);
    
    // Determine if should be included
    let shouldInclude = false;
    let reason = '';
    
    if (product.category !== 'Android Phones') {
      reason = 'Not an Android phone';
    } else if (isOld) {
      reason = 'Old Pixel model (1-6a)';
    } else if (!product.name.includes('Google Pixel')) {
      reason = 'Not a Google Pixel';
    } else if (isFold) {
      shouldInclude = true;
      reason = 'Fold product - always include';
    } else if (is6a) {
      reason = 'Pixel 6a - excluded';
    } else {
      shouldInclude = true;
      reason = 'Valid newer Pixel';
    }
    
    console.log(`   shouldInclude: ${shouldInclude} (${reason})`);
    console.log();
  });

  // Filter using the same logic as syncFromCLI
  const filterOldPixels = (products) => {
    return products.filter(product => {
      const name = product.name;
      const category = product.category;
      
      // Only include Android phones
      if (category !== 'Android Phones') {
        return false;
      }
      
      // Skip if it's an old Pixel model (1-5 and variants)
      if (isOldPixelVariant(name)) {
        return false;
      }
      
      // Only include if it's a Google Pixel phone
      if (name.includes('Google Pixel')) {
        // Special handling for Fold products - always include them
        if (name.toLowerCase().includes('fold')) {
          return true;
        }
        
        // For non-Fold products, check they're not 6a
        if (name.toLowerCase().includes('6a')) {
          return false;
        }
        
        return true;
      }
      
      return false;
    });
  };

  const filteredProducts = filterOldPixels(androidPhones);
  console.log(`✅ Final filtered products: ${filteredProducts.length}\n`);

  filteredProducts.forEach((product, index) => {
    const baseModel = extractBaseModel(product.name);
    console.log(`${index + 1}. ${product.name} → Base Model: "${baseModel}"`);
  });

  return {
    totalRaw: rawProducts.length,
    androidPhones: androidPhones.length,
    filtered: filteredProducts.length,
    products: filteredProducts
  };
};

// Run the test
testCLIParsing()
  .then((result) => {
    console.log('\n📊 Summary:');
    console.log(`   Total raw products: ${result.totalRaw}`);
    console.log(`   Android phones: ${result.androidPhones}`);
    console.log(`   Final filtered: ${result.filtered}`);
    console.log('\n✅ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error.message);
    process.exit(1);
  });