const { Queue } = require('bullmq');
const { createRedisClient, QUEUE_NAMES } = require('../config/redis');

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

module.exports = {
  jobQueue
}; 