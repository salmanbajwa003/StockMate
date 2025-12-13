import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentsToProducts1735689600030 implements MigrationInterface {
  name = 'AddCommentsToProducts1735689600030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add comments column to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "comments" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove comments column
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "comments"
    `);
  }
}

