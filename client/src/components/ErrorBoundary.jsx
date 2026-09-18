import React from 'react';
import { reportClientError } from '../utils/telemetry';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Atelier ErrorBoundary Caught]', error, errorInfo);
    reportClientError(error, errorInfo?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div className="card-luxury" style={{ maxWidth: '540px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(248, 113, 113, 0.15)',
                color: 'var(--danger)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <AlertTriangle size={28} aria-hidden="true" />
            </div>
            <h2 style={{ marginBottom: '0.8rem' }}>Atelier Viewport Recovery</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              An unexpected interface event occurred in the 3D rendering pipeline. Our Basni factory telemetry system has automatically logged the incident.
            </p>
            <button onClick={this.handleReset} className="btn btn-primary">
              <RefreshCw size={16} aria-hidden="true" /> Reinitialize Experience
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
