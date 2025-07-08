const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Board API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Job Board application',
      contact: {
        name: 'API Support',
        email: 'support@jobboard.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Job: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            type: { type: 'string' },
            salary: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                currency: { type: 'string' }
              }
            },
            experience: {
              type: 'object',
              properties: {
                required: { type: 'boolean' },
                years: { type: 'number' }
              }
            },
            skills: {
              type: 'array',
              items: { type: 'string' }
            },
            status: { type: 'string', enum: ['active', 'inactive', 'draft'] },
            url: { type: 'string' },
            source: { type: 'string' },
            externalId: { type: 'string' },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Import: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            source: { type: 'string' },
            sourceUrl: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
            startTime: { type: 'string', format: 'date-time' },
            duration: { type: 'number' },
            totalFetched: { type: 'number' },
            totalImported: { type: 'number' },
            newJobs: { type: 'number' },
            updatedJobs: { type: 'number' },
            failedJobs: { type: 'number' },
            skippedJobs: { type: 'number' },
            errorSummary: { type: 'object' },
            metadata: { type: 'object' },
            processingStats: {
              type: 'object',
              properties: {
                processedJobsCount: { type: 'number' },
                totalProcessingTime: { type: 'number' },
                avgProcessingTime: { type: 'number' },
                minProcessingTime: { type: 'number' },
                maxProcessingTime: { type: 'number' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            pages: { type: 'number' },
            currentPage: { type: 'number' },
            perPage: { type: 'number' }
          }
        }
      },
      parameters: {
        page: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: { type: 'integer', default: 1 }
        },
        limit: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          schema: { type: 'integer', default: 10 }
        }
      }
    }
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

module.exports = specs; 