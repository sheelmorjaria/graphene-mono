import dotenv from 'dotenv';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { fromEnv } from '@aws-sdk/credential-providers';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const testActualEmailSend = async () => {
  console.log(`${colors.blue}🧪 Testing Actual Email Send via AWS SES${colors.reset}\n`);

  try {
    // Initialize SES Client
    console.log('1. Initializing AWS SES Client...');
    const sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: fromEnv()
    });
    console.log(`   ${colors.green}✓ SES Client initialized${colors.reset}`);

    // Test credentials
    console.log('2. Testing credentials...');
    const credentials = await sesClient.config.credentials();
    console.log(`   ${colors.green}✓ Credentials valid - Access Key: ${credentials.accessKeyId}${colors.reset}`);

    // Prepare test email
    console.log('3. Preparing test email...');
    const params = {
      Source: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      Destination: {
        ToAddresses: [process.env.SUPPORT_EMAIL] // Send to ourselves for testing
      },
      Message: {
        Subject: {
          Data: 'Test Email from Backend - AWS SES Verification',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <title>Test Email</title>
              </head>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">AWS SES Test Email</h2>
                <p>This is a test email sent directly via AWS SES to verify the configuration.</p>
                <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>Test Details:</h3>
                  <ul>
                    <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                    <li><strong>Region:</strong> ${process.env.AWS_REGION}</li>
                    <li><strong>From Email:</strong> ${process.env.FROM_EMAIL}</li>
                    <li><strong>To Email:</strong> ${process.env.SUPPORT_EMAIL}</li>
                  </ul>
                </div>
                <p>If you receive this email, the AWS SES configuration is working correctly! 🎉</p>
                <hr style="margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">
                  This email was sent from the GrapheneOS Store backend test script.
                </p>
              </body>
              </html>
            `,
            Charset: 'UTF-8'
          },
          Text: {
            Data: `AWS SES Test Email

This is a test email sent directly via AWS SES to verify the configuration.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Region: ${process.env.AWS_REGION}
- From Email: ${process.env.FROM_EMAIL}
- To Email: ${process.env.SUPPORT_EMAIL}

If you receive this email, the AWS SES configuration is working correctly!

---
This email was sent from the GrapheneOS Store backend test script.`,
            Charset: 'UTF-8'
          }
        }
      }
    };

    console.log(`   ${colors.green}✓ Email prepared${colors.reset}`);
    console.log(`     From: ${params.Source}`);
    console.log(`     To: ${params.Destination.ToAddresses[0]}`);
    console.log(`     Subject: ${params.Message.Subject.Data}`);

    // Send the email
    console.log('4. Sending email via AWS SES...');
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    console.log(`\n${colors.green}✅ Email sent successfully!${colors.reset}`);
    console.log(`   Message ID: ${result.MessageId}`);
    console.log(`   Request ID: ${result.$metadata.requestId}`);
    console.log(`   HTTP Status: ${result.$metadata.httpStatusCode}`);

    console.log(`\n${colors.cyan}📧 Check your email at ${process.env.SUPPORT_EMAIL}${colors.reset}`);
    console.log('   The test email should arrive within a few minutes.');

  } catch (error) {
    console.error(`\n${colors.red}❌ Email send failed:${colors.reset}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    console.error(`   Error Name: ${error.name || 'N/A'}`);
    
    // Provide specific guidance based on error
    if (error.message.includes('The security token included in the request is invalid')) {
      console.log(`\n${colors.yellow}💡 Diagnosis: Invalid AWS credentials${colors.reset}`);
      console.log('   • Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
      console.log('   • Ensure the IAM user has SES permissions');
    } else if (error.message.includes('Email address not verified')) {
      console.log(`\n${colors.yellow}💡 Diagnosis: Email address not verified${colors.reset}`);
      console.log('   • Verify the sender email in AWS SES console');
      console.log('   • Check if AWS SES is in sandbox mode');
    } else if (error.message.includes('MessageRejected')) {
      console.log(`\n${colors.yellow}💡 Diagnosis: Message rejected by SES${colors.reset}`);
      console.log('   • Check sender and recipient email verification');
      console.log('   • Verify AWS SES configuration');
    }
  }
};

// Run the test
testActualEmailSend()
  .then(() => {
    console.log(`\n${colors.green}✅ Test completed${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}💥 Test failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });