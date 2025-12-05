import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeInvoiceNumberNullable1735689600020 implements MigrationInterface {
  name = 'MakeInvoiceNumberNullable1735689600020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ALTER COLUMN "invoice_number" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoices" 
      ALTER COLUMN "invoice_number" SET NOT NULL
    `);
  }
}
