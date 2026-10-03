import { useState, useCallback, useEffect, lazy, Suspense, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import * as authService from "./services/authService.js";
import "./index.css";
import "./App.css";

import Header      from "./components/Header.jsx";
import JobList     from "./components/JobList.jsx";
import Footer      from "./components/Footer.jsx";
import ConsentNotice from "./components/ConsentNotice.jsx";
import OfflineIndicator from "./components/OfflineIndicator.jsx";
import SEO         from "./components/SEO.jsx";
import { LoadingSpinner } from "./components/LoadingSkeleton.jsx";
import * as api    from "./api.js";

// 🚀 Dynamic Lazy-loaded Components (Code Splitting)
const JobDetailPage = lazy(() => import("./components/JobDetailPage.jsx"));
const AdminPanel    = lazy(() => import("./components/AdminPanel.jsx"));
const AuthModal     = lazy(() => import("./components/AuthModal.jsx"));
const PolicyPage    = lazy(() => import("./components/PolicyPage.jsx"));
const NotFoundPage  = lazy(() => import("./components/NotFoundPage.jsx"));
const StatsDashboard = lazy(() => import("./components/StatsDashboard.jsx"));
const AdminAnalyticsDashboard = lazy(() => import("./components/AdminAnalyticsDashboard.jsx"));
import { trackPageView } from "./services/analyticsService.js";

function ModalLoadingFallback() {
  return (
    <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--card-bg, #fff)", padding: "24px 32px", borderRadius: 16, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}>
        <LoadingSpinner size={32} />
        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main, #1e293b)" }}>กำลังโหลดส่วนเสริม...</span>
      </div>
    </div>
  );
}

function PageLoadingFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <LoadingSpinner size={44} />
      <p style={{ fontSize: "0.9rem", color: "var(--navy-400, #94a3b8)", fontWeight: 500 }}>กำลังโหลดข้อมูลหน้าเว็บ...</p>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" ? "✅" : "❌"} {t.message}
        </div>
      ))}
    </div>
  );
}

// Helper to determine active page from pathname
function getActivePage(pathname) {
  if (pathname.includes("/stats") || pathname.includes("/dashboard")) return "stats";
  if (pathname.includes("/category/civil")) return "civil";
  if (pathname.includes("/category/government")) return "government";
  if (pathname.includes("/category/state")) return "state";
  if (pathname.includes("/category/temp")) return "temp";
  if (pathname.includes("/category/agency")) return "agency";
  return "home";
}

// ─── App Context (avoids prop drilling through MainContent) ─────────────────
export const AppContext = createContext(null);

// ─── Main Content Wrapper ───────────────────────────────────────────────────
// Reads shared data from AppContext instead of receiving 15+ props
function MainContent() {
  const {
    jobs, books,
    isJobsLoading, isBooksLoading,
    isJobsError, isBooksError,
    isAdmin, handleEditJob,
    userEducation, setUserEducation,
    handleAddBook, handleUpdateBook, handleDeleteBook,
    handleSelectProvince,
    addToast,
  } = useContext(AppContext);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Parse activePage from URL path
  let activePage = getActivePage(location.pathname);

  // Parse selectedProvince from query string (?province=xxx)
  const selectedProvince = searchParams.get("province");

  const onSelectProvince = handleSelectProvince;
  const onToast = addToast;

  // Dynamic SEO based on page and province
  const pageTitles = {
    home: "หน้าแรก",
    civil: "งานราชการ",
    government: "งานพนักงานราชการ",
    state: "งานรัฐวิสาหกิจ",
    temp: "งานลูกจ้างชั่วคราว",
    agency: "งานพนักงานหน่วยงานของรัฐ"
  };
  
  let seoTitle = pageTitles[activePage] || "หน้าแรก";
  let seoDesc = `แหล่งรวมประกาศรับสมัคร${seoTitle} อัปเดตล่าสุด`;

  if (selectedProvince) {
    seoTitle = `${seoTitle} จังหวัด${selectedProvince}`;
    seoDesc = `ประกาศรับสมัคร${seoTitle} อัปเดตล่าสุด หางานราชการใน${selectedProvince}`;
  }

  return (
    <>
      <SEO title={seoTitle} description={seoDesc} url={`https://readytogov.th${location.pathname}${location.search}`} />
      <JobList
        jobs={jobs}
        books={books}
        isLoading={isJobsLoading || isBooksLoading}
        isError={isJobsError || isBooksError}
        activePage={activePage}
        selectedProvince={selectedProvince}
        onSelectProvince={onSelectProvince}
        isAdmin={isAdmin}
        onEditJob={handleEditJob}
        userEducation={userEducation}
        onChangeUserEducation={setUserEducation}
        onAddBook={handleAddBook}
        onUpdateBook={handleUpdateBook}
        onDeleteBook={handleDeleteBook}
        onToast={onToast}
      />
    </>
  );
}


// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: jobs = [], isLoading: isJobsLoading, isError: isJobsError } = useQuery({
    queryKey: ["jobs"],
    queryFn: api.fetchJobs,
  });

  const { data: books = [], isLoading: isBooksLoading, isError: isBooksError } = useQuery({
    queryKey: ["books"],
    queryFn: api.fetchBooks,
  });

  const [user,             setUser]           = useState(null);
  const [showAuth,         setShowAuth]       = useState(false);
  const [showAdmin,        setShowAdmin]      = useState(false);
  const [showAnalytics,    setShowAnalytics]  = useState(false);
  const [editingJob,       setEditingJob]     = useState(null);
  const [userEducation,    setUserEducation]  = useState(null);
  const [toasts,           setToasts]         = useState([]);

  // ── Track Page Views in Firebase Analytics ──
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Toast helper
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Listen to Firebase Auth state (lazy loaded only if admin session exists)
  useEffect(() => {
    let unsubscribe = () => {};
    if (authService.shouldCheckAdminAuth()) {
      authService.subscribeToAuthState((currentUser) => {
        if (currentUser) {
          setUser({ name: "Admin", email: currentUser.email, role: "admin" });
          addToast(`ยินดีต้อนรับ Admin 👋`);
        } else {
          setUser(null);
        }
      }).then((unsub) => {
        if (typeof unsub === "function") unsubscribe = unsub;
      });
    }
    return () => unsubscribe();
  }, [addToast]);

  const handleAuthSuccess = useCallback((currentUser) => {
    if (currentUser) {
      setUser({ name: "Admin", email: currentUser.email, role: "admin" });
      addToast(`ยินดีต้อนรับ Admin 👋`);
      // Note: Do NOT re-subscribe to auth state here.
      // The useEffect at L152 already handles auth state subscription.
      // Subscribing again here causes memory leaks from orphaned listeners.
    }
  }, [addToast]);

  // Book Mutations
  const addBookMutation = useMutation({
    mutationFn: api.addBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      addToast("เพิ่มหนังสือ/คอร์สเรียบร้อยแล้ว");
    },
    onError: (err) => {
      console.error("addBook failed:", err);
      addToast("เพิ่มหนังสือไม่สำเร็จ โปรดลองอีกครั้ง", "error");
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: api.updateBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      addToast("อัปเดตข้อมูลหนังสือเรียบร้อยแล้ว");
    },
    onError: (err) => {
      console.error("updateBook failed:", err);
      addToast("อัปเดตหนังสือไม่สำเร็จ โปรดลองอีกครั้ง", "error");
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: api.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      addToast("ลบรายการหนังสือเรียบร้อยแล้ว", "success");
    },
    onError: (err) => {
      console.error("deleteBook failed:", err);
      addToast("ลบหนังสือไม่สำเร็จ โปรดลองอีกครั้ง", "error");
    },
  });

  // Job Mutations
  const addJobMutation = useMutation({
    mutationFn: api.addJob,
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast(`เพิ่มประกาศ "${newJob.department || newJob.title || "ใหม่"}" เรียบร้อยแล้ว ✅`);
    },
    onError: (err) => {
      console.error("addJob failed:", err);
      addToast("เพิ่มประกาศไม่สำเร็จ โปรดลองอีกครั้ง", "error");
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: api.updateJob,
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast(`แก้ไขประกาศ "${updatedJob.department || updatedJob.title || "เรียบร้อย"}" เรียบร้อยแล้ว ✅`);
    },
    onError: (err) => {
      console.error("updateJob failed:", err);
      addToast("แก้ไขประกาศไม่สำเร็จ โปรดลองอีกครั้ง", "error");
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: api.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast("ลบประกาศเรียบร้อยแล้ว 🗑️", "success");
      navigate("/");
    },
    onError: (err) => {
      console.error("deleteJob failed:", err);
      addToast("ลบประกาศไม่สำเร็จ โปรดลองอีกครั้ง", "error");
    },
  });

  function handleAddBook(newBook) { addBookMutation.mutate(newBook); }
  function handleUpdateBook(updatedBook) { updateBookMutation.mutate(updatedBook); }
  function handleDeleteBook(bookId) { deleteBookMutation.mutate(bookId); }

  function handleAddJob(newJob) { addJobMutation.mutate(newJob); }
  function handleUpdateJob(updatedJob) { updateJobMutation.mutate(updatedJob); }
  function handleDeleteJob(id) { deleteJobMutation.mutate(id); }

  async function handleLogout() {
    try {
      await authService.logoutAdmin();
      setUser(null);
      addToast(`ออกจากระบบแล้ว`, "success");
      setShowAdmin(false);
      setEditingJob(null);
    } catch (error) {
      console.error(error);
      addToast("เกิดข้อผิดพลาดในการออกจากระบบ", "error");
    }
  }

  function handleEditJob(job) {
    setEditingJob(job);
    setShowAdmin(true);
  }

  function handleCloseAdmin() {
    setShowAdmin(false);
    setEditingJob(null);
  }

  let activePage = getActivePage(location.pathname);

  const searchParams = new URLSearchParams(location.search);
  const selectedProvince = searchParams.get("province");

  function handleNavigate(page) {
    if (page.startsWith("policy/")) {
      navigate(`/${page}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (page === "stats") {
      navigate("/stats");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const provinceQuery = selectedProvince ? `?province=${encodeURIComponent(selectedProvince)}` : "";
    if (page === "home") navigate("/" + provinceQuery);
    else navigate(`/category/${page}${provinceQuery}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSelectProvince(province) {
    if (!province) {
      navigate(location.pathname);
    } else {
      navigate(`${location.pathname}?province=${encodeURIComponent(province)}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isAdmin = user?.role === "admin";

  return (
    <AppContext.Provider value={{
      jobs, books,
      isJobsLoading, isBooksLoading,
      isJobsError, isBooksError,
      isAdmin,
      handleEditJob,
      userEducation, setUserEducation,
      handleAddBook, handleUpdateBook, handleDeleteBook,
      handleSelectProvince,
      addToast,
    }}>
      {/* Header */}
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/category/:categoryId" element={<MainContent />} />
            <Route path="/job/:jobId" element={<JobDetailPage jobs={jobs} books={books} isLoading={isJobsLoading} isAdmin={isAdmin} onEditJob={handleEditJob} onToast={addToast} />} />
            <Route path="/stats" element={<StatsDashboard jobs={jobs} onNavigateCategory={handleNavigate} onSelectProvince={handleSelectProvince} isAdmin={isAdmin} onOpenAnalytics={() => setShowAnalytics(true)} />} />
            {/* /dashboard is an alias — redirect to canonical /stats */}
            <Route path="/dashboard" element={<Navigate to="/stats" replace />} />
            <Route path="/admin/analytics" element={
              <AdminAnalyticsDashboard
                jobs={jobs}
                onClose={() => navigate("/stats")}
              />
            } />
            <Route path="/policy/:policyId" element={<PolicyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onLoginClick={() => setShowAuth(true)}
        user={user}
      />

      {/* Admin Quick Action Floating Buttons */}
      {isAdmin && (
        <div className="admin-fab-group">
          <button
            id="admin-analytics-fab-btn"
            className="admin-fab analytics"
            onClick={() => setShowAnalytics(true)}
            title="ดูสถิติเชิงลึก (Firebase Analytics Dashboard)"
          >
            <span className="fab-icon">📈</span>
            Analytics
          </button>
          <button
            id="admin-fab-btn"
            className="admin-fab"
            onClick={() => { setEditingJob(null); setShowAdmin(true); }}
            title="เพิ่มประกาศใหม่"
          >
            <span className="fab-icon">＋</span>
            เพิ่มประกาศ
          </button>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={handleAuthSuccess}
          />
        </Suspense>
      )}

      {/* Admin Analytics Dashboard Modal */}
      {showAnalytics && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <AdminAnalyticsDashboard
            jobs={jobs}
            onClose={() => setShowAnalytics(false)}
          />
        </Suspense>
      )}

      {/* Admin Panel Modal — Add or Edit */}
      {showAdmin && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <AdminPanel
            jobs={jobs}
            editJob={editingJob}
            onAddJob={handleAddJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onClose={handleCloseAdmin}
          />
        </Suspense>
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
      
      {/* Cookie / Privacy Consent Notice */}
      <ConsentNotice />

      {/* PWA Offline & Install Indicator */}
      <OfflineIndicator />
    </AppContext.Provider>
  );
}
