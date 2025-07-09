const Redis = require('ioredis');

function createRedisClient() {
  const config = process.env.REDIS_URL
    ? {
        url: process.env.REDIS_URL,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`Retrying Redis connection in ${delay}ms...`);
          return delay;
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`Retrying Redis connection in ${delay}ms...`);
          return delay;
        }
      };

  const client = new Redis(config);

  client.on('error', (error) => {
    console.error('Redis connection error:', error);
    // Don't exit on connection errors, let it retry
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