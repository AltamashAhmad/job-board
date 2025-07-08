const { Queue, Worker } = require('bullmq');

const REDIS_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  // Default job options
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Initial delay of 1 second
    },
    removeOnComplete: 100, // Keep only last 100 completed jobs
    removeOnFail: 200, // Keep only last 200 failed jobs
  }
};

// Queue names
const QUEUE_NAMES = {
  JOB_IMPORT: 'job-import',
};

// Create a new queue instance
const createQueue = (queueName) => {
  return new Queue(queueName, {
    connection: REDIS_CONFIG.connection,
    defaultJobOptions: REDIS_CONFIG.defaultJobOptions,
  });
};

// Create a new worker instance
const createWorker = (queueName, processor) => {
  return new Worker(queueName, processor, {
    connection: REDIS_CONFIG.connection,
    concurrency: 3, // Process up to 3 jobs simultaneously
  });
};

module.exports = {
  REDIS_CONFIG,
  QUEUE_NAMES,
  createQueue,
  createWorker,
}; 