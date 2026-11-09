import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '520px',
            background: '#ffffff',
            border: '2px solid #000000',
            boxShadow: '4px 4px 0 #000000',
            borderRadius: '12px',
            padding: '32px 24px',
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              marginBottom: '16px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>error</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }}>Something went wrong</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              PCS Meet Manager encountered an unexpected error. You can reload the page or clear the local cache to recover.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                background: '#f1f5f9',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '11px',
                overflowX: 'auto',
                marginBottom: '20px',
                maxHeight: '140px',
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 18px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: '1.5px solid #000000',
                  boxShadow: '2px 2px 0 #000000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  padding: '10px 18px',
                  background: '#f1f5f9',
                  color: '#0f172a',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: '1.5px solid #000000',
                  boxShadow: '2px 2px 0 #000000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
