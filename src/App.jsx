import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Routes, Route, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "./firebase.js";
import "./index.css";
import "./App.css";

import Header      from "./components/Header.jsx";
import JobList     from "./components/JobList.jsx";
import JobDetailPage from "./components/JobDetailPage.jsx";
import AdminPanel  from "./components/AdminPanel.jsx";
import AuthModal   from "./components/AuthModal.jsx";
import Footer      from "./components/Footer.jsx";
import PolicyPage  from "./components/PolicyPage.jsx";
import CookieBanner from "./components/CookieBanner.jsx";
import SEO         from "./components/SEO.jsx";
import * as api    from "./api.js";

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
  if (pathname.includes("/category/civil")) return "civil";
  if (pathname.includes("/category/government")) return "government";
  if (pathname.includes("/category/state")) return "state";
  if (pathname.includes("/category/temp")) return "temp";
  if (pathname.includes("/category/agency")) return "agency";
  return "home";
}

// ─── Main Content Wrapper ───────────────────────────────────────────────────
// This component handles the URL params/search and passes them to JobList
function MainContent({ jobs, books, isJobsLoading, isBooksLoading, isJobsError, isBooksError, isAdmin, handleEditJob, userEducation, setUserEducation, handleAddBook, handleUpdateBook, handleDeleteBook, onSelectProvince }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Parse activePage from URL path
  let activePage = getActivePage(location.pathname);

  // Parse selectedProvince from query string (?province=xxx)
  const selectedProvince = searchParams.get("province");

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
  const [editingJob,       setEditingJob]     = useState(null);
  const [userEducation,    setUserEducation]  = useState(null);
  const [toasts,           setToasts]         = useState([]);

  // Toast helper
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({ name: "Admin", email: currentUser.email, role: "admin" });
        addToast(`ยินดีต้อนรับ Admin 👋`);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [addToast]);

  // Book Mutations
  const addBookMutation = useMutation({
    mutationFn: api.addBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      addToast("เพิ่มหนังสือ/คอร์สเรียบร้อยแล้ว");
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: api.updateBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      addToast("อัปเดตข้อมูลหนังสือเรียบร้อยแล้ว");
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: api.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      addToast("ลบรายการหนังสือเรียบร้อยแล้ว", "error");
    },
  });

  // Job Mutations
  const addJobMutation = useMutation({
    mutationFn: api.addJob,
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast(`เพิ่มประกาศ "${newJob.title}" เรียบร้อยแล้ว ✅`);
    },
  });



  const updateJobMutation = useMutation({
    mutationFn: api.updateJob,
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast(`แก้ไขประกาศ "${updatedJob.title}" เรียบร้อยแล้ว ✅`);
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: api.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast("ลบประกาศเรียบร้อยแล้ว 🗑️", "success");
      navigate("/");
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
      await signOut(auth);
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
    <>
      {/* Header */}
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<MainContent
            jobs={jobs} books={books}
            isJobsLoading={isJobsLoading} isBooksLoading={isBooksLoading}
            isJobsError={isJobsError} isBooksError={isBooksError}
            isAdmin={isAdmin} handleEditJob={handleEditJob}
            userEducation={userEducation} setUserEducation={setUserEducation}
            handleAddBook={handleAddBook} handleUpdateBook={handleUpdateBook} handleDeleteBook={handleDeleteBook}
            onSelectProvince={handleSelectProvince}
          />} />
          <Route path="/category/:categoryId" element={<MainContent
            jobs={jobs} books={books}
            isJobsLoading={isJobsLoading} isBooksLoading={isBooksLoading}
            isJobsError={isJobsError} isBooksError={isBooksError}
            isAdmin={isAdmin} handleEditJob={handleEditJob}
            userEducation={userEducation} setUserEducation={setUserEducation}
            handleAddBook={handleAddBook} handleUpdateBook={handleUpdateBook} handleDeleteBook={handleDeleteBook}
            onSelectProvince={handleSelectProvince}
          />} />
          <Route path="/job/:jobId" element={<JobDetailPage jobs={jobs} books={books} isAdmin={isAdmin} onEditJob={handleEditJob} />} />
          <Route path="/policy/:policyId" element={<PolicyPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onLoginClick={() => setShowAuth(true)}
        user={user}
      />

      {/* Admin FAB — Add new */}
      {isAdmin && (
        <button
          id="admin-fab-btn"
          className="admin-fab"
          onClick={() => { setEditingJob(null); setShowAdmin(true); }}
          title="เพิ่มประกาศใหม่"
        >
          <span className="fab-icon">＋</span>
          เพิ่มประกาศ
        </button>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
        />
      )}

      {/* Admin Panel Modal — Add or Edit */}
      {showAdmin && (
        <AdminPanel
          editJob={editingJob}
          onAddJob={handleAddJob}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onClose={handleCloseAdmin}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
      
      {/* Cookie Banner */}
      <CookieBanner />
    </>
  );
}
