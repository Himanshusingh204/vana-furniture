# CAD-to-Craft Manufacturing Pipeline

The platform supports the digital handoff from architectural inquiry to factory review. The website stores inquiry metadata and files; engineering interpretation and physical manufacturing remain atelier workflows.

## Digital workflow

1. **Brief and drawings**: The client submits project details, dimensions, material preferences, and supporting files through the custom trade page.
2. **File validation**: The API checks the file extension and 50 MB size limit, then stores the upload privately.
3. **Quote review**: The server creates a quote record with a generated quote number and `Received` status.
4. **Engineering review**: The factory team can review quotes and update manufacturing status through authenticated operations routes.
5. **Production handoff**: Approved work proceeds through the atelier's CAD, timber, CNC, joinery, finishing, and dispatch processes.

## Supported upload types

| Extension | Typical use | Server limit |
| --- | --- | ---: |
| `.dwg` | AutoCAD drawing | 50 MB |
| `.dxf` | 2D exchange drawing | 50 MB |
| `.step`, `.stp` | 3D solid model | 50 MB |
| `.obj` | 3D mesh reference | 50 MB |
| `.pdf` | Drawing or finish packet | 50 MB |
| `.zip` | Packaged project reference | 50 MB |

The limit is applied per uploaded file. The server does not currently parse geometry, validate CAD semantics, inspect magic bytes, extract archives, or generate CNC toolpaths.

## Suggested engineering review stages

- Quote received
- CAD engineering review
- Timber and finish selection
- CNC preparation
- Joinery and assembly
- Hand finishing
- Quality inspection
- Dispatch

Only statuses implemented by the route and database layer should be exposed as selectable values in operational UI. Manufacturing tolerances, moisture targets, materials, and warranty terms must be confirmed by the factory before being treated as contractual specifications.

## Traceability requirements

For production use, retain the quote number, source file name, upload timestamp, revision notes, approval status, and responsible reviewer. Keep the original upload in private storage and include it in the backup policy.
