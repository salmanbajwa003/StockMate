import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverFieldsToCustomers1735689600011 implements MigrationInterface {
  name = 'AddDriverFieldsToCustomers1735689600011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add driver_name column
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "driver_name" varchar(255)
    `);

    // Add vehicle_make column
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "vehicle_make" varchar(255)
    `);

    // Add driver_no column
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "driver_no" varchar(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove driver_name
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "driver_name"
    `);

    // Remove vehicle_make
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "vehicle_make"
    `);

    // Remove driver_no
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "driver_no"
    `);
  }
}
