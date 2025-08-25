import fetch from 'node-fetch';

async function testPixel6StorageSelector() {
  console.log('🧪 Testing Pixel 6 Storage Selector Implementation...\n');
  
  try {
    // Test the product API
    const response = await fetch('http://localhost:5000/api/products/grapheneos-pixel-6');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const product = data.data;
    
    console.log('📱 Product:', product.name);
    console.log('📦 Available Storage:', product.availableStorage || []);
    console.log('📊 Storage Options Count:', product.availableStorage?.length || 0);
    
    console.log('\n🔍 Variations Analysis:');
    console.log('=' .repeat(60));
    
    product.variations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.condition} - ${v.color} - ${v.storage || 'N/A'}`);
      console.log(`   Price: £${v.price}, Stock: ${v.stockQuantity} (${v.stockStatus})`);
    });
    
    // Frontend behavior prediction
    console.log('\n🖥️  Frontend Behavior:');
    console.log('=' .repeat(60));
    
    const hasStorage = product.availableStorage && product.availableStorage.length > 0;
    const singleStorage = product.availableStorage && product.availableStorage.length === 1;
    
    if (hasStorage) {
      if (singleStorage) {
        console.log('✅ Storage selector WILL be shown');
        console.log('✅ Single option (128GB) will be auto-selected and disabled');
        console.log('✅ Users will see: Condition → Storage (128GB pre-selected) → Color');
      } else {
        console.log('✅ Storage selector WILL be shown with multiple options');
        console.log('✅ Users can choose between storage options');
      }
    } else {
      console.log('❌ Storage selector will NOT be shown');
    }
    
    console.log('\n🌐 Testing Instructions:');
    console.log('1. Open http://localhost:3000/products/grapheneos-pixel-6');
    console.log('2. You should see:');
    console.log('   - Condition selector (fair, good)');
    console.log('   - Storage selector (128GB - pre-selected and disabled)');
    console.log('   - Color selector (Stormy Black, Sorta Seafoam, Kinda Coral)');
    console.log('3. Select condition and color to see price update');
    console.log('4. The 128GB storage should always be selected');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPixel6StorageSelector();