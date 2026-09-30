import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

// In-memory font cache for edge worker lifetime
let cachedFontBold = null;
let cachedFontRegular = null;

async function getFont(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  } catch (err) {
    console.warn(`Font fetch failed for ${url}:`, err);
    return null;
  }
}

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract parameters
    const dept = searchParams.get('dept') || 'ประกาศรับสมัครงานภาครัฐ';
    const pos = searchParams.get('pos') || 'หลายตำแหน่ง';
    const count = searchParams.get('count') || '1';
    const salary = searchParams.get('salary') || 'ตามระเบียบกำหนด';
    const cat = searchParams.get('cat') || 'งานราชการ';
    const deadline = searchParams.get('deadline') || '';
    const days = searchParams.get('days') || '';
    const ocsc = searchParams.get('ocsc') || ''; // 'no' | 'yes' | ''
    const logo = searchParams.get('logo') || '';
    const prov = searchParams.get('prov') || '';

    // Calculate urgency status
    const daysNum = parseInt(days, 10);
    const isUrgent = !isNaN(daysNum) && daysNum <= 7 && daysNum >= 0;
    const isExpired = !isNaN(daysNum) && daysNum < 0;

    // Load fonts (Prompt Thai)
    if (!cachedFontBold) {
      cachedFontBold = await getFont('https://cdn.jsdelivr.net/fontsource/fonts/prompt@latest/thai-700-normal.woff');
    }
    if (!cachedFontRegular) {
      cachedFontRegular = await getFont('https://cdn.jsdelivr.net/fontsource/fonts/prompt@latest/thai-400-normal.woff');
    }

    const fonts = [];
    if (cachedFontBold) {
      fonts.push({
        name: 'Prompt',
        data: cachedFontBold,
        style: 'normal',
        weight: 700,
      });
    }
    if (cachedFontRegular) {
      fonts.push({
        name: 'Prompt',
        data: cachedFontRegular,
        style: 'normal',
        weight: 400,
      });
    }

    // Category styling helper
    let catBg = 'rgba(59, 130, 246, 0.2)';
    let catBorder = '#3b82f6';
    let catText = '#93c5fd';
    if (cat.includes('พนักงานราชการ')) {
      catBg = 'rgba(16, 185, 129, 0.2)';
      catBorder = '#10b981';
      catText = '#6ee7b7';
    } else if (cat.includes('รัฐวิสาหกิจ')) {
      catBg = 'rgba(245, 158, 11, 0.2)';
      catBorder = '#f59e0b';
      catText = '#fcd34d';
    } else if (cat.includes('ลูกจ้าง')) {
      catBg = 'rgba(168, 85, 247, 0.2)';
      catBorder = '#a855f7';
      catText = '#d8b4fe';
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#0a0f1d',
            backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.18) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.16) 0%, transparent 45%)',
            padding: '48px 56px',
            fontFamily: 'Prompt, sans-serif',
            color: '#ffffff',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Brand & Category Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* Left Brand Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)',
                  fontSize: '24px',
                }}
              >
                🏛️
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: '#ffffff' }}>
                  ReadyToGov<span style={{ color: '#f97316' }}>.th</span>
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '-2px' }}>
                  ศูนย์รวมประกาศรับสมัครงานราชการไทย
                </span>
              </div>
            </div>

            {/* Right Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {ocsc === 'no' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid #22c55e',
                    color: '#86efac',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  <span>✨</span>
                  <span>ไม่ต้องผ่าน ภาค ก</span>
                </div>
              ) : ocsc === 'yes' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid #eab308',
                    color: '#fef08a',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                >
                  <span>📝</span>
                  <span>ต้องผ่าน ภาค ก</span>
                </div>
              ) : null}

              <div
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  backgroundColor: catBg,
                  border: `1px solid ${catBorder}`,
                  color: catText,
                  fontSize: '15px',
                  fontWeight: 700,
                }}
              >
                {cat}
              </div>
            </div>
          </div>

          {/* Main Card Hero (Department + Position) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '32px 36px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Department Logo */}
            {logo ? (
              <img
                src={logo}
                alt={dept}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '20px',
                  objectFit: 'contain',
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '44px',
                }}
              >
                🇹🇭
              </div>
            )}

            {/* Department & Position Titles */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div
                style={{
                  fontSize: dept.length > 50 ? '30px' : dept.length > 35 ? '34px' : '40px',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.25,
                  letterSpacing: '-0.5px',
                }}
              >
                {dept}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  color: '#f97316',
                  fontWeight: 700,
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>📌</span>
                <span style={{ color: '#fed7aa' }}>ตำแหน่ง:</span>
                <span style={{ color: '#ffffff' }}>{pos}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Highlight Grid (4 Cards) */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              width: '100%',
            }}
          >
            {/* Metric 1: Quota */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px 20px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>👥 จำนวนที่รับ</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#f97316', marginTop: '2px' }}>
                {count} อัตรา
              </span>
            </div>

            {/* Metric 2: Salary */}
            <div
              style={{
                flex: 1.25,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px 20px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>💰 อัตราเงินเดือน</span>
              <span style={{ fontSize: '21px', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
                {salary}
              </span>
            </div>

            {/* Metric 3: Location */}
            {prov && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(30, 41, 59, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                }}
              >
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>📍 พื้นที่ปฏิบัติงาน</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>
                  {prov}
                </span>
              </div>
            )}

            {/* Metric 4: Deadline */}
            <div
              style={{
                flex: 1.15,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: isUrgent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(30, 41, 59, 0.65)',
                border: isUrgent ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px 20px',
              }}
            >
              <span style={{ fontSize: '13px', color: isUrgent ? '#fca5a5' : '#94a3b8', fontWeight: 400 }}>
                {isExpired ? '⚠️ สถานะ' : isUrgent ? '🔥 รีบสมัครด่วน' : '📅 ปิดรับสมัคร'}
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: isExpired ? '#f87171' : isUrgent ? '#ef4444' : '#fbbf24',
                  marginTop: '4px',
                }}
              >
                {deadline ? deadline : 'ดูในประกาศ'} {days && !isExpired && !isNaN(daysNum) ? `(เหลือ ${days} วัน)` : ''}
              </span>
            </div>
          </div>

          {/* Bottom Footer Bar (Call To Action & Deep Link Watermark) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '20px',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
              <span style={{ color: '#f97316' }}>👉</span>
              <span>แตะเพื่อดูรายละเอียดคุณสมบัติและดาวน์โหลดประกาศฉบับเต็ม</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#fed7aa',
                fontWeight: 600,
              }}
            >
              <span>🔗</span>
              <span>readytogov.th</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fonts.length > 0 ? fonts : undefined,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Vercel OG Image generation error:', error);
    // Return SVG fallback response so social scrapers always receive a working image
    return renderSvgFallback(request.url);
  }
}

// Fallback high-res SVG renderer in case of Edge runtime canvas failure
function renderSvgFallback(urlStr) {
  const { searchParams } = new URL(urlStr);
  const dept = (searchParams.get('dept') || 'ประกาศรับสมัครงานภาครัฐ').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const pos = (searchParams.get('pos') || 'หลายตำแหน่ง').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const count = searchParams.get('count') || '1';
  const salary = (searchParams.get('salary') || 'ตามระเบียบกำหนด').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cat = searchParams.get('cat') || 'งานราชการ';
  const deadline = searchParams.get('deadline') || '';

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0f1d" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1080" cy="80" r="260" fill="#f97316" opacity="0.12" filter="blur(60px)" />
  <circle cx="100" cy="540" r="260" fill="#3b82f6" opacity="0.12" filter="blur(60px)" />
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  
  <!-- Brand -->
  <rect x="60" y="60" width="44" height="44" rx="12" fill="url(#brand)" />
  <text x="82" y="90" font-size="22" text-anchor="middle">🏛️</text>
  <text x="116" y="86" font-family="Prompt, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">ReadyToGov<tspan fill="#f97316">.th</tspan></text>
  <text x="116" y="104" font-family="Prompt, sans-serif" font-size="12" fill="#94a3b8">ศูนย์รวมประกาศรับสมัครงานราชการไทย</text>

  <!-- Category Badge -->
  <rect x="1000" y="62" width="140" height="38" rx="19" fill="rgba(59,130,246,0.2)" stroke="#3b82f6" />
  <text x="1070" y="87" font-family="Prompt, sans-serif" font-size="15" font-weight="bold" fill="#93c5fd" text-anchor="middle">${cat}</text>

  <!-- Department & Position Card -->
  <rect x="60" y="140" width="1080" height="230" rx="20" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.12)" />
  <text x="100" y="220" font-family="Prompt, sans-serif" font-size="38" font-weight="bold" fill="#ffffff">${dept}</text>
  <text x="100" y="280" font-family="Prompt, sans-serif" font-size="24" font-weight="bold" fill="#f97316">📌 ตำแหน่ง: <tspan fill="#ffffff">${pos}</tspan></text>
  <text x="100" y="325" font-family="Prompt, sans-serif" font-size="16" fill="#94a3b8">👉 แตะเพื่อดูรายละเอียดและวิธีสมัครออนไลน์</text>

  <!-- Metric Badges -->
  <rect x="60" y="390" width="340" height="120" rx="16" fill="rgba(30,41,59,0.7)" stroke="rgba(255,255,255,0.08)" />
  <text x="84" y="426" font-family="Prompt, sans-serif" font-size="14" fill="#94a3b8">👥 จำนวนที่รับ</text>
  <text x="84" y="475" font-family="Prompt, sans-serif" font-size="28" font-weight="bold" fill="#f97316">${count} อัตรา</text>

  <rect x="430" y="390" width="340" height="120" rx="16" fill="rgba(30,41,59,0.7)" stroke="rgba(255,255,255,0.08)" />
  <text x="454" y="426" font-family="Prompt, sans-serif" font-size="14" fill="#94a3b8">💰 อัตราเงินเดือน</text>
  <text x="454" y="475" font-family="Prompt, sans-serif" font-size="22" font-weight="bold" fill="#34d399">${salary}</text>

  <rect x="800" y="390" width="340" height="120" rx="16" fill="rgba(30,41,59,0.7)" stroke="rgba(255,255,255,0.08)" />
  <text x="824" y="426" font-family="Prompt, sans-serif" font-size="14" fill="#94a3b8">📅 ปิดรับสมัคร</text>
  <text x="824" y="475" font-family="Prompt, sans-serif" font-size="22" font-weight="bold" fill="#fbbf24">${deadline || 'ดูในประกาศ'}</text>

  <!-- Footer -->
  <text x="60" y="555" font-family="Prompt, sans-serif" font-size="14" fill="#94a3b8">🔗 deep link: readytogov.th/job</text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
