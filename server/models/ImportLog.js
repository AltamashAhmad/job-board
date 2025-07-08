const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    index: true
  },
  sourceUrl: {
    type: String,
    required: true,
    default: 'N/A'
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'partially_completed'],
    default: 'pending',
    index: true
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
  skippedJobs: {
    type: Number,
    default: 0
  },
  errorSummary: {
    type: Map,
    of: Number,
    default: () => new Map()
  },
  processingStats: {
    totalProcessingTime: {
      type: Number,
      default: 0
    },
    avgProcessingTime: {
      type: Number,
      default: 0
    },
    maxProcessingTime: {
      type: Number,
      default: 0
    },
    minProcessingTime: {
      type: Number,
      default: 0
    },
    processedJobsCount: {
      type: Number,
      default: 0
    }
  },
  errorLogs: [{
    message: String,
    code: {
      type: String,
      enum: [
        'FETCH_ERROR',
        'PARSE_ERROR',
        'VALIDATION_ERROR',
        'DUPLICATE_ERROR',
        'PROCESSING_ERROR',
        'DATABASE_ERROR',
        'QUEUE_ERROR',
        'UNKNOWN_ERROR'
      ]
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    jobData: Object,
    stackTrace: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => new Map()
  }
}, {
  timestamps: true
});

// Add method to calculate duration
importLogSchema.methods.calculateDuration = function() {
  if (this.endTime && this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  return this.duration;
};

// Add method to update processing stats
importLogSchema.methods.updateProcessingStats = function(processingTime) {
  // Initialize processingStats if not exists
  if (!this.processingStats) {
    this.processingStats = {
      totalProcessingTime: 0,
      avgProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: 0,
      processedJobsCount: 0
    };
  }

  // Increment processed jobs count
  this.processingStats.processedJobsCount += 1;

  // Update total processing time
  this.processingStats.totalProcessingTime += processingTime;

  // Update max processing time
  if (!this.processingStats.maxProcessingTime || processingTime > this.processingStats.maxProcessingTime) {
    this.processingStats.maxProcessingTime = processingTime;
  }

  // Update min processing time
  if (!this.processingStats.minProcessingTime || processingTime < this.processingStats.minProcessingTime) {
    this.processingStats.minProcessingTime = processingTime;
  }

  // Calculate average processing time
  this.processingStats.avgProcessingTime = 
    this.processingStats.totalProcessingTime / this.processingStats.processedJobsCount;

  return this.processingStats;
};

// Add method to categorize and log errors
importLogSchema.methods.logError = function(error, jobData = null) {
  const errorLog = {
    message: error.message,
    code: 'UNKNOWN_ERROR',
    severity: 'medium',
    jobData,
    stackTrace: error.stack,
    timestamp: new Date()
  };

  // Categorize error based on message or type
  if (error.message.includes('fetch')) {
    errorLog.code = 'FETCH_ERROR';
    errorLog.severity = 'high';
  } else if (error.message.includes('parse')) {
    errorLog.code = 'PARSE_ERROR';
    errorLog.severity = 'medium';
  } else if (error.message.includes('validation')) {
    errorLog.code = 'VALIDATION_ERROR';
    errorLog.severity = 'low';
  } else if (error.message.includes('duplicate')) {
    errorLog.code = 'DUPLICATE_ERROR';
    errorLog.severity = 'low';
  } else if (error.message.includes('process')) {
    errorLog.code = 'PROCESSING_ERROR';
    errorLog.severity = 'medium';
  } else if (error.message.includes('database')) {
    errorLog.code = 'DATABASE_ERROR';
    errorLog.severity = 'high';
  } else if (error.message.includes('queue')) {
    errorLog.code = 'QUEUE_ERROR';
    errorLog.severity = 'high';
  }

  // Update error summary
  const currentCount = this.errorSummary.get(errorLog.code) || 0;
  this.errorSummary.set(errorLog.code, currentCount + 1);

  // Add to error logs
  this.errorLogs.push(errorLog);

  // Update status if critical error
  if (errorLog.severity === 'critical') {
    this.status = 'failed';
  }
};

// Add static method to get recent imports with stats
importLogSchema.statics.getRecentImports = async function(limit = 10) {
  return this.find()
    .sort({ startTime: -1 })
    .limit(limit)
    .select('-errorLogs')
    .lean();
};

// Add static method to get import statistics
importLogSchema.statics.getImportStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$source',
        totalImports: { $sum: 1 },
        totalJobs: { $sum: '$totalImported' },
        avgDuration: { $avg: '$duration' },
        successRate: {
          $avg: {
            $divide: [
              { $subtract: ['$totalImported', '$failedJobs'] },
              { $add: ['$totalImported', 0.1] } // Add 0.1 to avoid division by zero
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('ImportLog', importLogSchema); 