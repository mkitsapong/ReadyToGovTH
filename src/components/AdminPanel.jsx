import { useState, useRef, useEffect } from "react";
import { regions } from "../data/provinces.js";

const CATEGORIES = ["ข้าราชการ", "พนักงานราชการ", "รัฐวิสาหกิจ", "ลูกจ้างชั่วคราว"];
const EDUCATION = ["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก", "ไม่จำกัดวุฒิ"];

const allProvinces = regions.flatMap((r) => r.provinces);
const uniqueProvinces = [...new Set(allProvinces)].sort((a, b) => a.localeCompare(b, "th"));

const CATEGORY_ICONS = { ข้าราชการ: "🏛️", พนักงานราชการ: "📋", รัฐวิสาหกิจ: "🏢", ลูกจ้างชั่วคราว: "📝" };

const EMPTY_UNIT = { name: "", count: 1, education: "ปริญญาตรี", major: "", details: "" };
const EMPTY_POSITION = { title: "", salary: "", count: 1, education: "ปริญญาตรี", details: "", units: [] };

const EMPTY_FORM = {
  department: "",
  categories: ["ข้าราชการ"],
  provinces: [],
  postedDate: "",
  deadline: "",
  description: "",
  logoUrl: "",
  applyUrl: "",
  announcementUrl: "",
  showBooks: true,
  customBookTitle: "",
  customBookUrl: "",
  isNoOCSC: false,
  isOCSC: false,
  startDate: "",
  positionList: [{ ...EMPTY_POSITION }],
};

export default function AdminPanel({ onAddJob, onUpdateJob, onDeleteJob, onClose, editJob }) {
  const isEditMode = !!editJob;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState(
    isEditMode
      ? {
          department:      editJob.department,
          categories:      editJob.categories ? editJob.categories : (editJob.category ? [editJob.category] : []),
          // backward-compat: สนับสนุนทั้ง provinces array และ province string เก่า
          provinces:       Array.isArray(editJob.provinces)
                             ? editJob.provinces
                             : editJob.province ? [editJob.province] : [],
          postedDate:      editJob.postedDate || "",
          deadline:        editJob.deadline,
          description:     editJob.description || "",
          logoUrl:         editJob.logoUrl || "",
          applyUrl:        editJob.applyUrl || "",
          announcementUrl: editJob.announcementUrl || "",
          showBooks:       editJob.showBooks !== false,
          customBookTitle: editJob.customBookTitle || "",
          customBookUrl:   editJob.customBookUrl || "",
          isNoOCSC:        editJob.isNoOCSC || false,
          isOCSC:          editJob.isOCSC || false,
          startDate:       editJob.startDate || "",
          positionList:    editJob.positionList?.length
            ? editJob.positionList.map((p) => ({ ...p }))
            : [{ ...EMPTY_POSITION }],
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(isEditMode ? editJob.logoUrl || "" : "");
  const [provinceOpen, setProvinceOpen] = useState(false);
  const provinceRef = useRef(null);

  // Close province dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (provinceRef.current && !provinceRef.current.contains(e.target)) setProvinceOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function toggleProvince(prov) {
    setForm((prev) => {
      const list = prev.provinces.includes(prov)
        ? prev.provinces.filter((p) => p !== prov)
        : [...prev.provinces, prov];
      return { ...prev, provinces: list };
    });
    if (errors.provinces) setErrors((prev) => ({ ...prev, provinces: undefined }));
  }

  // ── Logo handlers ──────────────────────────────────────────────────────────
  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("ไฟล์ต้องมีขนาดไม่เกิน 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setForm((prev) => ({ ...prev, logoUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  }
  function clearLogo() {
    setLogoPreview("");
    setForm((prev) => ({ ...prev, logoUrl: "" }));
  }

  // ── Position list handlers ─────────────────────────────────────────────────
  function handlePositionChange(index, field, value) {
    setForm((prev) => {
      const list = [...prev.positionList];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, positionList: list };
    });
    // clear position errors
    if (errors.positionList) setErrors((prev) => ({ ...prev, positionList: undefined }));
  }
  function addPosition() {
    setForm((prev) => ({ ...prev, positionList: [...prev.positionList, { ...EMPTY_POSITION }] }));
  }
  function removePosition(index) {
    setForm((prev) => ({
      ...prev,
      positionList: prev.positionList.filter((_, i) => i !== index),
    }));
  }

  function handleUnitChange(posIndex, unitIndex, field, value) {
    setForm(prev => {
      const list = [...prev.positionList];
      const newPos = { ...list[posIndex] };
      const newUnits = [...(newPos.units || [])];
      newUnits[unitIndex] = { ...newUnits[unitIndex], [field]: value };
      newPos.units = newUnits;
      list[posIndex] = newPos;
      return { ...prev, positionList: list };
    });
  }

  function addUnit(posIndex) {
    setForm(prev => {
      const list = [...prev.positionList];
      const newPos = { ...list[posIndex] };
      newPos.units = [...(newPos.units || []), { ...EMPTY_UNIT }];
      list[posIndex] = newPos;
      return { ...prev, positionList: list };
    });
  }

  function removeUnit(posIndex, unitIndex) {
    setForm(prev => {
      const list = [...prev.positionList];
      const newPos = { ...list[posIndex] };
      newPos.units = (newPos.units || []).filter((_, i) => i !== unitIndex);
      list[posIndex] = newPos;
      return { ...prev, positionList: list };
    });
  }

  // ── Form handlers ──────────────────────────────────────────────────────────
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.department.trim()) e.department = "กรุณาระบุหน่วยงาน";
    if (!form.categories || form.categories.length === 0) e.categories = "กรุณาเลือกประเภทงานอย่างน้อย 1 ประเภท";
    if (!form.deadline)          e.deadline   = "กรุณาระบุวันปิดรับสมัคร";
    if (!form.provinces.length)  e.provinces  = "กรุณาเลือกจังหวัดอย่างน้อย 1 จังหวัด";
    // Validate positionList
    const hasEmpty = form.positionList.some((p) => {
      if (!p.title.trim() || !p.salary.trim()) return true;
      if (p.units && p.units.length > 0) {
        return p.units.some(u => !u.name.trim());
      }
      return false;
    });
    if (hasEmpty) e.positionList = "กรุณากรอกชื่อตำแหน่ง เงินเดือน และชื่อหน่วยงานย่อยให้ครบทุกแถว";
    if (form.positionList.length === 0) e.positionList = "กรุณาเพิ่มตำแหน่งอย่างน้อย 1 ตำแหน่ง";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const positionList = form.positionList.map((p) => {
      let updatedP = { ...p, count: Number(p.count) || 1 };
      if (updatedP.units && updatedP.units.length > 0) {
        updatedP.units = updatedP.units.map(u => ({ ...u, count: Number(u.count) || 1 }));
      }
      return updatedP;
    });

    if (isEditMode) {
      onUpdateJob({ ...editJob, ...form, category: form.categories[0], positionList });
    } else {
      onAddJob({
        ...form,
        category: form.categories[0],
        positionList,
        id: Date.now(),
        requirements: [],
        postedDate: form.postedDate || new Date().toISOString().split("T")[0],
      });
    }
    setLoading(false);
    onClose();
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? "แก้ไขประกาศ" : "เพิ่มประกาศรับสมัครงาน"}
        style={{ maxWidth: 600 }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditMode ? "✏️ แก้ไขประกาศรับสมัครงาน" : "➕ เพิ่มประกาศรับสมัครงาน"}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div className="modal-body">

            {/* Logo Upload */}
            <div className="form-group">
              <label className="form-label">Logo หน่วยงาน</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 64, height: 64,
                    borderRadius: "var(--radius-md)",
                    background: logoPreview ? "var(--gray-100)" : "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", border: "2px dashed var(--gray-300)",
                    flexShrink: 0, cursor: "pointer",
                  }}
                  onClick={() => document.getElementById("logo-upload-input").click()}
                >
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "1.5rem" }}>{CATEGORY_ICONS[form.categories?.[0]] || "🏛️"}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <input id="logo-upload-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    style={{ display: "none" }} onChange={handleLogoChange} />
                  <button type="button" className="btn btn-outline"
                    style={{ fontSize: "0.8rem", padding: "7px 14px", marginBottom: 6 }}
                    onClick={() => document.getElementById("logo-upload-input").click()}>
                    📁 เลือกรูป Logo
                  </button>
                  {logoPreview && (
                    <button type="button" onClick={clearLogo}
                      style={{ marginLeft: 8, background: "none", border: "none", fontSize: "0.78rem", color: "var(--gray-400)", cursor: "pointer", textDecoration: "underline" }}>
                      ลบรูป
                    </button>
                  )}
                  <p style={{ fontSize: "0.72rem", color: "var(--gray-400)", marginTop: 2 }}>PNG, JPG, WEBP, SVG · ไม่เกิน 2 MB</p>
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="form-group">
              <label className="form-label">หน่วยงาน <span className="required">*</span></label>
              <input id="admin-field-department" className="form-input"
                placeholder="เช่น กรมบัญชีกลาง กระทรวงการคลัง"
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)} />
              {errors.department && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.department}</p>}
            </div>

            {/* Category + Province */}
            <div className="form-group">
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ประเภทงาน <span className="required">*</span></label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
                    {CATEGORIES.map((c) => (
                      <label key={c} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.85rem", color: "var(--navy-800)" }}>
                        <input 
                          type="checkbox" 
                          checked={form.categories?.includes(c)}
                          onChange={(e) => {
                            let newCats = [...(form.categories || [])];
                            if (e.target.checked) newCats.push(c);
                            else newCats = newCats.filter(cat => cat !== c);
                            handleChange("categories", newCats);
                          }}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                  {errors.categories && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.categories}</p>}
                  <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.82rem", color: "var(--navy-700)", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={form.isOCSC}
                        onChange={(e) => {
                          handleChange("isOCSC", e.target.checked);
                          if (e.target.checked) handleChange("isNoOCSC", false);
                        }}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      ต้องผ่าน ภาค ก
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.82rem", color: "var(--navy-700)", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={form.isNoOCSC}
                        onChange={(e) => {
                          handleChange("isNoOCSC", e.target.checked);
                          if (e.target.checked) handleChange("isOCSC", false);
                        }}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      ไม่ต้องผ่าน ภาค ก
                    </label>
                  </div>
                </div>

                {/* Multi-select province */}
                <div className="form-group" style={{ marginBottom: 0, position: "relative" }} ref={provinceRef}>
                  <label className="form-label">จังหวัด <span className="required">*</span></label>
                  <button
                    type="button"
                    onClick={() => setProvinceOpen((o) => !o)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "9px 12px",
                      border: `1.5px solid ${errors.provinces ? "var(--accent)" : "var(--gray-200)"}`,
                      borderRadius: "var(--radius-md)",
                      background: "var(--gray-50)",
                      fontSize: "0.85rem",
                      color: form.provinces.length ? "var(--navy-800)" : "var(--gray-400)",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }}>
                      {form.provinces.length === 0
                        ? "เลือกจังหวัด..."
                        : form.provinces.join(", ")}
                    </span>
                    <span style={{ marginLeft: 8, opacity: 0.6 }}>{provinceOpen ? "▲" : "▼"}</span>
                  </button>

                  {/* Selected tags */}
                  {form.provinces.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {form.provinces.map((prov) => (
                        <span key={prov} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", background: "var(--navy-50)",
                          border: "1px solid var(--navy-200)", borderRadius: "999px",
                          fontSize: "0.72rem", color: "var(--navy-700)", fontWeight: 600,
                        }}>
                          📍 {prov}
                          <button
                            type="button"
                            onClick={() => toggleProvince(prov)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "0.75rem", lineHeight: 1, padding: 0 }}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dropdown list grouped by region */}
                  {provinceOpen && (
                    <div style={{
                      position: "absolute", zIndex: 1000, marginTop: 4,
                      background: "var(--white)", border: "1.5px solid var(--gray-200)",
                      borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)",
                      maxHeight: 280, overflowY: "auto", width: "100%",
                    }}>
                      {regions.map((region) => (
                        <div key={region.id}>
                          <div style={{
                            padding: "6px 12px",
                            fontSize: "0.68rem", fontWeight: 700,
                            color: "var(--navy-500)", textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "var(--navy-50)",
                            borderBottom: "1px solid var(--gray-100)",
                            position: "sticky", top: 0,
                          }}>
                            {region.name}
                          </div>
                          {region.provinces.map((prov) => {
                            const selected = form.provinces.includes(prov);
                            return (
                              <button
                                key={prov}
                                type="button"
                                onClick={() => toggleProvince(prov)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 8,
                                  width: "100%", textAlign: "left",
                                  padding: "7px 14px",
                                  background: selected ? "var(--navy-50)" : "transparent",
                                  border: "none", cursor: "pointer",
                                  fontSize: "0.82rem",
                                  color: selected ? "var(--navy-700)" : "var(--gray-700)",
                                  fontWeight: selected ? 600 : 400,
                                  fontFamily: "var(--font-sans)",
                                  borderBottom: "1px solid var(--gray-50)",
                                }}
                              >
                                <span style={{
                                  width: 16, height: 16, flexShrink: 0,
                                  borderRadius: 4,
                                  border: `2px solid ${selected ? "var(--navy-600)" : "var(--gray-300)"}`,
                                  background: selected ? "var(--navy-600)" : "transparent",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "0.6rem", color: "white",
                                }}>
                                  {selected ? "✓" : ""}
                                </span>
                                {prov}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.provinces && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.provinces}</p>}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>

              <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                <label className="form-label">วันเปิดรับสมัคร <span style={{fontSize: "0.7rem", color: "var(--gray-400)", fontWeight: "normal"}}>(ถ้ามี)</span></label>
                <input id="admin-field-startDate" type="date" className="form-input"
                  value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                <label className="form-label">วันปิดรับสมัคร <span className="required">*</span></label>
                <input id="admin-field-deadline" type="date" className="form-input"
                  value={form.deadline} onChange={(e) => handleChange("deadline", e.target.value)} />
                {errors.deadline && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.deadline}</p>}
              </div>
            </div>

            {/* ── Position List ─────────────────────────────────────────── */}
            <div className="form-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  ตำแหน่งที่เปิดรับ <span className="required">*</span>
                </label>
                <button type="button" onClick={addPosition}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px",
                    background: "var(--navy-50)", color: "var(--navy-700)",
                    border: "1.5px dashed var(--navy-300)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.78rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
                  }}>
                  ＋ เพิ่มตำแหน่ง
                </button>
              </div>

              {errors.positionList && (
                <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginBottom: 8 }}>{errors.positionList}</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.positionList.map((pos, i) => (
                  <div key={i} style={{
                    padding: "12px 14px",
                    background: "var(--gray-50)",
                    border: "1.5px solid var(--gray-200)",
                    borderRadius: "var(--radius-lg)",
                    position: "relative",
                  }}>
                    {/* Row number */}
                    <div style={{
                      position: "absolute", top: -10, left: 12,
                      background: "var(--navy-700)", color: "white",
                      fontSize: "0.68rem", fontWeight: 700,
                      padding: "2px 8px", borderRadius: "999px",
                    }}>
                      ตำแหน่งที่ {i + 1}
                    </div>

                    {/* Remove button */}
                    {form.positionList.length > 1 && (
                      <button type="button" onClick={() => removePosition(i)}
                        style={{
                          position: "absolute", top: 8, right: 10,
                          background: "none", border: "none",
                          fontSize: "1rem", color: "var(--gray-400)",
                          cursor: "pointer", lineHeight: 1,
                        }}
                        title="ลบตำแหน่งนี้">✕</button>
                    )}

                    {/* Title */}
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label className="form-label" style={{ fontSize: "0.72rem" }}>ชื่อตำแหน่ง *</label>
                      <input className="form-input"
                        placeholder="เช่น นักวิเคราะห์นโยบายและแผน"
                        value={pos.title}
                        onChange={(e) => handlePositionChange(i, "title", e.target.value)} />
                    </div>

                    {/* Salary + Count + Education */}
                    {/* Salary + Count + Education (only if no units) */}
                    <div style={{ display: "grid", gridTemplateColumns: (!pos.units || pos.units.length === 0) ? "1fr 80px 1fr" : "1fr", gap: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: "0.72rem" }}>เงินเดือน *</label>
                        <input className="form-input" placeholder="เช่น 15,000"
                          value={pos.salary}
                          onChange={(e) => handlePositionChange(i, "salary", e.target.value)}
                          onBlur={(e) => {
                            let val = e.target.value.trim();
                            if (val) {
                              let text = val.replace(/บาท/g, "").trim();
                              let formatted = text.replace(/\b\d+(?:,\d+)*\b/g, (match) => {
                                const num = parseInt(match.replace(/,/g, ""), 10);
                                return isNaN(num) ? match : num.toLocaleString("th-TH");
                              });
                              handlePositionChange(i, "salary", formatted + " บาท");
                            }
                          }}
                        />
                      </div>
                      {(!pos.units || pos.units.length === 0) && (
                        <>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.72rem" }}>อัตรา</label>
                            <input type="number" min="1" className="form-input"
                              value={pos.count}
                              onChange={(e) => handlePositionChange(i, "count", e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: "0.72rem" }}>วุฒิที่ต้องการ</label>
                            <select className="form-select"
                              value={pos.education}
                              onChange={(e) => handlePositionChange(i, "education", e.target.value)}>
                              {EDUCATION.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Details (only if no units) */}
                    {(!pos.units || pos.units.length === 0) && (
                      <div className="form-group" style={{ marginBottom: 0, marginTop: 8 }}>
                        <label className="form-label" style={{ fontSize: "0.72rem" }}>รายละเอียดตำแหน่ง (คุณสมบัติเฉพาะ)</label>
                        <textarea className="form-textarea"
                          placeholder="เช่น อัตราเงินเดือนระหว่าง 25,410 – 27,960 บาท&#10;คุณสมบัติเฉพาะ: ได้รับปริญญาในสาขาวิชา..."
                          rows={2}
                          style={{ fontSize: "0.8rem", resize: "vertical" }}
                          value={pos.details || ""}
                          onChange={(e) => handlePositionChange(i, "details", e.target.value)} />
                      </div>
                    )}

                    {/* Units Section */}
                    {pos.units && pos.units.length > 0 && (
                      <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: "2px solid var(--accent-light)" }}>
                        {pos.units.map((unit, uIdx) => (
                          <div key={uIdx} style={{ marginBottom: 12, position: "relative" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 8, marginBottom: 4 }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--navy-600)" }}>สถานที่ / หน่วยงานย่อย *</label>
                                <input className="form-input" style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                  placeholder="เช่น หน่วยที่ 1 (จำนวน 1 อัตรา)"
                                  value={unit.name}
                                  onChange={(e) => handleUnitChange(i, uIdx, "name", e.target.value)} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--navy-600)" }}>อัตรา</label>
                                <input type="number" min="1" className="form-input" style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                  value={unit.count}
                                  onChange={(e) => handleUnitChange(i, uIdx, "count", e.target.value)} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", marginBottom: "10px" }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--navy-600)" }}>วุฒิที่ต้องการ</label>
                                <select className="form-select" style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                  value={unit.education}
                                  onChange={(e) => handleUnitChange(i, uIdx, "education", e.target.value)}>
                                  {EDUCATION.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
                                </select>
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--navy-600)" }}>สาขาวิชา (ถ้ามี)</label>
                                <input className="form-input" style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                  placeholder="เช่น วิศวกรรมศาสตร์, คอมพิวเตอร์..."
                                  value={unit.major || ""}
                                  onChange={(e) => handleUnitChange(i, uIdx, "major", e.target.value)} />
                              </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: "0.7rem", color: "var(--navy-600)" }}>ลักษณะงาน</label>
                              <textarea className="form-textarea"
                                placeholder="เช่น งานสารบรรณ รับ-ส่งเอกสาร..."
                                rows={2}
                                style={{ fontSize: "0.75rem", resize: "vertical", padding: "6px 10px" }}
                                value={unit.details || ""}
                                onChange={(e) => handleUnitChange(i, uIdx, "details", e.target.value)} />
                            </div>
                            <button type="button" onClick={() => removeUnit(i, uIdx)}
                              style={{
                                position: "absolute", top: 2, right: -24,
                                background: "none", border: "none",
                                fontSize: "0.9rem", color: "var(--gray-400)",
                                cursor: "pointer", lineHeight: 1,
                              }}
                              title="ลบหน่วยนี้">✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 8 }}>
                      <button type="button" onClick={() => addUnit(i)}
                        style={{
                          background: "none", border: "1px dashed var(--gray-300)",
                          color: "var(--navy-600)", fontSize: "0.75rem", fontWeight: 600,
                          padding: "6px 12px", borderRadius: "var(--radius-md)",
                          cursor: "pointer", width: "100%"
                        }}>
                        ＋ เพิ่มหน่วยงานย่อย / สถานที่ปฏิบัติงาน
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">รายละเอียดการรับสมัคร</label>
              <textarea id="admin-field-description" className="form-textarea"
                placeholder="อธิบายลักษณะงาน คุณสมบัติ และเงื่อนไขการสมัคร..."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)} />
            </div>

            {/* Links */}
            <div className="form-group">
              <label className="form-label">📄 ลิงก์ PDF ประกาศรับสมัคร</label>
              <input id="admin-field-announcement-url" className="form-input"
                placeholder="วาง URL โดยตรง เช่น https://... (.pdf)"
                value={form.announcementUrl}
                onChange={(e) => handleChange("announcementUrl", e.target.value)} />
              <p style={{ fontSize: "0.72rem", color: "var(--gray-400)", marginTop: 4 }}>เมื่อกรอกแล้ว จะแสดงปุ่ม "ประกาศรับสมัคร" ในหน้ารายละเอียด</p>
            </div>
            <div className="form-group">
              <label className="form-label">🔗 ลิงก์สมัครงาน</label>
              <input id="admin-field-apply-url" className="form-input"
                placeholder="วาง URL สำหรับสมัครงานออนไลน์ เช่น https://..."
                value={form.applyUrl || ""}
                onChange={(e) => handleChange("applyUrl", e.target.value)} />
            </div>

            {/* Toggle showBooks & Custom Book URL */}
            <div className="form-group" style={{ background: "var(--navy-50)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--navy-100)", marginTop: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--navy-800)", margin: 0 }}>
                <input
                  type="checkbox"
                  checked={form.showBooks !== false}
                  onChange={(e) => handleChange("showBooks", e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                📚 แสดงกล่องแนะนำหนังสือ & คอร์สติวในป๊อปอัปประกาศนี้
              </label>

              {form.showBooks !== false && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--navy-200)", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "0.78rem" }}>
                      📖 ชื่อหนังสือ / คอร์สติวสำหรับตำแหน่งนี้ <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>(ระบุเฉพาะ หรือเว้นว่างเพื่อใช้ชุดมาตรฐาน)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: "0.82rem", padding: "8px 12px" }}
                      placeholder="เช่น คู่มือสอบวิศวกรไฟฟ้า หรือ สรุปข้อสอบเฉพาะตำแหน่ง"
                      value={form.customBookTitle || ""}
                      onChange={(e) => handleChange("customBookTitle", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: "0.78rem" }}>
                      🔗 ลิงก์สั่งซื้อหนังสือ / คอร์สติวเฉพาะประกาศนี้ <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>(Affiliate URL)</span>
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      style={{ fontSize: "0.82rem", padding: "8px 12px" }}
                      placeholder="วาง URL เช่น https://shopee.co.th/... หรือ https://..."
                      value={form.customBookUrl || ""}
                      onChange={(e) => handleChange("customBookUrl", e.target.value)}
                    />
                    <p style={{ fontSize: "0.72rem", color: "var(--navy-600)", marginTop: 4 }}>
                      💡 หากกรอก URL ลิงก์นี้จะแสดงเด่นในป๊อปอัปของประกาศตำแหน่งนี้โดยเฉพาะ
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            {/* Delete */}
            {isEditMode && (
              confirmDelete ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
                  <span style={{ fontSize: "0.82rem", color: "#dc2626" }}>ยืนยันลบประกาศ?</span>
                  <button type="button"
                    style={{ padding: "7px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
                    onClick={() => { onDeleteJob(editJob.id); onClose(); }}>
                    ยืนยัน
                  </button>
                  <button type="button" className="btn btn-outline"
                    style={{ padding: "7px 14px", fontSize: "0.82rem" }}
                    onClick={() => setConfirmDelete(false)}>
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button type="button" id="admin-delete-btn"
                  style={{ padding: "8px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "var(--radius-md)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", marginRight: "auto", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
                  onClick={() => setConfirmDelete(true)}>
                  🗑️ ลบประกาศ
                </button>
              )
            )}

            <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
            <button id="admin-submit-btn" type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? "⏳ กำลังบันทึก..." : isEditMode ? "💾 บันทึกการแก้ไข" : "💾 บันทึกประกาศ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
