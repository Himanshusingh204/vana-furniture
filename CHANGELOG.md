# Changelog
All notable changes to the **Jodhpur Artisan & CAD Works** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
### Layout dedup + startup race fix — 2026-09-15
- Navbar: removed `Track Order` and `Gallery` links; footer gallery link removed (`/track` stays in footer + direct URL, `/gallery` route stays live for direct/sitemap traffic).
- Home: deleted the in-home gallery grid (3rd product grid duplicating Bestsellers + Gallery page); FAQ + newsletter moved to the end (sections 11–12, after delivery standards).
- Startup race fixed: `start-dev.bat`/`start.bat` waited 0s before opening the browser (dead port → 2–3 reloads). Both now wait for the port (90s cap) before launching; `scripts/dev.js` also frees a stale 5173.
- Removed plaintext admin password printed by `start.bat`.

### Docs audit — 2026-09-15
- Fixed stale references across all root docs: suite count 13/13 → 16/16, added `/track`, `/privacy`, `/terms` routes, new APIs (reviews/wishlist/newsletter/payments), `backup`/`restore` scripts, corrected `.env` example (no `CORS_ORIGIN` var; correct admin email), removed dead LICENSE badge link and placeholder clone URL.
- Corrected non-goals (test-mode payments + tracking portal now exist), upload publicity rules (CAD private, product photos public), and CSS token names/paths (`tokens.css` never existed).
- Verified run path live: production boot serves API + SPA from one port (`health=healthy`, SPA 200).

## [2.0.0] - 2026-09-15
### Release notes
- Storefront: trust-commerce home, faceted catalog, PDP with 3D/EMI/wishlist/test-checkout/reviews, public order tracking with GST invoice, CAD trade pipeline, Privacy/Terms, branded 404.
- Backend: reviews/wishlist/newsletter/test-payments APIs, extended analytics, stage enum, strict rate limiters, fail-closed bcrypt auth, backup + restore with rotation, production CORS + secrets guard.
- No live payments yet (`vanapay-test` seam ready for Razorpay). Single-instance JSON store (see deployment guide).
- Verified: client build exit 0, `test:security` 16/16, backup/restore round-trip identical, live HTTP smoke with zero store mutations.

### Release drill (2.0.0 close-out) — 2026-09-15
#### Added
- `npm run restore` with dry-run, named-file restore, pre-restore safety copy, and snapshot validation; rotation keeps 10.
- Drill doc in `DEPLOYMENT_OPS_GUIDE.md` (backup/restore commands + proven round-trip counts).
#### Verification
- Restore round-trip identical (12/2/5/3/0/0 + safety copy written).
- Release smoke: health `healthy`, track demo order found, review/newsletter/payment probes posted then reverted (3 mutations removed, store back to baseline).
- Build exit 0 (1607 modules) · `test:security` 16/16 · versions stamped 2.0.0 (root/client/server).

### Completion Pass (Master Plan Phases A–D) — 2026-09-15
#### Fixed (correctness)
- WebSocket event contract repaired: `REVIEW_SUBMITTED` and `PAYMENT_CONFIRMED` now surface as admin toasts + live refresh (`SocketContext.jsx`).
- New branded 404 page (`NotFound.jsx`); unknown routes no longer render Home (`App.jsx`).
- Order manufacturing stage is now enum-validated server-side (7 canonical stages, `INVALID_STAGE` 400); protects the `/track` timeline.
- New SVG favicon (`favicon.svg`, VANA timber monogram) wired in `index.html`.
- Skip-to-content link (`#main-content`) and keyboard activation for gallery lightbox cards.
#### Added (trust, legal, safety)
- Privacy (`/privacy`) and Terms (`/terms`) pages + footer legal row.
- Strict rate limiters: reviews 10, newsletter 10, wishlist 60, payments 30 per 15 min.
- Store backup script: `npm run backup` snapshots JSON store + collection inventory to `backups/`.
- Production guards: secrets warning (`JWT_SECRET`, `ADMIN_PASSWORD_HASH`), strict CORS in production.
#### Changed (canonical + copy)
- Canonical domain unified to `https://jodhpur-furniture.com` across SEO tags, all page urls, sitemap, robots; robots also allows `/track`, `/gallery`, `/contact`.
- De-AI polish: eyebrow cap (About + Contact only on Home), headlines rewritten ("Four generations at one workbench", "Tell us about your room", "Pieces in the current collection"), featured review tile (2-col), 39 copy strings fixed across About/Factory/Contact/Care pages.
- Funnel-bridging copy: inquiry drawer + PDP checkout now explain quote-vs-order paths.
- Payments stay in `vanapay-test` mode by decision (Razorpay seam documented).
#### Verification
- `npm run build` exit 0 (1607 modules; new NotFound/Privacy/Terms chunks).
- `test:security` 16/16 (13 existing + stage-enum, review-cap, limiters).
- Live smoke: favicon 200, `/privacy` 200, unknown route serves SPA, review POST 201 (probe reverted).

### Follow-up (next slice) — 2026-09-15
#### Fixed
- Contrast audit (computed WCAG ratios, all now pass): dark `--text-muted` 4.12 → 6.21 (`#8f8f98`); light `--success` 1.92 → 5.48, `--danger` 2.77 → 6.47, `--warning` 1.67 → 7.09, `--info` → 6.70. Status text (review confirmations, errors, warnings) is now readable in light mode.
- Admin session expiry: `loadData` treats 401/403 on `/api/analytics` as expired JWT → auto-logout with "Session expired after 1 hour" notice on the login screen (JWT lives 1h; previously actions failed silently).
- Sitemap adds `/privacy` and `/terms`.
#### Verification
- `npm run build` exit 0; `test:security` 16/16 unchanged.

### Hardening + deploy rehearsal — 2026-09-15
#### Fixed
- Auth fail-closed: plaintext `ADMIN_PASSWORD` fallback removed from login and config; corrupted hashes now deny access with a `LOGIN_HASH_FAILURE` audit entry. Live store uses `users.json` bcrypt hash (verified).
- CORS rejection returns 403 `CORS_BLOCKED` instead of 500 in strict production mode.
- Backup rotation: `scripts/backup.js` keeps the 10 newest snapshots (+ inventories), prunes older.
#### Verification
- Production boot rehearsal (`NODE_ENV=production`, port 5001): health `healthy`, evil origin → 403 (was 500), wrong-password login → 401, default-secrets warning banner prints.
- `test:security` 16/16 after auth change.
### Documentation
- Updated all root-level Markdown files to match the current client routes, server routes, JSON persistence, upload behavior, environment variables, and available scripts.
- Removed references to frontend pages and components that are not present in the repository.
- Documented current security and deployment limitations, including the lack of CAD parsing, magic-byte inspection, payment processing, and multi-instance database coordination.

## [1.1.0] - 2026-09-10
### Enhanced
- **Architectural Minimalist Redesign**:
  - Removed all artificial radial gradients, left-side shadow blobs, and AI-template visual clichés.
  - Implemented gallery-grade minimalist design system with precise 1px architectural borders, subtle warm tones, and statuesque editorial typography (`Cormorant Garamond` + `Plus Jakarta Sans`).
  - Redesigned 3D WebGL Configurator viewport to match an architectural museum lighting studio.
- **Product Catalog Expansion**:
  - Expanded collection to 12 handcrafted pieces with authentic, royalty-free architectural photography:
    - The Marwar Monolith Dining Table
    - The Basni Atelier Lounge Chair
    - The Jali Fluted Credenza
    - The Architect's Executive Cantilever Desk
    - The Thar Canopy Platform Bed
    - The Mandore Architectural Bench
    - The Mehrangarh Plinth Coffee Table (Solid Sheesham & Banswara Marble)
    - The Gridwork Architectural Bookcase (Teak with Half-Lap CNC Joinery)
    - The Sculptural Guild Armchair (Sheesham & Bouclé)
    - The Thar Live-Edge Entryway Console (Acacia & Brushed Brass)
    - The Floating Bedside Atelier Nightstand
    - The Usta Architectural Dining Armchair
- **Product Detail Page Enhancement**:
  - Added seamless toggle between interactive 3D WebGL Parametric CAD and high-resolution Craft Photography.

## [1.0.0] - 2026-09-10
### Added
- **Core Architecture**:
  - Full-stack decoupled architecture with Node.js Express server, WebSocket engine, and React 18 / Vite frontend.
  - Zero-cost portable embedded persistence engine with atomic state synchronization and schema validation.
- **3D WebGL Studio & CAD Engineering Visualizer**:
  - Three.js interactive configurator with 360-degree OrbitControls, dynamic lighting, and shadows.
  - Live timber texture swapper (Seasoned Sheesham, Royal Teak, Reclaimed Acacia, Ebonized Ash, Brass Accents).
  - Exploded CAD joinery mode showing mortise-tenon, dowels, and structural steel reinforcement.
  - Metric and Imperial dimension guides.
- **Factory & Engineering Showcase**:
  - The Basni Jodhpur manufacturing facility tour and story.
  - 4-stage interactive CAD-to-Craft workflow (2D DWG $\rightarrow$ 3D Parametric CAD $\rightarrow$ 5-Axis CNC $\rightarrow$ Master Hand Joinery).
- **Custom Trade & Architectural Portal**:
  - Drag-and-drop CAD and blueprint uploader (.dwg, .dxf, .step, .pdf, .obj up to 50MB).
  - Parametric live cost estimator for custom bespoke furniture projects.
- **E-Commerce & Orders**:
  - Filterable catalog with search, timber species, room categories, and price ranges.
  - Shopping bag with 50% factory deposit calculation vs full payment.
  - White-glove shipping and GST invoice generation.
- **Real-Time Admin Operations Suite**:
  - Live WebSocket telemetry and active visitor counter.
  - Real database analytics (no synthetic mocked data): revenue, active quotes, lead times, conversion rates.
  - Factory manufacturing stage manager (Quote $\rightarrow$ CAD Review $\rightarrow$ CNC Milling $\rightarrow$ Joinery $\rightarrow$ Finishing $\rightarrow$ Dispatched).
  - Security and error telemetry audit stream.
- **Security Hardening**:
  - Helmet security headers and strict Content Security Policy (CSP).
  - Anti-brute force and IP-based rate limiting.
  - Strict CAD file validation with MIME inspection, UUID renaming, and traversal protection.
  - Owner PII scrubbing in server logging.
- **Design & SEO**:
  - Luxury theme system with persistent Dark Onyx and Desert Alabaster modes.
  - Google-friendly `robots.txt` and `sitemap.xml`.
  - JSON-LD Schema.org structured data for rich snippets.
