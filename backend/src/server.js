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

    // Self-healing hook to automatically seed our master admin account on database boot
    mongoose.connection.once('open', async () => {
      try {
        const User = mongoose.model('User');

        // Check if the master admin email already exists in our database collection
        const adminExists = await User.findOne({ email: 'admin@omnimart.com' });

        if (!adminExists) {
          console.log("Admin account missing. Initializing automatic master seed...");

          // Create a brand-new master admin account profile record
          const newAdmin = new User({
            name: "System Administrator",
            firstname: "System",
            lastname: "Administrator",
            email: "admin@omnimart.com",
            password: "AdminPass123!", // Ensure your schema's pre-save hook handles hashing this password!
            role: "admin",
            isVerified: true
          });

          await newAdmin.save();
          console.log("Master Admin Account successfully seeded into MongoDB Atlas! 🚀");
        } else {
          console.log("Admin account verification check: Present and active.");
        }
      } catch (err) {
        console.error("Critical Admin Seeder Exception Error:", err);
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
