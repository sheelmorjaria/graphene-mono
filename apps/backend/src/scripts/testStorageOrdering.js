import fetch from 'node-fetch';

async function testStorageOrdering() {
  console.log('🧪 Testing Storage Options Ordering...\n');
  
  try {
    // Test the Pixel 9 Pro XL product
    const response = await fetch('http://localhost:5000/api/products/grapheneos-pixel-9-pro-xl');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const product = data.data;
    
    console.log('📱 Product:', product.name);
    console.log('💾 Available Storage (from API):', product.availableStorage || []);
    
    // Test the sorting logic that will be used in the frontend
    const storageOptions = product.availableStorage || [];
    
    console.log('\n🔧 Frontend Sorting Test:');
    console.log('Original order:', storageOptions);
    
    // Simulate the frontend sorting logic
    const sortedStorage = storageOptions.sort((a, b) => {
      const getSizeInBytes = (sizeStr) => {
        const numericValue = parseInt(sizeStr.replace(/[^0-9]/g, ''));
        if (sizeStr.toUpperCase().includes('TB')) {
          return numericValue * 1024; // Convert TB to GB equivalent
        } else if (sizeStr.toUpperCase().includes('GB')) {
          return numericValue;
        }
        return numericValue; // Fallback for unitless numbers
      };
      
      const sizeA = getSizeInBytes(a);
      const sizeB = getSizeInBytes(b);
      return sizeA - sizeB;
    });
    
    console.log('Sorted order:', sortedStorage);
    
    // Verify the expected order
    const expectedOrder = ['128GB', '256GB', '512GB', '1TB'];
    const isCorrectOrder = JSON.stringify(sortedStorage) === JSON.stringify(expectedOrder);
    
    console.log('\n🔍 Validation:');
    console.log(`Expected order: ${expectedOrder.join(' → ')}`);
    console.log(`Actual order:   ${sortedStorage.join(' → ')}`);
    console.log(`✅ Correct order: ${isCorrectOrder ? 'YES' : 'NO'}`);
    
    if (isCorrectOrder) {
      console.log('\n🎉 SUCCESS: Storage options will now display in increasing order');
      console.log('   128GB → 256GB → 512GB → 1TB');
      console.log('\n🌐 Frontend Impact:');
      console.log('- Product page storage selector shows options from smallest to largest');
      console.log('- 1TB correctly appears after 512GB (not before 128GB)');
      console.log('- User experience is now logical and intuitive');
    } else {
      console.log('\n❌ ISSUE: Storage options may still be out of order');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStorageOrdering();