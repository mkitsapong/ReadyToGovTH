import { useState } from "react";
import { formatDate, daysLeft } from "../utils/helpers.js";
import {
  buildCalendarEventData,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile,
} from "../utils/calendarHelper.js";

export default function AddToCalendarModal({ job, onClose, onToast }) {
  const [eventType, setEventType] = useState("deadline"); // 'deadline' | 'start'
  const [reminder1Day, setReminder1Day] = useState(true);
  const [reminder3Days, setReminder3Days] = useState(true);

  if (!job) return null;

  const today = new Date().toISOString().split("T")[0];
  const hasStartDate = Boolean(job.startDate && job.startDate > today);
  const days = daysLeft(job.deadline);

  // Reminders list
  const activeReminders = [];
  if (reminder1Day) activeReminders.push(1);
  if (reminder3Days) activeReminders.push(3);

  const eventData = buildCalendarEventData(job, {
    eventType,
    reminderDays: activeReminders.length > 0 ? activeReminders : [1],
  });

  const handleGoogleCalendar = () => {
    if (!eventData) return;
    const url = getGoogleCalendarUrl(eventData);
    window.open(url, "_blank", "noopener,noreferrer");
    if (onToast) onToast("เปิด Google Calendar ในแท็บใหม่แล้ว 📅", "success");
    onClose();
  };

  const handleOutlookCalendar = () => {
    if (!eventData) return;
    const url = getOutlookCalendarUrl(eventData);
    window.open(url, "_blank", "noopener,noreferrer");
    if (onToast) onToast("เปิด Outlook Calendar ในแท็บใหม่แล้ว 📅", "success");
    onClose();
  };

  const handleAppleOrIcs = () => {
    if (!eventData) return;
    const fileName = `readytogov-${job.department.replace(/\s+/g, "-")}-${eventType}.ics`;
    downloadIcsFile(eventData, fileName);
    if (onToast) onToast("บันทึกไฟล์ .ics ลงในเครื่องแล้ว พร้อมเพิ่มลงปฏิทิน! 🍏", "success");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal animate-fade-up calendar-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: "100%",
          padding: 0,
          overflow: "hidden",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <div className="calendar-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="calendar-header-icon-box">📅</div>
            <div>
              <h3 className="calendar-modal-title">บันทึกวันลงปฏิทิน</h3>
              <p className="calendar-modal-subtitle">
                ตั้งแจ้งเตือนล่วงหน้า ป้องกันการลืมวันปิดรับสมัครงาน
              </p>
            </div>
          </div>
          <button
            type="button"
            className="calendar-btn-close"
            onClick={onClose}
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="calendar-modal-body">
          {/* Target Event Switcher (If start date is in the future) */}
          {hasStartDate && (
            <div className="calendar-event-switcher">
              <button
                type="button"
                className={`calendar-switch-btn ${eventType === "deadline" ? "active" : ""}`}
                onClick={() => setEventType("deadline")}
              >
                ⚠️ วันปิดรับสมัคร ({formatDate(job.deadline)})
              </button>
              <button
                type="button"
                className={`calendar-switch-btn ${eventType === "start" ? "active" : ""}`}
                onClick={() => setEventType("start")}
              >
                🚀 วันเปิดรับสมัคร ({formatDate(job.startDate)})
              </button>
            </div>
          )}

          {/* Event Preview Card */}
          <div className="calendar-preview-card">
            <div className="calendar-preview-title">
              {eventData?.title}
            </div>
            
            <div className="calendar-preview-meta-row">
              <span className="calendar-preview-pill">
                🗓️ {formatDate(eventData?.targetDate)} (ทั้งวัน)
              </span>
              {eventType === "deadline" && days >= 0 && (
                <span className={`calendar-preview-pill pill-countdown ${days <= 3 ? "urgent" : ""}`}>
                  ⏳ {days === 0 ? "ปิดรับวันนี้!" : `เหลืออีก ${days} วัน`}
                </span>
              )}
              <span className="calendar-preview-pill pill-method">
                {eventData?.isOnline ? "🌐 สมัครออนไลน์" : eventData?.isEmail ? "📧 ส่งใบสมัครทางอีเมล" : "📍 ยื่นใบสมัครด้วยตนเอง"}
              </span>
            </div>

            {/* Reminder toggles */}
            <div className="calendar-reminders-box">
              <span className="calendar-reminders-label">🔔 ตั้งแจ้งเตือนล่วงหน้า:</span>
              <div className="calendar-reminders-toggles">
                <label className="calendar-checkbox-label">
                  <input
                    type="checkbox"
                    checked={reminder1Day}
                    onChange={(e) => setReminder1Day(e.target.checked)}
                  />
                  <span>1 วันก่อนหน้า</span>
                </label>
                <label className="calendar-checkbox-label">
                  <input
                    type="checkbox"
                    checked={reminder3Days}
                    onChange={(e) => setReminder3Days(e.target.checked)}
                  />
                  <span>3 วันก่อนหน้า</span>
                </label>
              </div>
            </div>
          </div>

          {/* Platform Buttons List */}
          <div className="calendar-platforms-list">
            {/* Google Calendar */}
            <button
              type="button"
              className="calendar-platform-btn btn-google"
              onClick={handleGoogleCalendar}
            >
              <div className="platform-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div className="platform-text-box">
                <span className="platform-name">Google Calendar</span>
                <span className="platform-desc">เปิดบันทึกทันทีใน Google Calendar ผ่านเบราว์เซอร์</span>
              </div>
              <span className="platform-arrow">→</span>
            </button>

            {/* Apple Calendar / iOS */}
            <button
              type="button"
              className="calendar-platform-btn btn-apple"
              onClick={handleAppleOrIcs}
            >
              <div className="platform-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.71-.93 2.73 1.01.08 2.03-.49 2.65-1.23z" />
                </svg>
              </div>
              <div className="platform-text-box">
                <span className="platform-name">Apple Calendar (iOS / Mac)</span>
                <span className="platform-desc">เปิดลงแอพปฏิทินใน iPhone, iPad และเครื่อง Mac ทันที</span>
              </div>
              <span className="platform-arrow">→</span>
            </button>

            {/* Outlook / Office 365 */}
            <button
              type="button"
              className="calendar-platform-btn btn-outlook"
              onClick={handleOutlookCalendar}
            >
              <div className="platform-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#0078D4">
                  <path d="M22 6.5V17.5C22 18.33 21.33 19 20.5 19H12.5V5H20.5C21.33 5 22 5.67 22 6.5Z" fill="#0078D4" />
                  <path d="M12.5 5H3.5C2.67 5 2 5.67 2 6.5V17.5C2 18.33 2.67 19 3.5 19H12.5V5Z" fill="#107C41" opacity="0" />
                  <rect x="2" y="5" width="11" height="14" rx="1.5" fill="#0078D4" opacity="0.85" />
                  <path d="M7.5 9.5C6.4 9.5 5.5 10.4 5.5 11.5C5.5 12.6 6.4 13.5 7.5 13.5C8.6 13.5 9.5 12.6 9.5 11.5C9.5 10.4 8.6 9.5 7.5 9.5Z" fill="white" />
                </svg>
              </div>
              <div className="platform-text-box">
                <span className="platform-name">Outlook / Microsoft 365</span>
                <span className="platform-desc">เปิดบันทึกใน Outlook Calendar ออนไลน์</span>
              </div>
              <span className="platform-arrow">→</span>
            </button>

            {/* Universal .ics Download */}
            <button
              type="button"
              className="calendar-platform-btn btn-ics"
              onClick={handleAppleOrIcs}
            >
              <div className="platform-icon-box">📥</div>
              <div className="platform-text-box">
                <span className="platform-name">ดาวน์โหลดไฟล์ .ics (ทุกปฏิทิน)</span>
                <span className="platform-desc">ไฟล์มาตรฐานสากล นำเข้าได้ทุกแอพและทุกอุปกรณ์</span>
              </div>
              <span className="platform-arrow">↓</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="calendar-modal-footer">
          <span>💡 คลิกเดียวเชื่อมต่อกับปฏิทินของคุณทันที โดยไม่ต้องลงชื่อเข้าใช้เพิ่มเติม</span>
        </div>
      </div>
    </div>
  );
}
