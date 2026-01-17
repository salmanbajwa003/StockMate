import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicleNumberToCustomers1735689600040 implements MigrationInterface {
  name = 'AddVehicleNumberToCustomers1735689600040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add vehicle_number column
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "vehicle_number" varchar(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove vehicle_number
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "vehicle_number"
    `);
  }
}
