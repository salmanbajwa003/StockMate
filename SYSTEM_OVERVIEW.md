# Warehouse Management System - Complete Overview

## System Summary

A comprehensive warehouse management system for clothing/textile businesses with complete authentication, inventory tracking, customer management, and invoicing capabilities.

## Database Tables

### 1. **Users** 👤

- Stores system users who can access the application
- Fields: name, username, email, password
- Authentication with JWT tokens

### 2. **Customers** 👥

- Stores customer information for invoicing
- Fields: name, email, phone, address
- Simplified structure for easy customer management

### 3. **Warehouses** 🏢

- Physical warehouse locations
- Fields: name, address, city, state, zipCode, country, capacity
- Multiple warehouses supported

### 4. **Products** 👕

- Clothing/textile products with specialized attributes
- Basic fields: SKU, name, description, category, price, weight, unit
- **Clothing fields**: fabric, color, size, pattern, season
- Example: "Green Khadar Fabric, 5 yards"

### 5. **Inventory** 📦

- **Many-to-Many**: One product can be in multiple warehouses
- **Auto-increment**: Adding same product to warehouse increases quantity
- Fields: quantity, minimumQuantity, maximumQuantity, locationCode
- Example: 5 yards of green khadar in Warehouse A + 5 more = 10 yards total

### 6. **Invoices** 🧾

- Customer purchase orders
- Fields: invoiceNumber, customer, warehouse, dates, status, totals
- Statuses: draft, pending, paid, cancelled
- Automatic inventory deduction

### 9. **Invoice Items** 📋

- Line items on invoices
- Links products to invoices with quantity and pricing
- Automatic total calculation

## Key Features

### ✅ Authentication System

- JWT-based authentication
- Register and login endpoints
- Protected routes with Bearer token
- 24-hour token expiration
- **Note**: Passwords stored as plain text (as requested)

### ✅ Inventory Auto-Increment

When you add inventory:

```
First time: POST /api/inventory { warehouseId, productId, quantity: 5 }
Result: Creates new entry with 5 units

Same product again: POST /api/inventory { warehouseId, productId, quantity: 5 }
Result: Updates existing entry to 10 units (5 + 5)
```

### ✅ Invoice Management

- Create invoices for customers
- System validates inventory availability
- Automatic calculations (subtotal, tax, discount, total)
- Inventory automatically deducted when invoice created/paid
- Can cancel invoices (restores inventory if pending)

### ✅ Clothing-Specific Features

Products support:

- Fabric type (khadar, cotton, silk, etc.)
- Color (green, blue, red, etc.)
- Size (S, M, L, XL, or custom)
- Pattern (plain, printed, embroidered)
- Season (summer, winter, all-season)

## Complete API Endpoints

### Authentication (🔓 Public)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (🔒 Protected)

### Users (🔓 Public - should be protected in production)

- `POST /api/users` - Create user
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Customers

- `POST /api/customers` - Create customer
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer by ID
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Warehouses

- `POST /api/warehouses` - Create warehouse
- `GET /api/warehouses` - List all warehouses
- `GET /api/warehouses/:id` - Get warehouse by ID
- `PATCH /api/warehouses/:id` - Update warehouse
- `DELETE /api/warehouses/:id` - Delete warehouse

### Products (Clothing)

- `POST /api/products` - Create product
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory

- `POST /api/inventory` - Add inventory (auto-increments if exists)
- `GET /api/inventory` - List all inventory
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/:id` - Get inventory by ID
- `PATCH /api/inventory/:id` - Update inventory
- `POST /api/inventory/:id/adjust` - Adjust quantity
- `DELETE /api/inventory/:id` - Delete inventory

### Invoices

- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `PATCH /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/mark-paid` - Mark as paid
- `POST /api/invoices/:id/cancel` - Cancel invoice
- `DELETE /api/invoices/:id` - Delete invoice

## Quick Start Guide

### 1. Install Dependencies

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm
# or
corepack enable

# Install dependencies
pnpm install
```

### 2. Configure Environment

Create `.env` file:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=wms_user
DB_PASSWORD=wms_password
DB_DATABASE=wms_db

JWT_SECRET=your-secret-key-change-in-production
```

### 3. Start with Docker

```bash
docker-compose up -d
```

### 4. Access the Application

- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs

## Example Workflow

### Step 1: Register and Login

```bash
# Register
POST /api/auth/register
{
  "name": "Admin User",
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123"
}

# Save the access_token from response
```

### Step 2: Create a Warehouse

```bash
POST /api/warehouses
{
  "name": "Warehouse A",
  "address": "123 Main St",
  "city": "Karachi",
  "capacity": 10000
}
```

### Step 3: Create a Product (Clothing)

```bash
POST /api/products
{
  "sku": "KHADAR-GREEN-001",
  "name": "Green Khadar Fabric",
  "category": "Fabric",
  "price": 25.00,
  "unit": "yard",
  "fabric": "khadar",
  "color": "green",
  "pattern": "plain"
}
```

### Step 5: Add Inventory

```bash
# First time - creates new entry
POST /api/inventory
{
  "warehouseId": 1,
  "productId": 1,
  "quantity": 5
}

# Same product again - increments to 10
POST /api/inventory
{
  "warehouseId": 1,
  "productId": 1,
  "quantity": 5
}
```

### Step 6: Create a Customer

```bash
POST /api/customers
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+92300XXXXXXX",
  "address": "456 Customer St, Lahore"
}
```

### Step 7: Create an Invoice

```bash
POST /api/invoices
{
  "invoiceNumber": "INV-2025-001",
  "customerId": 1,
  "warehouseId": 1,
  "status": "pending",
  "taxRate": 10.0,
  "items": [
    {
      "productId": 1,
      "quantity": 3,
      "unitPrice": 25.00
    }
  ]
}

# System will:
# - Validate 3 yards are available
# - Calculate totals automatically
# - Deduct 3 yards from inventory
# - Return complete invoice
```

## Relationships

```
Users (authenticate to use system)
  ↓
Fabrics → Products ← Colors
            ↓
Warehouses ←→ Inventory ←→ Products (clothing items)
                ↓
Customers → Invoices → Invoice Items → Products
              ↓
         (deducts from Inventory)
```

## Data Flow Example

1. **User logs in** → Gets JWT token
2. **Admin creates fabric**: "Khadar"
3. **Admin creates color**: "Green"
4. **Admin adds product**: "Green Khadar, 25.00/yard" (references fabric & color)
5. **Admin adds inventory**: 10 yards to Warehouse A
6. **Admin adds same product**: Auto-increments to 15 yards
7. **Customer places order**: 5 yards needed
8. **Admin creates invoice**: System checks inventory (15 available ✓)
9. **Invoice created**: Inventory reduced to 10 yards
10. **Invoice paid**: Status updated to "paid"

## Technology Stack

- **Framework**: NestJS 10.x (Node.js)
- **Database**: PostgreSQL 16
- **ORM**: TypeORM (auto-sync in development)
- **Authentication**: JWT (@nestjs/jwt)
- **API Docs**: Swagger/OpenAPI
- **Validation**: class-validator
- **Containerization**: Docker & Docker Compose

## File Structure

```
src/
├── auth/              # Authentication (JWT)
│   ├── dto/           # Login, Register DTOs
│   ├── guards/        # Auth guard for protected routes
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/             # User management
├── customers/         # Customer management (simplified)
├── warehouses/        # Warehouse locations
├── fabrics/           # Fabric types (master data)
├── colors/            # Colors (master data)
├── products/          # Products with fabric & color references
├── inventory/         # Inventory tracking (auto-increment)
├── invoices/          # Invoice management
│   ├── entities/
│   │   ├── invoice.entity.ts
│   │   └── invoice-item.entity.ts
│   ├── invoices.controller.ts
│   ├── invoices.service.ts
│   └── invoices.module.ts
├── common/            # Shared entities (BaseEntity)
└── app.module.ts      # Main application module
```

## Important Notes

### ⚠️ Security Warning

- Passwords are stored as **plain text** (as requested)
- **NOT suitable for production** without encryption
- Implement bcrypt hashing before production use

### ✅ Production Checklist

- [ ] Hash passwords with bcrypt
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Implement CORS policies
- [ ] Add request validation
- [ ] Set up monitoring and logging
- [ ] Disable TypeORM auto-sync (use migrations)
- [ ] Add database backups
- [ ] Implement refresh tokens

## Support

For detailed guides, see:

- `README.md` - Complete system documentation
- `AUTHENTICATION_GUIDE.md` - Authentication details
- Swagger UI - Interactive API documentation

## Summary

This system provides:
✅ Complete user authentication with JWT
✅ Customer management (4 fields: name, email, phone, address)
✅ Clothing-specific product management
✅ Multi-warehouse inventory with auto-increment
✅ Invoice creation with automatic inventory deduction
✅ Many-to-many relationships (products ↔ warehouses)
✅ REST API with Swagger documentation
✅ Docker support for easy deployment

**Ready to use** - Just run `pnpm install && docker-compose up`!
