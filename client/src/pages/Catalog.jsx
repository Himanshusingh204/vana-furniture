import React, { useState, useMemo } from 'react';
import { formatINR } from '../utils/formatters';
import SEO from '../components/SEO';
import { useProducts } from '../hooks/useProducts';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';

const CATEGORIES = ['All', 'Living', 'Dining', 'Study', 'Bedroom'];

const PRICE_BANDS = [
  { id: 'all', label: 'Any price', test: () => true },
  { id: 'under75', label: 'Under ₹75k', test: (p) => (p.price_inr || 0) < 75000 },
  { id: 'mid', label: '₹75k – ₹1.5L', test: (p) => (p.price_inr || 0) >= 75000 && (p.price_inr || 0) <= 150000 },
  { id: 'above150', label: 'Above ₹1.5L', test: (p) => (p.price_inr || 0) > 150000 }
];

export default function Catalog({ onSelectProduct, setPath }) {
  const [activeCategory, setActiveCategory] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search || '');
      const c = q.get('collection');
      return c && CATEGORIES.map((x) => x.toLowerCase()).includes(c.toLowerCase()) ? CATEGORIES.find((x) => x.toLowerCase() === c.toLowerCase()) : 'All';
    } catch (e) {
      return 'All';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price-asc' | 'price-desc'
  // Phase 2 facets
  const [activeWood, setActiveWood] = useState('All');
  const [priceBand, setPriceBand] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Shared data layer: server-filtered list with loading/error/retry +
  // live refetch on admin product events (see useProducts).
  const serverParams = useMemo(() => {
    const p = {};
    if (activeCategory !== 'All') p.collection = activeCategory;
    if (sortBy === 'newest') p.sort = 'newest';
    return p;
  }, [activeCategory, sortBy]);
  const { products, loading, error, retry } = useProducts(serverParams);

  // Phase 2: derived timber facet options from live catalog
  const woodOptions = useMemo(() => {
    const set = new Set();
    products.forEach((p) => { if (p.wood_type) set.add(p.wood_type); });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filter products by search query, facets and sort
  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.wood_type?.toLowerCase().includes(q) ||
        p.collection?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }

    if (activeWood !== 'All') {
      list = list.filter((p) => p.wood_type === activeWood);
    }

    const band = PRICE_BANDS.find((b) => b.id === priceBand) || PRICE_BANDS[0];
    list = list.filter(band.test);

    if (inStockOnly) {
      // Show purchasable pieces: anything in stock plus Made-to-Order
      // (server uses 'Made-to-Order' / 'Made to Order' variants).
      list = list.filter((p) => {
        const s = (p.stock_status || '').toLowerCase();
        return s.includes('stock') || s.includes('made-to-order') || s.includes('made to order');
      });
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price_inr - b.price_inr);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price_inr - a.price_inr);
    }

    return list;
  }, [products, searchQuery, sortBy, activeWood, priceBand, inStockOnly]);

  return (
    <div style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <SEO
        title="Selected Pieces | VANA Architectural Woodcraft"
        description="A curated catalog of handcrafted architectural hardwood furniture from our Jodhpur atelier."
        keywords="VANA furniture catalog, Sheesham dining tables, teak lounge chairs, Jodhpur furniture"
        url="https://jodhpur-furniture.com/catalog"
      />

      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '3.5rem' }}>
          <span className="section-eyebrow-pill">Catalogue 2026</span>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            margin: '0.6rem 0 1rem 0'
          }}>
            Selected Pieces
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '540px',
            lineHeight: 1.65
          }}>
            Solid kiln-seasoned hardwoods hand-planed in Jodhpur. Precision joinery engineered for architectural residences and luxury hospitality.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '3rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`gallery-filter-pill ${activeCategory === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search timber, piece…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  fontSize: '0.84rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.84rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Newest Additions</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            {/* Price Band */}
            <select
              value={priceBand}
              onChange={(e) => setPriceBand(e.target.value)}
              aria-label="Filter by price band"
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.84rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {PRICE_BANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>

            {/* In-stock toggle */}
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              aria-pressed={inStockOnly}
              className={`gallery-filter-pill ${inStockOnly ? 'active' : ''}`}
            >
              In stock
            </button>
          </div>
        </div>

        {/* Timber Facet Row */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Timber · {displayedProducts.length} of {products.length}
          </span>
          {woodOptions.map((w) => (
            <button
              key={w}
              onClick={() => setActiveWood(w)}
              className={`gallery-filter-pill ${activeWood === w ? 'active' : ''}`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '8rem 0',
            color: 'var(--text-muted)',
            fontStyle: 'italic'
          }}>
            Loading collection…
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '8rem 0',
            color: 'var(--text-muted)'
          }} role="alert">
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '1rem' }}>Couldn&apos;t load the collection · {error}</p>
            <button
              onClick={retry}
              className="btn btn-secondary"
              style={{ borderRadius: '9999px', padding: '0.6rem 1.6rem', fontSize: '0.82rem' }}
            >
              Retry
            </button>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '8rem 0',
            color: 'var(--text-muted)'
          }}>
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '1rem' }}>No pieces match your filter.</p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
                setActiveWood('All');
                setPriceBand('all');
                setInStockOnly(false);
              }}
              className="btn btn-secondary"
              style={{ borderRadius: '9999px', padding: '0.6rem 1.6rem', fontSize: '0.82rem' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="catalog-grid">
            {displayedProducts.map((p) => (
              <article
                key={p.id}
                className="catalog-card card-hover-lift"
                onClick={() => onSelectProduct(p.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectProduct(p.id); }}
                aria-label={`View details for ${p.name}`}
              >
                <div className="catalog-card__image-box">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80'}
                    alt={p.name}
                    loading="lazy"
                  />
                  <div className="catalog-card__badge">
                    <span>{p.collection}</span>
                  </div>
                  <div className="catalog-card__overlay">
                    <span>View Specifications &amp; CAD</span>
                  </div>
                </div>
                <div className="catalog-card__details">
                  <div className="catalog-card__meta">
                    <span className="catalog-card__wood">{p.wood_type}</span>
                    {p.cad_available && <span className="catalog-card__cad">CAD Ready</span>}
                  </div>
                  <h2 className="catalog-card__title">{p.name}</h2>
                  <div className="catalog-card__footer">
                    <span className="catalog-card__price">{formatINR(p.price_inr)}</span>
                    <span className="catalog-card__lead">{p.lead_time_weeks}w lead</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Trade Banner */}
        <div style={{
          marginTop: '6rem',
          padding: '3rem',
          borderRadius: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div>
            <span className="section-eyebrow-pill">Custom Dimensions</span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 400, margin: '0.5rem 0 0.8rem 0' }}>
              Require non-standard dimensions or timber species?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '560px', lineHeight: 1.7 }}>
              Our 5-axis CNC programming accommodates custom length, width, and timber species selections for private and hospitality trade orders.
            </p>
          </div>
          <button
            onClick={() => {
              if (setPath) setPath('/custom-trade');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn btn-primary"
            style={{ borderRadius: '9999px', padding: '0.85rem 2rem' }}
          >
            Open Trade CAD Portal <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
