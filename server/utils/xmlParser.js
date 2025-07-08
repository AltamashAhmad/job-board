const xml2js = require('xml2js');

const parseXMLToJSON = async (xmlData) => {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });
    
    return await parser.parseStringPromise(xmlData);
  } catch (error) {
    throw new Error(`XML Parsing Error: ${error.message}`);
  }
};

module.exports = { parseXMLToJSON }; 