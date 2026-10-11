require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Secondary database purge safety listener for legacy mock records
    mongoose.connection.once('open', async () => {
      try {
        const Product = mongoose.models.Product || mongoose.model('Product');
        const VendorProfile = mongoose.models.VendorProfile || mongoose.model('VendorProfile');
        const res = await Product.deleteMany({
          $or: [
            { vendorName: /TechZone/i },
            { title: /TechZone/i },
          ],
        });
        const vRes = await VendorProfile.deleteMany({ storeName: /TechZone/i });
        if (res.deletedCount > 0 || vRes.deletedCount > 0) {
          console.log(`Database Hard-Purge Complete: Removed ${res.deletedCount} legacy mock vendor records and ${vRes.deletedCount} mock vendors.`);
        }
      } catch (err) {
        console.error('Database purge cleanup exception error:', err.message);
      }
    });

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
