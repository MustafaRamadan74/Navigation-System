import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw',
            background: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '32px 24px',
              maxWidth: '480px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px 0', color: '#fca5a5' }}>
              حدث خطأ غير متوقع
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              حدثت مشكلة أثناء عرض الخريطة. يمكنك إعادة المحاولة بالضغط على الزر أدناه.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#ef4444',
                  overflowX: 'auto',
                  textAlign: 'left',
                  marginBottom: '20px',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                background: '#FF9E20',
                color: '#1D2128',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              إعادة تحميل الصفحة / Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
