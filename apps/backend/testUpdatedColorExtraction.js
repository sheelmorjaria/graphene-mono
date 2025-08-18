// Test the updated color extraction logic

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

console.log('🧪 Testing updated color extraction logic...\n');

// Simulate the updated color extraction function
function extractColor(name) {
  let color = "Unknown";
  
  // Try multiple patterns to extract color
  const colorPatterns = [
    // Standard pattern: after storage size
    /\d+GB\s+([^,]+)/,
    // Pro models with parentheses: (12GB+128GB) Color
    /\([^)]+\)\s+(.+)/,
    // Fallback: last word(s) in the name
    /(\w+(?:\s+\w+)?)$/
  ];
  
  for (const pattern of colorPatterns) {
    const match = name.match(pattern);
    if (match) {
      color = match[1].trim();
      break;
    }
  }
  
  return color;
}

testProductNames.forEach((name, index) => {
  const color = extractColor(name);
  console.log(`${index + 1}. "${name}"`);
  console.log(`   → Color: "${color}"`);
  console.log();
});

console.log('✅ All products should now have proper color extraction!');