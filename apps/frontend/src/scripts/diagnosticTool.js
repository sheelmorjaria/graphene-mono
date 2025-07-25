// Diagnostic tool to check frontend configuration
// Run this in browser console or add to a page temporarily

const runDiagnostics = () => {
  console.log('🔍 FRONTEND DIAGNOSTICS');
  console.log('========================\n');
  
  // 1. Environment Variables
  console.log('📊 Environment Configuration:');
  console.log('  VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('  MODE:', import.meta.env.MODE);
  console.log('  DEV:', import.meta.env.DEV);
  console.log('  PROD:', import.meta.env.PROD);
  console.log('  All env vars:', import.meta.env);
  
  // 2. Current Location
  console.log('\n📍 Current Location:');
  console.log('  Origin:', window.location.origin);
  console.log('  Hostname:', window.location.hostname);
  console.log('  Full URL:', window.location.href);
  
  // 3. Computed API URLs
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  console.log('\n🔗 API URL Configuration:');
  console.log('  Computed API_BASE_URL:', API_BASE_URL);
  console.log('  Is relative?', API_BASE_URL.startsWith('/'));
  console.log('  Full addresses URL:', `${API_BASE_URL}/user/addresses`);
  
  if (API_BASE_URL.startsWith('/')) {
    console.log('  ⚠️  RELATIVE URL DETECTED! This will call:', window.location.origin + API_BASE_URL);
    console.log('  ❌ This is likely THE PROBLEM - relative URLs call the frontend domain');
  } else {
    console.log('  ✅ Absolute URL detected - should work correctly');
  }
  
  // 4. Token Check
  const token = localStorage.getItem('authToken');
  console.log('\n🔐 Authentication:');
  console.log('  Token exists:', !!token);
  if (token) {
    console.log('  Token preview:', token.substring(0, 20) + '...');
  }
  
  // 5. Test API Call
  console.log('\n🧪 Testing API Call:');
  const testUrl = `${API_BASE_URL}/products?limit=1`;
  console.log('  Test URL:', testUrl);
  
  fetch(testUrl)
    .then(response => {
      console.log('  Test Response Status:', response.status);
      console.log('  Test Content-Type:', response.headers.get('content-type'));
      console.log('  Test URL (actual):', response.url);
      
      if (response.headers.get('content-type')?.includes('text/html')) {
        console.log('  ❌ API returning HTML - CONFIGURATION PROBLEM CONFIRMED');
      } else {
        console.log('  ✅ API returning proper JSON');
      }
      
      return response.text();
    })
    .then(text => {
      if (text.trim().startsWith('<')) {
        console.log('  📄 Response is HTML (first 100 chars):', text.substring(0, 100));
      } else {
        console.log('  📄 Response is not HTML:', text.substring(0, 100));
      }
    })
    .catch(error => {
      console.log('  ❌ Test API call failed:', error.message);
    });
  
  console.log('\n🎯 DIAGNOSIS SUMMARY:');
  if (API_BASE_URL.startsWith('/')) {
    console.log('❌ PROBLEM IDENTIFIED: Frontend is using relative API URL');
    console.log('💡 SOLUTION: Set VITE_API_BASE_URL to absolute backend URL in Render environment');
    console.log('📝 Required: VITE_API_BASE_URL = https://graphene-backend.onrender.com/api');
  } else if (API_BASE_URL.includes(window.location.hostname)) {
    console.log('❌ PROBLEM IDENTIFIED: Frontend API URL points to frontend domain');
    console.log('💡 SOLUTION: Change VITE_API_BASE_URL to point to backend domain');
  } else {
    console.log('✅ Configuration looks correct, checking other issues...');
  }
};

// Auto-run diagnostics
runDiagnostics();

// Also export for manual use
window.runDiagnostics = runDiagnostics;