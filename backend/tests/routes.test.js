const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const VendorProfile = require('../src/models/VendorProfile');
const Product = require('../src/models/Product');

const JWT_SECRET = process.env.JWT_SECRET || 'omnimart_jwt_super_secret_key_change_in_production_2026';

const mockAdminId = new mongoose.Types.ObjectId().toHexString();
const mockVendorId = new mongoose.Types.ObjectId().toHexString();
const mockCustomerId = new mongoose.Types.ObjectId().toHexString();

const generateMockToken = (id, role) => {
  return jwt.sign({ id, email: `${role}@omnimart.com`, role }, JWT_SECRET, { expiresIn: '5h', algorithm: 'HS256' });
};

describe('OmniMart API Routes & Class Structure Verification', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/health should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('POST /api/v1/register without required fields should return 400 Bad Request', async () => {
    const res = await request(app).post('/api/v1/register').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Validation failed/i);
  });

  it('POST /api/v1/register with valid fields should succeed', async () => {
    jest.spyOn(User, 'create').mockResolvedValue({
      _id: mockCustomerId,
      firstname: 'Jane',
      lastname: 'Customer',
      email: 'jane@example.com',
      role: 'user',
    });

    const res = await request(app).post('/api/v1/register').send({
      firstname: 'Jane',
      lastname: 'Customer',
      email: 'jane@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('user created successfully');
    expect(res.body.data.email).toBe('jane@example.com');
    expect(res.body.data.token).toBeDefined();
  });

  it('GET /api/v1/getusers with Vendor token should return 403 Forbidden', async () => {
    const vendorToken = generateMockToken(mockVendorId, 'vendor');
    const res = await request(app)
      .get('/api/v1/getusers')
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Forbidden resource');
  });

  it('GET /api/v1/getusers with Admin token should return all users', async () => {
    jest.spyOn(User, 'find').mockResolvedValue([
      { firstname: 'System', lastname: 'Admin', role: 'admin' },
      { firstname: 'Jane', lastname: 'User', role: 'user' },
    ]);

    const adminToken = generateMockToken(mockAdminId, 'admin');
    const res = await request(app)
      .get('/api/v1/getusers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('all users fetched successfully');
    expect(res.body.data.length).toBe(2);
  });

  it('POST /api/v1/vendor/products with Pending Vendor should return 403 Forbidden', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue({
      _id: mockVendorId,
      firstname: 'Pending',
      lastname: 'Vendor',
      email: 'pending@omnimart.com',
      role: 'vendor',
    });
    jest.spyOn(VendorProfile, 'findOne').mockResolvedValue({
      _id: new mongoose.Types.ObjectId().toHexString(),
      user: mockVendorId,
      verificationStatus: 'pending',
    });

    const vendorToken = generateMockToken(mockVendorId, 'vendor');
    const res = await request(app)
      .post('/api/v1/vendor/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        title: 'New Product',
        description: 'Product description',
        price: 99.99,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/Your store account status is 'pending'/i);
  });
});
