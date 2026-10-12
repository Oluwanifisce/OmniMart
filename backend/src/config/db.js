const mongoose = require('mongoose');

/**
 * Establishes database connection with Mongoose.
 * Connects to process.env.MONGODB_URI with clear console log feedback.
 */
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/omnimart';
    
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

    // Hard-purge legacy mock dev records (TechZone Electronics) from database
    await purgeLegacyMockData();

    // Verify and self-heal master admin account
    await seedMasterAdmin();

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
 * Self-healing hook to automatically seed our master admin account on database boot
 */
const seedMasterAdmin = async () => {
  try {
    const User = mongoose.models.User || require('../models/User');

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
        isVerified: true,
      });

      await newAdmin.save();
      console.log("Master Admin Account successfully seeded into MongoDB Atlas! 🚀");
    } else {
      console.log("Admin account verification check: Present and active.");
    }
  } catch (err) {
    console.error("Critical Admin Seeder Exception Error:", err);
  }
};

// Self-healing hook to automatically seed our master admin account on database boot
mongoose.connection.once('open', seedMasterAdmin);

/**
 * Hard-purges legacy dev mock records (TechZone Electronics) from MongoDB
 */
const purgeLegacyMockData = async () => {
  try {
    const Product = mongoose.models.Product || require('../models/Product');
    const VendorProfile = mongoose.models.VendorProfile || require('../models/VendorProfile');

    const mockVendors = await VendorProfile.find({
      $or: [
        { storeName: /TechZone/i },
        { contactEmail: /techzone/i },
      ],
    }).select('_id').lean();

    const mockVendorIds = mockVendors.map((v) => v._id);

    const prodRes = await Product.deleteMany({
      $or: [
        { vendor: { $in: mockVendorIds } },
        { title: /TechZone/i },
        { description: /TechZone/i },
      ],
    });

    const vendorRes = await VendorProfile.deleteMany({
      $or: [
        { storeName: /TechZone/i },
        { contactEmail: /techzone/i },
      ],
    });

    if (prodRes.deletedCount > 0 || vendorRes.deletedCount > 0) {
      console.log(`⚡ [Database Hard-Purge Complete] Removed ${prodRes.deletedCount} legacy mock products and ${vendorRes.deletedCount} mock vendor profiles.`);
    }
  } catch (err) {
    console.error('Database purge cleanup exception error:', err.message);
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
