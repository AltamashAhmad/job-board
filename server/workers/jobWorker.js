require('dotenv').config();
const { Worker } = require('bullmq');
const { createRedisClient } = require('../config/redis');
const { QUEUE_NAMES } = require('../config/constants');
const { MAX_CONCURRENCY } = require('../queues/queueManager');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');
const mongoose = require('mongoose');

async function processJob(job) {
  console.log(`Processing job ${job.id}`);
  try {
    const jobData = job.data;
    
    // Extract the actual job data from the wrapped structure
    const actualJobData = jobData.job || jobData;
    const importLogId = jobData.importLogId;
    
    console.log('Processing job data:', {
      title: actualJobData.title,
      company: actualJobData.company,
      source: actualJobData.source,
      externalId: actualJobData.externalId
    });
    
    // Check if job already exists using externalId and source
    const existingJob = await Job.findOne({ 
      externalId: actualJobData.externalId,
      source: actualJobData.source 
    });

    if (existingJob) {
      console.log(`Job ${actualJobData.externalId} from ${actualJobData.source} already exists, updating...`);
      await Job.findByIdAndUpdate(existingJob._id, {
        ...actualJobData,
        metadata: {
          ...actualJobData.metadata,
          importId: importLogId ? new mongoose.Types.ObjectId(importLogId) : undefined
        }
      });
      
      // Update import log with the result
      if (importLogId) {
        await updateImportLog(importLogId, 'updated');
      }
      
      return { status: 'updated', jobId: existingJob._id };
    }

    // Create new job
    const newJob = new Job({
      ...actualJobData,
      metadata: {
        ...actualJobData.metadata,
        importId: importLogId ? new mongoose.Types.ObjectId(importLogId) : undefined
      }
    });
    await newJob.save();
    console.log(`Created new job ${newJob._id}`);
    
    // Update import log with the result
    if (importLogId) {
      await updateImportLog(importLogId, 'created');
    }
    
    return { status: 'created', jobId: newJob._id };

  } catch (error) {
    console.error('Error processing job:', error);
    
    // Update import log with failure
    if (importLogId) {
      await updateImportLog(importLogId, 'failed');
    }
    
    throw error;
  }
}

async function updateImportLog(importLogId, result) {
  try {
    const importLog = await ImportLog.findById(importLogId);
    if (importLog) {
      // Use the model's updateMetrics method for correct status tracking
      await importLog.updateMetrics(result === 'created' ? 'new' : result);
    }
  } catch (error) {
    console.error('Error updating import log:', error);
  }
}

async function startWorker() {
  try {
    // Ensure MongoDB is connected with optimized connection options
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
    }

    // Create Redis connection specifically for the worker
    const connection = createRedisClient(true);

    const worker = new Worker(QUEUE_NAMES.JOB_IMPORT, processJob, {
      connection,
      concurrency: MAX_CONCURRENCY,
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000 // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 24 * 3600 // Keep failed jobs for 24 hours
      }
    });

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
    });

    worker.on('error', (err) => {
      console.error('Worker error:', err);
    });

    console.log(`Job worker started with concurrency ${MAX_CONCURRENCY}`);
    return worker;
  } catch (error) {
    console.error('Error starting worker:', error);
    throw error;
  }
}

module.exports = {
  startWorker,
  processJob
}; 