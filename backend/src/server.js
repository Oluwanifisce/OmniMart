require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 [OmniMart Server] Running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🌐 [OmniMart Server] Listening on port ${PORT}`);
      console.log(`📍 [Health Check] http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });

    // Handle unexpected unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`💥 [Unhandled Rejection] ${err.name}: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`❌ [Server Startup Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();
