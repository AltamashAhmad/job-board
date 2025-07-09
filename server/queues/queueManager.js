const { Queue } = require('bullmq');
const { connection, QUEUE_NAMES } = require('../config/redis');

class QueueManager {
  constructor() {
    this.queues = {};
  }

  getQueue(queueName) {
    if (!this.queues[queueName]) {
      this.queues[queueName] = new Queue(queueName, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      });
    }
    return this.queues[queueName];
  }

  async addJob(queueName, data, opts = {}) {
    const queue = this.getQueue(queueName);
    const job = await queue.add(`job-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`, data, opts);
    console.log(`Job ${job.id} added to queue ${queueName}`);
    return job;
  }

  async getJobCounts(queueName) {
    const queue = this.getQueue(queueName);
    return await queue.getJobCounts();
  }

  // Add method to clear queue
  async clearQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.obliterate();
    console.log(`Queue ${queueName} cleared`);
  }
}

module.exports = new QueueManager(); 