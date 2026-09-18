import React from 'react';
import SEO from '../components/SEO';

export default function Terms({ setPath }) {
  const goHome = () => {
    if (setPath) setPath('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <SEO
        title="Terms of Service | VANA"
        description="Terms for made-to-order VANA furniture: lead times, 50% deposit, 18% GST invoicing, shipping, 10-year warranty and test-mode payments."
        keywords="VANA terms of service, made to order furniture terms, furniture warranty terms India"
        url="https://jodhpur-furniture.com/terms"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service',
          description: 'VANA terms covering made-to-order production, deposits, GST, shipping, warranty and CAD ownership.'
        }}
      />
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="eyebrow">Terms of service</span>
          <h1>Terms of service</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
            Plain terms for commissioning made-to-order pieces from our Jodhpur workshop.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Made-to-order production</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            Most pieces are made to order in Basni Phase II, Jodhpur. Each product page states its lead time in weeks, and the
            factory desk confirms the schedule before work begins. Timber grain, tone, and minor dimensions can vary slightly
            as each piece is cut from solid seasoned hardwood.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Deposit, GST, and payments</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            Production starts against a 50% deposit, with the balance due before dispatch. All prices include 18% GST, and every
            order ships with a GST invoice. All payments on this site run in test mode only, so no real money moves. The tracking
            page shows how a balance would be cleared once live payments are enabled.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Shipping and insurance</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            We pack each piece for road freight and arrange insured white-glove delivery across India. Transit insurance covers
            loss and damage until delivery. Please inspect the piece on arrival and report any transit damage within 48 hours
            with photos so we can raise a claim.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>10-year structural warranty</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            Every piece carries a 10-year structural warranty covering joints, bracing, kiln-seasoning defects, and brass hardware
            fixings, as detailed on our care and warranty page. The warranty does not cover normal finish wear, scratches, dents
            from daily use, or damage from misuse, outdoor exposure, or heat sources. Keep the serial number on the brass plaque
            to register a claim.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Drawings and CAD ownership</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            Drawings and CAD files you send for a custom commission remain yours. By sharing them you allow us to use them to
            build and quote your piece. VANA may reuse only generic joinery methods learned in production, not your project-specific
            designs, for other clients.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Contact and governing terms</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            These terms are governed by the laws of India, with jurisdiction at Jodhpur, Rajasthan. For questions about an order,
            warranty, or these terms, write to contact@vana-furniture.com or visit our workshop at Basni Phase II, Jodhpur.
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
