import React, { useState, useRef } from 'react';
import SEO from '../components/SEO';
import { formatINR } from '../utils/formatters';
import { buildQuotePayload } from '../lib/quotes';
import {
  UploadCloud,
  FileCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CustomTrade() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    organization: '',
    project_type: 'Residential Penthouse',
    wood_preference: 'Seasoned Sheesham',
    length_mm: 2400,
    width_mm: 1000,
    height_mm: 760,
    inlay_hardware: 'Brushed Brass Inlays',
    project_notes: ''
  });

  // Calculate live parametric estimate
  const baseRates = {
    'Seasoned Sheesham': 58, // INR per cubic decimeter approx
    'Royal Jodhpur Teak': 78,
    'Reclaimed Acacia': 48
  };

  const volumeDecimeters = (formData.length_mm * formData.width_mm * formData.height_mm) / 1000000;
  const rate = baseRates[formData.wood_preference] || 58;
  const rawEstimate = Math.round(volumeDecimeters * rate * 1.65 + 35000);
  const tradeDiscountPct = 20; // 20% trade partner discount
  const finalEstimate = Math.round(rawEstimate * (1 - tradeDiscountPct / 100));

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validExtensions = ['.dwg', '.dxf', '.step', '.stp', '.pdf', '.obj', '.zip'];
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Invalid file format '${ext}'. Please upload standard CAD assets (.dwg, .dxf, .step, .pdf, .obj).`);
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50MB factory processing limit.');
      return;
    }
    setErrorMessage('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = buildQuotePayload('custom-trade', { ...formData, finalEstimate });
      const data = new FormData();
      Object.entries(payload).forEach(([k, v]) => data.append(k, String(v ?? '')));

      if (file) {
        data.append('cad_file', file);
      }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        body: data
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit quote inquiry');
      }

      setSubmittedQuote(json);
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with Basni engineering server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <SEO
        title="Architectural CAD Blueprint Upload & Parametric Quote Engine | VANA"
        description="Direct CAD engineering portal for architects and interior designers. Submit 2D DWG, DXF vector profiles, or 3D STEP solid models for 5-axis CNC tolerance checking, timber volume yield, and factory-direct trade pricing."
        keywords="CAD blueprint upload furniture, DWG to CNC manufacturing, bespoke architectural furniture, trade furniture quote India, STEP file furniture fabrication, VANA trade"
        url="https://jodhpur-furniture.com/custom-trade"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Bespoke CAD to Furniture Manufacturing',
          provider: {
            '@type': 'Organization',
            name: 'VANA Architectural Woodcraft'
          },
          areaServed: 'Worldwide',
          description: 'Manufacturing of bespoke architectural furniture from digital CAD files on 5-axis CNC machines and hand-planed joinery.'
        }}
      />
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '780px', marginBottom: '3.5rem' }}>
          <span className="eyebrow">Trade & Architect Commissioning</span>
          <h1>CAD Blueprint Upload & Parametric Quote Engine</h1>
          <p style={{ fontSize: '1.15rem', lineHeight: 1.7, marginTop: '0.8rem' }}>
            Direct engineering conduit for architects, interior designers, and bespoke patrons. Upload your 2D DWG, 3D STEP, or vector DXF drawings for immediate tolerance analysis, timber yield calculation, and factory direct trade quotes.
          </p>
        </div>

        {submittedQuote ? (
          <div className="card-luxury" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
            <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
            <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
              Reference #{submittedQuote.quote_number}
            </span>
            <h2 style={{ marginBottom: '1rem' }}>CAD Specification Submitted to Basni Atelier</h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Your blueprint packet has been dispatched to our CAD engineers. We are verifying 5-axis CNC toolpaths, timber grain alignment, and moisture acclimation parameters. A verified trade proposal will be sent within 24 hours.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button onClick={() => setSubmittedQuote(null)} className="btn btn-outline">
                Submit Another Specification
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '3.5rem',
                alignItems: 'start'
              }}
              className="trade-grid"
            >
              {/* Left Column: Project Specs & File Upload */}
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>
                  1. Project & Architectural Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
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
                  <div className="form-group">
                    <label className="form-label">Firm / Studio Name</label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Morphogenesis Architecture"
                      className="input-luxury"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      placeholder="v.singhania@morpho.in"
                      className="input-luxury"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                      placeholder="+91 98201 00000"
                      className="input-luxury"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Project Typology</label>
                    <select
                      value={formData.project_type}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                      className="select-luxury"
                    >
                      <option value="Residential Penthouse">Residential Penthouse</option>
                      <option value="Boutique Hospitality">Boutique Hospitality / Resort</option>
                      <option value="Corporate Executive HQ">Corporate Executive HQ</option>
                      <option value="Private Collector Commission">Private Collector Commission</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hardwood Species Preference</label>
                    <select
                      value={formData.wood_preference}
                      onChange={(e) => setFormData({ ...formData, wood_preference: e.target.value })}
                      className="select-luxury"
                    >
                      <option value="Seasoned Sheesham">Seasoned Sheesham (Dalbergia sissoo)</option>
                      <option value="Royal Jodhpur Teak">Royal Jodhpur Teak (Tectona grandis)</option>
                      <option value="Reclaimed Acacia">Reclaimed Acacia (Vachellia nilotica)</option>
                    </select>
                  </div>
                </div>

                {/* Dimensions Inputs */}
                <div className="form-group">
                  <label className="form-label">Target Outer Dimensions (mm)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Length (L)</span>
                      <input
                        type="number"
                        min="400"
                        max="6000"
                        value={formData.length_mm}
                        onChange={(e) => setFormData({ ...formData, length_mm: Number(e.target.value) })}
                        className="input-luxury"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Width (W)</span>
                      <input
                        type="number"
                        min="300"
                        max="2400"
                        value={formData.width_mm}
                        onChange={(e) => setFormData({ ...formData, width_mm: Number(e.target.value) })}
                        className="input-luxury"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Height (H)</span>
                      <input
                        type="number"
                        min="300"
                        max="2400"
                        value={formData.height_mm}
                        onChange={(e) => setFormData({ ...formData, height_mm: Number(e.target.value) })}
                        className="input-luxury"
                      />
                    </div>
                  </div>
                </div>

                {/* Drag-and-Drop CAD Dropzone */}
                <div className="form-group">
                  <label className="form-label">Upload CAD Blueprint or Specification Packet (.dwg, .dxf, .step, .pdf)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".dwg,.dxf,.step,.stp,.pdf,.obj,.zip"
                    style={{ display: 'none' }}
                  />
                  <div
                    className={`file-dropzone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {file ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <FileCheck size={28} color="var(--accent-gold)" />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for transmission
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={36} color="var(--accent-gold)" style={{ margin: '0 auto 0.8rem' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          Drag & drop 2D/3D CAD drawing or browse files
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                          Supports AutoCAD DWG, DXF, SolidWorks STEP, OBJ, or Architectural PDF (Up to 50MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Architectural Notes / Joinery Details</label>
                  <textarea
                    value={formData.project_notes}
                    onChange={(e) => setFormData({ ...formData, project_notes: e.target.value })}
                    placeholder="Specify joinery preferences (e.g. exposed butterfly keys, recessed wire chases, leather inlays)..."
                    className="textarea-luxury"
                  />
                </div>
              </div>

              {/* Right Column: Live Parametric Cost Estimator */}
              <div>
                <div
                  className="card-luxury"
                  style={{
                    position: 'sticky',
                    top: '100px',
                    borderColor: 'var(--border-accent)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Cpu size={18} color="var(--accent-gold)" />
                    <h3 style={{ fontSize: '1.3rem' }}>Live Parametric Estimator</h3>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Calculated from solid timber displacement, 5-axis CNC machining hours, and Basni joinery guild assembly:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Displacement Volume:</span>
                      <span style={{ fontWeight: 600 }}>{volumeDecimeters.toFixed(1)} dm&sup3;</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Selected Hardwood:</span>
                      <span style={{ fontWeight: 600 }}>{formData.wood_preference}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Retail Baseline Value:</span>
                      <span>{formatINR(rawEstimate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--success)' }}>
                      <span>Architect Trade Courtesy (20%):</span>
                      <span>- {formatINR(rawEstimate - finalEstimate)}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem',
                      marginBottom: '1.5rem',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Estimated Factory Cost
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)' }}>
                      {formatINR(finalEstimate)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      * Includes 18% GST, CAD verification & white-glove packaging.
                    </div>
                  </div>

                  {errorMessage && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(248, 113, 113, 0.15)',
                        border: '1px solid var(--danger)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--danger)',
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem' }}
                  >
                    {submitting ? 'Transmitting CAD Packet...' : 'Submit to Engineering Floor'} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
