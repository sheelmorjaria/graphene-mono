// One-off: make Royal Mail Special Delivery the UK method (fully insured,
// guaranteed next working day, GB-only) and remove the legacy Standard /
// Express methods.
//
// Production already has a "Royal Mail Special Delivery" method (code
// SPECIALDELIVERY) but misconfigured (3-5 days, GB+IE). This corrects it to
// next-day (1 business day) and GB-only, and deletes any STANDARD / EXPRESS
// methods. Other methods (European, International, etc.) are untouched, and
// existing orders keep their stored shippingMethod copy.
//
// Usage (from apps/backend):
//   node src/scripts/migrateShippingMethods.js          # dry run (inspect + plan)
//   APPLY=1 node src/scripts/migrateShippingMethods.js  # apply

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShippingMethod from '../models/ShippingMethod.js';

dotenv.config();

const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true';

const REMOVE_CODES = ['STANDARD', 'EXPRESS', 'EXPRESS_INTERNATIONAL'];
const TARGET_CODE = 'SPECIALDELIVERY';

// Correct values for Royal Mail Special Delivery (next working day, GB-only).
const METHOD_FIELDS = {
  name: 'Royal Mail Special Delivery',
  description: 'Fully insured delivery guaranteed next working day',
  estimatedDeliveryDays: { min: 1, max: 1 },
  baseCost: 20.45,
  criteria: {
    minWeight: 0,
    maxWeight: 20000,
    minOrderValue: 0,
    maxOrderValue: 999999.99,
    supportedCountries: ['GB'] // UK only — next-day guaranteed
    // No freeShippingThreshold => never free
  },
  pricing: {
    weightRate: 0.0008,
    baseWeight: 1000,
    dimensionalWeightFactor: 5000
  },
  isActive: true,
  displayOrder: 1
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  console.log(APPLY ? '⚙️  APPLY mode\n' : '🔍 DRY RUN\n');

  const list = (m) =>
    `[${m.code}] ${m.name} | £${m.baseCost} | ${m.formattedDelivery} | countries: ${(m.criteria?.supportedCountries || []).join(',')} | active: ${m.isActive}`;

  const before = await ShippingMethod.find({}).sort({ displayOrder: 1 });
  console.log('=== Current shipping methods ===');
  before.forEach((m) => console.log(`- ${list(m)}`));

  const toRemove = await ShippingMethod.find({ code: { $in: REMOVE_CODES } });
  console.log(`\nRemove (${REMOVE_CODES.join(', ')}): ${toRemove.length} found`);
  toRemove.forEach((m) => console.log(`  ✂️  ${list(m)}`));

  console.log(`\nUpdate ${TARGET_CODE} -> Royal Mail Special Delivery:`);
  console.log('        £20.45 | GB-only | next working day (1 business day) | fully insured | no free shipping');

  if (!APPLY) {
    console.log('\nDry run — re-run with APPLY=1 to apply.');
  } else {
    const del = await ShippingMethod.deleteMany({ code: { $in: REMOVE_CODES } });
    console.log(`\n🗑️  Deleted ${del.deletedCount} method(s).`);
    const res = await ShippingMethod.updateOne(
      { code: TARGET_CODE },
      { $set: METHOD_FIELDS },
      { upsert: true }
    );
    console.log(`✅ ${TARGET_CODE} ${res.upsertedId ? 'inserted' : 'updated'} (matched ${res.matchedCount}).`);
  }

  const after = await ShippingMethod.find({}).sort({ displayOrder: 1 });
  console.log(`\n=== Resulting methods (${after.length}) ===`);
  after.forEach((m) => console.log(`- ${list(m)}`));

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
}
