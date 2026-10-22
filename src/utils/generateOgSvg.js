/**
 * High-resolution SVG generator for Open Graph 1200x630 cards
 * Minimal Official Style: Clean, prestigious, highly readable official government publication aesthetic
 * Compatible with Node, Vite dev server, and client-side rendering
 */
export function generateOgSvg({ dept, pos, count, salary, cat, deadline, days, ocsc, prov, logo }) {
  const safeDept = escapeXml(dept || 'ประกาศรับสมัครงานภาครัฐ');
  const safePos = escapeXml(pos || 'หลายตำแหน่ง');
  const safeCount = escapeXml(count || '1');
  const safeSalary = escapeXml(salary || 'ตามระเบียบกำหนด');
  const safeCat = escapeXml(cat || 'งานราชการ');
  const safeDeadline = escapeXml(deadline || 'ดูในประกาศ');
  const safeProv = escapeXml(prov || '');
  const daysNum = parseInt(days, 10);
  const isUrgent = !isNaN(daysNum) && daysNum <= 7 && daysNum >= 0;
  const isExpired = !isNaN(daysNum) && daysNum < 0;

  // Category Badge Colors & Gradients (Dignified & refined)
  let catFill = 'rgba(59, 130, 246, 0.16)';
  let catBorder = 'rgba(96, 165, 250, 0.6)';
  let catText = '#93c5fd';
  if (safeCat.includes('พนักงานราชการ')) {
    catFill = 'rgba(16, 185, 129, 0.16)';
    catBorder = 'rgba(52, 211, 153, 0.6)';
    catText = '#6ee7b7';
  } else if (safeCat.includes('รัฐวิสาหกิจ')) {
    catFill = 'rgba(245, 158, 11, 0.16)';
    catBorder = 'rgba(251, 191, 36, 0.6)';
    catText = '#fcd34d';
  } else if (safeCat.includes('ลูกจ้าง')) {
    catFill = 'rgba(168, 85, 247, 0.16)';
    catBorder = 'rgba(192, 132, 252, 0.6)';
    catText = '#d8b4fe';
  }

  // Adaptive Font Sizing
  const deptFontSize = safeDept.length > 55 ? 26 : safeDept.length > 40 ? 30 : safeDept.length > 25 ? 33 : 36;
  const posFontSize = safePos.length > 50 ? 23 : safePos.length > 35 ? 26 : 29;

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&amp;display=swap');
      text {
        font-family: 'Prompt', 'Noto Sans Thai', 'Thonburi', 'Sukhumvit Set', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    </style>

    <!-- Executive Royal Midnight Gradient Background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="50%" stop-color="#111d38" />
      <stop offset="100%" stop-color="#0e172e" />
    </linearGradient>

    <!-- Royal Gold Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Warm Amber Brand Gradient -->
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>

    <!-- Official Hero Card Glass Gradient -->
    <linearGradient id="heroCardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#162344" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0f1932" stop-opacity="0.95" />
    </linearGradient>

    <!-- Stat Card Gradient -->
    <linearGradient id="statCardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#15213d" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0d162a" stop-opacity="0.95" />
    </linearGradient>

    <!-- Card Top Hairline Highlight -->
    <linearGradient id="borderGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(245, 158, 11, 0.5)" />
      <stop offset="30%" stop-color="rgba(255, 255, 255, 0.22)" />
      <stop offset="70%" stop-color="rgba(59, 130, 246, 0.35)" />
      <stop offset="100%" stop-color="rgba(245, 158, 11, 0.3)" />
    </linearGradient>

    <!-- Stat Border Gradient -->
    <linearGradient id="statBorderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.16)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
    </linearGradient>

    <!-- Medallion Drop Shadow -->
    <filter id="medallionShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.45" />
    </filter>

    <!-- Soft Ambient Blur -->
    <filter id="ambientGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="90" result="blur" />
    </filter>
  </defs>

  <!-- 1. Background Canvas -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- 2. Refined Atmospheric Lighting (Subtle, dignified, not loud) -->
  <circle cx="1120" cy="60" r="240" fill="#f59e0b" opacity="0.12" filter="url(#ambientGlow)" />
  <circle cx="80" cy="560" r="240" fill="#3b82f6" opacity="0.12" filter="url(#ambientGlow)" />

  <!-- 3. Minimal Official Double Border Frame -->
  <rect x="28" y="28" width="1144" height="574" rx="22" fill="none" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />
  <rect x="33" y="33" width="1134" height="564" rx="18" fill="none" stroke="rgba(245, 158, 11, 0.22)" stroke-width="1" />

  <!-- Corner Ornamental Accent Markers (Official Touch) -->
  <path d="M42 54 L54 42" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2" stroke-linecap="round" />
  <path d="M1158 54 L1146 42" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2" stroke-linecap="round" />
  <path d="M42 576 L54 588" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2" stroke-linecap="round" />
  <path d="M1158 576 L1146 588" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2" stroke-linecap="round" />

  <!-- ==========================================
       TOP HEADER BAR: Brand & Official Badges
       ========================================== -->
  <g transform="translate(60, 52)">
    <!-- Brand Icon -->
    <rect width="48" height="48" rx="14" fill="url(#brandGrad)" />
    <!-- Government Pillar / Dome Icon -->
    <path d="M13 35h22v2.5H13zm2-4h18v2H15zm2-13h3.5v11H17zm6.25 0h3.5v11h-3.5zm6.25 0h3.5v11h-3.5zm-12.5-3l11-6 11 6v2H17z" fill="#ffffff" />

    <!-- Brand Text -->
    <text x="62" y="28" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="-0.3">
      ReadyToGov<tspan fill="#fb923c">.th</tspan>
    </text>
    <text x="62" y="45" font-size="12.5" font-weight="500" fill="#94a3b8">
      ศูนย์รวมประกาศรับสมัครงานภาครัฐ • ข้อมูลทางการ
    </text>
  </g>

  <!-- Top-Right Badges -->
  <g transform="translate(1140, 76)">
    <!-- Category Badge -->
    <g transform="translate(-160, -20)">
      <rect width="160" height="38" rx="19" fill="${catFill}" stroke="${catBorder}" stroke-width="1.4" />
      <circle cx="22" cy="19" r="4.5" fill="${catText}" />
      <text x="94" y="24" font-size="14.5" font-weight="700" fill="${catText}" text-anchor="middle">${safeCat}</text>
    </g>

    <!-- OCSC Examination Badge -->
    ${ocsc === 'no' ? `
    <g transform="translate(-376, -20)">
      <rect width="202" height="38" rx="19" fill="rgba(16, 185, 129, 0.16)" stroke="rgba(52, 211, 153, 0.55)" stroke-width="1.4" />
      <path d="M22 12l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#34d399" />
      <text x="114" y="24" font-size="13.5" font-weight="700" fill="#6ee7b7" text-anchor="middle">ไม่ต้องผ่าน ภาค ก</text>
    </g>` : ocsc === 'yes' ? `
    <g transform="translate(-366, -20)">
      <rect width="192" height="38" rx="19" fill="rgba(245, 158, 11, 0.16)" stroke="rgba(251, 191, 36, 0.55)" stroke-width="1.4" />
      <path d="M17 12h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zm2 3.5h4.5v1.5H19zm0 3.5h4.5v1.5H19z" fill="#fbbf24" />
      <text x="108" y="24" font-size="13.5" font-weight="700" fill="#fde047" text-anchor="middle">ต้องผ่าน ภาค ก</text>
    </g>` : ''}
  </g>

  <!-- ==========================================
       HERO CARD: Department & Position (Minimal Official)
       ========================================== -->
  <g transform="translate(60, 126)">
    <!-- Container with refined border glow -->
    <rect width="1080" height="248" rx="22" fill="url(#heroCardGrad)" stroke="url(#borderGlowGrad)" stroke-width="1.5" />

    <!-- Left Official Seal Medallion (Clean white background so emblem pops with high prestige) -->
    <g transform="translate(36, 32)">
      <!-- Outer Golden Aura Ring -->
      <circle cx="56" cy="56" r="54" fill="none" stroke="rgba(245, 158, 11, 0.35)" stroke-width="2" />
      <!-- Solid White Luminous Seal Disc -->
      <circle cx="56" cy="56" r="48" fill="#ffffff" filter="url(#medallionShadow)" stroke="url(#goldGrad)" stroke-width="2" />

      ${logo && typeof logo === 'string' && logo.startsWith('http') ? `
      <!-- Official Department Logo -->
      <clipPath id="logoClip">
        <circle cx="56" cy="56" r="42" />
      </clipPath>
      <image href="${escapeXml(logo)}" x="14" y="14" width="84" height="84" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)" />
      ` : `
      <!-- Royal Thai Garuda Official Crest Vector in Dignified Royal Crimson & Gold -->
      <g transform="translate(26, 24)" fill="url(#goldGrad)">
        <path d="M30 4c-1.4 0-2.6.7-3.3 1.8L23 11h14l-3.7-5.2c-.7-1.1-1.9-1.8-3.3-1.8z" />
        <path d="M30 13c-4.1 0-7.5 3.4-7.5 7.5 0 1.9.7 3.6 1.9 4.9V30h11.2v-4.6c1.2-1.3 1.9-3 1.9-4.9 0-4.1-3.4-7.5-7.5-7.5z" />
        <path d="M11 19c-3.8 0-7.5 2.8-9.4 7.5 4.7-.9 9.4.9 13.1 3.8l3.8-4.7c-2.4-3.8-4.7-6.6-7.5-6.6zm38 0c-2.8 0-5.1 2.8-7.5 6.6l3.8 4.7c3.7-2.9 8.4-4.7 13.1-3.8-1.9-4.7-5.6-7.5-9.4-7.5z" />
        <path d="M6 32c3.8 3.8 9.4 6.6 15 7.5l1.9-4.7c-5.6-.9-11.2-3.8-15-7.5zm48 0c-3.8 3.8-9.4 6.6-15 7.5l-1.9-4.7c5.6-.9 11.2-3.8 15-7.5z" />
        <path d="M24 34l-1.9 15 7.5-3.8 7.5 3.8-1.9-15-5.6 3.8-5.6-3.8z" />
        <path d="M19 51l11 9.4 11-9.4-3.8-2.8-7.2 5.6-7.2-5.6z" />
      </g>`}
    </g>

    <!-- Department Name (Clean, dignified, authoritative) -->
    <g transform="translate(170, 32)">
      <text x="0" y="20" font-size="12.5" font-weight="700" fill="#94a3b8" letter-spacing="1">
        🏛️ หน่วยงานภาครัฐผู้เปิดรับสมัคร
      </text>
      <text x="0" y="58" font-size="${deptFontSize}" font-weight="800" fill="#ffffff" letter-spacing="-0.3">
        ${safeDept}
      </text>
    </g>

    <!-- Fine Hairline Divider -->
    <line x1="170" y1="112" x2="1036" y2="112" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />

    <!-- Position Highlight (Commanding Hero Element) -->
    <g transform="translate(170, 134)">
      <!-- Badge Label -->
      <rect width="138" height="30" rx="8" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.45)" stroke-width="1.2" />
      <text x="69" y="20" font-size="13" font-weight="700" fill="#fbbf24" text-anchor="middle">📌 ตำแหน่งที่เปิดรับ</text>

      <!-- Position Title (Crisp, High-Impact) -->
      <text x="154" y="22" font-size="${posFontSize}" font-weight="800" fill="#ffffff" letter-spacing="-0.2">
        ${safePos}
      </text>

      <!-- Subline Trustmark Note -->
      <g transform="translate(0, 48)">
        <circle cx="8" cy="8" r="8" fill="rgba(16, 185, 129, 0.2)" />
        <path d="M5 8l2 2 4-4" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <text x="24" y="12" font-size="13" font-weight="500" fill="#cbd5e1">
          ตรวจสอบคุณสมบัติเฉพาะตำแหน่งและดาวน์โหลดระเบียบการทางการได้ทันที
        </text>
      </g>
    </g>
  </g>

  <!-- ==========================================
       KEY METRICS: 4 Clean Minimal Official Stat Cards
       ========================================== -->
  <g transform="translate(60, 396)">
    <!-- CARD 1: Headcount (จำนวนที่เปิดรับ) -->
    <g transform="translate(0, 0)">
      <rect width="255" height="114" rx="16" fill="url(#statCardGrad)" stroke="url(#statBorderGrad)" stroke-width="1.4" />
      <g transform="translate(20, 18)">
        <circle cx="8" cy="7" r="5" fill="#fb923c" opacity="0.3" />
        <circle cx="8" cy="7" r="3.5" fill="#f97316" />
        <path d="M1 20c0-3.8 3.1-7 7-7s7 3.2 7 7" stroke="#f97316" stroke-width="2" stroke-linecap="round" fill="none" />
        <text x="24" y="14" font-size="13.5" font-weight="600" fill="#94a3b8">จำนวนที่เปิดรับ</text>
      </g>
      <text x="20" y="84" font-size="28" font-weight="800" fill="#fb923c">
        ${safeCount} <tspan font-size="18" font-weight="600" fill="#fed7aa">อัตรา</tspan>
      </text>
    </g>

    <!-- CARD 2: Salary (อัตราเงินเดือน) -->
    <g transform="translate(275, 0)">
      <rect width="275" height="114" rx="16" fill="url(#statCardGrad)" stroke="url(#statBorderGrad)" stroke-width="1.4" />
      <g transform="translate(20, 18)">
        <rect width="20" height="13" rx="2.5" fill="#34d399" opacity="0.25" stroke="#10b981" stroke-width="1.6" />
        <circle cx="10" cy="6.5" r="2.5" fill="#10b981" />
        <text x="28" y="14" font-size="13.5" font-weight="600" fill="#94a3b8">อัตราเงินเดือน</text>
      </g>
      <text x="20" y="84" font-size="${safeSalary.length > 20 ? 19 : 23}" font-weight="800" fill="#34d399">
        ${safeSalary}
      </text>
    </g>

    <!-- CARD 3: Location (สถานที่ปฏิบัติงาน) -->
    <g transform="translate(570, 0)">
      <rect width="245" height="114" rx="16" fill="url(#statCardGrad)" stroke="url(#statBorderGrad)" stroke-width="1.4" />
      <g transform="translate(20, 18)">
        <path d="M9 2a6 6 0 0 0-6 6c0 4.5 6 11 6 11s6-6.5 6-11a6 6 0 0 0-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="#60a5fa" />
        <text x="22" y="14" font-size="13.5" font-weight="600" fill="#94a3b8">สถานที่ปฏิบัติงาน</text>
      </g>
      <text x="20" y="84" font-size="22" font-weight="800" fill="#f1f5f9">
        ${safeProv || 'ทั่วประเทศ'}
      </text>
    </g>

    <!-- CARD 4: Deadline (กำหนดการปิดรับสมัคร) -->
    <g transform="translate(835, 0)">
      <rect width="245" height="114" rx="16" fill="${isUrgent ? 'rgba(239, 68, 68, 0.16)' : 'url(#statCardGrad)'}" stroke="${isUrgent ? 'rgba(248, 113, 113, 0.6)' : 'url(#statBorderGrad)'}" stroke-width="1.4" />
      <g transform="translate(20, 18)">
        ${isUrgent ? `
        <path d="M7 2c.4 2.5-.8 4.2-2 5.8C3 9.6 1.8 11.7 1.8 14.2a6.7 6.7 0 0 0 13.4 0c0-3.3-2.5-6.7-4.2-8.4 0 2.5-.8 3.3-2.5 4.2.4-2.5 0-5.9-1.5-8z" fill="#f87171" />
        <text x="22" y="14" font-size="13.5" font-weight="700" fill="#fca5a5">รับสมัครด่วน!</text>` : `
        <rect width="16" height="16" rx="3.5" fill="none" stroke="#fbbf24" stroke-width="1.8" />
        <line x1="0" y1="5.5" x2="16" y2="5.5" stroke="#fbbf24" stroke-width="1.8" />
        <text x="24" y="14" font-size="13.5" font-weight="600" fill="#94a3b8">${isExpired ? 'สถานะรับสมัคร' : 'ปิดรับสมัคร'}</text>`}
      </g>
      <text x="20" y="84" font-size="${safeDeadline.length > 15 ? 18 : 22}" font-weight="800" fill="${isExpired ? '#f87171' : isUrgent ? '#f87171' : '#fde047'}">
        ${safeDeadline}
      </text>
    </g>
  </g>

  <!-- ==========================================
       FOOTER: Official Call to Action & Trustmark
       ========================================== -->
  <g transform="translate(60, 542)">
    <!-- Fine gradient divider line -->
    <line x1="0" y1="0" x2="1080" y2="0" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />

    <!-- Left Official CTA Notice -->
    <g transform="translate(0, 24)">
      <circle cx="6" cy="6" r="3.5" fill="#fb923c" />
      <text x="18" y="10" font-size="13.5" font-weight="500" fill="#cbd5e1">
        แตะที่ภาพหรือเปิดลิงก์เพื่ออ่านรายละเอียดคุณสมบัติเฉพาะตำแหน่งและวิธีสมัครฉบับเต็ม
      </text>
    </g>

    <!-- Right Official Platform Pill -->
    <g transform="translate(900, 10)">
      <rect width="180" height="34" rx="10" fill="rgba(245, 158, 11, 0.14)" stroke="rgba(245, 158, 11, 0.35)" stroke-width="1.2" />
      <path d="M16 15h3.5a3.5 3.5 0 0 0 0-7H16m-3.5 3.5h3.5m-7 3.5H5.5a3.5 3.5 0 0 1 0-7H9" transform="translate(8, 4)" stroke="#fcd34d" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <text x="100" y="22" font-size="13" font-weight="700" fill="#fef08a" text-anchor="middle">
        readytogov.th
      </text>
    </g>
  </g>
</svg>`;
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
