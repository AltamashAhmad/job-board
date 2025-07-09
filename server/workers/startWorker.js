require('dotenv').config();
const path = require('path');

// Load worker process
require(path.join(__dirname, 'jobWorker.js'));
 
console.log('Worker process started...'); 