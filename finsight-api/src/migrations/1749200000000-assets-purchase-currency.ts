import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssetsPurchaseCurrency1749200000000 implements MigrationInterface {
  name = 'AssetsPurchaseCurrency1749200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "purchase_currency_id" uuid`);

    await queryRunner.query(`
      UPDATE "assets" AS asset
      SET "purchase_currency_id" = currency."id"
      FROM "currencies" AS currency
      WHERE asset."purchase_currency_id" IS NULL
        AND currency."code" = 'USD'
    `);

    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN IF EXISTS "current_price"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD COLUMN IF NOT EXISTS "current_price" numeric(15, 2)
    `);

    await queryRunner.query(`
      UPDATE "assets"
      SET "current_price" = "purchase_price"
      WHERE "current_price" IS NULL
    `);

    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN IF EXISTS "purchase_currency_id"`);
  }
}
