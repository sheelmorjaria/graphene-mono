#!/usr/bin/env node

/**
 * Script to test SNS webhook handling for bounces and complaints
 * Run with: node testSNSWebhook.js
 */

import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL || `${process.env.BACKEND_URL}/api/webhook/ses`;

class SNSWebhookTester {
  constructor() {
    this.webhookUrl = WEBHOOK_URL;
  }

  // Generate a mock SNS message with valid structure
  generateMockSNSMessage(type, notification) {
    const timestamp = new Date().toISOString();
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const message = {
      Type: 'Notification',
      MessageId: messageId,
      TopicArn: `arn:aws:sns:us-east-1:123456789:ses-${type}`,
      Subject: `Amazon SES Email ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      Message: JSON.stringify(notification),
      Timestamp: timestamp,
      SignatureVersion: '1',
      Signature: 'mock-signature-for-testing',
      SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-mock.pem',
      UnsubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=mock'
    };
    
    return message;
  }

  // Test bounce notification
  async testBounce(email = 'test@example.com', bounceType = 'Permanent') {
    console.log(`\n📧 Testing ${bounceType} Bounce for: ${email}`);
    
    const notification = {
      notificationType: 'Bounce',
      bounce: {
        bounceType: bounceType,
        bounceSubType: bounceType === 'Permanent' ? 'General' : 'MailboxFull',
        bouncedRecipients: [{
          emailAddress: email,
          action: bounceType === 'Permanent' ? 'failed' : 'delayed',
          status: bounceType === 'Permanent' ? '5.1.1' : '4.2.2',
          diagnosticCode: bounceType === 'Permanent' 
            ? 'smtp; 550 5.1.1 user unknown'
            : 'smtp; 452 4.2.2 mailbox full'
        }],
        timestamp: new Date().toISOString(),
        feedbackId: `feedback-${Date.now()}`,
        reportingMTA: 'dsn; mail.example.com'
      },
      mail: {
        timestamp: new Date().toISOString(),
        source: 'noreply@graphene-security.com',
        sourceArn: 'arn:aws:ses:us-east-1:123456789:identity/graphene-security.com',
        sendingAccountId: '123456789',
        messageId: `ses-message-${Date.now()}`,
        destination: [email],
        headersTruncated: false,
        headers: [
          { name: 'From', value: 'noreply@graphene-security.com' },
          { name: 'To', value: email }
        ]
      }
    };
    
    const snsMessage = this.generateMockSNSMessage('bounces', notification);
    return this.sendWebhook(snsMessage);
  }

  // Test complaint notification
  async testComplaint(email = 'test@example.com', complaintType = 'abuse') {
    console.log(`\n😠 Testing ${complaintType} Complaint for: ${email}`);
    
    const notification = {
      notificationType: 'Complaint',
      complaint: {
        complainedRecipients: [{
          emailAddress: email
        }],
        timestamp: new Date().toISOString(),
        feedbackId: `feedback-${Date.now()}`,
        complaintFeedbackType: complaintType,
        userAgent: 'Gmail',
        complaintSubType: null,
        arrivalDate: new Date().toISOString()
      },
      mail: {
        timestamp: new Date().toISOString(),
        source: 'noreply@graphene-security.com',
        sourceArn: 'arn:aws:ses:us-east-1:123456789:identity/graphene-security.com',
        sendingAccountId: '123456789',
        messageId: `ses-message-${Date.now()}`,
        destination: [email],
        headersTruncated: false,
        headers: [
          { name: 'From', value: 'noreply@graphene-security.com' },
          { name: 'To', value: email }
        ]
      }
    };
    
    const snsMessage = this.generateMockSNSMessage('complaints', notification);
    return this.sendWebhook(snsMessage);
  }

  // Test delivery notification
  async testDelivery(email = 'test@example.com') {
    console.log(`\n✅ Testing Delivery confirmation for: ${email}`);
    
    const notification = {
      notificationType: 'Delivery',
      delivery: {
        timestamp: new Date().toISOString(),
        processingTimeMillis: 1234,
        recipients: [email],
        smtpResponse: '250 2.0.0 OK 1234567890 abcdef.12 - gsmtp',
        reportingMTA: 'smtp.gmail-smtp-in.l.google.com'
      },
      mail: {
        timestamp: new Date().toISOString(),
        source: 'noreply@graphene-security.com',
        sourceArn: 'arn:aws:ses:us-east-1:123456789:identity/graphene-security.com',
        sendingAccountId: '123456789',
        messageId: `ses-message-${Date.now()}`,
        destination: [email],
        headersTruncated: false,
        headers: [
          { name: 'From', value: 'noreply@graphene-security.com' },
          { name: 'To', value: email }
        ]
      }
    };
    
    const snsMessage = this.generateMockSNSMessage('deliveries', notification);
    return this.sendWebhook(snsMessage);
  }

  // Test subscription confirmation
  async testSubscriptionConfirmation() {
    console.log('\n🔔 Testing Subscription Confirmation');
    
    const message = {
      Type: 'SubscriptionConfirmation',
      MessageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      Token: 'mock-subscription-token',
      TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-bounces',
      Message: 'You have chosen to subscribe to this topic.',
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=mock&Token=mock',
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1',
      Signature: 'mock-signature',
      SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-mock.pem'
    };
    
    return this.sendWebhook(message);
  }

  // Send webhook request
  async sendWebhook(message) {
    try {
      console.log(`  → Sending to: ${this.webhookUrl}`);
      
      const response = await axios.post(this.webhookUrl, JSON.stringify(message), {
        headers: {
          'Content-Type': 'text/plain',
          'x-amz-sns-message-type': message.Type,
          'x-amz-sns-message-id': message.MessageId,
          'x-amz-sns-topic-arn': message.TopicArn || '',
          'x-amz-sns-subscription-arn': 'arn:aws:sns:us-east-1:123456789:ses-bounces:mock'
        },
        validateStatus: () => true // Don't throw on non-2xx status
      });
      
      console.log(`  ← Response: ${response.status} ${response.statusText}`);
      if (response.data) {
        console.log('  ← Data:', JSON.stringify(response.data, null, 2));
      }
      
      return response;
    } catch (error) {
      console.error('  ❌ Error:', error.message);
      if (error.response) {
        console.error('  ← Response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 SNS Webhook Test Suite');
    console.log('='.repeat(60));
    console.log(`Webhook URL: ${this.webhookUrl}`);
    console.log('='.repeat(60));
    
    const results = {
      passed: [],
      failed: []
    };
    
    // Test cases
    const tests = [
      { name: 'Subscription Confirmation', fn: () => this.testSubscriptionConfirmation() },
      { name: 'Permanent Bounce', fn: () => this.testBounce('bounce@simulator.amazonses.com', 'Permanent') },
      { name: 'Transient Bounce', fn: () => this.testBounce('bounce@simulator.amazonses.com', 'Transient') },
      { name: 'Abuse Complaint', fn: () => this.testComplaint('complaint@simulator.amazonses.com', 'abuse') },
      { name: 'Not-Spam Complaint', fn: () => this.testComplaint('test@example.com', 'not-spam') },
      { name: 'Successful Delivery', fn: () => this.testDelivery('success@simulator.amazonses.com') }
    ];
    
    // Run tests
    for (const test of tests) {
      try {
        await test.fn();
        results.passed.push(test.name);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
      } catch (error) {
        results.failed.push({ name: test.name, error: error.message });
      }
    }
    
    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    
    if (results.passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      results.passed.forEach(name => console.log(`  ✓ ${name}`));
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.failed.forEach(({ name, error }) => {
        console.log(`  ✗ ${name}`);
        console.log(`    Error: ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${tests.length} | Passed: ${results.passed.length} | Failed: ${results.failed.length}`);
    console.log('='.repeat(60));
    
    // Instructions
    if (results.passed.length === tests.length) {
      console.log('\n🎉 All tests passed! Your webhook is working correctly.');
      console.log('\n📝 Next steps:');
      console.log('  1. Check your database for updated email preferences');
      console.log('  2. Verify EmailMetrics records were created');
      console.log('  3. Test with real SES emails using simulator addresses');
    } else {
      console.log('\n⚠️  Some tests failed. Please check:');
      console.log('  1. Is your webhook server running?');
      console.log('  2. Is the webhook URL correct?');
      console.log('  3. Check server logs for detailed error messages');
      console.log('  4. Verify SKIP_SNS_VERIFICATION=true in development');
    }
  }

  // Interactive menu
  async runInteractive() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    
    console.log('🧪 SNS Webhook Interactive Tester');
    console.log('='.repeat(60));
    console.log(`Webhook URL: ${this.webhookUrl}`);
    console.log('='.repeat(60));
    
    while (true) {
      console.log('\nSelect a test:');
      console.log('  1. Test Subscription Confirmation');
      console.log('  2. Test Permanent Bounce');
      console.log('  3. Test Transient Bounce');
      console.log('  4. Test Complaint (Abuse)');
      console.log('  5. Test Delivery Confirmation');
      console.log('  6. Run All Tests');
      console.log('  0. Exit');
      
      const choice = await question('\nYour choice: ');
      
      try {
        switch (choice) {
        case '1':
          await this.testSubscriptionConfirmation();
          break;
        case '2':
          const email1 = await question('Email address [bounce@simulator.amazonses.com]: ');
          await this.testBounce(email1 || 'bounce@simulator.amazonses.com', 'Permanent');
          break;
        case '3':
          const email2 = await question('Email address [bounce@simulator.amazonses.com]: ');
          await this.testBounce(email2 || 'bounce@simulator.amazonses.com', 'Transient');
          break;
        case '4':
          const email3 = await question('Email address [complaint@simulator.amazonses.com]: ');
          await this.testComplaint(email3 || 'complaint@simulator.amazonses.com', 'abuse');
          break;
        case '5':
          const email4 = await question('Email address [success@simulator.amazonses.com]: ');
          await this.testDelivery(email4 || 'success@simulator.amazonses.com');
          break;
        case '6':
          await this.runAllTests();
          break;
        case '0':
          console.log('Goodbye!');
          rl.close();
          return;
        default:
          console.log('Invalid choice');
        }
      } catch (error) {
        console.error('Test failed:', error.message);
      }
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const tester = new SNSWebhookTester();

if (args.includes('--all') || args.includes('-a')) {
  // Run all tests
  tester.runAllTests().catch(console.error);
} else if (args.includes('--interactive') || args.includes('-i')) {
  // Run interactive mode
  tester.runInteractive().catch(console.error);
} else {
  // Show usage
  console.log('Usage:');
  console.log('  node testSNSWebhook.js --all          Run all tests');
  console.log('  node testSNSWebhook.js --interactive  Interactive mode');
  console.log('  node testSNSWebhook.js -a             Run all tests (short)');
  console.log('  node testSNSWebhook.js -i             Interactive mode (short)');
  console.log('\nDefaulting to all tests...\n');
  tester.runAllTests().catch(console.error);
}