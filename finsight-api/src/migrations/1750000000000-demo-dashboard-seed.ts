import { MigrationInterface, QueryRunner } from 'typeorm';

const DEMO_USER_ID = '10000000-0000-0000-0000-000000000001';
const DEMO_EMAIL = 'demo@finsight.ai';
const DEMO_PASSWORD_HASH = '$2b$10$aMdbN7JjAuKXTxMBRyYunu/s98zPDMFdspnLNhmPkNZY5lGaP6Mwi';

const currencies = [
  { id: '20000000-0000-0000-0000-000000000001', code: 'USD', name: 'US Dollar', symbol: '$', type: 'FIAT' },
  { id: '20000000-0000-0000-0000-000000000002', code: 'VND', name: 'Vietnamese Dong', symbol: '₫', type: 'FIAT' },
  { id: '20000000-0000-0000-0000-000000000003', code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'CRYPTO' },
  { id: '20000000-0000-0000-0000-000000000004', code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'CRYPTO' },
  { id: '20000000-0000-0000-0000-000000000005', code: 'GOLD', name: 'Gold', symbol: 'Au', type: 'GOLD' },
  { id: '20000000-0000-0000-0000-000000000006', code: 'AAPL', name: 'Apple Inc.', symbol: null, type: 'STOCK' },
  { id: '20000000-0000-0000-0000-000000000007', code: 'TSLA', name: 'Tesla, Inc.', symbol: null, type: 'STOCK' },
  { id: '20000000-0000-0000-0000-000000000008', code: 'NVDA', name: 'NVIDIA Corporation', symbol: null, type: 'STOCK' },
] as const;

const currencyRates: Array<{
  id: string;
  pair: string;
  base: string;
  quote: string;
  ratio: string;
  isAutoUpdate?: boolean;
  platform?: string;
  coingeckoId?: string;
}> = [
  { id: '30000000-0000-0000-0000-000000000001', pair: 'USDUSD', base: 'USD', quote: 'USD', ratio: '1' },
  { id: '30000000-0000-0000-0000-000000000002', pair: 'USDVND', base: 'USD', quote: 'VND', ratio: '26200' },
  {
    id: '30000000-0000-0000-0000-000000000003',
    pair: 'BTCUSD',
    base: 'BTC',
    quote: 'USD',
    ratio: '68500',
    isAutoUpdate: true,
    platform: 'coingecko',
    coingeckoId: 'bitcoin',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    pair: 'ETHUSD',
    base: 'ETH',
    quote: 'USD',
    ratio: '3600',
    isAutoUpdate: true,
    platform: 'coingecko',
    coingeckoId: 'ethereum',
  },
  { id: '30000000-0000-0000-0000-000000000005', pair: 'GOLDUSD', base: 'GOLD', quote: 'USD', ratio: '2350' },
  { id: '30000000-0000-0000-0000-000000000006', pair: 'AAPLUSD', base: 'AAPL', quote: 'USD', ratio: '210' },
  { id: '30000000-0000-0000-0000-000000000007', pair: 'TSLAUSD', base: 'TSLA', quote: 'USD', ratio: '185' },
  { id: '30000000-0000-0000-0000-000000000008', pair: 'NVDAUSD', base: 'NVDA', quote: 'USD', ratio: '122' },
] as const;

const transactionCategories = [
  { id: '00000000-0000-0000-0000-000000000001', code: 'FOOD_DRINK', value: 'Food & Drink' },
  { id: '00000000-0000-0000-0000-000000000002', code: 'SHOPPING', value: 'Shopping' },
  { id: '00000000-0000-0000-0000-000000000003', code: 'HOUSING', value: 'Housing' },
  { id: '00000000-0000-0000-0000-000000000004', code: 'TRANSPORTATION', value: 'Transportation' },
  { id: '00000000-0000-0000-0000-000000000005', code: 'ENTERTAINMENT', value: 'Entertainment' },
  { id: '00000000-0000-0000-0000-000000000006', code: 'HEALTH', value: 'Health' },
  { id: '00000000-0000-0000-0000-000000000007', code: 'INVESTMENT', value: 'Investment' },
  { id: '00000000-0000-0000-0000-000000000008', code: 'INCOME', value: 'Income' },
  { id: '00000000-0000-0000-0000-000000000009', code: 'OTHERS', value: 'Others' },
] as const;

const assets = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    name: 'Bitcoin Core Position',
    category: 'CRYPTO',
    currency: 'BTC',
    purchaseCurrency: 'USD',
    purchasePrice: '59000',
    quantity: '0.82',
    date: '2026-05-28',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    name: 'Ethereum Staking',
    category: 'CRYPTO',
    currency: 'ETH',
    purchaseCurrency: 'USD',
    purchasePrice: '3120',
    quantity: '12.5',
    date: '2026-05-18',
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    name: 'Apple Long-term Hold',
    category: 'STOCK',
    currency: 'AAPL',
    purchaseCurrency: 'USD',
    purchasePrice: '185',
    quantity: '55',
    date: '2026-05-10',
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    name: 'Tesla Growth Basket',
    category: 'STOCK',
    currency: 'TSLA',
    purchaseCurrency: 'USD',
    purchasePrice: '235',
    quantity: '18',
    date: '2026-05-04',
  },
  {
    id: '40000000-0000-0000-0000-000000000005',
    name: 'NVIDIA Momentum',
    category: 'STOCK',
    currency: 'NVDA',
    purchaseCurrency: 'USD',
    purchasePrice: '98',
    quantity: '42',
    date: '2026-04-26',
  },
  {
    id: '40000000-0000-0000-0000-000000000006',
    name: 'Gold Hedge',
    category: 'GOLD',
    currency: 'GOLD',
    purchaseCurrency: 'USD',
    purchasePrice: '2080',
    quantity: '14.5',
    date: '2026-04-19',
  },
  {
    id: '40000000-0000-0000-0000-000000000007',
    name: 'Emergency Cash Reserve',
    category: 'FIAT',
    currency: 'USD',
    purchaseCurrency: 'USD',
    purchasePrice: '1',
    quantity: '18000',
    date: '2026-04-01',
  },
] as const;

const transactions = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    date: '2026-06-05',
    amount: '9500',
    category: 'INCOME',
    description: 'Monthly salary',
    type: 'income',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    date: '2026-06-03',
    amount: '72.40',
    category: 'FOOD_DRINK',
    description: 'Groceries and lunch',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000003',
    date: '2026-06-01',
    amount: '2600',
    category: 'HOUSING',
    description: 'Apartment rent',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000004',
    date: '2026-05-30',
    amount: '1800',
    category: 'INCOME',
    description: 'Freelance client payment',
    type: 'income',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000005',
    date: '2026-05-28',
    amount: '240',
    category: 'SHOPPING',
    description: 'Office chair and desk accessories',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000006',
    date: '2026-05-26',
    amount: '95',
    category: 'TRANSPORTATION',
    description: 'Ride share and fuel',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000007',
    date: '2026-05-24',
    amount: '3250000',
    category: 'FOOD_DRINK',
    description: 'Weekend market run',
    type: 'expense',
    currency: 'VND',
  },
  {
    id: '50000000-0000-0000-0000-000000000008',
    date: '2026-05-21',
    amount: '180',
    category: 'HEALTH',
    description: 'Clinic visit and medicine',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000009',
    date: '2026-05-18',
    amount: '1200',
    category: 'INCOME',
    description: 'Project completion bonus',
    type: 'income',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-00000000000a',
    date: '2026-05-16',
    amount: '75',
    category: 'ENTERTAINMENT',
    description: 'Cinema and snacks',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-00000000000b',
    date: '2026-05-14',
    amount: '1500',
    category: 'INVESTMENT',
    description: 'Monthly brokerage transfer',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-00000000000c',
    date: '2026-05-12',
    amount: '45',
    category: 'OTHERS',
    description: 'Cloud storage and app subscriptions',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-00000000000d',
    date: '2026-05-09',
    amount: '1080000',
    category: 'TRANSPORTATION',
    description: 'Motorbike service and commute',
    type: 'expense',
    currency: 'VND',
  },
  {
    id: '50000000-0000-0000-0000-00000000000e',
    date: '2026-05-07',
    amount: '82',
    category: 'FOOD_DRINK',
    description: 'Coffee meetings and snacks',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-00000000000f',
    date: '2026-04-30',
    amount: '9500',
    category: 'INCOME',
    description: 'Monthly salary',
    type: 'income',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000010',
    date: '2026-04-28',
    amount: '4200000',
    category: 'SHOPPING',
    description: 'Home office lamp and peripherals',
    type: 'expense',
    currency: 'VND',
  },
  {
    id: '50000000-0000-0000-0000-000000000011',
    date: '2026-04-24',
    amount: '160',
    category: 'HEALTH',
    description: 'Dental checkup',
    type: 'expense',
    currency: 'USD',
  },
  {
    id: '50000000-0000-0000-0000-000000000012',
    date: '2026-04-20',
    amount: '1500',
    category: 'INVESTMENT',
    description: 'ETF top-up',
    type: 'expense',
    currency: 'USD',
  },
] as const;

const aiInsights = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    title: 'Spending stayed under control',
    content: 'Cash flow remained positive over the last 30 days. Housing is still the largest expense, but discretionary spend has stayed contained compared with the income trend.',
    type: 'success',
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    title: 'Portfolio is diversified',
    content: 'The portfolio now includes crypto, stocks, gold, and cash reserves. BTC and ETH are the largest growth drivers, while TSLA is the only notable drag on performance.',
    type: 'info',
  },
  {
    id: '60000000-0000-0000-0000-000000000003',
    title: 'Watch housing concentration',
    content: 'Rent still accounts for the biggest share of expenses. That is normal, but it is the line item most worth tracking when you compare month to month.',
    type: 'warning',
  },
] as const;

const chatHistory = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    role: 'user',
    content: 'Show me my spending summary for this month.',
    actionType: 'summarize_spending',
    actionData: { period: '30d' },
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    role: 'assistant',
    content: 'Your income is ahead of expenses for the current month. Housing and investment transfers are the biggest outflows, while food and transport remain moderate.',
    actionType: 'summarize_spending',
    actionData: { period: '30d', status: 'positive_cash_flow' },
  },
  {
    id: '70000000-0000-0000-0000-000000000003',
    role: 'user',
    content: 'What is driving portfolio performance?',
    actionType: 'analyze_assets',
    actionData: { focus: 'performance' },
  },
  {
    id: '70000000-0000-0000-0000-000000000004',
    role: 'assistant',
    content: 'BTC and ETH are the main growth engines. AAPL and NVDA are contributing positive unrealized gains, while TSLA is slightly below the purchase price.',
    actionType: 'analyze_assets',
    actionData: { gainLeaders: ['BTC', 'ETH', 'NVDA'], laggards: ['TSLA'] },
  },
] as const;

export class DemoDashboardSeed1750000000000 implements MigrationInterface {
  name = 'DemoDashboardSeed1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const category of transactionCategories) {
      await queryRunner.query(
        `
        INSERT INTO "transaction_categories" ("id", "code", "value")
        VALUES ($1, $2, $3)
        ON CONFLICT ("code")
        DO UPDATE SET
          "value" = EXCLUDED."value",
          "updated_at" = NOW()
      `,
        [category.id, category.code, category.value],
      );
    }

    for (const currency of currencies) {
      await queryRunner.query(
        `
        INSERT INTO "currencies" ("id", "code", "name", "symbol", "type")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("code")
        DO UPDATE SET
          "name" = EXCLUDED."name",
          "symbol" = EXCLUDED."symbol",
          "type" = EXCLUDED."type",
          "updated_at" = NOW()
      `,
        [currency.id, currency.code, currency.name, currency.symbol, currency.type],
      );
    }

    const persistedCurrencies = (await queryRunner.query(
      `
      SELECT "id", "code"
      FROM "currencies"
      WHERE "code" = ANY($1)
    `,
      [[...currencies.map((currency) => currency.code)]],
    )) as Array<{ id: string; code: string }>;

    const currencyIdByCode = new Map(persistedCurrencies.map((currency) => [currency.code, currency.id]));

    for (const rate of currencyRates) {
      await queryRunner.query(
        `
        INSERT INTO "currency_rates" (
          "id",
          "pair",
          "base_currency_code",
          "quote_currency_code",
          "ratio",
          "is_auto_update",
          "platform",
          "coingecko_id"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("pair")
        DO UPDATE SET
          "base_currency_code" = EXCLUDED."base_currency_code",
          "quote_currency_code" = EXCLUDED."quote_currency_code",
          "ratio" = EXCLUDED."ratio",
          "is_auto_update" = EXCLUDED."is_auto_update",
          "platform" = EXCLUDED."platform",
          "coingecko_id" = EXCLUDED."coingecko_id",
          "updated_at" = NOW()
      `,
        [rate.id, rate.pair, rate.base, rate.quote, rate.ratio, rate.isAutoUpdate ?? false, rate.platform ?? null, rate.coingeckoId ?? null],
      );
    }

    await queryRunner.query(`DELETE FROM "chat_history" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "ai_insights" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "transactions" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "assets" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "users" WHERE "id" = $1 OR "email" = $2`, [DEMO_USER_ID, DEMO_EMAIL]);

    await queryRunner.query(
      `
      INSERT INTO "users" ("id", "email", "password", "name", "defaultCurrency", "role")
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [DEMO_USER_ID, DEMO_EMAIL, DEMO_PASSWORD_HASH, 'Demo Account', 'USD', 'USER'],
    );

    for (const asset of assets) {
      const currencyId = currencyIdByCode.get(asset.currency) ?? null;
      const purchaseCurrencyId = currencyIdByCode.get(asset.purchaseCurrency) ?? null;

      await queryRunner.query(
        `
        INSERT INTO "assets" (
          "id",
          "user_id",
          "currency_id",
          "purchase_currency_id",
          "name",
          "category",
          "purchase_price",
          "quantity",
          "date"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT ("id")
        DO UPDATE SET
          "user_id" = EXCLUDED."user_id",
          "currency_id" = EXCLUDED."currency_id",
          "purchase_currency_id" = EXCLUDED."purchase_currency_id",
          "name" = EXCLUDED."name",
          "category" = EXCLUDED."category",
          "purchase_price" = EXCLUDED."purchase_price",
          "quantity" = EXCLUDED."quantity",
          "date" = EXCLUDED."date",
          "updated_at" = NOW()
      `,
        [asset.id, DEMO_USER_ID, currencyId, purchaseCurrencyId, asset.name, asset.category, asset.purchasePrice, asset.quantity, asset.date],
      );
    }

    for (const transaction of transactions) {
      const currencyId = currencyIdByCode.get(transaction.currency) ?? null;

      await queryRunner.query(
        `
        INSERT INTO "transactions" (
          "id",
          "user_id",
          "currency_id",
          "date",
          "amount",
          "category_code",
          "description",
          "type"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("id")
        DO UPDATE SET
          "user_id" = EXCLUDED."user_id",
          "currency_id" = EXCLUDED."currency_id",
          "date" = EXCLUDED."date",
          "amount" = EXCLUDED."amount",
          "category_code" = EXCLUDED."category_code",
          "description" = EXCLUDED."description",
          "type" = EXCLUDED."type",
          "updated_at" = NOW()
      `,
        [transaction.id, DEMO_USER_ID, currencyId, transaction.date, transaction.amount, transaction.category, transaction.description, transaction.type],
      );
    }

    for (const insight of aiInsights) {
      await queryRunner.query(
        `
        INSERT INTO "ai_insights" ("id", "user_id", "title", "content", "type")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("id")
        DO UPDATE SET
          "user_id" = EXCLUDED."user_id",
          "title" = EXCLUDED."title",
          "content" = EXCLUDED."content",
          "type" = EXCLUDED."type",
          "updated_at" = NOW()
      `,
        [insight.id, DEMO_USER_ID, insight.title, insight.content, insight.type],
      );
    }

    for (const message of chatHistory) {
      await queryRunner.query(
        `
        INSERT INTO "chat_history" ("id", "user_id", "role", "content", "action_type", "action_data")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT ("id")
        DO UPDATE SET
          "user_id" = EXCLUDED."user_id",
          "role" = EXCLUDED."role",
          "content" = EXCLUDED."content",
          "action_type" = EXCLUDED."action_type",
          "action_data" = EXCLUDED."action_data",
          "updated_at" = NOW()
      `,
        [message.id, DEMO_USER_ID, message.role, message.content, message.actionType, JSON.stringify(message.actionData)],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "chat_history" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "ai_insights" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "transactions" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "assets" WHERE "user_id" = $1`, [DEMO_USER_ID]);
    await queryRunner.query(`DELETE FROM "users" WHERE "id" = $1 OR "email" = $2`, [DEMO_USER_ID, DEMO_EMAIL]);
  }
}
