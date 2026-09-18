import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { InquiryProvider } from './context/InquiryContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InquiryDrawer from './components/InquiryDrawer';
import Toast from './components/Toast';
import BackToTop from './components/BackToTop';
import CookieConsentBanner from './components/CookieConsentBanner';

// Pages (code-split)
const Home = React.lazy(() => import('./pages/Home'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Factory = React.lazy(() => import('./pages/Factory'));
const CustomTrade = React.lazy(() => import('./pages/CustomTrade'));
const About = React.lazy(() => import('./pages/About'));
const CareWarranty = React.lazy(() => import('./pages/CareWarranty'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const RefundPolicy = React.lazy(() => import('./pages/RefundPolicy'));
const CookiePolicy = React.lazy(() => import('./pages/CookiePolicy'));

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [selectedProductId, setSelectedProductId] = useState(() => {
    const match = window.location.pathname.match(/\/product\/(.+)/);
    return match ? match[1] : null;
  });

  // Handle browser back / forward navigation
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
      const match = path.match(/\/product\/(.+)/);
      if (match) {
        setSelectedProductId(match[1]);
      } else {
        setSelectedProductId(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    const match = path.match(/\/product\/(.+)/);
    if (match) {
      setSelectedProductId(match[1]);
    } else {
      setSelectedProductId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (id) => {
    setSelectedProductId(id);
    navigateTo(`/product/${id}`);
  };

  // Render Page based on currentPath (query strings stripped for routing)
  const renderPage = () => {
    const routePath = currentPath.split('?')[0];
    if (routePath === '/track' || routePath.startsWith('/track/')) {
      const trackId = routePath.startsWith('/track/')
        ? decodeURIComponent(routePath.slice('/track/'.length))
        : null;
      return <TrackOrder setPath={navigateTo} initialOrderNumber={trackId} />;
    }
    if (selectedProductId || routePath.startsWith('/product/')) {
      return (
        <ProductDetail
          productId={selectedProductId || 'jod-prod-001'}
          onBack={() => navigateTo('/catalog')}
          onNavigate={navigateTo}
        />
      );
    }

    switch (routePath) {
      case '/catalog':
        return <Catalog onSelectProduct={handleSelectProduct} setPath={navigateTo} />;
      case '/gallery':
        return <GalleryPage setPath={navigateTo} onSelectProduct={handleSelectProduct} />;
      case '/contact':
        return <ContactPage setPath={navigateTo} />;
      case '/factory':
        return <Factory setPath={navigateTo} />;
      case '/custom-trade':
        return <CustomTrade />;
      case '/about':
        return <About setPath={navigateTo} />;
      case '/care-warranty':
        return <CareWarranty />;
      case '/admin':
        return <AdminDashboard />;
      case '/privacy':
        return <Privacy setPath={navigateTo} />;
      case '/terms':
        return <Terms setPath={navigateTo} />;
      case '/refund-policy':
        return <RefundPolicy setPath={navigateTo} />;
      case '/cookie-policy':
        return <CookiePolicy setPath={navigateTo} />;
      case '/':
        return <Home setPath={navigateTo} onSelectProduct={handleSelectProduct} />;
      default:
        return <NotFound setPath={navigateTo} />;
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
        <InquiryProvider>
          <SocketProvider>
            <a
              href="#main-content"
              onFocus={(e) => {
                Object.assign(e.currentTarget.style, { left: '1rem', top: '1rem', width: 'auto', height: 'auto', clip: 'auto', clipPath: 'none', overflow: 'visible', zIndex: 9999, padding: '0.75rem 1.25rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)', borderRadius: '8px' });
              }}
              onBlur={(e) => {
                Object.assign(e.currentTarget.style, { left: '-9999px', top: 'auto', width: '1px', height: '1px', clip: 'rect(0, 0, 0, 0)', clipPath: 'inset(50%)', overflow: 'hidden', zIndex: -1, padding: '0', background: 'transparent', border: 'none' });
              }}
              style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', clip: 'rect(0, 0, 0, 0)', clipPath: 'inset(50%)', overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              Skip to content
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar currentPath={currentPath} setPath={navigateTo} />

              <main id="main-content" style={{ flexGrow: 1 }}>
                <React.Suspense fallback={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
                    <p>Loading…</p>
                  </div>
                }>
                  <div key={currentPath + (selectedProductId || '')} className="page-enter">
                    {renderPage()}
                  </div>
                </React.Suspense>
              </main>

              <Footer setPath={navigateTo} />
              <InquiryDrawer />
              <Toast />
              <BackToTop />
              <CookieConsentBanner setPath={navigateTo} />
            </div>
          </SocketProvider>
        </InquiryProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
