import { useState, useEffect } from "react";
import { STATUS_LIST, STATUS_CONFIG, APPLICATION_STATUS } from "../utils/constants.js";
import { getExamCountdown, formatDate } from "../utils/helpers.js";
import {
  buildExamCalendarEventData,
  getGoogleCalendarUrl,
  downloadIcsFile,
} from "../utils/calendarHelper.js";
import "./ApplicationTracker.css";

export default function ApplicationTrackerPanel({
  job,
  tracking,
  onUpdateTracking,
  onToast,
  compact = false,
}) {
  const [status, setStatus] = useState(
    tracking?.status || APPLICATION_STATUS.INTERESTED
  );
  const [examDate, setExamDate] = useState(tracking?.examDate || "");
  const [examTime, setExamTime] = useState(tracking?.examTime || "");
  const [examLocation, setExamLocation] = useState(tracking?.examLocation || "");
  const [seatNumber, setSeatNumber] = useState(tracking?.seatNumber || "");
  const [notes, setNotes] = useState(tracking?.notes || "");
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if tracking prop changes externally
  useEffect(() => {
    if (tracking) {
      setStatus(tracking.status || APPLICATION_STATUS.INTERESTED);
      setExamDate(tracking.examDate || "");
      setExamTime(tracking.examTime || "");
      setExamLocation(tracking.examLocation || "");
      setSeatNumber(tracking.seatNumber || "");
      setNotes(tracking.notes || "");
    }
  }, [tracking]);

  const countdown = examDate ? getExamCountdown(examDate) : null;
  const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.interested;

  // Auto-save or quick status change
  const handleStatusSelect = (newStatus) => {
    setStatus(newStatus);
    onUpdateTracking?.(
      {
        status: newStatus,
        examDate,
        examTime,
        examLocation,
        seatNumber,
        notes,
      },
      job
    );
    if (onToast) {
      const cfg = STATUS_CONFIG[newStatus] || STATUS_CONFIG.interested;
      onToast(`เปลี่ยนสถานะเป็น "${cfg.label}" แล้ว ${cfg.icon}`, "success");
    }
  };

  const handleSaveDetails = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onUpdateTracking?.(
      {
        status,
        examDate,
        examTime,
        examLocation,
        seatNumber,
        notes,
      },
      job
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    if (onToast) {
      onToast("บันทึกข้อมูลการติดตามเรียบร้อยแล้ว ✅", "success");
    }
  };

  // Add exam event to Google Calendar
  const handleAddToGoogleCalendar = () => {
    if (!examDate) return;
    const eventData = buildExamCalendarEventData(job, {
      examDate,
      examTime,
      examLocation,
      seatNumber,
      notes,
    });
    if (eventData) {
      const gUrl = getGoogleCalendarUrl(eventData);
      window.open(gUrl, "_blank", "noopener,noreferrer");
      if (onToast) onToast("เปิด Google Calendar เพื่อบันทึกวันสอบแล้ว 📅", "success");
    }
  };

  // Download .ics for iCal/Outlook
  const handleDownloadIcs = () => {
    if (!examDate) return;
    const eventData = buildExamCalendarEventData(job, {
      examDate,
      examTime,
      examLocation,
      seatNumber,
      notes,
    });
    if (eventData) {
      downloadIcsFile(eventData, `exam-${job?.id || "date"}.ics`);
      if (onToast) onToast("ดาวน์โหลดไฟล์ปฏิทินนัดสอบ .ics แล้ว 📅", "success");
    }
  };

  return (
    <div className={`application-tracker-panel ${compact ? "compact" : ""}`}>
      {/* Header */}
      <div className="tracker-panel-header">
        <div className="tracker-panel-title-wrap">
          <span className="tracker-panel-icon">🎯</span>
          <div>
            <h3 className="tracker-panel-title">ติดตามความคืบหน้าการสมัคร</h3>
            <p className="tracker-panel-subtitle">
              จัดการสถานะ ตั้งเตือนวันสอบ และจดบันทึกส่วนตัว
            </p>
          </div>
        </div>
        <div
          className="tracker-panel-current-pill"
          style={{
            backgroundColor: currentConfig.bg,
            color: currentConfig.color,
            borderColor: currentConfig.border,
          }}
        >
          <span>{currentConfig.icon}</span>
          <span>{currentConfig.label}</span>
        </div>
      </div>

      {/* Stepper / Status Buttons */}
      <div className="tracker-steps-bar" role="group" aria-label="สถานะการสมัคร">
        {STATUS_LIST.map((st) => {
          const isActive = st.id === status;
          return (
            <button
              key={st.id}
              type="button"
              className={`tracker-step-btn ${isActive ? "active" : ""}`}
              onClick={() => handleStatusSelect(st.id)}
              style={
                isActive
                  ? {
                      backgroundColor: st.bg,
                      color: st.color,
                      borderColor: st.color,
                    }
                  : undefined
              }
            >
              <span className="step-icon">{st.icon}</span>
              <span className="step-label">{st.shortLabel}</span>
              {isActive && <span className="step-check">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Exam Countdown & Exam Date Section */}
      <div className="tracker-exam-section">
        <div className="tracker-section-headline">
          <span className="section-icon">⏳</span>
          <div>
            <div className="section-title">ข้อมูลวันสอบ & การนับถอยหลัง</div>
            <div className="section-desc">
              ระบุวันสอบเพื่อเริ่มนับถอยหลังและเพิ่มลงในปฏิทินส่วนตัว
            </div>
          </div>
        </div>

        {/* Live Countdown Banner (Shown when examDate is set) */}
        {countdown && (
          <div
            className={`tracker-countdown-card ${countdown.status} ${
              countdown.isUrgent ? "urgent-card" : ""
            }`}
          >
            <div className="countdown-card-left">
              <span className="countdown-card-icon">
                {countdown.isToday ? "🔥" : countdown.isTomorrow ? "⚡" : "⏰"}
              </span>
              <div>
                <div className="countdown-highlight">{countdown.text}</div>
                <div className="countdown-subtext">
                  วันสอบ: {formatDate(examDate)}{" "}
                  {examTime ? `เวลา ${examTime} น.` : ""}
                </div>
              </div>
            </div>
            <div className="countdown-card-actions">
              <button
                type="button"
                className="btn-calendar-mini google"
                onClick={handleAddToGoogleCalendar}
                title="เพิ่มวันสอบลงใน Google Calendar"
              >
                📅 Google Calendar
              </button>
              <button
                type="button"
                className="btn-calendar-mini ics"
                onClick={handleDownloadIcs}
                title="ดาวน์โหลดไฟล์ .ics สำหรับ Apple/Outlook"
              >
                📥 ไฟล์ iCal (.ics)
              </button>
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSaveDetails} className="tracker-form-grid">
          <div className="form-group">
            <label htmlFor="tracker-exam-date">
              📅 วันที่สอบ {status === "exam" && <span className="req">*</span>}
            </label>
            <input
              id="tracker-exam-date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="tracker-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tracker-exam-time">⏰ เวลาสอบ</label>
            <input
              id="tracker-exam-time"
              type="text"
              placeholder="เช่น 09:00 - 12:00 น."
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
              className="tracker-input"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="tracker-exam-location">📍 สถานที่สอบ / ศูนย์สอบ</label>
            <input
              id="tracker-exam-location"
              type="text"
              placeholder="เช่น ม.ธรรมศาสตร์ ศูนย์รังสิต อาคารเรียนรวม 2 ห้อง 302"
              value={examLocation}
              onChange={(e) => setExamLocation(e.target.value)}
              className="tracker-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tracker-seat-number">🎫 เลขประจำตัวสอบ / ที่นั่งสอบ</label>
            <input
              id="tracker-seat-number"
              type="text"
              placeholder="เช่น 67010452"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              className="tracker-input"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="tracker-notes">
              📝 โน้ตส่วนตัว (เอกสารที่ต้องใช้, หัวข้อสอบ, ลิงก์ตรวจคะแนน)
            </label>
            <textarea
              id="tracker-notes"
              rows={3}
              placeholder="จดบันทึก เช่น เตรียมดินสอ 2B 3 แท่ง, ปรินต์บัตรประจำตัวสอบ, อ่านระเบียบงานสารบรรณ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="tracker-textarea"
            />
          </div>

          <div className="tracker-form-actions">
            <button
              type="submit"
              className={`tracker-btn-save ${isSaved ? "saved" : ""}`}
            >
              {isSaved ? "✓ บันทึกข้อมูลแล้ว" : "💾 บันทึกข้อมูลการสมัคร"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
