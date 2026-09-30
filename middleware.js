// Vercel Edge Middleware for Dynamic Social Crawler Interception
export const config = {
  matcher: ['/job/:path*', '/share/:path*'],
};

// Social media crawlers and bots that require static Open Graph meta tags
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Line',
  'Linespider',
  'WhatsApp',
  'Discordbot',
  'TelegramBot',
  'Slackbot',
  'Googlebot',
  'bingbot',
  'Applebot',
  'Yandex',
  'Pinterest',
  'kakaotalk-scrap',
];

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  const isBot = BOT_USER_AGENTS.some((bot) => userAgent.toLowerCase().includes(bot.toLowerCase()));
  const pathParts = url.pathname.split('/').filter(Boolean);
  const routePrefix = pathParts[0]; // 'job' or 'share'
  const jobId = pathParts[1];

  // If a social bot hits /job/:id, OR if anyone hits /share/:id (explicit deep link)
  if (jobId && (isBot || routePrefix === 'share')) {
    url.pathname = '/api/share';
    url.searchParams.set('id', jobId);
    return Response.rewrite(url);
  }

  // Otherwise, regular users proceed to standard Vite SPA client router
  return;
}
