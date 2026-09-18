import React, { useState } from 'react';
import SEO from '../components/SEO';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2
} from 'lucide-react';

const FAQS = [
  {
    q: 'Can I visit the Basni workshop and see pieces being built?',
    a: 'Yes. Clients, architects, and designers can visit our 45,000 sq ft plant in Basni Phase II, Jodhpur. You can see seasoned timber stacks, watch 5-axis CNC work held to ±0.18 mm, and watch our joiners plane boards and apply linseed oil by hand.'
  },
  {
    q: 'What is the lead time for standard pieces versus custom CAD orders?',
    a: 'In-stock catalog pieces ship within 5 to 10 business days. Made-to-order catalog pieces require 3 to 4 weeks. Custom bespoke CAD architectural commissions typically take 4 to 6 weeks from final parametric drawing sign-off.'
  },
  {
    q: 'How does VANA prevent solid wood from warping in high-humidity climates?',
    a: 'We kiln-dry sheesham, royal teak, and acacia for 21 days to 8.4% moisture. Large table tops get relief cuts underneath and fitted steel C-channels with slotted bolts, so boards can move with the seasons without twisting or splitting.'
  },
  {
    q: 'How are the pieces delivered and installed across India?',
    a: 'Each piece is wrapped in acid-free paper, guarded at the corners with foam, and crated in plywood with silica gel. We send insured freight across India and offer white-glove setup in major metros.'
  },
  {
    q: 'What is covered under the 10-Year Structural Warranty?',
    a: 'Our warranty covers every mortise, tenon, bridle joint, drawbore pin, and timber member against structural failure, joint separation, or warping under normal indoor conditions. If a joint ever loosens, our technicians will repair or replace the piece.'
  }
];

export default function ContactPage({ setPath }) {
  // Form State
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    project_type: 'Residential Interior Inquiry',
    project_notes: ''
  });

  const [formStatus, setFormStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
    quoteNumber: null
  });

  // FAQ Accordion Open state
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name.trim() || !formData.client_email.trim()) {
      setFormStatus({ ...formStatus, error: 'Please enter your name and email address.' });
      return;
    }

    setFormStatus({ submitting: true, submitted: false, error: null, quoteNumber: null });

    try {
      const bodyData = new FormData();
      bodyData.append('client_name', formData.client_name.trim());
      bodyData.append('client_email', formData.client_email.trim());
      bodyData.append('client_phone', formData.client_phone.trim() || '9999999999');
      bodyData.append('project_type', formData.project_type);
      bodyData.append('project_notes', formData.project_notes.trim() || 'General inquiry from Contact page');

      const res = await fetch('/api/quotes', {
        method: 'POST',
        body: bodyData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setFormStatus({
        submitting: false,
        submitted: true,
        error: null,
        quoteNumber: data.quote_number || 'VNA-MSG-2026'
      });
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        project_type: 'Residential Interior Inquiry',
        project_notes: ''
      });
    } catch (err) {
      setFormStatus({
        submitting: false,
        submitted: false,
        error: err.message || 'Error submitting message. Please check your connection and try again.',
        quoteNumber: null
      });
    }
  };

  return (
    <div>
      <SEO
        title="Contact &amp; Studio | VANA Architectural Woodcraft"
        description="Connect with VANA in Jodhpur, Rajasthan. Book a workshop tour, inquire about architectural furniture, or commission custom CAD joinery."
        keywords="Contact VANA, Jodhpur furniture factory, custom wood furniture consultation, architectural furniture inquiry"
        url="https://jodhpur-furniture.com/contact"
      />

      {/* Hero Header */}
      <section className="contact-page-hero">
        <div className="container">
          <span className="section-eyebrow-pill">Atelier &bull; Design Studio</span>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 400,
            margin: '0.8rem 0 1.2rem 0',
            letterSpacing: '-0.02em'
          }}>
            Connect with the Atelier
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '620px',
            margin: '0 auto',
            lineHeight: 1.75
          }}>
            For a single dining table, a full home, or a trade project, write to us and we will reply within 24 hours.
          </p>
        </div>
      </section>

      {/* Main Split Layout */}
      <div className="container">
        <div className="contact-grid">
          {/* Left Column: Form */}
          <div>
            <span className="section-eyebrow-pill" style={{ marginBottom: '0.6rem' }}>Inquiries</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, margin: '0 0 1.75rem 0' }}>
              Drop us a Message
            </h2>

            {formStatus.submitted ? (
              <div style={{
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid var(--success)',
                borderRadius: '16px',
                padding: '2.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem', color: 'var(--success)' }}>
                  <CheckCircle2 size={26} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Message Received</h3>
                </div>
                <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  Thank you for reaching out to VANA. Your inquiry has been registered under commission ID <strong>{formStatus.quoteNumber}</strong>. Our design director will review your project and get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setFormStatus({ submitting: false, submitted: false, error: null, quoteNumber: null })}
                  className="btn btn-secondary"
                  style={{ borderRadius: '9999px', fontSize: '0.82rem', padding: '0.6rem 1.4rem' }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                {formStatus.error && (
                  <div style={{
                    background: 'rgba(248, 113, 113, 0.12)',
                    border: '1px solid var(--danger)',
                    color: 'var(--danger)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.88rem'
                  }}>
                    {formStatus.error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-page-name">Full Name *</label>
                  <input
                    id="contact-page-name"
                    type="text"
                    className="input-luxury"
                    placeholder="e.g. Vikram Mehta"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-page-email">Email Address *</label>
                    <input
                      id="contact-page-email"
                      type="email"
                      className="input-luxury"
                      placeholder="e.g. vikram@studio.com"
                      value={formData.client_email}
                      onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-page-phone">Phone Number</label>
                    <input
                      id="contact-page-phone"
                      type="tel"
                      className="input-luxury"
                      placeholder="+91 98290 12345"
                      value={formData.client_phone}
                      onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-page-project">Project Type</label>
                  <select
                    id="contact-page-project"
                    className="select-luxury"
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="Residential Interior Inquiry">Residential Interior &bull; Private Residence</option>
                    <option value="Architectural Commercial Project">Commercial &bull; Hotel, Cafe, Office</option>
                    <option value="Bespoke CAD Custom Commission">Bespoke CAD Joinery Commission</option>
                    <option value="Factory Workshop Visit">Schedule In-Person Factory Tour</option>
                    <option value="General Trade Partnership">General Trade &bull; Retailer Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-page-message">Project Notes / Specifications</label>
                  <textarea
                    id="contact-page-message"
                    className="textarea-luxury"
                    placeholder="Tell us about the room, timber preferences, target dimensions, or visit dates..."
                    value={formData.project_notes}
                    onChange={(e) => setFormData({ ...formData, project_notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-pill-dark"
                  disabled={formStatus.submitting}
                  style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                >
                  {formStatus.submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting Inquiry…
                    </>
                  ) : (
                    <>
                      Submit Inquiry <Send size={15} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Workshop Card & Details */}
          <div className="contact-info-card card-hover-lift">
            <div>
              <span className="section-eyebrow-pill" style={{ marginBottom: '0.5rem' }}>Factory &bull; Atelier</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 500, margin: '0 0 1rem 0' }}>
                Visit the Workshop
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.92rem' }}>
                We welcome private clients, architects, and trade partners to visit our working floor in Jodhpur. Prior appointment is recommended.
              </p>
            </div>

            {/* Visual Photo Card */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', height: '200px' }}>
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
                alt="VANA architectural interior"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Details List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <MapPin size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Address</strong>
                  <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Plot 48–52, Basni Industrial Area Phase II,<br />
                    Jodhpur, Rajasthan 342005, India
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Phone size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Direct Lines</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>+91 (0291) 274-8890 / +91 (0291) 274-1952</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Mail size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Email</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>contact@vana-furniture.com</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Clock size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ width: '100%' }}>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Hours</strong>
                  <ul className="studio-hours-list">
                    <li><span>Monday – Friday</span><span>9:30 AM – 6:30 PM</span></li>
                    <li><span>Saturday</span><span>10:00 AM – 4:30 PM</span></li>
                    <li><span>Sunday</span><span>Closed (by appointment)</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Shortcut to Trade Portal */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setPath('/custom-trade');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn btn-secondary"
                style={{ width: '100%', borderRadius: '9999px', fontSize: '0.82rem', padding: '0.75rem 1rem' }}
              >
                Upload CAD Blueprint for Direct Quote <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <section className="faq-section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="section-eyebrow-pill">Questions and answers</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 400, margin: '0.8rem 0 0.5rem 0' }}>
              Frequently asked questions
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem' }}>
              Everything you need to know about our craftsmanship, wood stability, and trade ordering.
            </p>
          </div>

          <div className="faq-container">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq-header"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} color="var(--accent-gold)" /> : <ChevronDown size={18} />}
                  </button>
                  {isOpen && (
                    <div className="faq-body">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
