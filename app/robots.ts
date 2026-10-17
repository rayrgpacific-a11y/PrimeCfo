import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://primecfo.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/pricing',
          '/security',
          '/contact',
          '/eula',
          '/privacy',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/insights/',
          '/reports/',
          '/settings/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
