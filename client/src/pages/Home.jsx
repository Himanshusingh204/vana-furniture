import React, { useState, useEffect, useCallback } from 'react';
import SEO from '../components/SEO';
import { Stars } from '../components/Reviews';
import { useSocket } from '../context/SocketContext';
import { useInquiry } from '../context/InquiryContext';
import { formatINR } from '../utils/formatters';
import { getRecentlyViewed } from '../utils/shop';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  BadgeCheck,
  Sofa,
  UtensilsCrossed,
  BedDouble,
  Briefcase,
  Lamp,
  PencilRuler,
  Hammer,
  TreePine,
  Ruler,
  Quote,
  ChevronDown,
  ShoppingBag,
  Eye,
  Landmark,
  CreditCard,
  Headphones
} from 'lucide-react';

const HERO_CAROUSEL_SLIDES = [
  {
    id: 'hero-slide-1',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=85',
    tabName: 'Emerald Lounge Suite',
    eyebrow: 'VANA Atelier • Jodhpur • Master Collection',
    title: 'Furniture that Everyone Loves',
    subtitle: 'Kiln-seasoned Sheesham and hand-cast solid brass. Architectural joinery engineered for generations of inspired modern living.',
    pieceName: 'Emerald Fluted Lounge Suite',
    wood: 'Grade-A Indian Rosewood & Cast Brass',
    joinery: 'Through-Mortise & Concealed Soft-Close',
    productId: 'jod-prod-003'
  },
  {
    id: 'hero-slide-2',
    image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=2000&q=85',
    tabName: 'Monolith Dining',
    eyebrow: 'Bespoke Dining Ensembles • Kiln Seasoned',
    title: 'Sculptural Timber Built for Gatherings',
    subtitle: '65mm seasoned monolithic timber planks, butterfly key joinery, and organic hand-rubbed oil wax finishes that mature with grace.',
    pieceName: 'Monolith Dining Table',
    wood: 'Kiln-Seasoned Sheesham (8.4% MC)',
    joinery: 'Hand-Cut Butterfly Keys & 65mm Planks',
    productId: 'jod-prod-001'
  },
  {
    id: 'hero-slide-3',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85',
    tabName: 'Atelier Pavilion',
    eyebrow: 'Architectural Interiors • Basni Studio',
    title: 'Timeless Form, Uncompromising Craft',
    subtitle: 'Designed to anchor expansive living pavilions with understated monumentality, warmth of natural timber, and architectural balance.',
    pieceName: 'Lowline Pavilion Coffee Ensemble',
    wood: 'Solid Jodhpur Teak & Natural Oil',
    joinery: 'Floating Top Mitred Joinery',
    productId: 'jod-prod-005'
  },
  {
    id: 'hero-slide-4',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=2000&q=85',
    tabName: 'Fluted Credenza',
    eyebrow: 'Heritage Storage Joinery • Acoustical Slats',
    title: 'Artisanal Precision Meets Modern Space',
    subtitle: 'Precision-routed fluted hardwood panels with integrated soft-close German runners and brushed gold hardware accents.',
    pieceName: 'Jali Geometric Credenza',
    wood: 'Sheesham & Cast Brass Hardware',
    joinery: 'Concealed German Runners & Fluted Slats',
    productId: 'jod-prod-003'
  },
  {
    id: 'hero-slide-5',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=2000&q=85',
    tabName: 'Basni Cantilever',
    eyebrow: 'Modern Seating • Italian Pull-Up Leather',
    title: 'Ergonomic Poise in Solid Hardwood',
    subtitle: 'Hand-finished solid teak cantilevered architecture paired with burnished full-grain leather, hand-stitched by master saddlers.',
    pieceName: 'Basni Atelier Cantilever Chair',
    wood: 'Royal Jodhpur Teak',
    joinery: 'Dowel & Tenon Cantilevered Frame',
    productId: 'jod-prod-002'
  }
];

const INITIAL_GALLERY = [
  {
    id: 'jod-prod-001',
    name: 'Monolith Dining Table',
    collection: 'Dining',
    wood_type: 'Seasoned Sheesham',
    price_inr: 185000,
    image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jod-prod-002',
    name: 'Basni Atelier Lounge Chair',
    collection: 'Living',
    wood_type: 'Royal Jodhpur Teak',
    price_inr: 89000,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jod-prod-003',
    name: 'Jali Fluted Credenza',
    collection: 'Living',
    wood_type: 'Sheesham & Cast Brass',
    price_inr: 165000,
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jod-prod-005',
    name: 'Lowline Pavilion Coffee Table',
    collection: 'Living',
    wood_type: 'Seasoned Sheesham',
    price_inr: 62000,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jod-prod-004',
    name: 'Heritage Spindle Dining Chairs',
    collection: 'Dining',
    wood_type: 'Royal Teak',
    price_inr: 44000,
    image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jod-prod-006',
    name: 'Atelier Cognac Leather Sofa',
    collection: 'Living',
    wood_type: 'Solid Teak Frame',
    price_inr: 210000,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
  }
];

const TRUST_ITEMS = [
  { icon: Star, title: '4.9 / 5 from 2,300+ homes', desc: 'Verified buyer reviews across Rajasthan, Delhi, Mumbai and Bengaluru.' },
  { icon: ShieldCheck, title: '10-year joint warranty', desc: 'Every mortise, tenon and brass casting covered in writing.' },
  { icon: Truck, title: 'Insured white-glove delivery', desc: 'Crated, tracked and placed in your room by trained joiners.' },
  { icon: Landmark, title: 'GST invoice + EMI', desc: '18% GST billing for claims, plus no-cost EMI on major cards.' }
];

const SHOP_ROOMS = [
  { name: 'Living', count: 'Sofas, chairs, credenzas', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', icon: Sofa },
  { name: 'Dining', count: 'Monoliths, spindle chairs', image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80', icon: UtensilsCrossed },
  { name: 'Bedroom', count: 'Beds, wardrobes, nightstands', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80', icon: BedDouble },
  { name: 'Study', count: 'Desks, bookshelves, task seating', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80', icon: Briefcase },
  { name: 'Decor', count: 'Lamps, consoles, partitions', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80', icon: Lamp },
  { name: 'Bespoke', count: 'CAD-built commercial work', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80', icon: PencilRuler }
];

const CRAFT_STEPS = [
  { icon: TreePine, step: '01', title: 'Kiln seasoning', desc: 'Sheesham and teak dried to 8.4% moisture equilibrium. No warp, no cracks.' },
  { icon: Ruler, step: '02', title: '5-axis milling', desc: 'Homag CNC precision at ±0.18 mm, then hand-planed by master joiners.' },
  { icon: Hammer, step: '03', title: 'Heritage joinery', desc: 'Butterfly tenons, tongue-and-groove and dovetails. No visible fasteners.' },
  { icon: BadgeCheck, step: '04', title: 'Oil finish + QC', desc: 'Raw linseed oil wax, 21-point inspection, silica-crated dispatch.' }
];

const ATELIER_STATS = [
  { value: '74', suffix: ' yrs', label: 'Atelier since 1952, four generations' },
  { value: '12k', suffix: '+', label: 'Solid-timber pieces placed in homes' },
  { value: '8.4', suffix: '%', label: 'Kiln moisture equilibrium target' },
  { value: '0.18', suffix: ' mm', label: 'CNC tolerance on every member' }
];

const TESTIMONIALS = [
  { quote: 'The monolith table anchors our entire living pavilion. The finish has only deepened in a year.', name: 'Vikram Mehta', role: 'Homeowner, Jodhpur', initials: 'VM' },
  { quote: 'VANA read our CAD drawings better than our own vendors. The hotel lobby credenzas arrived flawless.', name: 'Ananya Deshpande', role: 'Principal Architect, Pune', initials: 'AD' },
  { quote: 'White-glove team placed, levelled and polished everything. Worth every rupee for heirloom timber.', name: 'Rohan Khanna', role: 'Homeowner, Gurugram', initials: 'RK' }
];

const FAQS = [
  { q: 'What is the lead time for a made-to-order piece?', a: 'Most pieces ship in 4 to 6 weeks. Bespoke CAD commercial work takes 6 to 10 weeks depending on timber seasoning and finish.' },
  { q: 'Do you offer EMI and GST invoicing?', a: 'Yes. No-cost EMI is available on major credit cards and every order ships with an 18% GST invoice for input-tax claims.' },
  { q: 'How does pan-India delivery work?', a: 'Each piece is acid-paper wrapped, corner-guarded and silica-crated, then sent insured with live tracking. Orders above Rs 1.5 lakh ship free.' },
  { q: 'What does the 10-year warranty cover?', a: 'Every mortise, tenon, dovetail and brass casting. Finish refresh and movement adjustments are covered in year one.' },
  { q: 'Can you build from my CAD drawings?', a: 'Yes. Upload DWG, DXF, STEP, OBJ, PDF or ZIP up to 50 MB on the Custom Trade page and our engineers return a quote.' },
  { q: 'Which timber should I choose?', a: 'Sheesham for bold grain dining monoliths, Royal Jodhpur Teak for outdoor-grade stability and warm honey tones.' }
];

export default function Home({ setPath, onSelectProduct }) {
  const [galleryItems, setGalleryItems] = useState(INITIAL_GALLERY);
  const [openFaq, setOpenFaq] = useState(0);
  const { lastProductUpdate } = useSocket();
  const { addPieceToInquiry } = useInquiry();
  // Phase 2: live reviews wall, newsletter, recently-viewed
  const [liveReviews, setLiveReviews] = useState(TESTIMONIALS);
  const [recentRail, setRecentRail] = useState([]);
  const [nlEmail, setNlEmail] = useState('');
  const [nlStatus, setNlStatus] = useState({ sending: false, done: false, error: '' });

  useEffect(() => {
    fetch('/api/reviews?featured=true')
      .then((r) => r.json())
      .then((j) => {
        if (j.data && j.data.length) {
          setLiveReviews(j.data.slice(0, 3).map((r) => ({
            quote: r.body, name: r.buyer_name, role: `Verified buyer · ${r.buyer_city}`,
            initials: (r.buyer_name || 'V').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
            rating: r.rating
          })));
        }
      })
      .catch(() => {});
    setRecentRail(getRecentlyViewed());
  }, []);

  const subscribeNewsletter = async (e) => {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlStatus({ sending: true, done: false, error: '' });
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nlEmail.trim() })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Subscription failed.');
      setNlStatus({ sending: false, done: true, error: '' });
      setNlEmail('');
    } catch (err) {
      setNlStatus({ sending: false, done: false, error: err.message });
    }
  };

  const trackRef = React.useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const interval = setInterval(() => {
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
      }
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const scrollCarousel = (dir) => {
    if (trackRef.current) {
      const scrollAmount = trackRef.current.clientWidth;
      trackRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
    quoteNumber: null
  });

  const loadFeatured = useCallback(() => {
    fetch('/api/products?sort=newest')
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          const mapped = json.data.slice(0, 6).map((p) => ({
            id: p.id,
            name: (p.name || '').replace('The ', ''),
            collection: p.collection || 'Living',
            wood_type: p.wood_type,
            price_inr: p.price_inr,
            raw: p,
            image: p.images?.[0] || 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80'
          }));
          setGalleryItems(mapped);
        }
      })
      .catch(() => {
        // Keeps high-res fallback
      });
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  useEffect(() => {
    if (lastProductUpdate) loadFeatured();
  }, [lastProductUpdate, loadFeatured]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormStatus({ ...formStatus, error: 'Please enter your name and email.' });
      return;
    }

    setFormStatus({ submitting: true, submitted: false, error: null, quoteNumber: null });

    try {
      const bodyData = new FormData();
      bodyData.append('client_name', formData.name.trim());
      bodyData.append('client_email', formData.email.trim());
      bodyData.append('client_phone', formData.phone.trim() || '9999999999');
      bodyData.append('project_notes', formData.message.trim() || 'General inquiry from VANA website');
      bodyData.append('project_type', 'Residential Interior Inquiry');

      const res = await fetch('/api/quotes', {
        method: 'POST',
        body: bodyData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit message.');
      }

      setFormStatus({
        submitting: false,
        submitted: true,
        error: null,
        quoteNumber: data.quote_number || 'VNA-MSG-1001'
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setFormStatus({
        submitting: false,
        submitted: false,
        error: err.message || 'Error submitting message. Please try again.',
        quoteNumber: null
      });
    }
  };

  const openProduct = (id) => {
    if (onSelectProduct) onSelectProduct(id);
    else setPath(`/product/${id}`);
  };

  const handleAddToInquiry = (item) => {
    const product = item.raw || {
      id: item.id,
      name: item.name,
      sku: item.id,
      wood_type: item.wood_type,
      price_inr: item.price_inr
    };
    addPieceToInquiry(product, product.wood_type || 'Sheesham Natural Oil');
  };

  const deliverySteps = [
    {
      icon: Package,
      title: 'Crated & Protected',
      desc: 'Each piece is wrapped in acid-free paper, corner-guarded, and crated with silica gel.'
    },
    {
      icon: Truck,
      title: 'Insured Pan-India Transit',
      desc: 'Pan-India delivery via dedicated carrier with full transit insurance and real-time tracking.'
    },
    {
      icon: ShieldCheck,
      title: 'White-Glove Placement',
      desc: 'Our logistics team positions the furniture, unboxes it, and performs a complete level check.'
    },
    {
      icon: CheckCircle2,
      title: '10-Year Warranty',
      desc: 'Covers every mortise, tenon, and joint. Engineered to endure for decades.'
    }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <SEO
        title="VANA | Furniture That Inspires Living | Architectural Hardwood"
        description="VANA designs and builds architectural timber furniture. Handcrafted from kiln-seasoned Indian Sheesham and Royal Teak in Jodhpur, Rajasthan."
        keywords="VANA furniture, Vana living, solid timber, sheesham dining table, teak furniture, modern furniture"
        url="https://jodhpur-furniture.com/"
      />

      {/* SECTION 1: HERO (FULL-BLEED CINEMATIC ARCHITECTURAL CAROUSEL) */}
      <section
        id="hero"
        className="hero-cinema"
        role="region"
        aria-label="VANA Architectural Furniture Showcase"
        style={{ position: 'relative' }}
      >
        <button
          onClick={() => scrollCarousel('left')}
          aria-label="Previous showcase slide"
          style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => scrollCarousel('right')}
          aria-label="Next showcase slide"
          style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ChevronRight size={24} />
        </button>

        <div className="hero-cinema-track" ref={trackRef}>
          {HERO_CAROUSEL_SLIDES.map((slide, idx) => (
            <div key={slide.id} className="hero-cinema-slide">
              <div className="hero-cinema-viewport">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="hero-cinema-img"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>

              <div className="hero-cinema-scrim" />

              <div className="hero-cinema-stage">
                <div className="container">
                  <div className="hero-cinema-grid">
                    <div>
                      <span className="hero-cinema-eyebrow">
                        <Sparkles size={13} style={{ color: 'var(--accent-gold)' }} />
                        {slide.eyebrow}
                      </span>
                      <h1 className="hero-cinema-title">{slide.title}</h1>
                      <p className="hero-cinema-subtitle">{slide.subtitle}</p>
                      <div className="hero-cinema-actions">
                        <button
                          onClick={() => openProduct(slide.productId)}
                          className="btn-pill-hero-secondary"
                        >
                          View Staged Piece <ArrowRight size={16} aria-hidden="true" style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                        </button>
                      </div>
                    </div>

                    <div
                      className="hero-spec-card"
                      onClick={() => openProduct(slide.productId)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${slide.pieceName}`}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(slide.productId); } }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="hero-spec-name">{slide.pieceName}</div>
                      <div className="hero-spec-grid">
                        <div>
                          <div className="hero-spec-item-label">Timber Species</div>
                          <div className="hero-spec-item-val">{slide.wood}</div>
                        </div>
                        <div>
                          <div className="hero-spec-item-label">Craft &amp; Joinery</div>
                          <div className="hero-spec-item-val">{slide.joinery}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: TRUST STRIP */}
      <section className="pro-trust" aria-label="Why buyers trust VANA">
        <div className="container pro-trust-grid">
          {TRUST_ITEMS.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={i} className="pro-trust-item">
                <span className="pro-trust-icon"><Icon size={20} /></span>
                <div>
                  <div className="pro-trust-title">{t.title}</div>
                  <div className="pro-trust-desc">{t.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: SHOP BY ROOM */}
      <section className="section-rooms" aria-label="Shop by room">
        <div className="container">
          <div className="pro-section-head">
            <div>
              <h2>Shop by room</h2>
              <p>Six destinations, one timber language. Pick a room to enter the full catalog.</p>
            </div>
            <button className="btn btn-secondary" style={{ borderRadius: '9999px' }} onClick={() => setPath('/catalog')}>
              Full catalog <ArrowRight size={15} />
            </button>
          </div>
          <div className="pro-rooms-grid">
            {SHOP_ROOMS.map((room) => {
              const Icon = room.icon;
              return (
                <button
                  key={room.name}
                  className="pro-room-card"
                  onClick={() => {
                    if (room.name === 'Bespoke') setPath('/custom-trade');
                    else if (['Living', 'Dining', 'Bedroom', 'Study'].includes(room.name)) setPath(`/catalog?collection=${room.name}`);
                    else setPath('/catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  aria-label={`Shop ${room.name}`}
                >
                  <img src={room.image} alt={`${room.name} furniture`} loading="lazy" />
                  <span className="pro-room-scrim" />
                  <span className="pro-room-body">
                    <span className="pro-room-icon"><Icon size={16} /></span>
                    <span className="pro-room-name">{room.name}</span>
                    <span className="pro-room-count">{room.count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: BESTSELLERS */}
      <section className="section-bestsellers" aria-label="Bestselling pieces">
        <div className="container">
          <div className="pro-section-head">
            <div>
              <h2>Bestsellers this season</h2>
              <p>Live from the factory catalog. EMI from 12 months, GST invoice included.</p>
            </div>
            <div className="pro-emi-note"><CreditCard size={15} /> No-cost EMI · <Landmark size={15} /> GST invoice</div>
          </div>
          <div className="pro-best-grid">
            {galleryItems.slice(0, 6).map((item, idx) => (
              <article key={item.id} className="pro-best-card">
                <div className="pro-best-media" onClick={() => openProduct(item.id)} role="button" tabIndex={0} aria-label={`View ${item.name}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(item.id); } }}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <span className={`pro-best-badge ${idx < 2 ? 'hot' : idx < 4 ? 'new' : ''}`}>
                    {idx < 2 ? 'Bestseller' : idx < 4 ? 'New' : item.collection}
                  </span>
                </div>
                <div className="pro-best-body">
                  <div className="pro-best-meta">{item.wood_type}</div>
                  <h3 className="pro-best-name" onClick={() => openProduct(item.id)}>{item.name}</h3>
                  <div className="pro-best-price-row">
                    <span className="pro-best-price">{formatINR(item.price_inr)}</span>
                    <span className="pro-best-emi">{formatINR(Math.round((item.price_inr || 0) / 12))}/mo</span>
                  </div>
                  <div className="pro-best-actions">
                    <button className="btn btn-primary pro-best-add" onClick={() => handleAddToInquiry(item)}>
                      <ShoppingBag size={14} /> Add to inquiry
                    </button>
                    <button className="btn btn-secondary pro-best-view" onClick={() => openProduct(item.id)} aria-label={`Quick view ${item.name}`}>
                      <Eye size={14} /> View
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PHASE 2: RECENTLY VIEWED */}
      {recentRail.length > 0 && (
        <section className="section-rooms" aria-label="Recently viewed pieces" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div className="container">
            <div className="pro-section-head">
              <div>
                <h2>Pick up where you left off</h2>
                <p>Saved on this device, no account needed.</p>
              </div>
            </div>
            <div className="pro-best-grid">
              {recentRail.slice(0, 3).map((p) => (
                <article key={p.id} className="pro-best-card">
                  <div className="pro-best-media" onClick={() => openProduct(p.id)} role="button" tabIndex={0} aria-label={`View ${p.name}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(p.id); } }}>
                    <img src={p.image} alt={p.name} loading="lazy" />
                  </div>
                  <div className="pro-best-body">
                    <div className="pro-best-meta">{p.wood_type}</div>
                    <h3 className="pro-best-name" onClick={() => openProduct(p.id)}>{p.name}</h3>
                    <div className="pro-best-price-row"><span className="pro-best-price">{formatINR(p.price_inr)}</span></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: CRAFT + STATS */}
      <section className="section-craft" aria-label="How VANA builds furniture">
        <div className="container">
          <div className="pro-section-head">
            <div>
              <h2>Built like architecture, finished like furniture</h2>
              <p>Four controlled stages between green timber and your living room.</p>
            </div>
          </div>
          <div className="pro-craft-grid">
            {CRAFT_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="pro-craft-card">
                  <div className="pro-craft-top"><span className="pro-craft-num">{s.step}</span><Icon size={22} /></div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="pro-stats-row">
            {ATELIER_STATS.map((s, i) => (
              <div key={i} className="pro-stat">
                <div className="pro-stat-val">{s.value}<span>{s.suffix}</span></div>
                <div className="pro-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: ABOUT US */}
      <section id="about" className="section-about">
        <div className="container">
          <div className="about-header">
            <span className="section-eyebrow-pill">About Us</span>
          </div>

          <div className="about-grid">
            <div className="about-content">
              <h2>Four generations at one workbench</h2>
              <p>
                We pride ourselves on being a dedicated architectural furniture atelier. From solid kiln-seasoned Sheesham dining monoliths to sculpted Royal Teak lounge chairs, we've got everything from couches to dining tables, bespoke credenzas, and much more.
              </p>
              <p>
                Every timber member is kiln-dried to an exact 8.4% moisture equilibrium, machined on 5-axis CNC routers at &plusmn;0.18mm tolerances, and hand-finished with raw linseed oils by four generations of master Jodhpur woodcrafters.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPath('/about')}
                  className="btn btn-primary"
                  style={{ borderRadius: '9999px', padding: '0.8rem 1.8rem' }}
                >
                  Read Our Story &bull; 1952 <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => setPath('/factory')}
                  className="btn btn-secondary"
                  style={{ borderRadius: '9999px', padding: '0.8rem 1.8rem' }}
                >
                  Tour Atelier &bull; CAD Works
                </button>
              </div>
            </div>

            <div className="about-collage">
              <div className="about-collage-item">
                <img
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
                  alt="Modern armchair and coffee table corner"
                  loading="lazy"
                />
              </div>
              <div className="about-collage-item">
                <img
                  src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80"
                  alt="Sculpted timber lounge chair in calm sage interior"
                  loading="lazy"
                />
              </div>
              <div className="about-collage-item">
                <img
                  src="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80"
                  alt="Minimalist wooden bar stool against clean architectural background"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: TESTIMONIALS */}
      <section className="section-reviews" aria-label="Buyer reviews">
        <div className="container">
          <div className="pro-section-head">
            <div>
              <h2>Loved in 2,300+ homes and studios</h2>
              <p>Unedited snippets from verified buyers and trade architects.</p>
            </div>
            <div className="pro-rating"><Star size={15} /> 4.9 average rating</div>
          </div>
          <div className="pro-reviews-grid">
            {liveReviews.map((t, i) => (
              <figure key={i} className={`pro-review-card${i === 0 ? ' pro-review-featured' : ''}`}>
                {t.rating ? <Stars value={t.rating} /> : <Quote size={22} className="pro-quote-mark" />}
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <span className="pro-avatar">{t.initials}</span>
                  <span>
                    <span className="pro-reviewer">{t.name}</span>
                    <span className="pro-role">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button className="btn btn-secondary" style={{ borderRadius: '9999px' }} onClick={() => setPath('/catalog')}>
              Review any piece from its product page <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 8: TRADE CTA */}
      <section className="section-trade-cta" aria-label="Trade and bespoke manufacturing">
        <div className="container pro-trade-card">
          <div>
            <h2>Architects: send drawings, get a factory quote</h2>
            <p>DWG, DXF, STEP, OBJ, PDF or ZIP up to 50 MB. Engineering review within 48 hours, GST billing, pan-India install.</p>
            <div className="pro-trade-badges">
              <span>50 MB uploads</span><span>48-hr review</span><span>Bulk pricing</span>
            </div>
          </div>
          <div className="pro-trade-actions">
            <button className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.9rem 2rem' }} onClick={() => setPath('/custom-trade')}>
              Get trade quote <ArrowRight size={15} />
            </button>
            <button className="btn btn-secondary" style={{ borderRadius: '9999px', padding: '0.9rem 2rem' }} onClick={() => setPath('/factory')}>
              <Headphones size={15} /> Talk to engineers
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 9: CONTACT */}
      <section id="contact" className="section-contact">
        <div className="container">
          <div className="contact-header">
            <span className="section-eyebrow-pill">Contact Us</span>
          </div>

          <div className="contact-grid">
            <div className="contact-form-col">
              <h2>Tell us about your room</h2>

              {formStatus.submitted ? (
                <div style={{
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid var(--success)',
                  borderRadius: '16px',
                  padding: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--success)' }}>
                    <CheckCircle2 size={24} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Message Received</h3>
                  </div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    Thank you for contacting VANA. Reference commission ID: <strong>{formStatus.quoteNumber}</strong>. Our atelier design director will review your inquiry and connect with you within 24 hours.
                  </p>
                  <button
                    onClick={() => setFormStatus({ submitting: false, submitted: false, error: null, quoteNumber: null })}
                    className="btn btn-secondary"
                    style={{ borderRadius: '9999px', fontSize: '0.8rem', padding: '0.5rem 1.2rem' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="contact-form">
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

                  <div className="contact-input-field">
                    <label className="contact-input-label" htmlFor="contact-name">Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      className="contact-input"
                      placeholder="e.g. Vikram Mehta"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="contact-input-field">
                    <label className="contact-input-label" htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      className="contact-input"
                      placeholder="e.g. vikram@atelier.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="contact-input-field">
                    <label className="contact-input-label" htmlFor="contact-phone">Phone</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      className="contact-input"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="contact-input-field">
                    <label className="contact-input-label" htmlFor="contact-message">Message</label>
                    <textarea
                      id="contact-message"
                      className="contact-textarea"
                      placeholder="Tell us about your room, piece specifications, or trade project..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-pill-dark"
                    disabled={formStatus.submitting}
                  >
                    {formStatus.submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Submitting…
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="contact-image-card">
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80"
                alt="VANA architectural interior with emerald wall and fluted timber credenza"
                loading="lazy"
              />
              <div className="contact-image-card-badge">
                <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', marginBottom: '0.3rem' }}>
                  Atelier &bull; Design Studio
                </p>
                <h4 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 0.4rem 0' }}>
                  VANA Woodcraft &amp; CAD Works
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', color: '#c4ccd8', marginBottom: '0.75rem' }}>
                  <span>Basni Phase II, Industrial Area, Jodhpur, Rajasthan 342005</span>
                  <span>Direct: +91 (0291) 274-1952 &bull; contact@vana-furniture.com</span>
                </div>
                <button
                  onClick={() => {
                    setPath('/contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent-gold)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  Schedule Workshop Tour &bull; FAQ &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: QUALITY & DELIVERY STANDARDS */}
      <section style={{ padding: '5.5rem 0', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ maxWidth: '580px', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 400, marginBottom: '0.8rem' }}>
              Built for Generations
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.96rem' }}>
              Every order leaves our Jodhpur facility crated in structural plywood, tracked end-to-end, and installed by trained joiners.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }} className="delivery-grid">
            {deliverySteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} style={{ borderTop: '2px solid var(--border-medium)', paddingTop: '1.5rem' }}>
                  <Icon size={24} style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 11: FAQ */}
      <section className="section-faq" aria-label="Frequently asked questions">
        <div className="container pro-faq-wrap">
          <div className="pro-section-head">
            <div>
              <h2>Questions, answered</h2>
              <p>Delivery, EMI, warranty and custom work in plain language.</p>
            </div>
          </div>
          <div className="pro-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`pro-faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="pro-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  <span>{f.q}</span><ChevronDown size={18} />
                </button>
                {openFaq === i && <div className="pro-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 12: NEWSLETTER */}
      <section className="section-trade-cta" aria-label="Atelier newsletter" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container pro-trade-card">
          <div>
            <h2>Seasonal drops, timber stories, trade previews</h2>
            <p>One email a month from the Basni floor. No spam, unsubscribe anytime.</p>
            {nlStatus.done && <div className="review-ok">Subscribed. Welcome to the atelier list.</div>}
            {nlStatus.error && <div className="review-error">{nlStatus.error}</div>}
          </div>
          <form onSubmit={subscribeNewsletter} className="track-form" style={{ margin: 0 }}>
            <input
              type="email"
              value={nlEmail}
              onChange={(e) => setNlEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email for newsletter"
              className="contact-input"
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={nlStatus.sending} style={{ borderRadius: '9999px' }}>
              {nlStatus.sending ? 'Joining…' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
