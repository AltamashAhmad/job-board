require('dotenv').config();
const mongoose = require('mongoose');
const { Worker } = require('bullmq');
const { QUEUE_NAMES, connection } = require('../config/redis');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');

// Connect to MongoDB
async function connectDB() {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Worker connected to MongoDB');
    }
  } catch (err) {
    console.error('Worker MongoDB connection error:', err);
    throw err;
  }
}

async function processJob(jobData) {
  await connectDB(); // Ensure DB connection before processing
  
  try {
    const { job, importLogId } = jobData;
    console.log(`Processing job: ${job.title}`);

    // Find the import log
    const importLog = await ImportLog.findById(importLogId);
    if (!importLog) {
      throw new Error(`Import log not found for ID: ${importLogId}`);
    }

    // Try to find existing job
    const existingJob = await Job.findOne({
      source: job.source,
      externalId: job.externalId
    });

    let result;
    let updateType;

    try {
      if (existingJob) {
        // Update existing job
        result = await Job.findByIdAndUpdate(
          existingJob._id,
          { ...job, lastUpdated: new Date() },
          { new: true }
        );
        updateType = 'updated';
      } else {
        // Create new job
        result = await Job.create({
          ...job,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        updateType = 'new';
      }

      // Update import log metrics
      await importLog.updateMetrics(updateType);

      console.log(`Job ${updateType}: ${result.title}`);
      return { success: true, jobId: result._id, updateType };
    } catch (error) {
      // Update failed jobs count
      await importLog.updateMetrics('failed');
      throw error;
    }
  } catch (error) {
    console.error('Job processing error:', {
      error: error.message,
      stack: error.stack,
      jobData: jobData.job
    });
    throw error;
  }
}

// Create worker with optimized concurrency and settings
const worker = new Worker(QUEUE_NAMES.JOB_IMPORT, async (job) => {
  console.log(`Processing job: ${job.data.job.title}`);
  return await processJob(job.data);
}, {
  connection,
  concurrency: 5,
  removeOnComplete: {
    age: 24 * 3600,
    count: 1000
  },
  removeOnFail: {
    age: 7 * 24 * 3600
  }
});

// Handle completion
worker.on('completed', async (job, result) => {
  await connectDB(); // Ensure DB connection
  
  try {
    const { importLogId } = job.data;
    const importLog = await ImportLog.findById(importLogId);
    
    if (importLog && importLog.isComplete()) {
      const finalStatus = importLog.getFinalStatus();
      await ImportLog.findByIdAndUpdate(importLogId, {
        status: finalStatus,
        endTime: new Date(),
        duration: new Date() - importLog.startTime
      });
      console.log(`Import completed for ${importLog.source} with status: ${finalStatus}`);
    }
  } catch (error) {
    console.error('Error in completion handler:', error);
  }
});

// Handle failures
worker.on('failed', async (job, error) => {
  await connectDB(); // Ensure DB connection
  
  try {
    const { importLogId } = job.data;
    const importLog = await ImportLog.findById(importLogId);
    if (importLog) {
      await importLog.updateMetrics('failed');
      console.error(`Job failed: ${error.message}`);
    }
  } catch (err) {
    console.error('Error in failure handler:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await mongoose.disconnect();
});

module.exports = worker; 