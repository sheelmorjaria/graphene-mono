import fetch from 'node-fetch';

const testContactForm = async () => {
  try {
    console.log('🧪 Testing contact form submission...\n');

    const testData = {
      fullName: 'Test User',
      email: 'test@example.com',
      subject: 'product-question',
      message: 'This is a test message for the contact form.'
    };

    console.log('📤 Sending contact form data:');
    console.log(JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:5000/api/support/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`\n📥 Response status: ${response.status}`);
    console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`📥 Response body (raw): "${responseText}"`);

    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log('📥 Response body (JSON):');
        console.log(JSON.stringify(responseJson, null, 2));
      } catch (parseError) {
        console.log('❌ Failed to parse response as JSON:', parseError.message);
        console.log('📥 Response appears to be non-JSON content');
      }
    } else {
      console.log('❌ Response body is empty - this would cause the JSON parse error!');
    }

  } catch (error) {
    console.error('❌ Error testing contact form:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 5000');
    }
  }
};

// Run the test
testContactForm()
  .then(() => {
    console.log('\n✅ Contact form test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });