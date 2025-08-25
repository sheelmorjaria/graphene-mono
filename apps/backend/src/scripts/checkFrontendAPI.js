import fetch from 'node-fetch';

async function checkFrontendAPI() {
  console.log('🔍 Checking API endpoints for Pixel 9 Pro XL...\n');
  
  const endpoints = [
    'http://localhost:5000/api/products/grapheneos-pixel-9-pro-xl',
    'http://localhost:3000/api/products/grapheneos-pixel-9-pro-xl'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.log(`❌ Failed: ${response.status} ${response.statusText}\n`);
        continue;
      }
      
      const data = await response.json();
      const product = data.data;
      
      console.log(`✅ Success! Response from ${endpoint}:`);
      console.log('🎨 Available Colors:', product.availableColors);
      console.log('💾 Available Storage:', product.availableStorage);
      
      // Check if the problematic color exists
      const hasProblematicColor = product.availableColors.includes('1TB Obsidian');
      console.log(`❌ Has "1TB Obsidian" color: ${hasProblematicColor ? 'YES (PROBLEM!)' : 'NO (GOOD!)'}`);
      
      console.log(''); // Empty line for separation
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
  
  // Check what the frontend is actually using
  console.log('💡 The frontend at http://localhost:3000 should be making API calls to:');
  console.log('   - Backend API at http://localhost:5000/api/...');
  console.log('   - If it\'s calling port 3000, there might be a proxy configuration');
  console.log('   - Check frontend configuration for API base URL');
}

checkFrontendAPI();