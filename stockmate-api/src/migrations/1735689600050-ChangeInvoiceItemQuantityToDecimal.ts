import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeInvoiceItemQuantityToDecimal1735689600050 implements MigrationInterface {
  name = 'ChangeInvoiceItemQuantityToDecimal1735689600050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists and get its current type
    const columnInfo = await queryRunner.query(`
      SELECT data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'invoice_items' AND column_name = 'quantity'
    `);

    // Only alter if the column type is not already numeric(10,2)
    if (columnInfo.length > 0) {
      const currentType = columnInfo[0].data_type;
      const currentPrecision = columnInfo[0].numeric_precision;
      const currentScale = columnInfo[0].numeric_scale;

      // Check if we need to change the type
      if (
        currentType !== 'numeric' ||
        currentPrecision !== 10 ||
        currentScale !== 2
      ) {
        // First, ensure no NULL values exist (set default if needed)
        await queryRunner.query(`
          UPDATE "invoice_items"
          SET "quantity" = 0
          WHERE "quantity" IS NULL
        `);

        // Change quantity column from integer to decimal
        await queryRunner.query(`
          ALTER TABLE "invoice_items"
          ALTER COLUMN "quantity" TYPE numeric(10,2) USING "quantity"::numeric(10,2)
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert quantity column back to integer
    await queryRunner.query(`
      ALTER TABLE "invoice_items"
      ALTER COLUMN "quantity" TYPE integer USING ROUND("quantity")::integer
    `);
  }
}
