import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerTypeToCustomers1735689600060 implements MigrationInterface {
  name = 'AddCustomerTypeToCustomers1735689600060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for customer_type
    await queryRunner.query(`
      CREATE TYPE "customer_type_enum" AS ENUM ('Cash', 'Credit')
    `);

    // Add customerType column with default value
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN "customerType" customer_type_enum NOT NULL DEFAULT 'Credit'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove customerType column
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN "customerType"
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "customer_type_enum"
    `);
  }
}
