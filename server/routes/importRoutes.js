const express = require('express');
const router = express.Router();
const ImportLog = require('../models/ImportLog');
const ImportStatusService = require('../services/importStatusService');

/**
 * @swagger
 * /api/imports:
 *   get:
 *     summary: Get a list of imports
 *     description: Retrieve a paginated list of imports with optional filtering
 *     tags: [Imports]
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - name: source
 *         in: query
 *         description: Filter imports by source
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         description: Filter imports by status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, failed]
 *       - name: sort
 *         in: query
 *         description: Sort field and order (e.g., startTime:desc)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A paginated list of imports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Import'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     inProgress:
 *                       type: number
 *                     completed:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     partiallyCompleted:
 *                       type: number
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      source,
      startDate,
      endDate,
      sortBy = 'startTime',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (source) query.source = source;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const imports = await ImportLog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-errorLogs'); // Exclude detailed error logs for list view

    // Get total count for pagination
    const total = await ImportLog.countDocuments(query);

    // Get summary statistics
    const stats = {
      total,
      completed: await ImportLog.countDocuments({ ...query, status: 'completed' }),
      failed: await ImportLog.countDocuments({ ...query, status: 'failed' }),
      inProgress: await ImportLog.countDocuments({ ...query, status: 'in_progress' }),
      partiallyCompleted: await ImportLog.countDocuments({ ...query, status: 'partially_completed' })
    };

    res.json({
      imports,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching imports:', error);
    res.status(500).json({ error: 'Failed to fetch imports' });
  }
});

/**
 * @swagger
 * /api/imports/{id}:
 *   get:
 *     summary: Get import details
 *     description: Retrieve detailed information about a specific import
 *     tags: [Imports]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Import ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, in_progress, completed, failed]
 *                 description:
 *                   type: string
 *                 isTerminal:
 *                   type: boolean
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     totalFetched:
 *                       type: number
 *                     totalImported:
 *                       type: number
 *                     newJobs:
 *                       type: number
 *                     updatedJobs:
 *                       type: number
 *                     failedJobs:
 *                       type: number
 *                     skippedJobs:
 *                       type: number
 *                 timing:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: number
 *                     processedJobsCount:
 *                       type: number
 *                     totalProcessingTime:
 *                       type: number
 *                     avgProcessingTime:
 *                       type: number
 *                     minProcessingTime:
 *                       type: number
 *                     maxProcessingTime:
 *                       type: number
 *                 errorSummary:
 *                   type: object
 *       404:
 *         description: Import not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  try {
    const importDetails = await ImportStatusService.getStatusDetails(req.params.id);
    if (!importDetails) {
      return res.status(404).json({ error: 'Import not found' });
    }
    res.json(importDetails);
  } catch (error) {
    console.error('Error fetching import details:', error);
    res.status(500).json({ error: 'Failed to fetch import details' });
  }
});

/**
 * @swagger
 * /api/imports/{id}/errors:
 *   get:
 *     summary: Get import errors
 *     description: Retrieve error logs for a specific import
 *     tags: [Imports]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Import ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import error logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorLogs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       error:
 *                         type: string
 *                       details:
 *                         type: object
 *                 errorSummary:
 *                   type: object
 *       404:
 *         description: Import not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/errors', async (req, res) => {
  try {
    const importLog = await ImportLog.findById(req.params.id)
      .select('errorLogs errorSummary');
    
    if (!importLog) {
      return res.status(404).json({ error: 'Import not found' });
    }

    res.json({
      errorLogs: importLog.errorLogs,
      errorSummary: Object.fromEntries(importLog.errorSummary || new Map())
    });
  } catch (error) {
    console.error('Error fetching import errors:', error);
    res.status(500).json({ error: 'Failed to fetch import errors' });
  }
});

/**
 * @swagger
 * /api/imports/stats/summary:
 *   get:
 *     summary: Get import statistics
 *     description: Retrieve summary statistics about imports
 *     tags: [Imports]
 *     responses:
 *       200:
 *         description: Import statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: object
 *                   properties:
 *                     totalImports:
 *                       type: number
 *                     totalJobsFetched:
 *                       type: number
 *                     totalJobsImported:
 *                       type: number
 *                     totalNewJobs:
 *                       type: number
 *                     totalUpdatedJobs:
 *                       type: number
 *                     totalFailedJobs:
 *                       type: number
 *                     avgDuration:
 *                       type: number
 *                     avgSuccessRate:
 *                       type: number
 *                 bySource:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                       imports:
 *                         type: number
 *                       jobsFetched:
 *                         type: number
 *                       jobsImported:
 *                         type: number
 *                       failedJobs:
 *                         type: number
 *                       avgDuration:
 *                         type: number
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) dateRange.$lte = new Date(endDate);

    // Get overall stats
    const stats = await ImportLog.aggregate([
      ...(Object.keys(dateRange).length ? [{ $match: { startTime: dateRange } }] : []),
      {
        $group: {
          _id: null,
          totalImports: { $sum: 1 },
          totalJobsFetched: { $sum: '$totalFetched' },
          totalJobsImported: { $sum: '$totalImported' },
          totalNewJobs: { $sum: '$newJobs' },
          totalUpdatedJobs: { $sum: '$updatedJobs' },
          totalFailedJobs: { $sum: '$failedJobs' },
          avgDuration: { $avg: '$duration' },
          avgSuccessRate: {
            $avg: {
              $divide: [
                { $subtract: ['$totalImported', '$failedJobs'] },
                { $add: ['$totalImported', 0.1] }
              ]
            }
          }
        }
      }
    ]);

    // Get stats by source
    const sourceStats = await ImportLog.aggregate([
      ...(Object.keys(dateRange).length ? [{ $match: { startTime: dateRange } }] : []),
      {
        $group: {
          _id: '$source',
          imports: { $sum: 1 },
          jobsFetched: { $sum: '$totalFetched' },
          jobsImported: { $sum: '$totalImported' },
          failedJobs: { $sum: '$failedJobs' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      overall: stats[0] || {
        totalImports: 0,
        totalJobsFetched: 0,
        totalJobsImported: 0,
        totalNewJobs: 0,
        totalUpdatedJobs: 0,
        totalFailedJobs: 0,
        avgDuration: 0,
        avgSuccessRate: 0
      },
      bySource: sourceStats
    });
  } catch (error) {
    console.error('Error fetching import statistics:', error);
    res.status(500).json({ error: 'Failed to fetch import statistics' });
  }
});

module.exports = router; 