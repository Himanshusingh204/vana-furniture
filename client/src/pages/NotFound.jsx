import React from 'react';
import SEO from '../components/SEO';

export default function NotFound({ setPath }) {
  const go = (path) => {
    if (setPath) {
      setPath(path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <SEO
        title="Page Not Found | VANA"
        description="This drawing is missing from the archive. Return home, browse the catalog, or track your order."
        url="https://jodhpur-furniture.com/404"
      />
      <div style={{ maxWidth: '640px', textAlign: 'center' }}>
        <span className="section-eyebrow-pill">Archive reference · 404</span>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: '1rem 0'
          }}
        >
          This drawing is missing from the archive
        </h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '1rem', marginBottom: '2rem' }}>
          The page you asked for is not on file. It may have moved, or the reference may be incomplete.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => go('/')}>
            Back to home
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => go('/catalog')}>
            Browse catalog
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => go('/track')}>
            Track order
          </button>
        </div>
      </div>
    </div>
  );
}
