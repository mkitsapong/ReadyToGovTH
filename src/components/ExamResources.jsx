import { useState } from "react";
import AdminResourceModal from "./AdminResourceModal.jsx";

export function ExamPrepBanner({
  books = [],
  isAdmin = false,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
}) {
  const [activeModalItem, setActiveModalItem] = useState(null); // null = closed, {} = add new, itemObj = edit
  const [showModal, setShowModal] = useState(false);

  function handleOpenAdd() {
    setActiveModalItem(null);
    setShowModal(true);
  }

  function handleOpenEdit(item) {
    setActiveModalItem(item);
    setShowModal(true);
  }

  function handleSave(formData) {
    if (activeModalItem?.id) {
      onUpdateBook && onUpdateBook(formData);
    } else {
      onAddBook && onAddBook(formData);
    }
  }

  return (
    <>
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: "var(--radius-xl)",
        padding: "24px 28px",
        margin: "0 0 32px 0",
        color: "white",
        boxShadow: "0 10px 30px rgba(15,23,42,0.25)",
        border: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow accent */}
        <div style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(234,88,12,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              📚 แนะนำหนังสือ & คอร์สเตรียมสอบ ก.พ. และสอบราชการ
            </h3>
            <p style={{ fontSize: "0.83rem", color: "var(--navy-200)", margin: "4px 0 0 0" }}>
              รวบรวมหนังสือแนวข้อสอบเก็งตรงจุด ช่วยเพิ่มโอกาสสอบผ่านในการสอบภาค ก และ ภาค ข
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenAdd}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(234,88,12,0.4)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                ➕ เพิ่มหนังสือ/คอร์ส (Admin)
              </button>
            )}
            <span style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              background: "rgba(234,88,12,0.2)",
              color: "var(--orange-300)",
              border: "1px solid rgba(234,88,12,0.4)",
              padding: "4px 12px",
              borderRadius: "999px",
            }}>
              💡 แนะนำ
            </span>
          </div>
        </div>

        {/* Resource Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
        }}>
          {books.map((item) => (
            <div key={item.id} style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              transition: "transform 0.2s, background 0.2s",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: item.badgeColor || "#2563eb",
                    color: "white",
                  }}>
                    {item.badge}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.72rem", color: "#fef08a", fontWeight: 600 }}>
                      {item.rating}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          color: "white",
                          borderRadius: "var(--radius-sm)",
                          padding: "2px 6px",
                          fontSize: "0.68rem",
                          cursor: "pointer",
                        }}
                        title="แก้ไขหนังสือนี้"
                      >
                        ✏️ แก้ไข
                      </button>
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "white", lineHeight: 1.4, margin: "0 0 6px 0" }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: "0.78rem", color: "var(--navy-300)", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                  {item.desc}
                </p>
              </div>

              <a
                href={item.link || "#"}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 14px",
                  background: "linear-gradient(135deg, var(--accent), var(--orange-600))",
                  color: "white",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(234,88,12,0.3)",
                }}
              >
                📖 สั่งซื้อ / ดูรายละเอียด ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <AdminResourceModal
          item={activeModalItem}
          onSave={handleSave}
          onDelete={onDeleteBook}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export function ModalExamPrepSection({
  books = [],
  showBooks = true,
  customBookTitle = "",
  customBookUrl = "",
}) {
  if (showBooks === false) {
    return null;
  }

  const hasCustom = Boolean(customBookUrl && customBookUrl.trim());
  if (!hasCustom && (!books || books.length === 0)) {
    return null;
  }

  return (
    <div style={{
      margin: "20px 0",
      padding: "16px",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      border: "1.5px dashed #cbd5e1",
      borderRadius: "var(--radius-lg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-800)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          📚 เตรียมตัวสอบตำแหน่งนี้ (หนังสือ & คอร์สติวแนะนำ)
        </h4>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent)", background: "var(--orange-50)", padding: "2px 8px", borderRadius: "999px", border: "1px solid var(--orange-200)" }}>
          เก็งข้อสอบตรงจุด
        </span>
      </div>

      {hasCustom ? (
        /* Custom Book / Course Card */
        <div style={{
          background: "white",
          padding: "14px 16px",
          borderRadius: "var(--radius-md)",
          border: "1px solid #bfdbfe",
          boxShadow: "0 2px 8px rgba(37,99,176,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1d4ed8", background: "#dbeafe", padding: "2px 8px", borderRadius: "999px", display: "inline-block", marginBottom: 4 }}>
              📌 แนะนำเฉพาะตำแหน่งนี้
            </span>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--navy-900)", lineHeight: 1.35 }}>
              {customBookTitle.trim() || "คู่มือเตรียมสอบ & แนวข้อสอบตรงตามระเบียบรับสมัคร"}
            </div>
          </div>
          <a
            href={customBookUrl.trim()}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, var(--accent), var(--orange-600))",
              color: "white",
              borderRadius: "var(--radius-md)",
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(234,88,12,0.3)",
            }}
          >
            🛒 สั่งซื้อ / ดูรายละเอียด ↗
          </a>
        </div>
      ) : (
        /* Default Books Cards */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {books.slice(0, 2).map((b) => (
            <div key={b.id} style={{
              background: "white",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--gray-200)",
              display: "flex",
              flexDirection: "column",
              justify: "space-between",
            }}>
              <div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: b.badgeColor || "#2563eb", background: b.bg || "#eff6ff", padding: "2px 6px", borderRadius: "4px", display: "inline-block", marginBottom: 4 }}>
                  {b.badge}
                </span>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--navy-900)", lineHeight: 1.35, marginBottom: 4 }}>
                  {b.title}
                </div>
              </div>
              <a
                href={b.link || "#"}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--navy-700)",
                  textDecoration: "none",
                  marginTop: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🛒 ดูรายละเอียดหนังสือ ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
