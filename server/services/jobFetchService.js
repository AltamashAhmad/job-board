const axios = require('axios');
const { parseXMLToJSON } = require('../utils/xmlParser');
const { JOB_SOURCES } = require('../config/jobSources');
const jobProducerService = require('./jobProducerService');

class JobFetchService {
  async fetchJobsFromSource(source) {
    try {
      // Fetch XML data
      const response = await axios.get(source.url);
      const xmlData = response.data;

      // Parse XML to JSON
      const jsonData = await parseXMLToJSON(xmlData);

      // Normalize data based on source
      const jobs = this.normalizeJobData(jsonData, source);

      // Add jobs to queue and create import log
      const importLog = await jobProducerService.addJobsToQueue(jobs, source.url);

      return {
        jobs,
        importLog
      };
    } catch (error) {
      console.error(`Error fetching jobs from ${source.name}:`, error);
      throw error;
    }
  }

  normalizeJobData(jsonData, source) {
    if (source.name.startsWith('jobicy')) {
      return this.normalizeJobicyData(jsonData);
    } else if (source.name === 'higheredjobs') {
      return this.normalizeHigherEdJobsData(jsonData);
    }
    throw new Error(`Unknown source: ${source.name}`);
  }

  normalizeJobicyData(jsonData) {
    const items = jsonData.rss?.channel?.item;
    if (!items) return [];

    // Handle both single item and array of items
    const itemsArray = Array.isArray(items) ? items : [items];

    return itemsArray.map(item => ({
      title: item.title,
      company: item['job_listing:company'],
      description: item.description,
      location: item['job_listing:location'],
      type: item['job_listing:job_type'],
      category: item['job_listing:job_category'],
      url: item.link,
      source: 'jobicy',
      externalId: item.guid
    }));
  }

  normalizeHigherEdJobsData(jsonData) {
    const items = jsonData.rss?.channel?.item;
    if (!items) return [];

    // Handle both single item and array of items
    const itemsArray = Array.isArray(items) ? items : [items];

    return itemsArray.map(item => ({
      title: item.title,
      company: 'Higher Ed Institution', // Default as it's not provided in feed
      description: item.description,
      location: this.extractLocation(item.title),
      type: 'Full Time', // Default as it's not provided in feed
      category: 'Education',
      url: item.link,
      source: 'higheredjobs',
      externalId: item.guid
    }));
  }

  extractLocation(title) {
    // Basic location extraction from title (can be improved)
    const locationMatch = title.match(/\((.*?)\)/);
    return locationMatch ? locationMatch[1] : 'Not specified';
  }

  async getQueueStatus() {
    return await jobProducerService.getQueueStatus();
  }
}

module.exports = new JobFetchService(); 