require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cronService = require('./services/cronService');
const { startWorker } = require('./workers/jobWorker');
const jobRoutes = require('./routes/jobRoutes');
const importRoutes = require('./routes/importRoutes');
const { createRedisClient } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/imports', importRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const isMongoConnected = mongoose.connection.readyState === 1;
    
    // Check Redis connection
    const redisClient = createRedisClient(false);
    let isRedisConnected = false;
    try {
      await redisClient.ping();
      isRedisConnected = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    } finally {
      redisClient.disconnect();
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    const health = {
      status: isMongoConnected && isRedisConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: {
          connected: isMongoConnected,
          status: isMongoConnected ? 'up' : 'down'
        },
        redis: {
          connected: isRedisConnected,
          status: isRedisConnected ? 'up' : 'down'
        }
      },
      environment: {
        node_env: process.env.NODE_ENV,
        node_version: process.version,
        platform: process.platform,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
        }
      },
      config: {
        redis_url: process.env.REDIS_URL ? '✓ set' : '✗ not set',
        mongodb_uri: process.env.MONGODB_URI ? '✓ set' : '✗ not set',
        cors_origin: process.env.CORS_ORIGIN || 'default',
        queue_batch_size: process.env.QUEUE_BATCH_SIZE || 'default',
        queue_max_concurrency: process.env.QUEUE_MAX_CONCURRENCY || 'default'
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Connect to MongoDB and start services
async function startServer() {
  try {
    // Connect to MongoDB with optimized connection options
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });
    console.log('Connected to MongoDB');

    // Start the server
    app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`);
      
      try {
        // Start the worker process
        await startWorker();
        console.log('Worker started successfully');
        
        // Start cron jobs - handle both export types
        const startCronJobs = cronService.startCronJobs || cronService.default;
        if (typeof startCronJobs !== 'function') {
          throw new Error('startCronJobs is not properly exported from cronService');
        }
        await startCronJobs();
        console.log('Cron jobs started successfully');
      } catch (error) {
        console.error('Error starting services:', error);
        // Don't exit - let the API continue running even if background services fail
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Give the server time to finish current requests before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
}); 