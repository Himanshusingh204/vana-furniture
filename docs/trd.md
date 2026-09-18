# Technical Requirements

## Product scope

The current product is a furniture catalogue and bespoke CAD inquiry platform. It provides product discovery, 3D presentation, trade inquiries, factory information, customer care content, and an authenticated operational dashboard.

## Functional requirements

### Storefront

- Render the home, catalogue, product detail, order tracking, gallery, contact, factory, about, care and warranty, privacy, terms, and admin pages.
- Support product search, collection and wood filters, CAD-only filtering, sorting, and product detail navigation.
- Provide a Three.js viewer for supported product configurations and exploded presentation.
- Maintain inquiry state in the inquiry drawer.

### Trade inquiries

- Accept client details, project information, dimensions, and an optional CAD file.
- Validate upload extensions and enforce a 50 MB per-file limit.
- Store submitted quotes and expose them to authenticated administrative routes.

### Operations

- Authenticate administrators with JWT tokens.
- Provide product, quote, order, analytics, and telemetry API routes.
- Broadcast live visitor and operational events through the WebSocket hub.
- Keep an audit trail for significant quote, order, status, and server-error events.

## Data and API requirements

- Persist data in `server/data/furniture_store.json` with atomic replacement writes.
- Keep CAD uploads private (`server/uploads/cad`); product photos under `server/uploads/products` are intentionally public at `/uploads`.
- Compute analytics from persisted products, quotes, and orders rather than hard-coded dashboard values.
- Use ISO timestamps for persisted records.

## Non-functional requirements

- Development must run with `npm run dev` from the repository root.
- The client must build with `npm run build`.
- The production server must honor `PORT` and serve `client/dist` when present.
- API responses must use JSON and return useful HTTP status codes for validation, authentication, and missing resources.
- Security controls must be verified by `npm run test:security`.

## Explicit non-goals in the current implementation

- There is no live payment gateway: checkout creates a `vanapay-test` payment intent only. The Razorpay seam is ready but unwired.
- There is no client account system. A public order tracking portal (`/track`) exists; it exposes sanitized order data only.
- The JSON store is not suitable for concurrent multi-instance writes.
- CAD files are extension-filtered uploads; the server does not parse or convert CAD geometry.
- Performance targets such as FCP, TTI, and 60 fps require measurement before they can be treated as acceptance criteria.
