import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useInquiry } from '../context/InquiryContext';
import { formatINR } from '../utils/formatters';
import { X, ArrowRight, Eye, Plus, Check } from 'lucide-react';

const GALLERY_ITEMS = [
  {
    id: 'gal-001',
    productId: 'jod-prod-001',
    title: 'Monolith Dining Table',
    collection: 'Dining',
    wood_type: 'Seasoned Sheesham',
    finish: 'Natural Hand-Rubbed Linseed & Beeswax',
    dimensions: '2400 × 1000 × 760 mm',
    price_inr: 185000,
    image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80',
    description: 'A 2.4-meter solid Sheesham centerpiece with through-tenon joinery and virgin brass butterfly key inlays.'
  },
  {
    id: 'gal-002',
    productId: 'jod-prod-002',
    title: 'Basni Atelier Lounge Chair',
    collection: 'Living',
    wood_type: 'Royal Jodhpur Teak',
    finish: 'Raw Silk Matte Oil',
    dimensions: '820 × 860 × 740 mm',
    price_inr: 89000,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=1200&q=80',
    description: 'Sculpted from sustainably sourced royal teak with hand-stitched Indian pull-up leather slings.'
  },
  {
    id: 'gal-003',
    productId: 'jod-prod-003',
    title: 'Jali Fluted Credenza',
    collection: 'Living',
    wood_type: 'Sheesham & Cast Brass',
    finish: 'Dark Umber Patina',
    dimensions: '2100 × 480 × 820 mm',
    price_inr: 165000,
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
    description: 'CNC-fluted geometric sound-dampening louvers with solid teak soft-close drawer assemblies.'
  },
  {
    id: 'gal-004',
    productId: 'jod-prod-005',
    title: 'Lowline Pavilion Coffee Table',
    collection: 'Living',
    wood_type: 'Seasoned Sheesham',
    finish: 'Smoked Teak Stain',
    dimensions: '1400 × 750 × 420 mm',
    price_inr: 62000,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    description: 'Asymmetrical architectural profile with hand-finished chamfered edges and concealed bracing.'
  },
  {
    id: 'gal-005',
    productId: 'jod-prod-004',
    title: 'Heritage Spindle Dining Chairs',
    collection: 'Dining',
    wood_type: 'Royal Teak',
    finish: 'Warm Natural Oil',
    dimensions: '540 × 520 × 840 mm',
    price_inr: 44000,
    image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1200&q=80',
    description: 'Turned hardwood spindles, contoured ergonomic timber saddle seat, and interlocking mortise joints.'
  },
  {
    id: 'gal-006',
    productId: 'jod-prod-006',
    title: 'Atelier Cognac Leather Sofa',
    collection: 'Living',
    wood_type: 'Solid Teak Frame',
    finish: 'Natural Honey',
    dimensions: '2250 × 920 × 780 mm',
    price_inr: 210000,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
    description: 'Kiln-cured hardwood frame engineered with heavy-gauge webbing and pull-up top-grain leather.'
  },
  {
    id: 'gal-007',
    productId: 'jod-prod-002',
    title: 'Sculpted Minimalist Bar Stool',
    collection: 'Dining',
    wood_type: 'Solid White Oak & Teak',
    finish: 'Satin Clear Seal',
    dimensions: '420 × 420 × 760 mm',
    price_inr: 32000,
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80',
    description: 'Clean Scandinavian lines fused with Rajasthani joinery. Tapered splayed legs with turned timber stretcher.'
  },
  {
    id: 'gal-008',
    productId: 'jod-prod-003',
    title: 'Architectural Modernist Sideboard',
    collection: 'Study',
    wood_type: 'Kiln-Dried Sheesham',
    finish: 'Raw Silk Matte',
    dimensions: '1800 × 450 × 750 mm',
    price_inr: 135000,
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80',
    description: 'Flush-mounted push-to-open doors with internal adjustable hardwood shelving.'
  },
  {
    id: 'gal-009',
    productId: 'jod-prod-001',
    title: 'Minimalist Sandstone Living Suite',
    collection: 'Living',
    wood_type: 'Royal Jodhpur Teak',
    finish: 'Ebonized Ash & Natural Teak',
    dimensions: 'Architectural Installation',
    price_inr: 280000,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    description: 'Custom bespoke commission tailored for a private villa in Alwar, featuring integrated fluted wall panels.'
  }
];

const CATEGORIES = ['All', 'Living', 'Dining', 'Study'];

export default function GalleryPage({ setPath, onSelectProduct }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxItem, setLightboxItem] = useState(null);
  const [inquiryAdded, setInquiryAdded] = useState(false);
  const { addPieceToInquiry } = useInquiry();

  const filteredItems = activeCategory === 'All'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.collection === activeCategory);

  // Close lightbox on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleAddToInquiry = (item) => {
    addPieceToInquiry({
      id: item.productId,
      name: item.title,
      wood_type: item.wood_type,
      finish: item.finish,
      price_inr: item.price_inr,
      image: item.image,
      quantity: 1
    });
    setInquiryAdded(true);
    setTimeout(() => setInquiryAdded(false), 2000);
  };

  return (
    <div className="gallery-page-container">
      <SEO
        title="Gallery | Architectural Collections | VANA"
        description="Explore VANA's curated gallery of solid timber architectural furniture, custom residences, and bespoke trade joinery."
        keywords="VANA gallery, solid timber furniture, living room gallery, dining table showcase, Jodhpur woodworking"
        url="https://jodhpur-furniture.com/gallery"
      />

      <div className="container">
        {/* Page Header */}
        <div className="gallery-page-header">
          <span className="section-eyebrow-pill">Curated Portfolio</span>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: '0.8rem 0 1.25rem 0'
          }}>
            Architectural Spaces &amp; Works
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.75
          }}>
            A curated visual chronicle of solid timber creations photographed in modern residences, ateliers, and architectural spaces across India.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="gallery-filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`gallery-filter-pill ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry / Grid */}
        <div className="gallery-page-grid">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="gallery-page-card card-hover-lift"
              onClick={() => setLightboxItem(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxItem(item); } }}
              aria-label={`Open details for ${item.title}`}
            >
              <img src={item.image} alt={item.title} loading="lazy" />
              <div className="gallery-page-card-overlay">
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', marginBottom: '0.35rem' }}>
                  {item.collection} &bull; {item.wood_type}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#ffffff', margin: '0 0 0.5rem 0', fontWeight: 500 }}>
                  {item.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem' }}>
                    {formatINR(item.price_inr)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
                    <Eye size={14} /> View Details
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trade Callout Banner */}
        <div style={{
          marginTop: '6rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          borderRadius: '16px',
          padding: '3.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div style={{ maxWidth: '560px' }}>
            <span className="section-eyebrow-pill">Architects &amp; Trade</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', fontWeight: 400, margin: '0.6rem 0 1rem 0' }}>
              Building a bespoke interior project?
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              We partner with architects and interior designers nationwide. Upload your CAD files (.dwg, .step, .dxf) for structural engineering analysis and tiered trade pricing.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setPath('/custom-trade');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn btn-primary"
              style={{ borderRadius: '9999px', padding: '0.9rem 2rem' }}
            >
              Architect CAD Portal <ArrowRight size={15} />
            </button>
            <button
              onClick={() => {
                setPath('/contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn btn-secondary"
              style={{ borderRadius: '9999px', padding: '0.9rem 2rem' }}
            >
              Contact Atelier
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="gallery-lightbox-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxItem(null);
          }}
        >
          <div className="gallery-lightbox-modal">
            <button
              className="gallery-lightbox-close"
              onClick={() => setLightboxItem(null)}
              aria-label="Close Lightbox"
            >
              <X size={18} />
            </button>

            {/* Left Image Box */}
            <div className="gallery-lightbox-img-box">
              <img src={lightboxItem.image} alt={lightboxItem.title} />
            </div>

            {/* Right Info Box */}
            <div className="gallery-lightbox-info">
              <div>
                <span className="section-eyebrow-pill" style={{ marginBottom: '0.6rem' }}>
                  {lightboxItem.collection} Atelier Piece
                </span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 500, margin: '0 0 0.8rem 0' }}>
                  {lightboxItem.title}
                </h2>
                <p style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
                  {formatINR(lightboxItem.price_inr)}
                </p>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.94rem', marginBottom: '2rem' }}>
                  {lightboxItem.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Timber Species</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{lightboxItem.wood_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Finish</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{lightboxItem.finish}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Dimensions</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{lightboxItem.dimensions}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Atelier Location</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Basni Phase II, Jodhpur</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => handleAddToInquiry(lightboxItem)}
                  className="btn btn-primary"
                  style={{ borderRadius: '9999px', padding: '0.85rem 1.5rem', width: '100%' }}
                >
                  {inquiryAdded ? (
                    <>
                      <Check size={16} /> Added to Project Inquiry
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Add to Project Inquiry
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setLightboxItem(null);
                    if (onSelectProduct) {
                      onSelectProduct(lightboxItem.productId);
                    } else {
                      setPath(`/product/${lightboxItem.productId}`);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ borderRadius: '9999px', padding: '0.85rem 1.5rem', width: '100%' }}
                >
                  View Full Product Details &bull; 3D &amp; CAD <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
