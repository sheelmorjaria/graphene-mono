// Test color extraction from CLI product names

const testProductNames = [
  "Google Pixel 9 Pro Fold 256GB Obsidian",
  "Google Pixel 9 Pro Fold 256GB Porcelain", 
  "Google Pixel Fold 256GB Obsidian",
  "Google Pixel Fold 512GB Porcelain",
  "Google Pixel 8 Pro 128GB Bay",
  "Google Pixel 8 128GB Rose",
  "Google Pixel 7 128GB Snow",
  "Google Pixel 7 Pro (12GB+128GB) Hazel",
  "Google Pixel 6 128GB Stormy Black",
  "Google Pixel 6 Pro 128GB Cloudy White",
  "Google Pixel 7A 128GB Sea",
  "Google Pixel 8A 128GB Obsidian"
];

console.log('🧪 Testing color extraction patterns...\n');

// Current pattern (broken)
const currentPattern = /(\w+),?\s*Unlocked/i;

// Better patterns to try
const patterns = [
  {
    name: "Current (broken)",
    regex: /(\w+),?\s*Unlocked/i
  },
  {
    name: "Last word pattern", 
    regex: /(\w+)$/
  },
  {
    name: "After storage pattern",
    regex: /\d+GB\s+(.+?)(?:,|$)/
  },
  {
    name: "Color after GB (greedy)",
    regex: /\d+GB\s+(.+)/
  },
  {
    name: "Word after storage (single word)",
    regex: /\d+GB\s+(\w+)/
  },
  {
    name: "Multiple words after storage", 
    regex: /\d+GB\s+([^,]+)/
  }
];

testProductNames.forEach((productName, index) => {
  console.log(`${index + 1}. "${productName}"`);
  
  patterns.forEach(pattern => {
    const match = productName.match(pattern.regex);
    const result = match ? match[1].trim() : "No match";
    console.log(`   ${pattern.name}: "${result}"`);
  });
  
  console.log();
});

// Test the best pattern
console.log('📋 Recommended pattern: /\\d+GB\\s+([^,]+)/');
console.log('This extracts everything after storage until comma or end of string\n');

console.log('✅ Expected results:');
testProductNames.forEach((name, index) => {
  const match = name.match(/\d+GB\s+([^,]+)/);
  const color = match ? match[1].trim() : "Unknown";
  console.log(`   ${index + 1}. ${name} → "${color}"`);
});