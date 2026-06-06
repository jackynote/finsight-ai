# FinSight API

Backend service for FinSight AI. It provides authentication, transactions, assets, currency rates, AI insights, and chat-driven actions over REST and Socket.IO.

## Stack

- NestJS
- TypeORM
- PostgreSQL
- JWT and Passport
- Socket.IO
- Google Gemini integration
- CoinGecko integration for currency-rate sync

## Project Setup

```bash
$ yarn install
```

Copy `.env.example` to `.env` and fill in the local values before starting the app.

## Run the Project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

The backend listens on port `4000` by default.

## Environment

The main environment variables are:

- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_RUN_MIGRATIONS`
- `JWT_SECRET`
- `JWT_EXPIRATION`
- `GEMINI_API_KEY`
- `GEMINI_MODEL_ID`
- `COINGECKO_API_URL`
- `COINGECKO_API_KEY`
- `COINGECKO_API_KEY_HEADER`
- `PORT`

## Tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Migrations

Use the TypeORM migration scripts when the schema changes:

```bash
$ yarn run migration:run
$ yarn run migration:revert
```

## Security

- Keep `.env` local.
- Rotate any leaked secret immediately.
- Do not commit personal financial data or test data dumps.
