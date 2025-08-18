#!/usr/bin/env node

/**
 * Add SNS event destinations to existing SES configuration set
 */

import { SESClient, CreateConfigurationSetEventDestinationCommand } from '@aws-sdk/client-ses';
import { fromEnv } from '@aws-sdk/credential-providers';
import dotenv from 'dotenv';

dotenv.config();

class SESEventDestinationConfigurator {
  constructor() {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: fromEnv()
    };
    
    this.sesClient = new SESClient(config);
  }

  async addEventDestinations(configurationSetName = 'production-emails') {
    const eventDestinations = [
      {
        name: 'bounce-destination',
        eventTypes: ['bounce'],
        topicArn: 'arn:aws:sns:us-east-1:650104468521:ses-bounces'
      },
      {
        name: 'complaint-destination', 
        eventTypes: ['complaint'],
        topicArn: 'arn:aws:sns:us-east-1:650104468521:ses-complaints'
      },
      {
        name: 'delivery-destination',
        eventTypes: ['delivery'],
        topicArn: 'arn:aws:sns:us-east-1:650104468521:ses-deliveries'
      }
    ];

    console.log(`🔧 Configuring SES Event Destinations for: ${configurationSetName}`);
    console.log('=' .repeat(70));

    for (const destination of eventDestinations) {
      await this.addEventDestination(configurationSetName, destination);
    }

    console.log('\n✅ Configuration Complete!');
    console.log('=' .repeat(70));
    console.log('\n📧 When sending emails, use:');
    console.log(`   ConfigurationSetName: "${configurationSetName}"`);
    console.log('\nThis will enable automatic bounce/complaint tracking.');
  }

  async addEventDestination(configurationSetName, { name, eventTypes, topicArn }) {
    try {
      console.log(`\n📍 Adding ${name}...`);
      console.log(`   Events: ${eventTypes.join(', ')}`);
      console.log(`   SNS Topic: ${topicArn}`);

      const command = new CreateConfigurationSetEventDestinationCommand({
        ConfigurationSetName: configurationSetName,
        EventDestination: {
          Name: name,
          Enabled: true,
          MatchingEventTypes: eventTypes,
          SNSDestination: {
            TopicARN: topicArn
          }
        }
      });

      await this.sesClient.send(command);
      console.log('   ✅ Successfully added');

    } catch (error) {
      if (error.name === 'EventDestinationAlreadyExistsException' || 
          error.message.includes('already exists')) {
        console.log('   ℹ️  Already exists - skipping');
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  async run() {
    try {
      await this.addEventDestinations();
    } catch (error) {
      console.error('Setup failed:', error.message);
    }
  }
}

const configurator = new SESEventDestinationConfigurator();
configurator.run().catch(console.error);