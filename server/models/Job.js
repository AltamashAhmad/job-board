const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: String,
  type: String,
  category: String,
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  externalId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Create a compound unique index on source and externalId
jobSchema.index({ source: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Job', jobSchema); 