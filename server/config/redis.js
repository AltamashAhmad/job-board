const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = process.env.REDIS_URL
  ? { 
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
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
        return Math.min(times * 50, 2000);
      }
    };

// Queue names
const QUEUE_NAMES = {
  JOB_IMPORT: 'job-import',
};

// Create Redis connection
const connection = new Redis(redisConfig);

connection.on('error', (error) => {
  console.error('Redis connection error:', error);
  // Don't exit the process on connection error, let it retry
  if (error.code !== 'ECONNREFUSED') {
    console.error('Fatal Redis error:', error);
  }
});

connection.on('connect', () => {
  console.log('Connected to Redis');
});

module.exports = {
  connection,
  QUEUE_NAMES,
  redisConfig
}; 