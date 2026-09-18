import React, { useState, useEffect, useCallback } from 'react';
import SEO from '../components/SEO';
import ThreeViewer from '../components/ThreeViewer';
import Reviews from '../components/Reviews';
import EmiCalculator from '../components/EmiCalculator';
import { useInquiry } from '../context/InquiryContext';
import { useSocket } from '../context/SocketContext';
import { formatINR, formatDimensionsMm } from '../utils/formatters';
import { getClientKey, recordRecentlyViewed, getRecentlyViewed } from '../utils/shop';
import { apiGet, apiPost } from '../lib/api';
import {
  Download,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Plus,
  Minus,
  FileText,
  MessageSquare,
  Camera,
  Box,
  Heart,
  Zap,
  Loader2
} from 'lucide-react';

export default function ProductDetail({ productId, onBack, onNavigate }) {
  const { addPieceToInquiry, addMany } = useInquiry();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinish, setSelectedFinish] = useState('sheesham_natural');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'cad' | 'joinery'
  const [viewMode, setViewMode] = useState('photo'); // 'photo' | '3d'
  const { lastProductUpdate } = useSocket();
  // Phase 2: wishlist, test checkout, recently-viewed
  const [wishlisted, setWishlisted] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [checkout, setCheckout] = useState({ name: '', email: '', phone: '', sending: false, error: '', order: null });

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiGet(`/api/products/${productId}`);
      if (json.data) {
        setProduct(json.data);
        if (json.data.three_config?.default_finish) {
          setSelectedFinish(json.data.three_config.default_finish);
        }
      } else {
        setProduct(null);
      }
    } catch (err) {
      // apiGet throws ApiError on 404; treat as not-found, log the rest.
      if (err && (err.status === 404 || /not found/i.test(err.message || ''))) {
        setProduct(null);
      } else {
        console.error('Failed to load product details', err);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
    setActiveImageIndex(0);
    setWishlisted(false);
    setCheckout({ name: '', email: '', phone: '', sending: false, error: '', order: null });
  }, [loadProduct]);

  // Phase 2: record view + hydrate wishlist + recently-viewed rail
  useEffect(() => {
    if (!product) return;
    recordRecentlyViewed(product);
    setRecentlyViewed(getRecentlyViewed(product.id));
    apiGet(`/api/wishlist?client_key=${encodeURIComponent(getClientKey())}`)
      .then((j) => setWishlisted((j.data || []).some((w) => w.product_id === product.id)))
      .catch(() => {});
  }, [product]);

  const toggleWishlist = async () => {
    if (!product) return;
    try {
      const j = await apiPost('/api/wishlist/toggle', {
        client_key: getClientKey(),
        product_id: product.id
      });
      setWishlisted(!!j.added);
    } catch (e) {
      // wishlist is best-effort; inquiry drawer remains the primary funnel
    }
  };

  const testCheckout = async (e) => {
    e.preventDefault();
    if (!product) return;
    if (!checkout.name.trim() || !checkout.email.trim() || !checkout.phone.trim()) {
      setCheckout({ ...checkout, error: 'Name, email and phone are required for a test order.' });
      return;
    }
    setCheckout({ ...checkout, sending: true, error: '' });
    try {
      const j = await apiPost('/api/orders', {
        customer_name: checkout.name.trim(),
        customer_email: checkout.email.trim(),
        customer_phone: checkout.phone.trim(),
        items: [{ product_id: product.id, quantity }],
        payment_structure: '50% Production Deposit'
      });
      const order = j.order || j.data;
      if (!order) throw new Error(j.error || 'Test order failed.');
      setCheckout({ name: '', email: '', phone: '', sending: false, error: '', order });
    } catch (err) {
      setCheckout({ ...checkout, sending: false, error: err.message });
    }
  };

  // Live refresh when the open product is edited; existing not-found on 404.
  useEffect(() => {
    if (!lastProductUpdate) return;
    if (lastProductUpdate.id === undefined || String(lastProductUpdate.id) === String(productId)) {
      loadProduct();
    }
  }, [lastProductUpdate, productId, loadProduct]);

  if (loading) {
    return (
      <div className="section" style={{ textAlign: 'center', padding: '8rem 0' }}>
        <div className="pulse-live" style={{ width: '20px', height: '20px', marginBottom: '1rem' }} />
        <p>Loading piece specifications and architectural gallery…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="section container" style={{ textAlign: 'center' }}>
        <h2>Product Specification Not Found</h2>
        <button onClick={onBack} className="btn btn-outline" style={{ marginTop: '1.5rem' }}>
          <ArrowLeft size={16} /> Return to Collections
        </button>
      </div>
    );
  }

  const finishes = [
    { id: 'sheesham_natural', label: 'Seasoned Sheesham (Natural Oil)', hex: '#4a2c1d' },
    { id: 'teak_honey', label: 'Royal Jodhpur Teak (Honey Satin)', hex: '#7a4e28' },
    { id: 'ebonized_ash', label: 'Ebonized Dark Ash', hex: '#1a1a1c' },
    { id: 'acacia_warm', label: 'Reclaimed Acacia (Umber Wax)', hex: '#5e3d24' }
  ];

  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80'];

  const activeImage = imagesList[activeImageIndex] || imagesList[0];

  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: activeImage,
    description: product.description,
    sku: product.sku,
    material: product.wood_type,
    brand: {
      '@type': 'Brand',
      name: 'VANA'
    },
    offers: {
      '@type': 'Offer',
      price: product.price_inr,
      priceCurrency: 'INR',
      availability: product.stock_status === 'In Stock' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: {
        '@type': 'Organization',
        name: 'VANA Architectural Woodcraft'
      }
    }
  } : null;

  return (
    <div className="section" style={{ paddingTop: '2rem' }}>
      {product && (
        <SEO
          title={`${product.name} (${product.wood_type}) - Handcrafted Solid Timber & Factory Commission`}
          description={product.description}
          image={activeImage}
          url={`https://jodhpur-furniture.com/product/${product.id}`}
          type="product"
          schema={productSchema}
        />
      )}
      <div className="container">
        {/* Navigation Breadcrumb Trail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('/')} className="btn-ghost" style={{ padding: 0 }}>
            Home
          </button>
          <span>/</span>
          <button onClick={onBack} className="btn-ghost" style={{ padding: 0 }}>
            Catalog
          </button>
          <span>/</span>
          <span style={{ color: 'var(--accent-gold)' }}>{product.collection}</span>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{product.name}</span>
        </div>

        {/* Master Two-Column PDP Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '3.5rem',
            alignItems: 'start'
          }}
          className="pdp-grid"
        >
          {/* Left Column: High-Resolution Craft Photography & Multi-Angle Gallery / 3D CAD */}
          <div>
            {/* View Mode Toggle: Photography vs Interactive 3D CAD */}
            <div className="pdp-view-toggle">
              <button
                type="button"
                onClick={() => setViewMode('photo')}
                className={`pdp-view-toggle-btn ${viewMode === 'photo' ? 'active' : ''}`}
                aria-label="Show high-res photography gallery"
              >
                <Camera size={14} /> High-Res Photography
              </button>
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`pdp-view-toggle-btn ${viewMode === '3d' ? 'active' : ''}`}
                aria-label="Show interactive 3D CAD model"
              >
                <Box size={14} /> Interactive 3D CAD
              </button>
            </div>

            {viewMode === '3d' ? (
              <div
                style={{
                  height: '560px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  position: 'relative'
                }}
              >
                <ThreeViewer
                  modelType={product.three_config?.model_type || 'dining_table'}
                  currentFinish={selectedFinish}
                  height="560px"
                />
              </div>
            ) : (
              <>
                {/* Main Photography Viewport */}
                <div
                  style={{
                    height: '560px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={activeImage}
                    alt={`${product.name} - View ${activeImageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.5s ease'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(14, 14, 16, 0.75)',
                      backdropFilter: 'blur(8px)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <Camera size={13} />
                    <span>{activeImageIndex + 1} / {imagesList.length} Views</span>
                  </div>
                </div>

                {/* Thumbnail Selector Strip */}
                {imagesList.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    {imagesList.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        style={{
                          flex: '0 0 84px',
                          height: '64px',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          border: activeImageIndex === idx ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                          padding: 0,
                          background: 'none',
                          cursor: 'pointer',
                          opacity: activeImageIndex === idx ? 1 : 0.65,
                          transition: 'all 0.2s ease'
                        }}
                        aria-label={`View photo ${idx + 1}`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Unsplash Copyright & Licensing Caption */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Architectural joinery photography via Unsplash</span>
                  <a href="https://unsplash.com/license" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--accent-gold)' }}>
                    Unsplash License
                  </a>
                </div>
              </>
            )}

            {/* Finish Selector Buttons */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                Select Solid Hardwood Finish:
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                {finishes.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFinish(f.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedFinish === f.id ? 'var(--accent-gold-subtle)' : 'transparent',
                      border: `1px solid ${selectedFinish === f.id ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                      color: selectedFinish === f.id ? 'var(--accent-gold)' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 500
                    }}
                  >
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: f.hex, display: 'inline-block' }} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Spec & Commissioning */}
          <div>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span className="badge badge-gold">{product.sku}</span>
              <span className="badge badge-wood">{product.wood_type}</span>
            </div>

            <h1 style={{ fontSize: '2.4rem', marginBottom: '0.8rem' }}>{product.name}</h1>

            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
              {formatINR(product.price_inr)}
              <span style={{ fontSize: '0.85rem', fontWeight: 400, fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', marginLeft: '0.6rem' }}>
                (Includes 18% GST &bull; Direct Factory Price)
              </span>
            </div>

            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {product.description}
            </p>

            {/* Quantity and Commissioning Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                padding: '1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '2rem'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.75rem' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn-ghost" style={{ padding: 0 }}>
                    <Minus size={15} />
                  </button>
                  <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="btn-ghost" style={{ padding: 0 }}>
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const finishLabel = finishes.find(f => f.id === selectedFinish)?.label || product.finish;
                    if (typeof addMany === 'function') {
                      addMany(product, finishLabel, quantity);
                    } else {
                      addPieceToInquiry(product, finishLabel, '', quantity);
                    }
                  }}
                  className="btn btn-primary"
                  style={{ flexGrow: 1, padding: '0.85rem 1.25rem' }}
                >
                  <FileText size={15} /> Inquire for Commission ({formatINR(product.price_inr * quantity)})
                </button>
              </div>

              <a
                href={`https://wa.me/919829014820?text=${encodeURIComponent(`Hello VANA, I am interested in commissioning "${product.name}" (SKU: ${product.sku}) in ${finishes.find(f => f.id === selectedFinish)?.label || 'Natural Oil'}. Please share lead times and custom dimension options.`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', borderColor: '#25D366', color: '#25D366' }}
              >
                <MessageSquare size={15} /> Direct Factory WhatsApp (+91 98290 14820)
              </a>
            </div>

            {/* Quick Guarantees */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="var(--accent-gold)" />
                <span>10-Year Structural Timber Warranty</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={16} color="var(--accent-gold)" />
                <span>White-Glove Delivery Across India</span>
              </div>
            </div>

            {/* Tabbed Specification Sheets */}
            <div>
              <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setActiveTab('specs')}
                  style={{
                    paddingBottom: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: activeTab === 'specs' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    borderBottom: `2px solid ${activeTab === 'specs' ? 'var(--accent-gold)' : 'transparent'}`
                  }}
                >
                  Architectural Specs
                </button>
                <button
                  onClick={() => setActiveTab('cad')}
                  style={{
                    paddingBottom: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: activeTab === 'cad' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    borderBottom: `2px solid ${activeTab === 'cad' ? 'var(--accent-gold)' : 'transparent'}`
                  }}
                >
                  Download CAD Models
                </button>
                <button
                  onClick={() => setActiveTab('joinery')}
                  style={{
                    paddingBottom: '0.6rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: activeTab === 'joinery' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    borderBottom: `2px solid ${activeTab === 'joinery' ? 'var(--accent-gold)' : 'transparent'}`
                  }}
                >
                  Joinery & Craft
                </button>
              </div>

              {/* Tab 1: Specs */}
              {activeTab === 'specs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Dimensions (L × W × H)</span>
                    <span style={{ fontWeight: 500 }}>{product.dimensions_display || formatDimensionsMm(product.dimensions_mm)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Hardwood Species</span>
                    <span style={{ fontWeight: 500 }}>{product.wood_type} (Responsibly Sourced)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Moisture Content</span>
                    <span style={{ fontWeight: 500 }}>8.4% Kiln Stabilized</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Net Weight</span>
                    <span style={{ fontWeight: 500 }}>{product.weight_kg} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Manufacturing Lead Time</span>
                    <span style={{ fontWeight: 500 }}>{product.lead_time_weeks} Weeks (Basni Atelier)</span>
                  </div>
                </div>
              )}

              {/* Tab 2: CAD Assets Download */}
              {activeTab === 'cad' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Official architectural packages calibrated for Revit, AutoCAD, SolidWorks, and Rhino 3D:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <a
                      href={product.cad_files?.dwg_url || '/cad/sample-marwar-monolith.dwg'}
                      download
                      className="btn btn-secondary"
                      style={{ justifyContent: 'space-between', padding: '0.8rem 1.25rem' }}
                    >
                      <span>AutoCAD 2D/3D Drawing (.DWG)</span>
                      <Download size={16} />
                    </a>
                    <a
                      href={product.cad_files?.dxf_url || '/cad/sample-marwar-monolith.dxf'}
                      download
                      className="btn btn-secondary"
                      style={{ justifyContent: 'space-between', padding: '0.8rem 1.25rem' }}
                    >
                      <span>CNC Vector Profile (.DXF)</span>
                      <Download size={16} />
                    </a>
                    <a
                      href={product.cad_files?.step_url || '/cad/sample-marwar-monolith.step'}
                      download
                      className="btn btn-secondary"
                      style={{ justifyContent: 'space-between', padding: '0.8rem 1.25rem' }}
                    >
                      <span>STEP Parametric Solid Assembly (.STEP)</span>
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              )}

              {/* Tab 3: Joinery & Craft */}
              {activeTab === 'joinery' && (
                <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  <p style={{ marginBottom: '1rem' }}>
                    {product.joinery_details}
                  </p>
                  <p>
                    Every joint is cut with digital Homag CNC diamond cutters, followed by hand adjustment with Japanese dozuki saws and Indian wood chisels. Finished with five coats of cold-pressed organic linseed oil and triple-filtered beeswax.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phase 2: finance + wishlist + test checkout */}
        <div className="pdp-phase2-grid">
          <EmiCalculator priceInr={product.price_inr * quantity} />
          <div className="analytics-pro-card">
            <h3><Heart size={15} style={{ display: 'inline', marginRight: '6px' }} />Save &amp; buy</h3>
            <div className="analytics-pro-sub">Wishlist syncs to the factory server. Test checkout creates a real trackable order.</div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button onClick={toggleWishlist} className={`btn ${wishlisted ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '9999px' }} aria-pressed={wishlisted}>
                <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} /> {wishlisted ? 'Wishlisted' : 'Add to wishlist'}
              </button>
            </div>
            {checkout.order ? (
              <div className="review-ok">
                Test order <strong>{checkout.order.order_number}</strong> created.
                <button className="btn btn-secondary" style={{ borderRadius: '9999px', marginLeft: '0.6rem', padding: '0.4rem 1rem', fontSize: '0.75rem' }} onClick={() => onNavigate(`/track/${checkout.order.order_number}`)}>
                  Track it <Zap size={13} />
                </button>
              </div>
            ) : (
              <form onSubmit={testCheckout} className="review-form" style={{ marginTop: 0 }}>
                {checkout.error && <div className="review-error">{checkout.error}</div>}
                <div className="review-row">
                  <label>Name*<input value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} placeholder="Test Buyer" /></label>
                  <label>Email*<input type="email" value={checkout.email} onChange={(e) => setCheckout({ ...checkout, email: e.target.value })} placeholder="you@example.com" /></label>
                  <label>Phone*<input value={checkout.phone} onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })} placeholder="+91 98765 43210" /></label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={checkout.sending} style={{ borderRadius: '9999px' }}>
                  {checkout.sending ? <><Loader2 size={14} className="animate-spin" /> Placing…</> : <><Zap size={14} /> Test checkout · 50% deposit</>}
                </button>
                <div className="analytics-pro-sub" style={{ margin: '0.5rem 0 0' }}>Test mode. Pay the balance on the tracking page. Need custom sizes? Send the drawing as an inquiry instead. <button type="button" onClick={() => onNavigate('/custom-trade')} className="btn-ghost" style={{ padding: 0, textDecoration: 'underline', color: 'var(--accent-gold)', fontSize: 'inherit' }}>Open trade portal</button></div>
              </form>
            )}
          </div>
        </div>

        {/* Phase 2: live reviews for this piece */}
        <div style={{ marginTop: '3rem' }}>
          <Reviews productId={product.id} title={`Reviews · ${product.name}`} />
        </div>

        {/* Phase 2: recently viewed */}
        {recentlyViewed.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h3 className="reviews-title">Recently viewed</h3>
            <div className="pro-best-grid">
              {recentlyViewed.slice(0, 3).map((p) => (
                <article key={p.id} className="pro-best-card">
                  <div className="pro-best-media" onClick={() => onNavigate(`/product/${p.id}`)} role="button" tabIndex={0} aria-label={`View ${p.name}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(`/product/${p.id}`); } }}>
                    <img src={p.image} alt={p.name} loading="lazy" />
                  </div>
                  <div className="pro-best-body">
                    <div className="pro-best-meta">{p.wood_type}</div>
                    <h3 className="pro-best-name" onClick={() => onNavigate(`/product/${p.id}`)}>{p.name}</h3>
                    <div className="pro-best-price-row"><span className="pro-best-price">{formatINR(p.price_inr)}</span></div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
