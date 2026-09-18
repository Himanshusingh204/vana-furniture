import React, { useState, useEffect, useCallback } from 'react';
import { Star, BadgeCheck, Loader2 } from 'lucide-react';

// Reusable reviews block: list approved reviews + submit form.
// Props: productId (optional; omit for site-wide wall), limit, showForm.
export function Stars({ value }) {
  return (
    <span className="stars" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={14} fill={s <= value ? 'currentColor' : 'none'} opacity={s <= value ? 1 : 0.4} />
      ))}
    </span>
  );
}

export default function Reviews({ productId, limit = 6, showForm = true, title = 'Buyer reviews' }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ buyer_name: '', buyer_city: '', rating: 5, title: '', body: '' });
  const [status, setStatus] = useState({ sending: false, done: false, error: '' });

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (productId) q.append('product_id', productId);
    fetch(`/api/reviews?${q.toString()}`)
      .then((r) => r.json())
      .then((j) => setReviews((j.data || []).slice(0, limit)))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId, limit]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.buyer_name.trim() || !form.body.trim()) {
      setStatus({ sending: false, done: false, error: 'Please add your name and review.' });
      return;
    }
    setStatus({ sending: true, done: false, error: '' });
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, product_id: productId || null })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Could not submit review.');
      setStatus({ sending: false, done: true, error: '' });
      setForm({ buyer_name: '', buyer_city: '', rating: 5, title: '', body: '' });
      load();
    } catch (err) {
      setStatus({ sending: false, done: false, error: err.message });
    }
  };

  return (
    <div className="reviews-block">
      <h3 className="reviews-title">{title}</h3>
      {loading ? (
        <p className="reviews-hint">Loading verified reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-hint">No reviews yet. Yours could be the first from the factory floor.</p>
      ) : (
        <div className="reviews-grid">
          {reviews.map((r) => (
            <figure key={r.id} className="pro-review-card">
              <Stars value={r.rating} />
              {r.title && <strong className="review-headline">{r.title}</strong>}
              <blockquote>{r.body}</blockquote>
              <figcaption>
                <span className="pro-avatar">{(r.buyer_name || 'V').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                <span>
                  <span className="pro-reviewer">{r.buyer_name} <BadgeCheck size={13} style={{ display: 'inline' }} /></span>
                  <span className="pro-role">{r.buyer_city} · Verified buyer</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="review-form">
          <h4>Write a review</h4>
          {status.error && <div className="review-error">{status.error}</div>}
          {status.done && <div className="review-ok">Thank you. Your review is live below.</div>}
          <div className="review-row">
            <label>Name*<input value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} placeholder="Meera Rathore" /></label>
            <label>City<input value={form.buyer_city} onChange={(e) => setForm({ ...form, buyer_city: e.target.value })} placeholder="Jaipur" /></label>
            <label>Rating
              <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
              </select>
            </label>
          </div>
          <label>Headline<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Heirloom timber, honest finish" maxLength={120} /></label>
          <label>Review*<textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} placeholder="How is the joinery, finish and delivery experience?" maxLength={600} /></label>
          <button type="submit" className="btn btn-primary" disabled={status.sending} style={{ borderRadius: '9999px' }}>
            {status.sending ? <><Loader2 size={14} className="animate-spin" /> Posting…</> : 'Post review'}
          </button>
        </form>
      )}
    </div>
  );
}
