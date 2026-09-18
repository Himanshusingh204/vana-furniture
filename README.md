<div align="center">

# V A N A
### Architectural Hardwood Atelier & Bespoke CAD Manufacturing Platform

[![CI](https://github.com/Himanshusingh204/vana-furniture/actions/workflows/ci.yml/badge.svg)](https://github.com/Himanshusingh204/vana-furniture/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Live%20Telemetry-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![License](https://img.shields.io/badge/License-UNLICENSED-red?style=flat-square)](./LICENSE)

<br />

<p align="center">
  <strong>VANA</strong> designs and handcrafts architectural timber furniture from kiln-seasoned Indian Sheesham, Royal Jodhpur Teak, and cast brass. It combines hand-planed mortise-and-tenon heritage with 5-axis CNC precision joinery to power a high-end residential storefront, bespoke hospitality commissions, and a digital CAD trade pipeline.
</p>

<p align="center">
  <a href="#project-overview">Project Overview</a> &bull;
  <a href="#system-design--architecture">System Design</a> &bull;
  <a href="#data-flow">Data Flow</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#environment-variables">Environment Variables</a> &bull;
  <a href="#api-reference">API Reference</a> &bull;
  <a href="#security">Security</a> &bull;
  <a href="#documentation">Documentation</a>
</p>

</div>

---

## Project Overview

VANA is a full-stack architectural furniture platform for an atelier based in the Basni Industrial Area, Jodhpur, Rajasthan. It has three core surfaces:

1. **Public storefront** — editorial storytelling, a cinematic hero carousel, a database-backed catalog with live search, a full-screen lightbox gallery, a Three.js 3D product viewer with exploded view, reviews, wishlist, and direct inquiry management.
2. **CAD & trade manufacturing engine** — a digital pipeline for architects and interior designers to upload technical drawings (`.dwg`, `.dxf`, `.step`, `.stp`, `.obj`, `.pdf`, `.zip`, up to 50MB per file) with automated validation, sanitization, and instant quote generation.
3. **Admin operations console** — a role-gated (`admin` / `editor` / `viewer`), authenticated single-page management dashboard with live KPIs, revenue analytics, order/quote/product/review/user management, and a real-time WebSocket telemetry feed.

## System Design & Architecture

VANA runs as two cooperating processes in development (Vite dev server + Express API) and collapses to a **single Node.js process in production** — the Express server serves the built React bundle, the REST API, and the WebSocket hub all from one port. There is no separate database server: persistence is a single atomically-written JSON file, chosen deliberately to keep the platform portable across free-tier, paid, and fully local/offline hosting without any managed database dependency.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Browser (React 18 SPA, dependency-free pushState router)                │
│  Theme · Auth · Inquiry · Socket context providers                       │
└───────────────┬───────────────────────────────────────────┬──────────────┘
                │ HTTPS REST  /api/*                        │ WebSocket
                v                                            v
┌──────────────────────────────────────────────────────────────────────────┐
│  Express server (single port, e.g. 5000)                                 │
│  helmet → cors → json/multipart → sanitize → rate-limit → audit          │
│                                                                            │
│  Public routes            Authenticated routes         Role-gated        │
│  ─────────────            ───────────────────         (editor/admin)    │
│  GET  /products            GET  /orders /quotes         PATCH stage      │
│  POST /quotes               GET  /analytics              PATCH status    │
│  POST /orders                GET  /audit-logs             POST /users    │
│  GET  /orders/:id (safe)      POST/PUT/DELETE /products    (admin only)  │
│  POST /reviews /wishlist                                                 │
│  POST /newsletter/subscribe                                              │
│  POST /payments/intent,/confirm                                          │
│                                                                            │
│         │                        │                                       │
│         v                        v                                       │
│  wsHub.js (ws)           FurnitureDatabase (server/db/database.js)       │
│  broadcast: PRODUCT_*,   in-memory model, atomic tmp+rename writes to    │
│  ORDER_*, QUOTE_*,       server/data/furniture_store.json                │
│  REVIEW_*, PAYMENT_*                                                     │
│                                    │                                     │
│                                    v                                     │
│                    server/uploads/cad (private) · /uploads (public)     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Design decisions and why

| Decision | Rationale |
| :--- | :--- |
| **Single JSON file over a managed DB** | Zero external dependency to run — clone, `npm install`, `npm run dev`, done. Deploys identically on a free-tier host, a paid VM, or fully offline/local. Trade-off: single-instance only, no concurrent-write coordination across replicas (documented, intentional). |
| **No React Router** | A ~40-line `pushState`/`popstate` router in `App.jsx` covers the app's flat route list without the dependency. Pages are still code-split via `React.lazy`. |
| **No CSS framework** | Design tokens as CSS custom properties (`client/src/styles/index.css`) give full control over the two brand themes (dark "Onyx" / light "Desert Alabaster") without a build-time framework or utility-class churn. |
| **WebSocket hub on the same HTTP server** | One process, one port, one deploy target — no separate real-time service to provision or keep in sync. |
| **Role-based access control (`admin`/`editor`/`viewer`)** | JWT carries a `role` claim; `requireRole` middleware gates every authenticated mutation route consistently. Only `admin` can manage other users; `editor`+ can moderate/mutate orders, quotes, reviews, products. |
| **Fail-closed secrets** | Production refuses to boot without `JWT_SECRET` and `ADMIN_PASSWORD_HASH` set via environment variables — there is no plaintext password fallback anywhere in the codebase. |

## Data Flow

### 1. Admin login → authenticated session

```text
Admin login form
  → POST /api/auth/login { email, password }
  → server/routes/auth.js: bcrypt.compare against server/data/users.json
      (falls back to config.ADMIN_EMAIL / ADMIN_PASSWORD_HASH if that file is absent)
  → on match: sign JWT { email, role, ip }, 1h expiry
  → client stores token in sessionStorage, AuthContext exposes { token, role, user }
  → every subsequent admin fetch sends Authorization: Bearer <token>
  → server middleware chain: requireAuth (verifies JWT + blacklist) → requireRole(...) per route
```

### 2. Product edit → live storefront update (WebSocket)

```text
Admin ProductEditor form (create or edit, unified)
  → PUT /api/products/:id (multipart: fields + optional image files)
  → server validates role, persists via multer + FurnitureDatabase, writes JSON atomically
  → wsHub.broadcast({ type: 'PRODUCT_UPDATED', id })
  → every connected browser's SocketContext receives the event
  → Catalog / Home / ProductDetail listeners refetch GET /api/products
  → storefront updates with no page reload, no polling
```

### 3. CAD trade inquiry → admin review → quote pipeline

```text
CustomTrade form (architect/designer)
  → multipart POST /api/quotes (cad_file ≤ 50MB, extension + magic-byte checked)
  → file stored under server/uploads/cad with a UUID filename (never the original name)
  → quote record created, status = "Received"
  → wsHub.broadcast({ type: 'QUOTE_SUBMITTED' })
  → admin QuotesPanel live-refreshes via SocketContext
  → admin reviews CAD file (GET /api/quotes/file/:filename, auth + basename guard)
  → PATCH /api/quotes/:id/status walks the 7-stage pipeline:
      Received → CAD Review → Timber Seasoning → CNC Milling →
      Joinery → Hand Finishing → Ready for Dispatch
```

### 4. Order placement → manufacturing → buyer tracking

```text
Checkout (test-mode) or admin-recorded order
  → POST /api/orders — server recalculates prices server-side (never trusts client totals),
    applies 18% GST, computes shipping (free above ₹1.5L), 50% deposit split
  → wsHub.broadcast({ type: 'ORDER_PLACED' }) → admin OrdersPanel live-refreshes
  → admin advances manufacturing_stage through 7 canonical stages
      (CAD & Timber Verification → Kiln & Cutting → CNC Milling →
       Hand Joinery & Assembly → Finishing & Oil Rubbing →
       Ready for Dispatch → Dispatched), enum-validated server-side
  → buyer visits /track/:order_number — sanitized public read (financials shown, PII scrubbed)
      renders the same stage timeline + a GST invoice + EMI calculator
```

### 5. Admin analytics aggregation

```text
Admin dashboard mount
  → parallel GET /analytics /orders /quotes /products /reviews /newsletter /payments /audit-logs /users
    (Promise.allSettled — one failing resource never blanks the whole console)
  → server/db/database.js#getRealAnalytics() derives, from the live JSON store:
      revenue_by_month_6m, orders_by_stage, quotes_by_status,
      avg_order_value_inr, top_collections, wood_inventory_distribution
  → AnalyticsPro renders dependency-free inline SVG charts (revenue trend, stage funnel,
    quote pipeline, wood-mix bars) — no charting library
  → any WebSocket event thereafter triggers a targeted partial refetch
    (only the affected resource reloads, not the full dashboard)
```

## Tech Stack

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| **Frontend UI** | React 18.3, JSX, vanilla CSS | Component system with CSS custom-property design tokens, light/dark themes |
| **Tooling & Build** | Vite 5 | Sub-second HMR and optimized production bundling |
| **3D Rendering** | Three.js | Canvas-based timber model rendering & exploded views |
| **Icons** | Lucide React | SVG icon set, used consistently across storefront and admin |
| **Backend API** | Node.js 18+, Express 4.19 | CommonJS modular REST API |
| **Real-Time Layer** | WebSocket (`ws`) | Event pub/sub for quotes, orders, reviews, payments, visitor counter, product sync |
| **Persistence** | Atomic JSON storage | Zero-dependency file-based store with seed/backup/restore tooling |
| **File Handling** | Multer | Extension, size, and magic-byte validated multipart uploads |
| **Security** | Helmet, bcrypt, JWT, express-rate-limit | Strict CSP, hashed passwords, role-based access control, tiered rate limits |
| **CI** | GitHub Actions | Runs the security test suite and a production build on every push/PR |

Routing is a lightweight, dependency-free history-API router in `client/src/App.jsx` (no React Router). See [docs/architecture.md](./docs/architecture.md) for the full runtime diagram, route table, and security control list.

## Getting Started

### Prerequisites

- **Node.js** v18.0.0 or newer
- **npm** v9.0.0 or newer

### Installation

```bash
git clone https://github.com/Himanshusingh204/vana-furniture.git
cd vana-furniture

# Install dependencies for both apps
npm install --prefix server
npm install --prefix client
```

### Configuration

Copy the server environment template and fill in real values before running in production:

```bash
cp server/.env.example server/.env
```

See [Environment Variables](#environment-variables) below.

### Running locally

```bash
npm run dev
```

This runs `scripts/dev.js`, which concurrently starts the Express backend and the Vite client (freeing port 5000 on Windows first if it's stuck).

| Service | URL | Notes |
| :--- | :--- | :--- |
| Storefront | `http://localhost:5173` | React 18 / Vite client |
| REST API | `http://localhost:5000/api/health` | Express server status |
| WebSocket hub | `ws://localhost:5000` | Real-time event gateway |
| Admin operations | `http://localhost:5173/admin` | Or press `Ctrl + Shift + A` |

### Windows launch scripts

Three `.bat` helpers are provided in the repo root:

| Script | Purpose |
| :--- | :--- |
| `start-dev.bat` | Installs missing dependencies, clears port 5000, launches `scripts/dev.js` (client + server), and opens the browser once Vite responds. |
| `start.bat` | Production launcher: installs dependencies if missing, builds `client/dist` if absent, starts `node server/server.js`, and opens the browser once `/api/health` responds. |
| `run.bat` | One-click shortcut that just calls `start.bat`. |

Double-click any of these in File Explorer, or run them from a terminal in the repo root.

## Available Scripts

All scripts run from the repository root (`package.json`):

| Command | Description |
| :--- | :--- |
| `npm run dev` | Concurrently runs the Express backend and Vite client |
| `npm run server` | Runs the backend only (`localhost:5000`) |
| `npm run client` | Runs the Vite frontend only (`localhost:5173`) |
| `npm run build` | Compiles production client assets to `client/dist` |
| `npm start` | Launches the production server (serves API + built frontend from one port) |
| `npm run seed` | Resets and seeds `server/data/furniture_store.json` from `server/db/seed.js` |
| `npm run backup` | Snapshots the JSON store + inventory to `backups/` (keeps 10, rotates older) |
| `npm run restore` | Restores the latest snapshot (`-- --dry-run` validates only, `-- --file=<name>` picks one) |
| `npm run test:security` | Runs the automated security & integrity test suite (41 assertions) |

## Environment Variables

Backend configuration lives in `server/config.js` and is overridden by environment variables. A documented template is provided at [`server/.env.example`](./server/.env.example) — copy it to `server/.env` and fill in real values. Key variables:

| Variable | Required in production | Purpose |
| :--- | :---: | :--- |
| `NODE_ENV` | — | `development` \| `production` \| `test` |
| `PORT` | — | HTTP/WebSocket listen port (default `5000`) |
| `JWT_SECRET` | Yes | Signs admin session JWTs; server refuses to boot without it in production |
| `ADMIN_EMAIL` | — | Admin login email |
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash of the admin password; server refuses to boot without it in production |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS whitelist; defaults to a localhost dev whitelist if unset |

> [!IMPORTANT]
> There is no plaintext admin password fallback. Authentication is bcrypt-hash only and fails closed. Never commit a real `.env` file — it is excluded via `.gitignore`. The dev-only fallback admin login (used only when `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` are unset in a non-production environment) is a placeholder credential defined in `server/config.js`, never a real one. Additional admin/editor/viewer accounts are managed through the authenticated `/api/users` endpoints (see [API Reference](#api-reference)) and stored in `server/data/users.json`, which is gitignored and never committed.

## Folder Structure

```text
├── client/              # React + Vite frontend (src/components, pages, context, styles, utils)
├── server/               # Express + WebSocket backend (routes, middleware, db, config)
│   ├── data/             # Runtime JSON store (gitignored)
│   ├── uploads/          # Runtime CAD & product uploads (gitignored)
│   └── .env.example      # Environment variable template
├── scripts/              # dev/backup/restore orchestration scripts
├── backups/               # Generated JSON snapshots (gitignored)
├── docs/                  # Architecture, deployment, security, CAD pipeline, TRD docs
├── .github/                # CI workflow, issue/PR templates, dependency updates
├── CHANGELOG.md            # Release history
├── CONTRIBUTING.md          # Internal contribution workflow
├── SECURITY.md               # Vulnerability reporting policy
├── CODE_OF_CONDUCT.md         # Contributor conduct standard
├── LICENSE                     # Proprietary / all-rights-reserved
├── package.json                 # Root scripts (source of truth for install/dev/build/start)
└── run.bat / start.bat / start-dev.bat   # Windows launch helpers
```

See [docs/file-structure.md](./docs/file-structure.md) for the fully annotated tree, including every client/server subdirectory and its responsibilities.

## API Reference

### Storefront & catalog (public)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status, memory usage, uptime |
| `GET` | `/api/products` | List furniture pieces with category/search filters |
| `GET` | `/api/products/:id` | Single piece specification |
| `POST` | `/api/quotes` | Submit a bespoke inquiry or CAD drawing package |
| `POST` | `/api/orders` | Place a test-mode order (server-validated pricing, GST, shipping) |
| `GET` | `/api/orders/:id` | Public sanitized order tracking |
| `GET`/`POST` | `/api/reviews` | List / submit product reviews (600-char cap) |
| `GET`/`POST`/`DELETE` | `/api/wishlist` | Cookie-keyed wishlist |
| `POST` | `/api/newsletter/subscribe` | Newsletter signup |
| `POST` | `/api/payments/intent`, `/confirm` | Test payment flow (`vanapay-test`; Razorpay seam ready, unwired) |

### Operations & telemetry (authenticated)

| Method | Endpoint | Description | Minimum role |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Admin login, returns a 1-hour JWT | — |
| `GET` | `/api/orders`, `/api/quotes`, `/api/reviews/all`, `/api/newsletter`, `/api/payments` | View operational data | any authenticated user |
| `PATCH` | `/api/orders/:id/stage`, `/api/quotes/:id/status` | Advance manufacturing/quote pipeline | `editor` |
| `POST`/`PUT`/`DELETE` | `/api/products` | Create, edit, remove catalog pieces | `editor` |
| `PATCH`/`DELETE` | `/api/reviews/:id` | Moderate reviews (approve/hide/feature/delete) | `editor` |
| `GET` | `/api/analytics`, `/api/analytics/audit-logs` | Atelier metrics + audit trail | any authenticated user |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/users` | Manage admin/editor/viewer accounts | `admin` |

Full route table (all route modules, including CAD file download and audit logs) is in [docs/architecture.md](./docs/architecture.md#api-routes-mounted-under-api-behind-the-global-rate-limiter).

## Security

The backend runs a defense-in-depth control set verified by an automated suite:

```bash
npm run test:security
```

Covers CSP (Helmet), CORS whitelisting, tiered rate limiting, fail-closed bcrypt/JWT auth, role-based access control, CAD upload validation, path traversal guards, and atomic JSON persistence. Found a vulnerability? See [SECURITY.md](./SECURITY.md) for how to report it responsibly. Full spec: [docs/security.md](./docs/security.md).

## Documentation

| Document | Contents |
| :--- | :--- |
| [docs/architecture.md](./docs/architecture.md) | System architecture, frontend/backend structure, full API route table, security controls |
| [docs/deployment.md](./docs/deployment.md) | Production hosting, required config, backup/restore drill, operational checklist |
| [docs/security.md](./docs/security.md) | Security audit specification and known limits |
| [docs/cad-pipeline.md](./docs/cad-pipeline.md) | CAD inquiry-to-factory manufacturing workflow |
| [docs/trd.md](./docs/trd.md) | Technical requirements and explicit non-goals |
| [docs/file-structure.md](./docs/file-structure.md) | Fully annotated repository tree |
| [CHANGELOG.md](./CHANGELOG.md) | Release history (Keep a Changelog / SemVer) |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Internal development workflow and code style |

## Sustainability & Craft

- **Certified timber** — Indian Sheesham (*Dalbergia sissoo*) and Teak (*Tectona grandis*) sourced from government-regulated plantations under FSC guidelines.
- **Dehumidification science** — timber is vacuum-solar seasoned for 75 days to an 8.4% moisture content target for stability across seasons.
- **Generational warranty** — every mortise, tenon, and butterfly key joint is backed by a 10-year atelier structural guarantee.

## License

This project is **proprietary and closed-source** (`UNLICENSED` per `package.json`). See [LICENSE](./LICENSE) for the full terms. All rights reserved by VANA Architectural Woodcraft.

---

<div align="center">

**VANA Atelier** &bull; Basni Industrial Area Phase II, Jodhpur, Rajasthan 342005

*Architectural Hardwood &bull; Precision Joinery &bull; Timeless Living*

</div>
