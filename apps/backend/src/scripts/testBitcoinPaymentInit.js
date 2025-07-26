import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bitcoinService from '../services/bitcoinService.js';
import Order from '../models/Order.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testBitcoinService = async () => {
  console.log('🧪 Testing Bitcoin Service Components...\n');

  try {
    // Test 1: Exchange Rate Fetching
    console.log('1️⃣ Testing Bitcoin exchange rate fetching...');
    const exchangeRateResult = await bitcoinService.getBtcExchangeRate();
    console.log(`   ✅ BTC/GBP Rate: £${exchangeRateResult.rate}`);
    console.log(`   📅 Timestamp: ${exchangeRateResult.timestamp}`);
    console.log(`   💾 Cached: ${exchangeRateResult.cached}`);
    if (exchangeRateResult.fallback) {
      console.log('   ⚠️  Using fallback rate (API unavailable)');
    }

    // Test 2: Bitcoin Address Generation
    console.log('\n2️⃣ Testing Bitcoin address generation...');
    const bitcoinAddress = await bitcoinService.generateBitcoinAddress();
    console.log(`   ✅ Generated address: ${bitcoinAddress}`);

    // Test 3: GBP to BTC Conversion
    console.log('\n3️⃣ Testing GBP to BTC conversion...');
    const testAmount = 299.99; // £299.99
    const conversionResult = await bitcoinService.convertGbpToBtc(testAmount);
    console.log(`   💷 GBP Amount: £${testAmount}`);
    console.log(`   ₿ BTC Amount: ${conversionResult.btcAmount} BTC`);
    console.log(`   📊 Exchange Rate: £${conversionResult.exchangeRate}`);

    // Test 4: Full Bitcoin Payment Creation
    console.log('\n4️⃣ Testing complete Bitcoin payment creation...');
    const paymentResult = await bitcoinService.createBitcoinPayment(testAmount);
    console.log('   ✅ Bitcoin Payment Data:');
    console.log(`      Address: ${paymentResult.bitcoinAddress}`);
    console.log(`      Amount: ${paymentResult.bitcoinAmount} BTC`);
    console.log(`      Rate: £${paymentResult.bitcoinExchangeRate}`);
    console.log(`      Expires: ${paymentResult.bitcoinPaymentExpiry}`);

    console.log('\n🎉 All Bitcoin service tests passed!');
    return paymentResult;

  } catch (error) {
    console.error('❌ Bitcoin service test failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

const testOrderInitialization = async () => {
  console.log('\n🧪 Testing Order-Based Bitcoin Initialization...\n');

  try {
    // Create a test order
    console.log('5️⃣ Creating test order...');
    const testOrder = new Order({
      userId: new mongoose.Types.ObjectId(),
      customerEmail: 'test@example.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        productSlug: 'test-product',
        quantity: 1,
        unitPrice: 299.99,
        totalPrice: 299.99
      }],
      subtotal: 299.99,
      shipping: 9.99,
      totalAmount: 309.98,
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 9.99
      },
      paymentMethod: {
        type: 'bitcoin',
        name: 'Bitcoin'
      },
      paymentDetails: {},
      paymentStatus: 'pending',
      status: 'pending'
    });

    await testOrder.save();
    console.log(`   ✅ Test order created: ${testOrder._id}`);

    // Test initialization with the order
    console.log('\n6️⃣ Testing Bitcoin payment initialization with order...');
    const bitcoinPaymentData = await bitcoinService.createBitcoinPayment(testOrder.totalAmount);

    // Update order with payment data (simulating the controller logic)
    Object.assign(testOrder.paymentDetails, bitcoinPaymentData);
    testOrder.paymentStatus = 'awaiting_confirmation';
    await testOrder.save();

    console.log('   ✅ Order updated with Bitcoin payment data:');
    console.log(`      Order ID: ${testOrder._id}`);
    console.log(`      Bitcoin Address: ${bitcoinPaymentData.bitcoinAddress}`);
    console.log(`      Bitcoin Amount: ${bitcoinPaymentData.bitcoinAmount} BTC`);
    console.log(`      Payment Status: ${testOrder.paymentStatus}`);

    // Clean up test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log('   🧹 Test order cleaned up');

    console.log('\n🎉 Order-based Bitcoin initialization test passed!');

  } catch (error) {
    console.error('❌ Order initialization test failed:', error.message);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    
    await testBitcoinService();
    await testOrderInitialization();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✓ Bitcoin exchange rate fetching works');
    console.log('   ✓ Bitcoin address generation works (with fallback)');
    console.log('   ✓ GBP to BTC conversion works');
    console.log('   ✓ Complete Bitcoin payment creation works');
    console.log('   ✓ Order-based initialization works');
    console.log('\n🚀 Bitcoin payment initialization should now work in the frontend!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main().catch(console.error);