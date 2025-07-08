const xml2js = require('xml2js');

const parseXMLToJSON = async (xmlData) => {
  try {
    // Add RSS header if missing
    if (!xmlData.includes('<?xml')) {
      xmlData = '<?xml version="1.0" encoding="UTF-8"?>' + xmlData;
    }

    // Remove any problematic characters
    xmlData = xmlData.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      strict: false,
      trim: true,
      normalize: true,
      attrValueProcessors: [
        (value) => value || ''  // Convert undefined/null attributes to empty string
      ],
      tagNameProcessors: [
        (name) => name.toLowerCase(), // Convert tags to lowercase
        (name) => name.replace(':', '_') // Replace colons with underscores for compatibility
      ],
      attrNameProcessors: [
        (name) => name.toLowerCase(), // Convert attribute names to lowercase
        (name) => name.replace(':', '_') // Replace colons with underscores for compatibility
      ],
      // Add custom entity handling
      customEntities: {
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&quot;': '"'
      }
    });
    
    const result = await parser.parseStringPromise(xmlData);

    // Additional validation
    if (!result || (!result.rss && !result.feed)) {
      throw new Error('Invalid RSS/Feed format');
    }

    return result;
  } catch (error) {
    console.error('XML Parsing Error Details:', {
      message: error.message,
      stack: error.stack,
      sampleData: xmlData.substring(0, 500) // Log first 500 chars for debugging
    });
    throw new Error(`XML Parsing Error: ${error.message}`);
  }
};

module.exports = { parseXMLToJSON }; 