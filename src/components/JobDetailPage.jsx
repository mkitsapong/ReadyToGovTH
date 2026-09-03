import { useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import JobDetailModal from "./JobDetailModal.jsx";
import SEO from "./SEO.jsx";

import { JobDetailSkeleton } from "./LoadingSkeleton.jsx";

// Function to generate JSON-LD script for Google
function generateJobPostingSchema(job) {
  const categoryName = (job.categories && job.categories.length > 0) ? job.categories[0] : (job.category || "งานราชการ");
  const provinceName = (job.provinces && job.provinces.length > 0) ? job.provinces[0] : (job.province || "Thailand");

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

      <div className="container" style={{ paddingTop: "24px", paddingBottom: "40px" }}>
        <a href="/" onClick={handleBack} style={{ color: "var(--navy-600)", fontWeight: "600", display: "inline-block", marginBottom: "20px", textDecoration: "none" }}>
          ← กลับหน้าแรก
        </a>
        <article className="job-detail-page">
           {/* Re-use JobDetailModal content logic but render it directly on the page instead of a modal */}
           {/* For simplicity, we can just render the modal component directly inline, but modify it slightly or we just render it full width */}
           <JobDetailModal job={job} books={books} inline={true} isAdmin={isAdmin} onEdit={onEditJob} />
        </article>
      </div>
    </>
  );
}
