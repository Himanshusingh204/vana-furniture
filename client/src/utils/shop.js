// Phase 2 shop utilities: anonymous identity, recently-viewed, EMI math.
// No deps. Keys are namespaced to avoid collisions with existing inquiry storage.

export function getClientKey() {
  try {
    let key = localStorage.getItem('vana_client_key');
    if (!key) {
      key = `ck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('vana_client_key', key);
    }
    return key;
  } catch (e) {
    return `ck-fallback-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function emiMonthly(priceInr, downPct = 20, months = 12) {
  const principal = Math.max(0, (Number(priceInr) || 0) * (1 - downPct / 100));
  if (!months || months <= 0) return 0;
  return Math.round(principal / months); // no-cost EMI: flat division
}

export function recordRecentlyViewed(product) {
  try {
    if (!product || !product.id) return;
    const raw = localStorage.getItem('vana_recently_viewed');
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter((p) => p.id !== product.id);
    list.unshift({
      id: product.id,
      name: product.name,
      price_inr: product.price_inr,
      wood_type: product.wood_type,
      image: Array.isArray(product.images) ? product.images[0] : product.image
    });
    localStorage.setItem('vana_recently_viewed', JSON.stringify(list.slice(0, 8)));
  } catch (e) {
    // private-mode browsers: silently skip
  }
}

export function getRecentlyViewed(excludeId) {
  try {
    const raw = localStorage.getItem('vana_recently_viewed');
    let list = raw ? JSON.parse(raw) : [];
    if (excludeId) list = list.filter((p) => p.id !== excludeId);
    return list;
  } catch (e) {
    return [];
  }
}

// Single source of truth for manufacturing + quote pipelines.
// ORDER_STAGES mirrors server/routes/orders.js STAGES exactly (7 stages).
// Server labels are canonical — admin panels and tracking must import from here.
export const ORDER_STAGES = [
  'CAD & Timber Verification',
  'Kiln & Cutting',
  'CNC Milling',
  'Hand Joinery & Assembly',
  'Finishing & Oil Rubbing',
  'Ready for Dispatch',
  'Dispatched'
];

// Quote pipeline (7 statuses). No server constant exists; 'Received' is the
// DB default (see server/db/database.js createQuote) and the remaining six
// are the admin triage flow. Keep in sync with QuotesPanel options.
export const QUOTE_STATUSES = [
  'Received',
  'CAD Review',
  'Timber Seasoning',
  'CNC Milling',
  'Joinery',
  'Hand Finishing',
  'Ready for Dispatch'
];

export function stageIndex(stage) {
  const i = ORDER_STAGES.indexOf(stage);
  return i === -1 ? 0 : i;
}
