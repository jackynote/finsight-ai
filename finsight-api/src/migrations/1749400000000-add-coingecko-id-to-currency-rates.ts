import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoingeckoIdToCurrencyRates1749400000000 implements MigrationInterface {
  name = 'AddCoingeckoIdToCurrencyRates1749400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "currency_rates" ADD COLUMN IF NOT EXISTS "coingecko_id" character varying`);

    await queryRunner.query(`
      UPDATE "currency_rates"
      SET "coingecko_id" = CASE
        WHEN "pair" = 'BTCUSD' THEN 'bitcoin'
        WHEN "pair" = 'ETHUSD' THEN 'ethereum'
        ELSE "coingecko_id"
      END
      WHERE "is_auto_update" = true
        AND "platform" = 'coingecko'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "currency_rates" DROP COLUMN IF EXISTS "coingecko_id"`);
  }
}
