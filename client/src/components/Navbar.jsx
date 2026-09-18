import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useInquiry } from '../context/InquiryContext';
import { Sun, Moon, FileText, Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar({ currentPath, setPath }) {
  const { isDark, toggleTheme } = useTheme();
  const { itemCount, setIsDrawerOpen } = useInquiry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Products', path: '/catalog' },
    { label: 'Factory & CAD', path: '/factory' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNav = (target) => {
    setMobileMenuOpen(false);
    const path = typeof target === 'string' ? target : target?.path || '/';
    setPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'color-mix(in srgb, var(--bg-primary) 85%, transparent)' : 'var(--bg-primary)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease, height 0.3s ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: scrolled ? '62px' : '78px',
          transition: 'height 0.3s ease',
        }}
      >
        {/* Brand Mark */}
        <button
          onClick={() => handleNav('/')}
          style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          aria-label="Go to homepage"
        >
          <BrandLogo
            size={scrolled ? 28 : 34}
            showSubtitle={!scrolled}
          />
        </button>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.label}
                onClick={() => handleNav(link)}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '1px solid var(--accent-gold)' : '1px solid transparent',
                  paddingBottom: '3px',
                  transition: 'color var(--transition-fast)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 0 3px 0',
                }}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Utility Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Trade CAD Portal Link */}
          <button
            onClick={() => handleNav({ path: '/custom-trade' })}
            className="btn btn-secondary"
            style={{
              padding: '0.42rem 0.85rem',
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              borderRadius: 'var(--radius-sm)',
              border: currentPath === '/custom-trade' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              color: currentPath === '/custom-trade' ? 'var(--accent-gold)' : 'var(--text-primary)'
            }}
          >
            Trade CAD
          </button>

          {/* Inquiry List */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
            title="Open Project Inquiry List"
            aria-label={`Project Inquiry List, ${itemCount} items`}
          >
            <FileText size={16} aria-hidden="true" />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inquiry</span>
            {itemCount > 0 && (
              <span style={{
                background: 'var(--accent-gold)',
                color: 'var(--text-inverse)',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                padding: '0.1rem 0.4rem',
                lineHeight: 1
              }}>
                {itemCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="btn-icon"
            aria-label="Toggle Theme"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              background: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
          >
            {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              background: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu with slide-down animation */}
      <div
        className="mobile-menu-wrapper"
        style={{
          overflow: 'hidden',
          maxHeight: mobileMenuOpen ? '400px' : '0',
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '1rem 1.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link)}
              style={{
                textAlign: 'left',
                padding: '0.7rem 0.5rem',
                fontSize: '0.9rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: currentPath === link.path ? 'var(--accent-gold)' : 'var(--text-primary)',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'none',
                border: 'none',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                borderBottomColor: 'var(--border-subtle)',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => handleNav({ path: '/custom-trade' })}
            style={{
              textAlign: 'left',
              padding: '0.7rem 0.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: currentPath === '/custom-trade' ? 'var(--accent-gold)' : 'var(--text-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
          >
            Trade &amp; Architect CAD Upload &rarr;
          </button>
        </div>
      </div>
    </header>
  );
}
