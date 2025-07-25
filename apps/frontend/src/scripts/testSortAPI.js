// Test script to verify that the frontend sort conversion produces correct API calls
import fetch from 'node-fetch';

// Simulate the convertSortParams function
const convertSortParams = (params) => {
  const convertedParams = { ...params };
  
  if (params.sort) {
    switch (params.sort) {
      case 'price-low':
        convertedParams.sortBy = 'price';
        convertedParams.sortOrder = 'asc';
        break;
      case 'price-high':
        convertedParams.sortBy = 'price';
        convertedParams.sortOrder = 'desc';
        break;
      case 'name-asc':
        convertedParams.sortBy = 'name';
        convertedParams.sortOrder = 'asc';
        break;
      case 'name-desc':
        convertedParams.sortBy = 'name';
        convertedParams.sortOrder = 'desc';
        break;
      case 'newest':
        convertedParams.sortBy = 'createdAt';
        convertedParams.sortOrder = 'desc';
        break;
      case 'oldest':
        convertedParams.sortBy = 'createdAt';
        convertedParams.sortOrder = 'asc';
        break;
      default:
        convertedParams.sortBy = 'createdAt';
        convertedParams.sortOrder = 'desc';
    }
    
    delete convertedParams.sort;
  }
  
  return convertedParams;
};

// Test the API calls with frontend sort values
const testSortAPI = async () => {
  console.log('🔍 Testing Frontend Sort Conversion with Production API...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';
  
  const frontendSortTests = [
    { sort: 'price-low', label: 'Price: Low to High' },
    { sort: 'price-high', label: 'Price: High to Low' },
    { sort: 'name-asc', label: 'Name A-Z' },
    { sort: 'newest', label: 'Newest First' }
  ];

  for (const test of frontendSortTests) {
    console.log(`📊 Testing: ${test.label}`);
    
    // Convert frontend params to backend params
    const frontendParams = { sort: test.sort, limit: 3 };
    const backendParams = convertSortParams(frontendParams);
    
    console.log(`Frontend sends: ${JSON.stringify(frontendParams)}`);
    console.log(`Converted to: ${JSON.stringify(backendParams)}`);
    
    // Build query string
    const queryString = new URLSearchParams(backendParams).toString();
    const url = `${baseUrl}/api/products?${queryString}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`❌ Error: ${response.status}`);
        continue;
      }

      if (!Array.isArray(data.data)) {
        console.log(`❌ Invalid response format`);
        continue;
      }

      console.log(`✅ Success: ${data.data.length} products returned`);
      console.log('📋 Results:');
      
      data.data.forEach((product, index) => {
        const price = `£${product.price}`;
        const name = product.name.substring(0, 35) + (product.name.length > 35 ? '...' : '');
        console.log(`   ${index + 1}. ${name} - ${price}`);
      });
      
      // Verify sorting worked
      if (test.sort === 'price-low') {
        const prices = data.data.map(p => p.price);
        const isAscending = prices.every((price, i) => i === 0 || price >= prices[i-1]);
        console.log(`   🎯 Price sorting: ${isAscending ? '✅ LOW to HIGH' : '❌ NOT SORTED'}`);
      } else if (test.sort === 'price-high') {
        const prices = data.data.map(p => p.price);
        const isDescending = prices.every((price, i) => i === 0 || price <= prices[i-1]);
        console.log(`   🎯 Price sorting: ${isDescending ? '✅ HIGH to LOW' : '❌ NOT SORTED'}`);
      } else if (test.sort === 'name-asc') {
        const names = data.data.map(p => p.name.toLowerCase());
        const isAscending = names.every((name, i) => i === 0 || name >= names[i-1]);
        console.log(`   🎯 Name sorting: ${isAscending ? '✅ A to Z' : '❌ NOT SORTED'}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    console.log(); // Empty line for readability
  }

  console.log('🏁 Frontend sort conversion test completed!');
};

// Run the test
testSortAPI().catch(console.error);