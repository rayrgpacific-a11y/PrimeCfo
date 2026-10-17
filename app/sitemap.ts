import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://primecfo.ai';
  const currentDate = new Date();

  const publicRoutes = [
    '',
    '/about',
    '/pricing',
    '/security',
    '/contact',
    '/eula',
    '/privacy',
    '/login',
    '/signup',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' ? 'daily' : route === '/pricing' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/pricing' ? 0.9 : 0.7,
  }));
}
