import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // You could also log to an external service here
    console.error("Unhandled error captured by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32 }}>
          <h1 style={{ color: '#b91c1c' }}>Something went wrong</h1>
          <p style={{ color: '#374151' }}>{this.state.error?.toString()}</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f3f4f6', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
            {this.state.info?.componentStack}
          </pre>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', borderRadius: 6 }}>Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
