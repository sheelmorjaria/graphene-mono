#!/usr/bin/env node

import { sendDataExportEmail, sendAccountDeletionConfirmationEmail, sendAccountDeletionCompletedEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

// Test GDPR email functionality
async function testGDPREmails() {
  console.log('🧪 Testing GDPR Email Templates...\n');

  // Use a verified email address (replace with your verified email)
  const testEmail = 'your-verified-email@gmail.com'; // UPDATE THIS
  const testName = 'Test User';

  try {
    // Test 1: Data Export Email
    console.log('📧 Testing Data Export Email...');
    await sendDataExportEmail(testEmail, testName, {
      downloadUrl: 'https://secure-exports.example.com/download/test123',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    });
    console.log('✅ Data Export Email - SUCCESS\n');

    // Test 2: Account Deletion Confirmation
    console.log('📧 Testing Account Deletion Confirmation...');
    await sendAccountDeletionConfirmationEmail(testEmail, testName, {
      requestId: 'deletion_test_123',
      estimatedCompletion: '7-30 days'
    });
    console.log('✅ Account Deletion Confirmation - SUCCESS\n');

    // Test 3: Account Deletion Completed
    console.log('📧 Testing Account Deletion Completed...');
    await sendAccountDeletionCompletedEmail(testEmail, testName);
    console.log('✅ Account Deletion Completed - SUCCESS\n');

    console.log('🎉 All GDPR email tests passed!');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.message.includes('MessageRejected')) {
      console.log('\n💡 This is likely due to AWS SES sandbox mode.');
      console.log('Solutions:');
      console.log('1. Verify the email address in AWS SES Console');
      console.log('2. Or request production access');
      console.log('3. Or set EMAIL_SERVICE=disabled for tests');
    }
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGDPREmails();
}

export { testGDPREmails };