const { createQueue, QUEUE_NAMES } = require('../config/redis');

class QueueManager {
  constructor() {
    this.queues = new Map();
    this.initialize();
  }

  initialize() {
    // Initialize job import queue
    const jobImportQueue = createQueue(QUEUE_NAMES.JOB_IMPORT);
    this.queues.set(QUEUE_NAMES.JOB_IMPORT, jobImportQueue);

    // Set up event handlers for the queue
    jobImportQueue.on('error', (error) => {
      console.error('Job Import Queue Error:', error);
    });

    jobImportQueue.on('failed', (job, error) => {
      console.error(`Job ${job.id} failed:`, error);
    });

    console.log('Queue Manager initialized');
  }

  getQueue(queueName) {
    if (!this.queues.has(queueName)) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return this.queues.get(queueName);
  }

  async addJob(queueName, data, opts = {}) {
    const queue = this.getQueue(queueName);
    try {
      const job = await queue.add(queueName, data, {
        ...opts,
        jobId: `${queueName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
      console.log(`Job ${job.id} added to queue ${queueName}`);
      return job;
    } catch (error) {
      console.error(`Error adding job to queue ${queueName}:`, error);
      throw error;
    }
  }

  async getJobCounts(queueName) {
    const queue = this.getQueue(queueName);
    try {
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed');
      return counts;
    } catch (error) {
      console.error(`Error getting job counts for queue ${queueName}:`, error);
      throw error;
    }
  }

  async clearQueue(queueName) {
    const queue = this.getQueue(queueName);
    try {
      await queue.clean(0, 'completed');
      await queue.clean(0, 'failed');
      console.log(`Queue ${queueName} cleared`);
    } catch (error) {
      console.error(`Error clearing queue ${queueName}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new QueueManager(); 