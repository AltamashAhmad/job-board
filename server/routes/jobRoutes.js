const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get a list of jobs
 *     description: Retrieve a paginated list of jobs with optional filtering
 *     tags: [Jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - name: source
 *         in: query
 *         description: Filter jobs by source
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         description: Filter jobs by status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *       - name: location
 *         in: query
 *         description: Filter jobs by location
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         description: Filter jobs by type
 *         schema:
 *           type: string
 *       - name: skills
 *         in: query
 *         description: Filter jobs by skills (comma-separated)
 *         schema:
 *           type: string
 *       - name: sort
 *         in: query
 *         description: Sort field and order (e.g., createdAt:desc)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A paginated list of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total: 
 *                       type: number
 *                     activeJobs:
 *                       type: number
 *                     uniqueCompanies:
 *                       type: number
 *                     uniqueLocations:
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
      limit = 20,
      search,
      source,
      location,
      experienceLevel,
      skills,
      sortBy = 'postedDate',
      sortOrder = 'desc',
      salaryMin,
      salaryMax,
      isActive = true
    } = req.query;

    // Build query
    const query = {};
    
    // Active status
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;

    // Text search across multiple fields
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Exact matches
    if (source) query.source = source;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (experienceLevel) query.experienceLevel = experienceLevel;

    // Skills matching (array contains)
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArray };
    }

    // Salary range
    if (salaryMin || salaryMax) {
      query.salary = {};
      if (salaryMin) query.salary.$gte = parseInt(salaryMin);
      if (salaryMax) query.salary.$lte = parseInt(salaryMax);
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const jobs = await Job.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'); // Exclude version key

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    // Get quick stats
    const stats = {
      total,
      activeJobs: await Job.countDocuments({ ...query, isActive: true }),
      uniqueCompanies: await Job.distinct('company', query).then(arr => arr.length),
      uniqueLocations: await Job.distinct('location', query).then(arr => arr.length)
    };

    res.json({
      jobs,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job details
 *     description: Retrieve detailed information about a specific job
 *     tags: [Jobs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

/**
 * @swagger
 * /api/jobs/similar/{id}:
 *   get:
 *     summary: Get similar jobs
 *     description: Retrieve a list of jobs similar to the specified job
 *     tags: [Jobs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Job ID
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/limit'
 *     responses:
 *       200:
 *         description: List of similar jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/similar/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Find similar jobs based on skills and title keywords
    const similarJobs = await Job.find({
      _id: { $ne: job._id }, // Exclude current job
      isActive: true,
      $or: [
        { skills: { $in: job.skills } },
        { title: { $regex: job.title.split(' ').join('|'), $options: 'i' } }
      ]
    })
      .limit(5)
      .select('-__v');

    res.json(similarJobs);
  } catch (error) {
    console.error('Error fetching similar jobs:', error);
    res.status(500).json({ error: 'Failed to fetch similar jobs' });
  }
});

/**
 * @swagger
 * /api/jobs/stats/summary:
 *   get:
 *     summary: Get job statistics
 *     description: Retrieve summary statistics about jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: object
 *                   properties:
 *                     totalJobs:
 *                       type: number
 *                     activeJobs:
 *                       type: number
 *                     uniqueCompanies:
 *                       type: number
 *                     uniqueLocations:
 *                       type: number
 *                     uniqueSkills:
 *                       type: number
 *                     avgSalary:
 *                       type: number
 *                 bySource:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       source:
 *                         type: string
 *                       totalJobs:
 *                         type: number
 *                       activeJobs:
 *                         type: number
 *                       uniqueCompanies:
 *                         type: number
 *                       avgSalary:
 *                         type: number
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) dateRange.$lte = new Date(endDate);

    // Get overall stats
    const stats = await Job.aggregate([
      ...(Object.keys(dateRange).length ? [{ $match: { postedDate: dateRange } }] : []),
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          activeJobs: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgSalary: { $avg: '$salary' },
          companies: { $addToSet: '$company' },
          locations: { $addToSet: '$location' },
          skills: { $addToSet: '$skills' }
        }
      },
      {
        $project: {
          _id: 0,
          totalJobs: 1,
          activeJobs: 1,
          avgSalary: 1,
          uniqueCompanies: { $size: '$companies' },
          uniqueLocations: { $size: '$locations' },
          uniqueSkills: { $size: { $reduce: {
            input: '$skills',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }}}
        }
      }
    ]);

    // Get stats by source
    const sourceStats = await Job.aggregate([
      ...(Object.keys(dateRange).length ? [{ $match: { postedDate: dateRange } }] : []),
      {
        $group: {
          _id: '$source',
          totalJobs: { $sum: 1 },
          activeJobs: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgSalary: { $avg: '$salary' },
          companies: { $addToSet: '$company' }
        }
      },
      {
        $project: {
          source: '$_id',
          _id: 0,
          totalJobs: 1,
          activeJobs: 1,
          avgSalary: 1,
          uniqueCompanies: { $size: '$companies' }
        }
      }
    ]);

    res.json({
      overall: stats[0] || {
        totalJobs: 0,
        activeJobs: 0,
        avgSalary: 0,
        uniqueCompanies: 0,
        uniqueLocations: 0,
        uniqueSkills: 0
      },
      bySource: sourceStats
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

module.exports = router; 