// Quick script to check environment variables
console.log('🔍 Environment Variables Check:');
console.log('==============================');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);
console.log('All import.meta.env:', import.meta.env);

// Check what the services are using
import { getUserAddresses } from '../services/addressService.js';

console.log('\n🔍 Service URL Check:');
console.log('====================');

// Test a simple fetch to see what URL it actually calls
const testFetch = async () => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    console.log('AddressService API_BASE_URL:', API_BASE_URL);
    
    const testUrl = `${API_BASE_URL}/user/addresses`;
    console.log('Test URL would be:', testUrl);
    
    // Just try to see what happens without auth token
    const response = await fetch(testUrl);
    console.log('Response URL:', response.url);
    console.log('Response Status:', response.status);
    console.log('Response Content-Type:', response.headers.get('content-type'));
    
  } catch (error) {
    console.error('Test fetch error:', error);
  }
};

testFetch();