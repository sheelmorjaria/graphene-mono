import { exec } from "child_process";
import { isOldPixelVariant, extractBaseModel } from './syncFromCLI.js';

// Test CLI parsing with the main query used by syncAndroidPhones
const testMainQuery = async () => {
  console.log('🧪 Testing main CLI query: "Google Pixel"...\n');

  // Get CLI output with the main query
  console.log('📡 Fetching data from CLI with main query...');
  const cliOutput = await new Promise((resolve, reject) => {
    exec("./cli-linux-amd64 -query 'Google Pixel'", { 
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
            
            products.push({
              name: productName,
              price: price,
              condition: condition,
              category: category
            });
          }
        }
      }
    }
    
    return products;
  };

  const rawProducts = parseCLIOutput(cliOutput);
  console.log(`🔄 Parsed ${rawProducts.length} total products\n`);

  // Show Android phones only
  const androidPhones = rawProducts.filter(p => p.category === 'Android Phones');
  console.log(`📱 Found ${androidPhones.length} Android phones\n`);

  // Look specifically for Fold products
  const foldProducts = androidPhones.filter(p => p.name.toLowerCase().includes('fold'));
  console.log(`🔍 Fold products found: ${foldProducts.length}\n`);

  if (foldProducts.length === 0) {
    console.log('❌ No Fold products found in main query!');
    console.log('📋 First 20 Android phones from main query:');
    androidPhones.slice(0, 20).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - £${product.price} - ${product.condition}`);
    });
  } else {
    console.log('✅ Fold products found in main query:');
    foldProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - £${product.price} - ${product.condition}`);
      
      const isOld = isOldPixelVariant(product.name);
      const baseModel = extractBaseModel(product.name);
      console.log(`      isOldPixelVariant: ${isOld}, baseModel: "${baseModel}"`);
    });
  }

  // Test the full filtering logic
  console.log('\n🔍 Testing full filtering logic...\n');

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

  const filteredProducts = filterOldPixels(androidPhones);
  console.log(`\n📊 Final filtering results: ${filteredProducts.length} products passed filtering\n`);

  // Count by type
  const foldFiltered = filteredProducts.filter(p => p.name.toLowerCase().includes('fold'));
  const nonFoldFiltered = filteredProducts.filter(p => !p.name.toLowerCase().includes('fold'));

  console.log(`   Fold products: ${foldFiltered.length}`);
  console.log(`   Non-Fold products: ${nonFoldFiltered.length}`);

  return {
    totalRaw: rawProducts.length,
    androidPhones: androidPhones.length,
    foldInRaw: foldProducts.length,
    filtered: filteredProducts.length,
    foldFiltered: foldFiltered.length
  };
};

// Run the test
testMainQuery()
  .then((result) => {
    console.log('\n📊 Summary:');
    console.log(`   Total raw products: ${result.totalRaw}`);
    console.log(`   Android phones: ${result.androidPhones}`);
    console.log(`   Fold products in raw: ${result.foldInRaw}`);
    console.log(`   Final filtered: ${result.filtered}`);
    console.log(`   Fold products filtered: ${result.foldFiltered}`);
    console.log('\n✅ Debug completed!');
    
    if (result.foldFiltered > 0) {
      console.log('🎉 Fold products ARE being found and filtered correctly!');
    } else {
      console.log('❌ Fold products are NOT making it through the filtering process.');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error.message);
    process.exit(1);
  });