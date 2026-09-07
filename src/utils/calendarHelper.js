import { formatDate, getTotalJobPositions, getDisplayProvinces } from "./helpers.js";

/**
 * Format a Date or YYYY-MM-DD string to standard iCal format: YYYYMMDD
 */
function toIcalDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Add days to a date string and return YYYYMMDD
 */
function addDaysToIcalDate(dateStr, days = 1) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toIcalDate(d);
}

/**
 * Format date for Outlook web: YYYY-MM-DD
 */
function toIsoDateOnly(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Build rich event data object for a job
 */
export function buildCalendarEventData(job, options = {}) {
  if (!job) return null;

  const {
    eventType = "deadline", // 'deadline' | 'start'
    reminderDays = [1, 3], // days before to trigger alarm
  } = options;

  const totalCount = getTotalJobPositions(job);
  const provinces = getDisplayProvinces(job);
  const location = provinces.length > 0 
    ? `${provinces.join(", ")}, ประเทศไทย` 
    : "รับสมัครทางอินเทอร์เน็ต / สมัครออนไลน์";

  // Derive salary
  const rawSalaries = job.positionList?.map(p => p.salary?.trim()).filter(Boolean) || [];
  let displaySalary = job.salary || "ตามระเบียบทางราชการ";
  if (rawSalaries.length > 0) {
    const nums = rawSalaries
      .flatMap(s => s.match(/[\d,]+/g) || [])
      .map(n => parseInt(n.replace(/,/g, ''), 10))
      .filter(n => n >= 3000);
    if (nums.length > 0) {
      const minSalary = Math.min(...nums);
      const maxSalary = Math.max(...nums);
      displaySalary = minSalary === maxSalary 
        ? `${minSalary.toLocaleString()} บาท`
        : `${minSalary.toLocaleString()} – ${maxSalary.toLocaleString()} บาท`;
    } else {
      displaySalary = rawSalaries[0];
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://readytogov.th";
  const jobUrl = `${origin}/job/${job.id}`;

  // Smart detection of application channel:
  // 1. Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  let detectedEmail = "";
  if (job.applyUrl) {
    if (job.applyUrl.startsWith("mailto:")) {
      const match = job.applyUrl.replace(/^mailto:/i, "").match(emailRegex);
      if (match) detectedEmail = match[1];
    } else if (job.applyUrl.includes("@") && !job.applyUrl.startsWith("http")) {
      const match = job.applyUrl.match(emailRegex);
      if (match) detectedEmail = match[1];
    }
  }
  if (!detectedEmail && job.description) {
    const match = job.description.match(emailRegex);
    if (match) detectedEmail = match[1];
  }

  const isEmail = Boolean(detectedEmail);
  const isOnline = Boolean(job.applyUrl && job.applyUrl.startsWith("http") && !isEmail);
  const isInPerson = !isEmail && !isOnline;

  // PDF announcement url if available
  const pdfUrl = job.announcementUrl
    ? job.announcementUrl.split(/[\s,]+/)[0]
    : "";

  const isDeadline = eventType === "deadline";
  const targetDate = isDeadline ? job.deadline : (job.startDate || job.postedDate);

  if (!targetDate) return null;

  const startIcal = toIcalDate(targetDate);
  const endIcal = addDaysToIcalDate(targetDate, 1); // all-day event ends next day in iCal standard
  const startIso = toIsoDateOnly(targetDate);
  const endIso = toIsoDateOnly(targetDate);

  const title = isDeadline
    ? `[วันสุดท้าย] ปิดรับสมัคร: ${job.department} (${totalCount} อัตรา)`
    : `[วันแรก] เปิดรับสมัคร: ${job.department} (${totalCount} อัตรา)`;

  const categories = job.categories?.length > 0 ? job.categories : (job.category ? [job.category] : ["งานราชการ"]);

  const positionsSummary = job.positionList && job.positionList.length > 0
    ? job.positionList.slice(0, 4).map(p => `• ${p.title} (${p.count || 1} อัตรา)`).join("\n")
    : `• รวม ${totalCount} อัตรา`;

  // Build application method lines cleanly based on actual mode
  const applyMethodLines = [];
  if (isOnline) {
    applyMethodLines.push("🌐 วิธีการสมัคร: สมัครทางอินเทอร์เน็ต (ออนไลน์)");
    applyMethodLines.push(`🔗 ลิงก์ระบบรับสมัคร: ${job.applyUrl}`);
    if (pdfUrl) {
      applyMethodLines.push(`📄 ไฟล์ประกาศฉบับเต็ม: ${pdfUrl}`);
    }
  } else if (isEmail) {
    applyMethodLines.push("📧 วิธีการสมัคร: ส่งใบสมัครและเอกสารหลักฐานทางอีเมล");
    applyMethodLines.push(`✉️ ส่งไปที่อีเมล: ${detectedEmail}`);
    if (pdfUrl) {
      applyMethodLines.push(`📄 ไฟล์ประกาศและแบบฟอร์ม: ${pdfUrl}`);
    }
  } else {
    // In-Person Application (สมัครด้วยตนเอง)
    applyMethodLines.push("📍 วิธีการสมัคร: ยื่นใบสมัครด้วยตนเอง ณ หน่วยงานที่เปิดรับสมัคร");
    applyMethodLines.push(`🏛️ สถานที่รับสมัคร: ${job.department} ${provinces.length > 0 ? `(${provinces.join(", ")})` : ""}`);
    applyMethodLines.push("🕒 เวลาทำการ: ในวันและเวลาราชการ (โปรดตรวจสอบสถานที่และห้องรับสมัครในประกาศ)");
    if (pdfUrl) {
      applyMethodLines.push(`📄 ไฟล์ประกาศฉบับเต็ม / ดาวน์โหลดแบบฟอร์ม: ${pdfUrl}`);
    }
  }
  applyMethodLines.push(`📱 ดูข้อมูลประกาศสรุปใน ReadyToGovTH: ${jobUrl}`);

  const description = [
    `📌 ประกาศรับสมัคร: ${job.department}`,
    `💼 ตำแหน่งที่เปิดรับ:\n${positionsSummary}`,
    `💰 อัตราเงินเดือน: ${displaySalary}`,
    `🏛️ ประเภท: ${categories.join(", ")}`,
    job.isNoOCSC ? "✨ คุณสมบัติ: ไม่ต้องผ่าน ภาค ก ของ ก.พ." : "📝 คุณสมบัติ: ต้องผ่าน ภาค ก ของ ก.พ.",
    `📍 สถานที่ปฏิบัติงาน: ${location}`,
    `📅 กำหนดการ: ${formatDate(job.startDate || job.postedDate)} – ${formatDate(job.deadline)}`,
    "",
    ...applyMethodLines,
    "",
    "💡 คำแนะนำ: แนะนำให้เตรียมเอกสารและยื่นใบสมัครล่วงหน้า 1-2 วันก่อนปิดรับสมัคร ป้องกันระบบขัดข้องหรือเอกสารไม่ครบถ้วน",
  ].join("\n");

  return {
    jobId: job.id,
    department: job.department,
    title,
    location,
    description,
    targetDate,
    startIcal,
    endIcal,
    startIso,
    endIso,
    jobUrl,
    applyUrl: isOnline ? job.applyUrl : (pdfUrl || jobUrl),
    isOnline,
    isEmail,
    isInPerson,
    detectedEmail,
    pdfUrl,
    reminderDays,
    isDeadline,
  };
}

/**
 * Generate Google Calendar direct web URL
 */
export function getGoogleCalendarUrl(eventData) {
  if (!eventData) return "";
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", eventData.title);
  url.searchParams.set("dates", `${eventData.startIcal}/${eventData.endIcal}`);
  url.searchParams.set("details", eventData.description);
  url.searchParams.set("location", eventData.location);
  return url.toString();
}

/**
 * Generate Outlook Web / Office 365 direct URL
 */
export function getOutlookCalendarUrl(eventData) {
  if (!eventData) return "";
  const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("subject", eventData.title);
  url.searchParams.set("startdt", eventData.startIso);
  url.searchParams.set("enddt", eventData.endIso);
  url.searchParams.set("allday", "true");
  url.searchParams.set("body", eventData.description);
  url.searchParams.set("location", eventData.location);
  return url.toString();
}

/**
 * Generate standard RFC 5545 .ics iCalendar file content
 */
export function generateIcsFileContent(eventData) {
  if (!eventData) return "";

  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `job-${eventData.jobId}-${eventData.targetDate}@readytogov.th`;

  // Escape special characters for ics text
  const escapeIcs = (str) =>
    (str || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  // Alarms for 1 day and 3 days before
  const alarms = eventData.reminderDays
    .map(
      (days) => `BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:เตือนล่วงหน้า ${days} วัน: ${eventData.isDeadline ? "ใกล้ปิดรับสมัคร" : "เปิดรับสมัคร"} ${escapeIcs(eventData.department)}
TRIGGER:-P${days}D
END:VALARM`
    )
    .join("\r\n");

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ReadyToGovTH//Job Application Calendar//TH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${eventData.startIcal}`,
    `DTEND;VALUE=DATE:${eventData.endIcal}`,
    `SUMMARY:${escapeIcs(eventData.title)}`,
    `DESCRIPTION:${escapeIcs(eventData.description)}`,
    `LOCATION:${escapeIcs(eventData.location)}`,
    `URL:${eventData.applyUrl}`,
    alarms,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return icsLines.join("\r\n");
}

/**
 * Detect user device platform
 */
export function getDevicePlatform() {
  if (typeof navigator === "undefined") return { isMobile: false, isIOS: false, isAndroid: false };
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);
  return { isMobile, isIOS, isAndroid };
}

/**
 * Directly trigger the native calendar app on mobile devices (iOS / Android)
 * @param {object} eventData
 * @param {function} onToast
 */
export function openNativeMobileCalendar(eventData, onToast) {
  if (!eventData) return;
  const { isIOS, isAndroid } = getDevicePlatform();

  if (isIOS) {
    // ── iOS (iPhone / iPad) Native Apple Calendar ──
    // Generating .ics blob and triggering link navigation prompts the native iOS "Add to Calendar" sheet
    const content = generateIcsFileContent(eventData);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const fileName = `readytogov-${eventData.jobId}.ics`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);

    if (onToast) {
      onToast("เปิดแอปปฏิทิน Apple Calendar ในเครื่องแล้ว 🍏", "success");
    }
    return;
  }

  if (isAndroid) {
    // ── Android Native Calendar App (Samsung Calendar / Google Calendar) ──
    try {
      const targetDate = eventData.targetDate || new Date().toISOString().split("T")[0];
      const startMs = new Date(`${targetDate}T09:00:00`).getTime() || Date.now();
      const endMs = new Date(`${targetDate}T17:00:00`).getTime() || (startMs + 3600000);

      // Android Intent scheme for calendar insert
      const intentUrl = `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/event;S.title=${encodeURIComponent(eventData.title)};S.description=${encodeURIComponent(eventData.description)};S.eventLocation=${encodeURIComponent(eventData.location)};l.beginTime=${startMs};l.endTime=${endMs};B.allDay=true;end`;

      // Fallback: Google Calendar web/app link
      const fallbackUrl = getGoogleCalendarUrl(eventData);

      const start = Date.now();
      window.location.href = intentUrl;

      // If Android intent does not switch app within 800ms, fallback to Google Calendar
      setTimeout(() => {
        if (Date.now() - start < 1500) {
          window.open(fallbackUrl, "_blank");
        }
      }, 800);

      if (onToast) {
        onToast("เปิดแอปปฏิทินในเครื่อง Android แล้ว 📅", "success");
      }
      return;
    } catch {
      window.open(getGoogleCalendarUrl(eventData), "_blank");
      return;
    }
  }

  // Fallback for desktop or other devices: direct .ics download
  downloadIcsFile(eventData);
  if (onToast) {
    onToast("ดาวน์โหลดไฟล์ปฏิทิน .ics เรียบร้อยแล้ว 📅", "success");
  }
}

/**
 * Download or trigger open for .ics file (Supports iOS Calendar & desktop)
 */
export function downloadIcsFile(eventData, fileName) {
  if (!eventData) return;

  const content = generateIcsFileContent(eventData);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const actualFileName = fileName || `readytogov-${eventData.jobId}-reminder.ics`;

  fallbackDownload(blob, actualFileName);
}

function fallbackDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 500);
}

