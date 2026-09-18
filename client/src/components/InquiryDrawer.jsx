import React, { useState } from 'react';
import { useInquiry } from '../context/InquiryContext';
import { formatINR } from '../utils/formatters';
import { apiPost } from '../lib/api';
import { buildQuotePayload } from '../lib/quotes';
import { X, Trash2, Plus, Minus, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function InquiryDrawer() {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    removePiece,
    updateQuantity,
    clearInquiry,
    totalEstimate
  } = useInquiry();

  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    city: '',
    notes: ''
  });

  if (!isDrawerOpen) return null;

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = buildQuotePayload('inquiry-drawer', {
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        city: formData.city,
        notes: formData.notes,
        items,
        totalEstimate,
      });

      const json = await apiPost('/api/quotes', payload);

      const quoteNumber = json.quote_number || json.data?.quote_number;
      if (!quoteNumber) throw new Error(json.error || 'Failed to transmit inquiry');

      setSubmittedRef(quoteNumber);
      clearInquiry();
    } catch (err) {
      setErrorMsg(err.message || 'Error communicating with Basni factory desk');
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const text = `Hello VANA, I am inquiring about architectural furniture pieces: ${items.map(i => i.product_name).join(', ')}. Please connect with me regarding timber specs and manufacturing schedule.`;
    window.open(`https://wa.me/919829014820?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={() => setIsDrawerOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)' }}>
              Direct Factory Desk &bull; Basni, Jodhpur
            </span>
            <h3 style={{ fontSize: '1.35rem', marginTop: '2px' }}>Curated Project Pieces</h3>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="btn-icon" aria-label="Close inquiry drawer">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.75rem' }}>
          {submittedRef ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <CheckCircle2 size={54} color="var(--accent-gold)" style={{ margin: '0 auto 1.25rem' }} aria-hidden="true" />
              <span className="badge badge-gold" style={{ marginBottom: '0.85rem' }}>
                Inquiry Ref #{submittedRef}
              </span>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Directly Transmitted to Factory</h2>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Your project specifications have been dispatched to our master cabinetmakers and CAD engineers in Basni Phase II. The factory desk will contact you via WhatsApp and phone within 4 business hours.
              </p>
              <button
                onClick={() => { setSubmittedRef(null); setIsDrawerOpen(false); }}
                className="btn btn-outline"
              >
                Close Window
              </button>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '1rem' }}>No pieces currently selected for inquiry.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                Browse our collections and click "Inquire with Factory" to add pieces to your architectural curation list.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {items.map((item, idx) => (
                  <div
                    key={`${item.product_id}-${idx}`}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.2rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.product_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginTop: '2px' }}>
                          {item.wood_type} &bull; {item.finish_selected}
                        </div>
                      </div>
                       <button onClick={() => removePiece(idx)} className="btn-ghost" style={{ padding: '2px' }} aria-label="Remove item">
                         <Trash2 size={15} aria-hidden="true" />
                       </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem' }}>
                         <button onClick={() => updateQuantity(idx, -1)} className="btn-ghost" style={{ padding: '2px' }} aria-label="Decrease quantity">
                           <Minus size={13} aria-hidden="true" />
                         </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                         <button onClick={() => updateQuantity(idx, 1)} className="btn-ghost" style={{ padding: '2px' }} aria-label="Increase quantity">
                           <Plus size={13} aria-hidden="true" />
                         </button>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatINR(item.price_estimate_inr * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Estimated Factory Total */}
              <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  Estimated Factory Total:
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)' }}>
                  {formatINR(totalEstimate)}
                </span>
              </div>

              {/* Quick WhatsApp Action */}
              <button
                type="button"
                onClick={openWhatsApp}
                className="btn btn-secondary"
                style={{ width: '100%', borderColor: '#25D366', color: '#25D366' }}
              >
                 <MessageSquare size={16} aria-hidden="true" /> Direct WhatsApp with Factory (+91 98290 14820)
              </button>

              {/* Direct Factory Inquiry Form */}
              <form onSubmit={handleSubmitInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-gold)', fontWeight: 600 }}>
                  Or Submit Official Project Request:
                </div>
                <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                  Bespoke work starts as a quote. Ready-made pieces can be test-ordered from the product page and tracked online.
                </p>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Client / Architect Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Ar. Vikram Singhania"
                    className="input-luxury"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      placeholder="+91 98200 00000"
                      className="input-luxury"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Delivery City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Mumbai / Delhi / Jodhpur"
                      className="input-luxury"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="v.singhania@architecture.in"
                    className="input-luxury"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Architectural Notes & Custom Sizes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Custom dimensions, wood finish, project timeline..."
                    className="textarea-luxury"
                    style={{ minHeight: '70px' }}
                  />
                </div>

                {errorMsg && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.9rem' }}
                >
                   <Send size={15} aria-hidden="true" /> {submitting ? 'Transmitting to Factory...' : 'Send Inquiry to Factory Desk'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Direct factory consultation &bull; No online payments &bull; Basni Phase II Jodhpur
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
