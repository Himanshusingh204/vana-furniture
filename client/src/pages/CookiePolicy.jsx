import React from 'react';
import SEO from '../components/SEO';

const STORAGE_KEY = 'vana_cookie_consent';

export default function CookiePolicy({ setPath }) {
  const goHome = () => {
    if (setPath) setPath('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetConsent = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch (e) {
      // private-mode browsers: nothing to clear
    }
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <SEO
        title="Cookie Policy | VANA"
        description="What VANA actually stores in your browser: no third-party trackers or advertising cookies, only local storage for device linkage, recently viewed pieces, theme and drafts."
        keywords="VANA cookie policy, furniture site local storage, no tracking cookies"
        url="https://jodhpur-furniture.com/cookie-policy"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Cookie Policy',
          description: 'VANA cookie policy covering the local storage entries used on the site and how to clear them.'
        }}
      />
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="eyebrow">Trust and cookies</span>
          <h1>Cookie policy</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
            What we actually store in your browser, and how to clear it.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>No trackers, no advertising cookies</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            We do not run third-party trackers or advertising cookies of any kind on this site. There is no ad network, no
            cross-site tracking pixel, and no analytics cookie shared with outside companies. Everything below lives only in
            your browser's local storage, on your device, and is never transmitted anywhere unless it is part of a form you
            actively submit (such as a quote or order).
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>What we store, and why</h2>
          <div style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '0.9rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>vana_client_key</strong> — a random device identifier generated
              on your first visit, used only to link your wishlist to this browser. It contains no personal information and
              is not a tracking cookie; it never leaves your device except when the wishlist feature itself needs it.
            </p>
            <p style={{ marginBottom: '0.9rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>vana_recently_viewed</strong> — a short list of the last few
              pieces you looked at, so we can show a "recently viewed" strip on the site. Purely a browser convenience.
            </p>
            <p style={{ marginBottom: '0.9rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>vana_theme</strong> — remembers whether you last chose light
              or dark mode, so the site opens in your preferred theme next time.
            </p>
            <p style={{ marginBottom: '0.9rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>vana_inquiry_list</strong> — your in-progress inquiry/quote
              draft (pieces, finishes, quantities you've added but not yet submitted), so it survives a page refresh.
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>vana_cookie_consent</strong> — remembers the choice you make
              on the cookie banner itself, so we don't show it to you again on every visit.
            </p>
          </div>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Clearing this data</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            All of the entries above are ordinary browser local storage, not cookies sent to a server on every request. You
            can clear them at any time from your browser's site settings (usually under "Clear browsing data" or "Site
            settings" for this domain), or use the reset button below to clear just your cookie banner choice on this device.
          </p>
          <button
            onClick={resetConsent}
            className="btn btn-secondary"
            style={{ borderRadius: '9999px', padding: '0.6rem 1.6rem', fontSize: '0.85rem' }}
          >
            Reset my cookie choice on this device
          </button>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Questions</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            For questions about local storage or this policy, write to contact@vana-furniture.com. See also our{' '}
            <button
              onClick={() => { if (setPath) setPath('/privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ padding: 0, color: 'var(--accent-gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.92rem' }}
            >
              privacy policy
            </button>{' '}
            for how contact and order data is handled.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={goHome} className="btn btn-secondary" style={{ borderRadius: '9999px', padding: '0.7rem 2rem' }}>
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
