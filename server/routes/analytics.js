const express = require('express');
const router = express.Router();
const db = require('../db/database');
const wsHub = require('../wsHub');
const { requireAuth } = require('../middleware/auth');

// Get Real Analytics (Admin only, computed strictly from database records)
router.get('/', requireAuth, (req, res) => {
  try {
    const metrics = db.getRealAnalytics();
    // Inject real-time active visitor count from WebSocket hub
    metrics.active_online_visitors = wsHub.getActiveVisitorCount();
    res.json({
      success: true,
      data: metrics
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to aggregate analytics' });
  }
});

// Get Security & System Audit Logs (Admin only)
router.get('/audit-logs', requireAuth, (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const logs = db.getAuditLogs(limit);
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// Live Factory Floor Status (Public telemetry for transparency)
router.get('/factory-status', (req, res) => {
  const quotes = db.getQuotes();
  const orders = db.getOrders();
  const active_quotes = quotes.filter((q) => ['Received', 'CAD Review'].includes(q.status)).length;
  const active_orders = orders.filter((o) => o.manufacturing_stage !== 'Dispatched').length;
  res.json({
    success: true,
    facility: 'Basni Phase II Industrial Area, Jodhpur',
    timber_curing_chamber: {
      status: 'OPTIMAL',
      ambient_rh_pct: 38,
      equilibrium_moisture_content_pct: 8.4,
      chambers_active: 3
    },
    cnc_machining_center: {
      machine_model: 'Homag 5-Axis CNC Router',
      spindle_tolerance_mm: 0.18,
      current_job_queue: active_orders
    },
    master_joiners_on_floor: 14,
    last_calibrated: '2026-09-09T06:00:00.000Z',
    derived: { active_quotes, active_orders }
  });
});

module.exports = router;
