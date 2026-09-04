import { useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import JobDetailModal from "./JobDetailModal.jsx";
import SEO from "./SEO.jsx";

import { JobDetailSkeleton } from "./LoadingSkeleton.jsx";

import { getDisplayProvinces } from "../utils/helpers.js";

// Function to generate JSON-LD script for Google
function generateJobPostingSchema(job) {
  const categoryName = (job.categories && job.categories.length > 0) ? job.categories[0] : (job.category || "งานราชการ");
  const displayProvs = getDisplayProvinces(job);
  const provinceName = displayProvs.length > 0 ? displayProvs[0] : "Thailand";

  const schema = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.department,
    "description": job.description || `ประกาศรับสมัครงานราชการ ${job.department} หมวดหมู่ ${categoryName}`,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.department,
      "value": String(job.id)
    },
    "datePosted": job.postedDate || new Date().toISOString(),
    "validThrough": job.deadline ? new Date(job.deadline).toISOString() : undefined,
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.department,
      "logo": job.logoUrl || "https://readytogov.th/favicon.svg"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "TH",
        "addressRegion": provinceName
      }
    }
  };
  return JSON.stringify(schema);
}

export default function JobDetailPage({ jobs, books, isLoading = false, isAdmin, onEditJob }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // ถ้ามีประวัติการเข้าชม (ไม่ได้เข้าลิงก์นี้โดยตรง) ให้กด Back เพื่อให้จำตำแหน่ง Scroll
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [jobId]);
  
  // Loading state (either query is loading or jobs array is still empty during load)
  if (isLoading || !jobs || (Array.isArray(jobs) && jobs.length === 0 && isLoading !== false)) {
    return <JobDetailSkeleton onBack={handleBack} />;
  }

  // If loading finished but database returned 0 jobs
  if (Array.isArray(jobs) && jobs.length === 0) {
    return (
      <div className="container" style={{ paddingTop: "60px", paddingBottom: "60px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "48px 24px",
            background: "var(--white)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid var(--gray-200)",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ fontSize: "3.2rem", marginBottom: 16 }}>📭</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy-800)", marginBottom: 8 }}>
            ยังไม่มีข้อมูลประกาศงานในขณะนี้
          </h2>
          <p style={{ color: "var(--navy-400)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>
            ระบบไม่พบประกาศงานในฐานข้อมูล โปรดลองใหม่อีกครั้งในภายหลัง
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: "10px 24px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            ← กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const job = jobs.find((j) => String(j.id) === String(jobId));

  if (!job) {
    return (
      <div className="container" style={{ paddingTop: "60px", paddingBottom: "60px", textAlign: "center" }}>
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "48px 24px",
            background: "var(--white)",
            borderRadius: "var(--radius-2xl)",
            border: "1px solid var(--gray-200)",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ fontSize: "3.2rem", marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy-800)", marginBottom: 8 }}>
            ไม่พบประกาศงานนี้
          </h2>
          <p style={{ color: "var(--navy-400)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 24 }}>
            ประกาศรับสมัครงานนี้อาจถูกปิดรับสมัคร ลบออก หรือไม่พบในระบบ
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: "10px 24px", display: "inline-flex", alignItems: "center", gap: 6 }}>
            ← กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const primaryCategory = categories[0] || "งานราชการ";
  const categoryLink = {
    "ข้าราชการ": "/category/civil",
    "พนักงานราชการ": "/category/government",
    "รัฐวิสาหกิจ": "/category/state",
    "ลูกจ้างชั่วคราว": "/category/temp",
    "พนักงานหน่วยงานของรัฐ": "/category/agency"
  }[primaryCategory];

  return (
    <>
      <SEO 
        title={`รับสมัครงาน ${job.department}`}
        description={`ประกาศรับสมัครงาน ${job.department} อัปเดตล่าสุด รีบสมัครก่อน ${new Date(job.deadline).toLocaleDateString("th-TH")}`}
        url={`https://readytogov.th/job/${job.id}`}
        imageUrl={job.logoUrl}
      />
      
      {/* Inject Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateJobPostingSchema(job) }} />

      <div className="container detail-page-container">
        <div className="detail-top-nav">
          <button type="button" onClick={handleBack} className="btn-detail-back" title="กลับไปหน้ารายการงาน">
            <span className="btn-back-arrow">←</span>
            <span>กลับไปค้นหาตำแหน่งงาน</span>
          </button>
          <nav className="detail-breadcrumbs" aria-label="breadcrumb">
            <Link to="/" className="detail-crumb-link">หน้าแรก</Link>
            <span className="detail-crumb-sep">/</span>
            {categoryLink ? (
              <Link to={categoryLink} className="detail-crumb-link">{primaryCategory}</Link>
            ) : (
              <span className="detail-crumb-link">{primaryCategory}</span>
            )}
            <span className="detail-crumb-sep">/</span>
            <span className="detail-crumb-current" title={job.department}>{job.department}</span>
          </nav>
        </div>
        <article className="job-detail-page-card">
           {/* Re-use JobDetailModal content logic but render it directly on the page instead of a modal */}
           <JobDetailModal job={job} books={books} inline={true} isAdmin={isAdmin} onEdit={onEditJob} />
        </article>
      </div>
    </>
  );
}
