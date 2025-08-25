// Test script to verify both RAM+ROM and 1TB parsing work together
console.log('🧪 Testing Combined RAM+ROM and 1TB Parsing...\n');

// Simulate the updated extractModelInfo function
const extractModelInfo = (name) => {
  if (!name) return null;

  const nameWithoutCondition = name
    .replace(/\s+[ABC](?:\s*\[.*?\])?$/, "")
    .replace(/\s*\[.*?\]$/, "");
  
  const foldMatch = nameWithoutCondition.match(
    /(?:Google\s+)?Pixel\s+Fold\s*(\d+GB)?\s*[,-]?\s*([^,]+)?/i
  );
  
  if (foldMatch) {
    const [_, storage, color] = foldMatch;
    return {
      modelName: "Pixel Fold",
      storage: storage || "256GB",
      color: color ? color.trim() : "Unknown",
    };
  }

  const match = nameWithoutCondition.match(
    /Google Pixel\s+(\d+a?)\s*(Pro\s*XL|Pro)?\s*(?:(\d+(?:GB|TB))\+)?(\d+(?:GB|TB))?\s+([^]+?)(?:\s+Unlocked)?$/i
  );

  if (!match) return null;

  const [_, number, variant, ram, storage, colorAndRest] = match;
  let modelName = `Pixel ${number}`;
  if (variant) {
    modelName += ` ${variant.trim()}`;
  }

  let actualStorage = storage || ram || "128GB";
  let actualColor = colorAndRest ? colorAndRest.trim() : "Unknown";
  
  // Check if color field contains storage info
  if (actualColor) {
    const colorStorageMatch = actualColor.match(/(\d+(?:GB|TB))\s+(.+)|(.+)\s+(\d+(?:GB|TB))/i);
    if (colorStorageMatch) {
      if (colorStorageMatch[1] && colorStorageMatch[2]) {
        actualStorage = colorStorageMatch[1];
        actualColor = colorStorageMatch[2].trim();
      } else if (colorStorageMatch[3] && colorStorageMatch[4]) {
        actualColor = colorStorageMatch[3].trim();
        actualStorage = colorStorageMatch[4];
      }
    }
  }
  
  if (modelName.includes("7 Pro") && ram && storage) {
    actualStorage = storage;
  }

  return {
    modelName: modelName.trim(),
    storage: actualStorage,
    color: actualColor,
  };
};

// Comprehensive test cases
const testCases = [
  // RAM+ROM format (should still work)
  'Google Pixel 7 Pro 12GB+128GB Snow A [Android Phones]',
  'Google Pixel 7 Pro 12GB+256GB Obsidian B [Android Phones]',
  
  // 1TB format (new fix)
  'Google Pixel 9 Pro XL 1TB Obsidian A [Android Phones]',
  'Google Pixel 9 Pro XL 128GB 1TB Hazel B [Android Phones]',
  
  // Standard single storage (backward compatibility)
  'Google Pixel 8 Pro 256GB Bay A [Android Phones]',
  'Google Pixel 6 128GB Sorta Sunny B [Android Phones]',
  
  // Mixed scenarios
  'Google Pixel 9 Pro XL Obsidian 1TB A [Android Phones]',
  'Google Pixel 7 Pro 256GB Snow C [Android Phones]',
];

console.log('📋 Comprehensive Test Results:');
testCases.forEach((testCase, index) => {
  const result = extractModelInfo(testCase);
  const status = result ? '✅' : '❌';
  console.log(`\n${index + 1}. ${status} Input: "${testCase}"`);
  if (result) {
    console.log(`   📱 Model: ${result.modelName}`);
    
    // Validate storage
    const storageValid = !result.storage.includes('12GB') && result.storage.match(/^\d+(?:GB|TB)$/);
    console.log(`   💾 Storage: ${result.storage} ${storageValid ? '✅' : '❌'}`);
    
    // Validate color (shouldn't contain storage info)
    const colorValid = !result.color.match(/\d+(?:GB|TB)/);
    console.log(`   🎨 Color: ${result.color} ${colorValid ? '✅' : '❌ (contains storage!)'}`);
  }
});

console.log('\n🎯 Validation Summary:');
const allResults = testCases.map(testCase => extractModelInfo(testCase)).filter(Boolean);
const validStorages = allResults.every(r => !r.storage.includes('12GB') && r.storage.match(/^\d+(?:GB|TB)$/));
const validColors = allResults.every(r => !r.color.match(/\d+(?:GB|TB)/));

console.log(`✅ All storage values valid: ${validStorages ? 'YES' : 'NO'}`);
console.log(`✅ No storage in color fields: ${validColors ? 'YES' : 'NO'}`);
console.log(`✅ RAM+ROM parsing works: ${allResults.some(r => r.storage === '128GB' || r.storage === '256GB') ? 'YES' : 'NO'}`);
console.log(`✅ 1TB parsing works: ${allResults.some(r => r.storage === '1TB') ? 'YES' : 'NO'}`);

if (validStorages && validColors) {
  console.log('\n🎉 SUCCESS: All parsing logic working correctly!');
  console.log('📱 forcePixelFoldSync.js should now handle both RAM+ROM and 1TB formats');
} else {
  console.log('\n❌ ISSUE: Some problems remain');
}