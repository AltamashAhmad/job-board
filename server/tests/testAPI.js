require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const ImportLog = require('../models/ImportLog');
const Job = require('../models/Job');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up test data
    await ImportLog.deleteMany({ source: 'test_api_source' });
    await Job.deleteMany({ source: 'test_api_source' });
    console.log('Cleaned up test data');

    // Create test import log
    const importLog = new ImportLog({
      source: 'test_api_source',
      sourceUrl: 'https://test.com/feed',
      startTime: new Date(),
      status: 'completed',
      totalFetched: 100,
      totalImported: 95,
      newJobs: 80,
      updatedJobs: 15,
      failedJobs: 5
    });
    await importLog.save();
    console.log('\nCreated test import log');

    // Create test jobs
    const jobs = await Job.insertMany([
      {
        title: 'Senior React Developer',
        company: 'TechCo',
        location: 'New York',
        description: 'Looking for a senior React developer',
        source: 'test_api_source',
        externalId: 'test-job-1',
        url: 'https://test.com/jobs/1',
        skills: ['react', 'javascript', 'node.js'],
        salary: 120000,
        experienceLevel: 'senior',
        isActive: true,
        postedDate: new Date()
      },
      {
        title: 'Frontend Developer',
        company: 'WebCo',
        location: 'Remote',
        description: 'Frontend developer position',
        source: 'test_api_source',
        externalId: 'test-job-2',
        url: 'https://test.com/jobs/2',
        skills: ['react', 'css', 'html'],
        salary: 90000,
        experienceLevel: 'mid',
        isActive: true,
        postedDate: new Date()
      }
    ]);
    console.log('Created test jobs');

    // Test Import Routes
    console.log('\nTesting Import Routes:');

    // Test GET /api/imports
    console.log('\n1. Testing GET /api/imports');
    const importsResponse = await axios.get(`${API_URL}/imports`);
    console.log('Response:', {
      total: importsResponse.data.imports.length,
      stats: importsResponse.data.stats
    });

    // Test GET /api/imports/:id
    console.log('\n2. Testing GET /api/imports/:id');
    const importDetailsResponse = await axios.get(`${API_URL}/imports/${importLog._id}`);
    console.log('Response:', {
      status: importDetailsResponse.data.status,
      metrics: importDetailsResponse.data.metrics
    });

    // Test GET /api/imports/stats/summary
    console.log('\n3. Testing GET /api/imports/stats/summary');
    const importStatsResponse = await axios.get(`${API_URL}/imports/stats/summary`);
    console.log('Response:', {
      overall: importStatsResponse.data.overall,
      sourceCount: importStatsResponse.data.bySource.length
    });

    // Test Job Routes
    console.log('\nTesting Job Routes:');

    // Test GET /api/jobs
    console.log('\n1. Testing GET /api/jobs');
    const jobsResponse = await axios.get(`${API_URL}/jobs`);
    console.log('Response:', {
      total: jobsResponse.data.jobs.length,
      stats: jobsResponse.data.stats
    });

    // Test GET /api/jobs with filters
    console.log('\n2. Testing GET /api/jobs with filters');
    const filteredJobsResponse = await axios.get(`${API_URL}/jobs`, {
      params: {
        skills: 'react',
        location: 'New York'
      }
    });
    console.log('Filtered Response:', {
      total: filteredJobsResponse.data.jobs.length,
      stats: filteredJobsResponse.data.stats
    });

    // Test GET /api/jobs/:id
    console.log('\n3. Testing GET /api/jobs/:id');
    const jobDetailsResponse = await axios.get(`${API_URL}/jobs/${jobs[0]._id}`);
    console.log('Response:', {
      title: jobDetailsResponse.data.title,
      company: jobDetailsResponse.data.company
    });

    // Test GET /api/jobs/similar/:id
    console.log('\n4. Testing GET /api/jobs/similar/:id');
    const similarJobsResponse = await axios.get(`${API_URL}/jobs/similar/${jobs[0]._id}`);
    console.log('Response:', {
      similarJobs: similarJobsResponse.data.length
    });

    // Test GET /api/jobs/stats/summary
    console.log('\n5. Testing GET /api/jobs/stats/summary');
    const jobStatsResponse = await axios.get(`${API_URL}/jobs/stats/summary`);
    console.log('Response:', {
      overall: jobStatsResponse.data.overall,
      sourceCount: jobStatsResponse.data.bySource.length
    });

    console.log('\nAll API tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the tests
testAPI(); 