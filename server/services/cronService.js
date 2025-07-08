const cron = require('node-cron');
const jobFetchService = require('./jobFetchService');
const { JOB_SOURCES } = require('../config/jobSources');

class CronService {
  constructor() {
    this.isRunning = false;
  }

  async fetchAllJobs() {
    if (this.isRunning) {
      console.log('Previous job fetch still running. Skipping this run.');
      return;
    }

    this.isRunning = true;
    console.log('Starting job fetch from all sources:', new Date().toISOString());

    try {
      for (const source of JOB_SOURCES) {
        console.log(`Fetching from source: ${source.name}`);
        try {
          const result = await jobFetchService.fetchJobsFromSource(source);
          console.log(`Successfully fetched ${result.jobs.length} jobs from ${source.name}`);
        } catch (error) {
          console.error(`Error fetching from ${source.name}:`, error.message);
          // Continue with next source even if one fails
          continue;
        }
      }
    } catch (error) {
      console.error('Error in fetchAllJobs:', error);
    } finally {
      this.isRunning = false;
      console.log('Completed job fetch from all sources:', new Date().toISOString());
    }
  }

  startCron() {
    // Schedule job to run every hour
    cron.schedule('0 * * * *', () => {
      this.fetchAllJobs();
    });

    // Run immediately on startup
    this.fetchAllJobs();

    console.log('Cron job scheduled to run every hour');
  }
}

module.exports = new CronService(); 