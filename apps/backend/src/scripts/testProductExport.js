import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testProductExport() {
  try {
    console.log('Testing Product CSV Export...\n');

    // First, we need to login as admin to get the token
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'system@graphene-security.com',
        password: 'ChangeThisPassword123!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    const token = loginData.data?.token || loginData.token;

    console.log('✓ Admin login successful');
    console.log('  Token received:', token ? 'Yes' : 'No');

    // Now test the export endpoint
    const exportResponse = await fetch('http://localhost:5000/api/admin/products/export/csv', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!exportResponse.ok) {
      throw new Error(`Export failed: ${exportResponse.status}`);
    }

    // Check headers
    const contentType = exportResponse.headers.get('content-type');
    const contentDisposition = exportResponse.headers.get('content-disposition');

    console.log('✓ Export endpoint responded');
    console.log(`  Content-Type: ${contentType}`);
    console.log(`  Content-Disposition: ${contentDisposition}`);

    // Get the CSV content
    const csvContent = await exportResponse.text();
    
    // Basic validation
    const lines = csvContent.split('\n');
    console.log(`\n✓ CSV generated with ${lines.length} lines`);

    // Check if headers are present
    if (lines[0].includes('Product ID') && lines[0].includes('Product Name')) {
      console.log('✓ CSV headers are correct');
    }

    // Show first few lines
    console.log('\nFirst 3 lines of CSV:');
    console.log('------------------------');
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      console.log(lines[i].substring(0, 150) + (lines[i].length > 150 ? '...' : ''));
    }

    console.log('\n✅ Product export test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testProductExport();