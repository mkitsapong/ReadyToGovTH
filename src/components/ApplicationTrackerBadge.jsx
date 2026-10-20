import { useState, useRef, useEffect } from "react";
import { STATUS_CONFIG, STATUS_LIST } from "../utils/constants.js";
import "./ApplicationTracker.css";

export default function ApplicationTrackerBadge({
  tracking,
  onStatusChange,
  onOpenDetails,
  className = "",
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const statusKey = tracking?.status || "interested";
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.interested;
  const countdown = tracking?.countdown;

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`tracker-badge-container ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`tracker-badge-pill ${config.badgeClass} ${countdown?.isUrgent ? "pulse-urgent" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`สถานะการสมัคร: ${config.label} (คลิกเพื่อเปลี่ยนสถานะ)`}
        aria-label={`สถานะการสมัคร ${config.label}`}
        style={{
          color: config.color,
          backgroundColor: config.bg,
          borderColor: config.border,
        }}
      >
        <span className="tracker-badge-icon">{config.icon}</span>
        <span className="tracker-badge-text">
          {compact ? config.shortLabel : config.label}
        </span>
        {statusKey === "exam" && countdown && (
          <span className={`tracker-badge-countdown ${countdown.isUrgent ? "urgent" : ""}`}>
            • {countdown.text}
          </span>
        )}
        <span className="tracker-badge-caret">▾</span>
      </button>

      {isOpen && (
        <div
          className="tracker-badge-dropdown"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="tracker-dropdown-header">
            <span>เปลี่ยนสถานะการสมัคร</span>
            {onOpenDetails && (
              <button
                type="button"
                className="tracker-dropdown-details-btn"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDetails();
                }}
              >
                ตั้งวันสอบ/โน้ต ⚙️
              </button>
            )}
          </div>
          <div className="tracker-dropdown-list">
            {STATUS_LIST.map((st) => {
              const isActive = st.id === statusKey;
              return (
                <button
                  key={st.id}
                  type="button"
                  className={`tracker-dropdown-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setIsOpen(false);
                    onStatusChange?.(st.id);
                  }}
                >
                  <span className="item-icon">{st.icon}</span>
                  <div className="item-info">
                    <span className="item-label">{st.label}</span>
                    <span className="item-desc">{st.desc}</span>
                  </div>
                  {isActive && <span className="item-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
