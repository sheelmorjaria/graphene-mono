import fetch from 'node-fetch';

// Test storefront API for Pixel Fold
const testStorefrontAPI = async () => {
  console.log('🔍 Testing Storefront API for Pixel Fold...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';

  try {
    // Test products API
    console.log('📡 Fetching products API...');
    const response = await fetch(`${baseUrl}/api/products`);
    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
      console.error('Response:', data);
      return;
    }

    console.log(`✅ API Response: ${response.status}`);
    console.log(`📊 Total products returned: ${Array.isArray(data.data) ? data.data.length : 0}`);

    if (Array.isArray(data.data)) {
      // Look for Pixel Fold products
      const foldProducts = data.data.filter(product => 
        product.name.toLowerCase().includes('fold')
      );

      console.log(`\n📱 Pixel Fold Products Found: ${foldProducts.length}`);
      
      if (foldProducts.length > 0) {
        foldProducts.forEach(product => {
          console.log(`✅ ${product.name}`);
          console.log(`   Price: £${product.price}`);
          console.log(`   Condition: ${product.condition}`);
          console.log(`   Stock: ${product.stockStatus}`);
          console.log(`   Category: ${product.category?.name || 'None'}`);
          console.log(`   ID: ${product.id}`);
          console.log();
        });
      } else {
        console.log('❌ No Pixel Fold products found in API response');
        
        // Show some recent products for comparison
        console.log('\n📋 Sample of returned products:');
        data.data.slice(0, 5).forEach(product => {
          console.log(`   - ${product.name} (£${product.price})`);
        });
      }

      // Check for Pixel 9 products
      const pixel9Products = data.data.filter(product => 
        product.name.toLowerCase().includes('pixel 9')
      );
      
      console.log(`\n📱 Pixel 9 Products Found: ${pixel9Products.length}`);
      pixel9Products.forEach(product => {
        console.log(`   - ${product.name} (£${product.price})`);
      });

    } else {
      console.log('❌ No products data in API response');
      console.log('Response structure:', Object.keys(data));
    }

    // Test search API if available
    console.log('\n🔍 Testing search API...');
    try {
      const searchResponse = await fetch(`${baseUrl}/api/products?search=fold`);
      const searchData = await searchResponse.json();
      
      if (searchResponse.ok) {
        console.log(`✅ Search API works: ${Array.isArray(searchData.data) ? searchData.data.length : 0} results for "fold"`);
      } else {
        console.log(`⚠️  Search API: ${searchResponse.status} - ${searchResponse.statusText}`);
      }
    } catch (searchError) {
      console.log(`⚠️  Search API not available: ${searchError.message}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }

  console.log('\n🏁 Storefront API test completed!');
};

// Run the test
testStorefrontAPI().catch(console.error);