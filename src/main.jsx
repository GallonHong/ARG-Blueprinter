import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '../style.css'
import './editor.css'
import './link-editor.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ARG Blueprint Error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('arg-blueprint-react');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#fafafa',
          color: '#18181b',
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, margin: '0 0 8px 0', fontWeight: 600 }}>页面渲染遇到异常</h2>
          <p style={{ fontSize: 13, color: '#71717a', maxWidth: 450, margin: '0 0 16px 0', lineHeight: 1.5 }}>
            浏览器本地缓存数据可能存在异常。您可以点击下方按钮重置并重新载入官方完整演示项目：
          </p>
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 16, maxWidth: 500, wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              background: '#18181b',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            重置缓存并载入《灵异论坛调查模仿》演示项目
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
