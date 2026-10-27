import type { MetadataRoute } from 'next';

const ROUTES = [
  '',
  '/products',
  '/condition-guide',
  '/warranty-policy',
  '/support',
  '/about',
  '/shipping-policy',
  '/refund-policy',
  '/terms',
  '/privacy',
  '/login',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `https://flyphones.in${r}`,
    lastModified: new Date(),
    changeFrequency: r === '' || r === '/products' ? 'daily' : 'weekly',
    priority: r === '' ? 1 : r === '/products' ? 0.9 : 0.7,
  }));
}
