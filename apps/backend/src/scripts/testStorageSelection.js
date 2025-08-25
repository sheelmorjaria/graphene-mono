import fetch from 'node-fetch';

async function testStorageSelection() {
  console.log('🧪 Testing Storage Selection for Pixel 6...\n');
  
  try {
    // Test the product API
    const response = await fetch('http://localhost:5000/api/products/pixel-6');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const product = data.data;
    
    console.log('📱 Product:', product.name);
    console.log('✅ Available Storage:', product.availableStorage || []);
    console.log('✅ Available Colors:', product.availableColors || []);
    console.log('✅ Available Conditions:', product.availableConditions || []);
    
    console.log('\n📦 Variations with Storage:');
    console.log('=' .repeat(60));
    
    product.variations.forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.condition} - ${v.color} - ${v.storage || 'N/A'}`);
      console.log(`   Price: £${v.price}`);
      console.log(`   Stock: ${v.stockStatus} (${v.stockQuantity} units)`);
      console.log(`   SKU: ${v.sku}`);
    });
    
    // Check if storage field is properly set
    const hasStorage = product.variations.some(v => v.storage);
    const multipleStorageOptions = product.availableStorage && product.availableStorage.length > 1;
    
    console.log('\n🔍 Validation Results:');
    console.log(`   Storage field populated: ${hasStorage ? '✅ Yes' : '❌ No'}`);
    console.log(`   Multiple storage options: ${multipleStorageOptions ? '✅ Yes' : '❌ No'}`);
    console.log(`   Frontend should show storage selector: ${hasStorage && multipleStorageOptions ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n✨ Frontend Testing Instructions:');
    console.log('1. Open http://localhost:3000/products/pixel-6');
    console.log('2. You should see three selection sections:');
    console.log('   - Condition (fair, good)');
    console.log('   - Storage (128GB, 256GB)');
    console.log('   - Color (Stormy Black, Sorta Seaform, Kinda Coral)');
    console.log('3. Select different combinations to see the price update');
    console.log('4. The 256GB option should be £340 (Good condition, Stormy Black)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStorageSelection();