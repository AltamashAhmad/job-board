const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  sourceUrl: {
    type: String,
    required: true,
    default: 'N/A'  // Default value for test purposes
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  totalFetched: {
    type: Number,
    required: true,
    default: 0
  },
  totalImported: {
    type: Number,
    required: true,
    default: 0
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
  errorLogs: [{
    message: String,
    jobData: Object,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ImportLog', importLogSchema); 