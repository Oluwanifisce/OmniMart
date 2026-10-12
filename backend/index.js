require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./api/database/connectDB');

// Production Server Build Alignment Sync Track
// Ensure database connection on serverless execution
connectDB().catch((err) => console.error('Serverless Mongo Connection Error:', err));

module.exports = app;
