import React, { useState } from 'react';
import SEO from '../components/SEO';
import { apiPost } from '../lib/api';
import { buildQuotePayload } from '../lib/quotes';
import {
  Cpu,
  CheckCircle2,
  Calendar,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Factory({ setPath }) {
  const [tourSubmitted, setTourSubmitted] = useState(false);
  const [tourSending, setTourSending] = useState(false);
  const [tourError, setTourError] = useState('');
  const [tourRef, setTourRef] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    visitor_type: 'Architect / Interior Designer',
    preferred_date: '',
    interests: 'CAD to CNC Workflow & Timber Curing'
  });

  const zones = [
    {
      num: '01',
      title: 'Timber Curing & Vacuum Kiln Chambers',
      desc: 'Solid sheesham, teak, and acacia planks are stacked on stickers in three dehumidification chambers for 21 days until they reach 8.4% moisture.',
      metric: '8.4% Moisture Equilibrium',
      img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
    },
    {
      num: '02',
      title: '5-Axis CNC Parametric Toolpath Bay',
      desc: 'Our German Homag 5-axis routers machine compound mortises, continuous-grain curves, and delicate jali fluting with an absolute spindle tolerance of ±0.18 mm.',
      metric: '±0.18 mm Calibration',
      img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    },
    {
      num: '03',
      title: 'Master Joiner Guild Workshop',
      desc: 'Machine-cut parts come here for hand work. Our joiners cut drawbore tenons, plane chamfers by hand, and set brass butterfly keys with pull-planes and mallets.',
      metric: 'Drawbore Hardwood Tenons',
      img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
    },
    {
      num: '04',
      title: 'Natural Oil & Microcrystalline Wax Studio',
      desc: 'Finishes are zero-VOC. Surfaces are hand-rubbed with five coats of cold-pressed linseed oil, shellac, and carnauba wax.',
      metric: 'Food-Safe Organic Seal',
      img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const handleTourSubmit = async (e) => {
    e.preventDefault();
    setTourSending(true);
    setTourError('');
    try {
      const payload = buildQuotePayload('factory-visit', formData);
      const json = await apiPost('/api/quotes', payload);
      setTourRef(json.quote_number || json.data?.quote_number || '');
      setTourSubmitted(true);
    } catch (err) {
      setTourError(err.message || 'Could not submit tour request. Please try again or WhatsApp us.');
    } finally {
      setTourSending(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '2.5rem' }}>
      <SEO
        title="Basni Phase II Manufacturing Plant & 5-Axis CNC Facility | VANA"
        description="Tour our 45,000 sq ft architectural furniture manufacturing plant in Basni Industrial Area Phase II, Jodhpur. Automated vacuum kilns curing timber to 8.4% RH, Homag 5-axis CNC routers (±0.18mm tolerance), and master joinery guild."
        keywords="VANA furniture factory, Basni industrial area Phase II, CNC woodworking plant India, kiln dried timber Jodhpur, 5 axis router furniture manufacturing"
        url="https://jodhpur-furniture.com/factory"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'VANA Manufacturing Plant',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Plot 42-B, Basni Industrial Area Phase II',
            addressLocality: 'Jodhpur',
            addressRegion: 'Rajasthan',
            postalCode: '342005',
            addressCountry: 'IN'
          },
          telephone: '+91-98290-14820',
          url: 'https://jodhpur-furniture.com/factory'
        }}
      />
      <div className="container">
        {/* Header */}
        <div style={{ maxWidth: '820px', marginBottom: '4rem' }}>
          <span className="eyebrow">The Atelier Plant &bull; Basni Phase II</span>
          <h1>45,000 sq ft built for solid timber work</h1>
          <p style={{ fontSize: '1.15rem', lineHeight: 1.7, marginTop: '1rem' }}>
            Our plant in the Basni district pairs German CAD and CNC equipment with four generations of joinery practice. Architects, designers, and clients can walk the floor and see each stage of production.
          </p>
        </div>

        {/* Plant Key Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '5rem'
          }}
        >
          <div className="card-luxury" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>45,000 sq ft</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-gold)' }}>Factory Footprint</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Basni Industrial Area Phase II, Jodhpur</div>
          </div>
          <div className="card-luxury" style={{ borderLeft: '4px solid var(--success)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>8.4% RH</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--success)' }}>Kiln Curing Standard</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Dried to hold shape in varied climates</div>
          </div>
          <div className="card-luxury" style={{ borderLeft: '4px solid var(--info)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>&plusmn;0.18 mm</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--info)' }}>5-Axis CNC Precision</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Cut on Homag high-speed routers</div>
          </div>
          <div className="card-luxury" style={{ borderLeft: '4px solid #a78bfa' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>10 Years</div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a78bfa' }}>Structural Warranty</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Covers drawbore mortise and tenon joints</div>
          </div>
        </div>

        {/* Manufacturing Zones Walkthrough */}
        <div style={{ marginBottom: '6rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
            <span className="eyebrow">Plant Architecture</span>
            <h2>Four specialized work zones</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {zones.map((zone, idx) => (
              <div
                key={zone.num}
                className="card-luxury"
                style={{
                  display: 'grid',
                  gridTemplateColumns: idx % 2 === 0 ? '1.2fr 1fr' : '1fr 1.2fr',
                  gap: '3rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ order: idx % 2 === 0 ? 1 : 2 }}>
                  <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)' }}>
                    {zone.num}
                  </span>
                  <h3 style={{ fontSize: '1.6rem', margin: '0.4rem 0 1rem' }}>{zone.title}</h3>
                  <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    {zone.desc}
                  </p>
                  <span className="badge badge-gold">
                    <Sparkles size={14} /> {zone.metric}
                  </span>
                </div>

                <div style={{ order: idx % 2 === 0 ? 2 : 1, height: '320px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <img
                    src={zone.img}
                    alt={zone.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Book a Private Factory Tour */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-md)',
            padding: '3.5rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            alignItems: 'center'
          }}
          className="tour-grid"
        >
          <div>
            <span className="eyebrow">Private Invitation</span>
            <h2 style={{ marginBottom: '1rem' }}>Visit our Basni plant</h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Architects, design teams, and clients can walk our kiln rooms, CAD stations, and joinery floor in Jodhpur.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={18} color="var(--accent-gold)" />
                <span>Basni Industrial Area Phase II, Jodhpur, Rajasthan 342005</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={18} color="var(--accent-gold)" />
                <span>Private Sessions: Tuesday – Saturday, 10:00 – 16:00 IST</span>
              </div>
            </div>
          </div>

          <div>
            {tourSubmitted ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                <h3>Tour Request Received{tourRef ? ` · ${tourRef}` : ''}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Our factory lead will reply within 24 business hours to confirm your visit time and entry passes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTourSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ar. Rajesh Malhotra"
                    className="input-luxury"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="r.malhotra@studio.in"
                      className="input-luxury"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98210 00000"
                      className="input-luxury"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Firm / Studio</label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Malhotra Architects"
                      className="input-luxury"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Preferred Date</label>
                    <input
                      type="date"
                      required
                      value={formData.preferred_date}
                      onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                      className="input-luxury"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={tourSending}>
                  {tourSending ? 'Sending…' : <>Confirm Factory Tour Booking <ArrowRight size={16} /></>}
                </button>
                {tourError && (
                  <div role="alert" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                    {tourError}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
