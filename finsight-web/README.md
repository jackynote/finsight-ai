# FinSight Web

Frontend application for FinSight AI. It provides the dashboard, transactions, assets, currency-rate views, authentication, and the AI assistant UI.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios
- Recharts
- Socket.IO client

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from [.env.example](.env.example) and set `VITE_API_URL`.
3. Start the app:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Environment

The frontend currently uses:

- `VITE_API_URL`

## Notes

- Use `npm` for this package. The repository keeps `package-lock.json` as the lockfile for the frontend.
- Do not commit local env files or personal browser/session data.
