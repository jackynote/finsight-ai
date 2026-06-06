import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableCoingeckoAutoRates1749300000000
  implements MigrationInterface
{
  name = 'EnableCoingeckoAutoRates1749300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "currency_rates"
      SET
        "is_auto_update" = true,
        "platform" = 'coingecko'
      WHERE "pair" IN ('BTCUSD', 'ETHUSD')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "currency_rates"
      SET
        "is_auto_update" = false,
        "platform" = NULL
      WHERE "pair" IN ('BTCUSD', 'ETHUSD')
    `);
  }
}
