import fetch from 'node-fetch';

// Test what happens when we access a typical frontend domain
const testFrontendURL = async () => {
  console.log('🔍 Testing Frontend URL Scenarios...\n');

  // Common frontend deployment patterns
  const frontendUrls = [
    'https://graphene-frontend.onrender.com',
    'https://grapheneos-store-frontend.onrender.com', 
    'https://graphene-store-frontend.onrender.com',
    'https://graphene-frontend-production.onrender.com'
  ];

  for (const frontendUrl of frontendUrls) {
    console.log(`🧪 Testing Frontend Domain: ${frontendUrl}`);
    
    try {
      // Test accessing the frontend directly
      const response = await fetch(frontendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      console.log(`   Status: ${response.status} - ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('   ✅ Frontend accessible');
        console.log(`   Response Length: ${responseText.length} characters`);
        
        if (responseText.includes('<title>')) {
          const title = responseText.match(/<title>(.*?)<\/title>/i);
          if (title) {
            console.log(`   📄 Title: ${title[1]}`);
          }
        }
        
        // Test what happens when we try to access an API endpoint on the frontend domain
        console.log('   🧪 Testing API endpoint on frontend domain...');
        const apiResponse = await fetch(`${frontendUrl}/api/user/addresses`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }
        });
        
        console.log(`   API Status: ${apiResponse.status} - ${apiResponse.statusText}`);
        console.log(`   API Content-Type: ${apiResponse.headers.get('content-type')}`);
        
        const apiResponseText = await apiResponse.text();
        if (apiResponseText.trim().startsWith('<')) {
          console.log('   📄 API returns HTML (SPA fallback)');
        } else {
          console.log(`   📄 API returns: ${apiResponseText.substring(0, 100)}...`);
        }
        
      } else {
        console.log('   ❌ Frontend not accessible at this URL');
      }
      
    } catch (error) {
      console.log(`   ❌ Cannot access: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('📊 Testing potential misconfiguration scenarios...\n');
  
  // Test if frontend has API_BASE_URL set to itself
  const misconfigScenarios = [
    {
      name: 'Frontend serving API (wrong config)',
      description: 'Frontend VITE_API_BASE_URL pointing to frontend domain',
      url: 'https://some-frontend-domain.com/api/user/addresses'
    },
    {
      name: 'Relative URL fallback',
      description: 'Frontend using relative /api path', 
      url: '/api/user/addresses'
    },
    {
      name: 'Localhost in production',
      description: 'Frontend still using localhost',
      url: 'http://localhost:3000/api/user/addresses'
    }
  ];
  
  for (const scenario of misconfigScenarios) {
    console.log(`🧪 Scenario: ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Example URL: ${scenario.url}`);
    console.log('   Expected result: Would return HTML (React app) instead of JSON');
    console.log();
  }
  
  console.log('🏁 Frontend URL test completed!');
};

// Run the test
testFrontendURL().catch(console.error);