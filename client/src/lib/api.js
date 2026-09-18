// VANA storefront data layer — single fetch wrapper for all JSON + multipart calls.
// Base URL comes from Vite env so preview/prod can point at the deployed API;
// same-origin '/api' is used when the variable is unset (dev proxy / static serve).

export const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/+$/, '');

export const TOKEN_KEY = 'vana_admin_token';
export const LEGACY_TOKEN_KEY = 'jodhpur_admin_token';

export class ApiError extends Error {
  constructor(message, code, details, status) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function readStoredToken() {
  try {
    return (
      sessionStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(LEGACY_TOKEN_KEY) ||
      ''
    );
  } catch (e) {
    return '';
  }
}

export function authHeader() {
  const token = readStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function joinUrl(base, path) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function request(path, opts = {}) {
  const { method = 'GET', body, headers = {}, auth = false, ...rest } = opts;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders = { ...headers };
  // JSON content-type only for non-FormData bodies (browser sets multipart boundary).
  if (body !== undefined && !isFormData && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (auth) {
    Object.assign(finalHeaders, authHeader());
  }

  let payload = body;
  if (body !== undefined && !isFormData && typeof body !== 'string') {
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(joinUrl(API_BASE, path), {
      method,
      headers: finalHeaders,
      body: payload,
      ...rest,
    });
  } catch (networkErr) {
    throw new ApiError('Network error. Check your connection and retry.', 'NETWORK_ERROR', null, 0);
  }

  let json = null;
  try {
    const text = await res.text();
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    if (!res.ok) {
      throw new ApiError(`Request failed (${res.status})`, 'BAD_RESPONSE', null, res.status);
    }
    return null;
  }

  if (!res.ok) {
    const message =
      (json && (json.error || json.message)) || `Request failed (${res.status})`;
    const code = (json && (json.code || json.error)) || `HTTP_${res.status}`;
    const details = (json && (json.details || json.errors)) ?? null;
    throw new ApiError(message, code, details, res.status);
  }

  // Envelope check: explicit failure flags always throw, even on 2xx.
  if (json && json.success === false) {
    const message = json.error || json.message || 'Request failed';
    throw new ApiError(message, json.code || json.error || 'API_ERROR', json.details ?? json.errors ?? null, res.status);
  }

  return json;
}

export function apiGet(path, opts = {}) {
  return request(path, { ...opts, method: 'GET' });
}

export function apiPost(path, body, opts = {}) {
  return request(path, { ...opts, method: 'POST', body });
}

export function apiPatch(path, body, opts = {}) {
  return request(path, { ...opts, method: 'PATCH', body });
}

export function apiPut(path, body, opts = {}) {
  return request(path, { ...opts, method: 'PUT', body });
}

export function apiDel(path, opts = {}) {
  return request(path, { ...opts, method: 'DELETE' });
}

// Alias for callers that prefer `del` naming.
export const apiDelete = apiDel;

export default { API_BASE, request, apiGet, apiPost, apiPatch, apiPut, apiDel, authHeader, ApiError };
