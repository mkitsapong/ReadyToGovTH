import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
// Targeted font subsets: Thai & Latin (omits unused Vietnamese & Latin-ext subsets for smaller bundle)
import '@fontsource/prompt/thai-300.css'
import '@fontsource/prompt/thai-400.css'
import '@fontsource/prompt/thai-500.css'
import '@fontsource/prompt/thai-600.css'
import '@fontsource/prompt/thai-700.css'
import '@fontsource/prompt/latin-400.css'
import '@fontsource/prompt/latin-600.css'
import '@fontsource/prompt/latin-700.css'
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import './index.css'
import App from './App.jsx'

// Auto-clean any lingering Service Workers in development to prevent blank screen conflicts
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

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
      staleTime: 5 * 60 * 1000,  // 5 minutes — avoid redundant Firestore reads on rapid tab switches
      gcTime: 15 * 60 * 1000,    // 15 minutes — keep inactive cache for quicker back-navigation
      retry: 2,                   // Retry failed queries twice before showing error
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
