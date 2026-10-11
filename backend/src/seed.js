require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const VendorProfile = require('./models/VendorProfile');
const Product = require('./models/Product');

const seedData = async () => {
  try {
    console.log('🌱 [Seeder] Starting database seeding procedure...');
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      VendorProfile.deleteMany({}),
      Product.deleteMany({}),
    ]);
    console.log('🧹 [Seeder] Cleared existing Users, VendorProfiles, and Products.');

    // 1. Create Admin User
    const admin = await User.create({
      firstname: 'System',
      lastname: 'Administrator',
      email: 'admin@omnimart.com',
      password: 'AdminPass123!',
      role: 'admin',
    });

    // 2. Create Approved Vendor User & Profile
    const approvedVendorUser = await User.create({
      firstname: 'Alex',
      lastname: 'TechStore',
      email: 'techstore@omnimart.com',
      password: 'VendorPass123!',
      role: 'vendor',
    });

    const approvedVendorProfile = await VendorProfile.create({
      user: approvedVendorUser._id,
      storeName: 'TechZone Electronics',
      description: 'Premium gadgets, laptops, and consumer audio gear.',
      contactEmail: 'contact@techzone.com',
      phone: '+1-555-0199',
      verificationStatus: 'approved',
      commissionRate: 8.5,
    });

    // 3. Create Pending Vendor User & Profile
    const pendingVendorUser = await User.create({
      firstname: 'Sarah',
      lastname: 'Fashion',
      email: 'fashionhub@omnimart.com',
      password: 'VendorPass123!',
      role: 'vendor',
    });

    const pendingVendorProfile = await VendorProfile.create({
      user: pendingVendorUser._id,
      storeName: 'Fashion Hub Boutique',
      description: 'Modern apparel, designer shoes, and hand-crafted accessories.',
      contactEmail: 'info@fashionhub.com',
      phone: '+1-555-0288',
      verificationStatus: 'pending',
      commissionRate: 10.0,
    });

    // 4. Create Customer User
    const customer = await User.create({
      firstname: 'Jane',
      lastname: 'Customer',
      email: 'customer@omnimart.com',
      password: 'CustomerPass123!',
      role: 'user',
    });

    // 5. Products initialization (Hardcoded TechZone dev-seed products purged)
    const products = [];

    console.log('\n=======================================================');
    console.log('✅ [Seeder] Database Seeded Successfully!');
    console.log('=======================================================');
    console.log('📌 Sample Credentials:');
    console.log('   Admin:    admin@omnimart.com       / AdminPass123!');
    console.log('   Vendor:   techstore@omnimart.com   / VendorPass123! (Approved)');
    console.log('   Vendor:   fashionhub@omnimart.com  / VendorPass123! (Pending)');
    console.log('   Customer: customer@omnimart.com   / CustomerPass123!');
    console.log('-------------------------------------------------------');
    console.log('📦 Hardcoded TechZone dev-seed products purged — ready for live vendor uploads');
    console.log('=======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`❌ [Seeder Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
