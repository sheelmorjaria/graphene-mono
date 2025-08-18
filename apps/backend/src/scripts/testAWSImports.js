#!/usr/bin/env node

/**
 * Test script to verify AWS SDK imports work correctly
 */

import dotenv from 'dotenv';
dotenv.config();

async function testImports() {
  console.log('Testing AWS SDK imports...\n');

  try {
    // Test SES imports
    console.log('1. Testing SES imports...');
    const { SESClient, CreateConfigurationSetEventDestinationCommand, CreateConfigurationSetCommand } = await import('@aws-sdk/client-ses');
    console.log('   ✅ SES imports successful');

    // Test SNS imports
    console.log('2. Testing SNS imports...');
    const { SNSClient, CreateTopicCommand, SubscribeCommand } = await import('@aws-sdk/client-sns');
    console.log('   ✅ SNS imports successful');

    // Test credential providers
    console.log('3. Testing credential providers...');
    const { fromEnv } = await import('@aws-sdk/credential-providers');
    console.log('   ✅ Credential providers imported');

    // Test creating clients (without credentials)
    console.log('4. Testing client creation...');
    const sesClient = new SESClient({ region: 'us-east-1' });
    const snsClient = new SNSClient({ region: 'us-east-1' });
    console.log('   ✅ Clients created successfully');

    // Test command creation
    console.log('5. Testing command creation...');
    const createTopicCommand = new CreateTopicCommand({ Name: 'test-topic' });
    const createConfigSetCommand = new CreateConfigurationSetCommand({
      ConfigurationSet: { Name: 'test-config-set' }
    });
    const createEventDestCommand = new CreateConfigurationSetEventDestinationCommand({
      ConfigurationSetName: 'test-config-set',
      EventDestination: {
        Name: 'test-destination',
        Enabled: true,
        MatchingEventTypes: ['bounce']
      }
    });
    console.log('   ✅ Commands created successfully');

    console.log('\n🎉 All AWS SDK imports and basic functionality working!');
    
    // Show available AWS environment variables
    console.log('\n📋 AWS Environment Variables:');
    console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'not set'}`);
    console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not set'}`);
    console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not set'}`);
    console.log(`   WEBHOOK_URL: ${process.env.WEBHOOK_URL || process.env.BACKEND_URL + '/api/webhook/ses' || 'not set'}`);

  } catch (error) {
    console.error('❌ Import test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('is not a constructor')) {
      console.log('\n💡 Suggestions:');
      console.log('   - Check if @aws-sdk/client-ses version is compatible');
      console.log('   - Try: npm update @aws-sdk/client-ses @aws-sdk/client-sns');
      console.log('   - Or try using dynamic imports instead');
    }
  }
}

testImports();