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

1. Install and configure the backend:
   ```bash
   cd finsight-api
   yarn install
   cp .env.example .env
   yarn run start:dev
   ```

2. Install and configure the frontend:
   ```bash
   cd finsight-web
   npm install
   cp .env.example .env
   npm run dev
   ```

3. Point `VITE_API_URL` at the backend, usually `http://localhost:4000`.

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

