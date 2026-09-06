import { useState, useEffect } from "react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissInstall, setDismissInstall] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for PWA beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  return (
    <>
      {/* 1. Offline Mode Floating Banner */}
      {!isOnline && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          border: "1.5px solid rgba(249, 115, 22, 0.5)",
          color: "#f8fafc",
          padding: "12px 24px",
          borderRadius: 100,
          boxShadow: "0 14px 35px rgba(0, 0, 0, 0.45)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: "0.88rem",
          fontWeight: 600,
          animation: "fadeIn 0.3s ease-out"
        }}>
          <span style={{ fontSize: "1.1rem" }}>📡</span>
          <span>โหมดออฟไลน์: กำลังแสดงข้อมูลที่แคชไว้ในเครื่อง สามารถอ่านงานที่บันทึกไว้ได้ตามปกติ</span>
        </div>
      )}

      {/* 2. PWA Install Prompt Banner */}
      {installPrompt && !isInstalled && !dismissInstall && (
        <div style={{
          position: "fixed",
          bottom: !isOnline ? 80 : 24,
          right: 24,
          zIndex: 9998,
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: 16,
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.16)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          maxWidth: 360,
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1.3rem"
          }}>
            🏛️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--navy-800, #0f172a)" }}>
              ติดตั้ง ReadyToGovTH
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--navy-400, #64748b)", marginTop: 2 }}>
              เพิ่มลงหน้าจอโฮมเพื่อเปิดใช้งานได้เร็วและอ่านแบบออฟไลน์
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              type="button"
              onClick={handleInstallClick}
              style={{
                background: "linear-gradient(135deg, var(--accent, #ea580c), #f97316)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)"
              }}
            >
              ติดตั้ง
            </button>
            <button
              type="button"
              onClick={() => setDismissInstall(true)}
              style={{
                background: "transparent",
                color: "var(--navy-300, #94a3b8)",
                border: "none",
                fontSize: "0.75rem",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              ไว้ทีหลัง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
