const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
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

connection.on('error', (error) => {
  console.error('Redis connection error:', error);
});

connection.on('connect', () => {
  console.log('Connected to Redis');
});

module.exports = {
  connection,
  QUEUE_NAMES,
  redisConfig
}; 