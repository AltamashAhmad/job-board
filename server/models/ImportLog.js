const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    index: true
  },
  sourceUrl: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'partially_completed', 'failed'],
    default: 'pending',
    index: true
  },
  totalFetched: {
    type: Number,
    default: 0
  },
  totalImported: {
    type: Number,
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
    stack: String,
    jobData: Object,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
importLogSchema.index({ source: 1, createdAt: -1 });
importLogSchema.index({ status: 1, createdAt: -1 });
importLogSchema.index({ startTime: -1 });

// Method to check if all jobs are processed
importLogSchema.methods.isComplete = function() {
  return this.totalImported + this.failedJobs >= this.totalFetched;
};

// Method to get final status
importLogSchema.methods.getFinalStatus = function() {
  if (this.failedJobs === this.totalFetched) return 'failed';
  if (this.failedJobs > 0) return 'partially_completed';
  return 'completed';
};

// Method to update metrics
importLogSchema.methods.updateMetrics = async function(updateType) {
  const updates = {
    $inc: {},
    $set: { status: 'in_progress' }
  };

  if (updateType === 'new') updates.$inc.newJobs = 1;
  else if (updateType === 'updated') updates.$inc.updatedJobs = 1;
  else if (updateType === 'failed') updates.$inc.failedJobs = 1;

  updates.$inc.totalImported = updateType !== 'failed' ? 1 : 0;

  const updated = await this.constructor.findByIdAndUpdate(
    this._id,
    updates,
    { new: true }
  );

  // Check if import is complete
  if (updated.isComplete()) {
    const finalStatus = updated.getFinalStatus();
    await this.constructor.findByIdAndUpdate(
      this._id,
      {
        $set: {
          status: finalStatus,
          endTime: new Date(),
          duration: new Date() - this.startTime
        }
      }
    );
  }

  return updated;
};

module.exports = mongoose.model('ImportLog', importLogSchema); 