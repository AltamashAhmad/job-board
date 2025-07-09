const Redis = require('ioredis');

function createRedisClient(isWorker = false) {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  console.log(`Creating Redis client (${isWorker ? 'worker' : 'regular'})`);

  const options = {
    maxRetriesPerRequest: isWorker ? null : 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    }
  };

  const client = new Redis(redisUrl, options);

  client.on('connect', () => {
    console.log('Redis client connected');
  });

  client.on('error', (error) => {
    console.error('Redis connection error:', error.message);
    if (!isWorker) {
      console.log('Redis client reconnecting...');
    }
  });

  client.on('close', () => {
    console.log('Redis connection closed');
  });

  return client;
}

module.exports = {
  createRedisClient
}; 