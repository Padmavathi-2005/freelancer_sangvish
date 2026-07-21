import type { Metadata } from "next";
import BlogDetailClient from "./BlogDetailClient";
import { API_URL } from "@/config/api";

async function getBlogData(slug: string) {
  try {
    const res = await fetch(`${API_URL}/blogs/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching blog on server:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string } | any;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const blog = await getBlogData(slug);

  const siteName = "LancerFlow";
  const siteBaseUrl = "https://freelancer.sangvish.com";

  if (!blog) {
    return {
      title: `Article | ${siteName}`,
      description: `Read publication details on ${siteName}.`,
    };
  }

  const formatImageUrl = (url: string) => {
    if (!url) return `${siteBaseUrl}/tablet-work.png`;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${siteBaseUrl}${cleanPath}`;
  };

  const finalImg = formatImageUrl(blog.cover_image);
  const title = blog.title;
  const description = blog.summary || (blog.content ? blog.content.replace(/<[^>]*>/g, '').substring(0, 150) + "..." : "");

  return {
    title: `${title} | ${siteName}`,
    description,
    openGraph: {
      type: "article",
      title: `${title} | ${siteName}`,
      description,
      images: [{ url: finalImg }],
      publishedTime: blog.created_at,
      modifiedTime: blog.updated_at || blog.created_at,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: [finalImg],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string } | any;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const blog = await getBlogData(slug);

  if (!blog) {
    return <BlogDetailClient initialBlog={null} />;
  }

  const siteBaseUrl = "https://freelancer.sangvish.com";
  const formatImageUrl = (url: string) => {
    if (!url) return `${siteBaseUrl}/tablet-work.png`;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${siteBaseUrl}${cleanPath}`;
  };

  const finalImg = formatImageUrl(blog.cover_image);

  // Build JSON-LD BlogPosting schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "image": [finalImg],
    "datePublished": blog.created_at,
    "dateModified": blog.updated_at || blog.created_at,
    "author": {
      "@type": "Person",
      "name": blog.author_name || "Administrator",
    },
    "publisher": {
      "@type": "Organization",
      "name": "LancerFlow",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteBaseUrl}/favicon.ico`
      }
    },
    "description": blog.summary || (blog.content ? blog.content.replace(/<[^>]*>/g, '').substring(0, 150) + "..." : "")
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogDetailClient initialBlog={blog} />
    </>
  );
}
