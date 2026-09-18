const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const events = require('../utils/events');
const { quoteUploadLimiter, fileDownloadLimiter } = require('../middleware/security');
const { requireAuth } = require('../middleware/auth');
const { uploadCad, validateMagicBytes } = require('../middleware/upload');
const config = require('../config');
const { validateQuoteBody } = require('../utils/validate');
const dbQueue = require('../utils/dbQueue');
const { fail } = require('../utils/respond');

// Submit Bespoke CAD Quote Inquiry (Public with upload rate-limiter)
router.post('/', quoteUploadLimiter, (req, res) => {
  uploadCad.single('cad_file')(req, res, async (err) => {
    if (err) {
      db.logAudit('SECURITY_UPLOAD_REJECTED', `CAD upload rejected: ${err.message}`, 'WARNING', req.ip);
      try { db.save(); } catch (e) {}
      return res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
    }

    // Magic-byte content check: extension whitelisting (fileFilter above)
    // only validates the claimed filename; verify the actual bytes on disk
    // match that extension before the upload is accepted (e.g. reject a
    // renamed .exe uploaded as "drawing.pdf").
    if (req.file) {
      const check = validateMagicBytes(req.file.path, path.extname(req.file.filename));
      if (!check.valid) {
        db.logAudit('SECURITY_UPLOAD_REJECTED', `CAD upload rejected (content mismatch): ${check.reason} (${req.file.originalname})`, 'WARNING', req.ip);
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        try { db.save(); } catch (e) {}
        return res.status(400).json({ error: check.reason, code: 'UPLOAD_CONTENT_MISMATCH' });
      }
    }

    try {
      // Honeypot spam trap: a hidden form field ("website") that real users
      // never see or fill. Bots that blindly fill every field trip it. We
      // respond as if the submission succeeded (no error, no clue it was
      // dropped) so scripted spam doesn't learn to adapt.
      if (req.body && typeof req.body.website === 'string' && req.body.website.trim() !== '') {
        db.logAudit('SECURITY_HONEYPOT_TRIPPED', `Quote submission dropped: honeypot field populated (ip=${req.ip})`, 'WARNING', req.ip);
        if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
        return res.status(201).json({
          success: true,
          message: 'Your CAD architectural commission inquiry has been securely submitted to our Basni atelier engineering queue.',
          quote_number: 'CAD-JOD-PENDING'
        });
      }

      const {
        client_name,
        client_email,
        client_phone,
        organization,
        project_type,
        wood_preference,
        target_dimensions,
        estimated_budget_inr,
        project_notes
      } = req.body;

      if (!client_name || !client_email || !client_phone) {
        return fail(res, 400, 'Client name, email, and phone number are required.');
      }

      const vq = validateQuoteBody({ client_name, client_email, client_phone });
      if (!vq.valid) {
        const first = vq.errors.email || vq.errors.phone || vq.errors.client_name;
        return res.status(400).json({ error: first, code: 'INVALID_CONTACT', errors: vq.errors });
      }

      let budget = 150000;
      if (estimated_budget_inr !== undefined && estimated_budget_inr !== null && String(estimated_budget_inr).trim() !== '') {
        budget = Number(estimated_budget_inr);
        if (!Number.isFinite(budget)) {
          return res.status(400).json({ error: 'estimated_budget_inr must be a number.', code: 'INVALID_BUDGET' });
        }
      }

      const quoteData = {
        client_name: client_name.trim(),
        client_email: client_email.trim(),
        client_phone: client_phone.trim(),
        organization: organization ? organization.trim() : 'Private Commission',
        project_type: project_type || 'Residential Penthouse',
        wood_preference: wood_preference || 'Seasoned Sheesham',
        target_dimensions: target_dimensions || 'Custom Architectural Dimensions',
        estimated_budget_inr: budget,
        internal_engineering_notes: project_notes ? `Client specifications: ${project_notes}` : 'Awaiting initial CAD engineer review'
      };

      if (req.file) {
        quoteData.cad_file_name = req.file.originalname;
        quoteData.cad_file_stored = req.file.filename;
        quoteData.cad_file_size_bytes = req.file.size;
        quoteData.cad_file_path = `/api/quotes/file/${req.file.filename}`;
      }

      const quote = await dbQueue.run(() => db.createQuote(quoteData));

      // Real-time broadcast to Admin Dashboard
      events.emit('NEW_QUOTE_SUBMITTED', {
        quote: {
          id: quote.id,
          quote_number: quote.quote_number,
          client_name: quote.client_name,
          project_type: quote.project_type,
          estimated_budget_inr: quote.estimated_budget_inr,
          created_at: quote.created_at
        },
        message: `New bespoke commission inquiry ${quote.quote_number} received from ${quote.client_name}`
      });

      res.status(201).json({
        success: true,
        message: 'Your CAD architectural commission inquiry has been securely submitted to our Basni atelier engineering queue.',
        quote_number: quote.quote_number,
        data: quote
      });
    } catch (createErr) {
      console.error('Quote submission error:', createErr);
      return fail(res, 500, 'Failed to record quote submission');
    }
  });
});

// Admin: Get all quotes
router.get('/', requireAuth, (req, res) => {
  try {
    const quotes = db.getQuotes();
    res.json({ success: true, count: quotes.length, data: quotes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve quotes' });
  }
});

// Admin: Get single quote
router.get('/:id', requireAuth, (req, res) => {
  try {
    const quote = db.getQuoteById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve quote' });
  }
});

// Admin: Update quote status & manufacturing notes
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const updated = db.updateQuoteStatus(req.params.id, status, notes);
    if (!updated) return res.status(404).json({ error: 'Quote not found' });

    events.emit('QUOTE_STATUS_UPDATED', {
      quote_id: updated.id,
      quote_number: updated.quote_number,
      status: updated.status,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quote status' });
  }
});

// Secure CAD file download endpoint with path traversal defense.
// Auth-gated: these are customer-uploaded CAD files, not public marketing
// assets, so only an authenticated admin/staff token (same requireAuth used
// by the other admin quote routes above) may fetch them by filename.
router.get('/file/:filename', requireAuth, fileDownloadLimiter, (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(config.CAD_UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Requested CAD asset not found on storage disk' });
    }

    db.logAudit('FILE_DOWNLOAD', `CAD asset downloaded: ${safeFilename}`, 'INFO', req.ip);
    try { db.save(); } catch (e) {}

    res.download(filePath, safeFilename);
  } catch (err) {
    res.status(500).json({ error: 'Error serving CAD asset' });
  }
});

module.exports = router;
