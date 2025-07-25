import fetch from 'node-fetch';

// Test what the frontend might be sending for sort requests
const testFrontendSortRequests = async () => {
  console.log('🔍 Testing Frontend Sort Request Patterns...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';

  // Common frontend sorting patterns that might be incorrect
  const possibleSortRequests = [
    {
      name: 'Frontend might be sending: price_low_to_high',
      url: `${baseUrl}/api/products?sort=price_low_to_high&limit=5`
    },
    {
      name: 'Frontend might be sending: price_high_to_low', 
      url: `${baseUrl}/api/products?sort=price_high_to_low&limit=5`
    },
    {
      name: 'Frontend might be sending: sort=price&order=asc',
      url: `${baseUrl}/api/products?sort=price&order=asc&limit=5`
    },
    {
      name: 'Frontend might be sending: sort=price&order=desc',
      url: `${baseUrl}/api/products?sort=price&order=desc&limit=5`
    },
    {
      name: 'Frontend might be sending: orderBy=price&direction=asc',
      url: `${baseUrl}/api/products?orderBy=price&direction=asc&limit=5`
    },
    {
      name: 'Frontend might be sending: sortField=price&sortDirection=asc',
      url: `${baseUrl}/api/products?sortField=price&sortDirection=asc&limit=5`
    },
    {
      name: 'Correct format: sortBy=price&sortOrder=asc',
      url: `${baseUrl}/api/products?sortBy=price&sortOrder=asc&limit=5`
    },
    {
      name: 'Correct format: sortBy=price&sortOrder=desc',
      url: `${baseUrl}/api/products?sortBy=price&sortOrder=desc&limit=5`
    }
  ];

  for (const test of possibleSortRequests) {
    console.log(`📊 Testing: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`❌ Status: ${response.status} - ${response.statusText}`);
        console.log(`Response: ${JSON.stringify(data, null, 2)}`);
        console.log();
        continue;
      }

      if (!Array.isArray(data.data)) {
        console.log(`❌ Invalid response format`);
        console.log();
        continue;
      }

      console.log(`✅ Status: ${response.status}, Products: ${data.data.length}`);
      
      // Show first 3 products with prices to see ordering
      const products = data.data.slice(0, 3);
      console.log('📋 First 3 products:');
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name.substring(0, 30)}... - £${product.price}`);
      });
      
      // Check if it's sorted by price
      if (test.url.includes('price')) {
        const prices = data.data.map(p => p.price);
        const isLowToHigh = prices.every((price, i) => i === 0 || price >= prices[i-1]);
        const isHighToLow = prices.every((price, i) => i === 0 || price <= prices[i-1]);
        
        if (isLowToHigh && test.url.includes('asc')) {
          console.log(`   🎯 ✅ Correctly sorted: LOW to HIGH`);
        } else if (isHighToLow && test.url.includes('desc')) {
          console.log(`   🎯 ✅ Correctly sorted: HIGH to LOW`);
        } else if (isLowToHigh) {
          console.log(`   🎯 ⚠️  Sorted LOW to HIGH (but might be unexpected)`);
        } else if (isHighToLow) {
          console.log(`   🎯 ⚠️  Sorted HIGH to LOW (but might be unexpected)`);
        } else {
          console.log(`   🎯 ❌ NOT sorted by price`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }
    
    console.log(); // Empty line for readability
  }

  console.log('🏁 Frontend sort patterns test completed!');
  
  // Show the correct API usage
  console.log('\n📚 CORRECT API Usage for Frontend:');
  console.log('✅ Price Low to High: /api/products?sortBy=price&sortOrder=asc');
  console.log('✅ Price High to Low: /api/products?sortBy=price&sortOrder=desc');
  console.log('✅ Name A to Z: /api/products?sortBy=name&sortOrder=asc');
  console.log('✅ Name Z to A: /api/products?sortBy=name&sortOrder=desc');
  console.log('✅ Newest First: /api/products?sortBy=createdAt&sortOrder=desc');
  console.log('✅ Oldest First: /api/products?sortBy=createdAt&sortOrder=asc');
};

// Run the test
testFrontendSortRequests().catch(console.error);