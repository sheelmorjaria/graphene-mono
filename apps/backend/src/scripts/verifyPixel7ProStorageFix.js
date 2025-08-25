import fetch from 'node-fetch';

async function verifyPixel7ProStorageFix() {
  console.log('🧪 Verifying Pixel 7 Pro Storage/RAM Fix...\n');
  
  try {
    // Test the product API
    const response = await fetch('http://localhost:5000/api/products/grapheneos-pixel-7-pro');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const product = data.data;
    
    console.log('📱 Product:', product.name);
    console.log('💾 Available Storage:', product.availableStorage || []);
    
    // Check attributes for RAM specification
    const ramAttribute = product.attributes?.find(attr => 
      attr.name.toLowerCase().includes('ram')
    );
    
    const storageAttribute = product.attributes?.find(attr => 
      attr.name === 'Available Storage'
    );
    
    console.log('\n📋 Specifications:');
    if (ramAttribute) {
      console.log(`🧠 ${ramAttribute.name}: ${ramAttribute.value}`);
    }
    if (storageAttribute) {
      console.log(`💾 ${storageAttribute.name}: ${storageAttribute.value}`);
    }
    
    console.log('\n📦 Storage Variations:');
    const storageBreakdown = {};
    product.variations.forEach(v => {
      if (!storageBreakdown[v.storage]) {
        storageBreakdown[v.storage] = [];
      }
      storageBreakdown[v.storage].push(`${v.condition} ${v.color} - £${v.price}`);
    });
    
    Object.entries(storageBreakdown).forEach(([storage, variations]) => {
      console.log(`  ${storage}:`);
      variations.forEach(v => console.log(`    - ${v}`));
    });
    
    // Validation
    const hasCorrectStorage = product.availableStorage.includes('128GB') && product.availableStorage.includes('256GB');
    const noRAMInStorage = !product.availableStorage.includes('12GB');
    const hasRAMAttribute = ramAttribute && ramAttribute.value === '12GB';
    const correctStorageCount = product.availableStorage.length === 2;
    
    console.log('\n🔍 Validation:');
    console.log(`✅ Has 128GB and 256GB storage: ${hasCorrectStorage ? 'YES' : 'NO'}`);
    console.log(`✅ No 12GB in storage options: ${noRAMInStorage ? 'YES' : 'NO'}`);
    console.log(`✅ 12GB properly noted as RAM: ${hasRAMAttribute ? 'YES' : 'NO'}`);
    console.log(`✅ Exactly 2 storage options: ${correctStorageCount ? 'YES' : 'NO'}`);
    
    if (hasCorrectStorage && noRAMInStorage && hasRAMAttribute && correctStorageCount) {
      console.log('\n🎉 SUCCESS: Pixel 7 Pro now correctly shows:');
      console.log('- Storage Options: 128GB, 256GB');
      console.log('- RAM Specification: 12GB (in attributes)');
      console.log('- No confusion between RAM and storage');
      console.log('\n🌐 Frontend Impact:');
      console.log('- Product page shows "128GB, 256GB" as storage selector options');
      console.log('- Specifications section shows "RAM: 12GB" separately');
      console.log('- Users can properly select between 128GB and 256GB storage');
    } else {
      console.log('\n❌ ISSUE: Some problems remain');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

verifyPixel7ProStorageFix();