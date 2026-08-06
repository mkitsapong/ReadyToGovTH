import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, url, imageUrl, type = 'website', keywords = '' }) {
  const siteTitle = title ? `${title} - ReadyToGov` : 'ReadyToGov - รวมประกาศรับสมัครงานราชการ';
  const defaultDesc = 'เว็บบอร์ดรวบรวมประกาศรับสมัครงานภาครัฐ ข้าราชการ พนักงานราชการ รัฐวิสาหกิจ ลูกจ้างชั่วคราว และพนักงานหน่วยงานของรัฐ อัปเดตล่าสุด';
  const siteDesc = description || defaultDesc;
  const siteUrl = url || 'https://readytogov.th'; // เปลี่ยนเป็นโดเมนจริงเมื่อพร้อม
  const siteKeywords = keywords || 'งานราชการ, สมัครงานราชการ, ข้าราชการ, พนักงานราชการ, รัฐวิสาหกิจ, ลูกจ้างชั่วคราว, พนักงานหน่วยงานของรัฐ, พนักงานมหาวิทยาลัย, พนักงานกองทุน, องค์การมหาชน';
  
  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={siteDesc} />
      <meta name="keywords" content={siteKeywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDesc} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={siteUrl} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={siteDesc} />
      {imageUrl && <meta property="twitter:image" content={imageUrl} />}
    </Helmet>
  );
}
