import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const testCheckoutShipping = async () => {
  console.log('🔍 Testing Checkout Shipping Calculation');
  console.log('=========================================');

  const baseUrl = 'https://graphene-backend.onrender.com';
  
  // Test scenarios that might be happening on checkout
  const testScenarios = [
    {
      name: 'Low value UK order (should get standard rate)',
      cartItems: [
        { productId: '507f1f77bcf86cd799439011', quantity: 1, weight: 500, unitPrice: 45.00 }
      ],
      cartValue: 45.00,
      address: { country: 'GB', stateProvince: 'England', city: 'London' }
    },
    {
      name: 'Medium value UK order (should get free standard)',
      cartItems: [
        { productId: '507f1f77bcf86cd799439011', quantity: 1, weight: 500, unitPrice: 75.00 }
      ],
      cartValue: 75.00,
      address: { country: 'GB', stateProvince: 'England', city: 'London' }
    },
    {
      name: 'High value UK order (should get free express)',
      cartItems: [
        { productId: '507f1f77bcf86cd799439011', quantity: 1, weight: 500, unitPrice: 150.00 }
      ],
      cartValue: 150.00,
      address: { country: 'GB', stateProvince: 'England', city: 'London' }
    },
    {
      name: 'Multiple items UK order',
      cartItems: [
        { productId: '507f1f77bcf86cd799439011', quantity: 2, weight: 500, unitPrice: 40.00 }
      ],
      cartValue: 80.00,
      address: { country: 'GB', stateProvince: 'England', city: 'London' }
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`\n📊 ${scenario.name}:`);
    console.log(`   Cart Value: £${scenario.cartValue}`);
    console.log(`   Items: ${scenario.cartItems.length} item(s)`);
    console.log(`   Total Weight: ${scenario.cartItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0)}g`);
    
    try {
      const response = await fetch(`${baseUrl}/api/shipping/calculate-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartItems: scenario.cartItems,
          shippingAddress: scenario.address
        })
      });
      
      console.log(`   API Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.shippingRates) {
          console.log('   ✅ Available shipping rates:');
          data.data.shippingRates.forEach(rate => {
            const freeText = rate.isFreeShipping ? ' (FREE)' : '';
            console.log(`      ${rate.name}: £${rate.cost}${freeText} - ${rate.estimatedDelivery}`);
            
            // Show calculation details if available
            if (rate.details) {
              console.log(`         Base: £${rate.details.baseCost}, Weight: £${rate.details.weightCharge.toFixed(2)}, Total Weight: ${rate.details.totalWeight}g`);
            }
          });
          
          // Check for specific issues
          const standardRate = data.data.shippingRates.find(r => r.code === 'STANDARD');
          const expressRate = data.data.shippingRates.find(r => r.code === 'EXPRESS');
          
          if (standardRate) {
            console.log('   🔍 Standard Shipping Analysis:');
            console.log('      Expected: £7.99 base, free over £60');
            console.log(`      Actual: £${standardRate.cost} ${standardRate.isFreeShipping ? '(free)' : ''}`);
            
            if (scenario.cartValue >= 60 && !standardRate.isFreeShipping) {
              console.log('      ❌ ERROR: Should be free but isn\'t!');
            } else if (scenario.cartValue < 60 && standardRate.cost !== 7.99) {
              console.log('      ❌ ERROR: Wrong price! Expected £7.99');
            } else {
              console.log('      ✅ Correct pricing');
            }
          }
          
          if (expressRate) {
            console.log('   🔍 Express Shipping Analysis:');
            console.log('      Expected: £15.99 base, free over £120');
            console.log(`      Actual: £${expressRate.cost} ${expressRate.isFreeShipping ? '(free)' : ''}`);
            
            if (scenario.cartValue >= 120 && !expressRate.isFreeShipping) {
              console.log('      ❌ ERROR: Should be free but isn\'t!');
            } else if (scenario.cartValue < 120 && expressRate.cost !== 15.99) {
              console.log('      ❌ ERROR: Wrong price! Expected £15.99');
            } else {
              console.log('      ✅ Correct pricing');
            }
          }
          
        } else {
          console.log('   ❌ No shipping rates returned');
          console.log('   Response:', JSON.stringify(data, null, 2));
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ API Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n💡 Summary:');
  console.log('============');
  console.log('- Standard Shipping: £7.99, free over £60');
  console.log('- Express Shipping: £15.99, free over £120');
  console.log('- Check if the frontend is displaying these calculated rates correctly');
  console.log('- Verify that cart totals and weights are being passed correctly to the API');
};

testCheckoutShipping().catch(console.error);