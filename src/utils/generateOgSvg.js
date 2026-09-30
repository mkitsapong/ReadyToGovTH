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

  let catBg = 'rgba(59, 130, 246, 0.2)';
  let catBorder = '#3b82f6';
  let catText = '#93c5fd';
  if (safeCat.includes('พนักงานราชการ')) {
    catBg = 'rgba(16, 185, 129, 0.2)';
    catBorder = '#10b981';
    catText = '#6ee7b7';
  } else if (safeCat.includes('รัฐวิสาหกิจ')) {
    catBg = 'rgba(245, 158, 11, 0.2)';
    catBorder = '#f59e0b';
    catText = '#fcd34d';
  } else if (safeCat.includes('ลูกจ้าง')) {
    catBg = 'rgba(168, 85, 247, 0.2)';
    catBorder = '#a855f7';
    catText = '#d8b4fe';
  }

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="60" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Ambient Ambient Glows -->
  <circle cx="1080" cy="90" r="220" fill="#f97316" opacity="0.18" filter="url(#glow)" />
  <circle cx="120" cy="540" r="240" fill="#3b82f6" opacity="0.15" filter="url(#glow)" />

  <!-- Outer Frame -->
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2" />

  <!-- Header: Brand Identity -->
  <g transform="translate(64, 64)">
    <rect width="48" height="48" rx="14" fill="url(#brandGrad)" />
    <text x="24" y="32" font-size="24" text-anchor="middle">🏛️</text>
    <text x="64" y="30" font-family="'Prompt', -apple-system, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">ReadyToGov<tspan fill="#f97316">.th</tspan></text>
    <text x="64" y="46" font-family="'Prompt', -apple-system, sans-serif" font-size="12" fill="#94a3b8">ศูนย์รวมประกาศรับสมัครงานราชการไทย</text>
  </g>

  <!-- Header: Category & OCSC Badges -->
  <g transform="translate(1136, 88)">
    <g transform="translate(-160, -18)">
      <rect width="160" height="38" rx="19" fill="${catBg}" stroke="${catBorder}" />
      <text x="80" y="24" font-family="'Prompt', -apple-system, sans-serif" font-size="15" font-weight="bold" fill="${catText}" text-anchor="middle">${safeCat}</text>
    </g>
    ${ocsc === 'no' ? `
    <g transform="translate(-360, -18)">
      <rect width="185" height="38" rx="19" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" />
      <text x="92" y="24" font-family="'Prompt', -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#86efac" text-anchor="middle">✨ ไม่ต้องผ่าน ภาค ก</text>
    </g>` : ocsc === 'yes' ? `
    <g transform="translate(-340, -18)">
      <rect width="165" height="38" rx="19" fill="rgba(234, 179, 8, 0.15)" stroke="#eab308" />
      <text x="82" y="24" font-family="'Prompt', -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#fef08a" text-anchor="middle">📝 ต้องผ่าน ภาค ก</text>
    </g>` : ''}
  </g>

  <!-- Hero Card (Department & Position) -->
  <rect x="64" y="140" width="1072" height="230" rx="20" fill="rgba(15, 23, 42, 0.78)" stroke="rgba(255,255,255,0.1)" />
  
  <!-- Dept Logo / Icon -->
  <rect x="96" y="170" width="90" height="90" rx="18" fill="rgba(30, 41, 59, 0.9)" stroke="rgba(255,255,255,0.15)" />
  <text x="141" y="228" font-size="44" text-anchor="middle">🇹🇭</text>

  <!-- Department Name -->
  <text x="210" y="210" font-family="'Prompt', -apple-system, sans-serif" font-size="${safeDept.length > 45 ? 28 : safeDept.length > 30 ? 32 : 38}" font-weight="bold" fill="#ffffff">${safeDept}</text>

  <!-- Position Line -->
  <text x="210" y="260" font-family="'Prompt', -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#f97316">📌 ตำแหน่ง: <tspan fill="#ffffff">${safePos}</tspan></text>
  <text x="210" y="295" font-family="'Prompt', -apple-system, sans-serif" font-size="15" fill="#94a3b8">👉 อ่านประกาศฉบับเต็มและวิธีสมัครออนไลน์ที่ readytogov.th</text>

  <!-- Key Metrics Row (4 Cards) -->
  <!-- Card 1: Quota -->
  <g transform="translate(64, 395)">
    <rect width="250" height="110" rx="16" fill="rgba(30, 41, 59, 0.65)" stroke="rgba(255,255,255,0.08)" />
    <text x="24" y="36" font-family="'Prompt', -apple-system, sans-serif" font-size="13" fill="#94a3b8">👥 จำนวนที่รับ</text>
    <text x="24" y="80" font-family="'Prompt', -apple-system, sans-serif" font-size="26" font-weight="bold" fill="#f97316">${safeCount} อัตรา</text>
  </g>

  <!-- Card 2: Salary -->
  <g transform="translate(338, 395)">
    <rect width="270" height="110" rx="16" fill="rgba(30, 41, 59, 0.65)" stroke="rgba(255,255,255,0.08)" />
    <text x="24" y="36" font-family="'Prompt', -apple-system, sans-serif" font-size="13" fill="#94a3b8">💰 อัตราเงินเดือน</text>
    <text x="24" y="80" font-family="'Prompt', -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#34d399">${safeSalary}</text>
  </g>

  <!-- Card 3: Location -->
  <g transform="translate(632, 395)">
    <rect width="230" height="110" rx="16" fill="rgba(30, 41, 59, 0.65)" stroke="rgba(255,255,255,0.08)" />
    <text x="24" y="36" font-family="'Prompt', -apple-system, sans-serif" font-size="13" fill="#94a3b8">📍 พื้นที่ปฏิบัติงาน</text>
    <text x="24" y="80" font-family="'Prompt', -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#e2e8f0">${safeProv || 'ทั่วประเทศ'}</text>
  </g>

  <!-- Card 4: Deadline -->
  <g transform="translate(886, 395)">
    <rect width="250" height="110" rx="16" fill="${isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.65)'}" stroke="${isUrgent ? '#ef4444' : 'rgba(255,255,255,0.08)'}" />
    <text x="24" y="36" font-family="'Prompt', -apple-system, sans-serif" font-size="13" fill="${isUrgent ? '#fca5a5' : '#94a3b8'}">${isExpired ? '⚠️ สถานะ' : isUrgent ? '🔥 รีบสมัครด่วน' : '📅 ปิดรับสมัคร'}</text>
    <text x="24" y="80" font-family="'Prompt', -apple-system, sans-serif" font-size="19" font-weight="bold" fill="${isExpired ? '#f87171' : isUrgent ? '#ef4444' : '#fbbf24'}">${safeDeadline}</text>
  </g>

  <!-- Footer Watermark & Action -->
  <g transform="translate(64, 545)">
    <line x1="0" y1="0" x2="1072" y2="0" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="0" y="28" font-family="'Prompt', -apple-system, sans-serif" font-size="13" fill="#94a3b8">👉 แตะที่ลิงก์เพื่อดูรายละเอียดและเอกสารสมัครสอบฉบับเต็ม</text>
    <rect x="940" y="10" width="132" height="26" rx="6" fill="rgba(249, 115, 22, 0.12)" stroke="rgba(249, 115, 22, 0.3)" />
    <text x="1006" y="27" font-family="'Prompt', -apple-system, sans-serif" font-size="12" font-weight="bold" fill="#fed7aa" text-anchor="middle">🔗 readytogov.th</text>
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
