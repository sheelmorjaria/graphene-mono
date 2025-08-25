// Test script to debug the 1TB parsing issue
console.log('🧪 Testing 1TB Storage Parsing Issue...\n');

// Simulate the current extractModelInfo function from syncFromCLI.js
const extractModelInfo = (name) => {
  if (!name) return null;

  // Remove condition letter (A, B, or C) and category from the name for parsing
  const nameWithoutCondition = name
    .replace(/\s+[ABC](?:\s*\[.*?\])?$/, "") // Remove condition + optional category
    .replace(/\s*\[.*?\]$/, ""); // Remove remaining category if any
  
  // Check for Pixel Fold specifically first
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

  // Regular Pixel model matching (including Pro and Pro XL variants)
  // Updated pattern to handle RAM+ROM format and TB values (e.g., "12GB+128GB", "12GB+256GB", "1TB")
  const match = nameWithoutCondition.match(
    /Google Pixel\s+(\d+a?)\s*(Pro\s*XL|Pro)?\s*(?:(\d+(?:GB|TB))\+)?(\d+(?:GB|TB))?\s+([^]+?)(?:\s+Unlocked)?$/i
  );

  if (!match) return null;

  const [_, number, variant, ram, storage, colorAndRest] = match;
  let modelName = `Pixel ${number}`;
  if (variant) {
    modelName += ` ${variant.trim()}`;
  }

  // Handle storage that might be in the color field (e.g., "1TB Obsidian")
  let actualStorage = storage || ram || "128GB";
  let actualColor = colorAndRest ? colorAndRest.trim() : "Unknown";
  
  // Check if color field contains storage info (like "1TB Obsidian" or "Obsidian 1TB")
  if (actualColor) {
    const colorStorageMatch = actualColor.match(/(\d+(?:GB|TB))\s+(.+)|(.+)\s+(\d+(?:GB|TB))/i);
    if (colorStorageMatch) {
      if (colorStorageMatch[1] && colorStorageMatch[2]) {
        // Format: "1TB Obsidian"
        actualStorage = colorStorageMatch[1];
        actualColor = colorStorageMatch[2].trim();
      } else if (colorStorageMatch[3] && colorStorageMatch[4]) {
        // Format: "Obsidian 1TB"
        actualColor = colorStorageMatch[3].trim();
        actualStorage = colorStorageMatch[4];
      }
    }
  }
  
  // For Pixel 7 Pro specifically, ensure we're getting the ROM part, not RAM
  if (modelName.includes("7 Pro") && ram && storage) {
    actualStorage = storage; // Use the second part (ROM) after the "+"
  }

  return {
    modelName: modelName.trim(),
    storage: actualStorage,
    color: actualColor,
  };
};

// Test cases that might be causing the issue
const problematicCases = [
  // What the CEX data might look like for 1TB variants
  'Google Pixel 9 Pro XL 1TB Obsidian A [Android Phones]',
  'Google Pixel 9 Pro XL 1TB Obsidian B [Android Phones]',
  
  // Maybe it's this format with storage capacity in the color field
  'Google Pixel 9 Pro XL Obsidian 1TB A [Android Phones]',
  'Google Pixel 9 Pro XL 128GB 1TB Obsidian B [Android Phones]',
  
  // Or maybe it's getting confused with mixed formats
  'Google Pixel 9 Pro XL 12GB+1TB Obsidian A [Android Phones]',
  'Google Pixel 9 Pro XL 256GB 1TB Obsidian B [Android Phones]',
];

console.log('🔧 Testing Potential 1TB Cases:');
problematicCases.forEach((testCase, index) => {
  const result = extractModelInfo(testCase);
  const status = result ? '✅' : '❌';
  console.log(`\n${index + 1}. ${status} Input: "${testCase}"`);
  if (result) {
    console.log(`   📱 Model: ${result.modelName}`);
    console.log(`   💾 Storage: ${result.storage} ${result.color.includes('1TB') ? '❌ (1TB in color!)' : '✅'}`);
    console.log(`   🎨 Color: ${result.color} ${result.color.includes('1TB') ? '❌ (Should not contain 1TB!)' : '✅'}`);
    
    // Show the match breakdown for debugging
    const nameWithoutCondition = testCase
      .replace(/\s+[ABC](?:\s*\[.*?\])?$/, "")
      .replace(/\s*\[.*?\]$/, "");
    const match = nameWithoutCondition.match(
      /Google Pixel\s+(\d+a?)\s*(Pro\s*XL|Pro)?\s*(?:(\d+GB)\+)?(\d+GB)?\s+([^]+?)(?:\s+Unlocked)?$/i
    );
    if (match) {
      console.log(`   🔍 Debug: [full="${match[0]}", number="${match[1]}", variant="${match[2]}", ram="${match[3]}", storage="${match[4]}", color="${match[5]}"]`);
    }
  }
});

console.log('\n🎯 Expected vs Actual:');
console.log('❌ WRONG: storage="128GB", color="1TB Obsidian"');
console.log('✅ CORRECT: storage="1TB", color="Obsidian"');

console.log('\n💡 The issue is likely:');
console.log('1. CEX data has 1TB in an unexpected position');
console.log('2. Current regex treats 1TB as part of the color name');
console.log('3. Need to detect and extract 1TB/TB values properly');