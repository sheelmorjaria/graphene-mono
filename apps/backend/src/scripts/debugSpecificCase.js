// Debug the specific case that's not working: "128GB 1TB Obsidian"
console.log('🐛 Debugging Specific Case: 128GB 1TB Obsidian\n');

const extractModelInfo = (name) => {
  if (!name) return null;

  console.log(`🔍 Input: "${name}"`);
  
  const nameWithoutCondition = name
    .replace(/\s+[ABC](?:\s*\[.*?\])?$/, '')
    .replace(/\s*\[.*?\]$/, '');
  
  console.log(`🔍 After condition removal: "${nameWithoutCondition}"`);

  const foldMatch = nameWithoutCondition.match(
    /(?:Google\s+)?Pixel\s+Fold\s*(\d+GB)?\s*[,-]?\s*([^,]+)?/i
  );
  
  if (foldMatch) {
    const [_, storage, color] = foldMatch;
    return {
      modelName: 'Pixel Fold',
      storage: storage || '256GB',
      color: color ? color.trim() : 'Unknown'
    };
  }

  const match = nameWithoutCondition.match(
    /Google Pixel\s+(\d+a?)\s*(Pro\s*XL|Pro)?\s*(?:(\d+(?:GB|TB))\+)?(\d+(?:GB|TB))?\s+([^]+?)(?:\s+Unlocked)?$/i
  );

  console.log('🔍 Regex match result:', match);

  if (!match) return null;

  const [_, number, variant, ram, storage, colorAndRest] = match;
  console.log('🔍 Parsed components:', {
    number,
    variant, 
    ram,
    storage,
    colorAndRest
  });

  let modelName = `Pixel ${number}`;
  if (variant) {
    modelName += ` ${variant.trim()}`;
  }

  let actualStorage = storage || ram || '128GB';
  let actualColor = colorAndRest ? colorAndRest.trim() : 'Unknown';
  
  console.log('🔍 Before color-storage separation:', {
    actualStorage,
    actualColor
  });
  
  // Check if color field contains storage info
  if (actualColor) {
    const colorStorageMatch = actualColor.match(/(\d+(?:GB|TB))\s+(.+)|(.+)\s+(\d+(?:GB|TB))/i);
    console.log('🔍 Color-storage match:', colorStorageMatch);
    
    if (colorStorageMatch) {
      if (colorStorageMatch[1] && colorStorageMatch[2]) {
        console.log('🔍 Found format: "XGB/TB Color"');
        actualStorage = colorStorageMatch[1];
        actualColor = colorStorageMatch[2].trim();
      } else if (colorStorageMatch[3] && colorStorageMatch[4]) {
        console.log('🔍 Found format: "Color XGB/TB"');
        actualColor = colorStorageMatch[3].trim();
        actualStorage = colorStorageMatch[4];
      }
    }
  }
  
  console.log('🔍 After color-storage separation:', {
    actualStorage,
    actualColor
  });
  
  if (modelName.includes('7 Pro') && ram && storage) {
    console.log('🔍 Applied Pixel 7 Pro special rule');
    actualStorage = storage;
  }

  const result = {
    modelName: modelName.trim(),
    storage: actualStorage,
    color: actualColor
  };
  
  console.log('🔍 Final result:', result);
  return result;
};

// Test the exact problematic case
const problematicCase = 'Google Pixel 9 Pro XL 128GB 1TB Obsidian A [Android Phones]';
console.log('📋 Testing the problematic case:\n');

const result = extractModelInfo(problematicCase);

console.log('\n🎯 Analysis:');
console.log('Expected: storage="1TB", color="Obsidian"');
console.log(`Actual: storage="${result?.storage}", color="${result?.color}"`);

if (result?.storage === '1TB' && result?.color === 'Obsidian') {
  console.log('✅ SUCCESS: Parsing working correctly!');
} else {
  console.log('❌ ISSUE: Still not parsing correctly');
  console.log('\n🔧 The problem might be:');
  console.log('1. Regex not matching the right parts');
  console.log('2. Color-storage separation logic not handling this case');
  console.log('3. Need to prioritize TB over GB when both are present');
}