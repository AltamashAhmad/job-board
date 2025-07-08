require('dotenv').config();
const mongoose = require('mongoose');
const ImportLog = require('../models/ImportLog');
const ImportStatusService = require('../services/importStatusService');

async function testStatusManagement() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up previous test data
    await ImportLog.deleteMany({ source: 'test_status_source' });
    console.log('Cleaned up previous test data');

    // Create a new import log
    const importLog = new ImportLog({
      source: 'test_status_source',
      sourceUrl: 'https://test.com/feed',
      startTime: new Date(),
      status: 'pending',
      totalFetched: 0
    });

    await importLog.save();
    console.log('\nCreated initial import log:', importLog._id);

    // Test 1: Valid status transition (pending -> in_progress)
    console.log('\nTest 1: Valid status transition (pending -> in_progress)');
    let updated = await ImportStatusService.updateStatus(importLog._id, 'in_progress');
    console.log('Status updated:', updated.status);
    console.log('Start time set:', updated.startTime);

    // Test 2: Invalid status transition (in_progress -> pending)
    console.log('\nTest 2: Invalid status transition (in_progress -> pending)');
    try {
      await ImportStatusService.updateStatus(importLog._id, 'pending');
      console.log('❌ Should not allow invalid transition');
    } catch (error) {
      console.log('✅ Correctly rejected invalid transition:', error.message);
    }

    // Test 3: Update with metrics
    console.log('\nTest 3: Update with metrics');
    updated = await ImportStatusService.updateStatus(importLog._id, 'completed', {
      metrics: {
        totalFetched: 100,
        totalImported: 95,
        newJobs: 80,
        updatedJobs: 15,
        failedJobs: 5,
        skippedJobs: 0
      }
    });
    console.log('Status updated with metrics:', {
      status: updated.status,
      metrics: {
        totalFetched: updated.totalFetched,
        totalImported: updated.totalImported,
        failedJobs: updated.failedJobs
      }
    });

    // Test 4: Auto transition to partially_completed
    console.log('\nTest 4: Verify auto-transition to partially_completed');
    console.log('Final status:', updated.status);
    console.log('Duration calculated:', updated.duration);

    // Test 5: Get status details
    console.log('\nTest 5: Get status details');
    const details = await ImportStatusService.getStatusDetails(importLog._id);
    console.log('Status details:', {
      status: details.status,
      description: details.description,
      isTerminal: details.isTerminal,
      metrics: details.metrics
    });

    // Test 6: Stuck import detection
    console.log('\nTest 6: Stuck import detection');
    // Create an import that started more than 60 minutes ago
    const stuckImport = new ImportLog({
      source: 'test_status_source',
      sourceUrl: 'https://test.com/feed',
      startTime: new Date(Date.now() - 61 * 60 * 1000), // 61 minutes ago
      status: 'in_progress',
      totalFetched: 50
    });
    await stuckImport.save();

    const isStuck = await ImportStatusService.checkStuckImport(stuckImport._id, 60);
    console.log('Import stuck?', isStuck);

    // Test 7: Handle stuck imports
    console.log('\nTest 7: Handle stuck imports');
    const handledImports = await ImportStatusService.handleStuckImports(60);
    console.log('Handled stuck imports:', handledImports.length);
    console.log('Status of handled import:', handledImports[0].status);
    console.log('Failure reason:', handledImports[0].metadata.get('failureReason'));

    console.log('\nAll status management tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the tests
testStatusManagement(); 