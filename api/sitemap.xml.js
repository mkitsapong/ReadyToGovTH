export const config = {
  runtime: 'edge',
};

/**
 * Dynamic Sitemap API — Vercel Edge Function
 * 
 * Generates a real-time sitemap.xml by fetching all active job IDs from Firestore.
 * This ensures Google & other crawlers discover every individual /job/:id page,
 * dramatically improving SEO coverage beyond the static category pages.
 * 
 * Endpoint: GET /api/sitemap.xml
 * Response: XML sitemap (application/xml)
 * Cache: 1 hour via CDN (s-maxage), revalidate in background (stale-while-revalidate)
 */

const SITE_URL = 'https://readytogov.th';

// Firebase REST API — reads Firestore documents without needing the full SDK
// Uses the public REST endpoint which only requires the project ID
const FIRESTORE_PROJECT_ID = 'readytogovth-app';
const FIRESTORE_REST_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/jobs_live`;

// Static pages that always appear in the sitemap
const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/category/civil', changefreq: 'daily', priority: '0.8' },
  { loc: '/category/government', changefreq: 'daily', priority: '0.8' },
  { loc: '/category/state', changefreq: 'daily', priority: '0.8' },
  { loc: '/category/temp', changefreq: 'daily', priority: '0.8' },
  { loc: '/category/agency', changefreq: 'daily', priority: '0.8' },
  { loc: '/stats', changefreq: 'weekly', priority: '0.6' },
  { loc: '/policy/privacy', changefreq: 'monthly', priority: '0.3' },
  { loc: '/policy/terms', changefreq: 'monthly', priority: '0.3' },
  { loc: '/policy/cookies', changefreq: 'monthly', priority: '0.3' },
];

/**
 * Fetch all job document IDs from Firestore via REST API.
 * Uses field mask to only retrieve the document name (not full data) for efficiency.
 */
async function fetchJobIds() {
  try {
    const params = new URLSearchParams({
      'mask.fieldPaths': '__name__',  // Only retrieve document path, not data
      'pageSize': '500',
    });

    const allIds = [];
    let pageToken = '';

    // Paginate through all documents (Firestore REST API max page size is 300-500)
    do {
      const url = `${FIRESTORE_REST_URL}?${params.toString()}${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        console.error(`Firestore REST API error: ${res.status}`);
        break;
      }

      const data = await res.json();
      const documents = data.documents || [];

      for (const doc of documents) {
        // doc.name format: "projects/{project}/databases/(default)/documents/jobs_live/{docId}"
        const parts = doc.name.split('/');
        const docId = parts[parts.length - 1];
        if (docId) allIds.push(docId);
      }

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    return allIds;
  } catch (err) {
    console.error('Failed to fetch job IDs for sitemap:', err);
    return [];
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Fetch live job IDs from Firestore
  const jobIds = await fetchJobIds();

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static pages
  for (const page of STATIC_PAGES) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Dynamic job detail pages
  for (const id of jobIds) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/job/${escapeXml(id)}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
