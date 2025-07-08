const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cronService = require('./services/cronService');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start cron service after successful database connection
    cronService.startCron();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes will be added here

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 