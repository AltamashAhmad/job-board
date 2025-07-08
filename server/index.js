require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const cronService = require('./services/cronService');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Import routes
const importRoutes = require('./routes/importRoutes');
const jobRoutes = require('./routes/jobRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev')); // Logging middleware

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Connect to MongoDB and start services
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Start cron service
    await cronService.startCron();
    console.log('Cron service started');

    // Routes
    app.use('/api/imports', importRoutes);
    app.use('/api/jobs', jobRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: 'Something broke!',
        message: err.message
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer(); 