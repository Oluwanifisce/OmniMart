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
const mockVendorProfileId = new mongoose.Types.ObjectId().toHexString();
const mockProductId = new mongoose.Types.ObjectId().toHexString();

const generateMockToken = (id, role) => {
  return jwt.sign({ id, email: `${role}@test.com`, role }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Vendor API (/api/v1/vendor) & Verification Enforcement', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Verification Status Restrictions', () => {
    it('should prevent pending vendor from creating products (403 Forbidden)', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: mockVendorId,
        role: 'vendor',
      });
      jest.spyOn(VendorProfile, 'findOne').mockResolvedValue({
        _id: mockVendorProfileId,
        user: mockVendorId,
        verificationStatus: 'pending',
      });

      const token = generateMockToken(mockVendorId, 'vendor');
      const res = await request(app)
        .post('/api/v1/vendor/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Smartphone Stand',
          description: 'Desk phone stand',
          price: 24.99,
          stock: 100,
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/pending/i);
    });

    it('should allow product creation once Admin approves the vendor', async () => {
      const mockVendorProf = {
        _id: mockVendorProfileId,
        user: mockVendorId,
        storeName: 'Gadget Zone',
        verificationStatus: 'approved',
      };

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: mockVendorId,
        role: 'vendor',
      });
      jest.spyOn(VendorProfile, 'findOne').mockResolvedValue(mockVendorProf);
      jest.spyOn(Product, 'create').mockResolvedValue({
        _id: mockProductId,
        vendor: mockVendorProfileId,
        title: 'Smartphone Stand',
        price: 24.99,
      });

      const token = generateMockToken(mockVendorId, 'vendor');
      const res = await request(app)
        .post('/api/v1/vendor/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Smartphone Stand',
          description: 'Desk phone stand',
          price: 24.99,
          stock: 100,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.product.title).toEqual('Smartphone Stand');
    });
  });
});
