const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Product = require('../src/models/Product');

const mockApprovedVendorId = new mongoose.Types.ObjectId().toHexString();

describe('Public Products API (/api/v1/products & /api/products)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/products', () => {
    it('should return products from approved vendors', async () => {
      const mockProducts = [
        {
          _id: new mongoose.Types.ObjectId().toHexString(),
          title: 'Gaming Laptop',
          price: 1200.0,
          categories: ['Electronics', 'Computers'],
          vendor: { storeName: 'Approved Tech Store', verificationStatus: 'approved' },
        },
        {
          _id: new mongoose.Types.ObjectId().toHexString(),
          title: 'Bluetooth Speaker',
          price: 59.99,
          categories: ['Electronics', 'Audio'],
          vendor: { storeName: 'Approved Tech Store', verificationStatus: 'approved' },
        },
      ];

      jest.spyOn(Product, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockProducts),
              }),
            }),
          }),
        }),
      });
      jest.spyOn(Product, 'countDocuments').mockResolvedValue(2);

      const res = await request(app).get('/api/v1/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(2);
    });

    it('GET /api/v1/products/categories/all should return distinct categories', async () => {
      jest.spyOn(Product, 'distinct').mockResolvedValue(['Electronics', 'Audio', 'Computers']);

      const res = await request(app).get('/api/v1/products/categories/all');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.categories).toContain('Electronics');
    });
  });
});
