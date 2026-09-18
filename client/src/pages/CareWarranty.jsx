import React from 'react';
import SEO from '../components/SEO';
import { ShieldCheck, Award, Droplets, Sun, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CareWarranty() {
  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <SEO
        title="Living Timber Stewardship & 10-Year Structural Warranty | VANA"
        description="Comprehensive hardwood care guidelines and official 10-year factory structural warranty terms covering mortise-tenon joinery, vacuum kiln stabilization, and solid brass hardware from Basni, Jodhpur."
        keywords="10 year furniture warranty, solid wood care guide, linseed oil furniture maintenance, Sheesham wood care, VANA furniture warranty"
        url="https://jodhpur-furniture.com/care-warranty"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Living Timber Stewardship & 10-Year Structural Warranty',
          description: 'Official 10-year factory warranty and organic maintenance protocols for solid hardwood furniture.'
        }}
      />
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span className="eyebrow">Atelier Stewardship</span>
          <h1>Timber Care & 10-Year Structural Warranty</h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
            How to care for solid hardwood so it lasts.
          </p>
        </div>

        {/* 10-Year Warranty Certificate Banner */}
        <div
          className="card-luxury"
          style={{
            borderColor: 'var(--border-accent)',
            background: 'var(--bg-secondary)',
            padding: '3.5rem',
            marginBottom: '4.5rem',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--accent-gold-subtle)',
                color: 'var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Award size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Certificate of 10-year structural integrity</h2>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)' }}>
                VANA &bull; Official Factory Warranty
              </span>
            </div>
          </div>

          <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Every piece from our Basni plant carries a 10-year structural warranty covering:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <CheckCircle2 size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.88rem' }}>Structural integrity of all mortise-tenon, bridle, and dovetail joints.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <CheckCircle2 size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.88rem' }}>Internal structural steel bracing and C-channel stabilization.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <CheckCircle2 size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.88rem' }}>Structural splits caused by kiln-drying faults.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <CheckCircle2 size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.88rem' }}>Solid brass hardware attachments and butterfly key stabilizers.</span>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            * To activate your warranty, find the stamped serial number on the brass plaque under your piece and register with our support team.
          </div>
        </div>

        {/* Hardwood Care Guidelines */}
        <div>
          <h2 style={{ marginBottom: '2rem' }}>Caring for solid timber</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="card-luxury">
              <Droplets size={28} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.6rem' }}>Daily Maintenance</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                Dust gently using a clean, soft, dry cotton cloth. For spills, wipe immediately along the grain using a slightly damp cloth. Never use harsh abrasive sprays, bleach, or silicone-based aerosol polishes.
              </p>
            </div>

            <div className="card-luxury">
              <Sun size={28} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.6rem' }}>Climate & Placement</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                Our 8.4% kiln standard keeps timber stable, but keep pieces away from radiators and long hours in direct sun.
              </p>
            </div>

            <div className="card-luxury">
              <Sparkles size={28} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.6rem' }}>Annual Nourishment</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                Every 12 to 18 months, rub in a small amount of cold-pressed linseed oil or beeswax polish with a lint-free cloth. Let it sit for 20 minutes, then buff dry to bring back the lustre.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
