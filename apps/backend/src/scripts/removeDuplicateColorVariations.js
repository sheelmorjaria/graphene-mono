// One-off: remove duplicate variations whose `color` carries a junk
// "(<RAM>+<storage>) " prefix, e.g. "(12GB+128GB) Hazel".
//
// Context: Pixel 7 Pro (and possibly others) ended up with each good-condition
// color listed twice — a clean "Hazel" and a junk "(12GB+128GB) Hazel" — even
// sharing the same SKU. The prefixed entry is an import artifact. This removes
// the prefixed duplicates, keeping the clean color names.
//
// Defaults to DRY RUN. Prints every variation (with its first image URL), a
// cross-product summary of prefixed duplicates, and what would be removed.
// Re-run with APPLY=1 to actually remove. Aborts if removal would leave the
// target product with zero variations.
//
// Usage (from apps/backend):
//   node src/scripts/removeDuplicateColorVariations.js
//   SLUG=grapheneos-pixel-7-pro APPLY=1 node src/scripts/removeDuplicateColorVariations.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

const TARGET_SLUG = process.env.SLUG || 'grapheneos-pixel-7-pro';
const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true';

// Matches colors with a leading "(12GB+128GB)" / "(<n>GB+<n>GB)" RAM+ROM prefix.
const PREFIXED = /^\([^)]*[0-9]+\s*(?:GB|TB)\s*\+/i;
const isPrefixed = (v) => PREFIXED.test(v.color || '');

const label = (v) =>
  `${v.condition || '-'} | color="${v.color || '-'}" | storage="${v.storage || '-'}" | £${v.price} | sku=${v.sku || '-'} | img=${(v.images || [])[0] || '—'}`;

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  console.log(APPLY ? '⚙️  APPLY mode (will write)\n' : '🔍 DRY RUN (no writes)\n');

  // Cross-product summary: which products have prefixed-color duplicates.
  const all = await Product.find({}, 'name slug variations.color').lean();
  console.log('=== Prefixed-color duplicates by product ===');
  let any = false;
  for (const p of all) {
    const dupes = (p.variations || []).filter(isPrefixed);
    if (dupes.length) {
      any = true;
      console.log(`${p.slug}: ${dupes.length} prefixed variation(s)`);
    }
  }
  if (!any) console.log('None — no prefixed-color variations anywhere.');

  // Detail + action for the target product.
  const product = await Product.findOne({ slug: TARGET_SLUG });
  if (!product) {
    console.log(`\n❌ Product not found: ${TARGET_SLUG}`);
    await mongoose.disconnect();
    return;
  }

  console.log(`\n=== ${product.name} (${TARGET_SLUG}) ===`);
  console.log(`Total variations: ${product.variations.length}`);
  product.variations.forEach((v, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. [${isPrefixed(v) ? 'DUPE' : 'KEEP'}] ${label(v)}`);
  });

  const keep = product.variations.filter((v) => !isPrefixed(v));
  const remove = product.variations.filter(isPrefixed);
  console.log(`\nKeep:   ${keep.length}`);
  console.log(`Remove: ${remove.length}`);

  if (remove.length === 0) {
    console.log('✅ Nothing to remove.');
  } else if (!APPLY) {
    console.log('\nDry run — re-run with APPLY=1 to remove the prefixed duplicates.');
  } else if (keep.length === 0) {
    console.log('⚠️  Removal would leave this product with 0 variations — aborting.');
  } else {
    product.variations = keep;
    await product.save();
    console.log(`✅ Saved. Variations: ${keep.length + remove.length} → ${keep.length} (removed ${remove.length}).`);
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
}
