import type { Metadata } from "next";
import FreelancerProfileClient from "./FreelancerProfileClient";

import { API_URL } from "@/config/api";


async function getProfileData(id: string) {
  try {
    const res = await fetch(`${API_URL}/freelancer/profile/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching profile on server:", err);
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
  params: Promise<{ id: string }> | { id: string } | any;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const [profileData, siteSettings] = await Promise.all([
    getProfileData(id),
    getSiteSettings(),
  ]);

  const siteName = siteSettings?.site_name || "LancerFlow";
  const siteBaseUrl = "https://freelancer.sangvish.com";
  const defaultOgImage = siteSettings?.site_og_image
    ? formatImageUrl(siteSettings.site_og_image, siteBaseUrl)
    : null;

  if (!profileData) {
    return {
      title: `Freelancer Profile | ${siteName}`,
      description: `View professional freelancer profile details on ${siteName}.`,
    };
  }

  const user = profileData.user;
  const profile = profileData.profile;

  // 1. Check if the freelancer has manual SEO fields set in the database
  let seoTitle = "";
  let seoDesc = "";
  let seoImage = "";

  if (profile?.seo) {
    try {
      const parsedSeo = typeof profile.seo === "string" ? JSON.parse(profile.seo) : profile.seo;
      seoTitle = parsedSeo?.title || "";
      seoDesc = parsedSeo?.description || "";
      seoImage = parsedSeo?.og_image || parsedSeo?.image || "";
    } catch (e) {
      console.error("Failed to parse profile SEO details", e);
    }
  }

  // 2. Fallbacks if manual SEO fields are not set
  const freelancerName = user?.name || user?.display_name || "Freelancer";
  const professionalTitle = profile?.professional_title || "Freelancer Specialist";
  const bio = profile?.bio || `Check out ${freelancerName}'s profile on ${siteName}.`;

  const finalTitle = seoTitle || `${freelancerName} - ${professionalTitle} | ${siteName}`;
  const finalDesc = seoDesc || (bio.length > 160 ? `${bio.substring(0, 157)}...` : bio);
  
  // Format profile image or custom SEO image
  const profileImage = user?.profile_image || null;
  const rawImage = seoImage || profileImage;
  const finalImage = rawImage ? formatImageUrl(rawImage, siteBaseUrl) : defaultOgImage;

  return {
    title: finalTitle,
    description: finalDesc,
    openGraph: {
      type: "profile",
      title: finalTitle,
      description: finalDesc,
      username: user?.slug || user?.name || id,
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
  return <FreelancerProfileClient />;
}
