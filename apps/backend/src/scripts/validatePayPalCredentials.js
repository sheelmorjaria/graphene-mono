import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const validatePayPalCredentials = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = process.env.NODE_ENV || 'development';
  
  console.log('\n🔍 PayPal Credentials Validation\n');
  console.log('Environment:', environment);
  console.log('Client ID:', clientId ? `${clientId.substring(0, 10)}...` : '❌ NOT SET');
  console.log('Client Secret:', clientSecret ? '✅ SET' : '❌ NOT SET');
  
  if (!clientId || !clientSecret) {
    console.error('\n❌ PayPal credentials are not configured properly.');
    console.log('\nPlease ensure the following environment variables are set:');
    console.log('- PAYPAL_CLIENT_ID');
    console.log('- PAYPAL_CLIENT_SECRET');
    process.exit(1);
  }

  const baseURL = environment === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  console.log('API Endpoint:', baseURL);
  console.log('\nAttempting to authenticate with PayPal...\n');

  try {
    // Attempt to get an access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post(
      `${baseURL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data.access_token) {
      console.log('✅ Successfully authenticated with PayPal!');
      console.log('\nToken Details:');
      console.log('- Token Type:', response.data.token_type);
      console.log('- Expires In:', response.data.expires_in, 'seconds');
      console.log('- Scope:', response.data.scope || 'Default scope');
      console.log('- App ID:', response.data.app_id || 'N/A');
      
      // Try to fetch account info to verify the token works
      console.log('\nVerifying token by fetching account info...');
      try {
        const accountResponse = await axios.get(
          `${baseURL}/v1/identity/oauth2/userinfo?schema=paypalv1.1`,
          {
            headers: {
              'Authorization': `Bearer ${response.data.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ Token verified - Account access confirmed');
      } catch (infoError) {
        // This might fail for client credentials, which is normal
        console.log('ℹ️  Note: User info endpoint not accessible with client credentials (this is normal)');
      }
      
      console.log('\n✅ PayPal credentials are valid and working correctly!');
      console.log('\nYou can now:');
      console.log('1. Create payment orders');
      console.log('2. Capture payments');
      console.log('3. Process refunds');
      console.log('4. Handle webhooks');
      
    } else {
      console.error('❌ Unexpected response from PayPal');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.error('\n❌ Failed to validate PayPal credentials\n');
    
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Message:', error.response.data.error_description || error.response.data.error);
      
      if (error.response.status === 401) {
        console.log('\nPossible causes:');
        console.log('1. Invalid Client ID or Client Secret');
        console.log('2. Credentials for wrong environment (sandbox vs production)');
        console.log('3. App not properly configured in PayPal dashboard');
      }
    } else if (error.request) {
      console.error('Network Error: Could not reach PayPal API');
      console.log('Please check your internet connection');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
};

// Run the validation
validatePayPalCredentials();