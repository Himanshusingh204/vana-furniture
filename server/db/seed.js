// Phase 8 trim: reduced from 12 products / 3 quotes / 2 orders / 3 reviews
// down to exactly one representative record per collection, per the
// production-readiness plan. The single product record keeps a full set of
// fields (collection, wood_type, cad_files, three_config, multiple images,
// pricing) so the storefront UI (catalog cards, product detail, CAD viewer)
// still renders correctly against a minimal dataset.
// server/db/database.js only seeds from this file when
// server/data/furniture_store.json does not yet exist (idempotent) — this
// trim only affects fresh databases, not the existing seeded data file.
module.exports = {
  products: [
    {
      id: "jod-prod-001",
      sku: "VNA-DS-240",
      name: "The Vana Monolith Dining Table",
      collection: "Dining",
      wood_type: "Seasoned Sheesham",
      finish: "Natural Hand-Rubbed Linseed & Beeswax",
      dimensions_mm: { length: 2400, width: 1000, height: 760 },
      dimensions_display: "2400 × 1000 × 760 mm (94.5″ × 39.4″ × 30.0″)",
      weight_kg: 95,
      price_inr: 185000,
      trade_price_inr: 148000,
      stock_status: "Made-to-Order",
      lead_time_weeks: 4,
      cad_available: true,
      cad_files: {
        dwg_url: "/cad/sample-marwar-monolith.dwg",
        dxf_url: "/cad/sample-marwar-monolith.dxf",
        step_url: "/cad/sample-marwar-monolith.step"
      },
      three_config: {
        model_type: "dining_table",
        default_finish: "sheesham_natural",
        available_finishes: ["sheesham_natural", "smoked_teak", "ebonized_ash", "acacia_warm"]
      },
      description: "A monumental 2.4-meter solid Sheesham dining centerpiece, precision-milled from 65mm kiln-seasoned planks at our Basni workshop. Features butterfly-key stabilizing inlays in virgin brass, through-tenon trestle joinery, and relief kerfs on the underside to accommodate seasonal climate breathing.",
      joinery_details: "Mortise and tenon joinery with 20mm Sheesham drawbores, CNC-profiled trestle stretcher, and submerged structural steel C-channels.",
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80"
      ]
    },
  ],

  quotes: [
    {
      id: "quote-1001",
      quote_number: "CAD-JOD-2026-0001",
      client_name: "Ar. Vikram Singhania",
      client_email: "v.singhania@morpho-designs.in",
      client_phone: "+91 98201 44812",
      organization: "Singhania & Partners Architects, Mumbai",
      project_type: "Residential Penthouse",
      wood_preference: "Seasoned Sheesham (Quarter-Sawn)",
      target_dimensions: "Bespoke 12-Seater Dining 3600 × 1200 × 760 mm with concealed power ports",
      cad_file_name: "penthouse-dining-rev-04.dwg",
      cad_file_path: "/cad/sample-marwar-monolith.dwg",
      cad_file_size_bytes: 14820910,
      estimated_budget_inr: 420000,
      status: "CNC Milling",
      internal_engineering_notes: "Tolerance check approved by CAD engineer. Kiln dried Sheesham batch #B-42 ready. 5-axis CNC job queued for Thursday morning.",
      created_at: "2026-09-02T10:14:00.000Z",
      updated_at: "2026-09-08T14:30:00.000Z"
    }
  ],

  orders: [
    {
      id: "ord-8801",
      order_number: "JOD-ORD-2026-0081",
      customer_name: "Aditya & Tanvi Kothari",
      customer_email: "a.kothari@kothariresidence.in",
      customer_phone: "+91 98210 55421",
      shipping_address: {
        street: "Bungalow 14, Koregaon Park Lane 5",
        city: "Pune",
        state: "Maharashtra",
        postal_code: "411001",
        country: "India"
      },
      items: [
        {
          product_id: "jod-prod-001",
          product_name: "The Vana Monolith Dining Table",
          finish_selected: "Natural Hand-Rubbed Linseed & Beeswax",
          quantity: 1,
          unit_price_inr: 185000
        }
      ],
      subtotal_inr: 185000,
      tax_gst_inr: 33300,
      shipping_inr: 8500,
      total_inr: 226800,
      payment_structure: "50% Production Deposit",
      deposit_paid_inr: 113400,
      balance_due_inr: 113400,
      payment_status: "Deposit Paid",
      manufacturing_stage: "Hand Joinery & Assembly",
      created_at: "2026-08-28T11:20:00.000Z"
    }
  ],

  visitors: [
    { timestamp: "2026-09-09T22:00:00.000Z", ip_hash: "8a1b2c", path: "/" }
  ],

  auditLogs: [
    {
      id: "log-init-01",
      timestamp: "2026-09-09T20:00:00.000Z",
      event_type: "SYSTEM_BOOT",
      details: "VANA Architectural Woodcraft server initialized with hardened security headers",
      severity: "INFO",
      ip: "127.0.0.xxx"
    }
  ],

  reviews: [
    {
      id: "rev-seed-01",
      product_id: "jod-prod-001",
      buyer_name: "Vikram Mehta",
      buyer_city: "Jodhpur",
      rating: 5,
      title: "Anchors the whole pavilion",
      body: "The monolith table arrived crated like museum cargo. One year on, the oil finish has only deepened.",
      status: "approved",
      featured: true,
      created_at: "2026-08-14T10:00:00.000Z"
    }
  ],

  wishlist: [],
  newsletter: [],
  payments: []
};

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const targetPath = path.join(__dirname, '..', 'data', 'furniture_store.json');
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fullData = {
    products: module.exports.products,
    quotes: module.exports.quotes,
    orders: module.exports.orders,
    visitors: module.exports.visitors,
    auditLogs: module.exports.auditLogs,
    reviews: module.exports.reviews,
    wishlist: module.exports.wishlist,
    newsletter: module.exports.newsletter,
    payments: module.exports.payments,
    settings: {
      factory_name: 'VANA Architectural Woodcraft',
      location: 'Basni Industrial Area Phase II, Jodhpur, Rajasthan, India',
      phone: '+91 (0291) 274-8890',
      gstin: '08AAACJ1234F1Z8',
      export_license: 'IEC-JOD-99214'
    }
  };

  fs.writeFileSync(targetPath, JSON.stringify(fullData, null, 2), 'utf8');
  console.log(`Successfully seeded ${fullData.products.length} architectural pieces into ${targetPath}`);
}
