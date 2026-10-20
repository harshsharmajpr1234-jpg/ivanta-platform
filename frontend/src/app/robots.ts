import type { MetadataRoute } from 'next';
import { BRAND } from '@/constants';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/seller', '/checkout', '/account'] }], sitemap: `${BRAND.domain}/sitemap.xml` };
}
