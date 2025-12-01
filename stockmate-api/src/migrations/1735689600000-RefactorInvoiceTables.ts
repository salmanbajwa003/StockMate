import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorInvoiceTables1735689600000 implements MigrationInterface {
  name = 'RefactorInvoiceTables1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add total column to invoices table
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "total" numeric(10,2) NOT NULL DEFAULT 0
    `);

    // Add notes column to invoices table (if it doesn't exist)
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "notes" text
    `);

    // Check if unit_type_enum already exists (from product_warehouses table)
    const unitTypeEnumResult = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'unit_type_enum'
      ) as exists
    `);

    // Create unit_type_enum if it doesn't exist
    if (!unitTypeEnumResult[0]?.exists) {
      await queryRunner.query(`
        CREATE TYPE "unit_type_enum" AS ENUM (
          'yard', 'meter', 'foot', 'inch', 'centimeter', 
          'kg', 'gram', 'pound', 'piece', 'roll'
        )
      `);
    }

    // Add unit column to invoice_items table (nullable first to allow data migration)
    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      ADD COLUMN IF NOT EXISTS "unit" unit_type_enum
    `);

    // Update unit for existing invoice_items based on product warehouse
    // This is a data migration - set unit for existing records
    await queryRunner.query(`
      UPDATE "invoice_items" ii
      SET "unit" = COALESCE((
        SELECT pw."unit"
        FROM "product_warehouses" pw
        WHERE pw."product_id" = ii."product_id"
        LIMIT 1
      ), 'yard'::unit_type_enum)
      WHERE ii."unit" IS NULL
    `);

    // Now make unit column NOT NULL with default
    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      ALTER COLUMN "unit" SET NOT NULL,
      ALTER COLUMN "unit" SET DEFAULT 'yard'::unit_type_enum
    `);

    // Calculate total for existing invoices before removing columns
    await queryRunner.query(`
      UPDATE "invoices" i
      SET "total" = COALESCE((
        SELECT SUM(ii."quantity" * ii."unit_price")
        FROM "invoice_items" ii
        WHERE ii."invoice_id" = i."id"
      ), 0)
    `);

    // Remove columns from invoices table
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "due_date"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "subtotal"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "tax_amount"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "tax_rate"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "discount"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "paid_at"
    `);

    // Remove columns from invoice_items table
    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      DROP COLUMN IF EXISTS "discount"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      DROP COLUMN IF EXISTS "total"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      DROP COLUMN IF EXISTS "notes"
    `);

    // Update invoice status enum to only have PENDING and PAID
    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum_new" AS ENUM ('pending', 'paid')
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ALTER COLUMN "status" TYPE "invoice_status_enum_new" 
      USING CASE 
        WHEN "status"::text IN ('pending', 'paid') THEN "status"::text::invoice_status_enum_new
        ELSE 'pending'::invoice_status_enum_new
      END
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "invoice_status_enum"
    `);

    await queryRunner.query(`
      ALTER TYPE "invoice_status_enum_new" RENAME TO "invoice_status_enum"
    `);

    // Set default status to pending
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ALTER COLUMN "status" SET DEFAULT 'pending'::invoice_status_enum
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore invoice status enum with all values
    await queryRunner.query(`
      CREATE TYPE "invoice_status_enum_old" AS ENUM (
        'draft', 'pending', 'paid', 'cancelled', 'cleared', 'not_cleared'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ALTER COLUMN "status" TYPE "invoice_status_enum_old" 
      USING "status"::text::invoice_status_enum_old
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "invoice_status_enum"
    `);

    await queryRunner.query(`
      ALTER TYPE "invoice_status_enum_old" RENAME TO "invoice_status_enum"
    `);

    // Restore columns to invoice_items table
    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      ADD COLUMN IF NOT EXISTS "notes" text
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      ADD COLUMN IF NOT EXISTS "total" numeric(10,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      ADD COLUMN IF NOT EXISTS "discount" numeric(5,2) NOT NULL DEFAULT 0
    `);

    // Restore columns to invoices table
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "paid_at" timestamp
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "discount" numeric(10,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "tax_rate" numeric(5,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "tax_amount" numeric(10,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "subtotal" numeric(10,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "due_date" timestamp
    `);

    // Remove unit column from invoice_items
    await queryRunner.query(`
      ALTER TABLE "invoice_items" 
      DROP COLUMN IF EXISTS "unit"
    `);

    // Drop unit_type_enum if it exists
    await queryRunner.query(`
      DROP TYPE IF EXISTS "unit_type_enum"
    `);

    // Remove total and notes from invoices
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "total"
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices" 
      DROP COLUMN IF EXISTS "notes"
    `);
  }
}
