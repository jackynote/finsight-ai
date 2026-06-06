# Open Source Release Checklist

Use this checklist before making the repository public.

## GitHub Repository Settings

- Enable secret scanning.
- Enable push protection for all branches.
- Protect `main`.
- Require pull requests before merging.
- Require at least 1 approving review.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merge.
- Require status checks to pass before merge.
- Restrict who can push to protected branches.

## Required Status Checks

Configure branch protection to require the checks from `.github/workflows/ci.yml`:

- `API`
- `Web`

## Repository Files

- Root `README.md`
- Root `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/`

## Secret and Data Review

- Search for API keys, passwords, tokens, private keys, and connection strings.
- Review git history for leaked environment files or credentials.
- Rotate any exposed secret before publishing.
- Remove user data, sample production exports, and personal notes.

