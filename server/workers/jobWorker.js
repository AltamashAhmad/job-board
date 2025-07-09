require('dotenv').config();
const { Worker } = require('bullmq');
const { createRedisClient, QUEUE_NAMES } = require('../config/redis');
const Job = require('../models/Job');
const mongoose = require('mongoose');

async function processJob(job) {
  console.log(`Processing job ${job.id}`);
  try {
    const jobData = job.data;
    
    // Check if job already exists
    const existingJob = await Job.findOne({ 
      sourceId: jobData.sourceId,
      source: jobData.source 
    });

    if (existingJob) {
      console.log(`Job ${jobData.sourceId} from ${jobData.source} already exists, updating...`);
      await Job.findByIdAndUpdate(existingJob._id, jobData);
      return { status: 'updated', jobId: existingJob._id };
    }

    // Create new job
    const newJob = new Job(jobData);
    await newJob.save();
    console.log(`Created new job ${newJob._id}`);
    return { status: 'created', jobId: newJob._id };

  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
}

async function startWorker() {
  // Ensure MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Create Redis connection specifically for the worker
  const connection = createRedisClient(true);

  const worker = new Worker(QUEUE_NAMES.JOB_IMPORT, processJob, {
    connection,
    concurrency: 5,
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

  console.log('Job worker started');
  return worker;
}

module.exports = {
  startWorker,
  processJob
}; 