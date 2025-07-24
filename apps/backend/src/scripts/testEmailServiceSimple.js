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

console.log(`${colors.bright}${colors.blue}=== Mailtrap Email Integration Test ===${colors.reset}\n`);

// Check current configuration
console.log(`${colors.yellow}Current Configuration:${colors.reset}`);
console.log(`EMAIL_SERVICE: ${colors.cyan}${process.env.EMAIL_SERVICE || 'Not set'}${colors.reset}`);
console.log(`MAILTRAP_HOST: ${colors.cyan}${process.env.MAILTRAP_HOST || 'Not set'}${colors.reset}`);
console.log(`MAILTRAP_PORT: ${colors.cyan}${process.env.MAILTRAP_PORT || 'Not set'}${colors.reset}`);
console.log(`MAILTRAP_USER: ${colors.cyan}${process.env.MAILTRAP_USER?.substring(0, 5)}...${process.env.MAILTRAP_USER ? ' (set)' : ' Not set'}${colors.reset}`);
console.log(`MAILTRAP_PASSWORD: ${colors.cyan}${process.env.MAILTRAP_PASSWORD ? '****** (set)' : 'Not set'}${colors.reset}`);
console.log(`FROM_EMAIL: ${colors.cyan}${process.env.FROM_EMAIL || 'Not set'}${colors.reset}`);
console.log(`FROM_NAME: ${colors.cyan}${process.env.FROM_NAME || 'Not set'}${colors.reset}\n`);

// Test connection
console.log(`${colors.yellow}Testing Email Service Connection...${colors.reset}`);
const connectionResult = await emailService.verifyConnection();

if (connectionResult.success) {
  console.log(`${colors.green}✓ Email service connected successfully!${colors.reset}`);
  console.log(`${colors.green}  Mailtrap is ready to receive emails.${colors.reset}\n`);
} else {
  console.log(`${colors.red}✗ Email service connection failed${colors.reset}`);
  console.log(`${colors.red}  Error: ${connectionResult.error}${colors.reset}\n`);
  
  if (process.env.EMAIL_SERVICE !== 'mailtrap') {
    console.log(`${colors.magenta}📌 To enable Mailtrap:${colors.reset}`);
    console.log('   1. Ensure EMAIL_SERVICE=mailtrap in your .env file');
    console.log('   2. Add your Mailtrap SMTP credentials\n');
  } else if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASSWORD) {
    console.log(`${colors.magenta}📌 To fix this:${colors.reset}`);
    console.log('   1. Log in to https://mailtrap.io');
    console.log('   2. Go to Email Testing → Inboxes → My Inbox');
    console.log('   3. Click "Show Credentials" to get your SMTP settings');
    console.log('   4. Update MAILTRAP_USER and MAILTRAP_PASSWORD in .env\n');
  }
}

// Send a test email regardless of connection status
console.log(`${colors.yellow}Sending a test email...${colors.reset}`);
const testResult = await emailService.sendEmail({
  to: process.env.TEST_EMAIL || 'test@example.com',
  subject: 'Mailtrap Integration Test - Graphene Security',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #667eea;">Mailtrap Integration Test</h1>
      <p>This is a test email from the Graphene Security backend.</p>
      <p>If you're seeing this in Mailtrap, the integration is working correctly! 🎉</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 14px;">
        Sent on: ${new Date().toLocaleString()}<br>
        Environment: ${process.env.NODE_ENV || 'development'}
      </p>
    </div>
  `,
  textContent: 'Mailtrap Integration Test\n\nThis is a test email from the Graphene Security backend.'
});

if (testResult.success) {
  console.log(`${colors.green}✓ Test email sent successfully!${colors.reset}`);
  if (testResult.messageId) {
    console.log(`${colors.cyan}  Message ID: ${testResult.messageId}${colors.reset}`);
  }
  if (testResult.messageId?.startsWith('mock_')) {
    console.log(`${colors.yellow}  Note: Email was logged in mock mode (not actually sent)${colors.reset}`);
  } else {
    console.log(`${colors.green}  Check your Mailtrap inbox at: https://mailtrap.io${colors.reset}`);
  }
} else {
  console.log(`${colors.red}✗ Failed to send test email${colors.reset}`);
  console.log(`${colors.red}  Error: ${testResult.error}${colors.reset}`);
}

console.log(`\n${colors.bright}${colors.blue}=== Test Complete ===${colors.reset}\n`);

// Show next steps
if (!connectionResult.success || testResult.messageId?.startsWith('mock_')) {
  console.log(`${colors.yellow}Next Steps:${colors.reset}`);
  console.log('1. Set up Mailtrap credentials in your .env file');
  console.log(`2. Run ${colors.cyan}npm run test:email${colors.reset} to test all email templates`);
  console.log('3. Check the emails in your Mailtrap inbox\n');
  console.log(`For detailed instructions, see: ${colors.cyan}backend/MAILTRAP_SETUP.md${colors.reset}\n`);
} else {
  console.log(`${colors.green}✅ Mailtrap integration is working!${colors.reset}`);
  console.log(`Run ${colors.cyan}npm run test:email${colors.reset} to test all email templates.\n`);
}

process.exit(0);