require('dotenv').config();
const mongoose = require('mongoose');
const cronService = require('../services/cronService');

async function testCron() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Run the job fetch once
    console.log('Testing job fetch from all sources...');
    await cronService.fetchAllJobs();
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

testCron(); 