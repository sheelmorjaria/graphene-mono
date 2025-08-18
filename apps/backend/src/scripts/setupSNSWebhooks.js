#!/usr/bin/env node

/**
 * Script to help set up AWS SNS topics for SES bounce and complaint notifications
 * Run with: node setupSNSWebhooks.js
 */
import { SESClient, CreateConfigurationSetEventDestinationCommand, CreateConfigurationSetCommand } from '@aws-sdk/client-ses';
import { SNSClient, CreateTopicCommand, SubscribeCommand } from '@aws-sdk/client-sns';
import { fromEnv } from '@aws-sdk/credential-providers';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

class SNSWebhookSetup {
  constructor() {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: fromEnv()
    };
    
    this.sesClient = new SESClient(config);
    this.snsClient = new SNSClient(config);
    this.webhookUrl = process.env.WEBHOOK_URL || `${process.env.BACKEND_URL}/api/webhook/ses`;
  }

  async setupTopics() {
    console.log('\n📋 Setting up SNS topics for SES notifications...\n');
    
    try {
      // Create or get existing topics
      const bounceTopicArn = await this.createTopic('ses-bounces');
      const complaintTopicArn = await this.createTopic('ses-complaints');
      const deliveryTopicArn = await this.createTopic('ses-deliveries');
      
      console.log('\n✅ SNS Topics created/verified:');
      console.log(`  - Bounces: ${bounceTopicArn}`);
      console.log(`  - Complaints: ${complaintTopicArn}`);
      console.log(`  - Deliveries: ${deliveryTopicArn}`);
      
      return {
        bounceTopicArn,
        complaintTopicArn,
        deliveryTopicArn
      };
    } catch (error) {
      console.error('❌ Failed to create SNS topics:', error.message);
      throw error;
    }
  }

  async createTopic(name) {
    try {
      const command = new CreateTopicCommand({ Name: name });
      const response = await this.snsClient.send(command);
      return response.TopicArn;
    } catch (error) {
      console.error(`Failed to create topic ${name}:`, error.message);
      throw error;
    }
  }

  async subscribeWebhook(topicArn, webhookUrl) {
    try {
      console.log(`\n🔗 Subscribing webhook to ${topicArn}...`);
      
      const command = new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: 'https',
        Endpoint: webhookUrl,
        Attributes: {
          // Enable raw message delivery for easier parsing
          'RawMessageDelivery': 'false'
        }
      });
      
      const response = await this.snsClient.send(command);
      console.log(`✅ Subscription created: ${response.SubscriptionArn}`);
      
      return response.SubscriptionArn;
    } catch (error) {
      console.error('Failed to subscribe webhook:', error.message);
      throw error;
    }
  }

  async configureSES(configurationSetName, topics) {
    try {
      console.log(`\n⚙️  Configuring SES Configuration Set: ${configurationSetName}`);
      
      // Configure bounce notifications
      await this.addEventDestination(configurationSetName, 'bounce-destination', {
        Enabled: true,
        MatchingEventTypes: ['bounce'],
        SNSDestination: {
          TopicARN: topics.bounceTopicArn
        }
      });
      
      // Configure complaint notifications
      await this.addEventDestination(configurationSetName, 'complaint-destination', {
        Enabled: true,
        MatchingEventTypes: ['complaint'],
        SNSDestination: {
          TopicARN: topics.complaintTopicArn
        }
      });
      
      // Configure delivery notifications (optional)
      await this.addEventDestination(configurationSetName, 'delivery-destination', {
        Enabled: true,
        MatchingEventTypes: ['delivery'],
        SNSDestination: {
          TopicARN: topics.deliveryTopicArn
        }
      });
      
      console.log('✅ SES Configuration Set configured successfully');
    } catch (error) {
      console.error('Failed to configure SES:', error.message);
      throw error;
    }
  }

  async createConfigurationSet(configurationSetName) {
    try {
      const command = new CreateConfigurationSetCommand({
        ConfigurationSet: {
          Name: configurationSetName
        }
      });
      
      await this.sesClient.send(command);
      console.log(`  ✓ Created configuration set: ${configurationSetName}`);
    } catch (error) {
      if (error.name === 'AlreadyExistsException' || error.name === 'ConfigurationSetAlreadyExistsException') {
        console.log(`  ℹ️  Configuration set ${configurationSetName} already exists`);
      } else {
        console.error(`  ❌ Failed to create configuration set:`, error.message);
        throw error;
      }
    }
  }

  async addEventDestination(configurationSetName, destinationName, destination) {
    try {
      const command = new CreateConfigurationSetEventDestinationCommand({
        ConfigurationSetName: configurationSetName,
        EventDestination: {
          Name: destinationName,
          ...destination
        }
      });
      
      await this.sesClient.send(command);
      console.log(`  ✓ Added event destination: ${destinationName}`);
    } catch (error) {
      if (error.name === 'AlreadyExistsException' || error.name === 'EventDestinationAlreadyExistsException') {
        console.log(`  ℹ️  Event destination ${destinationName} already exists`);
      } else if (error.name === 'ConfigurationSetDoesNotExistException') {
        console.log(`  ⚠️  Configuration set ${configurationSetName} does not exist. Creating it...`);
        await this.createConfigurationSet(configurationSetName);
        // Retry adding the event destination
        await this.sesClient.send(command);
        console.log(`  ✓ Added event destination: ${destinationName}`);
      } else {
        console.error(`  ❌ Failed to add event destination ${destinationName}:`, error.message);
        throw error;
      }
    }
  }

  printInstructions(topics, webhookUrl) {
    console.log('\n' + '='.repeat(60));
    console.log('📝 SETUP COMPLETE - NEXT STEPS');
    console.log('='.repeat(60));
    
    console.log('\n1. VERIFY WEBHOOK SUBSCRIPTION:');
    console.log('   AWS will send a confirmation request to your webhook URL.');
    console.log(`   Check your logs for: ${webhookUrl}`);
    console.log('   The webhook will automatically confirm the subscription.');
    
    console.log('\n2. ADD TO ENVIRONMENT VARIABLES:');
    console.log('   Add these to your .env file:\n');
    console.log(`   SNS_BOUNCE_TOPIC_ARN=${topics.bounceTopicArn}`);
    console.log(`   SNS_COMPLAINT_TOPIC_ARN=${topics.complaintTopicArn}`);
    console.log(`   SNS_DELIVERY_TOPIC_ARN=${topics.deliveryTopicArn}`);
    console.log(`   WEBHOOK_URL=${webhookUrl}`);
    
    console.log('\n3. CONFIGURE EMAIL SENDING:');
    console.log('   When sending emails via SES, include the Configuration Set:');
    console.log('   ConfigurationSetName: "your-configuration-set-name"');
    
    console.log('\n4. TEST THE SETUP:');
    console.log('   Run: node testSNSWebhook.js');
    
    console.log('\n5. MONITOR LOGS:');
    console.log('   Watch your application logs for bounce/complaint notifications');
    
    console.log('\n' + '='.repeat(60));
  }

  async run() {
    try {
      console.log('🚀 AWS SNS Webhook Setup for SES Notifications');
      console.log('='.repeat(60));
      
      // Get configuration
      const useDefaults = await question('\nUse default settings? (y/n): ');
      
      let webhookUrl = this.webhookUrl;
      let configSetName = 'default';
      
      if (useDefaults.toLowerCase() !== 'y') {
        webhookUrl = await question(`Webhook URL [${this.webhookUrl}]: `) || this.webhookUrl;
        configSetName = await question('SES Configuration Set Name [default]: ') || 'default';
      }
      
      this.webhookUrl = webhookUrl;
      
      // Setup topics
      const topics = await this.setupTopics();
      
      // Subscribe webhook to topics
      console.log('\n📨 Setting up webhook subscriptions...');
      await this.subscribeWebhook(topics.bounceTopicArn, webhookUrl);
      await this.subscribeWebhook(topics.complaintTopicArn, webhookUrl);
      await this.subscribeWebhook(topics.deliveryTopicArn, webhookUrl);
      
      // Configure SES
      const configureSES = await question('\nConfigure SES Configuration Set? (y/n): ');
      if (configureSES.toLowerCase() === 'y') {
        await this.configureSES(configSetName, topics);
      }
      
      // Print instructions
      this.printInstructions(topics, webhookUrl);
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.error('\nPlease check your AWS credentials and permissions.');
    } finally {
      rl.close();
    }
  }
}

// Run the setup
const setup = new SNSWebhookSetup();
setup.run().catch(console.error);