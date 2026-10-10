const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const VendorProfile = require('../src/models/VendorProfile');

const mockUserId = new mongoose.Types.ObjectId().toHexString();

describe('Authentication API (/api/v1/auth & /api/v1)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/register', () => {
    it('should register a customer successfully', async () => {
      jest.spyOn(User, 'create').mockResolvedValue({
        _id: mockUserId,
        firstname: 'Jane',
        lastname: 'Customer',
        email: 'jane@example.com',
        role: 'user',
      });

      const res = await request(app)
        .post('/api/v1/register')
        .send({
          firstname: 'Jane',
          lastname: 'Customer',
          email: 'jane@example.com',
          password: 'Password123!',
          role: 'user',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('user created successfully');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.email).toEqual('jane@example.com');
    });

    it('should register a vendor and create a pending VendorProfile', async () => {
      jest.spyOn(VendorProfile, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue({
        _id: mockUserId,
        firstname: 'Tech',
        lastname: 'Vendor',
        email: 'tech@example.com',
        role: 'vendor',
      });
      jest.spyOn(VendorProfile, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId().toHexString(),
        user: mockUserId,
        storeName: 'Tech World Store',
        verificationStatus: 'pending',
      });

      const res = await request(app)
        .post('/api/v1/vendor/register')
        .send({
          firstname: 'Tech',
          lastname: 'Vendor',
          email: 'tech@example.com',
          password: 'Password123!',
          role: 'vendor',
          storeName: 'Tech World Store',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('vendor created successfully');
      expect(res.body.data.vendorProfile).toBeDefined();
      expect(res.body.data.vendorProfile.storeName).toEqual('Tech World Store');
    });

    it('should prevent registration with duplicate email', async () => {
      const duplicateErr = new Error('Duplicate key');
      duplicateErr.code = 11000;
      jest.spyOn(User, 'create').mockRejectedValue(duplicateErr);

      const res = await request(app)
        .post('/api/v1/register')
        .send({
          firstname: 'New',
          lastname: 'User',
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/user already exist/i);
    });
  });

  describe('POST /api/v1/login', () => {
    it('should log in user with correct credentials and return JWT', async () => {
      const mockUser = {
        _id: mockUserId,
        firstname: 'Login',
        lastname: 'User',
        email: 'login@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app)
        .post('/api/v1/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('login successful');
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject login with non-existent email', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/v1/login')
        .send({
          email: 'notfound@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/account does not exist/i);
    });
  });
});
