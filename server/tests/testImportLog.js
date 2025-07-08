require('dotenv').config();
const mongoose = require('mongoose');
const ImportLog = require('../models/ImportLog');

async function testImportLog() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clean up previous test data
    await ImportLog.deleteMany({ source: 'test_source' });
    console.log('Cleaned up previous test data');

    // Create a new import log
    const importLog = new ImportLog({
      source: 'test_source',
      sourceUrl: 'https://test.com/feed',
      startTime: new Date(),
      status: 'in_progress',
      totalFetched: 100
    });

    // Test basic import log creation
    await importLog.save();
    console.log('\nCreated import log:', importLog._id);

    // Test error logging
    console.log('\nTesting error logging...');
    
    // Test fetch error
    const fetchError = new Error('Failed to fetch data from API');
    importLog.logError(fetchError, { url: 'https://test.com/feed' });
    console.log('Logged fetch error');

    // Test parse error
    const parseError = new Error('Failed to parse XML data');
    importLog.logError(parseError, { xml: '<test>Invalid XML</test>' });
    console.log('Logged parse error');

    // Test processing stats
    console.log('\nTesting processing stats...');
    importLog.updateProcessingStats(150); // 150ms for first job
    importLog.updateProcessingStats(200); // 200ms for second job
    importLog.updateProcessingStats(100); // 100ms for third job
    importLog.totalImported = 3;
    
    // Complete the import
    importLog.endTime = new Date();
    importLog.status = 'completed';
    importLog.calculateDuration();
    
    await importLog.save();
    console.log('Updated import log with processing stats');

    // Test recent imports query
    console.log('\nTesting recent imports query...');
    const recentImports = await ImportLog.getRecentImports(5);
    console.log('Recent imports:', recentImports.length);

    // Test import stats
    console.log('\nTesting import statistics...');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const stats = await ImportLog.getImportStats(oneMonthAgo, new Date());
    console.log('Import statistics:', stats);

    // Verify final import log state
    const finalImportLog = await ImportLog.findById(importLog._id);
    console.log('\nFinal import log state:');
    console.log('- Status:', finalImportLog.status);
    console.log('- Total fetched:', finalImportLog.totalFetched);
    console.log('- Total imported:', finalImportLog.totalImported);
    console.log('- Duration:', finalImportLog.duration, 'ms');
    console.log('- Error summary:', Object.fromEntries(finalImportLog.errorSummary));
    console.log('- Processing stats:', finalImportLog.processingStats);
    console.log('- Error logs:', finalImportLog.errorLogs.length, 'errors');

    console.log('\nAll import log tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the tests
testImportLog(); 