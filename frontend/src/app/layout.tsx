import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import ReferralTracker from "@/components/ReferralTracker";
import AIChatbot from "@/components/AIChatbot";
import { API_URL, API_BASE_URL } from "@/config/api";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


async function getSiteSettings() {
  console.log("getSiteSettings: starting fetch...");
  try {
    console.log("getSiteSettings: fetching from", `${API_URL}/settings`);
    let res = await fetch(`${API_URL}/settings`, {
      cache: "no-store",
    });
    
    if (!res.ok) {
      console.log("getSiteSettings: fetch failed, status =", res.status);
      return null;
    }
    const data: any[] = await res.json();
    console.log("getSiteSettings: fetch successful, finding site_settings key...");
    const raw = data.find((s) => s.setting_key === "site_settings")?.setting_value;
    if (!raw) {
      console.log("getSiteSettings: site_settings key not found in response");
      return null;
    }
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    console.log("getSiteSettings: parsed settings successfully:", parsed?.site_name);
    return parsed;
  } catch (err: any) {
    console.error("getSiteSettings: fetch error:", err.message || err);
    return null;
  }
}

// Helper to format metadata URLs (resolving localhost vs production domains)
const formatMetadataUrl = (url: any) => {
  if (typeof url !== "string" || !url) return null;
  // If URL is relative
  if (url.startsWith("/")) {
    return `${API_BASE_URL}${url}`;
  }
  // If URL has local API host but we are on production
  if (url.includes("localhost:5000")) {
    return url.replace("http://localhost:5000", API_BASE_URL);
  }
  return url;
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();

  const siteName    = site?.site_name        || "LancerFlow";
  const description = site?.site_description || "Connect with top freelancers and clients on LancerFlow — the all-in-one freelance marketplace.";
  const ogImage     = formatMetadataUrl(site?.site_og_image) || null;
  const favicon     = formatMetadataUrl(site?.site_favicon)  || null;
  const keywords    = site?.site_keywords    || "freelance, marketplace, hire freelancers, remote work, gigs";

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords,
    openGraph: {
      type: "website",
      title: siteName,
      description,
      siteName,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(favicon
      ? {
          icons: {
            icon: favicon,
            shortcut: favicon,
            apple: favicon,
          },
        }
      : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <LanguageProvider>
          <AuthModalProvider>
            {children}
            <AIChatbot />
          </AuthModalProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
