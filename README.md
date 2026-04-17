# Urban Farming Platform Backend

A production-style backend for an Interactive Urban Farming Platform built with **Express.js**, **PostgreSQL**, **Raw SQL**, **Socket.IO**, and **Docker**.

The platform supports:

- **Garden space rentals** for urban farming
- **Marketplace** for organic produce, seeds, and tools
- **Community forum** for sustainable farming knowledge sharing
- **Real-time plant tracking** with live updates
- **Sustainability verification** and vendor certification review
- **Admin moderation** and platform oversight

---

## Features

- JWT authentication
- Role-based access control for **Admin**, **Vendor**, and **Customer**
- Vendor approval workflow
- Sustainability certification review flow
- Marketplace with product CRUD, filtering, sorting, and pagination
- Transaction-safe order creation with stock validation
- Rental space search, booking, cancellation, and overlap prevention
- Real-time plant tracking using Socket.IO
- Community forum with moderation-ready structure
- Standardized API response format
- Centralized error handling
- Rate limiting on sensitive routes
- Swagger/OpenAPI documentation
- Seeder script with realistic demo data
- Benchmark script for API performance notes
- Dockerized development workflow

---

## Tech Stack

- **Node.js**
- **Express.js**
- **PostgreSQL**
- **Raw SQL with `pg`**
- **Socket.IO**
- **Zod** for validation
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-rate-limit** for throttling sensitive routes
- **swagger-ui-express** for API docs
- **autocannon** for benchmarking
- **Docker** and **Docker Compose**

---

## Project Structure

```txt
src/
  config/
  controllers/
  docs/
  middlewares/
  repositories/
  routes/
  scripts/
  services/
  utils/
  validators/

db/
  migrations/

Dockerfile
docker-compose.yml
.env.example
README.md
```

---

## Core Modules

### 1. Authentication and RBAC

Users can register, log in, and access protected routes according to their role.

Roles:

- `admin`
- `vendor`
- `customer`

### 2. Admin Management

Admins can:

- approve or reject vendors
- review sustainability certificates
- manage access across the platform
- moderate community posts

### 3. Marketplace

Vendors and admins can create products. Customers can browse products and place orders.

Features:

- pagination
- filtering
- sorting
- transaction-safe order creation
- stock decrement protection

### 4. Rental System

Vendors can create rental spaces. Customers can book them.

Features:

- search by location
- filter by size, price, availability
- booking cancellation
- overlap prevention at the database level

### 5. Real-Time Plant Tracking

Customers and vendors can track plant growth and health events in real time.

Features:

- plant creation
- plant updates
- tracking events
- Socket.IO live broadcasts

### 6. Community Forum

Users can share gardening and sustainability knowledge.

Features:

- post creation
- post updates
- post deletion
- moderation support

---

## API Response Format

Every successful response follows this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": null,
  "error": null,
  "timestamp": "2026-04-17T10:00:00.000Z"
}
```

Every error response follows this structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  },
  "timestamp": "2026-04-17T10:00:00.000Z"
}
```

---

## Environment Variables

Create a `.env` file from `.env.example`.

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=urban_farming
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

---

## Setup and Run

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

### 3. Start PostgreSQL and the app with Docker

```bash
docker compose up --build
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Seed demo data

```bash
npm run seed
```

### 6. Start the server

```bash
npm run dev
```

---

## API Documentation

Swagger UI is available at:

```text
http://localhost:5000/api/v1/docs
```

Health check endpoint:

```text
GET /api/v1/health
```

---

## Seeder Accounts

The seeder creates demo accounts for testing.

### Admin

- Email: `admin@example.com`
- Password: `Password123!`

### Vendor

- Email: `vendor1@example.com`
- Password: `Password123!`

### Customer

- Email: `customer1@example.com`
- Password: `Password123!`

It also inserts:

- 10 vendors
- 100 products
- rental spaces
- bookings
- community posts
- plant tracks and tracking events
- sample orders

---

## Benchmark Report

The API was benchmarked using `autocannon` against key public endpoints.

### Observed Results

| Endpoint               | Avg Latency | Max Latency | Avg Req/sec |  Throughput |
| ---------------------- | ----------: | ----------: | ----------: | ----------: |
| Health check           |    73.84 ms |     2036 ms |      672.10 |  755 kB/sec |
| Public product listing |    87.69 ms |      522 ms |      339.60 | 2.11 MB/sec |
| Public rental search   |    75.51 ms |      179 ms |      393.90 | 1.91 MB/sec |

### Raw benchmark notes

- Health check: about **7k requests in 10.09s**
- Product listing: about **3k requests in 10.07s**
- Rental search: about **4k requests in 10.04s**
- Errors: **0**
- Timeouts: **0**

### Performance strategy

- Public read endpoints use **pagination** and **indexed filters**.
- Orders and bookings use **database transactions** to prevent inconsistent writes.
- Sensitive routes use **rate limiting**.
- Real-time plant updates use **Socket.IO** instead of repeated polling.
- Standardized response payloads keep output consistent and easy to parse.
- PostgreSQL constraints and indexes protect data integrity and improve query speed.

---

## Security Notes

- Passwords are stored as hashed values using `bcryptjs`.
- JWT is used for authentication.
- CORS is configured from environment values.
- Helmet is enabled.
- Request body size is limited.
- Rate limiting is applied to auth, write, booking, forum, tracking, and admin routes.

---

## Submission Checklist

- [x] Authentication and RBAC
- [x] Admin approval flow
- [x] Sustainability certification review
- [x] Marketplace module
- [x] Rental space booking system
- [x] Plant tracking with real-time updates
- [x] Community forum
- [x] Standard API response format
- [x] Central error handling
- [x] Rate limiting
- [x] Swagger/OpenAPI docs
- [x] Seeder script
- [x] PostgreSQL migrations
- [x] Benchmark report
- [x] Docker support

---

## Notes

This project is organized in a modular way so each file has one responsibility. The codebase is designed to be easy to extend with additional features such as comments, likes, notifications, payments, analytics, or mobile app support.
