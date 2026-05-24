# Repository Guidelines

## Project Structure & Module Organization
This repository is a monorepo consisting of a NestJS backend and a React frontend.

- **finsight-api/**: Backend services built with NestJS. Follows standard NestJS architecture (`src/` for logic, `test/` for unit and E2E tests).
- **finsight-web/**: Frontend application built with React 19 and Vite. Uses Tailwind CSS for styling, Recharts for data visualization, and integrates Google Gemini (Gemini 3 Flash) for AI-driven insights.

## Build, Test, and Development Commands
Each module manages its own dependencies and scripts.

### Backend (finsight-api)
- **Install**: `yarn install`
- **Development**: `yarn run start:dev`
- **Build**: `yarn run build`
- **Lint**: `yarn run lint`
- **Test**: `yarn run test` (unit), `yarn run test:e2e` (E2E)

### Frontend (finsight-web)
- **Install**: `npm install`
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Type Check**: `npm run lint` (`tsc --noEmit`)

## Coding Style & Naming Conventions
The project enforces type safety and consistent formatting.

- **TypeScript**: Used across the entire stack.
- **Formatting**: `finsight-api` uses Prettier for automated formatting.
- **Entities**: All backend entities in `finsight-api` must extend `BaseEntity` (located in `src/common/entities/base.entity.ts`) to ensure consistency in ID, creation, and update timestamps.
- **Linting**: `finsight-api` uses ESLint with `typescript-eslint` recommended rules. `no-explicit-any` is disabled, while `no-floating-promises` and `no-unsafe-argument` are set to `warn`.
- **Styling**: `finsight-web` utilizes utility-first CSS via Tailwind CSS.

## Testing Guidelines
- **Framework**: `finsight-api` uses **Jest**.
- **Coverage**: Coverage reports can be generated via `yarn run test:cov` in the API directory.
- **Environment**: Backend tests run in a Node.js environment.
