// Test Pixel filtering logic
const isOldPixelVariant = (productName) => {
  if (!productName) return false;
  
  // Specific patterns to match ONLY Pixel 1-5 variants (exclude newer models like Pixel Fold)
  const oldPixelPatterns = [
    /\bPixel\s+1\b/i,                     // Pixel 1
    /\bPixel\s+2(\s+XL)?\b/i,             // Pixel 2, Pixel 2 XL
    /\bPixel\s+3(a)?(\s+XL)?\b/i,         // Pixel 3, Pixel 3 XL, Pixel 3a, Pixel 3a XL
    /\bPixel\s+4(a)?(\s+(XL|5G))?\b/i,    // Pixel 4, Pixel 4 XL, Pixel 4a, Pixel 4a XL, Pixel 4a 5G
    /\bPixel\s+5(a)?(\s+XL)?\b/i,         // Pixel 5, Pixel 5a
  ];
  
  return oldPixelPatterns.some(pattern => pattern.test(productName));
};

// Test cases
const testCases = [
  // OLD MODELS (should be filtered OUT - return true)
  'Google Pixel 1 128GB Black',
  'Google Pixel 2 64GB Blue',
  'Google Pixel 2 XL 128GB White',
  'Google Pixel 3 64GB Pink',
  'Google Pixel 3 XL 128GB Black',
  'Google Pixel 3a 64GB Purple',
  'Google Pixel 3a XL 64GB White',
  'Google Pixel 4 128GB Orange',
  'Google Pixel 4 XL 128GB Black',
  'Google Pixel 4a 128GB Black',
  'Google Pixel 4a 5G 128GB Blue',
  'Google Pixel 5 128GB Green',
  'Google Pixel 5a 128GB Black',
  
  // NEW MODELS (should be INCLUDED - return false)
  'Google Pixel 6 128GB Stormy Black',
  'Google Pixel 6 Pro 256GB Cloudy White',
  'Google Pixel 7 128GB Obsidian',
  'Google Pixel 7 Pro 256GB Snow',
  'Google Pixel 8 128GB Hazel',
  'Google Pixel 8 Pro 256GB Bay',
  'Google Pixel 9 128GB Peony',
  'Google Pixel 9 Pro 256GB Porcelain',
  'Google Pixel Fold 256GB Obsidian',
  'Google Pixel Fold 512GB Porcelain',
];

console.log('🧪 Testing Pixel Filtering Logic\n');
console.log('✅ = Should be INCLUDED (newer models)');
console.log('❌ = Should be EXCLUDED (old models 1-5)\n');

testCases.forEach(testCase => {
  const isOld = isOldPixelVariant(testCase);
  const status = isOld ? '❌ EXCLUDE (old)' : '✅ INCLUDE (new)';
  console.log(`${status.padEnd(20)} ${testCase}`);
});

console.log('\n🎯 Summary:');
console.log('- Pixel 1-5 variants: Should be EXCLUDED (❌)');
console.log('- Pixel 6+ and Pixel Fold: Should be INCLUDED (✅)');
console.log('- If any Pixel Fold shows ❌, the pattern needs fixing');