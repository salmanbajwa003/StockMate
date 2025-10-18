# Warehouse Management System (WMS)

A comprehensive Warehouse Management System built with NestJS and PostgreSQL, providing RESTful APIs for managing warehouses, products, inventory, customers, and invoices. Specialized for clothing/textile business with support for fabric types, colors, sizes, and more.

## Features

- **Warehouse Management**: Create, read, update, and delete warehouse locations
- **Product Management**: Manage product catalog with SKU, pricing, and categorization
  - Support for clothing-specific attributes (fabric, color, size, pattern, season)
  - Perfect for textile and clothing businesses
- **Inventory Management**: Track inventory levels across multiple warehouses
  - Many-to-many relationship between products and warehouses
  - Auto-increment quantities when adding same product to a warehouse
  - Example: 5 yards of green khadar in Warehouse A + 5 more yards = 10 yards total
- **Customer Management**: Manage customer information and profiles
- **Invoice Management**: Create and manage invoices for customer orders
  - Automatic inventory deduction when invoices are created/paid
  - Invoice status tracking (draft, pending, paid, cancelled)
  - Support for tax calculations and discounts
- **Low Stock Alerts**: Identify products below minimum quantity thresholds
- **Inventory Adjustments**: Add or remove stock with adjustment tracking
- **Unit Conversion**: Automatic conversion of all units to yard (standard backend unit)
  - Supports length units (meter, foot, inch, cm)
  - Supports weight units (kg, gram, pound) with approximation
  - Consistent storage regardless of input unit
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## Technology Stack

- **Backend Framework**: NestJS 10.x
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose
- **Language**: TypeScript

## Prerequisites

- Node.js 20.x or higher
- Docker and Docker Compose
- pnpm (recommended) or npm

## Project Structure

```
warehouse-management-system/
├── src/
│   ├── common/
│   │   └── entities/
│   │       └── base.entity.ts          # Base entity with common fields
│   ├── config/
│   │   └── typeorm.config.ts           # TypeORM configuration
│   ├── warehouses/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── warehouses.controller.ts
│   │   ├── warehouses.service.ts
│   │   └── warehouses.module.ts
│   ├── products/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── inventory/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── inventory.controller.ts
│   │   ├── inventory.service.ts
│   │   └── inventory.module.ts
│   ├── customers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── customers.controller.ts
│   │   ├── customers.service.ts
│   │   └── customers.module.ts
│   ├── invoices/
│   │   ├── dto/
│   │   ├── entities/
│   │   │   ├── invoice.entity.ts
│   │   │   └── invoice-item.entity.ts
│   │   ├── invoices.controller.ts
│   │   ├── invoices.service.ts
│   │   └── invoices.module.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## Getting Started

### Using Docker (Recommended)

1. **Clone the repository** (or navigate to the project directory)

2. **Copy environment file**

   ```bash
   cp .env.example .env
   ```

3. **Start the application**

   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - NestJS application on port 3000

4. **Access the application**
   - API: http://localhost:3000/api
   - Swagger Documentation: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/api

5. **Stop the application**
   ```bash
   docker-compose down
   ```

### Local Development (Without Docker)

1. **Install pnpm** (if not already installed)

   ```bash
   npm install -g pnpm
   # or
   corepack enable
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up PostgreSQL database**
   - Install PostgreSQL 16 or higher
   - Create a database named `wms_db`
   - Update `.env` file with your database credentials

4. **Copy environment file**

   ```bash
   cp .env.example .env
   ```

5. **Start the application**

   ```bash
   # Development mode with hot reload
   pnpm start:dev

   # Production mode
   pnpm build
   pnpm start:prod
   ```

6. **Access the application**
   - API: http://localhost:3000/api
   - Swagger Documentation: http://localhost:3000/api/docs

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=wms_user
DB_PASSWORD=wms_password
DB_DATABASE=wms_db

# JWT Secret (change this in production!)
JWT_SECRET=your-secret-key-change-in-production
```

## API Endpoints

### Health Check

- `GET /api` - Health check endpoint

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with username and password
- `GET /api/auth/profile` - Get current user profile (requires authentication)

### Users

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user by ID
- `PATCH /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Warehouses

- `POST /api/warehouses` - Create a new warehouse
- `GET /api/warehouses` - Get all warehouses
- `GET /api/warehouses/:id` - Get a warehouse by ID
- `PATCH /api/warehouses/:id` - Update a warehouse
- `DELETE /api/warehouses/:id` - Delete a warehouse

### Fabrics

- `POST /api/fabrics` - Create a new fabric type
- `GET /api/fabrics` - Get all fabrics
- `GET /api/fabrics/:id` - Get a fabric by ID
- `PATCH /api/fabrics/:id` - Update a fabric
- `DELETE /api/fabrics/:id` - Delete a fabric

### Colors

- `POST /api/colors` - Create a new color
- `GET /api/colors` - Get all colors
- `GET /api/colors/:id` - Get a color by ID
- `PATCH /api/colors/:id` - Update a color
- `DELETE /api/colors/:id` - Delete a color

### Products

- `POST /api/products` - Create a new product (with fabric and color references)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a product by ID
- `PATCH /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Inventory

- `POST /api/inventory` - Create a new inventory record (auto-increments if product already exists in warehouse)
- `GET /api/inventory` - Get all inventory records (with optional filters)
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/:id` - Get an inventory record by ID
- `PATCH /api/inventory/:id` - Update an inventory record
- `POST /api/inventory/:id/adjust` - Adjust inventory quantity
- `DELETE /api/inventory/:id` - Delete an inventory record

### Customers

- `POST /api/customers` - Create a new customer
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get a customer by ID
- `PATCH /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Invoices

- `POST /api/invoices` - Create a new invoice (automatically deducts from inventory)
- `GET /api/invoices` - Get all invoices (with optional filters by customer, warehouse, or status)
- `GET /api/invoices/:id` - Get an invoice by ID
- `PATCH /api/invoices/:id` - Update an invoice (cannot update paid/cancelled invoices)
- `POST /api/invoices/:id/mark-paid` - Mark an invoice as paid
- `POST /api/invoices/:id/cancel` - Cancel an invoice (restores inventory if status was pending)
- `DELETE /api/invoices/:id` - Delete an invoice

## API Documentation

Once the application is running, you can access the interactive API documentation at:

**http://localhost:3000/api/docs**

The Swagger UI provides:

- Complete API endpoint documentation
- Request/response schemas
- Interactive API testing
- Authentication details (when implemented)

## Database Schema

### Users

- `id` (UUID, Primary Key)
- `name` (String)
- `username` (String, Unique)
- `email` (String, Unique)
- `password` (String) - **Note: Currently stored as plain text. For production, implement encryption!**
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

### Warehouses

- `id` (UUID, Primary Key)
- `name` (String)
- `address` (String)
- `city` (String)
- `state` (String)
- `zipCode` (String)
- `country` (String)
- `capacity` (Decimal)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

### Fabrics

- `id` (UUID, Primary Key)
- `name` (String, Unique) - e.g., 'Khadar', 'Cotton', 'Silk'
- `description` (Text)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

### Colors

- `id` (UUID, Primary Key)
- `name` (String, Unique) - e.g., 'Green', 'Blue', 'Red'
- `hexCode` (String) - Optional hex color code like #00FF00
- `description` (Text)
- `isActive` (Boolean)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

### Products

- `id` (UUID, Primary Key)
- `name` (String)
- `description` (Text)
- `category` (String)
- `price` (Decimal)
- `weight` (Decimal)
- `unit` (String)
- `fabricId` (UUID, Foreign Key) - References Fabrics table
- `colorId` (UUID, Foreign Key) - References Colors table
- `size` (String) - e.g., 'S', 'M', 'L', 'XL'
- `isActive` (Boolean)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

### Inventory

- `id` (UUID, Primary Key)
- `warehouseId` (UUID, Foreign Key)
- `productId` (UUID, Foreign Key)
- `quantity` (Integer)
- `minimumQuantity` (Integer)
- `maximumQuantity` (Integer)
- `locationCode` (String)
- `lastRestockedAt` (Timestamp)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)
- Unique constraint on (warehouseId, productId)

### Customers

- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `phone` (String)
- `address` (Text)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

### Invoices

- `id` (UUID, Primary Key)
- `invoiceNumber` (String, Unique)
- `customerId` (UUID, Foreign Key)
- `warehouseId` (UUID, Foreign Key)
- `invoiceDate` (Timestamp)
- `dueDate` (Timestamp)
- `status` (Enum: draft, pending, paid, cancelled)
- `subtotal` (Decimal)
- `taxRate` (Decimal)
- `taxAmount` (Decimal)
- `discount` (Decimal)
- `total` (Decimal)
- `notes` (Text)
- `paidAt` (Timestamp)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

### Invoice Items

- `id` (UUID, Primary Key)
- `invoiceId` (UUID, Foreign Key)
- `productId` (UUID, Foreign Key)
- `quantity` (Integer)
- `unitPrice` (Decimal)
- `discount` (Decimal)
- `total` (Decimal)
- `notes` (Text)
- `createdAt`, `updatedAt`, `deletedAt` (Timestamps)

## Development

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Linting

```bash
pnpm lint
```

### Format Code

```bash
pnpm format
```

### Database Migrations

```bash
# Generate migration
pnpm migration:generate -- src/migrations/MigrationName

# Run migrations
pnpm migration:run

# Revert migration
pnpm migration:revert
```

## Docker Commands

### Build and Start

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
```

### Stop and Clean

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Database Access

```bash
# Access PostgreSQL container
docker-compose exec postgres psql -U wms_user -d wms_db
```

## Production Deployment

1. **Set environment variables**
   - Set `NODE_ENV=production`
   - Use strong database credentials
   - Configure proper host settings

2. **Build the application**

   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. **Health monitoring**
   - Monitor the health endpoint: `GET /api`
   - Set up logging and monitoring tools
   - Configure alerts for low stock items

## Usage Examples

### Authentication Flow

**1. Register a new user:**

```bash
POST /api/auth/register
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com"
  }
}
```

**2. Login:**

```bash
POST /api/auth/login
{
  "username": "johndoe",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john.doe@example.com"
  }
}
```

**3. Access protected routes:**
Use the `access_token` in the Authorization header:

```bash
GET /api/auth/profile
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Adding Clothing Products

**Step 1: Create Fabric Types**

```bash
POST /api/fabrics
{
  "name": "Khadar",
  "description": "Premium quality khadar fabric",
  "isActive": true
}
```

**Step 2: Create Colors**

```bash
POST /api/colors
{
  "name": "Green",
  "hexCode": "#00FF00",
  "description": "Bright green color",
  "isActive": true
}
```

**Step 3: Create Product with References**

```bash
POST /api/products
{
  "name": "Green Khadar Fabric",
  "description": "Premium quality green khadar fabric",
  "category": "Fabric",
  "price": 25.00,
  "weight": 5,
  "unit": "kg",  # Will be automatically converted to yard
  "fabricId": "fabric-uuid-here",
  "colorId": "color-uuid-here",
  "size": "Standard",
  "isActive": true
}

# Backend will store as:
# weight: 8.2, unit: "yard" (auto-converted from 5 kg)
```

**Note:** The system automatically converts all units to **yard** (standard unit) on the backend. You can input in kg, meter, foot, etc., and it will be stored consistently in yards.

### Adding Inventory (Auto-Increment)

First time adding product to warehouse:

```bash
POST /api/inventory
{
  "warehouseId": "warehouse-uuid",
  "productId": "product-uuid",
  "quantity": 5,
  "minimumQuantity": 10
}
```

Adding same product again (auto-increments from 5 to 10):

```bash
POST /api/inventory
{
  "warehouseId": "warehouse-uuid",
  "productId": "product-uuid",
  "quantity": 5
}
```

### Creating an Invoice

Create an invoice for a customer purchase:

```bash
POST /api/invoices
{
  "invoiceNumber": "INV-2025-001",
  "customerId": "customer-uuid",
  "warehouseId": "warehouse-uuid",
  "invoiceDate": "2025-10-18T10:00:00Z",
  "dueDate": "2025-11-18T10:00:00Z",
  "status": "pending",
  "taxRate": 10.0,
  "discount": 0,
  "notes": "Bulk order for green khadar",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 3,
      "unitPrice": 25.00,
      "discount": 0,
      "notes": "3 yards of green khadar"
    }
  ]
}
```

The system will:

1. Validate inventory availability
2. Calculate totals automatically
3. Deduct inventory when status is not 'draft'

### Using Authentication in Swagger

1. Go to http://localhost:3000/api/docs
2. Click on "Authorize" button (top right)
3. Enter your JWT token in the format: `Bearer YOUR_TOKEN_HERE`
4. Click "Authorize"
5. Now you can access protected endpoints

## Security Notes

⚠️ **IMPORTANT**: This implementation stores passwords as **plain text** as requested. This is NOT recommended for production environments!

For production deployment, you should:

1. Hash passwords using bcrypt or similar
2. Use strong JWT secrets
3. Implement refresh tokens
4. Add rate limiting
5. Enable HTTPS
6. Implement proper CORS policies
7. Add request validation and sanitization

## Future Enhancements

- [x] User authentication and authorization (JWT) ✅
- [ ] Role-based access control (RBAC)
- [ ] Password encryption (bcrypt)
- [ ] Purchase orders and supplier management
- [ ] Shipping and receiving workflows
- [ ] Barcode scanning integration
- [ ] Reporting and analytics dashboard
- [ ] Audit logs and history tracking
- [ ] Email notifications for invoices
- [ ] PDF invoice generation
- [ ] Payment tracking and integration
- [ ] Return and refund management
- [ ] WebSocket for real-time updates
- [ ] Multi-tenant support

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
