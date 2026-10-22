import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState(null);

  const statusKey = tracking?.status || "interested";
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.interested;
  const countdown = tracking?.countdown;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 280;
    const approxHeight = 360;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpwards = spaceBelow < approxHeight && spaceAbove > spaceBelow;

    let left = rect.right - dropdownWidth;
    if (left < 10) left = 10;
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = window.innerWidth - dropdownWidth - 10;
    }

    setCoords({
      top: openUpwards ? undefined : rect.bottom + 6,
      bottom: openUpwards ? window.innerHeight - rect.top + 6 : undefined,
      left,
      openUpwards,
    });
  }, []);

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const dropdownMenu = isOpen && coords && (
    <div
      ref={menuRef}
      className={`tracker-badge-dropdown ${coords.openUpwards ? "open-up" : "open-down"}`}
      style={{
        position: "fixed",
        top: coords.top !== undefined ? `${coords.top}px` : "auto",
        bottom: coords.bottom !== undefined ? `${coords.bottom}px` : "auto",
        left: `${coords.left}px`,
      }}
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
  );

  return (
    <div className={`tracker-badge-container ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`tracker-badge-pill ${config.badgeClass} ${countdown?.isUrgent ? "pulse-urgent" : ""}`}
        onClick={toggleDropdown}
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

      {typeof document !== "undefined" && dropdownMenu && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
