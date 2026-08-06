import type { Metadata } from "next";
import ProjectDetailsClient from "./ProjectDetailsClient";
import { API_URL } from "@/config/api";

async function getJobDetails(slug: string) {
  try {
    const res = await fetch(`${API_URL}/jobs/public/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching job details on server:", err);
    return null;
  }
}

async function getSiteSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`, { cache: "no-store" });
    if (!res.ok) return null;
    const data: any[] = await res.json();
    const raw = data.find((s) => s.setting_key === "site_settings")?.setting_value;
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
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
  const [job, siteSettings] = await Promise.all([
    getJobDetails(slug),
    getSiteSettings(),
  ]);

  const siteName = siteSettings?.site_name || "LancerFlow";
  const siteBaseUrl = "https://freelancer.sangvish.com";

  if (!job) {
    return {
      title: `Project Opportunity | ${siteName}`,
      description: `View project opportunity details on ${siteName}.`,
    };
  }

  // Check manual SEO values
  let manualSeoTitle = "";
  let manualSeoDesc = "";
  let manualSeoImg = "";

  if (job.seo) {
    try {
      const parsedSeo = typeof job.seo === 'string' ? JSON.parse(job.seo) : job.seo;
      manualSeoTitle = parsedSeo.meta_title || parsedSeo.title || "";
      manualSeoDesc = parsedSeo.meta_description || parsedSeo.description || "";
      manualSeoImg = parsedSeo.image || parsedSeo.og_image || "";
    } catch (e) {
      console.error("Error parsing project SEO:", e);
    }
  }

  // 1. Title Fallback: SEO Title -> Project Title
  const seoTitle = manualSeoTitle || job.title || "Project Opportunity";

  // 2. Description Fallback: SEO Desc -> Clean Project Description
  const rawJobDesc = job.description ? job.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : "";
  const seoDesc = manualSeoDesc || (rawJobDesc.length > 160 ? rawJobDesc.substring(0, 157) + "..." : rawJobDesc);

  // 3. Image Fallback: SEO Image -> Client Image / Company Logo -> Default Image
  const jobImg = job.client_image || job.company_logo || job.attachment_url || "";
  const seoImg = manualSeoImg || jobImg || "";

  const formatImageUrl = (url: string) => {
    if (!url) return `${siteBaseUrl}/tablet-work.png`;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${siteBaseUrl}${cleanPath}`;
  };

  const finalImg = formatImageUrl(seoImg);

  return {
    metadataBase: new URL(siteBaseUrl),
    title: `${seoTitle} | ${siteName}`,
    description: seoDesc,
    openGraph: {
      type: "website",
      url: `${siteBaseUrl}/projects/${slug}`,
      title: seoTitle,
      description: seoDesc,
      siteName: siteName,
      images: [
        {
          url: finalImg,
          width: 1200,
          height: 630,
          alt: seoTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc,
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
  const job = await getJobDetails(slug);

  return <ProjectDetailsClient initialJob={job} initialSlug={slug} />;
}
