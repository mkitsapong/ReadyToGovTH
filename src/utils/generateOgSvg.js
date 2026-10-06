/**
 * High-resolution SVG generator for Open Graph 1200x630 cards
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

  // Category Badge Colors & Gradients
  let catFill = 'rgba(59, 130, 246, 0.15)';
  let catBorder = 'rgba(96, 165, 250, 0.45)';
  let catText = '#93c5fd';
  if (safeCat.includes('พนักงานราชการ')) {
    catFill = 'rgba(16, 185, 129, 0.16)';
    catBorder = 'rgba(52, 211, 153, 0.5)';
    catText = '#6ee7b7';
  } else if (safeCat.includes('รัฐวิสาหกิจ')) {
    catFill = 'rgba(245, 158, 11, 0.16)';
    catBorder = 'rgba(251, 191, 36, 0.5)';
    catText = '#fcd34d';
  } else if (safeCat.includes('ลูกจ้าง')) {
    catFill = 'rgba(168, 85, 247, 0.16)';
    catBorder = 'rgba(192, 132, 252, 0.5)';
    catText = '#d8b4fe';
  }

  // Adaptive Font Sizing
  const deptFontSize = safeDept.length > 55 ? 26 : safeDept.length > 40 ? 30 : safeDept.length > 25 ? 34 : 38;
  const posFontSize = safePos.length > 60 ? 20 : safePos.length > 40 ? 22 : 24;

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&amp;display=swap');
      text {
        font-family: 'Prompt', 'Noto Sans Thai', 'Thonburi', system-ui, -apple-system, sans-serif;
      }
    </style>

    <!-- Deep Luxury Space Navy Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#060a16" />
      <stop offset="45%" stop-color="#0c1428" />
      <stop offset="100%" stop-color="#080e1c" />
    </linearGradient>

    <!-- Brand Vibrant Glow -->
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>

    <!-- Golden Crest Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <!-- Glass Hero Card Gradient -->
    <linearGradient id="heroCardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141f36" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0c1426" stop-opacity="0.95" />
    </linearGradient>

    <!-- Card Border Top Highlights -->
    <linearGradient id="borderGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(249, 115, 22, 0.6)" />
      <stop offset="50%" stop-color="rgba(255, 255, 255, 0.2)" />
      <stop offset="100%" stop-color="rgba(59, 130, 246, 0.4)" />
    </linearGradient>

    <linearGradient id="statBorderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.18)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.04)" />
    </linearGradient>

    <linearGradient id="statCardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#15213b" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#0d162a" stop-opacity="0.8" />
    </linearGradient>

    <!-- Soft Glow Filter -->
    <filter id="ambientBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="80" result="blur" />
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Atmospheric Glow Lighting -->
  <circle cx="1060" cy="80" r="280" fill="#f97316" opacity="0.16" filter="url(#ambientBlur)" />
  <circle cx="120" cy="540" r="260" fill="#3b82f6" opacity="0.14" filter="url(#ambientBlur)" />
  <circle cx="600" cy="315" r="320" fill="#6366f1" opacity="0.06" filter="url(#ambientBlur)" />

  <!-- Subtle High-Tech Geometric Grid Lines -->
  <g opacity="0.04" stroke="#ffffff" stroke-width="1">
    <line x1="160" y1="0" x2="160" y2="630" />
    <line x1="480" y1="0" x2="480" y2="630" />
    <line x1="800" y1="0" x2="800" y2="630" />
    <line x1="1040" y1="0" x2="1040" y2="630" />
    <line x1="0" y1="120" x2="1200" y2="120" />
    <line x1="0" y1="380" x2="1200" y2="380" />
    <line x1="0" y1="520" x2="1200" y2="520" />
  </g>

  <!-- Luxury Outer Frame -->
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5" />
  <rect x="37" y="37" width="1126" height="556" rx="27" fill="none" stroke="rgba(255, 255, 255, 0.02)" stroke-width="1" />

  <!-- ==========================================
       HEADER: Brand Identity & Verification Badges
       ========================================== -->
  <g transform="translate(64, 60)">
    <!-- Brand Icon (Architectural Gov Symbol) -->
    <rect width="52" height="52" rx="16" fill="url(#brandGrad)" filter="url(#softGlow)" />
    <!-- Government Pillar Crest Icon -->
    <path d="M14 38h24v3H14zm2-5h20v2H16zm2-14h4v12h-4zm7 0h4v12h-4zm7 0h4v12h-4zm-14-3l13-7 13 7v2H13z" fill="#ffffff" />
    
    <!-- Brand Title -->
    <text x="70" y="32" font-size="26" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
      ReadyToGov<tspan fill="#f97316">.th</tspan>
    </text>
    <text x="70" y="50" font-size="13" font-weight="500" fill="#94a3b8">
      ศูนย์รวมประกาศรับสมัครงานภาครัฐ • อัปเดตรายวัน
    </text>
  </g>

  <!-- Badges in Header Top-Right -->
  <g transform="translate(1136, 86)">
    <!-- Category Badge -->
    <g transform="translate(-165, -18)">
      <rect width="165" height="40" rx="20" fill="${catFill}" stroke="${catBorder}" stroke-width="1.5" />
      <circle cx="24" cy="20" r="5" fill="${catText}" />
      <text x="96" y="25" font-size="15" font-weight="700" fill="${catText}" text-anchor="middle">${safeCat}</text>
    </g>

    <!-- OCSC Examination Badge -->
    ${ocsc === 'no' ? `
    <g transform="translate(-385, -18)">
      <rect width="205" height="40" rx="20" fill="rgba(34, 197, 94, 0.16)" stroke="rgba(74, 222, 128, 0.5)" stroke-width="1.5" />
      <!-- Star Icon -->
      <path d="M22 13l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" fill="#4ade80" />
      <text x="115" y="25" font-size="14" font-weight="700" fill="#86efac" text-anchor="middle">ไม่ต้องผ่าน ภาค ก</text>
    </g>` : ocsc === 'yes' ? `
    <g transform="translate(-375, -18)">
      <rect width="195" height="40" rx="20" fill="rgba(245, 158, 11, 0.16)" stroke="rgba(251, 191, 36, 0.5)" stroke-width="1.5" />
      <!-- Document Icon -->
      <path d="M18 13h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V15a2 2 0 0 1 2-2zm2 4h5v2h-5zm0 4h5v2h-5z" fill="#fbbf24" />
      <text x="110" y="25" font-size="14" font-weight="700" fill="#fef08a" text-anchor="middle">ต้องผ่าน ภาค ก</text>
    </g>` : ''}
  </g>

  <!-- ==========================================
       HERO CARD: Department & Position Showcase
       ========================================== -->
  <g transform="translate(64, 142)">
    <!-- Hero Box Background with border glow -->
    <rect width="1072" height="236" rx="24" fill="url(#heroCardGrad)" stroke="url(#borderGlowGrad)" stroke-width="1.5" />
    
    <!-- Left Official Seal Emblem -->
    <g transform="translate(32, 32)">
      <!-- Squircle Container -->
      <rect width="100" height="100" rx="22" fill="#0b1222" stroke="rgba(245, 158, 11, 0.35)" stroke-width="1.5" />
      <rect x="5" y="5" width="90" height="90" rx="18" fill="rgba(245, 158, 11, 0.08)" />
      
      ${logo && typeof logo === 'string' && logo.startsWith('http') ? `
      <!-- Department Logo -->
      <clipPath id="logoClip">
        <rect x="10" y="10" width="80" height="80" rx="14" />
      </clipPath>
      <image href="${escapeXml(logo)}" x="10" y="10" width="80" height="80" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)" />
      ` : `
      <!-- Royal Thai Garuda Official Crest Silhouette Vector -->
      <g transform="translate(18, 16)" fill="url(#goldGrad)">
        <!-- Majestic Eagle / Garuda Symbol -->
        <path d="M32 4c-1.5 0-2.8.8-3.5 2L25 12h14l-3.5-6c-.7-1.2-2-2-3.5-2z"/>
        <path d="M32 14c-4.4 0-8 3.6-8 8 0 2 .7 3.8 2 5.2V32h12v-4.8c1.3-1.4 2-3.2 2-5.2 0-4.4-3.6-8-8-8z"/>
        <path d="M12 20c-4 0-8 3-10 8 5-1 10 1 14 4l4-5c-2.5-4-5-7-8-7zm40 0c-3 0-5.5 3-8 7l4 5c4-3 9-5 14-4-2-5-6-8-10-8z"/>
        <path d="M6 34c4 4 10 7 16 8l2-5c-6-1-12-4-16-8zm52 0c-4 4-10 7-16 8l-2-5c6-1 12-4 16-8z"/>
        <path d="M26 36l-2 16 8-4 8 4-2-16-6 4-6-4z"/>
        <path d="M20 54l12 10 12-10-4-3-8 6-8-6z"/>
      </g>`}
    </g>

    <!-- Department Title -->
    <text x="156" y="70" font-size="${deptFontSize}" font-weight="800" fill="#ffffff" letter-spacing="-0.3">
      ${safeDept}
    </text>

    <!-- Position Highlight Banner -->
    <g transform="translate(156, 102)">
      <!-- Position Pill Label -->
      <rect width="112" height="32" rx="8" fill="rgba(249, 115, 22, 0.2)" stroke="rgba(249, 115, 22, 0.5)" stroke-width="1.2" />
      <text x="56" y="21" font-size="13" font-weight="700" fill="#fdba74" text-anchor="middle">ตำแหน่งที่เปิดรับ</text>

      <!-- Position Name -->
      <text x="126" y="22" font-size="${posFontSize}" font-weight="700" fill="#ffffff">
        ${safePos}
      </text>
    </g>

    <!-- Subtitle Prompt & Verification Note -->
    <g transform="translate(156, 172)">
      <!-- Checkmark Icon -->
      <circle cx="9" cy="9" r="9" fill="rgba(16, 185, 129, 0.2)" />
      <path d="M6 9l2 2 4-4" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <text x="26" y="14" font-size="14" font-weight="500" fill="#94a3b8">
        ตรวจสอบข้อมูลและรายละเอียดคุณสมบัติเฉพาะตำแหน่งอย่างเป็นทางการผ่าน readytogov.th
      </text>
    </g>
  </g>

  <!-- ==========================================
       KEY METRICS GRID (4 Luxury Stat Cards)
       ========================================== -->

  <!-- CARD 1: Quota (จำนวนอัตราที่รับ) -->
  <g transform="translate(64, 400)">
    <rect width="250" height="116" rx="18" fill="url(#statCardGrad)" stroke="url(#statBorderGrad)" stroke-width="1.5" />
    <!-- People Icon -->
    <g transform="translate(24, 20)">
      <circle cx="10" cy="8" r="6" fill="#fb923c" opacity="0.3" />
      <circle cx="10" cy="8" r="4.5" fill="#f97316" />
      <path d="M2 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <text x="26" y="16" font-size="14" font-weight="600" fill="#94a3b8">จำนวนที่เปิดรับ</text>
    </g>
    <text x="24" y="88" font-size="28" font-weight="800" fill="#fb923c">
      ${safeCount} <tspan font-size="19" font-weight="600" fill="#fed7aa">อัตรา</tspan>
    </text>
  </g>

  <!-- CARD 2: Salary (อัตราเงินเดือน) -->
  <g transform="translate(338, 400)">
    <rect width="270" height="116" rx="18" fill="url(#statCardGrad)" stroke="url(#statBorderGrad)" stroke-width="1.5" />
    <!-- Banknote / Coins Icon -->
    <g transform="translate(24, 20)">
      <rect width="22" height="15" rx="3" fill="#34d399" opacity="0.25" stroke="#10b981" stroke-width="1.8" />
      <circle cx="11" cy="7.5" r="3" fill="#10b981" />
      <text x="30" y="16" font-size="14" font-weight="600" fill="#94a3b8">อัตราเงินเดือน</text>
    </g>
    <text x="24" y="88" font-size="${safeSalary.length > 20 ? 18 : 22}" font-weight="800" fill="#34d399">
      ${safeSalary}
    </text>
  </g>

  <!-- CARD 3: Location (สถานที่ปฏิบัติงาน) -->
  <g transform="translate(632, 400)">
    <rect width="230" height="116" rx="18" fill="url(#statCardGrad)" stroke="url(#statBorderGrad)" stroke-width="1.5" />
    <!-- Map Pin Icon -->
    <g transform="translate(24, 20)">
      <path d="M10 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#60a5fa" />
      <text x="24" y="16" font-size="14" font-weight="600" fill="#94a3b8">สถานที่ปฏิบัติงาน</text>
    </g>
    <text x="24" y="88" font-size="22" font-weight="800" fill="#f1f5f9">
      ${safeProv || 'ทั่วประเทศ'}
    </text>
  </g>

  <!-- CARD 4: Deadline (กำหนดการปิดรับสมัคร) -->
  <g transform="translate(886, 400)">
    <rect width="250" height="116" rx="18" fill="${isUrgent ? 'rgba(239, 68, 68, 0.14)' : 'url(#statCardGrad)'}" stroke="${isUrgent ? 'rgba(248, 113, 113, 0.6)' : 'url(#statBorderGrad)'}" stroke-width="1.5" />
    <!-- Calendar / Fire Icon -->
    <g transform="translate(24, 20)">
      ${isUrgent ? `
      <!-- Flame Icon -->
      <path d="M8 2c.5 3-1 5-2.5 7C3.5 11.5 2 14 2 17a8 8 0 0 0 16 0c0-4-3-8-5-10 0 3-1 4-3 5 .5-3 0-7-2-10z" fill="#f87171" />
      <text x="24" y="16" font-size="14" font-weight="700" fill="#fca5a5">รับสมัครด่วน!</text>` : `
      <!-- Calendar Icon -->
      <rect width="18" height="18" rx="4" fill="none" stroke="#fbbf24" stroke-width="2" />
      <line x1="0" y1="6" x2="18" y2="6" stroke="#fbbf24" stroke-width="2" />
      <line x1="5" y1="1" x2="5" y2="4" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" />
      <line x1="13" y1="1" x2="13" y2="4" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" />
      <text x="26" y="16" font-size="14" font-weight="600" fill="#94a3b8">${isExpired ? 'สถานะรับสมัคร' : 'ปิดรับสมัคร'}</text>`}
    </g>
    <text x="24" y="88" font-size="${safeDeadline.length > 15 ? 18 : 21}" font-weight="800" fill="${isExpired ? '#f87171' : isUrgent ? '#f87171' : '#fbbf24'}">
      ${safeDeadline}
    </text>
  </g>

  <!-- ==========================================
       FOOTER: Watermark & Official Call to Action
       ========================================== -->
  <g transform="translate(64, 545)">
    <!-- Fine gradient divider line -->
    <line x1="0" y1="0" x2="1072" y2="0" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />

    <!-- Left CTA -->
    <g transform="translate(0, 26)">
      <circle cx="8" cy="4" r="4" fill="#f97316" />
      <text x="20" y="9" font-size="13" font-weight="500" fill="#cbd5e1">
        แตะที่ภาพหรือลิงก์เพื่อเปิดอ่านรายละเอียดคุณสมบัติและดาวน์โหลดไฟล์ประกาศฉบับเต็ม
      </text>
    </g>

    <!-- Right Official Platform Pill -->
    <g transform="translate(900, 10)">
      <rect width="172" height="34" rx="10" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.35)" stroke-width="1.2" />
      <!-- Link Chain Icon -->
      <path d="M18 17h4a4 4 0 0 0 0-8h-4m-4 4h4m-8 4h-4a4 4 0 0 1 0-8h4" transform="translate(6, 4)" stroke="#fdba74" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <text x="96" y="22" font-size="13" font-weight="700" fill="#fed7aa" text-anchor="middle">
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
