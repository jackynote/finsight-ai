# Security Policy

## Supported Reporting

If you find a vulnerability, secret exposure, or privacy issue in FinSight AI, report it privately through GitHub Security Advisories for the repository.

## What to Report

- API keys, passwords, tokens, or private certificates in source code or history
- Exposure of user financial data, identifiers, or other personal information
- Authentication or authorization bypasses
- Unsafe deployment or configuration defaults

## What We Will Do

- Acknowledge the report
- Triage impact and scope
- Rotate or revoke exposed credentials when needed
- Patch the issue and document the fix

## Immediate Actions for a Secret Leak

If a secret appears in the repository or commit history:

1. Revoke or rotate the secret immediately.
2. Remove the secret from the working tree.
3. Rewrite git history if the secret was committed.
4. Force-push the cleaned history only after verifying the repository is clean.

