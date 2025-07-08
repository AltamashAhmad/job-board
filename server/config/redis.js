const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

// Queue names
const QUEUE_NAMES = {
  JOB_IMPORT: 'job-import',
};

// Create Redis connection
const connection = new Redis(redisConfig);

// Create queue
const createQueue = (queueName) => {
  return new Queue(queueName, {
    connection: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,  // Keep last 100 completed jobs
      removeOnFail: 200,      // Keep last 200 failed jobs
    },
  });
};

// Create worker
const createWorker = (queueName, processor) => {
  return new Worker(queueName, processor, {
    connection: redisConfig,
    concurrency: 3,
    limiter: {
      max: 100,        // Max jobs per time window
      duration: 1000,  // Time window in ms
    },
  });
};

// Export queue manager functions and constants
module.exports = {
  connection,
  createQueue,
  createWorker,
  QUEUE_NAMES,
}; 