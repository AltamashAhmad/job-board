const queueManager = require('../queues/queueManager');
const { QUEUE_NAMES } = require('../config/redis');
const ImportLog = require('../models/ImportLog');

class JobProducerService {
  async addJobsToQueue(jobs, sourceUrl, sourceName) {
    try {
      const importLog = await ImportLog.create({
        source: sourceName,
        sourceUrl,
        startTime: new Date(),
        totalFetched: jobs.length,
        totalImported: 0,
        status: 'in_progress',
        newJobs: 0,
        updatedJobs: 0,
        failedJobs: 0
      });

      // Add each job to the queue with reference to the import log
      const queuePromises = jobs.map(job => 
        queueManager.addJob(QUEUE_NAMES.JOB_IMPORT, {
          job,
          importLogId: importLog._id
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        })
      );

      // Wait for all jobs to be added to queue
      await Promise.all(queuePromises);

      console.log(`Added ${jobs.length} jobs to queue for source: ${sourceName} (${sourceUrl})`);
      return importLog;
    } catch (error) {
      console.error('Error in addJobsToQueue:', error);
      throw error;
    }
  }

  async getQueueStatus() {
    try {
      const counts = await queueManager.getJobCounts(QUEUE_NAMES.JOB_IMPORT);
      return {
        ...counts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      throw error;
    }
  }
}

module.exports = new JobProducerService(); 