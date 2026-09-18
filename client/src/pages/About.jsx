import React, { useEffect, useRef } from 'react';
import SEO from '../components/SEO';
import { ArrowRight, MapPin } from 'lucide-react';

// Custom hook for scroll-driven reveal animation
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

const CRAFTSMEN = [
  {
    name: 'Ramesh Chand',
    role: 'Head Seasoner & Timber Evaluator',
    exp: '34 Years in Basni',
    bio: 'He checks moisture by sound and touch. He oversees log selection and all three kiln schedules.',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Makkhan Lal',
    role: 'Master Joiner & Drawbore Specialist',
    exp: '3rd Generation Joiner',
    bio: 'He learned mortise and tenon from his father. He cuts and drawbores each structural joint by hand.',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Suresh Jangid',
    role: 'Lead CNC & CAD Toolpath Engineer',
    exp: '14 Years in Digital Joinery',
    bio: 'He turns architect drawings and STEP files into 5-axis toolpaths held to ±0.18 mm.',
    image: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Kavita Rathore',
    role: 'Design Director & Material Curator',
    exp: 'Architectural Interiors',
    bio: 'She leads custom trade work, leather selection, and oil finish mixes.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80'
  }
];

function RevealSection({ children, className = '' }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`reveal-on-scroll ${className}`}>
      {children}
    </div>
  );
}

export default function About({ setPath }) {
  return (
    <div className="about-page">
      <SEO
        title="About the Atelier | VANA Architectural Woodcraft"
        description="Four generations of master joinery in Basni, Jodhpur. Discover VANA's timber seasoning science, 5-axis CNC precision, and master craftsmen."
        keywords="About VANA, Jodhpur woodworking history, solid timber atelier, sheesham furniture craft, architectural joinery India"
        url="https://jodhpur-furniture.com/about"
      />

      <style>{`
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-on-scroll.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        .about-page {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
      `}</style>

      {/* Hero Section */}
      <section className="about-page-hero" style={{ padding: '6rem 0' }}>
        <div className="container">
          <RevealSection className="about-hero-grid">
            <div>
              <span className="section-eyebrow-pill">Atelier Lineage &bull; Est. 1952</span>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                margin: '0.8rem 0 1.5rem 0'
              }}>
                Rooted in heritage.<br />
                Built with precision.
              </h1>
              <p style={{ fontSize: '1.08rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                My grandfather began this atelier in 1952 out of a stone workshop behind the old haveli in Basni. No CAD files, no CNC routers — just hand planes, forged chisels, and Indian Sheesham that had seasoned under the Marwar sun for two years.
              </p>
              <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                Today, our fourth generation pairs those joinery principles with vacuum kilns and 5-axis CNC work. We do not build disposable furniture. We build pieces to last.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setPath('/catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-primary"
                  style={{ borderRadius: '9999px', padding: '0.9rem 2.2rem' }}
                >
                  Explore Collection <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <div className="about-hero-visual">
              <img
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80"
                alt="Stack of seasoned Sheesham hardwood planks in Basni timber yard"
                style={{ borderRadius: '12px', width: '100%', height: 'auto' }}
              />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* The Craftsmen Section */}
      <section style={{ padding: '6.5rem 0', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <RevealSection>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3.5rem' }}>
              <div>
                <span className="section-eyebrow-pill">The Hands</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, margin: '0.8rem 0 0' }}>
                  Master craftsmen of Basni
                </h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                Machines cut to tolerance, but hands do the finish. Every piece is finished by hand and checked by our joiners.
              </p>
            </div>
          </RevealSection>

          <div className="about-team-grid">
            {CRAFTSMEN.map((c, idx) => (
              <RevealSection key={idx}>
                <div className="about-team-card" style={{ background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={c.image} alt={c.name} loading="lazy" style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
                  <div className="about-team-info" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 500, margin: '0 0 0.2rem 0' }}>
                      {c.name}
                    </h3>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                      {c.role}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {c.exp}
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      {c.bio}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Visit CTA */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <RevealSection>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '20px',
              padding: '4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2.5rem'
            }}>
              <div style={{ maxWidth: '620px' }}>
                <span className="section-eyebrow-pill">Come Visit</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 400, margin: '0.6rem 0 1rem 0' }}>
                  Visit the workshop in Jodhpur
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: '0.98rem', marginBottom: '1.5rem' }}>
                  See seasoned sheesham planed by hand, watch the Homag spindle at work, and walk the Basni Phase II floor with our team. We welcome client and trade visits.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                  <MapPin size={16} />
                  <span>Basni Industrial Area Phase II, Jodhpur, Rajasthan 342005</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setPath('/contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-primary"
                  style={{ borderRadius: '9999px', padding: '0.95rem 2.2rem' }}
                >
                  Schedule Atelier Walkthrough <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
}
