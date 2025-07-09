require('dotenv').config();
const mongoose = require('mongoose');
const { createRedisClient } = require('../config/redis');

// Setup MongoDB connection for testing
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job_board_test');
    console.log('Connected to MongoDB for testing');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
});

// Setup Redis connection for testing
beforeAll(async () => {
  try {
    const redis = createRedisClient('test');
    await redis.ping();
    console.log('Connected to Redis for testing');
  } catch (error) {
    console.error('Redis connection error:', error);
    process.exit(1);
  }
});

// Cleanup after tests
afterAll(async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    console.log('Cleaned up test database');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}); 