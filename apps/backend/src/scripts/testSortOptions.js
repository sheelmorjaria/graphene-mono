import fetch from 'node-fetch';

// Test sorting options on the production API
const testSortOptions = async () => {
  console.log('🔍 Testing Sort Options on Production API...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';

  const sortTests = [
    { 
      name: 'Default (no sort specified)', 
      url: `${baseUrl}/api/products?limit=5` 
    },
    { 
      name: 'Sort by price (low to high)', 
      url: `${baseUrl}/api/products?sortBy=price&sortOrder=asc&limit=5` 
    },
    { 
      name: 'Sort by price (high to low)', 
      url: `${baseUrl}/api/products?sortBy=price&sortOrder=desc&limit=5` 
    },
    { 
      name: 'Sort by name (A to Z)', 
      url: `${baseUrl}/api/products?sortBy=name&sortOrder=asc&limit=5` 
    },
    { 
      name: 'Sort by name (Z to A)', 
      url: `${baseUrl}/api/products?sortBy=name&sortOrder=desc&limit=5` 
    },
    { 
      name: 'Sort by creation date (newest first)', 
      url: `${baseUrl}/api/products?sortBy=createdAt&sortOrder=desc&limit=5` 
    },
    { 
      name: 'Sort by creation date (oldest first)', 
      url: `${baseUrl}/api/products?sortBy=createdAt&sortOrder=asc&limit=5` 
    }
  ];

  for (const test of sortTests) {
    console.log(`📊 Testing: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url);
      
      if (!response.ok) {
        console.error(`❌ Error: ${response.status} - ${response.statusText}\n`);
        continue;
      }

      const data = await response.json();
      
      if (!Array.isArray(data.data)) {
        console.error('❌ Invalid response format\n');
        continue;
      }

      console.log(`✅ Status: ${response.status}, Products: ${data.data.length}`);
      console.log('📋 Results:');
      
      data.data.forEach((product, index) => {
        const price = `£${product.price}`;
        const name = product.name.substring(0, 40) + (product.name.length > 40 ? '...' : '');
        const createdAt = new Date(product.createdAt).toLocaleDateString();
        
        console.log(`   ${index + 1}. ${name}`);
        console.log(`      Price: ${price}, Created: ${createdAt}`);
      });
      
      // Check if sorting actually worked
      if (test.url.includes('sortBy=price')) {
        const prices = data.data.map(p => p.price);
        const isAscending = test.url.includes('sortOrder=asc');
        
        let sortedCorrectly = true;
        for (let i = 1; i < prices.length; i++) {
          if (isAscending && prices[i] < prices[i-1]) {
            sortedCorrectly = false;
            break;
          }
          if (!isAscending && prices[i] > prices[i-1]) {
            sortedCorrectly = false;
            break;
          }
        }
        
        console.log(`   🎯 Price sorting ${sortedCorrectly ? '✅ CORRECT' : '❌ INCORRECT'}`);
      }
      
      if (test.url.includes('sortBy=name')) {
        const names = data.data.map(p => p.name.toLowerCase());
        const isAscending = test.url.includes('sortOrder=asc');
        
        let sortedCorrectly = true;
        for (let i = 1; i < names.length; i++) {
          if (isAscending && names[i] < names[i-1]) {
            sortedCorrectly = false;
            break;
          }
          if (!isAscending && names[i] > names[i-1]) {
            sortedCorrectly = false;
            break;
          }
        }
        
        console.log(`   🎯 Name sorting ${sortedCorrectly ? '✅ CORRECT' : '❌ INCORRECT'}`);
      }
      
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }
    
    console.log(); // Empty line for readability
  }

  console.log('🏁 Sort options test completed!');
};

// Run the test
testSortOptions().catch(console.error);