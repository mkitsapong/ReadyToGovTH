import { useState, useRef } from "react";
import { extractJobDataWithAI } from "../services/aiJobExtractor.js";

export default function AdminAIExtractor({ onExtracted, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState("file"); // "file" | "text"
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("readytogov_gemini_api_key") || "");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  function handleSaveKey(key) {
    setApiKey(key);
    localStorage.setItem("readytogov_gemini_api_key", key);
    setShowKeyConfig(false);
  }

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return;
    setError("");
    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf");
    const isImage = selectedFile.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setError("รองรับเฉพาะไฟล์ PDF หรือไฟล์รูปภาพ (PNG, JPG, WEBP) เท่านั้น");
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("ขนาดไฟล์ต้องไม่เกิน 20 MB");
      return;
    }
    setFile(selectedFile);
  }

  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const progressIntervalRef = useRef(null);

  const PROGRESS_STEPS = [
    { threshold: 25, text: "📂 กำลังอ่านและประมวลผลไฟล์เอกสาร..." },
    { threshold: 50, text: "🔍 AI กำลังสแกนเนื้อหาประกาศและตรวจจับข้อความ..." },
    { threshold: 75, text: "📋 กำลังแกะชื่อหน่วยงาน, ตำแหน่ง, เงินเดือน และวุฒิ..." },
    { threshold: 92, text: "✨ กำลังตรวจสอบเงื่อนไข ภาค ก และจัดโครงสร้างข้อมูล..." },
  ];

  function startProgress() {
    setProgress(5);
    setProgressStep(PROGRESS_STEPS[0].text);
    
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 92; // Wait for real response at 92%
        const inc = Math.random() * 8 + 4;
        const next = Math.min(92, prev + inc);
        
        const matched = PROGRESS_STEPS.slice().reverse().find(s => next >= s.threshold);
        if (matched) setProgressStep(matched.text);
        
        return Math.round(next);
      });
    }, 400);
  }

  function stopProgress(success = true) {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (success) {
      setProgress(100);
      setProgressStep("✅ วิเคราะห์ข้อมูลสำเร็จแล้ว!");
    } else {
      setProgress(0);
      setProgressStep("");
    }
  }

  async function handleExtract() {
    setError("");
    setIsLoading(true);
    startProgress();

    try {
      const extracted = await extractJobDataWithAI({
        file: activeTab === "file" ? file : null,
        text: activeTab === "text" ? rawText : null,
        apiKey: apiKey.trim(),
      });

      stopProgress(true);
      await new Promise(r => setTimeout(r, 600)); // Show 100% briefly

      onExtracted(extracted);
      setIsOpen(false);
      setFile(null);
      setRawText("");
      setProgress(0);
      setProgressStep("");
    } catch (err) {
      console.error(err);
      stopProgress(false);
      setError(err.message || "เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      marginBottom: "20px",
      borderRadius: "var(--radius-xl)",
      border: "1.5px solid rgba(234, 88, 12, 0.3)",
      background: "linear-gradient(135deg, rgba(234, 88, 12, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)",
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)"
    }}>
      {/* Header bar */}
      <div style={{
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255, 255, 255, 0.8)",
        borderBottom: isOpen ? "1px solid rgba(234, 88, 12, 0.15)" : "none",
        cursor: "pointer",
      }}
      onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ea580c, #f97316)",
            color: "white",
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)"
          }}>
            ✨
          </span>
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--navy-900)", display: "flex", alignItems: "center", gap: 6 }}>
              AI ดึงข้อมูลประกาศอัตโนมัติ (PDF / ข้อความ)
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#ea580c",
                background: "rgba(234, 88, 12, 0.1)",
                padding: "2px 8px",
                borderRadius: "999px"
              }}>
                Gemini Flash AI
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--navy-500)", marginTop: 2 }}>
              อัปโหลด PDF ประกาศ หรือวางข้อความ เพื่อให้ AI ช่วยกรอกฟอร์มให้อัตโนมัติใน 3 วินาที
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowKeyConfig(!showKeyConfig);
            }}
            title="ตั้งค่า Gemini API Key"
            style={{
              background: "var(--gray-100)",
              border: "1px solid var(--gray-300)",
              borderRadius: "var(--radius-sm)",
              padding: "4px 8px",
              fontSize: "0.72rem",
              color: "var(--navy-700)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            ⚙️ {apiKey ? "มี API Key แล้ว" : "ตั้งค่า API Key"}
          </button>
          <span style={{ fontSize: "0.85rem", color: "var(--navy-400)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </div>
      </div>

      {/* Body when open */}
      {isOpen && (
        <div style={{ padding: "16px 20px", background: "white" }}>
          {/* API Key configuration box */}
          {showKeyConfig && (
            <div style={{
              padding: "12px 14px",
              background: "var(--navy-50)",
              border: "1px solid var(--navy-200)",
              borderRadius: "var(--radius-md)",
              marginBottom: 16
            }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--navy-800)", display: "block", marginBottom: 4 }}>
                🔑 Google Gemini API Key
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid var(--gray-300)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem"
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSaveKey(apiKey)}
                  className="btn btn-primary"
                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                >
                  บันทึก Key
                </button>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--navy-600)", margin: "6px 0 0 0" }}>
                💡 รับ API Key ฟรีได้จาก <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 600 }}>Google AI Studio ↗</a>
              </p>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => { setActiveTab("file"); setError(""); }}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                border: activeTab === "file" ? "1.5px solid var(--accent)" : "1px solid var(--gray-200)",
                background: activeTab === "file" ? "rgba(234, 88, 12, 0.08)" : "var(--gray-50)",
                color: activeTab === "file" ? "var(--accent)" : "var(--navy-700)",
                fontWeight: activeTab === "file" ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              📄 อัปโหลดไฟล์ PDF / รูปภาพประกาศ
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("text"); setError(""); }}
              style={{
                flex: 1,
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                border: activeTab === "text" ? "1.5px solid var(--accent)" : "1px solid var(--gray-200)",
                background: activeTab === "text" ? "rgba(234, 88, 12, 0.08)" : "var(--gray-50)",
                color: activeTab === "text" ? "var(--accent)" : "var(--navy-700)",
                fontWeight: activeTab === "text" ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              📋 วางข้อความประกาศ
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === "file" && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileSelect(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragOver ? "var(--accent)" : "var(--gray-300)"}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "28px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: isDragOver ? "rgba(234, 88, 12, 0.05)" : "var(--gray-50)",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>📁</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy-800)" }}>
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์ PDF / รูปภาพประกาศมาวางที่นี่
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 4 }}>
                    รองรับไฟล์ PDF, PNG, JPG ขนาดไม่เกิน 20 MB
                  </div>
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--navy-50)",
                  border: "1px solid var(--navy-200)",
                  borderRadius: "var(--radius-md)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.5rem" }}>
                      {file.name.endsWith(".pdf") ? "📑" : "🖼️"}
                    </span>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--navy-900)" }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--navy-500)" }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600
                    }}
                  >
                    ✕ ลบไฟล์
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Raw Text */}
          {activeTab === "text" && (
            <div>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="วางข้อความรายละเอียดประกาศรับสมัครงานที่คัดลอกมาจากเว็บไซต์หรือ Facebook ที่นี่..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
            </div>
          )}

          {/* Real-time Progress Bar & Status */}
          {isLoading && (
            <div style={{
              marginTop: 14,
              padding: "16px 18px",
              background: "linear-gradient(135deg, rgba(234,88,12,0.06), rgba(59,130,246,0.06))",
              border: "1px solid rgba(234,88,12,0.25)",
              borderRadius: "var(--radius-lg)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", fontWeight: 700, color: "var(--navy-900)" }}>
                  <span style={{ display: "inline-block", animation: "spin 1.5s linear infinite" }}>⚙️</span>
                  <span>{progressStep || "กำลังประมวลผล..."}</span>
                </div>
                <span style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#ea580c",
                  background: "white",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  boxShadow: "0 2px 6px rgba(234,88,12,0.15)",
                }}>
                  {progress}%
                </span>
              </div>

              {/* Progress track */}
              <div style={{
                width: "100%",
                height: "10px",
                background: "rgba(0,0,0,0.06)",
                borderRadius: "999px",
                overflow: "hidden",
                position: "relative",
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #ea580c 0%, #f97316 50%, #3b82f6 100%)",
                  borderRadius: "999px",
                  transition: "width 0.35s ease",
                  boxShadow: "0 0 12px rgba(234,88,12,0.5)",
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--navy-500)", marginTop: 8 }}>
                <span>1. อ่านเอกสาร</span>
                <span>2. สแกนเนื้อหา</span>
                <span>3. แกะตำแหน่ง & วุฒิ</span>
                <span>4. กรอกลงฟอร์ม</span>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div style={{
              marginTop: 12,
              padding: "8px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--radius-sm)",
              color: "#dc2626",
              fontSize: "0.82rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Action button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              type="button"
              onClick={handleExtract}
              disabled={isLoading || (activeTab === "file" && !file) || (activeTab === "text" && !rawText.trim())}
              className="btn btn-primary"
              style={{
                background: isLoading ? "var(--gray-400)" : "linear-gradient(135deg, var(--accent), var(--orange-600))",
                padding: "9px 20px",
                fontSize: "0.88rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: isLoading ? "none" : "0 4px 12px rgba(234, 88, 12, 0.3)",
                cursor: isLoading ? "wait" : "pointer",
              }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 1s linear infinite" }} />
                  ⏳ กำลังวิเคราะห์ ({progress}%)...
                </>
              ) : (
                <>
                  ✨ เริ่มวิเคราะห์และกรอกฟอร์มอัตโนมัติ
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
