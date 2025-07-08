const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  sourceUrl: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  totalFetched: {
    type: Number,
    required: true
  },
  totalImported: {
    type: Number,
    required: true
  },
  newJobs: {
    type: Number,
    default: 0
  },
  updatedJobs: {
    type: Number,
    default: 0
  },
  failedJobs: {
    type: Number,
    default: 0
  },
  errorLogs: [{  // Changed from 'errors' to 'errorLogs'
    message: String,
    jobData: Object
  }],
  status: {
    type: String,
    enum: ['completed', 'failed', 'in_progress'],
    default: 'in_progress'
  }
}, {
  suppressReservedKeysWarning: true  // Add this option to suppress the warning
});

module.exports = mongoose.model('ImportLog', importLogSchema); 