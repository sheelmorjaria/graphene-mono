import fetch from 'node-fetch';

const testContactFormScenarios = async () => {
  console.log('🧪 Testing contact form scenarios...\n');

  const scenarios = [
    {
      name: '✅ Valid submission',
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        subject: 'product-question',
        message: 'This is a test message.'
      },
      expectedStatus: 200
    },
    {
      name: '❌ Missing required fields',
      data: {
        fullName: '',
        email: 'test@example.com',
        subject: '',
        message: ''
      },
      expectedStatus: 400
    },
    {
      name: '❌ Invalid email',
      data: {
        fullName: 'Test User',
        email: 'invalid-email',
        subject: 'product-question',
        message: 'Test message'
      },
      expectedStatus: 400
    },
    {
      name: '❌ Invalid subject',
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
        subject: 'invalid-subject',
        message: 'Test message'
      },
      expectedStatus: 400
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`📤 Data:`, JSON.stringify(scenario.data, null, 2));

    try {
      const response = await fetch('http://localhost:5000/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenario.data)
      });

      console.log(`📥 Status: ${response.status} (expected: ${scenario.expectedStatus})`);
      
      const contentType = response.headers.get('content-type');
      console.log(`📥 Content-Type: ${contentType}`);

      if (contentType && contentType.includes('application/json')) {
        try {
          const responseData = await response.json();
          console.log(`📥 Response:`, JSON.stringify(responseData, null, 2));
          
          if (response.status === scenario.expectedStatus) {
            console.log(`✅ Status matches expected`);
          } else {
            console.log(`❌ Status mismatch! Expected ${scenario.expectedStatus}, got ${response.status}`);
          }
        } catch (parseError) {
          console.log(`❌ JSON parse error:`, parseError.message);
          console.log(`📥 Raw response:`, await response.text());
        }
      } else {
        const textResponse = await response.text();
        console.log(`📥 Non-JSON response:`, textResponse);
      }

    } catch (error) {
      console.error(`❌ Request error:`, error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Make sure the backend server is running on port 5000');
        break;
      }
    }

    console.log('─'.repeat(50));
  }
};

// Run the test
testContactFormScenarios()
  .then(() => {
    console.log('\n✅ All contact form scenarios tested!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });