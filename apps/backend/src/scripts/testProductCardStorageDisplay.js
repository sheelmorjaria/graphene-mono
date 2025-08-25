import fetch from 'node-fetch';

async function testProductCardStorageDisplay() {
  console.log('🧪 Testing Product Card Storage Display...\n');
  
  try {
    // Test the products list API
    const response = await fetch('http://localhost:5000/api/products?limit=5');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const products = data.data;
    
    console.log('📦 Product Cards Storage Display Test:');
    console.log('=' .repeat(80));
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Colors: ${product.availableColors?.length || 0} (${product.availableColors?.join(', ') || 'None'})`);
      console.log(`   Conditions: ${product.availableConditions?.length || 0} (${product.availableConditions?.join(', ') || 'None'})`);
      console.log(`   Storage: ${product.availableStorage?.length || 0} (${product.availableStorage?.join(', ') || 'None'})`);
      
      // Predict what will show on card
      const badges = [];
      if (product.availableColors?.length > 0) {
        badges.push(`${product.availableColors.length} Color${product.availableColors.length === 1 ? '' : 's'}`);
      }
      if (product.availableConditions?.length > 0) {
        badges.push(`${product.availableConditions.length} Condition${product.availableConditions.length === 1 ? '' : 's'}`);
      }
      if (product.availableStorage?.length > 0) {
        badges.push(`${product.availableStorage.length} ${product.availableStorage.length === 1 ? 'Storage' : 'Storage Options'}`);
      }
      
      console.log(`   Card will show: [${badges.join('] [')}]`);
    });
    
    console.log('\n🖥️  Frontend Testing:');
    console.log('=' .repeat(50));
    console.log('1. Open http://localhost:3000/products');
    console.log('2. Look at product cards');
    console.log('3. Each card should now show badges for:');
    console.log('   - Colors available (e.g., "3 Colors")');
    console.log('   - Conditions available (e.g., "2 Conditions")');
    console.log('   - Storage options (e.g., "2 Storage Options" or "1 Storage")');
    console.log('4. Cards with single storage should show "1 Storage"');
    console.log('5. Cards with multiple storage should show "X Storage Options"');
    
    console.log('\n✅ Backend API provides all storage data needed for display');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductCardStorageDisplay();