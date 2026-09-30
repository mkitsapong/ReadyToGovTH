import { getTotalJobPositions, getDisplayProvinces, formatDate, daysLeft } from "./helpers.js";

/**
 * Get salary text display for a job
 */
export function getJobSalaryText(job) {
  if (!job) return "ตามระเบียบกำหนด";
  const positions = job.positionList || [];
  const salaries = positions.map((p) => p.salary?.trim()).filter(Boolean);
  
  if (salaries.length > 0) {
    const nums = salaries
      .flatMap((s) => s.match(/[\d,]+/g) || [])
      .map((n) => parseInt(n.replace(/,/g, ""), 10))
      .filter((n) => n >= 3000);
    if (nums.length > 0) {
      const minSalary = Math.min(...nums);
      const maxSalary = Math.max(...nums);
      return minSalary === maxSalary
        ? `${minSalary.toLocaleString()} บาท`
        : `${minSalary.toLocaleString()} – ${maxSalary.toLocaleString()} บาท`;
    }
    return salaries[0];
  }
  return job.salary || "ตามระเบียบกำหนด";
}

/**
 * Generate dynamic Open Graph (OG) Image URL for a specific job
 * Calls the /api/og Edge Function with rich URL params
 */
export function getJobOgImageUrl(job, baseUrl = "") {
  if (!job) return `${baseUrl}/api/og`;

  const siteOrigin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://readytogov.th");
  const params = new URLSearchParams();

  params.set("id", String(job.id || ""));
  params.set("dept", job.department || "ประกาศรับสมัครงานภาครัฐ");

  // Position headline
  const positions = job.positionList || [];
  if (positions.length === 1) {
    params.set("pos", positions[0].title || "");
  } else if (positions.length > 1) {
    params.set("pos", `${positions[0].title} (+${positions.length - 1} ตำแหน่ง)`);
  } else if (job.title) {
    params.set("pos", job.title);
  } else {
    params.set("pos", "หลายตำแหน่ง");
  }

  // Headcount
  const totalCount = getTotalJobPositions(job);
  params.set("count", String(totalCount));

  // Salary
  const salaryText = getJobSalaryText(job);
  params.set("salary", salaryText);

  // Category
  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const primaryCategory = categories[0] || "งานราชการ";
  params.set("cat", primaryCategory);

  // Deadline & Days remaining
  if (job.deadline) {
    params.set("deadline", formatDate(job.deadline));
    const remaining = daysLeft(job.deadline);
    params.set("days", String(remaining));
  }

  // OCSC status
  if (job.isNoOCSC) {
    params.set("ocsc", "no"); // ไม่ต้องผ่าน ภาค ก
  } else if (job.isOCSC) {
    params.set("ocsc", "yes"); // ต้องผ่าน ภาค ก
  }

  // Organization Logo URL (if valid web URL)
  if (job.logoUrl && job.logoUrl.startsWith("http")) {
    params.set("logo", job.logoUrl);
  }

  // Province / Location
  const provs = getDisplayProvinces(job);
  if (provs.length > 0) {
    const provDisplay = provs.length === 1 ? provs[0] : `${provs[0]} และอื่นๆ`;
    params.set("prov", provDisplay);
  }

  return `${siteOrigin}/api/og?${params.toString()}`;
}

/**
 * Generate clean Deep Link URL for a job
 */
export function getJobDeepLink(job, options = {}) {
  if (!job) return "https://readytogov.th";
  const { baseUrl, utmSource, utmMedium, useSharePath = false } = options;
  const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://readytogov.th");

  const path = useSharePath ? `/share/${job.id}` : `/job/${job.id}`;
  const url = new URL(path, origin);

  if (utmSource) url.searchParams.set("utm_source", utmSource);
  if (utmMedium) url.searchParams.set("utm_medium", utmMedium);

  return url.toString();
}

/**
 * Generate formatted text summary for sharing to chat apps and social feeds
 */
export function buildShareSummaryText(job, deepLinkUrl) {
  if (!job) return "";
  const link = deepLinkUrl || getJobDeepLink(job);
  const totalCount = getTotalJobPositions(job);
  const salaryText = getJobSalaryText(job);
  const deadlineText = job.deadline ? formatDate(job.deadline) : "โปรดตรวจสอบในประกาศ";
  const remaining = daysLeft(job.deadline);
  const daysText = remaining < 0 ? "⚠️ ปิดรับแล้ว" : remaining === 0 ? "🚨 ปิดรับวันนี้!" : `⏳ เหลือ ${remaining} วัน`;

  const positions = job.positionList || [];
  const mainTitle = positions.length === 1
    ? positions[0].title
    : positions.length > 1
      ? `${positions[0].title} (+${positions.length - 1} ตำแหน่ง)`
      : "หลายตำแหน่ง";

  const ocscNotice = job.isNoOCSC
    ? "✨ ไม่ต้องผ่าน ภาค ก. (ก.พ.) ก็สมัครได้!"
    : job.isOCSC
      ? "📝 ต้องผ่าน ภาค ก. (ก.พ.)"
      : "";

  const categories = job.categories && job.categories.length > 0 ? job.categories : (job.category ? [job.category] : []);
  const category = categories[0] || "งานราชการ";

  return `📢 เปิดรับสมัครงาน ${category}!
🏛️ ${job.department}
📌 ตำแหน่ง: ${mainTitle}
👥 รวม ${totalCount} อัตรา | 💰 เงินเดือน: ${salaryText}
📅 รับสมัครถึง: ${deadlineText} (${daysText})
${ocscNotice ? `${ocscNotice}\n` : ""}
👉 ดูรายละเอียดและวิธีสมัครออนไลน์ (Deep Link):
🔗 ${link}

#งานราชการ #รับสมัครงาน #${category.replace(/\s+/g, "")} #ReadyToGovTH`.trim();
}

/**
 * Generate 1-click social share intents
 */
export function getSocialShareLinks(job, deepLinkUrl) {
  const link = deepLinkUrl || getJobDeepLink(job);
  const encodedUrl = encodeURIComponent(link);
  const summaryText = buildShareSummaryText(job, link);
  const encodedText = encodeURIComponent(summaryText);
  const titleText = encodeURIComponent(`เปิดรับสมัครงาน: ${job.department}`);

  return {
    // 1. LINE Chat & Timeline
    line: `https://line.me/R/msg/text/?${encodedText}`,
    // 2. Facebook Share Dialog
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    // 3. X / Twitter Intent
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(`📢 เปิดรับสมัครงาน ${job.department} รวม ${getTotalJobPositions(job)} อัตรา`)}&hashtags=งานราชการ,ReadyToGovTH`,
    // 4. Messenger Direct Dialog
    messenger: `fb-messenger://share/?link=${encodedUrl}`,
    // 5. LinkedIn
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    // 6. Telegram
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${titleText}`,
  };
}
