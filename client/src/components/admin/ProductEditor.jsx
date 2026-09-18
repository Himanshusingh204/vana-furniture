import React, { useState } from 'react';
import { TOKEN_KEY, LEGACY_TOKEN_KEY } from '../../lib/api';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const COLLECTIONS = ['Living', 'Dining', 'Executive Study', 'Bedroom'];
const STOCK_STATUSES = ['Made-to-Order', 'In Stock', 'Backordered', 'Discontinued'];

function emptyForm() {
  return {
    sku: '',
    name: '',
    collection: 'Living',
    wood_type: 'Seasoned Sheesham',
    finish: '',
    dimensions_length: '',
    dimensions_width: '',
    dimensions_height: '',
    dimensions_display: '',
    weight_kg: '',
    price_inr: '',
    trade_price_inr: '',
    stock_status: 'Made-to-Order',
    lead_time_weeks: 4,
    cad_available: false,
    cad_dwg_url: '',
    cad_dxf_url: '',
    cad_step_url: '',
    model_type: '',
    default_finish: '',
    available_finishes: '',
    description: '',
    joinery_details: '',
    featured: false,
    imageUrl: '',
    imageUrls: ''
  };
}

function formFromProduct(product) {
  if (!product) return emptyForm();
  return {
    sku: product.sku || '',
    name: product.name || '',
    collection: product.collection || 'Living',
    wood_type: product.wood_type || '',
    finish: product.finish || '',
    dimensions_length: product.dimensions_mm?.length ?? '',
    dimensions_width: product.dimensions_mm?.width ?? '',
    dimensions_height: product.dimensions_mm?.height ?? '',
    dimensions_display: product.dimensions_display || '',
    weight_kg: product.weight_kg ?? '',
    price_inr: product.price_inr ?? '',
    trade_price_inr: product.trade_price_inr ?? '',
    stock_status: product.stock_status || 'Made-to-Order',
    lead_time_weeks: product.lead_time_weeks ?? 4,
    cad_available: Boolean(product.cad_available),
    cad_dwg_url: product.cad_files?.dwg_url || '',
    cad_dxf_url: product.cad_files?.dxf_url || '',
    cad_step_url: product.cad_files?.step_url || '',
    model_type: product.three_config?.model_type || '',
    default_finish: product.three_config?.default_finish || '',
    available_finishes: Array.isArray(product.three_config?.available_finishes)
      ? product.three_config.available_finishes.join(', ')
      : '',
    description: product.description || '',
    joinery_details: product.joinery_details || '',
    featured: Boolean(product.featured),
    imageUrl: '',
    imageUrls: ''
  };
}

// Single shared create/edit form. Edit mode (product present) saves via
// multipart PUT with image upload support; create mode (no product) posts
// plain JSON to match what each API route actually accepts (see
// server/routes/products.js — POST takes a JSON body, PUT is multipart).
// Props { product, token, onSaved, onCancel }. Passed token prop wins; else the
// canonical vana_admin_token, else legacy jodhpur_admin_token.
export default function ProductEditor({ product, onSaved, onCancel, token }) {
  const authToken = token || sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(LEGACY_TOKEN_KEY) || '';
  const isEdit = Boolean(product?.id);
  const [form, setForm] = useState(() => formFromProduct(product));
  const [keptImages, setKeptImages] = useState(
    Array.isArray(product?.images) ? [...product.images] : []
  );
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const removedImages = (Array.isArray(product?.images) ? product.images : [])
    .filter((img) => !keptImages.includes(img));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setChecked = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

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

  const buildThreeConfig = () => ({
    model_type: form.model_type.trim(),
    default_finish: form.default_finish.trim(),
    available_finishes: form.available_finishes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  });

  const buildDimensionsMm = () => {
    const length = Number(form.dimensions_length);
    const width = Number(form.dimensions_width);
    const height = Number(form.dimensions_height);
    if (!length && !width && !height) return undefined;
    return { length: length || 0, width: width || 0, height: height || 0 };
  };

  const buildCadFiles = () => ({
    dwg_url: form.cad_dwg_url.trim(),
    dxf_url: form.cad_dxf_url.trim(),
    step_url: form.cad_step_url.trim()
  });

  const handleCreate = async () => {
    const images = form.imageUrls.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = {
      sku: form.sku.trim() || undefined,
      name: form.name.trim(),
      collection: form.collection,
      wood_type: form.wood_type.trim(),
      finish: form.finish.trim(),
      dimensions_mm: buildDimensionsMm(),
      dimensions_display: form.dimensions_display.trim(),
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      price_inr: Number(form.price_inr),
      trade_price_inr: form.trade_price_inr ? Number(form.trade_price_inr) : undefined,
      stock_status: form.stock_status,
      lead_time_weeks: Number(form.lead_time_weeks) || 0,
      cad_available: form.cad_available,
      cad_files: buildCadFiles(),
      three_config: buildThreeConfig(),
      description: form.description.trim(),
      joinery_details: form.joinery_details.trim(),
      featured: form.featured,
      images
    };
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErrors(json.errors || { form: json.error || 'Save failed' }); return; }
    onSaved(json.data);
  };

  const handleEdit = async () => {
    const fd = new FormData();
    fd.append('sku', form.sku);
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price_inr', String(form.price_inr));
    fd.append('wood_type', form.wood_type);
    fd.append('collection', form.collection);
    fd.append('finish', form.finish);
    fd.append('dimensions_mm', JSON.stringify(buildDimensionsMm() || {}));
    fd.append('dimensions_display', form.dimensions_display);
    fd.append('weight_kg', String(form.weight_kg || ''));
    fd.append('trade_price_inr', String(form.trade_price_inr || ''));
    fd.append('stock_status', form.stock_status);
    fd.append('lead_time_weeks', String(form.lead_time_weeks || ''));
    fd.append('cad_available', String(form.cad_available));
    fd.append('cad_files', JSON.stringify(buildCadFiles()));
    fd.append('three_config', JSON.stringify(buildThreeConfig()));
    fd.append('joinery_details', form.joinery_details);
    fd.append('featured', String(form.featured));
    if (form.imageUrl) fd.append('imageUrl', form.imageUrl);
    fd.append('keepImages', JSON.stringify(keptImages));
    fd.append('removeImages', JSON.stringify(removedImages));
    selectedFiles.forEach((f) => fd.append('images', f));

    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: fd
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErrors(json.errors || { form: json.error || 'Save failed' }); return; }
    onSaved(json.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) await handleEdit();
      else await handleCreate();
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Piece Name *</label>
          <input type="text" required value={form.name} onChange={set('name')} className="input-luxury" />
          {errors.name && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">SKU</label>
          <input type="text" value={form.sku} onChange={set('sku')} placeholder="Auto-generated if left blank" className="input-luxury" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Architectural Description *</label>
        <textarea required value={form.description} onChange={set('description')} className="textarea-luxury" />
        {errors.description && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.description}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Collection</label>
          <select value={form.collection} onChange={set('collection')} className="select-luxury">
            {[...new Set([...COLLECTIONS, form.collection].filter(Boolean))].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Timber Species</label>
          <input type="text" value={form.wood_type} onChange={set('wood_type')} className="input-luxury" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Finish</label>
        <input type="text" value={form.finish} onChange={set('finish')} placeholder="Natural Hand-Rubbed Linseed & Beeswax" className="input-luxury" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Price in INR *</label>
          <input type="number" required value={form.price_inr} onChange={set('price_inr')} className="input-luxury" />
          {errors.price_inr && <div style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.price_inr}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Trade Price in INR</label>
          <input type="number" value={form.trade_price_inr} onChange={set('trade_price_inr')} className="input-luxury" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Stock Status</label>
          <select value={form.stock_status} onChange={set('stock_status')} className="select-luxury">
            {[...new Set([...STOCK_STATUSES, form.stock_status].filter(Boolean))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Lead Time (Weeks)</label>
          <input type="number" value={form.lead_time_weeks} onChange={set('lead_time_weeks')} className="input-luxury" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Length (mm)</label>
          <input type="number" value={form.dimensions_length} onChange={set('dimensions_length')} className="input-luxury" />
        </div>
        <div className="form-group">
          <label className="form-label">Width (mm)</label>
          <input type="number" value={form.dimensions_width} onChange={set('dimensions_width')} className="input-luxury" />
        </div>
        <div className="form-group">
          <label className="form-label">Height (mm)</label>
          <input type="number" value={form.dimensions_height} onChange={set('dimensions_height')} className="input-luxury" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Outer Dimensions (Display)</label>
          <input type="text" value={form.dimensions_display} onChange={set('dimensions_display')} placeholder="2200 x 950 x 760 mm" className="input-luxury" />
        </div>
        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input type="number" value={form.weight_kg} onChange={set('weight_kg')} className="input-luxury" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Joinery Details</label>
        <textarea value={form.joinery_details} onChange={set('joinery_details')} className="textarea-luxury" />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={form.cad_available} onChange={setChecked('cad_available')} /> CAD available
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={form.featured} onChange={setChecked('featured')} /> Featured
        </label>
      </div>

      {form.cad_available && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">DWG URL</label>
            <input type="text" value={form.cad_dwg_url} onChange={set('cad_dwg_url')} className="input-luxury" />
          </div>
          <div className="form-group">
            <label className="form-label">DXF URL</label>
            <input type="text" value={form.cad_dxf_url} onChange={set('cad_dxf_url')} className="input-luxury" />
          </div>
          <div className="form-group">
            <label className="form-label">STEP URL</label>
            <input type="text" value={form.cad_step_url} onChange={set('cad_step_url')} className="input-luxury" />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">3D Model Type</label>
          <input type="text" value={form.model_type} onChange={set('model_type')} placeholder="dining_table, coffee_table, chair…" className="input-luxury" />
        </div>
        <div className="form-group">
          <label className="form-label">3D Default Finish</label>
          <input type="text" value={form.default_finish} onChange={set('default_finish')} placeholder="sheesham_natural" className="input-luxury" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">3D Available Finishes (comma-separated)</label>
        <input type="text" value={form.available_finishes} onChange={set('available_finishes')} placeholder="sheesham_natural, teak_honey" className="input-luxury" />
      </div>

      {isEdit ? (
        <>
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
        </>
      ) : (
        <div className="form-group">
          <label className="form-label">Image URLs (comma-separated)</label>
          <input type="text" value={form.imageUrls} onChange={set('imageUrls')} placeholder="https://…, https://…" className="input-luxury" />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish to Factory Catalog'}
        </button>
      </div>
    </form>
  );
}
