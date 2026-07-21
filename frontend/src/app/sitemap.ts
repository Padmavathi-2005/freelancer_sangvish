import { MetadataRoute } from 'next';
import { API_URL, API_BASE_URL } from '@/config/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  const staticUrls = [
    '',
    '/pricing',
    '/login',
    '/register',
    '/blogs',
    '/talent',
    '/gigs',
    '/projects',
  ].map((route) => ({
    url: `${API_BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Fetch public blogs
  let blogUrls: any[] = [];
  try {
    const res = await fetch(`${API_URL}/blogs?limit=500`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const blogs = data.blogs || [];
      blogUrls = blogs.map((blog: any) => ({
        url: `${API_BASE_URL}/blogs/${blog.slug}`,
        lastModified: new Date(blog.updated_at || blog.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("Sitemap: Failed to fetch blogs:", err);
  }

  // 3. Fetch public Gigs
  let gigUrls: any[] = [];
  try {
    const res = await fetch(`${API_URL}/freelancer/client/gigs`, { cache: 'no-store' });
    if (res.ok) {
      const gigs = await res.json();
      gigUrls = (gigs || []).map((gig: any) => ({
        url: `${API_BASE_URL}/gigs/${gig.gig_id}`,
        lastModified: new Date(gig.updated_at || gig.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error("Sitemap: Failed to fetch gigs:", err);
  }

  // 4. Fetch public freelancer profiles
  let freelancerUrls: any[] = [];
  try {
    const res = await fetch(`${API_URL}/freelancer/public/list`, { cache: 'no-store' });
    if (res.ok) {
      const freelancers = await res.json();
      freelancerUrls = (freelancers || []).map((freelancer: any) => ({
        url: `${API_BASE_URL}/freelancer/${freelancer.slug || freelancer.user_id}`,
        lastModified: new Date(freelancer.updated_at || freelancer.created_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error("Sitemap: Failed to fetch freelancers:", err);
  }

  return [...staticUrls, ...blogUrls, ...gigUrls, ...freelancerUrls];
}
