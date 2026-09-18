<div align="center">

# V A N A
### Architectural Hardwood Atelier & Bespoke CAD Manufacturing Platform

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
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#available-scripts">Available Scripts</a> &bull;
  <a href="#environment-variables">Environment Variables</a> &bull;
  <a href="#folder-structure">Folder Structure</a> &bull;
  <a href="#api-reference">API Reference</a> &bull;
  <a href="#documentation">Documentation</a>
</p>

</div>

---

## Project Overview

VANA is a full-stack architectural furniture platform for an atelier based in the Basni Industrial Area, Jodhpur, Rajasthan. It has three core surfaces:

1. **Public storefront** — editorial storytelling, a cinematic hero carousel, a database-backed catalog with live search, a full-screen lightbox gallery, a Three.js 3D product viewer with exploded view, and direct inquiry management.
2. **CAD & trade manufacturing engine** — a digital pipeline for architects and interior designers to upload technical drawings (`.dwg`, `.dxf`, `.step`, `.stp`, `.obj`, `.pdf`, `.zip`, up to 50MB per file) with automated validation, sanitization, and instant quote generation (`POST /api/quotes`).
3. **Live operations & telemetry hub** — an authenticated single-page management dashboard (`Ctrl+Shift+A`), live WebSocket broadcast of active visitors, real-time quote alerts, dynamic product updates, and audit logging.

## Tech Stack

| Layer | Technology | Notes |
| :--- | :--- | :--- |
| **Frontend UI** | React 18.3, JSX, vanilla CSS | Component system with CSS custom-property design tokens |
| **Tooling & Build** | Vite 5 | Sub-second HMR and optimized production bundling |
| **3D Rendering** | Three.js | Canvas-based timber model rendering & exploded views |
| **Icons** | Lucide React | SVG icon set |
| **Backend API** | Node.js 18+, Express 4.19 | CommonJS modular REST API |
| **Real-Time Layer** | WebSocket (`ws`) | Event pub/sub for quotes, visitor counter, product sync |
| **Persistence** | Atomic JSON storage | Zero-dependency file-based store with seed/backup/restore |
| **File Handling** | Multer | Extension & size-validated multi-part uploads |
| **Security** | Helmet, bcrypt, JWT, express-rate-limit | Strict CSP, hashed passwords, tiered rate limits |

Routing is a lightweight, dependency-free history-API router in `client/src/App.jsx` (no React Router). See [docs/architecture.md](./docs/architecture.md) for the full runtime diagram, route table, and security control list.

## Getting Started

### Prerequisites

- **Node.js** v18.0.0 or newer
- **npm** v9.0.0 or newer

### Installation

```bash
git clone <repo-url>
cd "Furniture Full Stack"

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
| `npm run test:security` | Runs the automated security & integrity test suite |

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
> There is no plaintext admin password fallback. Authentication is bcrypt-hash only and fails closed. Never commit a real `.env` file — it is excluded via `.gitignore`.

## Folder Structure

```text
├── client/            # React + Vite frontend (src/components, pages, context, styles, utils)
├── server/             # Express + WebSocket backend (routes, middleware, db, config)
│   ├── data/           # Runtime JSON store (gitignored)
│   ├── uploads/         # Runtime CAD & product uploads (gitignored)
│   └── .env.example    # Environment variable template
├── scripts/            # dev/backup/restore orchestration scripts
├── backups/             # Generated JSON snapshots (gitignored)
├── docs/                # Architecture, deployment, security, CAD pipeline, TRD docs
├── CHANGELOG.md         # Release history
├── LICENSE              # Proprietary / all-rights-reserved
├── package.json         # Root scripts (source of truth for install/dev/build/start)
├── run.bat / start.bat / start-dev.bat   # Windows launch helpers
```

See [docs/file-structure.md](./docs/file-structure.md) for the fully annotated tree, including every client/server subdirectory and its responsibilities.

## API Reference

### Storefront & catalog

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server status, memory usage, uptime |
| `GET` | `/api/products` | List furniture pieces with category/search filters |
| `GET` | `/api/products/:id` | Single piece specification |
| `POST` | `/api/quotes` | Submit a bespoke inquiry or CAD drawing package |
| `GET` | `/api/orders/:id` | Public sanitized order tracking |
| `GET/POST` | `/api/reviews` | List / submit product reviews (600-char cap) |
| `GET/POST/DELETE` | `/api/wishlist` | Cookie-keyed wishlist |
| `POST/DELETE` | `/api/newsletter/subscribe` | Newsletter signup / unsubscribe |
| `POST` | `/api/payments/intent` | Test payment intent (`vanapay-test`; Razorpay seam ready, unwired) |

### Operations & telemetry (protected)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Admin login, returns a 1-hour JWT | No |
| `GET` | `/api/quotes` | Review pending CAD/trade inquiries | Yes |
| `PATCH` | `/api/quotes/:id/status` | Update quote status + engineering notes | Yes |
| `GET` | `/api/orders` | View confirmed production orders | Yes |
| `GET` | `/api/analytics` | Atelier metrics (revenue, pageviews, active jobs) | Yes |

Full route table (all 10 route modules, including CAD file download and audit logs) is in [docs/architecture.md](./docs/architecture.md#api-routes-mounted-under-api-behind-the-global-rate-limiter).

## Security

The backend runs a defense-in-depth control set verified by an automated suite:

```bash
npm run test:security
```

Covers CSP (Helmet), CORS whitelisting, tiered rate limiting, fail-closed bcrypt/JWT auth, CAD upload validation, path traversal guards, and atomic JSON persistence. Full spec: [docs/security.md](./docs/security.md).

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
