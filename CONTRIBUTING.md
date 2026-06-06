# Contributing to FinSight AI

Thank you for contributing to FinSight AI. This guide describes the project’s development and Git workflow.

## Ground Rules

- Do not commit secrets, `.env` files, database dumps, or personal data.
- Keep changes focused. One feature or fix per pull request is the default.
- Prefer the existing stack and project structure over new abstractions.
- Add or update tests when behavior changes.
- Do not rewrite unrelated code or reformat entire packages without a reason.

## Branch Model

The repository uses two long-lived branches:

- **`main`**: Stable, production-ready code. API changes merged here may trigger production deployment.
- **`dev`**: Integration branch for features, fixes, documentation, and maintenance work.

Create contributor branches from `dev` and open pull requests against `dev`. Do not work directly on `main` or `dev`.

## Branch Naming

Use lowercase, hyphen-separated names with a category prefix:

| Change | Pattern | Example |
| --- | --- | --- |
| Feature | `feature/<description>` | `feature/asset-filters` |
| Bug fix | `bugfix/<description>` | `bugfix/auth-refresh` |
| Documentation | `docs/<description>` | `docs/update-setup` |
| Refactor | `refactor/<description>` | `refactor/currency-service` |
| Tests | `test/<description>` | `test/transaction-service` |
| Maintenance | `chore/<description>` | `chore/update-dependencies` |
| Urgent fix | `hotfix/<description>` | `hotfix/login-failure` |

Use:

- **`feature/**`**: Implement a new feature.
- **`bugfix/**`**: Fix a non-urgent issue.
- **`docs/**`**: Add or update documentation.
- **`refactor/**`**: Improve code structure without changing behavior.
- **`test/**`**: Add or update tests.
- **`chore/**`**: Perform maintenance or dependency work.
- **`hotfix/**`**: Fix an urgent production issue.

Include an issue number when useful, for example `bugfix/123-auth-refresh`.

## Contributor Git Workflow

### 1. Fork and clone

Fork the repository on GitHub, then clone your fork and add the official repository as `upstream`:

```bash
git clone https://github.com/<your-username>/finsight-ai.git
cd finsight-ai
git remote add upstream https://github.com/jackynote/finsight-ai.git
```

### 2. Synchronize `dev`

```bash
git fetch upstream
git switch dev
git merge --ff-only upstream/dev
git push origin dev
```

### 3. Create a working branch

```bash
git switch -c feature/asset-filters
```

### 4. Make focused commits

[Conventional Commits](https://www.conventionalcommits.org/) are preferred:

```text
<type>(optional-scope): <short description>
```

Examples:

```text
feat(web): add asset category filters
fix(api): prevent duplicate currency rates
docs: explain local database setup
test(api): cover transaction ownership checks
chore: update frontend dependencies
```

Keep commits focused, and keep commit messages and pull request titles accurate and specific.

### 5. Validate the change

Run checks for every affected application.

**Backend:**

```bash
cd finsight-api
yarn run lint
yarn run test
yarn run build
```

**Frontend:**

```bash
cd finsight-web
npm run lint
npm run build
```

### 6. Update and push your branch

Rebase your work onto the latest `dev`:

```bash
git fetch upstream
git rebase upstream/dev
git push -u origin feature/asset-filters
```

If the branch was already pushed before rebasing, use:

```bash
git push --force-with-lease
```

Never use `git push --force` on a shared branch.

### 7. Open a pull request

Open the pull request against the upstream `dev` branch.

- Explain what changed and why.
- Link the related issue with `Closes #123` when applicable.
- Describe how the change was tested.
- Include screenshots or a recording for visible UI changes.
- Call out migrations, breaking changes, security considerations, and deployment steps.

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
- Ensure required CI checks pass and review conversations are resolved.
- Add follow-up commits when responding to review feedback.

Maintainers normally use **squash merge** so each pull request becomes one clear commit. Delete the working branch after it is merged.

## Resolving Rebase Conflicts

```bash
git fetch upstream
git rebase upstream/dev
```

For each conflict:

1. Edit the conflicted files.
2. Stage them with `git add <files>`.
3. Continue with `git rebase --continue`.

To cancel the rebase:

```bash
git rebase --abort
```

## Maintainer Release Workflow

When `dev` is ready for release:

1. Confirm CI passes and the release scope is understood.
2. Open a pull request from `dev` to `main`.
3. Document migrations, deployment steps, and rollback risks.
4. Complete final review and smoke testing.
5. Merge into `main` and verify the production deployment.
6. Synchronize `dev` with any commits created on `main`.

Do not push release changes directly to `main`.

## Hotfix Workflow

For an urgent production issue:

1. Create `hotfix/<description>` from the latest `main`.
2. Make the smallest safe change and run the relevant checks.
3. Open a pull request against `main`.
4. After merging, merge or cherry-pick the hotfix back into `dev`.

Hotfixes follow the normal review and CI requirements unless an active incident requires a documented exception.
