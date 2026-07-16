import type { Metadata } from "next";
import ClientProfileClient from "./ClientProfileClient";
import { API_URL } from "@/config/api";


async function getClientProfileData(id: string) {
  try {
    const res = await fetch(`${API_URL}/freelancer/client-profile/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Error fetching client profile on server:", err);
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
    getClientProfileData(id),
    getSiteSettings(),
  ]);

  const siteName = siteSettings?.site_name || "LancerFlow";
  const siteBaseUrl = "https://freelancer.sangvish.com";
  const defaultOgImage = siteSettings?.site_og_image
    ? formatImageUrl(siteSettings.site_og_image, siteBaseUrl)
    : null;

  if (!profileData) {
    return {
      title: `Client Profile | ${siteName}`,
      description: `View client company details and active projects on ${siteName}.`,
    };
  }

  const user = profileData.user;
  const profile = profileData.profile;

  const clientName = user?.name || user?.display_name || "Hiring Client";
  const companyName = profile?.company_name || "Independent Client Partner";
  const industry = profile?.industry || "Enterprise Partner";
  const description = profile?.company_description || `Check out ${clientName}'s profile on ${siteName}.`;

  const finalTitle = `${companyName} (${clientName}) | Client Profile | ${siteName}`;
  const finalDesc = description.length > 160 ? `${description.substring(0, 157)}...` : description;
  
  const profileImage = user?.profile_image || null;
  const finalImage = profileImage ? formatImageUrl(profileImage, siteBaseUrl) : defaultOgImage;

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
  return <ClientProfileClient />;
}
