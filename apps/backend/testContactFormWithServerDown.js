import fetch from 'node-fetch';

const testContactFormWithServerDown = async () => {
  console.log('🧪 Testing contact form when server is down...\n');

  const testData = {
    fullName: 'Test User',
    email: 'test@example.com',
    subject: 'product-question',
    message: 'This is a test message.'
  };

  try {
    console.log('📤 Attempting to submit contact form...');
    
    const response = await fetch('http://localhost:5000/api/support/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📥 Response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📥 Response body: "${responseText}"`);

  } catch (error) {
    console.log(`❌ Expected error caught: ${error.message}`);
    console.log(`🔍 Error code: ${error.code}`);
    console.log(`🔍 Error cause: ${error.cause}`);
    
    // This simulates what would happen in the frontend service
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 This is the expected behavior when server is down');
      console.log('💡 Frontend should handle this gracefully');
    }
  }
};

// Run the test
testContactFormWithServerDown()
  .then(() => {
    console.log('\n✅ Server down test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  });