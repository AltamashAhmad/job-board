require('dotenv').config();
const queueManager = require('../queues/queueManager');
const { QUEUE_NAMES, createWorker } = require('../config/redis');

async function testQueue() {
  try {
    console.log('Testing Queue System...');

    // Create a test worker
    const worker = createWorker(QUEUE_NAMES.JOB_IMPORT, async (job) => {
      console.log('Processing job:', job.data);
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { processed: true, jobId: job.id };
    });

    // Add event listeners to worker
    worker.on('completed', job => {
      console.log(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed:`, err);
    });

    // Add a test job
    const testJob = await queueManager.addJob(QUEUE_NAMES.JOB_IMPORT, {
      message: 'Test job',
      timestamp: new Date().toISOString()
    });

    console.log('Test job added:', testJob.id);

    // Get queue counts
    const counts = await queueManager.getJobCounts(QUEUE_NAMES.JOB_IMPORT);
    console.log('Queue counts:', counts);

    // Wait for job to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get updated counts
    const finalCounts = await queueManager.getJobCounts(QUEUE_NAMES.JOB_IMPORT);
    console.log('Final queue counts:', finalCounts);

    // Clean up
    await worker.close();
    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testQueue(); 