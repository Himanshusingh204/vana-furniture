# Contributing

This is a closed-source, proprietary project (see [LICENSE](./LICENSE)). This guide is for the internal team and any contractors working on the codebase.

## Getting set up

Follow [Getting Started](./README.md#getting-started) in the README, then:

```bash
npm install --prefix server
npm install --prefix client
npm run dev
```

## Workflow

1. Branch from `main`: `git checkout -b fix/short-description` or `feat/short-description`.
2. Make focused changes. Prefer small, reviewable commits over one large one.
3. Run the checks locally before opening a PR:
   ```bash
   npm run test:security
   npm run build
   ```
4. Open a PR against `main` using the provided template. Link any related issue.

## Code style

- Match the existing pattern in the file you're editing before introducing a new one.
- Sentence case for UI copy, active voice, no exclamation marks in system messages.
- Comments explain *why*, not *what* — only add one where the reasoning genuinely isn't obvious from the code.
- No new npm dependencies without a clear reason; this project deliberately stays dependency-light (vanilla CSS, no state-management library, no React Router).

## Security

- Never commit real credentials, `.env` files, or API keys. `server/.env.example` documents every variable that's needed.
- If you find a security issue, see [SECURITY.md](./SECURITY.md) instead of opening a public issue.

## Commit messages

Keep the summary line under ~70 characters, written in the imperative mood ("Fix order stage validation", not "Fixed" or "Fixes"). Add a body when the *why* isn't obvious from the diff.
