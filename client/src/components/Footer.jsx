import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Footer({ setPath }) {
  const navigate = (path) => {
    setPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { label: 'The Collection', path: '/catalog' },
    { label: 'About the Atelier', path: '/about' },
    { label: 'Factory & 5-Axis CAD', path: '/factory' },
    { label: 'Trade CAD Upload', path: '/custom-trade' },
    { label: 'Track Your Order', path: '/track' },
    { label: 'Contact & Studio', path: '/contact' },
    { label: 'Timber Care & Warranty', path: '/care-warranty' },
  ];

  return (
    <footer
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '4rem 0 2rem',
        marginTop: '5rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem',
          }}
        >
          {/* Brand Column */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <BrandLogo size={32} showSubtitle={true} />
            </div>
            <p style={{
              fontSize: '0.85rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
            }}>
              Transforming architectural CAD models into heirloom solid timber furniture.
              Handcrafted from kiln-seasoned Indian Sheesham, Royal Teak, and cast brass
              in our Basni factory.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}>
              Contact
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.7rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <MapPin size={15} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                <span>Basni Industrial Area Phase II, Jodhpur, Rajasthan 342005</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} color="var(--accent-gold)" aria-hidden="true" />
                <span>+91 (0291) 274-8890</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} color="var(--accent-gold)" aria-hidden="true" />
                <span>contact@vana-furniture.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
            }}>
              Quick Links
            </h4>
            <ul style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              fontSize: '0.85rem',
            }}>
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    style={{
                      padding: '0.2rem 0',
                      color: 'var(--text-secondary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-gold)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright & Photography Attribution */}
        <div
          style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}
        >
          <div>
            &copy; 2026 VANA. Basni Phase II, Jodhpur, Rajasthan, India. All rights reserved.
          </div>
          <div>
            <button
              onClick={() => navigate('/privacy')}
              style={{ padding: 0, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Privacy
            </button>
            <span style={{ margin: '0 0.5rem' }}>&middot;</span>
            <button
              onClick={() => navigate('/terms')}
              style={{ padding: 0, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Terms
            </button>
            <span style={{ margin: '0 0.5rem' }}>&middot;</span>
            <button
              onClick={() => navigate('/refund-policy')}
              style={{ padding: 0, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Refund Policy
            </button>
            <span style={{ margin: '0 0.5rem' }}>&middot;</span>
            <button
              onClick={() => navigate('/cookie-policy')}
              style={{ padding: 0, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Cookie Policy
            </button>
          </div>
          <div style={{ fontSize: '0.74rem' }}>
            Curated architectural and timber photography sourced from independent creators via{' '}
            <a
              href="https://unsplash.com/"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}
            >
              Unsplash
            </a>{' '}
            under the{' '}
            <a
              href="https://unsplash.com/license"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}
            >
              Unsplash License
            </a>{' '}
            (royalty-free commercial use).
          </div>
        </div>
      </div>
    </footer>
  );
}
