# Currency Rate Production Deploy Checklist

## Scope
This document covers the production rollout for the `currency_rates` refactor:
- Remove `rate_to_usd`
- Add `pair`
- Add `ratio`
- Add `is_auto_update`
- Add `platform`

Example:
- `pair = USDVND`
- `ratio = 26200`
- Meaning: `1 USD = 26200 VND`

## Files Included In This Change
- `finsight-api/src/currencies/entities/currency-rate.entity.ts`
- `finsight-api/src/currencies/dto/update-rate.dto.ts`
- `finsight-api/src/currencies/currencies.service.ts`
- `finsight-api/src/finance/finance.service.ts`
- `finsight-api/src/migrations/1749100000000-refactor-currency-rates.ts`
- `finsight-web/src/types/index.ts`
- `finsight-web/src/features/finance/financeService.ts`
- `finsight-web/src/features/finance/financeUtils.ts`
- `finsight-web/src/pages/Assets.tsx`

## Production Risk
The new backend code expects `currency_rates.pair`, `currency_rates.ratio`, `currency_rates.is_auto_update`, and `currency_rates.platform` to exist.

Do not deploy the new backend before the production database schema is updated.

## Deploy Order
1. Confirm production database backup exists.
2. Run the manual SQL on production database.
3. Verify the schema and backfilled data.
4. Deploy backend.
5. Smoke test backend currency and finance endpoints.
6. Deploy frontend.
7. Smoke test asset and dashboard flows.

## Pre-Deploy Checklist
- [ ] Confirm the backend release includes the currency-rate refactor.
- [ ] Confirm the frontend release includes the updated `CurrencyRate` shape.
- [ ] Confirm a production database backup or snapshot is available.
- [ ] Confirm a person with production DB access is assigned.
- [ ] Confirm deployment window and rollback owner.

## Manual SQL To Run In Production
```sql
ALTER TABLE "currency_rates"
ADD COLUMN IF NOT EXISTS "pair" character varying,
ADD COLUMN IF NOT EXISTS "ratio" numeric(18,8),
ADD COLUMN IF NOT EXISTS "is_auto_update" boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "platform" character varying;

UPDATE "currency_rates" cr
SET
  "pair" = CASE
    WHEN c."code" = 'USD' THEN 'USDUSD'
    WHEN c."code" = 'VND' THEN 'USDVND'
    ELSE c."code" || 'USD'
  END,
  "ratio" = CASE
    WHEN c."code" = 'USD' THEN 1
    WHEN c."code" = 'VND' THEN CASE
      WHEN cr."rate_to_usd" IS NULL OR cr."rate_to_usd" = 0 THEN NULL
      ELSE 1 / cr."rate_to_usd"
    END
    ELSE cr."rate_to_usd"
  END
FROM "currencies" c
WHERE c."id" = cr."currency_id";

ALTER TABLE "currency_rates"
ALTER COLUMN "pair" SET NOT NULL;

ALTER TABLE "currency_rates"
ALTER COLUMN "ratio" SET NOT NULL;

ALTER TABLE "currency_rates"
DROP COLUMN IF EXISTS "rate_to_usd";
```

## Database Verification Queries
Run these after the SQL and before backend deploy.

### 1. Confirm new columns exist
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'currency_rates'
ORDER BY ordinal_position;
```

Expected:
- `pair`
- `ratio`
- `is_auto_update`
- `platform`
- No `rate_to_usd`

### 2. Confirm no null values for required fields
```sql
SELECT COUNT(*) AS invalid_rows
FROM "currency_rates"
WHERE "pair" IS NULL OR "ratio" IS NULL;
```

Expected:
- `invalid_rows = 0`

### 3. Inspect current rate records
```sql
SELECT
  c."code",
  cr."pair",
  cr."ratio",
  cr."is_auto_update",
  cr."platform"
FROM "currency_rates" cr
JOIN "currencies" c ON c."id" = cr."currency_id"
ORDER BY c."code";
```

Expected examples:
- `USD` -> `USDUSD`, `1`
- `VND` -> `USDVND`, around `26200` if using that reference
- `BTC` -> `BTCUSD`
- `ETH` -> `ETHUSD`

## Backend Smoke Test Checklist
Run these after backend deploy.

- [ ] `GET /currencies` returns `rates[].pair`
- [ ] `GET /currencies` returns `rates[].ratio`
- [ ] `GET /currencies` returns `rates[].is_auto_update`
- [ ] `GET /currencies` returns `rates[].platform`
- [ ] `PATCH /currencies/VND/rate` works with payload:

```json
{
  "pair": "USDVND",
  "ratio": 26200,
  "is_auto_update": false,
  "platform": null
}
```

- [ ] `GET /finance/totals` still returns valid numbers
- [ ] `GET /finance/dashboard` still returns valid totals and recent transactions

## Frontend Smoke Test Checklist
Run these after frontend deploy.

- [ ] Assets page loads without errors
- [ ] Grouped assets still display values correctly
- [ ] Updating a currency-backed asset rate still works
- [ ] Dashboard totals still render
- [ ] Default currency conversion still works for non-USD users

## Rollback Notes
If the backend has not yet been deployed, stop and fix the production SQL/data issue first.

If the backend has already been deployed and a rollback is required, you need both:
1. Application rollback to the old backend/frontend release
2. Database rollback SQL if the old backend still requires `rate_to_usd`

Reference rollback logic is in:
- `finsight-api/src/migrations/1749100000000-refactor-currency-rates.ts`

## Deployment Sign-Off
- [ ] Production SQL executed
- [ ] DB verification queries passed
- [ ] Backend deployed
- [ ] Backend smoke tests passed
- [ ] Frontend deployed
- [ ] Frontend smoke tests passed
- [ ] Team notified that currency-rate refactor is live
