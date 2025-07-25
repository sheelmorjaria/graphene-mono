import fetch from 'node-fetch';

// Test what happens when accessing the user addresses endpoint from frontend perspective
const testFrontendEndpointAccess = async () => {
  console.log('🔍 Testing Frontend Endpoint Access Scenarios...\n');

  const backendUrl = 'https://graphene-backend.onrender.com';
  
  // Test scenarios that might return HTML instead of JSON
  const testScenarios = [
    {
      name: 'Correct API endpoint',
      url: `${backendUrl}/api/user/addresses`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token'
      }
    },
    {
      name: 'Missing /api prefix',
      url: `${backendUrl}/user/addresses`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token'
      }
    },
    {
      name: 'Frontend route (SPA fallback)',
      url: `${backendUrl}/checkout`,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    },
    {
      name: 'Root path',
      url: `${backendUrl}/`,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    },
    {
      name: 'Non-existent API path',
      url: `${backendUrl}/api/nonexistent`,
      headers: {
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'API root without endpoint',
      url: `${backendUrl}/api`,
      headers: {
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'API root with trailing slash',
      url: `${backendUrl}/api/`,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`🧪 Testing: ${scenario.name}`);
    console.log(`   URL: ${scenario.url}`);
    
    try {
      const response = await fetch(scenario.url, {
        method: 'GET',
        headers: scenario.headers
      });
      
      console.log(`   Status: ${response.status} - ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Server: ${response.headers.get('server')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')}`);
      
      const responseText = await response.text();
      console.log(`   Response Length: ${responseText.length} characters`);
      
      // Analyze response type
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.log(`   📄 Response Type: HTML Document`);
        const title = responseText.match(/<title>(.*?)<\/title>/i);
        if (title) {
          console.log(`   📄 HTML Title: ${title[1]}`);
        }
        console.log(`   📄 HTML Preview: ${responseText.substring(0, 150).replace(/\s+/g, ' ')}...`);
      } else if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        console.log(`   ✅ Response Type: JSON`);
        try {
          const parsed = JSON.parse(responseText);
          console.log(`   ✅ JSON Content:`, parsed);
        } catch (e) {
          console.log(`   ❌ Invalid JSON: ${e.message}`);
        }
      } else if (responseText.trim() === '') {
        console.log(`   📄 Response Type: Empty`);
      } else {
        console.log(`   📄 Response Type: Other`);
        console.log(`   📄 Preview: ${responseText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('🏁 Frontend endpoint access test completed!');
};

// Run the test
testFrontendEndpointAccess().catch(console.error);