#!/usr/bin/env node

/**
 * Debug SES configuration issues
 */

import { SESClient, DescribeConfigurationSetCommand, GetConfigurationSetEventDestinationsCommand } from '@aws-sdk/client-ses';
import { fromEnv } from '@aws-sdk/credential-providers';
import dotenv from 'dotenv';

dotenv.config();

async function debugSESConfig() {
  const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: fromEnv()
  });

  console.log('🔍 Debugging SES Configuration');
  console.log('=' .repeat(50));

  try {
    // Try the newer command for getting event destinations
    console.log('\nTrying GetConfigurationSetEventDestinationsCommand...');
    const getEventDestinationsCommand = new GetConfigurationSetEventDestinationsCommand({
      ConfigurationSetName: 'production-emails'
    });
    
    const eventDestinationsResponse = await sesClient.send(getEventDestinationsCommand);
    console.log('Event Destinations Response:', JSON.stringify(eventDestinationsResponse, null, 2));

  } catch (error) {
    console.log('GetConfigurationSetEventDestinationsCommand failed:', error.message);
    
    // Try the older describe command
    try {
      console.log('\nTrying DescribeConfigurationSetCommand...');
      const describeCommand = new DescribeConfigurationSetCommand({
        ConfigurationSetName: 'production-emails'
      });
      
      const describeResponse = await sesClient.send(describeCommand);
      console.log('Describe Response:', JSON.stringify(describeResponse, null, 2));

    } catch (describeError) {
      console.log('DescribeConfigurationSetCommand failed:', describeError.message);
    }
  }

  // Check AWS SDK version
  console.log('\n📦 Checking AWS SDK...');
  try {
    const pkg = await import('../../../package.json', { assert: { type: 'json' } });
    console.log('SES Client version:', pkg.default.dependencies['@aws-sdk/client-ses']);
  } catch (error) {
    console.log('Could not determine AWS SDK version');
  }
}

debugSESConfig().catch(console.error);