import { useEffect } from 'react';

/**
 * Dynamic SEO Component for Google Search Engine Proofing & Social Graph
 * Dynamically injects title, description, OpenGraph, Canonical, and Schema.org JSON-LD
 */
export default function SEO({
  title = 'VANA | Architectural Hardwood & Bespoke CAD Atelier',
  description = 'Handcrafted architectural furniture engineered from 2D/3D CAD models to kiln-seasoned Sheesham and Royal Teak in Basni Phase II, Jodhpur, Rajasthan. 5-axis CNC joinery and direct factory commissions.',
  keywords = 'VANA furniture, Vana living, bespoke CAD furniture India, solid Sheesham dining table, royal teak credenza, 5 axis CNC joinery, Basni industrial area, architect trade furniture, Jodhpur woodworking factory',
  image = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  url = 'https://jodhpur-furniture.com/',
  type = 'website',
  schema = null
}) {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = title.includes('VANA') ? title : `${title} | VANA`;
    document.title = fullTitle;

    // Helper to create or update meta tags
    const setMetaTag = (attrName, attrVal, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Search Meta
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    setMetaTag('name', 'author', 'VANA Architectural Woodcraft - Basni Atelier');

    // 3. Open Graph (Facebook, WhatsApp, LinkedIn)
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:url', url || window.location.href);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'VANA');

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    // 5. Canonical Link Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url || window.location.href);

    // 6. Dynamic Schema.org JSON-LD Structured Data
    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'FurnitureStore',
      name: 'VANA - Architectural Woodcraft',
      image: image,
      description: description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Plot 42-B, Basni Industrial Area Phase II',
        addressLocality: 'Jodhpur',
        addressRegion: 'Rajasthan',
        postalCode: '342005',
        addressCountry: 'IN'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '26.2389',
        longitude: '73.0243'
      },
      telephone: '+91-98290-14820',
      priceRange: '$$$$',
      url: 'https://jodhpur-furniture.com/'
    };

    let scriptElement = document.getElementById('dynamic-page-schema');
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = 'dynamic-page-schema';
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(schema || defaultSchema, null, 2);

    return () => {
      // Clean up dynamic schema on unmount so next page can mount its own cleanly
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [title, description, keywords, image, url, type, schema]);

  return null;
}
