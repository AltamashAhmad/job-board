require('dotenv').config();
const mongoose = require('mongoose');
const jobFetchService = require('../services/jobFetchService');
const { JOB_SOURCES } = require('../config/jobSources');

async function testFetch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test with first source
    const source = JOB_SOURCES[0];
    console.log(`Fetching jobs from ${source.name}...`);
    
    const result = await jobFetchService.fetchJobsFromSource(source);
    
    console.log('Fetch completed successfully!');
    console.log('Total jobs fetched:', result.jobs.length);
    console.log('Sample job:', JSON.stringify(result.jobs[0], null, 2));
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testFetch(); 