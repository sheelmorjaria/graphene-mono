import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Import email service after env is loaded
import emailService from '../services/emailService.js';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.blue}=== AWS SES Email Integration Test ===${colors.reset}\n`);

// Check current configuration
console.log(`${colors.yellow}Current Configuration:${colors.reset}`);
console.log(`EMAIL_SERVICE: ${colors.cyan}${process.env.EMAIL_SERVICE || 'Not set'}${colors.reset}`);
console.log(`AWS_REGION: ${colors.cyan}${process.env.AWS_REGION || 'Not set'}${colors.reset}`);
console.log(`AWS_ACCESS_KEY_ID: ${colors.cyan}${process.env.AWS_ACCESS_KEY_ID?.substring(0, 5)}...${process.env.AWS_ACCESS_KEY_ID ? ' (set)' : ' Not set'}${colors.reset}`);
console.log(`AWS_SECRET_ACCESS_KEY: ${colors.cyan}${process.env.AWS_SECRET_ACCESS_KEY ? '****** (set)' : 'Not set'}${colors.reset}`);
console.log(`FROM_EMAIL: ${colors.cyan}${process.env.FROM_EMAIL || 'Not set'}${colors.reset}`);
console.log(`FROM_NAME: ${colors.cyan}${process.env.FROM_NAME || 'Not set'}${colors.reset}\n`);

// Test connection
console.log(`${colors.yellow}Testing AWS SES Connection...${colors.reset}`);
const connectionResult = await emailService.verifyConnection();

if (connectionResult.success) {
  console.log(`${colors.green}✓ AWS SES connected successfully!${colors.reset}`);
  console.log(`${colors.green}  SES is ready to send emails.${colors.reset}\n`);
} else {
  console.log(`${colors.red}✗ AWS SES connection failed${colors.reset}`);
  console.log(`${colors.red}  Error: ${connectionResult.error}${colors.reset}\n`);
  
  if (process.env.EMAIL_SERVICE !== 'ses') {
    console.log(`${colors.magenta}📌 To enable AWS SES:${colors.reset}`);
    console.log('   1. Ensure EMAIL_SERVICE=ses in your .env file');
    console.log('   2. Add your AWS credentials\n');
  } else if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log(`${colors.magenta}📌 To fix this:${colors.reset}`);
    console.log('   1. Create an IAM user with SES permissions in AWS Console');
    console.log('   2. Generate access keys for the IAM user');
    console.log('   3. Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    console.log('   4. Verify your sender email in AWS SES console\n');
  }
}

// Send a test email regardless of connection status
console.log(`${colors.yellow}Sending a test email...${colors.reset}`);
const testResult = await emailService.sendEmail({
  to: process.env.TEST_EMAIL || 'test@example.com',
  subject: 'AWS SES Integration Test - GrapheneOS Store',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #667eea;">AWS SES Integration Test</h1>
      <p>This is a test email from the GrapheneOS Store backend using AWS SES.</p>
      <p>If you're receiving this email, the AWS SES integration is working correctly! 🎉</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 14px;">
        Sent on: ${new Date().toLocaleString()}<br>
        Environment: ${process.env.NODE_ENV || 'development'}<br>
        Region: ${process.env.AWS_REGION || 'us-east-1'}
      </p>
    </div>
  `,
  textContent: 'AWS SES Integration Test\n\nThis is a test email from the GrapheneOS Store backend using AWS SES.'
});

if (testResult.success) {
  console.log(`${colors.green}✓ Test email sent successfully!${colors.reset}`);
  if (testResult.messageId) {
    console.log(`${colors.cyan}  Message ID: ${testResult.messageId}${colors.reset}`);
  }
  if (testResult.messageId?.startsWith('mock_')) {
    console.log(`${colors.yellow}  Note: Email was logged in mock mode (not actually sent)${colors.reset}`);
  } else {
    console.log(`${colors.green}  Check the recipient's inbox for the test email${colors.reset}`);
    console.log(`${colors.cyan}  AWS SES Message ID: ${testResult.messageId}${colors.reset}`);
  }
} else {
  console.log(`${colors.red}✗ Failed to send test email${colors.reset}`);
  console.log(`${colors.red}  Error: ${testResult.error}${colors.reset}`);
}

console.log(`\n${colors.bright}${colors.blue}=== Test Complete ===${colors.reset}\n`);

// Show next steps
if (!connectionResult.success || testResult.messageId?.startsWith('mock_')) {
  console.log(`${colors.yellow}Next Steps:${colors.reset}`);
  console.log('1. Set up AWS SES credentials in your .env file');
  console.log('2. Verify your sender email address in AWS SES console');
  console.log('3. If in sandbox mode, verify recipient emails too');
  console.log(`4. Run ${colors.cyan}npm run test:email${colors.reset} to test all email templates`);
  console.log('5. Request production access to remove sandbox restrictions\n');
  console.log(`For detailed instructions, see: ${colors.cyan}backend/AWS_SES_SETUP.md${colors.reset}\n`);
} else {
  console.log(`${colors.green}✅ AWS SES integration is working!${colors.reset}`);
  console.log(`Run ${colors.cyan}npm run test:email${colors.reset} to test all email templates.\n`);
  
  console.log(`${colors.yellow}Important AWS SES Notes:${colors.reset}`);
  console.log('- If in sandbox mode, you can only send to verified emails');
  console.log('- Request production access to send to any email address');
  console.log('- Monitor your sending quota in AWS Console');
  console.log('- Set up SNS notifications for bounces and complaints\n');
}

process.exit(0);