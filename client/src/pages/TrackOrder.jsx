import React, { useState } from 'react';
import SEO from '../components/SEO';
import GstInvoice from '../components/GstInvoice';
import EmiCalculator from '../components/EmiCalculator';
import { formatINR } from '../utils/formatters';
import { ORDER_STAGES, stageIndex } from '../utils/shop';
import { useTrackOrder } from '../hooks/useTrackOrder';
import { PackageSearch, Loader2, CheckCircle2, Truck, CreditCard, ArrowRight } from 'lucide-react';

// Public buyer tracking: sanitized lookup (no PII) + GST invoice + test-mode payment.
export default function TrackOrder({ setPath, initialOrderNumber }) {
  const {
    query, setQuery, order, loading, error, lookup,
    payState, payMethod, setPayMethod, startTestPayment,
  } = useTrackOrder(initialOrderNumber);
  // Ownership proof for the test-gateway intent (must match the order).
  // Pre-filled from the looked-up order when the API exposes it.
  const [payEmail, setPayEmail] = useState('');
  const [payPhone, setPayPhone] = useState('');

  const activeIdx = order ? stageIndex(order.manufacturing_stage) : 0;

  return (
    <div className="section" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <SEO
        title="Track Your Order | VANA"
        description="Live factory tracking for your VANA commission: manufacturing stage, GST invoice and balance payment."
        url="https://jodhpur-furniture.com/track"
      />
      <div className="container" style={{ maxWidth: '960px' }}>
        <span className="section-eyebrow-pill">Order tracking</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '2.4rem', margin: '0.6rem 0' }}>
          Where is my piece?
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '65ch', lineHeight: 1.7 }}>
          Enter the order number from your confirmation. Try the demo commission <strong>JOD-ORD-2026-0081</strong>.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); lookup(query); }}
          className="track-form"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="JOD-ORD-2026-0081"
            aria-label="Order number"
            className="contact-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ borderRadius: '9999px' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Locating…</> : <><PackageSearch size={15} /> Track</>}
          </button>
        </form>

        {error && (
          <div className="review-error" style={{ marginTop: '1rem' }}>
            {error}{' '}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ borderRadius: '9999px', marginLeft: '0.5rem', padding: '0.3rem 1rem', fontSize: '0.78rem' }}
              onClick={() => lookup(query)}
            >
              Retry
            </button>
          </div>
        )}

        {order && (
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="track-summary">
              <div>
                <div className="track-order-no">{order.order_number}</div>
                <div className="track-stage"><Truck size={14} /> {order.manufacturing_stage}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="track-total">{formatINR(order.total_inr)}</div>
                <div className="track-pay">{order.payment_status}</div>
              </div>
            </div>

            <ol className="track-timeline" aria-label="Manufacturing progress">
              {ORDER_STAGES.map((s, i) => (
                <li key={s} className={i < activeIdx ? 'done' : i === activeIdx ? 'active' : ''}>
                  <span className="dot">{i < activeIdx ? <CheckCircle2 size={16} /> : <span className="num">{i + 1}</span>}</span>
                  <span className="lbl">{s}</span>
                </li>
              ))}
            </ol>

            {(order.balance_due_inr || 0) > 0 && (
              <div className="analytics-pro-card">
                <h3><CreditCard size={15} style={{ display: 'inline', marginRight: '6px' }} />Clear the balance · test mode</h3>
                <div className="analytics-pro-sub">
                  Balance due {formatINR(order.balance_due_inr)}. Test gateway only — no real money moves.
                  {order.balance_due_inr > 0 && <span> UPI ID shown after intent: vana.atelier@okhdfc.</span>}
                </div>
                <div className="emi-controls" style={{ marginBottom: '1rem' }}>
                  <label>Method
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} aria-label="Payment method">
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="netbanking">Netbanking</option>
                      <option value="emi">EMI</option>
                    </select>
                  </label>
                  <label>Order email
                    <input
                      type="email"
                      value={payEmail}
                      onChange={(e) => setPayEmail(e.target.value)}
                      placeholder={order.email || order.customer_email || 'you@example.com'}
                      aria-label="Order email for verification"
                    />
                  </label>
                  <label>Order phone
                    <input
                      type="tel"
                      value={payPhone}
                      onChange={(e) => setPayPhone(e.target.value)}
                      placeholder={order.phone || order.customer_phone || '+91 …'}
                      aria-label="Order phone for verification"
                    />
                  </label>
                  <button className="btn btn-primary" style={{ borderRadius: '9999px' }} disabled={payState.working} onClick={() => startTestPayment({ email: payEmail || order.email || order.customer_email || undefined, phone: payPhone || order.phone || order.customer_phone || undefined })}>
                    {payState.working ? 'Processing…' : `Pay ${formatINR(order.balance_due_inr)} (test)`}
                  </button>
                </div>
                {payState.error && <div className="review-error">{payState.error}</div>}
                {payState.done && <div className="review-ok">Payment confirmed{payState.intent ? ` · ${payState.intent.provider_ref}` : ''}. Invoice below is now marked paid.</div>}
                <EmiCalculator priceInr={order.balance_due_inr} compact />
              </div>
            )}

            <GstInvoice order={order} />

            <button className="btn btn-secondary" style={{ borderRadius: '9999px', alignSelf: 'flex-start' }} onClick={() => setPath('/catalog')}>
              Continue browsing <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
