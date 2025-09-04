// Test script to verify the new RAM+ROM parsing logic
const testExtractModelInfo = () => {
  console.log('🧪 Testing RAM+ROM Parsing Logic...\n');

  // Simulate the updated extractModelInfo function logic
  const extractModelInfo = (name) => {
    if (!name) return null;

    // Remove condition letter (A, B, or C) and category from the name for parsing
    const nameWithoutCondition = name
      .replace(/\s+[ABC](?:\s*\[.*?\])?$/, '') // Remove condition + optional category
      .replace(/\s*\[.*?\]$/, ''); // Remove remaining category if any
    
    // Check for Pixel Fold specifically first
    const foldMatch = nameWithoutCondition.match(
      /(?:Google\s+)?Pixel\s+Fold\s*(\d+GB)?\s*[,-]?\s*([^,]+)?/i
    );
    
    if (foldMatch) {
      const [_, storage, color] = foldMatch;
      return {
        modelName: 'Pixel Fold',
        storage: storage || '256GB', // Fold typically comes with 256GB
        color: color ? color.trim() : 'Unknown'
      };
    }

    // Regular Pixel model matching (including Pro and Pro XL variants)
    // Updated pattern to handle RAM+ROM format (e.g., "12GB+128GB", "12GB+256GB")
    const match = nameWithoutCondition.match(
      /Google Pixel\s+(\d+a?)\s*(Pro\s*XL|Pro)?\s*(?:(\d+GB)\+)?(\d+GB)?\s+([^]+?)(?:\s+Unlocked)?$/i
    );

    if (!match) return null;

    const [_, number, variant, ram, storage, color] = match;
    let modelName = `Pixel ${number}`;
    if (variant) {
      modelName += ` ${variant.trim()}`;
    }

    // Handle RAM+ROM format: if we have both ram and storage, use storage
    // If we only have one value, treat it as storage (backward compatibility)
    let actualStorage = storage || ram || '128GB';
    
    // For Pixel 7 Pro specifically, ensure we're getting the ROM part, not RAM
    if (modelName.includes('7 Pro') && ram && storage) {
      actualStorage = storage; // Use the second part (ROM) after the "+"
    }

    return {
      modelName: modelName.trim(),
      storage: actualStorage,
      color: color ? color.trim() : 'Unknown'
    };
  };

  // Test cases including the problematic RAM+ROM format
  const testCases = [
    // New RAM+ROM format cases
    'Google Pixel 7 Pro 12GB+128GB Snow A [Android Phones]',
    'Google Pixel 7 Pro 12GB+256GB Obsidian B [Android Phones]',
    'Google Pixel 7 Pro 12GB+128GB Hazel C [Android Phones]',
    
    // Backward compatibility - single storage value
    'Google Pixel 7 Pro 128GB Snow A [Android Phones]',
    'Google Pixel 8 Pro 256GB Bay B [Android Phones]',
    
    // Other models for comparison
    'Google Pixel 6 128GB Sorta Sunny A [Android Phones]',
    'Google Pixel Fold 256GB Obsidian A [Android Phones]'
  ];

  console.log('📋 Test Results:');
  testCases.forEach((testCase, index) => {
    const result = extractModelInfo(testCase);
    console.log(`\n${index + 1}. Input: "${testCase}"`);
    if (result) {
      console.log(`   ✅ Model: ${result.modelName}`);
      console.log(`   💾 Storage: ${result.storage}`);
      console.log(`   🎨 Color: ${result.color}`);
    } else {
      console.log('   ❌ Failed to parse');
    }
  });

  console.log('\n🔍 Expected Results:');
  console.log('- Pixel 7 Pro 12GB+128GB → Storage: 128GB (ROM part)');
  console.log('- Pixel 7 Pro 12GB+256GB → Storage: 256GB (ROM part)');
  console.log('- Single storage values should work as before');
  console.log('- RAM (12GB) should be ignored when ROM is present');
};

// Run the test
testExtractModelInfo();