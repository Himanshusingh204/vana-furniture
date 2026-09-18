# Deployment and Operations Guide

## Local development

Install dependencies and start both services from the repository root:

```bash
npm install --prefix server
npm install --prefix client
npm run dev
```

Defaults:

- Client: `http://localhost:5173`
- API and WebSocket server: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

The root `scripts/dev.js` starts both child processes and frees port 5000 on Windows before launching the backend. `start-dev.bat` and `run.bat` are available as Windows helpers (see the [README](../README.md#windows-launch-scripts)).

## Production

Build and start the combined service:

```bash
npm run build
npm start
```

Set `PORT` to the platform-provided port. The server binds to `0.0.0.0`, serves `client/dist` when it exists, exposes the API under `/api`, and serves bundled sample CAD files under `/cad`.

## Required configuration

Copy `server/.env.example` to `server/.env` and set real values, or supply these as deployment secrets/environment variables:

- `NODE_ENV=production`
- `PORT`
- `JWT_SECRET` (required — the server refuses to boot in production without it)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (required — the server refuses to boot in production without it)
- `ALLOWED_ORIGINS` (optional, comma-separated; defaults to a localhost dev whitelist if unset)

Authentication is bcrypt-hash only (`ADMIN_PASSWORD_HASH` or `server/data/users.json`) and fails closed on hash errors — there is no plaintext `ADMIN_PASSWORD` fallback. Never commit real credentials to source control.

## Persistent data

The backend writes:

- `server/data/furniture_store.json`
- `server/uploads/cad/` (private CAD — never expose via a static route)
- `server/uploads/products/` (product photos — intentionally public at `/uploads`)

Both locations need private, persistent storage if quotes, orders, audit logs, or uploads must survive restarts and redeployments. A single server instance is recommended: the JSON store does not coordinate concurrent writes across replicas.

## Health and verification

```bash
npm run test:security
```

Use `GET /api/health` for liveness and a WebSocket connection to `ws://<host>/` for socket diagnostics. Check that the health response reports `status: "healthy"` and that the built client loads from the same production port.

## Backup and restore drill

```bash
npm run backup              # snapshot store + inventory to backups/ (keeps 10, rotates older)
npm run restore -- --dry-run # validate latest snapshot, change nothing
npm run restore             # restore latest (writes pre-restore-<stamp> safety copy first)
npm run restore -- --file=<name> # restore a named snapshot
```

Recommended: nightly `npm run backup`, off-host copy of `backups/` plus `server/uploads/cad/`. Before any restore, confirm the safety copy exists; after restore, compare collection counts from the command output against expectations.

## Operational checklist

- Use strong, unique JWT and administrator secrets.
- Back up the JSON store and uploaded CAD files using encrypted private storage.
- Review application logs for server errors and upload rejections.
- Keep Node.js and npm dependencies patched.
- Test the build and security suite before each release.
- Do not expose `server/data` or `server/uploads` through a static route.
