import { MigrationInterface, QueryRunner } from 'typeorm';

const TRANSACTION_CATEGORIES = [
  { code: 'FOOD_DRINK', value: 'Food & Drink' },
  { code: 'SHOPPING', value: 'Shopping' },
  { code: 'HOUSING', value: 'Housing' },
  { code: 'TRANSPORTATION', value: 'Transportation' },
  { code: 'ENTERTAINMENT', value: 'Entertainment' },
  { code: 'HEALTH', value: 'Health' },
  { code: 'INVESTMENT', value: 'Investment' },
  { code: 'INCOME', value: 'Income' },
  { code: 'OTHERS', value: 'Others' },
] as const;

export class TransactionCategoriesBackfill1749000000000
  implements MigrationInterface
{
  name = 'TransactionCategoriesBackfill1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLegacyCategoryColumn = await queryRunner.hasColumn(
      'transactions',
      'category',
    );
    const hasCategoryCodeColumn = await queryRunner.hasColumn(
      'transactions',
      'category_code',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transaction_categories" (
        "id" uuid NOT NULL,
        "code" character varying NOT NULL,
        "value" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_transaction_categories_code" UNIQUE ("code"),
        CONSTRAINT "PK_transaction_categories_id" PRIMARY KEY ("id")
      )
    `);

    for (let index = 0; index < TRANSACTION_CATEGORIES.length; index += 1) {
      const category = TRANSACTION_CATEGORIES[index];
      await queryRunner.query(
        `
        INSERT INTO "transaction_categories" ("id", "code", "value")
        VALUES ($1, $2, $3)
        ON CONFLICT ("code") DO NOTHING
      `,
        [
          `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
          category.code,
          category.value,
        ],
      );
    }

    if (!hasCategoryCodeColumn) {
      await queryRunner.query(`
        ALTER TABLE "transactions"
        ADD COLUMN "category_code" character varying
      `);
    }

    if (hasLegacyCategoryColumn) {
      await queryRunner.query(`
        UPDATE "transactions"
        SET "category_code" = CASE COALESCE("category"::text, 'OTHERS')
          ${TRANSACTION_CATEGORIES.map(
            (category) =>
              `WHEN '${category.code}' THEN '${category.code}'`,
          ).join('\n          ')}
          ELSE 'OTHERS'
        END
      `);
    }

    await queryRunner.query(`
      UPDATE "transactions"
      SET "category_code" = COALESCE("category_code", 'OTHERS')
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "category_code" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_transactions_category_code'
        ) THEN
          ALTER TABLE "transactions"
          ADD CONSTRAINT "FK_transactions_category_code"
          FOREIGN KEY ("category_code") REFERENCES "transaction_categories"("code")
          ON UPDATE CASCADE
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    if (hasLegacyCategoryColumn) {
      await queryRunner.query(`
        ALTER TABLE "transactions"
        DROP COLUMN IF EXISTS "category"
      `);

      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM pg_type
            WHERE typname = 'transactions_category_enum'
          ) THEN
            DROP TYPE "transactions_category_enum";
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCategoryCodeColumn = await queryRunner.hasColumn(
      'transactions',
      'category_code',
    );
    const hasLegacyCategoryColumn = await queryRunner.hasColumn(
      'transactions',
      'category',
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'transactions_category_enum'
        ) THEN
          CREATE TYPE "transactions_category_enum" AS ENUM (
            'FOOD_DRINK',
            'SHOPPING',
            'HOUSING',
            'TRANSPORTATION',
            'ENTERTAINMENT',
            'HEALTH',
            'INVESTMENT',
            'INCOME',
            'OTHERS'
          );
        END IF;
      END $$;
    `);

    if (!hasLegacyCategoryColumn) {
      await queryRunner.query(`
        ALTER TABLE "transactions"
        ADD COLUMN "category" "transactions_category_enum"
      `);
    }

    if (hasCategoryCodeColumn) {
      await queryRunner.query(`
        UPDATE "transactions"
        SET "category" = COALESCE("category_code", 'OTHERS')::"transactions_category_enum"
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "category" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      DROP CONSTRAINT IF EXISTS "FK_transactions_category_code"
    `);

    if (hasCategoryCodeColumn) {
      await queryRunner.query(`
        ALTER TABLE "transactions"
        DROP COLUMN IF EXISTS "category_code"
      `);
    }

    await queryRunner.query(`
      DROP TABLE IF EXISTS "transaction_categories"
    `);
  }
}
