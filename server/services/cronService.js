const cron = require('node-cron');
const jobFetchService = require('./jobFetchService');
const { JOB_SOURCES } = require('../config/jobSources');

/**
 * Starts the cron jobs for fetching jobs
 * @returns {Promise<void>}
 */
async function startCronJobs() {
  console.log('Starting cron jobs...');

  // Schedule job fetching every 6 hours
  const scheduledJob = cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled job fetch...');
    try {
      for (const source of JOB_SOURCES) {
        try {
          await jobFetchService.fetchJobsFromSource(source);
          console.log(`Scheduled job fetch completed for ${source.name}`);
        } catch (error) {
          console.error(`Error fetching jobs from ${source.name}:`, error.message);
        }
      }
      console.log('Scheduled job fetch completed successfully');
    } catch (error) {
      console.error('Error in scheduled job fetch:', error);
    }
  });

  // Run initial fetch
  try {
    console.log('Running initial job fetch...');
    for (const source of JOB_SOURCES) {
      try {
        await jobFetchService.fetchJobsFromSource(source);
        console.log(`Initial job fetch completed for ${source.name}`);
      } catch (error) {
        console.error(`Error fetching jobs from ${source.name}:`, error.message);
      }
    }
    console.log('Initial job fetch completed successfully');
  } catch (error) {
    console.error('Error in initial job fetch:', error);
    // Don't throw the error - we want the server to continue running even if initial fetch fails
  }

  return scheduledJob;
}

// Export as both named and default export for compatibility
module.exports = {
  startCronJobs
};
module.exports.default = startCronJobs; 