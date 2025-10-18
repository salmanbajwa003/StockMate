# Database Migration Guide

## Overview

This guide explains how to generate and manage database migrations for the warehouse management system.

## Prerequisites

- PostgreSQL database running (via Docker or local)
- Environment variables configured in `.env`
- All entity files created

## Quick Start

```bash
# 1. Start database
docker-compose up -d postgres

# 2. Generate migration
pnpm migration:generate src/migrations/InitialSchema

# 3. Review migration file in src/migrations/

# 4. Run migration
pnpm migration:run

# 5. Verify
docker-compose exec postgres psql -U wms_user -d wms_db -c "\dt"
```

## Detailed Steps

### 1. Generate Migration

```bash
# Generate migration based on entity changes
pnpm migration:generate src/migrations/InitialSchema

# This creates a file like:
# src/migrations/1729267200000-InitialSchema.ts
```

**What gets generated:**

- All table creations (fabrics, colors, users, customers, invoices, etc.)
- Table modifications (products, inventory)
- Foreign key constraints
- Indexes
- Default values

### 2. Review Generated Migration

Open the generated file and review the SQL:

```typescript
// Example: src/migrations/1729267200000-InitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1729267200000 implements MigrationInterface {
  name = 'InitialSchema1729267200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tables
    await queryRunner.query(`
            CREATE TABLE "fabrics" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                CONSTRAINT "UQ_fabric_name" UNIQUE ("name"),
                CONSTRAINT "PK_fabrics" PRIMARY KEY ("id")
            )
        `);

    // ... more SQL statements
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic
    await queryRunner.query(`DROP TABLE "fabrics"`);
    // ... more rollback statements
  }
}
```

### 3. Run Migration

```bash
# Apply migration to database
pnpm migration:run

# You should see:
# Migration InitialSchema1729267200000 has been executed successfully.
```

### 4. Verify Database

```bash
# List all tables
docker-compose exec postgres psql -U wms_user -d wms_db -c "\dt"

# Expected tables:
# - users
# - customers
# - warehouses
# - fabrics
# - colors
# - products
# - inventory
# - invoices
# - invoice_items
# - migrations (TypeORM tracking)

# Check specific table structure
docker-compose exec postgres psql -U wms_user -d wms_db -c "\d products"

# Check foreign keys
docker-compose exec postgres psql -U wms_user -d wms_db -c "\d+ products"
```

## Schema Changes Summary

### New Tables Created

#### 1. Fabrics

```sql
CREATE TABLE fabrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP
);
```

#### 2. Colors

```sql
CREATE TABLE colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    hex_code VARCHAR(7),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP
);
```

#### 3. Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP
);
```

#### 4. Customers

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP
);
```

#### 5. Invoices

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    invoice_date TIMESTAMP DEFAULT now(),
    due_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP
);
```

#### 6. Invoice Items

```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP
);
```

### Modified Tables

#### Products Table Changes

```sql
-- Remove columns
ALTER TABLE products DROP COLUMN sku;
ALTER TABLE products DROP COLUMN season;
ALTER TABLE products DROP COLUMN pattern;
ALTER TABLE products DROP COLUMN fabric;  -- Was string
ALTER TABLE products DROP COLUMN color;   -- Was string

-- Add foreign key columns
ALTER TABLE products ADD COLUMN fabric_id UUID REFERENCES fabrics(id);
ALTER TABLE products ADD COLUMN color_id UUID REFERENCES colors(id);
```

#### Inventory Table Changes

```sql
-- Change quantity from integer to decimal
ALTER TABLE inventory ALTER COLUMN quantity TYPE DECIMAL(10,3);

-- Add unit column
ALTER TABLE inventory ADD COLUMN unit VARCHAR(20) DEFAULT 'yard';

-- Change min/max quantities to decimal
ALTER TABLE inventory ALTER COLUMN minimum_quantity TYPE DECIMAL(10,3);
ALTER TABLE inventory ALTER COLUMN maximum_quantity TYPE DECIMAL(10,3);
```

## Migration Commands

### Generate Migration

```bash
# Generate based on entity changes
pnpm migration:generate src/migrations/MigrationName

# Example with descriptive name
pnpm migration:generate src/migrations/AddFabricsAndColors
pnpm migration:generate src/migrations/UpdateInventoryUnits
```

### Run Migrations

```bash
# Run all pending migrations
pnpm migration:run

# Show migration status
pnpm typeorm migration:show -d src/config/typeorm.config.ts
```

### Revert Migration

```bash
# Revert last migration
pnpm migration:revert

# This runs the `down` method of the last migration
```

### Create Empty Migration

```bash
# Create empty migration for custom SQL
pnpm typeorm migration:create src/migrations/CustomChanges
```

## Manual Migration Example

If you need to add custom SQL not generated by TypeORM:

```bash
# Create empty migration
pnpm typeorm migration:create src/migrations/AddCustomIndexes
```

Then edit the file:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomIndexes1729267200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add custom index
    await queryRunner.query(`
            CREATE INDEX idx_products_fabric_color 
            ON products(fabric_id, color_id) 
            WHERE deleted_at IS NULL
        `);

    // Add custom function
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_fabric_color`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
  }
}
```

## Production Workflow

### 1. Development

```bash
# Make entity changes
# Generate migration
pnpm migration:generate src/migrations/FeatureName

# Test migration
pnpm migration:run

# Test rollback
pnpm migration:revert

# Test migration again
pnpm migration:run
```

### 2. Version Control

```bash
# Commit migration files
git add src/migrations/*.ts
git commit -m "Add database migration for new features"
```

### 3. Production Deployment

```bash
# Pull latest code
git pull

# Install dependencies
pnpm install

# Run migrations
pnpm migration:run

# Start application
pnpm start:prod
```

## Important Notes

### ⚠️ Development vs Production

**Development:**

- Set `synchronize: true` in TypeORM config
- Database schema updates automatically
- Good for rapid development
- **DO NOT use in production!**

**Production:**

- Set `synchronize: false`
- Always use migrations
- Controlled schema changes
- Rollback capability

### ⚠️ Migration Best Practices

1. **Always review generated SQL** before running
2. **Test migrations** in development first
3. **Backup database** before running in production
4. **Don't modify** existing migration files
5. **Create new migration** for changes
6. **Keep migrations** in version control

### ⚠️ Data Migration

If you have existing data, you might need data migration:

```typescript
// Example: Migrate existing product fabric strings to fabric table
export class MigrateProductFabrics1729267200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Insert unique fabrics
    await queryRunner.query(`
            INSERT INTO fabrics (name)
            SELECT DISTINCT fabric FROM products 
            WHERE fabric IS NOT NULL
            ON CONFLICT (name) DO NOTHING
        `);

    // 2. Update products with fabric_id
    await queryRunner.query(`
            UPDATE products p
            SET fabric_id = f.id
            FROM fabrics f
            WHERE p.fabric = f.name
        `);

    // 3. Drop old fabric column (after verification)
    // await queryRunner.query(`ALTER TABLE products DROP COLUMN fabric`);
  }
}
```

## Troubleshooting

### Migration Fails

```bash
# Check migration table
docker-compose exec postgres psql -U wms_user -d wms_db -c "SELECT * FROM migrations;"

# Check for errors
docker-compose logs postgres

# Manually revert if needed
pnpm migration:revert
```

### Sync Issues

```bash
# If synchronize is on, turn it off for production
# Edit src/config/typeorm.config.ts
synchronize: false  # Set to false

# Drop all tables and recreate (DEVELOPMENT ONLY!)
docker-compose down -v
docker-compose up -d
pnpm migration:run
```

### Migration Already Exists

```bash
# List migrations
ls -la src/migrations/

# Remove duplicate if needed
rm src/migrations/1729267200000-DuplicateName.ts
```

## Summary

✅ **Generate Migration:**

```bash
pnpm migration:generate src/migrations/InitialSchema
```

✅ **Run Migration:**

```bash
pnpm migration:run
```

✅ **Verify:**

```bash
docker-compose exec postgres psql -U wms_user -d wms_db -c "\dt"
```

✅ **Revert if needed:**

```bash
pnpm migration:revert
```

---

Your database schema is now version-controlled and can be safely deployed to any environment!
