import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCurrencyRatesPairs1749106800000
  implements MigrationInterface
{
  name = 'RefactorCurrencyRatesPairs1749106800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "currency_rates" ADD COLUMN IF NOT EXISTS "base_currency_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rates" ADD COLUMN IF NOT EXISTS "quote_currency_code" character varying`,
    );

    await queryRunner.query(`
      UPDATE "currency_rates" cr
      SET
        "base_currency_code" = CASE
          WHEN cr."pair" LIKE c."code" || '%' THEN c."code"
          WHEN cr."pair" LIKE '%' || c."code" THEN REPLACE(cr."pair", c."code", '')
          ELSE c."code"
        END,
        "quote_currency_code" = CASE
          WHEN cr."pair" LIKE c."code" || '%' THEN SUBSTRING(cr."pair" FROM LENGTH(c."code") + 1)
          WHEN cr."pair" LIKE '%' || c."code" THEN c."code"
          ELSE 'USD'
        END
      FROM "currencies" c
      WHERE cr."currency_id" = c."id"
    `);

    await queryRunner.query(
      `UPDATE "currency_rates" SET "base_currency_code" = 'USD' WHERE "base_currency_code" IS NULL AND "pair" = 'USDUSD'`,
    );
    await queryRunner.query(
      `UPDATE "currency_rates" SET "quote_currency_code" = 'USD' WHERE "quote_currency_code" IS NULL AND "pair" = 'USDUSD'`,
    );

    await queryRunner.query(
      `ALTER TABLE "currency_rates" ALTER COLUMN "base_currency_code" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rates" ALTER COLUMN "quote_currency_code" SET NOT NULL`,
    );

    await queryRunner.query(`
      DO $$
      DECLARE constraint_name text;
      BEGIN
        SELECT tc.constraint_name
        INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'currency_rates'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'currency_id'
        LIMIT 1;

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "currency_rates" DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_currency_rates_pair"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_currency_rates_pair" ON "currency_rates" ("pair")`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rates" DROP COLUMN IF EXISTS "currency_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "currency_rates" ADD COLUMN IF NOT EXISTS "currency_id" uuid`,
    );
    await queryRunner.query(`
      UPDATE "currency_rates" cr
      SET "currency_id" = c."id"
      FROM "currencies" c
      WHERE c."code" = cr."base_currency_code"
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_currency_rates_pair"`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rates" DROP COLUMN IF EXISTS "base_currency_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "currency_rates" DROP COLUMN IF EXISTS "quote_currency_code"`,
    );
  }
}
