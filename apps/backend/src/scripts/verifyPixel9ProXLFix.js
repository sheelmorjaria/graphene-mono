import fetch from 'node-fetch';

async function verifyPixel9ProXLFix() {
  console.log('🧪 Verifying Pixel 9 Pro XL 1TB Obsidian Fix...\n');
  
  try {
    // Test the product API
    const response = await fetch('http://localhost:5000/api/products/grapheneos-pixel-9-pro-xl');
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const product = data.data;
    
    console.log('📱 Product:', product.name);
    console.log('🎨 Available Colors:', product.availableColors || []);
    console.log('💾 Available Storage:', product.availableStorage || []);
    
    console.log('\n📦 Obsidian Variations:');
    const obsidianVariations = product.variations.filter(v => v.color === 'Obsidian');
    obsidianVariations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.condition} - ${v.color} - Storage: ${v.storage} - £${v.price}`);
    });
    
    console.log('\n💾 1TB Storage Variations:');
    const oneTBVariations = product.variations.filter(v => v.storage === '1TB');
    oneTBVariations.forEach((v, i) => {
      console.log(`${i + 1}. ${v.condition} - ${v.color} - Storage: ${v.storage} - £${v.price}`);
    });
    
    // Validation
    const hasObsidianColor = product.availableColors.includes('Obsidian');
    const has1TBStorage = product.availableStorage.includes('1TB');
    const noIncorrectColors = !product.availableColors.includes('1TB Obsidian');
    const has1TBObsidianVariations = product.variations.some(v => 
      v.color === 'Obsidian' && v.storage === '1TB'
    );
    
    console.log('\n🔍 Validation:');
    console.log(`✅ Has Obsidian as color option: ${hasObsidianColor ? 'YES' : 'NO'}`);
    console.log(`✅ Has 1TB as storage option: ${has1TBStorage ? 'YES' : 'NO'}`);
    console.log(`❌ No "1TB Obsidian" color: ${noIncorrectColors ? 'YES' : 'NO'}`);
    console.log(`✅ Has 1TB Obsidian variations: ${has1TBObsidianVariations ? 'YES' : 'NO'}`);
    
    if (hasObsidianColor && has1TBStorage && noIncorrectColors && has1TBObsidianVariations) {
      console.log('\n🎉 SUCCESS: Pixel 9 Pro XL now correctly shows:');
      console.log('- Obsidian as a color option (not "1TB Obsidian")');
      console.log('- 1TB as a storage option');
      console.log('- 1TB Obsidian variations properly grouped');
      console.log('\n🌐 Frontend Impact:');
      console.log('- Product page will show 1TB in storage selector');
      console.log('- Obsidian color will include all variations (128GB, 256GB, 512GB, 1TB)');
      console.log('- Users can select Obsidian + 1TB combination');
    } else {
      console.log('\n❌ ISSUE: Some problems remain');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

verifyPixel9ProXLFix();