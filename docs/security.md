# Security Audit Specification

This document describes the controls currently present in the repository and the limits that must be considered before production deployment.

## Protected assets

- Architectural CAD uploads and bespoke project details.
- Administrator credentials, JWT signing material, and audit records.
- Product, quote, order, visitor, and telemetry data in the JSON store.

## Implemented controls

### HTTP and input handling

- Helmet middleware supplies baseline security headers.
- CORS is configured centrally in `server/config.js` / `server/server.js`.
- JSON and URL-encoded request bodies are capped at 10 MB.
- API requests use a global rate limiter configured for 120 requests per 15 minutes.
- Input sanitisation and a PII-scrubbing request logger run before API routes.

### Authentication and authorization

- Admin authentication issues JWTs.
- Protected route modules use the auth middleware and role checks where required.
- Configure `JWT_SECRET` and `ADMIN_PASSWORD_HASH` through deployment secrets. Do not use the development fallback values in production.

### CAD uploads

- Accepted extensions are `.dwg`, `.dxf`, `.step`, `.stp`, `.pdf`, `.obj`, and `.zip`.
- Multer enforces the configured 50 MB file-size limit.
- Stored names are generated from a timestamp and sanitised basename.
- Uploads are written to `server/uploads/cad`, outside the static `server/public` directory.

The upload path currently validates extensions and size. It does not perform true magic-byte inspection, antivirus scanning, archive extraction, or CAD parsing. Add those controls before accepting untrusted production files at scale.

## Persistence and privacy

The JSON database is local filesystem state. Restrict filesystem permissions for `server/data` and `server/uploads`, use persistent private storage in production, and protect backups. Audit log IPs are partially masked, but application data still contains personal contact fields and must be handled as sensitive data.

## Verification

Run:

```bash
npm run test:security
```

Review dependency advisories, secret configuration, CORS policy, upload scanning, and backup access as part of every deployment review.
