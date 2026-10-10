const mongoose = require('mongoose');

/**
 * Establishes database connection with Mongoose.
 * Connects to process.env.MONGODB_URI with clear console log feedback.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omnimart';
    
    // Set strictQuery to false explicitly to prevent Mongoose deprecation warnings
    mongoose.set('strictQuery', false);

    console.log(`[DB] Attempting MongoDB connection to: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`=======================================================`);
    console.log(`✅ [DB] MongoDB Connected Successfully!`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Database Name: ${mongoose.connection.name}`);
    console.log(`=======================================================`);
    return mongoose.connection;
  } catch (error) {
    console.error(`=======================================================`);
    console.error(`❌ [DB] MongoDB Connection Error: ${error.message}`);
    console.error(`   Please ensure MongoDB daemon is running or update MONGODB_URI in backend/.env`);
    console.error(`=======================================================`);
    throw error;
  }
};

/**
 * Disconnects DB connection.
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log(`[DB] MongoDB disconnected cleanly.`);
  } catch (err) {
    console.error(`[DB] Error during disconnection: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
