'use strict';

const wsHub = require('../wsHub');

// Baseline allowlist: every realtime event type emitted across the atelier
// backend (routes) and gateway (wsHub). Flat shape: { type, at, ...payload }.
const ALLOWED_EVENT_TYPES = [
  'CONNECTED',
  'LIVE_STATS',
  'PING',
  'PONG',
  'PRODUCT_CREATED',
  'PRODUCT_UPDATED',
  'PRODUCT_DELETED',
  'NEW_QUOTE_SUBMITTED',
  'QUOTE_STATUS_UPDATED',
  'ORDER_PLACED',
  'ORDER_STAGE_UPDATED',
  'REVIEW_SUBMITTED',
  'REVIEW_MODERATED',
  'PAYMENT_CONFIRMED',
  'SYSTEM_ALERT'
];

function emit(type, payload) {
  if (ALLOWED_EVENT_TYPES.indexOf(type) === -1) {
    console.warn('[events] Unknown realtime event type dropped: ' + type);
    return;
  }
  const p = payload || {};
  wsHub.broadcast(Object.assign({ type: type, at: new Date().toISOString() }, p));
}

module.exports = { emit: emit, ALLOWED_EVENT_TYPES: ALLOWED_EVENT_TYPES };
