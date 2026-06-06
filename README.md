# FinSight AI

FinSight AI is a personal finance monorepo with a NestJS backend and a React/Vite frontend. It tracks transactions, assets, currency rates, and AI-assisted insights for personal finance management.

## Stack

- Backend: NestJS, TypeORM, PostgreSQL, JWT, Passport, Socket.IO, Google Gemini, CoinGecko
- Frontend: React 19, Vite, TypeScript, Tailwind CSS, Axios, React Router, Recharts, Socket.IO client

## Repository Layout

- `finsight-api/`: API, auth, finance, assets, transactions, AI, migrations
- `finsight-web/`: Client app, dashboard, insights, assistant, settings, auth UI
- `docs/`: implementation notes and deployment checklists

## Local Setup

1. Prepare the database:
   ```bash
   docker compose up
   ```

2. Install and configure the backend:
   ```bash
   cd finsight-api
   yarn install
   cp .env.example .env
   yarn run start:dev
   ```

3. Install and configure the frontend:
   ```bash
   cd finsight-web
   npm install
   cp .env.example .env
   npm run dev
   ```

4. Point `VITE_API_URL` at the backend, usually `http://localhost:4000`.

## Docker Compose

For a quicker developer setup, run PostgreSQL with Docker and keep the API and web app running locally:

```bash
docker compose up
```

This starts:

- PostgreSQL on `localhost:5432`

Use the normal local commands for the apps:

- API: `cd finsight-api && yarn run start:dev`
- Web: `cd finsight-web && npm run dev`

If you want to override the Postgres defaults, copy [.env.example](./.env.example) to [.env](./.env) and adjust the values there.

## Package Commands

### Backend

```bash
cd finsight-api
yarn run start
yarn run start:dev
yarn run start:prod
yarn run test
yarn run test:e2e
yarn run test:cov
yarn run migration:run
yarn run migration:revert
```

### Frontend

```bash
cd finsight-web
npm run dev
npm run build
npm run preview
npm run lint
```

## Environment

### Backend variables

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

### Frontend variables

- `VITE_API_URL`

## Security Notes

- Never commit `.env` files, API keys, passwords, tokens, or exported personal data.
- If a secret was ever committed, rotate it first and then remove it from history before publishing the repository.
- Use `finsight-api/.env.example` and `finsight-web/.env.example` as the source of truth for local configuration.

## Contribution

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
- Follow the project code of conduct in [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
- Report security issues through the process in [SECURITY.md](./SECURITY.md).

## License

Released under the MIT License. See [LICENSE](./LICENSE).
