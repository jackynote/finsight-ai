# Contributing to FinSight AI

## Ground Rules

- Do not commit secrets, `.env` files, database dumps, or personal data.
- Keep changes focused. One feature or fix per pull request is the default.
- Prefer the existing stack and project structure over new abstractions.
- Add or update tests when behavior changes.
- Do not rewrite unrelated code or reformat entire packages without a reason.

## Branches and Commits

- Use short, descriptive branch names such as `feat/asset-filters` or `fix/auth-refresh`.
- Conventional commits are preferred, for example `feat: add asset filters`.
- Keep commit messages and pull request titles accurate and specific.

## Before You Open a Pull Request

- Backend changes:
  - `cd finsight-api`
  - `yarn run lint`
  - `yarn run test`
  - `yarn run build`
- Frontend changes:
  - `cd finsight-web`
  - `npm run lint`
  - `npm run build`
- UI changes should include screenshots or a short screen recording when useful.

## Database Changes

- Add a migration for schema changes.
- Do not rely on silent schema sync in new work.
- Verify the migration path works on a clean database and on existing data.

## Security and Data Handling

- Treat user financial data as sensitive.
- Avoid logging full payloads when they may include secrets or personal information.
- If you discover a secret or credential in the repository, stop and rotate it before continuing.

## Review Expectations

- Keep pull requests small enough to review quickly.
- Document behavior changes in the relevant README or docs file.
- Call out any breaking change explicitly in the PR description.

