const JOB_SOURCES = [
  {
    url: 'https://jobicy.com/?feed=job_feed',
    name: 'jobicy_all'
  },
  {
    url: 'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
    name: 'jobicy_smm'
  },
  {
    url: 'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
    name: 'jobicy_france'
  },
  {
    url: 'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
    name: 'jobicy_design'
  },
  {
    url: 'https://jobicy.com/?feed=job_feed&job_categories=data-science',
    name: 'jobicy_data_science'
  },
  {
    url: 'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
    name: 'jobicy_copywriting'
  },
  {
    url: 'https://jobicy.com/?feed=job_feed&job_categories=business',
    name: 'jobicy_business'
  },
  {
    url: 'https://jobicy.com/?feed=job_feed&job_categories=management',
    name: 'jobicy_management'
  },
  {
    url: 'https://www.higheredjobs.com/rss/articleFeed.cfm',
    name: 'higheredjobs'
  }
];

module.exports = { JOB_SOURCES }; 