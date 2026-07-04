// One-off migration: normalize product lead-time values to the new "3-5 days"
// standard.
//
// Updates ONLY products that still hold the old default
// (leadTime.displayText === '5-7 working days') — setting displayText to
// '3-5 days' and minDays/maxDays to 3/5. Products with a custom lead time
// (e.g. '7-10 working days') are left untouched.
//
// Usage (from apps/backend):
//   node src/scripts/migrateLeadTime.js            # apply
//   DRY_RUN=1 node src/scripts/migrateLeadTime.js  # preview, no writes
//
// Connects to the database in MONGODB_URI (.env) — i.e. your production
// cluster if that's what .env points at.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const OLD_TEXT = '5-7 working days';
const NEW_TEXT = '3-5 days';

const migrate = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in the environment.');
    process.exit(1);
  }

  const dryRun =
    process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  if (dryRun) console.log('🔍 DRY RUN — no changes will be written.\n');

  try {
    const total = await Product.countDocuments();
    const stale = await Product.countDocuments({ 'leadTime.displayText': OLD_TEXT });

    console.log(`Total products:               ${total}`);
    console.log(`With old "${OLD_TEXT}":        ${stale}\n`);

    if (dryRun) {
      console.log(`Would update ${stale} product(s) to "${NEW_TEXT}" (minDays 3 / maxDays 5).`);
      console.log('Re-run without DRY_RUN to apply.');
      return;
    }

    const res = await Product.updateMany(
      { 'leadTime.displayText': OLD_TEXT },
      {
        $set: {
          'leadTime.displayText': NEW_TEXT,
          'leadTime.minDays': 3,
          'leadTime.maxDays': 5
        }
      }
    );

    console.log(`✅ Migrated: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    console.log(`   → displayText "${NEW_TEXT}", minDays 3, maxDays 5`);
    console.log('\nProducts with a custom lead time were left unchanged.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}
