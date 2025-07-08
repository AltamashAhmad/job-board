require('dotenv').config();
const mongoose = require('mongoose');
const { createWorker, QUEUE_NAMES } = require('../config/redis');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');

// Connect to MongoDB
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Worker connected to MongoDB');
    isConnected = true;
  } catch (err) {
    console.error('Worker MongoDB connection error:', err);
    throw err;
  }
}

async function extractSkills(description) {
  // Basic skill extraction - can be enhanced with ML/AI later
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'node', 'aws', 'sql',
    'mongodb', 'docker', 'kubernetes', 'typescript', 'angular', 'vue',
    'php', 'ruby', 'c++', 'c#', '.net', 'scala', 'rust', 'golang',
    'html', 'css', 'sass', 'less', 'webpack', 'git', 'jenkins',
    'agile', 'scrum', 'jira', 'confluence'
  ];

  const skills = new Set();
  const descLower = description.toLowerCase();

  commonSkills.forEach(skill => {
    if (descLower.includes(skill)) {
      skills.add(skill);
    }
  });

  return Array.from(skills);
}

async function extractSalary(description) {
  const salaryRegex = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:-|to)\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
  const match = description.match(salaryRegex);

  if (match) {
    const min = parseFloat(match[1].replace(/,/g, ''));
    const max = parseFloat(match[2].replace(/,/g, ''));
    return { min, max, currency: 'USD' };
  }

  return null;
}

async function extractExperience(description) {
  const expRegex = /(\d+)(?:\+)?\s*(?:-|to)?\s*(\d+)?\s*years?(?:\s+of)?\s+experience/i;
  const match = description.match(expRegex);

  if (match) {
    return {
      min: parseInt(match[1]),
      max: match[2] ? parseInt(match[2]) : null,
      required: true
    };
  }

  return null;
}

function normalizeExternalId(externalId) {
  if (typeof externalId === 'string') return externalId;
  if (typeof externalId === 'object' && externalId !== null) {
    // Handle XML feed format where externalId is an object with _ property
    if (externalId._) return externalId._;
    // Handle other potential object formats
    if (externalId.id) return externalId.id;
    if (externalId.value) return externalId.value;
  }
  // If all else fails, stringify the object
  return JSON.stringify(externalId);
}

async function processJob(jobData) {
  await connectDB(); // Ensure DB connection
  
  const { job, importLogId } = jobData;
  let result;

  try {
    // Find import log
    const importLog = await ImportLog.findById(importLogId);
    if (!importLog) {
      throw new Error(`Import log not found for ID: ${importLogId}`);
    }

    // Normalize externalId
    const normalizedExternalId = normalizeExternalId(job.externalId);

    // Enhance job data
    const enhancedJob = {
      ...job,
      externalId: normalizedExternalId,
      skills: await extractSkills(job.description),
      salary: await extractSalary(job.description),
      experience: await extractExperience(job.description),
      metadata: {
        importId: importLogId,
        lastChecked: new Date(),
        lastModified: new Date()
      }
    };

    // Check if job already exists
    const existingJob = await Job.findOne({
      source: job.source,
      externalId: normalizedExternalId
    });

    if (existingJob) {
      // Check if job needs update
      const needsUpdate = ['title', 'description', 'location', 'type', 'category', 'url'].some(
        field => existingJob[field] !== job[field]
      );

      if (needsUpdate) {
        // Update existing job
        Object.assign(existingJob, enhancedJob);
        existingJob.metadata.lastModified = new Date();
        await existingJob.save();

        // Update import log metrics
        await ImportLog.findByIdAndUpdate(
          importLogId,
          {
            $inc: { updatedJobs: 1, totalImported: 1 },
            $set: { lastUpdated: new Date() }
          }
        );

        result = { status: 'updated', jobId: existingJob._id };
      } else {
        // Job exists but no changes needed
        await ImportLog.findByIdAndUpdate(
          importLogId,
          {
            $inc: { totalImported: 1 },
            $set: { lastUpdated: new Date() }
          }
        );

        result = { status: 'unchanged', jobId: existingJob._id };
      }
    } else {
      // Create new job
      const newJob = await Job.create(enhancedJob);

      // Update import log metrics
      await ImportLog.findByIdAndUpdate(
        importLogId,
        {
          $inc: { newJobs: 1, totalImported: 1 },
          $set: { lastUpdated: new Date() }
        }
      );

      result = { status: 'created', jobId: newJob._id };
    }

    return result;
  } catch (error) {
    // Log detailed error information
    console.error('Job processing error:', {
      error: error.message,
      stack: error.stack,
      jobData: {
        title: job.title,
        company: job.company,
        source: job.source,
        externalId: job.externalId
      }
    });

    // Update import log with error
    await ImportLog.findByIdAndUpdate(
      importLogId,
      {
        $inc: { failedJobs: 1 },
        $push: {
          errorLogs: {
            message: error.message,
            stack: error.stack,
            jobData: {
              title: job.title,
              company: job.company,
              source: job.source,
              externalId: job.externalId
            },
            timestamp: new Date()
          }
        }
      }
    );

    throw error; // Re-throw to trigger job failure
  }
}

// Create worker with concurrency of 3
const worker = createWorker(QUEUE_NAMES.JOB_IMPORT, async (job) => {
  console.log(`Processing job: ${job.data.job.title}`);
  return await processJob(job.data);
}, {
  concurrency: 3,
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000 // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600 // Keep failed jobs for 7 days
  }
});

// Worker event handlers
worker.on('completed', async (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

worker.on('failed', async (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
  
  // If we have the import log ID, update its status
  if (job.data.importLogId) {
    try {
      await ImportLog.findByIdAndUpdate(job.data.importLogId, {
        $inc: { failedJobs: 1 },
        $push: {
          errorLogs: {
            message: error.message,
            stack: error.stack,
            jobData: job.data.job,
            timestamp: new Date()
          }
        }
      });
    } catch (updateError) {
      console.error('Error updating import log:', updateError);
    }
  }
});

worker.on('error', error => {
  console.error('Worker error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await mongoose.disconnect();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await worker.close();
  await mongoose.disconnect();
  process.exit(1);
});

// Export for testing
module.exports = {
  processJob,
  worker
}; 