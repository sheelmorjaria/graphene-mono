import mongoose from 'mongoose';

beforeAll(async () => {
  // Setup test database connection if needed
});

afterAll(async () => {
  // Close database connection
  await mongoose.connection.close();
});

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