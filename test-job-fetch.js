require('dotenv').config();
const mongoose = require('mongoose');
const jobFetchService = require('./server/services/jobFetchService');
const { JOB_SOURCES } = require('./server/config/jobSources');

async function testJobFetch() {
  try {
    // Connect to MongoDB first
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    console.log('Connected to MongoDB successfully');

    console.log('Testing job fetch service...');
    // Test fetching from one source first
    const source = JOB_SOURCES[0]; // First source
    console.log(`Testing with source: ${source.name}`);
    
    const result = await jobFetchService.fetchJobsFromSource(source);
    console.log('Job fetch completed successfully!');
    console.log(`Fetched ${result.jobs.length} jobs`);
    
    if (result.importLog) {
      console.log('Import log created:', result.importLog._id);
    }

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error in job fetch:', error);
    // Close MongoDB connection on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

testJobFetch(); 