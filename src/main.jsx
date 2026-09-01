import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "var(--navy-900)", color: "white" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: 8, color: "white" }}>เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h2>
          <p style={{ color: "var(--navy-200)", maxWidth: 500, marginBottom: 24, lineHeight: 1.6 }}>
            ขออภัยในความไม่สะดวก โปรดลองรีเฟรชหน้าเว็บใหม่อีกครั้ง
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px", background: "var(--accent)", color: "white", border: "none", borderRadius: "999px", fontWeight: 700, cursor: "pointer" }}
          >
            🔄 โหลดหน้าเว็บใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)
