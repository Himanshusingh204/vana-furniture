import React from 'react';
import SEO from '../components/SEO';

export default function RefundPolicy({ setPath }) {
  const goHome = () => {
    if (setPath) setPath('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <SEO
        title="Refund & Cancellation Policy | VANA"
        description="How VANA handles cancellations and refunds for made-to-order furniture, the 50% production deposit, custom CAD commissions, and test-mode payments."
        keywords="VANA refund policy, furniture cancellation policy, made to order deposit refund India"
        url="https://jodhpur-furniture.com/refund-policy"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Refund & Cancellation Policy',
          description: 'VANA refund and cancellation policy covering the production deposit, cancellation windows, custom CAD orders and refund processing.'
        }}
      />
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="eyebrow">Trust and refunds</span>
          <h1>Refund &amp; cancellation policy</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
            Plain terms for cancelling or refunding a made-to-order commission.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Why refunds work differently here</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            Every piece is made to order in our Basni Phase II workshop, not picked from ready stock. As set out in our terms
            of service, production begins against a 50% deposit. Timber is cut, kiln-seasoned stock is committed, and CNC and
            joinery time is booked against your order as soon as work starts, so that deposit becomes largely non-refundable
            once production has begun.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Cancellation windows</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            You can cancel free of charge any time before the factory desk confirms your production schedule and cutting
            begins — write to us and we will cancel the order and refund the deposit in full. Once production has started,
            cancellation is still possible, but the deposit covers timber, milling and labour already committed and is not
            refundable at that stage. Any balance paid beyond the deposit for work not yet carried out will be refunded.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Custom CAD commissions</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            Pieces built from your own CAD drawings under our trade/custom upload flow are non-standard by nature — dimensions,
            joinery and finish are specific to your brief and are far harder to resell than a catalog design. For this reason
            deposits on CAD-based commissions are non-refundable from the moment we confirm the drawings and schedule cutting,
            even more strictly than standard catalog orders. Please confirm dimensions and specifications carefully before
            approving production.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Damage, defects, and warranty claims</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            If a piece arrives damaged in transit or with a manufacturing defect, report it within 48 hours with photos and
            we will repair, replace, or refund the affected piece at no cost to you, as covered by our shipping insurance and
            10-year structural warranty. This is separate from a change-of-mind cancellation and is not subject to the deposit
            terms above.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>How refunds are processed</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            All payments on this site currently run in test mode only, so no real money moves and no live refund transaction
            occurs today. Once live payments are enabled, approved refunds will be issued back to the original payment method
            and reflected on your order's tracking page, typically within 7-10 working days of approval. For any cancellation
            or refund request, write to contact@vana-furniture.com with your order number.
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
