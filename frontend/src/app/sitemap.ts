import type { MetadataRoute } from 'next';

const ROUTES = ['', '/sell', '/accepted-devices', '/how-it-works', '/locations', '/support', '/about', '/login', '/terms', '/privacy', '/refund-policy', '/shipping-policy'];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `https://ivanta.in${r}`,
    lastModified: new Date(),
    changeFrequency: r === '' || r === '/sell' ? 'daily' : 'weekly',
    priority: r === '' ? 1 : r === '/sell' ? 0.9 : 0.6,
  }));
}
