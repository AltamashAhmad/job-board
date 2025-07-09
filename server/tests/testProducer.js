require('dotenv').config();
const mongoose = require('mongoose');
const { createWorker } = require('../config/redis');
const { QUEUE_NAMES } = require('../config/constants');
const Job = require('../models/Job');
const jobFetchService = require('../services/jobFetchService');
const { JOB_SOURCES } = require('../config/jobSources');

async function testProducer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test worker to process jobs
    const worker = createWorker(QUEUE_NAMES.JOB_IMPORT, async (job) => {
      console.log(`Processing job: ${job.data.job.title}`);
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      return { processed: true, jobId: job.id };
    });

    worker.on('completed', job => {
      console.log(`Job ${job.id} completed successfully`);
    });

    // Test with first source
    const source = JOB_SOURCES[0];
    console.log(`Testing job producer with source: ${source.name}`);

    // Fetch and queue jobs
    const result = await jobFetchService.fetchJobsFromSource(source);
    console.log(`Fetched and queued ${result.jobs.length} jobs`);

    // Get queue status
    const initialStatus = await jobFetchService.getQueueStatus();
    console.log('Initial queue status:', initialStatus);

    // Wait for jobs to be processed
    console.log('Waiting for jobs to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get final queue status
    const finalStatus = await jobFetchService.getQueueStatus();
    console.log('Final queue status:', finalStatus);

    // Cleanup
    await worker.close();
    await mongoose.disconnect();
    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testProducer(); 