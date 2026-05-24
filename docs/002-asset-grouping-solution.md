# Technical Solution: Asset Grouping and Centralized Currency Management

## 1. Problem Statement
Users currently manage and update asset prices individually for each purchase lot. This is inefficient and lacks a centralized system to handle exchange rates, multi-currency display, and automated portfolio valuation.

## 2. Objectives
- **Grouping**: Aggregate asset lots by Name/Category in the UI.
- **Centralized Rates**: Update a single rate to reflect across all related assets.
- **Multi-Currency Support**: Support different base currencies (USD, VND) for display.
- **BaseEntity Consistency**: All new entities must extend `BaseEntity`.

## 3. Proposed Architecture

### A. Database Schema Changes (finsight-api)

#### 1. `currencies` Entity
Stores definitions of currencies, cryptocurrencies, or commodities.
- Extends `BaseEntity` (id, created_at, updated_at).
- `code`: string (e.g., "BTC", "USD", "VND").
- `symbol`: string (e.g., "₿", "$", "₫").
- `name`: string.
- `type`: enum (FIAT, CRYPTO, COMMODITY).

#### 2. `currency_rates` Entity
Stores current exchange rates relative to a base (USD).
- Extends `BaseEntity`.
- `currency_id`: FK to `currencies.id`.
- `rate_to_usd`: decimal.
- `last_updated`: timestamp (manually or via Cron).

#### 3. `assets` Entity Updates
- `currency_id`: FK to `currencies.id`.
- `purchase_price`: Price at the time of purchase (in USD).
- `current_price`: (Optional/Deprecated) Can be fetched via Join with `currency_rates`.

#### 4. `users` Entity Updates
- `default_currency_id`: FK to `currencies.id` for preferred display currency.

### B. Backend Management & Logic

#### 1. Data Seeding
- Pre-populate `currencies` with common assets: USD, VND, BTC, ETH, GOLD.
- Initial rates in `currency_rates`.

#### 2. Rate Update Strategy
- **Manual**: `PATCH /currencies/:code/rate` for immediate updates.
- **Automated (Future)**: Integration with external APIs (CoinGecko, Yahoo Finance) via Cron Jobs to update `currency_rates` every 5-15 minutes.

#### 3. Calculation Logic
When fetching assets, the service will:
- **Current Value** = `quantity` * `current_rate_to_usd`.
- **Profit/Loss** = `Current Value` - (`quantity` * `purchase_price`).
- **Display Conversion** = If user's default is VND, multiply USD values by the `USD/VND` rate.

### C. Frontend Implementation

#### 1. Grouped Display
Frontend will group assets by `currency_id` (or name) using `useMemo`:
```typescript
interface GroupedAsset {
  currencyCode: string;
  totalQuantity: number;
  currentValueUsd: number;
  totalPurchaseValueUsd: number;
  avgPurchasePriceUsd: number;
  lots: Asset[];
}
```

#### 2. UI Components
- **Asset Card**: Shows consolidated data for each asset type.
- **Global Settings**: Allow users to switch their preferred display currency.

## 4. Implementation Steps
1. **Backend**: Create `Currency` and `CurrencyRate` entities (extending `BaseEntity`).
2. **Backend**: Implement Seeding logic for base currencies.
3. **Backend**: Create `CurrenciesModule` with controllers for rate updates.
4. **Backend**: Update `AssetsModule` to link assets with currencies.
5. **Frontend**: Update `financeService` and `App.tsx` to handle grouped data and currency conversion.

## 5. Benefits
- **Efficiency**: One update changes all related assets.
- **Consistency**: Centralized source of truth for all rates.
- **Flexibility**: Support for any currency/asset type.
