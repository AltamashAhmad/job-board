const { Queue } = require('bullmq');
const { createRedisClient } = require('../config/redis');
const { QUEUE_NAMES } = require('../config/constants');

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

// Add job to queue
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
  getJobCounts
}; 