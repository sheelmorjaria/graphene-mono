import dotenv from 'dotenv';
import emailService from '../services/emailService.js';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const diagnoseEmailIssue = async () => {
  console.log(`${colors.blue}🔍 Email Service Diagnostic Report${colors.reset}\n`);

  console.log('📋 Environment Variables Check:');
  console.log('─'.repeat(50));
  
  const requiredEnvVars = [
    'EMAIL_SERVICE',
    'AWS_REGION', 
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'FROM_EMAIL',
    'FROM_NAME',
    'SUPPORT_EMAIL'
  ];

  const envStatus = {};
  let allConfigured = true;

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    const isSet = !!value && value !== 'your-aws-access-key' && value !== 'your-domain.com';
    
    envStatus[envVar] = {
      isSet,
      value: isSet ? (envVar.includes('SECRET') ? '***HIDDEN***' : value) : 'NOT SET'
    };

    if (!isSet) allConfigured = false;

    const status = isSet ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`   ${status} ${envVar}: ${envStatus[envVar].value}`);
  }

  console.log('\n📊 Configuration Analysis:');
  console.log('─'.repeat(50));

  if (!envStatus.EMAIL_SERVICE.isSet || process.env.EMAIL_SERVICE !== 'ses') {
    console.log(`${colors.red}❌ EMAIL_SERVICE must be set to 'ses' for production${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ EMAIL_SERVICE correctly set to 'ses'${colors.reset}`);
  }

  if (!envStatus.AWS_ACCESS_KEY_ID.isSet) {
    console.log(`${colors.red}❌ AWS_ACCESS_KEY_ID not configured${colors.reset}`);
  }

  if (!envStatus.AWS_SECRET_ACCESS_KEY.isSet) {
    console.log(`${colors.red}❌ AWS_SECRET_ACCESS_KEY not configured${colors.reset}`);
  }

  if (!envStatus.SUPPORT_EMAIL.isSet) {
    console.log(`${colors.red}❌ SUPPORT_EMAIL not configured - contact form emails won't be delivered${colors.reset}`);
  }

  console.log('\n🧪 Email Service Test:');
  console.log('─'.repeat(50));

  try {
    // Test email service initialization
    console.log('1. Testing email service initialization...');
    if (emailService.isEnabled) {
      console.log(`   ${colors.green}✓ Email service initialized successfully${colors.reset}`);
    } else {
      console.log(`   ${colors.yellow}⚠ Email service not enabled (mock mode)${colors.reset}`);
    }

    // Test connection (if in SES mode)
    if (process.env.EMAIL_SERVICE === 'ses' && emailService.isEnabled) {
      console.log('2. Testing AWS SES connection...');
      try {
        const connectionTest = await emailService.verifyConnection();
        if (connectionTest.success) {
          console.log(`   ${colors.green}✓ AWS SES connection successful${colors.reset}`);
        } else {
          console.log(`   ${colors.red}✗ AWS SES connection failed: ${connectionTest.error}${colors.reset}`);
        }
      } catch (error) {
        console.log(`   ${colors.red}✗ AWS SES connection error: ${error.message}${colors.reset}`);
      }
    }

  } catch (error) {
    console.log(`   ${colors.red}✗ Email service test failed: ${error.message}${colors.reset}`);
  }

  console.log('\n📝 Recommendations:');
  console.log('─'.repeat(50));

  if (!allConfigured) {
    console.log(`${colors.yellow}⚠ To fix email delivery, configure these environment variables in Render:${colors.reset}`);
    console.log('\n   Required Environment Variables for Render:');
    
    if (!envStatus.EMAIL_SERVICE.isSet) {
      console.log('   • EMAIL_SERVICE=ses');
    }
    if (!envStatus.AWS_REGION.isSet) {
      console.log('   • AWS_REGION=us-east-1 (or your preferred region)');
    }
    if (!envStatus.AWS_ACCESS_KEY_ID.isSet) {
      console.log('   • AWS_ACCESS_KEY_ID=<your-aws-access-key>');
    }
    if (!envStatus.AWS_SECRET_ACCESS_KEY.isSet) {
      console.log('   • AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>');
    }
    if (!envStatus.FROM_EMAIL.isSet) {
      console.log('   • FROM_EMAIL=noreply@graphene-security.com (must be verified in AWS SES)');
    }
    if (!envStatus.FROM_NAME.isSet) {
      console.log('   • FROM_NAME=Graphene Security');
    }
    if (!envStatus.SUPPORT_EMAIL.isSet) {
      console.log('   • SUPPORT_EMAIL=support@graphene-security.com (where contact forms are sent)');
    }

    console.log(`\n${colors.cyan}📖 Steps to configure AWS SES:${colors.reset}`);
    console.log('   1. Create AWS IAM user with SES permissions');
    console.log('   2. Generate Access Key ID and Secret Access Key');
    console.log('   3. Verify your sending domain/email in AWS SES');
    console.log('   4. If in SES sandbox, verify recipient emails too');
    console.log('   5. Add environment variables to Render deployment');
    
  } else {
    console.log(`${colors.green}✓ All environment variables are configured${colors.reset}`);
    console.log(`${colors.yellow}💡 If emails still aren't being delivered, check:${colors.reset}`);
    console.log('   • AWS SES verification status of sender and domain');
    console.log('   • AWS SES sandbox mode (may need to request production access)');
    console.log('   • AWS SES sending quotas and rate limits');
    console.log('   • Recipient email spam/junk folders');
  }

  console.log(`\n${colors.blue}🔗 Useful Resources:${colors.reset}`);
  console.log('   • AWS SES Setup: https://docs.aws.amazon.com/ses/latest/dg/setting-up.html');
  console.log('   • Render Environment Variables: https://render.com/docs/environment-variables');
  console.log('   • AWS SES Sandbox: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html');
};

// Run the diagnostic
diagnoseEmailIssue()
  .then(() => {
    console.log(`\n${colors.green}✅ Email diagnostic completed${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 Diagnostic failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });