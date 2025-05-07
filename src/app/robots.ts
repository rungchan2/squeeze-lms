import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://squeezeedu.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/signup', '/login'],
      // 관리자 페이지나 민감한 페이지는 크롤링 제외
      disallow: [
        '/admin',
        '/private',
        '/api/*',
        '/*.json',
        '/forgot-password',
      ],
    },
    // 사이트맵 위치 명시
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
} 