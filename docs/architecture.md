# System Architecture

## Overview

VANA is a React/Vite single-page application backed by an Express HTTP server and a WebSocket hub. The production server can serve the built client and the API from a single port.

```text
Browser
  React 18 + Vite + Three.js
  Theme, inquiry, and WebSocket context providers
        | HTTP REST (/api/*) and WebSocket (ws://)
        v
Express server (port 5000)
  Helmet, CORS, rate limiting, sanitisation, audit logging
  /api/auth /products /quotes /orders /reviews /wishlist
  /api/newsletter /payments /analytics /telemetry
        |
        +--> WebSocket hub (server/wsHub.js) on the same port
        |
        +--> JSON persistence: server/data/furniture_store.json
        +--> Private CAD uploads: server/uploads/cad
        +--> Public sample CAD downloads: server/public/cad -> /cad
```

## Frontend (`client/src`)

`client/src/App.jsx` provides a lightweight, dependency-free client router built on `window.history.pushState` / `popstate` (no React Router). Pages are code-split with `React.lazy`.

| Path | Component | Purpose |
| :--- | :--- | :--- |
| `/` | `Home` | Editorial landing, cinematic hero carousel, delivery standards, quote teaser |
| `/about` | `About` | Heritage story, timber science (8.4% MC), kiln chambers, craft manifesto |
| `/catalog` | `Catalog` | Searchable catalogue with live search, collection & wood species filters |
| `/gallery` | `GalleryPage` | Architectural spaces gallery, category pills, full-screen lightbox modal |
| `/contact` | `ContactPage` | Factory visit booking, direct messaging, live quotes API, FAQ accordion |
| `/factory` | `Factory` | Workshop tour, 5-axis CNC routers, finishing booths, material lab |
| `/custom-trade` | `CustomTrade` | Commercial commission form, 50MB CAD upload pipeline |
| `/product/:id` | `ProductDetail` | Three.js viewer, finish selector, EMI, reviews, wishlist, test checkout |
| `/track`, `/track/:order_number` | `TrackOrder` | Public order tracking with GST invoice + EMI calculator |
| `/care-warranty` | `CareWarranty` | Seasonal humidity care, oil-wax instructions, 10-year structural warranty |
| `/privacy`, `/terms` | `Privacy`, `Terms` | Standard legal pages |
| `/admin` | `AdminDashboard` | Authenticated single-admin JWT operations console (`Ctrl+Shift+A`) |

**Shared components**: `Navbar`, `Footer`, `ThreeViewer` (Three.js model viewer with finish switching and exploded view), `InquiryDrawer`, `Toast`, `BackToTop`, `SEO` (OpenGraph + JSON-LD), `ErrorBoundary`, `Reviews`, `EmiCalculator`, `GstInvoice`.

**Context providers**: `ThemeContext` (light/dark, persisted), `InquiryContext` (inquiry drawer state, persisted to `localStorage` under `jodhpur_inquiry_list`), `SocketContext` (WebSocket lifecycle, active visitor count, auto-reconnect).

## Backend (`server`)

- `server/server.js` — Express app, HTTP server, middleware stack, route mounts, static serving, health endpoint, graceful shutdown.
- `server/config.js` — central runtime configuration and filesystem paths.
- `server/wsHub.js` — WebSocket connection tracking, broadcasts, active visitor counter.
- `server/db/database.js` — JSON database engine: atomic CRUD, analytics, audit logging.
- `server/db/seed.js` — seed data (12 architectural pieces, sample orders/quotes).

### API routes (mounted under `/api`, behind the global rate limiter)

| Route file | Base path | Key methods | Notes |
| :--- | :--- | :--- | :--- |
| `auth.js` | `/api/auth` | `POST /login`, `GET /me` | bcrypt + JWT, IP-bound session, brute-force lockout |
| `products.js` | `/api/products` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` | Public reads; mutations require JWT |
| `quotes.js` | `/api/quotes` | `POST /`, `GET /`, `GET /:id`, `PATCH /:id/status`, `GET /file/:filename` | Public multipart CAD submission; admin review queue |
| `orders.js` | `/api/orders` | `POST /`, `GET /`, `GET /:id`, `PATCH /:id/stage` | GST + shipping calc; sanitized public tracking |
| `reviews.js` | `/api/reviews` | `GET /`, `POST /`, `DELETE /:id` | Public, instant-live, 600-char cap |
| `wishlist.js` | `/api/wishlist` | `GET /`, `POST /toggle`, `DELETE /` | Cookie-keyed |
| `newsletter.js` | `/api/newsletter` | `POST /subscribe`, `POST /unsubscribe` | — |
| `payments.js` | `/api/payments` | `POST /intent` | Test-mode `vanapay-test`; Razorpay seam unwired |
| `analytics.js` | `/api/analytics` | `GET /`, `GET /audit-logs`, `GET /factory-status` | Authenticated except `factory-status` |
| `telemetry.js` | `/api/telemetry` | `POST /log` | Client error ingestion |

Full endpoint examples live in the [README API reference](../README.md#api-reference).

## Security architecture

Defense-in-depth, validated by `npm run test:security` (16/16 assertions):

1. **CSP** via `helmet`, scoped for Google Fonts, Three.js canvas, and secure WebSockets.
2. **CORS whitelisting** — strict origin checks for dev/production hostnames, configurable via the `ALLOWED_ORIGINS` env var (comma-separated); falls back to a localhost dev whitelist in `server/config.js` when unset.
3. **Upload security** — CAD uploads restricted to `.dwg`, `.dxf`, `.step`, `.stp`, `.obj`, `.pdf`, `.zip`; checked for executable headers; stored under UUID/timestamp filenames.
4. **Rate limiting** — tiered limiters for login (5-attempt lockout), quote uploads, reviews/newsletter/wishlist/payments, and global API traffic.
5. **Path traversal protection** — file download routes enforce `path.basename` sanitization.
6. **Atomic persistence** — JSON writes go to a temp file, then rename, to avoid corruption on crash/power loss.
7. **Fail-closed auth** — no plaintext admin password fallback; production refuses to boot silently on shipped default secrets (prints a warning banner if `JWT_SECRET`/`ADMIN_PASSWORD_HASH` are unset).

See [docs/security.md](./security.md) for the full audit specification and current limits.

## Runtime boundaries

- Client dev server: port `5173`.
- API + WebSocket server: port `5000` by default, configurable via `PORT`.
- Frontend production output: `client/dist`.
- Private CAD uploads: `server/uploads/cad` (excluded from static routes).
- Public product photos: `server/uploads/products` (served at `/uploads`).
- Bundled sample CAD files: `server/public/cad` (served at `/cad`).
