# OmniMart - Multi-Vendor E-Commerce Platform (MERN Backend)

OmniMart is a multi-vendor MERN stack e-commerce backend built with Node.js, Express, and Mongoose, featuring Role-Based Access Control (RBAC) for **Admin**, **Vendor**, and **Customer** roles.

---

## 🌟 Key Architectural Features

- **Monorepo Structure**: Structured for concurrent backend and frontend workspace development.
- **Three-Tier User Roles**:
  - **Admin**: Global platform management, vendor profile approvals, status suspension, commission rate configuration, and global analytics metrics.
  - **Vendor**: Store profile management, vendor-isolated product CRUD operations, protected by vendor verification approval checks.
  - **Customer**: Public catalog search, multi-category tag filtering, price range queries, and user profile management.
- **Strict Security & RBAC Middleware**:
  - Pre-save password hashing with `bcryptjs`.
  - Signed JWT tokens carrying user payload (`id`, `email`, `role`).
  - Middleware guards (`authenticateToken`, `authorizeRoles`, `requireApprovedVendor`).
  - Request data sanitization and express-validator validation pipelines.
- **Zero-Config Database Connector**: Connects seamlessly to a standard MongoDB URI (`MONGODB_URI`) or automatically falls back to an in-memory database (`mongodb-memory-server`) for zero-dependency instant testing.

---

## 📁 Repository Structure

```
OmniMart/
├── backend/
│   ├── src/
│   │   ├── config/          # Mongoose DB connection & memory-server fallback
│   │   ├── controllers/     # Auth, Admin, Vendor, Product controllers
│   │   ├── middleware/      # Auth, RBAC, Vendor verification & error handler
│   │   ├── models/          # User, VendorProfile, Product Mongoose schemas
│   │   ├── routes/          # Express API route modules
│   │   ├── app.js           # Express app initialization
│   │   ├── server.js        # Server listener entry point
│   │   └── seed.js          # Database seeder script
│   ├── tests/               # Jest & Supertest integration suite
│   ├── .env.example
│   └── package.json
├── postman/
│   ├── OmniMart_API.postman_collection.json
│   └── OmniMart_Environment.postman_environment.json
├── package.json             # Root monorepo workspace configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the command below from the project root:
```bash
npm run install:all
```

### 2. Seed Sample Database
Populate sample users (Admin, Approved Vendor, Pending Vendor, Customer) and sample products:
```bash
npm run seed
```

### 3. Run Backend API Server
Start the Express API server:
```bash
npm run dev:backend
```
*The server will start at `http://localhost:5000`.*

### 4. Run Automated Integration Tests
Execute the Jest integration test suite (runs against in-memory MongoDB):
```bash
npm run test:backend
```

---

## 🔑 Default Seed Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@omnimart.com` | `AdminPass123!` | Full platform access |
| **Approved Vendor** | `techstore@omnimart.com` | `VendorPass123!` | Store: *TechZone Electronics* (Status: `approved`) |
| **Pending Vendor** | `fashionhub@omnimart.com` | `VendorPass123!` | Store: *Fashion Hub* (Status: `pending`) |
| **Customer** | `customer@omnimart.com` | `CustomerPass123!` | Customer account |

---

## 🛡️ API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register customer, vendor, or admin
- `POST /api/auth/login` - Authenticate user & receive JWT token
- `GET /api/auth/me` - Get current authenticated user profile

### Admin Operations (`/api/admin`) `[Protected: Admin Role]`
- `GET /api/admin/analytics` - View global metrics (users by role, vendors by status, product count)
- `GET /api/admin/vendors` - List all vendors (query by `?status=pending|approved|suspended`)
- `PATCH /api/admin/vendors/:id/status` - Approve/suspend/reject vendor & update commission rate

### Vendor Operations (`/api/vendor`) `[Protected: Vendor Role & Approved Status]`
- `GET /api/vendor/profile` - View vendor store profile
- `PUT /api/vendor/profile` - Update store profile details
- `GET /api/vendor/products` - List vendor's products
- `POST /api/vendor/products` - Create new product `[Requires Approved Status]`
- `PUT /api/vendor/products/:id` - Update existing product `[Requires Approved Status]`
- `DELETE /api/vendor/products/:id` - Delete product `[Requires Approved Status]`

### Public Catalog (`/api/products`) `[Public]`
- `GET /api/products` - Search & filter active products (`?category=...&search=...&minPrice=...&maxPrice=...`)
- `GET /api/products/:id` - Get single product details
- `GET /api/products/categories/all` - List unique product categories

---

## 📮 Postman & Thunder Client Environment

Pre-configured Postman collection and environment files are available in the [`/postman`](file:///Users/tunde/Desktop/OmniMart/postman) folder:
- [OmniMart_API.postman_collection.json](file:///Users/tunde/Desktop/OmniMart/postman/OmniMart_API.postman_collection.json)
- [OmniMart_Environment.postman_environment.json](file:///Users/tunde/Desktop/OmniMart/postman/OmniMart_Environment.postman_environment.json)

Import both files into Postman or Thunder Client to start testing immediately.
