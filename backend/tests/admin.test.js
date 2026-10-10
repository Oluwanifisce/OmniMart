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
const mockVendorProfileId = new mongoose.Types.ObjectId().toHexString();

const generateMockToken = (id, role) => {
  return jwt.sign({ id, email: `${role}@test.com`, role }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Admin API (/api/v1/admin) & Role-Based Security', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('RBAC Protection Verification', () => {
    it('should reject unauthenticated access to admin routes with 401', async () => {
      const res = await request(app).get('/api/v1/admin/analytics');
      expect(res.statusCode).toEqual(401);
    });

    it('should prevent Customer role from accessing admin routes with 403 Forbidden', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: mockCustomerId,
        firstname: 'Customer',
        role: 'user',
      });

      const token = generateMockToken(mockCustomerId, 'user');
      const res = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should prevent Vendor role from accessing admin routes with 403 Forbidden', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: mockVendorId,
        firstname: 'Vendor',
        role: 'vendor',
      });

      const token = generateMockToken(mockVendorId, 'vendor');
      const res = await request(app)
        .get('/api/v1/admin/vendors')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/v1/admin/vendors', () => {
    it('should allow Admin to list vendor profiles', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: mockAdminId,
        role: 'admin',
      });

      jest.spyOn(VendorProfile, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                { storeName: 'Test Vendor Store', verificationStatus: 'pending' },
              ]),
            }),
          }),
        }),
      });
      jest.spyOn(VendorProfile, 'countDocuments').mockResolvedValue(1);

      const token = generateMockToken(mockAdminId, 'admin');
      const res = await request(app)
        .get('/api/v1/admin/vendors')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.vendors.length).toEqual(1);
    });
  });

  describe('PATCH /api/v1/admin/vendors/:id/status', () => {
    it('should allow Admin to approve a pending vendor', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: mockAdminId,
        role: 'admin',
      });

      const mockVendorDoc = {
        _id: mockVendorProfileId,
        storeName: 'Test Vendor Store',
        verificationStatus: 'pending',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(VendorProfile, 'findById').mockResolvedValue(mockVendorDoc);

      const token = generateMockToken(mockAdminId, 'admin');
      const res = await request(app)
        .patch(`/api/v1/admin/vendors/${mockVendorProfileId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          verificationStatus: 'approved',
          commissionRate: 7.5,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
