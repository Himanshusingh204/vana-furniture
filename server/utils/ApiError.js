'use strict';

// Operational error with HTTP status, machine code, and optional details.
class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status || 500;
    this.code = code || message;
    if (details !== undefined) this.details = details;
  }
}

module.exports = ApiError;
