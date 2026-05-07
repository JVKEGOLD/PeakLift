# Security Policy

## Reporting

Do not post private user data, Supabase service-role keys, Apple signing credentials, or production secrets in GitHub issues.

For now, security issues should be handled privately by the repository owner.

## Secrets

- Only publish Supabase anon or publishable keys that are intended for client apps.
- Never commit Supabase service-role keys.
- Never commit Apple certificates, provisioning profiles, or App Store Connect API keys.
- Keep local `.env` files out of Git.
