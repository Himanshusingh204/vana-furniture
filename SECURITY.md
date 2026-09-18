# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in this project, please report it privately rather than opening a public issue.

Contact the repository owner directly with:

- A description of the vulnerability and its potential impact.
- Steps to reproduce (proof of concept, if available).
- Any suggested fix or mitigation.

You should expect an initial response within a few days. Please allow a reasonable window to investigate and patch before any public disclosure.

## Supported scope

This is a single-deployment application (one production instance, not a multi-tenant SaaS). The security controls in place are documented in full in [docs/security.md](./docs/security.md), and include:

- Bcrypt + JWT authentication, fail-closed in production (no plaintext credential fallback).
- Role-based access control (`admin` / `editor` / `viewer`) on all authenticated mutation routes.
- Helmet CSP, strict CORS allowlisting, tiered rate limiting per route.
- CAD upload validation (extension allowlist, size cap, magic-byte checks) and path-traversal guards on file downloads.
- Atomic JSON persistence and audit logging with IP masking.

## Out of scope

- Denial-of-service testing against the live production instance.
- Automated scanning that generates significant load.
- Social engineering against the team.

Run `npm run test:security` to execute the project's own automated security regression suite locally.
