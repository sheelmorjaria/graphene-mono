// Mint an Aegis Hardening Suite licence WITHOUT going through PayPal —
// puts the order into the exact state a successful capture produces
// (Paid + download token), for owner testing or founder self-licences.
//
//   node generate-aegis-licence.js <email> <pixelModel> [--test]
//
// Writes to the database the backend .env points at (prints which one).
// --test marks the order's history as a test licence so it can be spotted
// in the admin panel and cleaned up later.
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { exit } from 'process';

dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: './apps/backend/.env' });
}

const email = process.argv[2];
const pixelModel = process.argv[3];
const isTest = process.argv.includes('--test');

if (!email || !pixelModel) {
  console.error('Usage: node generate-aegis-licence.js <email> <pixelModel> [--test]');
  console.error('Example: node generate-aegis-licence.js you@example.com "7 Pro"');
  exit(1);
}

const maskedUri = (uri) => uri.replace(/\/\/[^@]*@/, '//***:***@');

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log(`Connected: ${maskedUri(process.env.MONGODB_URI)}`);

  const { default: AegisOrder } = await import('./apps/backend/src/models/AegisOrder.js');
  const { default: Product } = await import('./apps/backend/src/models/Product.js');

  const stocked = await Product.exists({ baseModel: pixelModel, isActive: true });
  if (!stocked) {
    const available = await Product.distinct('baseModel', { isActive: true });
    console.error(`❌ "${pixelModel}" is not an active catalog model. Available: ${available.join(', ')}`);
    exit(1);
  }

  const token = crypto.randomBytes(24).toString('base64url');
  const order = new AegisOrder({
    customerEmail: email.toLowerCase(),
    pixelModel,
    amountGbp: 99.00,
    orderStatus: 'Paid',
    paymentStatus: 'Completed',
    downloadToken: token,
    paymentDetails: {
      paypalTransactionId: `manual_${Date.now()}`
    }
  });
  order.statusHistory.push({
    status: 'Paid',
    note: isTest
      ? 'TEST LICENCE — minted manually, no payment taken'
      : 'Licence minted manually (owner/self licence), no payment taken'
  });
  await order.save();

  const backend = (process.env.BACKEND_URL || 'https://api.graphene-security.com').replace(/\/$/, '');
  const frontend = (process.env.FRONTEND_URL || 'https://graphene-security.com').replace(/\/$/, '');

  console.log('\n✅ Licence minted');
  console.log(`   Order:   ${order.orderNumber}`);
  console.log(`   Device:  Pixel ${pixelModel}`);
  console.log(`   Email:   ${order.customerEmail}`);
  console.log('\nWeb installer (Chrome/Edge, phone plugged in):');
  console.log(`   ${frontend}/aegis/installer?token=${token}`);
  console.log('\nDirect kit download:');
  console.log(`   ${backend}/api/aegis-orders/download/${token}`);
  console.log('\nℹ️  Manual licences appear in the admin panel and count toward revenue stats.');
  console.log('   Mark the order Cancelled in admin (or refund) afterwards to keep the numbers honest.');
} catch (error) {
  console.error('❌ Failed:', error.message);
  exit(1);
} finally {
  await mongoose.disconnect().catch(() => {});
}
