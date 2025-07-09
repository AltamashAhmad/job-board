const Redis = require('ioredis');

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true // Only connect when needed
  });

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

// Create Redis connection
const connection = createRedisClient();

// Queue names
const QUEUE_NAMES = {
  JOB_IMPORT: 'job-import',
};

module.exports = {
  connection,
  QUEUE_NAMES,
  createRedisClient
}; 