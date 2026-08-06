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

  // Check manual SEO fields
  let manualSeoTitle = "";
  let manualSeoDesc = "";
  let manualSeoImg = "";

  if (profile?.seo) {
    try {
      const parsedSeo = typeof profile.seo === "string" ? JSON.parse(profile.seo) : profile.seo;
      manualSeoTitle = parsedSeo?.meta_title || parsedSeo?.title || "";
      manualSeoDesc = parsedSeo?.meta_description || parsedSeo?.description || "";
      manualSeoImg = parsedSeo?.image || parsedSeo?.og_image || "";
    } catch (e) {
      console.error("Failed to parse profile SEO details", e);
    }
  }

  // 1. Title Fallback: SEO Title -> Freelancer Name & Professional Title
  const freelancerName = user?.name || user?.display_name || "Freelancer";
  const professionalTitle = profile?.professional_title || "Freelancer Specialist";
  const defaultTitle = `${freelancerName} - ${professionalTitle} | ${siteName}`;
  const finalTitle = manualSeoTitle ? `${manualSeoTitle} | ${siteName}` : defaultTitle;

  // 2. Description Fallback: SEO Desc -> Clean Profile Bio
  const bio = profile?.bio || `Check out ${freelancerName}'s profile on ${siteName}.`;
  const cleanBio = bio.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const finalDesc = manualSeoDesc || (cleanBio.length > 160 ? `${cleanBio.substring(0, 157)}...` : cleanBio);

  // 3. Image Fallback: SEO Image -> User Profile Image -> Default Image
  const profileImage = user?.profile_image || null;
  const rawImage = manualSeoImg || profileImage;
  const finalImage = rawImage ? formatImageUrl(rawImage, siteBaseUrl) : defaultOgImage;

  return {
    metadataBase: new URL(siteBaseUrl),
    title: finalTitle,
    description: finalDesc,
    openGraph: {
      type: "profile",
      url: `${siteBaseUrl}/freelancer/${user?.slug || id}`,
      title: finalTitle,
      description: finalDesc,
      siteName: siteName,
      username: user?.slug || user?.name || id,
      ...(finalImage ? { images: [{ url: finalImage, width: 1200, height: 630, alt: finalTitle }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDesc,
      ...(finalImage ? { images: [finalImage] } : {}),
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
  const profileData = await getProfileData(id);

  if (!profileData) {
    return <FreelancerProfileClient />;
  }

  const user = profileData.user;
  const profile = profileData.profile;

  const freelancerName = user?.name || user?.display_name || "Freelancer";
  const professionalTitle = profile?.professional_title || "Freelancer Specialist";
  const bio = profile?.bio || "";
  
  const siteBaseUrl = "https://freelancer.sangvish.com";
  const profileImage = user?.profile_image 
    ? (user.profile_image.startsWith("http") ? user.profile_image : `${siteBaseUrl}${user.profile_image.startsWith("/") ? user.profile_image : `/${user.profile_image}`}`)
    : `${siteBaseUrl}/default-avatar.png`;

  let skillsList: string[] = [];
  if (profileData.skills && Array.isArray(profileData.skills)) {
    skillsList = profileData.skills.map((s: any) => s.skill_name || s);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": freelancerName,
    "image": profileImage,
    "jobTitle": professionalTitle,
    "description": bio,
    "knowsAbout": skillsList,
    "mainEntityOfPage": `${siteBaseUrl}/freelancer/${user?.slug || id}`
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FreelancerProfileClient />
    </>
  );
}
