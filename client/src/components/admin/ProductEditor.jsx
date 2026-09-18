import React, { useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Edit any product: name, description, price, images via upload or URL.
// Props { product, token, onSaved, onCancel }. Passed token prop wins; else the
// canonical vana_admin_token, else legacy jodhpur_admin_token.
export default function ProductEditor({ product, onSaved, onCancel, token }) {
  const authToken = token || sessionStorage.getItem('vana_admin_token') || sessionStorage.getItem('jodhpur_admin_token') || '';
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price_inr: product?.price_inr ?? '',
    wood_type: product?.wood_type || '',
    imageUrl: ''
  });
  const [keptImages, setKeptImages] = useState(
    Array.isArray(product?.images) ? [...product.images] : []
  );
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const removedImages = (Array.isArray(product?.images) ? product.images : [])
    .filter((img) => !keptImages.includes(img));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const bad = files.find((f) => !ACCEPTED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);
    if (bad) {
      setErrors((prev) => ({ ...prev, images: 'Each image must be jpg, png, or webp under 5MB' }));
      return;
    }
    setErrors((prev) => ({ ...prev, images: undefined }));
    setSelectedFiles(files);
  };

  const toggleKeep = (img) => {
    setKeptImages((kept) => (kept.includes(img) ? kept.filter((k) => k !== img) : [...kept, img]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price_inr', String(form.price_inr));
      fd.append('wood_type', form.wood_type);
      if (form.imageUrl) fd.append('imageUrl', form.imageUrl);
      fd.append('keepImages', JSON.stringify(keptImages));
      fd.append('removeImages', JSON.stringify(removedImages));
      selectedFiles.forEach((f) => fd.append('images', f));

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
        body: fd
      });
      const json = await res.json();
      if (!res.ok) { setErrors(json.errors || { form: json.error || 'Save failed' }); return; }
      onSaved(json.data);
    } catch (err) {
      setErrors({ form: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.form && (
        <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(248,113,113,0.15)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          {errors.form}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Piece Name *</label>
        <input type="text" required value={form.name} onChange={set('name')} className="input-luxury" />
        {errors.name && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.name}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Architectural Description *</label>
        <textarea value={form.description} onChange={set('description')} className="textarea-luxury" />
        {errors.description && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.description}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Price in INR *</label>
          <input type="number" required value={form.price_inr} onChange={set('price_inr')} className="input-luxury" />
          {errors.price_inr && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.price_inr}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Timber Species</label>
          <input type="text" value={form.wood_type} onChange={set('wood_type')} className="input-luxury" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Image URL (http(s) jpg, png, or webp)</label>
        <input type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" className="input-luxury" />
        {errors.imageUrl && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.imageUrl}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Upload Images (jpg, png, webp under 5MB)</label>
        <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleFiles} className="input-luxury" />
        {errors.images && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.images}</div>}
      </div>

      {keptImages.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
          {keptImages.map((img) => (
            <div key={img} style={{ position: 'relative' }}>
              <img src={img} alt={form.name ? `${form.name} product photo` : 'Product photo'} style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px' }} />
              <button type="button" onClick={() => toggleKeep(img)} title="Remove image" style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', lineHeight: 1 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {removedImages.length > 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {removedImages.length} image(s) marked for removal. Save to confirm.
          <button type="button" onClick={() => setKeptImages(Array.isArray(product?.images) ? [...product.images] : [])} className="btn-ghost" style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
            Restore
          </button>
        </div>
      )}
      {selectedFiles.length > 0 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {selectedFiles.length} new file(s) ready to upload.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
