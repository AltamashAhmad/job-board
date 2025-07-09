const { Queue } = require('bullmq');
const { createRedisClient } = require('../config/redis');
const { QUEUE_NAMES } = require('../config/constants');

// Get environment variables with defaults
const BATCH_SIZE = parseInt(process.env.QUEUE_BATCH_SIZE || '10');
const MAX_CONCURRENCY = parseInt(process.env.QUEUE_MAX_CONCURRENCY || '5');

// Create Redis connection for the queue
const connection = createRedisClient(false);

// Create job queue
const jobQueue = new Queue(QUEUE_NAMES.JOB_IMPORT, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000 // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 24 * 3600 // Keep failed jobs for 24 hours
    }
  }
});

// Handle queue events
jobQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

// Add jobs in batches
async function addJobs(jobs, options = {}) {
  try {
    const batches = [];
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }

    console.log(`Processing ${jobs.length} jobs in ${batches.length} batches of ${BATCH_SIZE}`);

    const results = [];
    for (const batch of batches) {
      const batchJobs = await Promise.all(
        batch.map(job => jobQueue.add(QUEUE_NAMES.JOB_IMPORT, job, options))
      );
      results.push(...batchJobs);
      console.log(`Added batch of ${batch.length} jobs to queue`);
    }

    return results;
  } catch (error) {
    console.error('Error adding jobs to queue:', error);
    throw error;
  }
}

// Add single job to queue
async function addJob(queueName, data, options = {}) {
  try {
    const job = await jobQueue.add(queueName, data, options);
    console.log(`Added job ${job.id} to queue ${queueName}`);
    return job;
  } catch (error) {
    console.error(`Error adding job to queue ${queueName}:`, error);
    throw error;
  }
}

// Get job counts
async function getJobCounts(queueName) {
  try {
    const counts = await jobQueue.getJobCounts();
    console.log(`Job counts for queue ${queueName}:`, counts);
    return counts;
  } catch (error) {
    console.error(`Error getting job counts for queue ${queueName}:`, error);
    throw error;
  }
}

module.exports = {
  jobQueue,
  addJob,
  addJobs,
  getJobCounts,
  BATCH_SIZE,
  MAX_CONCURRENCY
}; 