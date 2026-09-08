import { useState, useRef, useEffect, useCallback } from "react";
import { regions } from "../data/provinces.js";
import AdminAIExtractor from "./AdminAIExtractor.jsx";
import SocialPosterModal from "./SocialPosterModal.jsx";
import { findOfficialGovLogo } from "../utils/logoHelper.js";
import { findDuplicateOrExtensionJob } from "../utils/duplicateDetector.js";
import { formatDate } from "../utils/helpers.js";
import {
  convertExternalImageToBase64,
  resizeAndOptimizeImage,
  removeWhiteBackground,
} from "../utils/imageHelper.js";

const CATEGORIES = ["ข้าราชการ", "พนักงานราชการ", "รัฐวิสาหกิจ", "ลูกจ้างชั่วคราว", "พนักงานหน่วยงานของรัฐ"];
const EDUCATION = ["ม.3", "ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก", "ไม่จำกัดวุฒิ"];

const CATEGORY_ICONS = { ข้าราชการ: "🏛️", พนักงานราชการ: "📋", รัฐวิสาหกิจ: "🏢", ลูกจ้างชั่วคราว: "📝", พนักงานหน่วยงานของรัฐ: "🏫" };

const EMPTY_UNIT = { name: "", count: 1, education: ["ปริญญาตรี"], major: "", details: "" };
const EMPTY_POSITION = { title: "", salary: "", count: 1, education: ["ปริญญาตรี"], details: "", units: [] };

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

export default function AdminPanel({ onAddJob, onUpdateJob, onDeleteJob, onClose, editJob, jobs = [] }) {
  const [activeEditJob, setActiveEditJob] = useState(editJob);
  const isEditMode = !!activeEditJob;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [posterJob, setPosterJob] = useState(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [extractedCache, setExtractedCache] = useState(null);

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
            ? editJob.positionList.map((p) => ({
                ...p,
                education: Array.isArray(p.education) ? p.education : (p.education ? [p.education] : []),
                units: p.units ? p.units.map((u) => ({
                  ...u,
                  education: Array.isArray(u.education) ? u.education : (u.education ? [u.education] : []),
                })) : []
              }))
            : [{ ...EMPTY_POSITION }],
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedPosIndex, setExpandedPosIndex] = useState(0);
  const [logoPreview, setLogoPreview] = useState(isEditMode ? editJob.logoUrl || "" : "");
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [originalLogo, setOriginalLogo] = useState(null);
  const [hasCutBg, setHasCutBg] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState(null);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const provinceRef = useRef(null);
  const logoConvertTimerRef = useRef(null);
  const logoFeedbackTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (logoConvertTimerRef.current) clearTimeout(logoConvertTimerRef.current);
      if (logoFeedbackTimerRef.current) clearTimeout(logoFeedbackTimerRef.current);
    };
  }, []);

  const showLogoFeedback = useCallback((text, type = "success") => {
    if (logoFeedbackTimerRef.current) clearTimeout(logoFeedbackTimerRef.current);
    setLogoFeedback({ text, type });
    logoFeedbackTimerRef.current = setTimeout(() => {
      setLogoFeedback(null);
    }, 3500);
  }, []);

  // Auto-convert external logo URL to base64 for reliable preview
  const tryConvertLogo = useCallback(async (url) => {
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) return;
    setLogoLoading(true);
    setLogoError(false);
    try {
      const base64 = await convertExternalImageToBase64(url, 8000);
      setLogoPreview(base64);
      if (base64 && base64.startsWith("data:")) {
        setForm((prev) => ({ ...prev, logoUrl: base64 }));
      }
      setLogoError(false);
    } catch {
      setLogoError(true);
    } finally {
      setLogoLoading(false);
    }
  }, []);

  // Close province dropdown on outside click or ESC
  useEffect(() => {
    function handleMouseDown(e) {
      if (provinceRef.current && !provinceRef.current.contains(e.target)) setProvinceOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (provinceOpen) {
          setProvinceOpen(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [provinceOpen, onClose]);

  function toggleProvince(prov) {
    setForm((prev) => {
      const list = prev.provinces.includes(prov)
        ? prev.provinces.filter((p) => p !== prov)
        : [...prev.provinces, prov];
      return { ...prev, provinces: list };
    });
    if (errors.provinces) setErrors((prev) => ({ ...prev, provinces: undefined }));
  }

  function handleAIExtracted(extractedData) {
    const resolvedLogo = extractedData.logoUrl || (extractedData.department ? findOfficialGovLogo(extractedData.department) : "");
    if (resolvedLogo) {
      setLogoPreview(resolvedLogo);
    }
    setForm((prev) => ({
      ...prev,
      department: extractedData.department || prev.department,
      logoUrl: resolvedLogo || prev.logoUrl,
      categories: extractedData.categories?.length ? extractedData.categories : prev.categories,
      provinces: extractedData.provinces?.length ? extractedData.provinces : prev.provinces,
      startDate: extractedData.startDate || prev.startDate,
      deadline: extractedData.deadline || prev.deadline,
      postedDate: extractedData.postedDate || prev.postedDate,
      isNoOCSC: typeof extractedData.isNoOCSC === "boolean" ? extractedData.isNoOCSC : prev.isNoOCSC,
      isOCSC: typeof extractedData.isOCSC === "boolean" ? extractedData.isOCSC : prev.isOCSC,
      applyUrl: extractedData.applyUrl || prev.applyUrl,
      announcementUrl: extractedData.announcementUrl || prev.announcementUrl,
      description: extractedData.description || prev.description,
      positionList: extractedData.positionList?.length ? extractedData.positionList : prev.positionList,
    }));
    setErrors({});

    // Check for duplicate or extension against existing jobs in database
    setExtractedCache(extractedData);
    const match = findDuplicateOrExtensionJob(extractedData, jobs, activeEditJob?.id);
    if (match) {
      setDuplicateInfo(match);
    } else {
      setDuplicateInfo(null);
    }
  }

  function handleApplyExtension() {
    if (!duplicateInfo) return;
    const existing = duplicateInfo.existingJob;
    // Switch to editing the existing job
    setActiveEditJob(existing);

    // Merge new extracted deadline and other fields while preserving existing ones
    setForm((prev) => ({
      ...prev,
      deadline: duplicateInfo.newDeadline || existing.deadline || prev.deadline,
      announcementUrl: extractedCache?.announcementUrl
        ? (existing.announcementUrl && !existing.announcementUrl.includes(extractedCache.announcementUrl)
            ? `${existing.announcementUrl}, ${extractedCache.announcementUrl}`
            : extractedCache.announcementUrl)
        : existing.announcementUrl || prev.announcementUrl,
      department: existing.department || prev.department,
      categories: existing.categories || prev.categories,
      provinces: existing.provinces || prev.provinces,
      positionList: extractedCache?.positionList?.length
        ? extractedCache.positionList
        : existing.positionList || prev.positionList,
    }));

    showLogoFeedback(
      `📅 สลับเข้าสู่โหมดอัปเดตงานเดิมแล้ว! ขยายวันรับสมัครเป็น ${formatDate(duplicateInfo.newDeadline)} เรียบร้อย`
    );
    setDuplicateInfo(null);
  }

  function handleDismissDuplicate() {
    setDuplicateInfo(null);
    showLogoFeedback("➕ จะบันทึกเป็นประกาศใหม่แยกต่างหาก", "info");
  }

  function handleManualCheckDuplicate() {
    const checkData = {
      department: form.department,
      positionList: form.positionList,
      deadline: form.deadline,
    };
    const match = findDuplicateOrExtensionJob(checkData, jobs, activeEditJob?.id);
    if (match) {
      setDuplicateInfo(match);
      setExtractedCache(checkData);
    } else {
      showLogoFeedback("✅ ไม่พบประกาศงานซ้ำในระบบ สามารถลงประกาศได้ทันที!", "success");
    }
  }

  function handleAutoDetectLogo() {
    if (!form.department || !form.department.trim()) {
      alert("กรุณาระบุชื่อหน่วยงานก่อนค้นหาโลโก้");
      return;
    }
    const foundLogo = findOfficialGovLogo(form.department);
    setForm((prev) => ({ ...prev, logoUrl: foundLogo }));
    setLogoPreview(foundLogo);
    if (foundLogo && !foundLogo.startsWith("data:")) {
      tryConvertLogo(foundLogo);
    }
  }


  // ── Logo handlers & Clipboard Paste ─────────────────────────────────────────
  const processImageFile = useCallback(async (file, sourceName = "Clipboard") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("ไฟล์ที่เลือกไม่ใช่รูปภาพ กรุณาใช้ไฟล์รูปภาพ (PNG, JPG, WEBP, SVG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์รูปภาพมีขนาดเกิน 5 MB");
      return;
    }
    setLogoLoading(true);
    setLogoError(false);
    try {
      // Resize & optimize to max 400x400 to keep base64 compact for Firestore
      const base64 = await resizeAndOptimizeImage(file, 400);
      setLogoPreview(base64);
      setForm((prev) => ({ ...prev, logoUrl: base64 }));
      setOriginalLogo(base64);
      setHasCutBg(false);
      setLogoError(false);
      showLogoFeedback(`📋 วางรูปจาก ${sourceName} สำเร็จ!`);
    } catch (err) {
      console.error("Failed to process image:", err);
      alert("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
      setLogoError(true);
    } finally {
      setLogoLoading(false);
    }
  }, [showLogoFeedback]);

  const handleLogoPaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file, "Clipboard (Ctrl+V)");
        }
        return;
      }
    }
  }, [processImageFile]);

  // Global paste handler: allows pressing Ctrl+V anywhere inside the modal when an image was copied
  useEffect(() => {
    function handleWindowPaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;

      let imageItem = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          imageItem = items[i];
          break;
        }
      }
      if (!imageItem) return;

      // Don't hijack if user is pasting text into a regular text input or textarea
      const activeEl = document.activeElement;
      const isOtherTextInput = activeEl && (
        (activeEl.tagName === "INPUT" && activeEl.id !== "admin-field-logo-url") ||
        activeEl.tagName === "TEXTAREA"
      );
      if (isOtherTextInput && e.clipboardData.types.includes("text/plain")) {
        return;
      }

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        processImageFile(file, "Clipboard (Ctrl+V)");
      }
    }

    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, [processImageFile]);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, "การลากวาง (Drag & Drop)");
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file, "ไฟล์เครื่อง");
  }

  function clearLogo() {
    setLogoPreview("");
    setForm((prev) => ({ ...prev, logoUrl: "" }));
    setOriginalLogo(null);
    setHasCutBg(false);
    setLogoError(false);
  }

  async function handleRemoveWhiteBg() {
    if (!logoPreview || logoLoading) return;
    setLogoLoading(true);
    try {
      if (!originalLogo) {
        setOriginalLogo(logoPreview);
      }
      const transparentPng = await removeWhiteBackground(logoPreview, 38);
      setLogoPreview(transparentPng);
      setForm((prev) => ({ ...prev, logoUrl: transparentPng }));
      setHasCutBg(true);
      showLogoFeedback("✂️ ตัดพื้นหลังสีขาวโปร่งใสเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Error removing white background:", err);
      alert("ไม่สามารถตัดพื้นหลังได้ หรือรูปภาพติดข้อจำกัด CORS กรุณาแคปภาพแล้วกด Ctrl+V แทน");
    } finally {
      setLogoLoading(false);
    }
  }

  function handleUndoRemoveBg() {
    if (originalLogo) {
      setLogoPreview(originalLogo);
      setForm((prev) => ({ ...prev, logoUrl: originalLogo }));
      setHasCutBg(false);
      showLogoFeedback("↩️ คืนค่ารูปต้นฉบับเรียบร้อยแล้ว", "info");
    }
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
    setForm((prev) => {
      const newList = [...prev.positionList, { ...EMPTY_POSITION }];
      setExpandedPosIndex(newList.length - 1);
      return { ...prev, positionList: newList };
    });
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
    if (Object.keys(errs).length > 0) { 
      setErrors(errs); 
      // alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      
      setTimeout(() => {
        const firstError = Object.keys(errs)[0];
        let elId = "";
        if (firstError === "department") elId = "admin-field-department";
        else if (firstError === "categories") elId = "admin-field-categories";
        else if (firstError === "provinces") elId = "admin-field-provinces";
        else if (firstError === "deadline") elId = "admin-field-deadline";
        else if (firstError === "positionList") elId = "admin-field-positionList";
        
        if (elId) {
          const el = document.getElementById(elId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (el.focus) el.focus();
            
            // Add a temporary highlight effect
            const originalOutline = el.style.outline;
            el.style.outline = "2px solid var(--accent)";
            setTimeout(() => {
              el.style.outline = originalOutline;
            }, 2000);
          }
        }
      }, 100);
      return; 
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const positionList = form.positionList.map((p) => {
      const units = p.units && p.units.length > 0
        ? p.units.map((u) => ({ ...u, count: Number(u.count) || 1 }))
        : [];
      const count = units.length > 0
        ? units.reduce((s, u) => s + (Number(u.count) || 1), 0)
        : (Number(p.count) || 1);

      return {
        ...p,
        count,
        units
      };
    });

    const savedJobData = isEditMode
      ? { ...(activeEditJob || editJob), ...form, category: form.categories[0], positionList }
      : {
          ...form,
          category: form.categories[0],
          positionList,
          id: Date.now(),
          requirements: [],
          postedDate: form.postedDate || new Date().toISOString().split("T")[0],
        };

    if (isEditMode) {
      onUpdateJob(savedJobData);
    } else {
      onAddJob(savedJobData);
    }
    setLoading(false);
    // Launch Social Media Poster directly for the newly saved job!
    setPosterJob(savedJobData);
    setIsSavedSuccess(true);
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? "แก้ไขประกาศ" : "เพิ่มประกาศรับสมัครงาน"}
        style={{ maxWidth: 900, width: "95%", maxHeight: "95vh" }}
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

            {/* AI Extractor Component */}
            <AdminAIExtractor onExtracted={handleAIExtracted} defaultOpen={!isEditMode} />

            {/* Duplicate & Extension Detector Card */}
            {duplicateInfo && (
              <div className="duplicate-detector-card animate-fade-up">
                <div className="duplicate-detector-header">
                  <span className="duplicate-detector-icon">
                    {duplicateInfo.isExtension ? "📅" : "⚠️"}
                  </span>
                  <div className="duplicate-detector-title-group">
                    <h3 className="duplicate-detector-title">
                      {duplicateInfo.isExtension 
                        ? "ตรวจพบประกาศนี้ขยายเวลารับสมัคร! (มีงานเดิมในระบบ)" 
                        : "ตรวจพบประกาศงานที่มีอยู่แล้วในระบบ!"}
                      {duplicateInfo.isExtension && (
                        <span className="duplicate-badge-ext">
                          ขยายเวลา +{duplicateInfo.daysExtended} วัน 🚀
                        </span>
                      )}
                    </h3>
                    <p className="duplicate-detector-desc">
                      หน่วยงาน <strong>{duplicateInfo.existingJob.department}</strong> เคยลงประกาศไว้แล้วเมื่อวันที่ {formatDate(duplicateInfo.postedDate)}
                    </p>
                  </div>
                </div>

                {/* Comparison Grid */}
                <div className="duplicate-compare-grid">
                  <div className="duplicate-compare-box">
                    <span className="duplicate-compare-badge existing">📁 ข้อมูลเดิมในระบบ (ID: {duplicateInfo.existingJob.id})</span>
                    <div className="duplicate-compare-row">
                      <strong>ตำแหน่ง:</strong> {duplicateInfo.existingJob.positionList?.[0]?.title} {duplicateInfo.existingJob.positionList?.length > 1 && `(+${duplicateInfo.existingJob.positionList.length - 1} ตำแหน่ง)`}
                    </div>
                    <div className="duplicate-compare-row">
                      <strong>กำหนดเดิม:</strong> {formatDate(duplicateInfo.oldDeadline)}
                    </div>
                    <div className="duplicate-compare-row">
                      <strong>จำนวนรับ:</strong> {duplicateInfo.existingJob.positionList?.reduce((s, p) => s + (Number(p.count) || 1), 0)} อัตรา
                    </div>
                  </div>

                  <div className="duplicate-compare-box" style={{ borderLeft: "3px solid #16a34a" }}>
                    <span className="duplicate-compare-badge new">📄 ข้อมูลใหม่ที่ AI ตรวจพบ</span>
                    <div className="duplicate-compare-row">
                      <strong>ตำแหน่ง:</strong> {extractedCache?.positionList?.[0]?.title || form.positionList?.[0]?.title} {(extractedCache?.positionList?.length || form.positionList?.length) > 1 && `(+${(extractedCache?.positionList?.length || form.positionList?.length) - 1} ตำแหน่ง)`}
                    </div>
                    <div className="duplicate-compare-row">
                      <strong>กำหนดใหม่:</strong> <span style={{ color: "#15803d", fontWeight: 700 }}>{formatDate(duplicateInfo.newDeadline)}</span>
                    </div>
                    <div className="duplicate-compare-row">
                      <strong>จำนวนรับ:</strong> {(extractedCache?.positionList || form.positionList)?.reduce((s, p) => s + (Number(p.count) || 1), 0)} อัตรา
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="duplicate-detector-actions">
                  <button
                    type="button"
                    className="btn-dup-primary"
                    onClick={handleApplyExtension}
                  >
                    <span>🔄</span>
                    <span>{duplicateInfo.isExtension ? "อัปเดตขยายวันรับสมัครงานเดิม (แนะนำ)" : "อัปเดตข้อมูลทับงานเดิม"}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-dup-secondary"
                    onClick={handleDismissDuplicate}
                  >
                    <span>➕</span>
                    <span>สร้างเป็นประกาศใหม่แยกต่างหาก</span>
                  </button>

                  <button
                    type="button"
                    className="btn-dup-ghost"
                    onClick={() => setDuplicateInfo(null)}
                  >
                    ✕ ซ่อนการแจ้งเตือน
                  </button>
                </div>
              </div>
            )}

            {/* Logo Upload, Clipboard Paste, or URL */}
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Logo หน่วยงาน</label>
                <span style={{ fontSize: "0.72rem", color: "var(--primary-600)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  📋 กดแคปภาพแล้วกด <strong>Ctrl + V</strong> วางได้ทันที
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Interactive Logo Box: Dropzone & Paste Target */}
                <div
                  tabIndex={0}
                  role="button"
                  aria-label="กล่องโลโก้หน่วยงาน กดคลิกหรือกด Ctrl+V เพื่อวางรูปภาพ หรือลากไฟล์มาวาง"
                  title="คลิกเพื่อเลือกไฟล์ หรือกดคลิกแล้วกด Ctrl+V เพื่อวางภาพ หรือลากไฟล์มาวาง"
                  onPaste={handleLogoPaste}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("logo-upload-input").click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      document.getElementById("logo-upload-input").click();
                    }
                  }}
                  style={{
                    width: 72, height: 72,
                    borderRadius: "var(--radius-md)",
                    background: isDraggingLogo
                      ? "rgba(59, 130, 246, 0.14)"
                      : logoPreview && !logoError
                      ? "var(--gray-100)"
                      : "linear-gradient(135deg, var(--navy-700), var(--navy-500))",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                    border: `2px dashed ${
                      isDraggingLogo
                        ? "var(--primary-500)"
                        : logoError
                        ? "#ef4444"
                        : "var(--gray-300)"
                    }`,
                    flexShrink: 0,
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.18s ease",
                    boxShadow: isDraggingLogo ? "0 0 0 4px rgba(59, 130, 246, 0.25)" : "none",
                    outline: "none",
                  }}
                >
                  {logoLoading ? (
                    <span style={{ fontSize: "0.65rem", color: logoPreview ? "var(--gray-700)" : "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 1.3, fontWeight: 600 }}>
                      ⏳<br/>ประมวลผล...
                    </span>
                  ) : isDraggingLogo ? (
                    <span style={{ fontSize: "0.65rem", color: "var(--primary-600)", fontWeight: 700, textAlign: "center" }}>
                      📥<br/>ปล่อยรูป
                    </span>
                  ) : logoPreview && !logoError ? (
                    <img
                      src={logoPreview}
                      alt="logo"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        if (form.logoUrl && !form.logoUrl.startsWith("data:")) {
                          tryConvertLogo(form.logoUrl);
                        } else {
                          setLogoError(true);
                        }
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }}
                    />
                  ) : (
                    <>
                      <span style={{ fontSize: "1.4rem" }}>{CATEGORY_ICONS[form.categories?.[0]] || "🏛️"}</span>
                      <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.75)", marginTop: 2, fontWeight: 600 }}>
                        Ctrl+V
                      </span>
                    </>
                  )}
                </div>

                {/* Input Controls */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      id="logo-upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      style={{ display: "none" }}
                      onChange={handleLogoChange}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: "0.8rem", padding: "6px 12px", flexShrink: 0, height: 34 }}
                      onClick={() => document.getElementById("logo-upload-input").click()}
                    >
                      📁 อัปโหลดรูป
                    </button>
                    <span style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>หรือ</span>
                    <input
                      id="admin-field-logo-url"
                      type="text"
                      placeholder="ใส่ลิงก์รูปภาพ (URL) หรือกด Ctrl+V ที่นี่"
                      className="form-input"
                      style={{ flex: 1, minWidth: 150, padding: "6px 10px", fontSize: "0.8rem", height: 34 }}
                      value={form.logoUrl || ""}
                      onPaste={handleLogoPaste}
                      onChange={(e) => {
                        const url = e.target.value;
                        setForm((prev) => ({ ...prev, logoUrl: url }));
                        setLogoPreview(url);
                        setLogoError(false);
                        setOriginalLogo(null);
                        setHasCutBg(false);
                        // Debounce: auto-convert after user stops typing
                        clearTimeout(logoConvertTimerRef.current);
                        if (url && url.startsWith("http")) {
                          logoConvertTimerRef.current = setTimeout(() => tryConvertLogo(url), 800);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAutoDetectLogo}
                      title="ค้นหาโลโก้ทางการจากชื่อหน่วยงาน"
                      style={{
                        background: "rgba(234,88,12,0.1)",
                        border: "1px solid rgba(234,88,12,0.3)",
                        color: "#ea580c",
                        borderRadius: "var(--radius-sm)",
                        padding: "6px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        height: 34,
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      ✨ หาโลโก้
                    </button>

                    {/* 1-Click Auto Remove White Background */}
                    {logoPreview && !logoError && (
                      <button
                        type="button"
                        onClick={handleRemoveWhiteBg}
                        disabled={logoLoading}
                        title="ลบขอบสี่เหลี่ยมสีขาวรอบโลโก้อัตโนมัติให้โปร่งใส (Transparent PNG)"
                        style={{
                          background: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                          color: "#059669",
                          borderRadius: "var(--radius-sm)",
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: logoLoading ? "wait" : "pointer",
                          height: 34,
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 0.15s ease"
                        }}
                      >
                        {logoLoading ? "⏳ กำลังตัด..." : "✂️ ตัดพื้นหลังขาว"}
                      </button>
                    )}

                    {/* Undo Cut Background */}
                    {hasCutBg && originalLogo && (
                      <button
                        type="button"
                        onClick={handleUndoRemoveBg}
                        title="คืนค่ารูปภาพก่อนตัดพื้นหลัง"
                        style={{
                          background: "rgba(107, 114, 128, 0.1)",
                          border: "1px solid var(--gray-300)",
                          color: "var(--gray-600)",
                          borderRadius: "var(--radius-sm)",
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          height: 34,
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: 4
                        }}
                      >
                        ↩️ คืนค่าเดิม
                      </button>
                    )}

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={clearLogo}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "0.78rem",
                          color: "var(--gray-400)",
                          cursor: "pointer",
                          textDecoration: "underline",
                          flexShrink: 0
                        }}
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>

                  {/* Helper Tips & Feedback Toast */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    <p style={{ fontSize: "0.72rem", color: "var(--gray-400)", margin: 0 }}>
                      📋 <strong>ลัดไว:</strong> แคปภาพจากเว็บหรือประกาศ (Snipping Tool) แล้วกด <strong>Ctrl+V</strong> ที่กล่องโลโก้ได้ทันที • ลากไฟล์มาวางได้
                    </p>
                    {logoFeedback && (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          color: logoFeedback.type === "info" ? "var(--primary-600)" : "#059669",
                          background: logoFeedback.type === "info" ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)",
                          border: `1px solid ${logoFeedback.type === "info" ? "rgba(59, 130, 246, 0.25)" : "rgba(16, 185, 129, 0.3)"}`,
                          borderRadius: "var(--radius-sm)",
                          padding: "2px 8px"
                        }}
                      >
                        {logoFeedback.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label className="form-label" style={{ margin: 0 }}>หน่วยงาน <span className="required">*</span></label>
                {form.department && (
                  <button
                    type="button"
                    onClick={handleManualCheckDuplicate}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-600)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "underline",
                    }}
                    title="กดเพื่อตรวจสอบว่ามีประกาศของหน่วยงานนี้อยู่ในระบบแล้วหรือไม่"
                  >
                    🔍 ตรวจสอบงานซ้ำในระบบ
                  </button>
                )}
              </div>
              <input id="admin-field-department" className="form-input"
                placeholder="เช่น กรมบัญชีกลาง กระทรวงการคลัง"
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)} />
              {errors.department && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.department}</p>}
            </div>

            {/* Category + Province */}
            <div className="form-group">
              <div className="form-grid-2">
                <div id="admin-field-categories" className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ประเภทงาน <span className="required">*</span></label>
                  <div className="admin-checkbox-group" style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
                    {CATEGORIES.map((c) => (
                      <label key={c} className="admin-checkbox-label">
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
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                  {errors.categories && <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: 4 }}>{errors.categories}</p>}
                  <div className="admin-ocsc-group" style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.isOCSC}
                        onChange={(e) => {
                          handleChange("isOCSC", e.target.checked);
                          if (e.target.checked) handleChange("isNoOCSC", false);
                        }}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      <span>ต้องผ่าน ภาค ก</span>
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.isNoOCSC}
                        onChange={(e) => {
                          handleChange("isNoOCSC", e.target.checked);
                          if (e.target.checked) handleChange("isOCSC", false);
                        }}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                      <span>ไม่ต้องผ่าน ภาค ก</span>
                    </label>
                  </div>
                </div>

                {/* Multi-select province */}
                <div className="form-group" style={{ marginBottom: 0, position: "relative" }} ref={provinceRef}>
                  <label className="form-label">จังหวัด <span className="required">*</span></label>
                  <button
                    id="admin-field-provinces"
                    type="button"
                    onClick={() => setProvinceOpen((o) => !o)}
                    className="admin-province-select-btn"
                    style={{
                      border: `1.5px solid ${errors.provinces ? "var(--accent)" : "var(--gray-200)"}`,
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
                        <span key={prov} className="admin-province-tag">
                          📍 {prov}
                          <button
                            type="button"
                            onClick={() => toggleProvince(prov)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.7, fontSize: "0.75rem", lineHeight: 1, padding: 0 }}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dropdown list grouped by region */}
                  {provinceOpen && (
                    <div className="admin-province-dropdown" style={{
                      position: "absolute", zIndex: 1000, marginTop: 4,
                      borderRadius: "var(--radius-lg)",
                      maxHeight: 280, overflowY: "auto", width: "100%",
                    }}>
                      {regions.map((region) => (
                        <div key={region.id}>
                          <div style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <button
                              type="button"
                              onClick={() => toggleProvince(region.name)}
                              className={`admin-region-btn ${form.provinces.includes(region.name) ? "selected" : ""}`}
                              style={{
                                padding: "6px 12px",
                                borderTop: "none", borderLeft: "none", borderRight: "none",
                                display: "flex", alignItems: "center", gap: 8,
                                width: "100%", textAlign: "left", cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                              }}
                            >
                              <span className="admin-region-checkbox-box" style={{
                                width: 16, height: 16, flexShrink: 0,
                                borderRadius: 4,
                                border: `2px solid ${form.provinces.includes(region.name) ? "var(--navy-600)" : "var(--gray-300)"}`,
                                background: form.provinces.includes(region.name) ? "var(--navy-600)" : "var(--white)",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.6rem", color: "white",
                              }}>
                                {form.provinces.includes(region.name) ? "✓" : ""}
                              </span>
                              <span className="admin-region-title" style={{
                                fontSize: "0.75rem", fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}>
                                {region.name}
                              </span>
                            </button>
                          </div>
                          {region.provinces.map((prov) => {
                            const selected = form.provinces.includes(prov);
                            return (
                              <button
                                key={prov}
                                type="button"
                                onClick={() => toggleProvince(prov)}
                                className={`admin-province-item ${selected ? "selected" : ""}`}
                                style={{
                                  display: "flex", alignItems: "center", gap: 8,
                                  width: "100%", textAlign: "left",
                                  padding: "7px 14px",
                                  border: "none", cursor: "pointer",
                                  fontSize: "0.82rem",
                                  fontWeight: selected ? 600 : 400,
                                  fontFamily: "var(--font-sans)",
                                }}
                              >
                                <span className="admin-prov-checkbox-box" style={{
                                  width: 16, height: 16, flexShrink: 0,
                                  borderRadius: 4,
                                  border: `2px solid ${selected ? "var(--navy-600)" : "var(--gray-300)"}`,
                                  background: selected ? "var(--navy-600)" : "transparent",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "0.6rem", color: "white",
                                }}>
                                  {selected ? "✓" : ""}
                                </span>
                                <span>{prov}</span>
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
            <div id="admin-field-positionList" className="form-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  ตำแหน่งที่เปิดรับ <span className="required">*</span>
                </label>
                <button type="button" onClick={addPosition} className="admin-add-pos-btn">
                  ＋ เพิ่มตำแหน่ง
                </button>
              </div>

              {errors.positionList && (
                <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginBottom: 8 }}>{errors.positionList}</p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.positionList.map((pos, i) => {
                  const isExpanded = expandedPosIndex === i;
                  return (
                  <div key={i} className={`admin-pos-accordion-card ${isExpanded ? "expanded" : ""}`}>
                    {/* Header (Accordion Toggle) */}
                    <div 
                      className="admin-pos-accordion-header"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: isExpanded ? 12 : 0 }}
                      onClick={() => setExpandedPosIndex(isExpanded ? -1 : i)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="admin-pos-badge">
                          ตำแหน่งที่ {i + 1}
                        </div>
                        <span className="admin-pos-title-text">
                          {pos.title || "(ยังไม่ได้ระบุชื่อตำแหน่ง)"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {form.positionList.length > 1 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); removePosition(i); }}
                            style={{
                              background: "none", border: "none",
                              fontSize: "1.1rem", color: "var(--gray-400)",
                              cursor: "pointer", lineHeight: 1, padding: 4
                            }}
                            title="ลบตำแหน่งนี้">✕</button>
                        )}
                        <span style={{ fontSize: "0.7rem", color: "var(--gray-500)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
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
                            <label className="form-label" style={{ fontSize: "0.72rem" }}>วุฒิที่ต้องการ (เลือกได้มากกว่า 1)</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                              {EDUCATION.map((ed) => {
                                const isSelected = Array.isArray(pos.education) ? pos.education.includes(ed) : pos.education === ed;
                                return (
                                  <button
                                    key={ed}
                                    type="button"
                                    onClick={() => {
                                      let current = Array.isArray(pos.education) ? pos.education : (pos.education ? [pos.education] : []);
                                      let newEdu = isSelected ? current.filter(e => e !== ed) : [...current, ed];
                                      if (newEdu.length === 0) newEdu = [ed]; // Prevent empty selection
                                      handlePositionChange(i, "education", newEdu);
                                    }}
                                    className={`admin-edu-pill ${isSelected ? "selected" : ""}`}
                                  >
                                    {ed}
                                  </button>
                                );
                              })}
                            </div>
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
                      <div className="admin-units-wrapper" style={{ marginTop: 12, paddingLeft: 12, borderLeft: "2px solid var(--accent-light)" }}>
                        {pos.units.map((unit, uIdx) => (
                          <div key={uIdx} className="admin-unit-box" style={{ marginBottom: 12, position: "relative" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 8, marginBottom: 4 }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem" }}>สถานที่ / หน่วยงานย่อย *</label>
                                <input className="form-input" style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                  placeholder="เช่น หน่วยที่ 1 (จำนวน 1 อัตรา)"
                                  value={unit.name}
                                  onChange={(e) => handleUnitChange(i, uIdx, "name", e.target.value)} />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem" }}>อัตรา</label>
                                <input type="number" min="1" className="form-input" style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                  value={unit.count}
                                  onChange={(e) => handleUnitChange(i, uIdx, "count", e.target.value)} />
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", marginBottom: "10px" }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem" }}>วุฒิที่ต้องการ</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                                  {EDUCATION.map((ed) => {
                                    const isSelected = Array.isArray(unit.education) ? unit.education.includes(ed) : unit.education === ed;
                                    return (
                                      <button
                                        key={ed}
                                        type="button"
                                        onClick={() => {
                                          let current = Array.isArray(unit.education) ? unit.education : (unit.education ? [unit.education] : []);
                                          let newEdu = isSelected ? current.filter(e => e !== ed) : [...current, ed];
                                          if (newEdu.length === 0) newEdu = [ed];
                                          handleUnitChange(i, uIdx, "education", newEdu);
                                        }}
                                        className={`admin-edu-pill ${isSelected ? "selected" : ""}`}
                                      >
                                        {ed}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: "0.7rem" }}>สาขาวิชา (ถ้ามี)</label>
                                <input className="form-input" style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                  placeholder="เช่น วิศวกรรมศาสตร์, คอมพิวเตอร์..."
                                  value={unit.major || ""}
                                  onChange={(e) => handleUnitChange(i, uIdx, "major", e.target.value)} />
                              </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: "0.7rem" }}>ลักษณะงาน</label>
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
                      <button type="button" onClick={() => addUnit(i)} className="admin-add-unit-btn">
                        ＋ เพิ่มหน่วยงานย่อย / สถานที่ปฏิบัติงาน
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )})}
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
              <label className="form-label">🔗 ลิงก์สมัครงาน / อีเมลรับสมัคร</label>
              <input id="admin-field-apply-url" className="form-input"
                placeholder="วาง URL เว็บไซต์สมัครงาน หรือกรอกอีเมล เช่น qas.pcd2025@gmail.com"
                value={form.applyUrl || ""}
                onChange={(e) => handleChange("applyUrl", e.target.value)}
                onBlur={(e) => {
                  let val = e.target.value.trim();
                  if (val && !val.startsWith("http://") && !val.startsWith("https://") && !val.startsWith("mailto:")) {
                    if (val.includes("@")) {
                      handleChange("applyUrl", `mailto:${val}`);
                    }
                  }
                }}
              />
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                💡 หากรับสมัครทางอีเมล สามารถกรอกอีเมลได้ทันที (ระบบจะแปลงเป็น <code>mailto:</code> และแสดงปุ่มส่งอีเมลให้อัตโนมัติ)
              </p>
            </div>

            {/* Toggle showBooks & Custom Book URL */}
            <div className="form-group admin-book-toggle-box" style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", marginTop: 14 }}>
              <label className="admin-checkbox-label" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
                <input
                  type="checkbox"
                  checked={form.showBooks !== false}
                  onChange={(e) => handleChange("showBooks", e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <span>📚 แสดงกล่องแนะนำหนังสือ & คอร์สติวในป๊อปอัปประกาศนี้</span>
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
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
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
                  className="admin-delete-btn"
                  onClick={() => setConfirmDelete(true)}>
                  🗑️ ลบประกาศ
                </button>
              )
            )}

            <button
              type="button"
              className="btn btn-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderColor: "var(--orange-400)",
                color: "var(--orange-700)",
                background: "var(--orange-50)",
                fontWeight: 600,
              }}
              onClick={() => {
                const previewJob = {
                  ...form,
                  category: form.categories[0],
                  id: editJob?.id || Date.now(),
                };
                setPosterJob(previewJob);
              }}
              title="เปิดตัวช่วยสร้างข้อความโพสต์โซเชียล & แบนเนอร์"
            >
              <span>📢</span>
              <span>สร้างโพสต์โซเชียล</span>
            </button>

            <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
            <button id="admin-submit-btn" type="submit" className="btn btn-accent" disabled={loading}>
              {loading ? "⏳ กำลังบันทึก..." : isEditMode ? "💾 บันทึกการแก้ไข" : "💾 บันทึกประกาศ"}
            </button>
          </div>
        </form>
      </div>

      {posterJob && (
        <SocialPosterModal
          job={posterJob}
          onClose={() => {
            setPosterJob(null);
            if (isSavedSuccess) {
              onClose();
            }
          }}
        />
      )}
    </div>
  );
}
