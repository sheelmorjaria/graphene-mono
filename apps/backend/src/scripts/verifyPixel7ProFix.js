import fetch from 'node-fetch';

async function verifyPixel7ProFix() {
  console.log('🧪 Verifying Pixel 7 Pro Storage Fix...\n');
  
  try {
    // Test the product API
    const response = await fetch('http://localhost:5000/api/products/grapheneos-pixel-7-pro');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const product = data.data;
    
    console.log('📱 Product:', product.name);
    console.log('✅ Available Storage:', product.availableStorage || []);
    
    console.log('\n📦 All Variations:');
    product.variations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.condition} - ${v.color} - Storage: ${v.storage} - £${v.price}`);
    });
    
    // Validation
    const hasCorrectStorage = product.availableStorage.includes('128GB');
    const hasWrongStorage = product.availableStorage.includes('12GB');
    const allVariationsCorrect = product.variations.every(v => v.storage === '128GB');
    
    console.log('\n🔍 Validation:');
    console.log(`✅ API shows 128GB storage: ${hasCorrectStorage ? 'YES' : 'NO'}`);
    console.log(`❌ API still shows 12GB: ${hasWrongStorage ? 'YES' : 'NO'}`);
    console.log(`✅ All variations have 128GB: ${allVariationsCorrect ? 'YES' : 'NO'}`);
    
    if (hasCorrectStorage && !hasWrongStorage && allVariationsCorrect) {
      console.log('\n🎉 SUCCESS: Pixel 7 Pro storage is now correctly set to 128GB!');
      console.log('\n🌐 Frontend Impact:');
      console.log('- Product page will now show 128GB storage selector');
      console.log('- Product card will show "1 Storage" badge');
      console.log('- Users will see correct storage capacity');
    } else {
      console.log('\n❌ ISSUE: Some problems remain');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

verifyPixel7ProFix();