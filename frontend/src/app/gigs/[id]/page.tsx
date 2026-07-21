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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string } | any;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const gig = await getGigDetails(id);

  const siteName = "Buy2Lancer";
  const siteBaseUrl = "https://freelancer.sangvish.com";

  if (!gig) {
    return {
      title: `Service Gig | ${siteName}`,
      description: `View service gig details on ${siteName}.`,
    };
  }

  let seoTitle = gig.title;
  let seoDesc = gig.description ? gig.description.replace(/<[^>]*>/g, '').substring(0, 150) + "..." : "";
  let seoImg = "";

  if (gig.images) {
    try {
      const parsedImgs = typeof gig.images === 'string' ? JSON.parse(gig.images) : gig.images;
      if (Array.isArray(parsedImgs) && parsedImgs.length > 0) {
        seoImg = parsedImgs[0];
      }
    } catch (e) {
      console.error("Error parsing images for SEO:", e);
    }
  }

  if (gig.seo) {
    try {
      const parsedSeo = typeof gig.seo === 'string' ? JSON.parse(gig.seo) : gig.seo;
      if (parsedSeo.title) seoTitle = parsedSeo.title;
      if (parsedSeo.description) seoDesc = parsedSeo.description;
      if (parsedSeo.image) seoImg = parsedSeo.image;
    } catch (e) {
      console.error("Error parsing gig SEO:", e);
    }
  }

  const formatImageUrl = (url: string) => {
    if (!url) return `${siteBaseUrl}/tablet-work.png`;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${siteBaseUrl}${cleanPath}`;
  };

  const finalImg = formatImageUrl(seoImg);

  return {
    title: seoTitle,
    description: seoDesc,
    openGraph: {
      type: "website",
      title: seoTitle,
      description: seoDesc,
      images: [{ url: finalImg }],
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
