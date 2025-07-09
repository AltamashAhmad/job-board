const Redis = require('ioredis');

function createRedisClient(isWorker = false) {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  const config = {
    // Parse the full Redis URL instead of passing it directly
    ...new URL(process.env.REDIS_URL),
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: isWorker ? null : 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  };

  const client = new Redis(process.env.REDIS_URL, config);

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