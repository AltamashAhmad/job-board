const queueManager = require('../queues/queueManager');
const { QUEUE_NAMES } = require('../config/redis');
const ImportLog = require('../models/ImportLog');

class JobProducerService {
  // Helper function to normalize job type
  normalizeJobType(type) {
    // Handle combined types (e.g., "Contract, Part Time")
    if (type.includes(',')) {
      // Take the first type before the comma
      return type.split(',')[0].trim();
    }
    
    // Map to valid types
    const typeMap = {
      'Contract': 'Contract',
      'Part Time': 'Part Time',
      'Full Time': 'Full Time',
      'Internship': 'Internship',
      'Temporary': 'Other',
      'Freelance': 'Contract'
    };

    return typeMap[type] || 'Other';
  }

  async addJobsToQueue(jobs, sourceUrl, sourceName) {
    try {
      // Create import log first
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

      console.log(`Created import log with ID: ${importLog._id} for source: ${sourceName}`);

      // Wait for import log to be fully saved
      await importLog.save();

      // Add each job to the queue with reference to the import log
      const queuePromises = jobs.map(job => {
        // Convert externalId object to string if needed
        const externalId = typeof job.externalId === 'object' ? job.externalId._ : job.externalId;
        
        // Normalize job type
        const type = this.normalizeJobType(job.type);

        return queueManager.addJob(QUEUE_NAMES.JOB_IMPORT, {
          job: {
            ...job,
            externalId,
            type
          },
          importLogId: importLog._id.toString()
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        });
      });

      // Wait for all jobs to be added to queue
      await Promise.all(queuePromises);

      console.log(`Added ${jobs.length} jobs to queue for source: ${sourceName}`);
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