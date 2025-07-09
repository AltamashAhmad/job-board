require('dotenv').config();
const { createQueue } = require('../config/redis');
const { QUEUE_NAMES } = require('../config/constants');
const mongoose = require('mongoose');
const ImportLog = require('../models/ImportLog');

async function testQueue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test import log
    const importLog = await ImportLog.create({
      source: 'test',
      startTime: new Date(),
      status: 'in_progress'
    });

    // Create queue
    const jobQueue = createQueue(QUEUE_NAMES.JOB_IMPORT);

    // Add test job
    const testJob = {
      title: 'Test Job Position',
      company: 'Test Company',
      location: 'Remote',
      description: 'This is a test job posting',
      salary: '100k-150k',
      type: 'Full-time',
      source: 'test',
      externalId: 'test-123',
      url: 'https://example.com/job/123'
    };

    await jobQueue.add('process-job', {
      job: testJob,
      importLogId: importLog._id.toString()
    });

    console.log('Test job added to queue');

    // Close connections
    await mongoose.disconnect();
    await jobQueue.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQueue(); 