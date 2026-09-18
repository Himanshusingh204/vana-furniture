import React, { useState } from 'react';
import SEO from '../components/SEO';

export default function Privacy({ setPath }) {
  const goHome = () => {
    if (setPath) setPath('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [deleteForm, setDeleteForm] = useState({ email: '', name: '', details: '', website: '' });
  const [deleteStatus, setDeleteStatus] = useState('idle'); // idle | submitting | sent | error
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteChange = (field) => (e) => {
    setDeleteForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const submitDeleteRequest = async (e) => {
    e.preventDefault();
    if (deleteStatus === 'submitting') return;
    setDeleteStatus('submitting');
    setDeleteError('');
    try {
      const res = await fetch('/api/privacy/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteForm)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setDeleteError(data.error || 'Could not submit your request. Please try again.');
        setDeleteStatus('error');
        return;
      }
      setDeleteStatus('sent');
    } catch (err) {
      setDeleteError('Could not reach the server. Please try again or email us directly.');
      setDeleteStatus('error');
    }
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <SEO
        title="Privacy Policy | VANA"
        description="How VANA collects, uses and retains contact, order, review and newsletter data. No card data and no third-party trackers."
        keywords="VANA privacy policy, Jodhpur furniture privacy, data retention furniture orders"
        url="https://jodhpur-furniture.com/privacy"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Privacy Policy',
          description: 'VANA privacy policy covering data collection, use, retention and grievance contact.'
        }}
      />
      <div className="container" style={{ maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="eyebrow">Trust and privacy</span>
          <h1>Privacy policy</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.8rem' }}>
            What we collect, why we use it, and how to reach us.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>What we collect</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            We collect only what is needed to respond to you and fulfil your order. This includes contact details you share
            (name, phone, email, city), order and quote data (pieces selected, finishes, dimensions, budget), product reviews
            you submit, your newsletter email if you subscribe, and a wishlist key stored so saved pieces stay linked to your device.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>How we use it</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            We use your details for order fulfilment and support. That means confirming quotes, sharing lead times and invoices,
            arranging delivery, and answering questions about your pieces. We do not sell your details or share them for marketing by others.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>What we do not collect</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            We do not collect card or bank details. All payments on this site run in test mode only, and no real money moves.
            We use no third-party trackers or advertising cookies. The only local storage we keep in your browser covers your
            inquiry draft, wishlist key, and recently viewed pieces.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Retention</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            We keep order and quote records for tax and warranty reference, and review and newsletter records until you ask us
            to remove them. Browser local storage stays on your device and can be cleared at any time from your browser settings.
            Write to us if you want your details corrected or deleted, and we will act on it.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Children's data</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            This site is not directed at children, and we do not knowingly collect personal data from anyone under 18. If you
            believe a minor has shared personal details with us, write to contact@vana-furniture.com and we will remove them.
          </p>
        </div>

        <div className="card-luxury" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Request data deletion</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
            To ask us to delete your contact, quote, review, or newsletter data, submit the form below with the email address
            you used with us. Your request is logged for our team to action manually, and we aim to confirm by email within
            five working days. You can also write directly to contact@vana-furniture.com.
          </p>

          {deleteStatus === 'sent' ? (
            <p style={{ fontSize: '0.92rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
              Your deletion request has been received. We will confirm by email once it's actioned.
            </p>
          ) : (
            <form onSubmit={submitDeleteRequest} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxWidth: '480px' }}>
              {/* Honeypot: hidden from real visitors, bots that fill every field trip it */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
                <label htmlFor="privacy-delete-website">Website</label>
                <input
                  id="privacy-delete-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={deleteForm.website}
                  onChange={handleDeleteChange('website')}
                />
              </div>

              <div>
                <label htmlFor="privacy-delete-email" style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Email address (required)
                </label>
                <input
                  id="privacy-delete-email"
                  type="email"
                  required
                  value={deleteForm.email}
                  onChange={handleDeleteChange('email')}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label htmlFor="privacy-delete-name" style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Name (optional)
                </label>
                <input
                  id="privacy-delete-name"
                  type="text"
                  value={deleteForm.name}
                  onChange={handleDeleteChange('name')}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label htmlFor="privacy-delete-details" style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Anything else we should know (optional)
                </label>
                <textarea
                  id="privacy-delete-details"
                  rows={3}
                  value={deleteForm.details}
                  onChange={handleDeleteChange('details')}
                  className="input"
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }}
                />
              </div>

              {deleteStatus === 'error' && (
                <p role="alert" style={{ fontSize: '0.82rem', color: '#e05252' }}>{deleteError}</p>
              )}

              <button
                type="submit"
                disabled={deleteStatus === 'submitting'}
                className="btn btn-primary"
                style={{ borderRadius: '9999px', padding: '0.65rem 1.6rem', fontSize: '0.85rem', alignSelf: 'flex-start', opacity: deleteStatus === 'submitting' ? 0.7 : 1 }}
              >
                {deleteStatus === 'submitting' ? 'Submitting…' : 'Request deletion'}
              </button>
            </form>
          )}
        </div>

        <div className="card-luxury" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Grievance contact</h2>
          <p style={{ fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            For privacy requests or complaints, write to contact@vana-furniture.com. Our workshop is at Basni Phase II, Jodhpur,
            Rajasthan 342005. We aim to reply within five working days.
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
