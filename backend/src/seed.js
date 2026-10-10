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

    // 5. Create Sample Products for Approved Vendor
    const products = await Product.create([
      {
        vendor: approvedVendorProfile._id,
        user: approvedVendorUser._id,
        title: 'OmniBook Pro 16 Laptop',
        description: 'High performance 16-inch laptop with M3 Max processor, 32GB RAM, and 1TB SSD.',
        price: 1899.99,
        categories: ['Electronics', 'Computers'],
        stock: 25,
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'],
        isActive: true,
      },
      {
        vendor: approvedVendorProfile._id,
        user: approvedVendorUser._id,
        title: 'Noise-Canceling Wireless Headphones',
        description: 'Active noise cancellation with 40-hour battery life and studio-grade sound quality.',
        price: 249.99,
        categories: ['Electronics', 'Audio'],
        stock: 50,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
        isActive: true,
      },
      {
        vendor: approvedVendorProfile._id,
        user: approvedVendorUser._id,
        title: 'Ergonomic RGB Mechanical Keyboard',
        description: 'Custom hot-swappable mechanical keyboard with silent tactile switches.',
        price: 129.99,
        categories: ['Electronics', 'Accessories'],
        stock: 40,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'],
        isActive: true,
      },
    ]);

    console.log('\n=======================================================');
    console.log('✅ [Seeder] Database Seeded Successfully!');
    console.log('=======================================================');
    console.log('📌 Sample Credentials:');
    console.log('   Admin:    admin@omnimart.com       / AdminPass123!');
    console.log('   Vendor:   techstore@omnimart.com   / VendorPass123! (Approved)');
    console.log('   Vendor:   fashionhub@omnimart.com  / VendorPass123! (Pending)');
    console.log('   Customer: customer@omnimart.com   / CustomerPass123!');
    console.log('-------------------------------------------------------');
    console.log(`📦 Seeded ${products.length} active products for store '${approvedVendorProfile.storeName}'`);
    console.log('=======================================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`❌ [Seeder Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
