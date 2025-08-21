import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const debugShippingDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Query the collection directly without the model schema
    const db = mongoose.connection.db;
    const collection = db.collection('shippingmethods');
    
    const rawDocuments = await collection.find({}).toArray();
    
    console.log('\n📋 Raw Database Documents:');
    rawDocuments.forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.name} (${doc.code})`);
      console.log(`   _id: ${doc._id}`);
      console.log(`   baseCost: £${doc.baseCost}`);
      
      if (doc.criteria) {
        console.log('   criteria:');
        Object.keys(doc.criteria).forEach(key => {
          console.log(`     ${key}: ${JSON.stringify(doc.criteria[key])}`);
        });
      }
      
      // Check for any freeShipping related fields at root level
      Object.keys(doc).forEach(key => {
        if (key.toLowerCase().includes('freeship') || key.toLowerCase().includes('threshold')) {
          console.log(`   ${key}: ${doc[key]}`);
        }
      });
    });

    // Try to update directly with raw MongoDB operations
    console.log('\n🔧 Attempting raw MongoDB update...');
    
    const updateResult = await collection.updateMany(
      {},
      { 
        $unset: { 
          'criteria.freeShippingThreshold': 1,
          'freeShippingThreshold': 1
        } 
      }
    );
    
    console.log(`Update result: ${updateResult.matchedCount} matched, ${updateResult.modifiedCount} modified`);
    
    // Verify after update
    const updatedDocs = await collection.find({}).toArray();
    
    console.log('\n📋 After Update:');
    updatedDocs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.name}`);
      if (doc.criteria && doc.criteria.freeShippingThreshold) {
        console.log(`   ⚠️  STILL HAS THRESHOLD: ${doc.criteria.freeShippingThreshold}`);
      } else {
        console.log(`   ✅ Threshold removed`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

debugShippingDB().catch(console.error);