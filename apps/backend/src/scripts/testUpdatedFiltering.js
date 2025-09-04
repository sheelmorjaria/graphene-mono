import { extractBaseModel, isOldPixelVariant } from '../syncFromCLI.js';

const testProductNames = [
  // Should be EXCLUDED (old models + 6a)
  'Google Pixel 1 32GB',
  'Google Pixel 2 64GB',
  'Google Pixel 2 XL 128GB',
  'Google Pixel 3 64GB',
  'Google Pixel 3a 64GB',
  'Google Pixel 3a XL 64GB',
  'Google Pixel 4 128GB',
  'Google Pixel 4a 128GB',
  'Google Pixel 4a 5G 128GB',
  'Google Pixel 5 128GB',
  'Google Pixel 5a 128GB',
  'Google Pixel 6a 128GB Charcoal', // Should be excluded!
  
  // Should be INCLUDED (newer models + Folds)
  'Google Pixel 6 128GB Stormy Black',
  'Google Pixel 6 Pro 256GB Cloudy White', 
  'Google Pixel 7 128GB Snow',
  'Google Pixel 7 Pro 256GB Obsidian',
  'Google Pixel 8 128GB Rose',
  'Google Pixel 8 Pro 256GB Bay',
  'Google Pixel 9 128GB Porcelain',
  'Google Pixel 9 Pro 256GB Hazel',
  'Google Pixel Fold 256GB Obsidian', // Should be included!
  'Google Pixel 9 Pro Fold 256GB Porcelain', // Should be included!
  'Google Pixel 9 Pro Fold 512GB Obsidian'  // Should be included!
];

console.log('🧪 Testing updated filtering logic...\n');

console.log('❌ SHOULD BE EXCLUDED (isOldPixelVariant = true):');
testProductNames.forEach(name => {
  const isOld = isOldPixelVariant(name);
  if (isOld) {
    console.log(`   ✅ ${name} → EXCLUDED`);
  }
});

console.log('\n✅ SHOULD BE INCLUDED (isOldPixelVariant = false):');
testProductNames.forEach(name => {
  const isOld = isOldPixelVariant(name);
  if (!isOld) {
    const baseModel = extractBaseModel(name);
    console.log(`   ✅ ${name} → Base Model: "${baseModel}"`);
  }
});

console.log('\n🔍 Special Cases:');
const specialCases = [
  'Google Pixel 6a 128GB Charcoal',
  'Google Pixel Fold 256GB Obsidian', 
  'Google Pixel 9 Pro Fold 512GB Porcelain'
];

specialCases.forEach(name => {
  const isOld = isOldPixelVariant(name);
  const baseModel = extractBaseModel(name);
  const shouldInclude = !isOld && (name.toLowerCase().includes('fold') || !name.toLowerCase().includes('6a'));
  
  console.log(`   ${name}:`);
  console.log(`     isOldPixelVariant: ${isOld}`);
  console.log(`     extractBaseModel: "${baseModel}"`);
  console.log(`     shouldInclude: ${shouldInclude}`);
  console.log('');
});

console.log('📋 Expected Results:');
console.log('   - Pixel 6a should be EXCLUDED');
console.log('   - Pixel Fold should be INCLUDED with baseModel "Fold"');
console.log('   - Pixel 9 Pro Fold should be INCLUDED with baseModel "9 Pro Fold"');
console.log('   - All Pixel 1-5 variants should be EXCLUDED');
console.log('   - Pixel 6, 7, 8, 9 (non-a) should be INCLUDED');