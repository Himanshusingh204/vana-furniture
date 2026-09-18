import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'vana_theme';
const LEGACY_THEME_KEY = 'jodhpur_theme';

function readInitialTheme() {
  try {
    const current = localStorage.getItem(THEME_KEY);
    if (current) return current;
    // One-time migration from the legacy key.
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy) {
      localStorage.setItem(THEME_KEY, legacy);
      localStorage.removeItem(LEGACY_THEME_KEY);
      return legacy;
    }
    return 'dark';
  } catch (e) {
    return 'dark';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      // non-DOM environment — ignore
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      // storage unavailable (private mode) — theme still applies in memory
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
