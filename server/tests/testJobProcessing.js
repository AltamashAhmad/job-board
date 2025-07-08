require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');
const { processJob } = require('../workers/jobWorker');

// Test data
const testJobs = [
  {
    title: 'Senior JavaScript Developer',
    company: 'TechCorp',
    description: `We're looking for a Senior JavaScript Developer with 5+ years of experience.
      Required skills: React, Node.js, TypeScript, MongoDB
      Salary range: $120,000 - $180,000 per year
      Experience: 5-8 years of experience required`,
    location: 'New York, NY',
    type: 'Full Time',
    category: 'Software Development',
    url: 'https://example.com/job1',
    source: 'test_source',
    externalId: 'test_job_1'
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudTech',
    description: `Looking for a DevOps engineer with AWS experience.
      Skills needed: Docker, Kubernetes, Jenkins, AWS
      Part-time position available
      2-3 years of experience in cloud technologies`,
    location: 'Remote',
    type: 'Part Time',
    category: 'DevOps',
    url: 'https://example.com/job2',
    source: 'test_source',
    externalId: 'test_job_2'
  }
];

async function runTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up previous test data
    await Job.deleteMany({ source: 'test_source' });
    console.log('Cleaned up previous test data');

    // Create import log
    const importLog = await ImportLog.create({
      source: 'test_source',
      startTime: new Date(),
      status: 'in_progress',
      totalFetched: testJobs.length,
      newJobs: 0,
      updatedJobs: 0,
      failedJobs: 0,
      totalImported: 0
    });
    console.log('Created import log:', importLog._id);

    // Process jobs
    console.log('\nProcessing jobs...');
    for (const job of testJobs) {
      try {
        const result = await processJob({
          job,
          importLogId: importLog._id
        });
        console.log(`\nJob processed: ${job.title}`);
        console.log('Result:', result);

        // Verify job in database
        const savedJob = await Job.findById(result.jobId);
        console.log('\nVerifying job data:');
        console.log('- Title:', savedJob.title);
        console.log('- Skills:', savedJob.skills);
        console.log('- Salary:', savedJob.salary);
        console.log('- Experience:', savedJob.experience);
        console.log('- Status:', savedJob.status);
        console.log('- Metadata:', savedJob.metadata);
      } catch (error) {
        console.error(`Error processing job ${job.title}:`, error);
      }
    }

    // Test update scenario
    console.log('\nTesting job update...');
    const updatedJob = {
      ...testJobs[0],
      title: 'Senior JavaScript Developer (Updated)',
      description: testJobs[0].description + '\nUpdated position details.'
    };

    const updateResult = await processJob({
      job: updatedJob,
      importLogId: importLog._id
    });
    console.log('Update result:', updateResult);

    // Verify import log
    const finalImportLog = await ImportLog.findById(importLog._id);
    console.log('\nFinal import log status:');
    console.log('- New jobs:', finalImportLog.newJobs);
    console.log('- Updated jobs:', finalImportLog.updatedJobs);
    console.log('- Failed jobs:', finalImportLog.failedJobs);
    console.log('- Total imported:', finalImportLog.totalImported);

    // Test job search methods
    console.log('\nTesting job search methods:');
    
    // Find by source
    const sourceJobs = await Job.findBySource('test_source');
    console.log('Jobs found by source:', sourceJobs.length);

    // Find active jobs
    const activeJobs = await Job.findActiveJobs();
    console.log('Active jobs found:', activeJobs.length);

    // Find similar jobs
    const similarJobs = await Job.findSimilarJobs(updateResult.jobId);
    console.log('Similar jobs found:', similarJobs.length);

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run the tests
runTests(); 