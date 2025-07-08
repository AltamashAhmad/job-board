const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    trim: true,
    default: 'Remote'
  },
  type: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Other'],
    default: 'Full Time'
  },
  category: {
    type: String,
    trim: true,
    index: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  externalId: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'filled', 'draft'],
    default: 'active',
    index: true
  },
  applicationDeadline: Date,
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    min: Number,
    max: Number,
    required: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    importId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImportLog'
    },
    lastChecked: Date,
    lastModified: Date,
    isVerified: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ source: 1, externalId: 1 }, { unique: true });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ updatedAt: -1 });
jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ 'metadata.lastChecked': 1 });
jobSchema.index({ status: 1, createdAt: -1 });

// Instance methods
jobSchema.methods.markAsExpired = async function() {
  this.status = 'expired';
  this.metadata.lastModified = new Date();
  return await this.save();
};

jobSchema.methods.markAsFilled = async function() {
  this.status = 'filled';
  this.metadata.lastModified = new Date();
  return await this.save();
};

// Static methods
jobSchema.statics.findBySource = function(source) {
  return this.find({ source }).sort({ createdAt: -1 });
};

jobSchema.statics.findActiveJobs = function() {
  return this.find({ 
    status: 'active',
    $or: [
      { applicationDeadline: { $gt: new Date() } },
      { applicationDeadline: null }
    ]
  }).sort({ createdAt: -1 });
};

jobSchema.statics.findSimilarJobs = function(jobId) {
  return this.findById(jobId)
    .then(job => {
      if (!job) return [];
      return this.find({
        _id: { $ne: job._id },
        $or: [
          { category: job.category },
          { company: job.company },
          { type: job.type }
        ],
        status: 'active'
      })
      .limit(5)
      .sort({ createdAt: -1 });
    });
};

// Middleware
jobSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata = this.metadata || {};
    this.metadata.lastModified = new Date();
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema); 