import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeInvoiceNumberNullable1735689600020 implements MigrationInterface {
  name = 'MakeInvoiceNumberNullable1735689600020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists (could be invoiceNumber or invoice_number)
    const columnInfo = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invoices' 
      AND (column_name = 'invoiceNumber' OR column_name = 'invoice_number')
    `);

    if (columnInfo.length > 0) {
      const columnName = columnInfo[0].column_name;
      await queryRunner.query(`
        ALTER TABLE "invoices" 
        ALTER COLUMN "${columnName}" DROP NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists (could be invoiceNumber or invoice_number)
    const columnInfo = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invoices' 
      AND (column_name = 'invoiceNumber' OR column_name = 'invoice_number')
    `);

    if (columnInfo.length > 0) {
      const columnName = columnInfo[0].column_name;
      await queryRunner.query(`
        ALTER TABLE "invoices" 
        ALTER COLUMN "${columnName}" SET NOT NULL
      `);
    }
  }
}
