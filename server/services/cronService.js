const cron = require('node-cron');
const { fetchJobsFromAllSources } = require('./jobFetchService');

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
      await fetchJobsFromAllSources();
      console.log('Scheduled job fetch completed successfully');
    } catch (error) {
      console.error('Error in scheduled job fetch:', error);
    }
  });

  // Run initial fetch
  try {
    console.log('Running initial job fetch...');
    await fetchJobsFromAllSources();
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