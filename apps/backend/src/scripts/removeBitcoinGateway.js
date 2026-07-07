// One-off: delete the disabled Bitcoin payment gateway document.
//
// Checkout is PayPal-only; the Bitcoin [BITCOIN] gateway (type:
// cryptocurrency, enabled: false) is a leftover from the abandoned crypto
// plan. This removes it from the `paymentgateways` collection.
//
// Usage (from apps/backend):
//   node src/scripts/removeBitcoinGateway.js          # dry run
//   APPLY=1 node src/scripts/removeBitcoinGateway.js  # apply

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PaymentGateway from '../models/PaymentGateway.js';

dotenv.config();

const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true';

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  console.log(APPLY ? '⚙️  APPLY mode\n' : '🔍 DRY RUN\n');

  const list = (g) => `${g.name} [${g.code}] | type=${g.type} | provider=${g.provider} | enabled=${g.isEnabled}`;

  const before = await PaymentGateway.find({}, 'name code type provider isEnabled');
  console.log('=== Current payment gateways ===');
  before.forEach((g) => console.log(`- ${list(g)}`));

  const target = await PaymentGateway.find({ code: 'BITCOIN' });
  console.log(`\nBitcoin gateway to delete: ${target.length} found`);
  target.forEach((g) => console.log(`  ✂️  ${list(g)}`));

  if (!APPLY) {
    console.log('\nDry run — re-run with APPLY=1 to delete.');
  } else {
    const res = await PaymentGateway.deleteOne({ code: 'BITCOIN' });
    console.log(`\n🗑️  Deleted ${res.deletedCount} Bitcoin gateway doc(s).`);
  }

  const after = await PaymentGateway.find({}, 'name code type provider isEnabled');
  console.log(`\n=== Resulting gateways (${after.length}) ===`);
  after.forEach((g) => console.log(`- ${list(g)}`));

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
}
