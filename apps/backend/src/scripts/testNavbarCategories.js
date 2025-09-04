import fetch from 'node-fetch';

async function testNavbarCategories() {
  console.log('🧪 Testing Navbar Category Filtering...\\n');
  
  const baseUrl = 'http://localhost:5000/api/products';
  const tests = [
    {
      name: 'All Products (no category)',
      url: `${baseUrl}`,
      expectedDescription: 'Should return all products'
    },
    {
      name: 'GrapheneOS Smartphones',
      url: `${baseUrl}?category=smartphones`,
      expectedDescription: 'Should return only smartphone products'
    },
    {
      name: 'Encrypted USB Drives',
      url: `${baseUrl}?category=usb-drives`,
      expectedDescription: 'Should return only USB drive products'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📱 Testing: ${test.name}`);
      console.log(`🔗 URL: ${test.url}`);
      
      const response = await fetch(test.url);
      
      if (!response.ok) {
        console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Status: SUCCESS');
        console.log(`📊 Products returned: ${data.data.length}`);
        console.log(`🏷️  Product names: ${data.data.map(p => p.name).join(', ')}`);
        console.log(`📝 ${test.expectedDescription}`);
      } else {
        console.log('❌ API response was not successful:', data.message || 'Unknown error');
      }
      
    } catch (error) {
      console.log(`❌ Test failed for ${test.name}:`, error.message);
    }
    
    console.log('-'.repeat(60));
  }

  console.log('\\n🔍 Summary:');
  console.log('1. The navbar dropdown should display three options:');
  console.log('   - All Products → /products');
  console.log('   - GrapheneOS Smartphones → /products?category=smartphones');
  console.log('   - Encrypted USB Drives → /products?category=usb-drives');
  console.log('\\n2. Frontend should be running on http://localhost:3001');
  console.log('3. Backend API should be running on http://localhost:5000');
  console.log('\\n✨ Navigate to http://localhost:3001 to test the navbar dropdown manually');
}

testNavbarCategories();