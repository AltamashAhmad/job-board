const Redis = require('ioredis');

function createRedisClient(isWorker = false) {
  const config = {
    url: process.env.REDIS_URL,
    lazyConnect: true // Only connect when needed
  };

  // BullMQ workers require maxRetriesPerRequest to be null
  if (!isWorker) {
    config.maxRetriesPerRequest = 3;
    config.retryStrategy = function(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    };
  }

  const client = new Redis(config);

  client.on('error', (error) => {
    console.error('Redis connection error:', error.message);
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
  });

  client.on('ready', () => {
    console.log('Redis client ready');
  });

  client.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
  });

  return client;
}

// Create default Redis connection for general use
const connection = createRedisClient(false);

// Queue names
const QUEUE_NAMES = {
  JOB_IMPORT: 'job-import',
};

module.exports = {
  connection,
  createRedisClient,
  QUEUE_NAMES,
}; 