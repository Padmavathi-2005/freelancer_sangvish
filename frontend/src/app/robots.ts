import { MetadataRoute } from 'next';
import { API_BASE_URL } from '@/config/api';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/settings/'],
    },
    sitemap: `${API_BASE_URL}/sitemap.xml`,
  };
}
