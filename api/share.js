export const config = {
  runtime: 'edge',
};

// Fallback sample data in case edge function cannot connect to Firestore
const SAMPLE_FALLBACK = {
  department: "ประกาศรับสมัครงานภาครัฐ",
  title: "รับสมัครงานราชการ / พนักงานราชการ",
  category: "งานราชการ",
  deadline: "",
};

export default async function handler(request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('id') || '';
  const siteUrl = `${url.protocol}//${url.host}`;

  // If query params are provided directly (e.g. from share helper)
  const dept = url.searchParams.get('dept') || SAMPLE_FALLBACK.department;
  const pos = url.searchParams.get('pos') || SAMPLE_FALLBACK.title;
  const cat = url.searchParams.get('cat') || SAMPLE_FALLBACK.category;
  const count = url.searchParams.get('count') || '';
  const salary = url.searchParams.get('salary') || '';
  const deadline = url.searchParams.get('deadline') || '';
  const logo = url.searchParams.get('logo') || '';

  // Construct target canonical URL
  const targetJobUrl = `${siteUrl}/job/${jobId || ''}`;

  // Build the dynamic OG image URL
  const ogParams = new URLSearchParams();
  if (jobId) ogParams.set('id', jobId);
  if (dept) ogParams.set('dept', dept);
  if (pos) ogParams.set('pos', pos);
  if (cat) ogParams.set('cat', cat);
  if (count) ogParams.set('count', count);
  if (salary) ogParams.set('salary', salary);
  if (deadline) ogParams.set('deadline', deadline);
  if (logo) ogParams.set('logo', logo);

  const ogImageUrl = `${siteUrl}/api/og?${ogParams.toString()}`;

  const pageTitle = dept ? `รับสมัครงาน ${dept} - ReadyToGovTH` : `ประกาศรับสมัครงานราชการ - ReadyToGovTH`;
  const pageDesc = dept 
    ? `เปิดรับสมัครงาน ${dept} ${cat} ${pos ? `ตำแหน่ง ${pos}` : ''} ${count ? `รวม ${count} อัตรา` : ''} ${salary ? `เงินเดือน ${salary}` : ''} ดูรายละเอียดและสมัครออนไลน์`
    : `ศูนย์รวมประกาศรับสมัครงานราชการ พนักงานราชการ รัฐวิสาหกิจ อัปเดตล่าสุด`;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${targetJobUrl}">

  <!-- Open Graph / Facebook / LINE -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="ReadyToGovTH">
  <meta property="og:url" content="${targetJobUrl}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(pageDesc)}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(pageTitle)}">
  <meta property="og:locale" content="th_TH">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@ReadyToGovTH">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(pageDesc)}">
  <meta name="twitter:image" content="${ogImageUrl}">

  <!-- Instant Client Redirect for Human Browsers -->
  <meta http-equiv="refresh" content="0;url=/job/${encodeURIComponent(jobId)}">
  <script>
    if (typeof window !== 'undefined') {
      window.location.replace('/job/${encodeURIComponent(jobId)}');
    }
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box;">
  <div style="max-width: 500px; width: 100%; text-align: center; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 36px 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
    <div style="font-size: 40px; margin-bottom: 16px;">🏛️</div>
    <h1 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; color: #ffffff;">กำลังนำท่านไปยังประกาศ...</h1>
    <p style="font-size: 0.95rem; color: #94a3b8; margin-bottom: 24px;">${escapeHtml(dept || 'ReadyToGovTH')}</p>
    <a href="/job/${encodeURIComponent(jobId)}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
      แตะที่นี่หากหน้าเว็บไม่เปลี่ยนอัตโนมัติ →
    </a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
