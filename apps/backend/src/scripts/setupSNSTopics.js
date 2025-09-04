#!/usr/bin/env node

/**
 * Simplified script to set up SNS topics for SES notifications
 * Run with: node setupSNSTopics.js
 */

import { SNSClient, CreateTopicCommand, SubscribeCommand, GetTopicAttributesCommand, ListTopicsCommand } from '@aws-sdk/client-sns';
import { fromEnv } from '@aws-sdk/credential-providers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class SimpleSNSSetup {
  constructor() {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: fromEnv()
    };
    
    this.snsClient = new SNSClient(config);
    this.webhookUrl = process.env.WEBHOOK_URL || `${process.env.BACKEND_URL}/api/webhook/ses`;
  }

  async createTopic(name) {
    try {
      console.log(`Creating/finding SNS topic: ${name}...`);
      
      // Try to create topic first
      const command = new CreateTopicCommand({ Name: name });
      const response = await this.snsClient.send(command);
      console.log(`✅ Topic ready: ${response.TopicArn}`);
      return response.TopicArn;
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('different attributes')) {
        console.log(`ℹ️  Topic ${name} already exists, finding ARN...`);
        // Topic exists, find it in the list
        try {
          const listCommand = new ListTopicsCommand({});
          const listResponse = await this.snsClient.send(listCommand);
          const existingTopic = listResponse.Topics.find(topic => 
            topic.TopicArn.endsWith(`:${name}`)
          );
          
          if (existingTopic) {
            console.log(`✅ Topic found: ${existingTopic.TopicArn}`);
            return existingTopic.TopicArn;
          } else {
            throw new Error(`Topic ${name} not found in list`);
          }
        } catch (innerError) {
          console.error(`❌ Failed to find existing topic ${name}:`, innerError.message);
          throw innerError;
        }
      } else {
        console.error(`❌ Failed to create topic ${name}:`, error.message);
        throw error;
      }
    }
  }

  async subscribeTopic(topicArn, endpoint) {
    try {
      console.log(`Subscribing ${endpoint} to ${topicArn}...`);
      const command = new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'https',
        Endpoint: endpoint
      });
      const response = await this.snsClient.send(command);
      console.log(`✅ Subscription created: ${response.SubscriptionArn}`);
      return response.SubscriptionArn;
    } catch (error) {
      console.error('❌ Failed to subscribe to topic:', error.message);
      throw error;
    }
  }

  async run() {
    try {
      console.log('🚀 Setting up SNS Topics for SES Notifications');
      console.log('='.repeat(60));
      console.log(`Webhook URL: ${this.webhookUrl}`);
      console.log('='.repeat(60));

      // Create topics
      const bounceTopicArn = await this.createTopic('ses-bounces');
      const complaintTopicArn = await this.createTopic('ses-complaints');
      const deliveryTopicArn = await this.createTopic('ses-deliveries');

      console.log('\n📧 Subscribing webhook to topics...');
      
      // Subscribe webhook
      await this.subscribeTopic(bounceTopicArn, this.webhookUrl);
      await this.subscribeTopic(complaintTopicArn, this.webhookUrl);
      await this.subscribeTopic(deliveryTopicArn, this.webhookUrl);

      // Print results
      console.log('\n✅ Setup Complete!');
      console.log('='.repeat(60));
      console.log('\n📋 Add these to your .env file:');
      console.log(`SNS_BOUNCE_TOPIC_ARN=${bounceTopicArn}`);
      console.log(`SNS_COMPLAINT_TOPIC_ARN=${complaintTopicArn}`);
      console.log(`SNS_DELIVERY_TOPIC_ARN=${deliveryTopicArn}`);
      
      console.log('\n📝 Next Steps:');
      console.log('1. Confirm webhook subscriptions (check your logs)');
      console.log('2. Configure SES to use these SNS topics manually in AWS Console');
      console.log('3. Test with: node testSNSWebhook.js --all');
      
      console.log('\n🔗 Manual SES Configuration:');
      console.log('Go to AWS SES Console > Configuration Sets > Create/Edit');
      console.log('Add Event Destinations:');
      console.log(`  - Bounce events → ${bounceTopicArn}`);
      console.log(`  - Complaint events → ${complaintTopicArn}`);
      console.log(`  - Delivery events → ${deliveryTopicArn}`);

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.error('Please check your AWS credentials and permissions.');
    }
  }
}

// Run the setup
const setup = new SimpleSNSSetup();
setup.run().catch(console.error);