require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { startCronJobs } = require('./services/cronService');
const { startWorker } = require('./workers/jobWorker');
const jobRoutes = require('./routes/jobRoutes');
const importRoutes = require('./routes/importRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/imports', importRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start services
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Start the server
    app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`);
      
      try {
        // Start the worker process
        await startWorker();
        console.log('Worker started successfully');
        
        // Start cron jobs
        await startCronJobs();
        console.log('Cron jobs started successfully');
      } catch (error) {
        console.error('Error starting services:', error);
        // Don't exit - let the API continue running even if background services fail
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 