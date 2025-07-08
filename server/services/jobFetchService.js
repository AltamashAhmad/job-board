const axios = require('axios');
const { parseXMLToJSON } = require('../utils/xmlParser');
const { JOB_SOURCES } = require('../config/jobSources');
const jobProducerService = require('./jobProducerService');

class JobFetchService {
  async fetchJobsFromSource(source) {
    try {
      // Configure headers based on source
      const headers = this.getSourceHeaders(source);
      
      // Fetch XML data with proper headers
      console.log(`Fetching data from URL: ${source.url}`);
      const response = await axios.get(source.url, { headers });
      
      // Validate response
      if (!response.data || typeof response.data !== 'string') {
        throw new Error('Invalid response format');
      }

      // Check for error pages
      if (response.data.includes('Pardon Our Interruption') || 
          response.data.includes('Access Denied') ||
          response.data.includes('Please verify you\'re a human')) {
        throw new Error('Access blocked or requires authentication');
      }

      console.log(`Response received from ${source.name}, data length: ${response.data.length}`);
      console.log('Sample of response data:', response.data.substring(0, 500));
      
      const xmlData = response.data;

      // Parse XML to JSON
      console.log(`Parsing XML data for ${source.name}...`);
      const jsonData = await parseXMLToJSON(xmlData);
      console.log('Parsed JSON data structure:', JSON.stringify(jsonData, null, 2).substring(0, 500));

      // Normalize data based on source
      const jobs = this.normalizeJobData(jsonData, source);
      console.log(`Normalized ${jobs.length} jobs from ${source.name}`);
      if (jobs.length > 0) {
        console.log('Sample job:', JSON.stringify(jobs[0], null, 2));
      }

      // Add jobs to queue and create import log
      const importLog = await jobProducerService.addJobsToQueue(jobs, source.url, source.name);

      return {
        jobs,
        importLog
      };
    } catch (error) {
      console.error(`Error fetching jobs from ${source.name}:`, {
        message: error.message,
        stack: error.stack,
        url: source.url,
        name: source.name
      });
      throw error;
    }
  }

  getSourceHeaders(source) {
    const baseHeaders = {
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      'User-Agent': 'Mozilla/5.0 (compatible; JobBoard/1.0; +https://jobboard.com)'
    };

    // Add source-specific headers
    if (source.name === 'higheredjobs') {
      return {
        ...baseHeaders,
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      };
    }

    return baseHeaders;
  }

  normalizeJobData(jsonData, source) {
    if (source.name.startsWith('jobicy')) {
      return this.normalizeJobicyData(jsonData, source.name);
    } else if (source.name === 'higheredjobs') {
      return this.normalizeHigherEdJobsData(jsonData);
    }
    throw new Error(`Unknown source: ${source.name}`);
  }

  normalizeJobicyData(jsonData, sourceName) {
    console.log('Normalizing Jobicy data, structure:', Object.keys(jsonData));
    const items = jsonData.rss?.channel?.item;
    if (!items) {
      console.log('No items found in Jobicy feed. Channel structure:', Object.keys(jsonData.rss?.channel || {}));
      return [];
    }

    // Handle both single item and array of items
    const itemsArray = Array.isArray(items) ? items : [items];
    console.log(`Found ${itemsArray.length} items in Jobicy feed`);

    return itemsArray.map(item => ({
      title: item.title,
      company: item['job_listing:company'] || item['job_listing_company'] || item.company,
      description: item.description,
      location: item['job_listing:location'] || item['job_listing_location'] || item.location,
      type: item['job_listing:job_type'] || item['job_listing_job_type'] || item.type,
      category: item['job_listing:job_category'] || item['job_listing_job_category'] || item.category,
      url: item.link,
      source: sourceName,
      externalId: item.guid || item.id || item.link
    }));
  }

  normalizeHigherEdJobsData(jsonData) {
    console.log('Normalizing HigherEd data, structure:', Object.keys(jsonData));
    
    // Handle different possible RSS structures
    const items = jsonData.rss?.channel?.item || 
                 jsonData.feed?.entry ||
                 jsonData.feed?.item;
                 
    if (!items) {
      console.log('No items found in HigherEd feed. Feed structure:', JSON.stringify(jsonData, null, 2).substring(0, 500));
      return [];
    }

    // Handle both single item and array of items
    const itemsArray = Array.isArray(items) ? items : [items];
    console.log(`Found ${itemsArray.length} items in HigherEd feed`);

    return itemsArray.map(item => {
      // Extract location and institution from title
      const { location, institution } = this.parseHigherEdTitle(item.title);
      
      return {
        title: item.title,
        company: institution || 'Higher Ed Institution',
        description: item.description || item.summary || item.content,
        location: location || 'Not specified',
        type: this.extractJobType(item.title, item.description),
        category: 'Education',
        url: item.link?.href || item.link || item.url,
        source: 'higheredjobs',
        externalId: item.guid || item.id || item.link
      };
    });
  }

  parseHigherEdTitle(title) {
    if (!title) return { location: null, institution: null };

    // Try to extract institution and location
    // Format usually: "Job Title - Institution Name (Location)"
    const matches = title.match(/^(.*?)(?:\s*-\s*(.*?))?\s*\((.*?)\)$/);
    if (matches) {
      const [, , institution, location] = matches;
      return { location, institution };
    }

    // Fallback: just try to get location from parentheses
    const locationMatch = title.match(/\((.*?)\)/);
    return {
      location: locationMatch ? locationMatch[1] : null,
      institution: null
    };
  }

  extractJobType(title, description) {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    if (text.includes('part time') || text.includes('part-time')) {
      return 'Part Time';
    } else if (text.includes('contract') || text.includes('temporary')) {
      return 'Contract';
    } else if (text.includes('internship')) {
      return 'Internship';
    }
    
    return 'Full Time'; // Default
  }

  async getQueueStatus() {
    return await jobProducerService.getQueueStatus();
  }
}

module.exports = new JobFetchService(); 