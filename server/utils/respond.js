'use strict';

// Standard API response envelopes.
function ok(res, data, code, extra) {
  if (code === undefined) code = 200;
  if (extra === undefined) extra = {};
  return res.status(code).json(Object.assign({ success: true, data: data }, extra));
}

function fail(res, status, error, code, details) {
  if (code === undefined) code = error;
  const body = { success: false, error: error, code: code };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

module.exports = { ok: ok, fail: fail };
