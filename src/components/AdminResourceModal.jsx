import { useState } from "react";

const BADGES = ["ก.พ. ภาค ก", "พนักงานราชการ", "สอบราชการ", "รัฐวิสาหกิจ", "ท้องถิ่น"];
const BADGE_COLOR_MAP = {
  "ก.พ. ภาค ก": { badgeColor: "#2563eb", bg: "#eff6ff" },
  "พนักงานราชการ": { badgeColor: "#d97706", bg: "#fffbeb" },
  "สอบราชการ": { badgeColor: "#059669", bg: "#ecfdf5" },
  "รัฐวิสาหกิจ": { badgeColor: "#7c3aed", bg: "#f5f3ff" },
  "ท้องถิ่น": { badgeColor: "#dc2626", bg: "#fef2f2" },
};

const EMPTY_FORM = {
  title: "",
  badge: "ก.พ. ภาค ก",
  rating: "⭐ 4.9 (แนะนำ)",
  desc: "",
  link: "",
};

export default function AdminResourceModal({ item, onSave, onDelete, onClose }) {
  const isEdit = !!item;
  const [form, setForm] = useState(
    isEdit
      ? { ...item }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});

  function handleChange(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = "กรุณาระบุชื่อหนังสือ/คอร์ส";
    if (!form.link.trim())  errs.link  = "กรุณาระบุลิงก์สั่งซื้อ/Affiliate Link";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const badgeStyle = BADGE_COLOR_MAP[form.badge] || BADGE_COLOR_MAP["ก.พ. ภาค ก"];

    onSave({
      ...form,
      id: isEdit ? item.id : Date.now(),
      badgeColor: badgeStyle.badgeColor,
      bg: badgeStyle.bg,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-up" style={{ maxWidth: 520 }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "✏️ แก้ไขหนังสือ/คอร์สเรียน" : "➕ เพิ่มหนังสือ/คอร์สเรียนใหม่"}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label">ชื่อหนังสือ / คอร์สเรียน <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น หนังสือแนวข้อสอบ ก.พ. ภาค ก 2569"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
              {errors.title && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.title}</p>}
            </div>

            {/* Badge & Rating */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">หมวดหมู่ป้าย</label>
                <select
                  className="form-select"
                  value={form.badge}
                  onChange={(e) => handleChange("badge", e.target.value)}
                >
                  {BADGES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">เรตติ้ง / สถานะ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น ⭐ 4.9 (ขายดีที่สุด)"
                  value={form.rating}
                  onChange={(e) => handleChange("rating", e.target.value)}
                />
              </div>
            </div>

            {/* Link */}
            <div className="form-group">
              <label className="form-label">ลิงก์สั่งซื้อ / Affiliate Link <span className="required">*</span></label>
              <input
                type="url"
                className="form-input"
                placeholder="https://shopee.co.th/..."
                value={form.link}
                onChange={(e) => handleChange("link", e.target.value)}
              />
              {errors.link && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.link}</p>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">รายละเอียดโดยย่อ</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="อธิบายจุดเด่น เช่น สรุปแนวข้อสอบเก็งตรงจุด พร้อมเฉลยละเอียด..."
                value={form.desc}
                onChange={(e) => handleChange("desc", e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: "space-between" }}>
            {isEdit && onDelete ? (
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}
                onClick={() => {
                  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
              >
                🗑️ ลบรายการ
              </button>
            ) : <div />}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary">
                💾 บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
