import React, { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'vana_cookie_consent';

function readStoredConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function storeConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    // private-mode browsers: choice just won't persist across visits
  }
}

// Accessible, dismissible first-visit cookie notice. We run no third-party
// trackers or advertising cookies (see CookiePolicy) — this banner exists to
// disclose the local-storage entries we do use and let the visitor choose,
// without blocking any page content underneath it.
export default function CookieConsentBanner({ setPath }) {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!readStoredConsent()) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (visible && bannerRef.current) {
      // Move focus to the banner so keyboard/screen-reader users notice it
      // without it stealing focus from whatever they were doing on load.
      bannerRef.current.focus();
    }
  }, [visible]);

  const choose = (value) => {
    storeConsent(value);
    setVisible(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Escape counts as "necessary only" — the least-data default.
      choose('necessary-only');
    }
  };

  const openCookiePolicy = (e) => {
    e.preventDefault();
    if (setPath) setPath('/cookie-policy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-heading"
      aria-describedby="cookie-consent-description"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left: '1rem',
        right: '1rem',
        bottom: '1rem',
        zIndex: 2000,
        maxWidth: '640px',
        margin: '0 auto',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        borderRadius: '14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
      }}
    >
      <div>
        <h2 id="cookie-consent-heading" style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
          Your privacy on this site
        </h2>
        <p id="cookie-consent-description" style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
          We use no third-party trackers or advertising cookies. We only keep a few local storage entries on your device
          (device/wishlist linkage, recently viewed pieces, theme preference, and your in-progress inquiry draft). See our{' '}
          <a
            href="/cookie-policy"
            onClick={openCookiePolicy}
            style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}
          >
            cookie policy
          </a>{' '}
          for details.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => choose('necessary-only')}
          className="btn btn-secondary"
          style={{ borderRadius: '9999px', padding: '0.55rem 1.3rem', fontSize: '0.82rem' }}
        >
          Necessary only
        </button>
        <button
          type="button"
          onClick={() => choose('accept')}
          className="btn btn-primary"
          style={{ borderRadius: '9999px', padding: '0.55rem 1.3rem', fontSize: '0.82rem' }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
