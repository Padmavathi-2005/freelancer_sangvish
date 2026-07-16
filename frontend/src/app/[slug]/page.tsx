import type { Metadata } from "next";
import DynamicCmsPageClient from "./DynamicCmsPageClient";

import { API_URL } from "@/config/api";


async function getPageData(slug: string) {
  try {
    const res = await fetch(`${API_URL}/pages/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching CMS page on server:", err);
    return null;
  }
}

async function getSiteSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data: any[] = await res.json();
    const raw = data.find((s) => s.setting_key === "site_settings")?.setting_value;
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

const formatImageUrl = (url: string | null | undefined, siteBaseUrl: string) => {
  if (!url) return null;
  if (url.startsWith("/")) {
    return `${siteBaseUrl}${url}`;
  }
  if (url.includes("localhost:5000")) {
    return url.replace("http://localhost:5000", siteBaseUrl);
  }
  return url;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string } | any;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const [pageData, siteSettings] = await Promise.all([
    getPageData(slug),
    getSiteSettings(),
  ]);

  const siteName = siteSettings?.site_name || "Buy2Lancer";
  const siteBaseUrl = "https://freelancer.sangvish.com";
  const defaultOgImage = siteSettings?.site_og_image
    ? formatImageUrl(siteSettings.site_og_image, siteBaseUrl)
    : null;

  if (!pageData) {
    return {
      title: `Page Not Found | ${siteName}`,
      description: `The page you are looking for does not exist on ${siteName}.`,
    };
  }

  // 1. Check if the CMS page has manual SEO fields set in the database
  let seoTitle = "";
  let seoDesc = "";
  let seoKeywords = "";
  let seoImg = "";

  if (pageData.seo) {
    try {
      const parsedSeo = typeof pageData.seo === "string" ? JSON.parse(pageData.seo) : pageData.seo;
      seoTitle = parsedSeo?.title || "";
      seoDesc = parsedSeo?.description || "";
      seoKeywords = parsedSeo?.keywords || "";
      seoImg = parsedSeo?.og_image || parsedSeo?.image || "";
    } catch (e) {
      console.error("Failed to parse page SEO details", e);
    }
  }

  // 2. Fallbacks if manual SEO fields are not set
  const pageTitle = pageData.title
    ? pageData.title.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
    : "Info Page";

  let fallbackDesc = "Explore this page on Buy2Lancer Freelance Services Marketplace.";
  if (!seoDesc && pageData.content_type === "HTML" && pageData.content) {
    const plainText = pageData.content.replace(/<[^>]*>/g, "").trim();
    if (plainText) {
      fallbackDesc = plainText.length > 160 ? `${plainText.substring(0, 157)}...` : plainText;
    }
  }

  const finalTitle = seoTitle || `${pageTitle} | ${siteName}`;
  const finalDesc = seoDesc || fallbackDesc;
  const finalKeywords = seoKeywords || siteSettings?.site_keywords || "";
  const finalImage = seoImg ? formatImageUrl(seoImg, siteBaseUrl) : defaultOgImage;

  return {
    title: finalTitle,
    description: finalDesc,
    keywords: finalKeywords,
    openGraph: {
      type: "website",
      title: finalTitle,
      description: finalDesc,
      ...(finalImage ? { images: [{ url: finalImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDesc,
      ...(finalImage ? { images: [finalImage] } : {}),
    },
  };
}

export default function Page() {
  return <DynamicCmsPageClient />;
}
