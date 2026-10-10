const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Review = require('../src/models/Review');
const User = require('../src/models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'omnimart_jwt_super_secret_key_change_in_production_2026';

const mockUserId = new mongoose.Types.ObjectId().toHexString();
const mockProductId = new mongoose.Types.ObjectId().toHexString();
const mockVendorId = new mongoose.Types.ObjectId().toHexString();

const generateMockToken = (id, role = 'user') => {
  return jwt.sign({ id, email: 'user@test.com', role }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Extra Modules Verification (Cart, Orders, Reviews, Uploads)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Cart API (/api/v1/cart)', () => {
    it('GET /api/v1/cart should return empty cart for new user', async () => {
      jest.spyOn(Cart, 'findOne').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });
      jest.spyOn(Cart, 'create').mockResolvedValue({
        user: mockUserId,
        items: [],
      });

      const token = generateMockToken(mockUserId, 'user');
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Cart fetched successfully');
      expect(res.body.data.items).toEqual([]);
    });

    it('POST /api/v1/cart should reject missing productId with 400', async () => {
      const token = generateMockToken(mockUserId, 'user');
      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('productId is required');
    });
  });

  describe('Order API (/api/v1/orders)', () => {
    it('POST /api/v1/orders without shipping address should return 400', async () => {
      const token = generateMockToken(mockUserId, 'user');
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Shipping address details/i);
    });

    it('GET /api/v1/orders/my-orders should return customer order list', async () => {
      jest.spyOn(Order, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { _id: 'order123', totalAmount: 199.99, orderStatus: 'processing' },
          ]),
        }),
      });

      const token = generateMockToken(mockUserId, 'user');
      const res = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Customer orders fetched successfully');
      expect(res.body.count).toBe(1);
    });
  });

  describe('Review API (/api/v1/products/:id/reviews)', () => {
    it('POST review with invalid rating should return 400', async () => {
      const token = generateMockToken(mockUserId, 'user');
      const res = await request(app)
        .post(`/api/v1/products/${mockProductId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 10, comment: 'Great product' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Rating must be between 1 and 5 stars/i);
    });

    it('GET product reviews should return review array', async () => {
      jest.spyOn(Review, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([
            { rating: 5, comment: 'Awesome quality!' },
          ]),
        }),
      });

      const res = await request(app).get(`/api/v1/products/${mockProductId}/reviews`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Product reviews fetched successfully');
      expect(res.body.count).toBe(1);
    });
  });
});
