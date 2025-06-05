import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  // Setup in-memory MongoDB for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Disconnect from any existing connection
  await mongoose.disconnect();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
}, 30000);

afterAll(async () => {
  // Close database connection and stop server
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 10000);

afterEach(async () => {
  // Clean up test data
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});