import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiPost, apiGet, TOKEN_KEY, LEGACY_TOKEN_KEY } from '../lib/api';

const AuthContext = createContext(null);

function readInitialToken() {
  try {
    const current = sessionStorage.getItem(TOKEN_KEY);
    if (current) return current;
    // One-time migration from the legacy Jodhpur key.
    const legacy = sessionStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      sessionStorage.setItem(TOKEN_KEY, legacy);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacy;
    }
    return '';
  } catch (e) {
    return '';
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readInitialToken);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const expireSession = useCallback(() => {
    setToken('');
    setUser(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch (e) {
      // storage unavailable (private mode) — in-memory state already cleared
    }
  }, []);

  const fetchMe = useCallback(async () => {
    const stored = readInitialToken();
    if (!stored) {
      setUser(null);
      return null;
    }
    try {
      const json = await apiGet('/api/auth/me', { auth: true });
      const me = (json && (json.user || json.data)) || null;
      setUser(me);
      return me;
    } catch (err) {
      if (err && (err.status === 401 || err.status === 403)) {
        expireSession();
      }
      setUser(null);
      return null;
    }
  }, [expireSession]);

  // Rehydrate user on mount when a token survived a reload.
  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  const login = useCallback(
    async (email, password) => {
      setAuthLoading(true);
      setAuthError('');
      try {
        // Server returns { token, role, email } (no success envelope).
        const json = await apiPost('/api/auth/login', { email, password });
        const nextToken = (json && (json.token || json?.data?.token)) || '';
        if (!nextToken) {
          throw new Error((json && json.error) || 'Login failed: no token returned.');
        }
        try {
          sessionStorage.setItem(TOKEN_KEY, nextToken);
          sessionStorage.removeItem(LEGACY_TOKEN_KEY);
        } catch (e) {
          // ignore persistence failure; session continues in memory
        }
        setToken(nextToken);
        const meUser =
          (json && (json.user || json?.data?.user)) ||
          { email: (json && (json.email || json?.data?.email)) || email, role: (json && (json.role || json?.data?.role)) || 'admin' };
        setUser(meUser);
        // Best-effort refresh against /api/auth/me (validates IP binding).
        fetchMe();
        return { token: nextToken, user: meUser };
      } catch (err) {
        const message = (err && err.message) || 'Login failed.';
        setAuthError(message);
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [fetchMe]
  );

  const logout = useCallback(() => {
    expireSession();
    setAuthError('');
  }, [expireSession]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    authLoading,
    authError,
    login,
    logout,
    fetchMe,
    expireSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
