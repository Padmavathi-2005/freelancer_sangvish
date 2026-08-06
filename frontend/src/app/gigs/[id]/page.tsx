import type { Metadata } from "next";
import GigDetailsClient from "./GigDetailsClient";
import { API_URL } from "@/config/api";

async function getGigDetails(id: string) {
  try {
    const res = await fetch(`${API_URL}/freelancer/client/gigs/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching gig details on server:", err);
    return null;
  }
}

async function getSimilarGigs(id: string) {
  try {
    const res = await fetch(`${API_URL}/freelancer/client/gigs/${id}/similar`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching similar gigs on server:", err);
    return [];
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
  params: Promise<{ id: string }> | { id: string } | any;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const [gig, siteSettings] = await Promise.all([
    getGigDetails(id),
    getSiteSettings(),
  ]);

  const siteName = siteSettings?.site_name || "LancerFlow";
  const siteBaseUrl = "https://freelancer.sangvish.com";

  if (!gig) {
    return {
      title: `Service Gig | ${siteName}`,
      description: `View service gig details on ${siteName}.`,
    };
  }

  // Check manual SEO values
  let manualSeoTitle = "";
  let manualSeoDesc = "";
  let manualSeoImg = "";

  if (gig.seo) {
    try {
      const parsedSeo = typeof gig.seo === 'string' ? JSON.parse(gig.seo) : gig.seo;
      manualSeoTitle = parsedSeo.meta_title || parsedSeo.title || "";
      manualSeoDesc = parsedSeo.meta_description || parsedSeo.description || "";
      manualSeoImg = parsedSeo.image || parsedSeo.og_image || "";
    } catch (e) {
      console.error("Error parsing gig SEO:", e);
    }
  }

  // 1. Title Fallback: SEO Title -> Gig Title
  const seoTitle = manualSeoTitle || gig.title || "Service Gig";

  // 2. Description Fallback: SEO Desc -> Clean Gig Description
  const rawGigDesc = gig.description ? gig.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : "";
  const seoDesc = manualSeoDesc || (rawGigDesc.length > 160 ? rawGigDesc.substring(0, 157) + "..." : rawGigDesc);

  // 3. Image Fallback: SEO Image -> Gig First Image -> Default Image
  let gigFirstImg = "";
  if (gig.images) {
    try {
      const parsedImgs = typeof gig.images === 'string' ? JSON.parse(gig.images) : gig.images;
      if (Array.isArray(parsedImgs) && parsedImgs.length > 0) {
        gigFirstImg = parsedImgs[0];
      }
    } catch (e) {}
  }
  const seoImg = manualSeoImg || gigFirstImg || "";

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
      url: `${siteBaseUrl}/gigs/${gig.gig_id}`,
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
  params: Promise<{ id: string }> | { id: string } | any;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const [gig, similarGigs] = await Promise.all([
    getGigDetails(id),
    getSimilarGigs(id),
  ]);

  if (!gig) {
    return <GigDetailsClient initialGig={null} initialSimilarGigs={[]} />;
  }

  // Build JSON-LD Product schema
  let imagesList: string[] = [];
  if (gig.images) {
    try {
      const parsedImgs = typeof gig.images === 'string' ? JSON.parse(gig.images) : gig.images;
      if (Array.isArray(parsedImgs)) {
        imagesList = parsedImgs.map((img: string) => img.startsWith("http") ? img : `https://freelancer.sangvish.com${img.startsWith("/") ? img : `/${img}`}`);
      }
    } catch {}
  }
  if (imagesList.length === 0) {
    imagesList = ["https://freelancer.sangvish.com/tablet-work.png"];
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": gig.title,
    "image": imagesList,
    "description": gig.description ? gig.description.replace(/<[^>]*>/g, '').trim() : "",
    "offers": {
      "@type": "Offer",
      "url": `https://freelancer.sangvish.com/gigs/${gig.gig_id}`,
      "priceCurrency": gig.currency_code || "USD",
      "price": gig.price ? parseFloat(gig.price) : 0,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Person",
        "name": gig.freelancer_name || "Freelancer Seller",
      }
    },
    ...(gig.reviews_count && parseInt(gig.reviews_count) > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": parseFloat(gig.reviews_avg_rating).toFixed(1),
        "reviewCount": parseInt(gig.reviews_count)
      }
    } : {})
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GigDetailsClient initialGig={gig} initialSimilarGigs={similarGigs} />
    </>
  );
}
