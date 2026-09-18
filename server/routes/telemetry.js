const express = require('express');
const router = express.Router();
const db = require('../db/database');
const events = require('../utils/events');
const { telemetryLimiter } = require('../middleware/security');

router.post('/log', telemetryLimiter, (req, res) => {
  try {
    const { error_message, component_stack, page_url, user_agent } = req.body;
    const clientIp = req.ip || '127.0.0.1';

    const safeMessage = (error_message || 'Unknown runtime error').substring(0, 300);
    const safeStack = (component_stack || '').substring(0, 500);

    const log = db.logAudit(
      'CLIENT_TELEMETRY_EXCEPTION',
      `UI exception on ${page_url || 'unknown route'}: ${safeMessage}`,
      'WARNING',
      clientIp
    );
    try { db.save(); } catch (e) {}

    // Broadcast warning to Admin if open
    events.emit('SYSTEM_ALERT', {
      severity: 'WARNING',
      message: `Client error caught on ${page_url}: ${safeMessage}`
    });

    res.status(200).json({ success: true, log_id: log.id });
  } catch (err) {
    res.status(500).json({ error: 'Telemetry logging failed' });
  }
});

module.exports = router;
