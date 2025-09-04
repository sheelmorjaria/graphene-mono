#!/usr/bin/env node

/**
 * Check if SES is configured with SNS event destinations
 */

import { SESClient, ListConfigurationSetsCommand, DescribeConfigurationSetCommand } from '@aws-sdk/client-ses';
import { fromEnv } from '@aws-sdk/credential-providers';
import dotenv from 'dotenv';

dotenv.config();

class SESConfigurationChecker {
  constructor() {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: fromEnv()
    };
    
    this.sesClient = new SESClient(config);
  }

  async checkConfigurationSets() {
    try {
      console.log('🔍 Checking SES Configuration Sets');
      console.log('=' .repeat(60));

      const listCommand = new ListConfigurationSetsCommand({});
      const listResponse = await this.sesClient.send(listCommand);
      
      const configSets = listResponse.ConfigurationSets || [];
      
      if (configSets.length === 0) {
        console.log('❌ No configuration sets found');
        console.log('\n📝 You need to create a configuration set with event destinations');
        console.log('   Options:');
        console.log('   1. Use AWS Console: SES > Configuration Sets > Create');
        console.log('   2. Run: node setupSNSWebhooks.js (and choose to configure SES)');
        return;
      }

      for (const configSet of configSets) {
        await this.checkConfigurationSet(configSet.Name);
      }

      console.log('\n' + '='.repeat(60));
      console.log('💡 Tips for Email Sending:');
      console.log('- Include ConfigurationSetName in your email params');
      console.log('- Example: ConfigurationSetName: "default"');
      console.log('- This enables bounce/complaint tracking');

    } catch (error) {
      console.error('Error checking SES configuration:', error.message);
    }
  }

  async checkConfigurationSet(name) {
    try {
      console.log(`\n📋 Configuration Set: ${name}`);
      
      const describeCommand = new DescribeConfigurationSetCommand({
        ConfigurationSetName: name
      });
      
      const response = await this.sesClient.send(describeCommand);
      const eventDestinations = response.EventDestinations || [];
      
      if (eventDestinations.length === 0) {
        console.log('    ❌ No event destinations configured');
        return;
      }

      const requiredEvents = ['bounce', 'complaint', 'delivery'];
      const configuredEvents = new Set();

      for (const destination of eventDestinations) {
        console.log(`    📍 Destination: ${destination.Name}`);
        console.log(`       Enabled: ${destination.Enabled ? '✅' : '❌'}`);
        console.log(`       Events: ${destination.MatchingEventTypes.join(', ')}`);
        
        if (destination.SNSDestination) {
          console.log(`       SNS Topic: ${destination.SNSDestination.TopicARN}`);
          destination.MatchingEventTypes.forEach(event => configuredEvents.add(event));
        }
        
        if (destination.CloudWatchDestination) {
          console.log('       CloudWatch: ✅');
        }
      }

      // Check coverage
      const missingEvents = requiredEvents.filter(event => !configuredEvents.has(event));
      
      if (missingEvents.length === 0) {
        console.log('    ✅ All required events (bounce, complaint, delivery) configured');
      } else {
        console.log(`    ⚠️  Missing events: ${missingEvents.join(', ')}`);
      }

    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }

  async run() {
    await this.checkConfigurationSets();
  }
}

const checker = new SESConfigurationChecker();
checker.run().catch(console.error);