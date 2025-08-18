#!/usr/bin/env node

/**
 * Check SNS subscription status for webhook endpoints
 */

import { SNSClient, ListSubscriptionsByTopicCommand, GetSubscriptionAttributesCommand } from '@aws-sdk/client-sns';
import { fromEnv } from '@aws-sdk/credential-providers';
import dotenv from 'dotenv';

dotenv.config();

class SNSSubscriptionChecker {
  constructor() {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: fromEnv()
    };
    
    this.snsClient = new SNSClient(config);
  }

  async checkSubscriptions() {
    const topics = [
      'arn:aws:sns:us-east-1:650104468521:ses-bounces',
      'arn:aws:sns:us-east-1:650104468521:ses-complaints',
      'arn:aws:sns:us-east-1:650104468521:ses-deliveries'
    ];

    console.log('🔍 Checking SNS Subscription Status');
    console.log('=' .repeat(60));

    for (const topicArn of topics) {
      await this.checkTopicSubscriptions(topicArn);
    }
  }

  async checkTopicSubscriptions(topicArn) {
    try {
      const topicName = topicArn.split(':').pop();
      console.log(`\n📋 Topic: ${topicName}`);
      console.log(`    ARN: ${topicArn}`);

      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: topicArn
      });

      const response = await this.snsClient.send(command);
      const subscriptions = response.Subscriptions || [];

      if (subscriptions.length === 0) {
        console.log('    ❌ No subscriptions found');
        return;
      }

      for (const subscription of subscriptions) {
        const status = subscription.SubscriptionArn === 'PendingConfirmation' 
          ? '⏳ Pending Confirmation'
          : '✅ Confirmed';
        
        console.log(`    ${status}`);
        console.log(`       Protocol: ${subscription.Protocol}`);
        console.log(`       Endpoint: ${subscription.Endpoint}`);
        
        if (subscription.SubscriptionArn !== 'PendingConfirmation') {
          console.log(`       Subscription ARN: ${subscription.SubscriptionArn}`);
        }
      }

    } catch (error) {
      console.error(`    ❌ Error checking topic: ${error.message}`);
    }
  }

  async run() {
    try {
      await this.checkSubscriptions();
      
      console.log('\n' + '='.repeat(60));
      console.log('📝 Next Actions:');
      console.log('- If subscriptions are "Pending Confirmation":');
      console.log('  1. Start your server: npm start');
      console.log('  2. Check server logs for confirmation messages');
      console.log('  3. Webhook will auto-confirm when it receives confirmation request');
      console.log('- If subscriptions are "Confirmed":');
      console.log('  ✅ Ready to receive bounce/complaint notifications!');
      
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

const checker = new SNSSubscriptionChecker();
checker.run().catch(console.error);