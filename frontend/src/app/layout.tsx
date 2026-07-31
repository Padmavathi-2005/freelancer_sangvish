import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import ReferralTracker from "@/components/ReferralTracker";
import ScrollToTop from "@/components/ScrollToTop";
import AIChatbot from "@/components/AIChatbot";
import MaintenanceGuard from "@/components/MaintenanceGuard";
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

async function getBrandThemeSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`, { cache: "no-store" });
    if (!res.ok) return { primaryColor: "#0f766e", secondaryColor: "#06b6d4" };
    const data: any[] = await res.json();
    
    const extractHex = (key: string, fallback: string) => {
      const found = data.find((s) => s.setting_key === key);
      if (!found) return fallback;
      let val = found.setting_value;
      if (typeof val === "string") {
        try {
          const trimmed = val.trim();
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            val = JSON.parse(val);
          }
        } catch {}
      }
      const raw = typeof val === "string" ? val : (val?.color || val?.primary_color || val?.secondary_color);
      if (!raw) return fallback;
      const str = String(raw).trim();
      if (str.startsWith("#")) return str;
      if (/^[0-9A-Fa-f]{3,8}$/.test(str)) return "#" + str;
      return str;
    };

    return {
      primaryColor: extractHex("primary_color", "#0f766e"),
      secondaryColor: extractHex("secondary_color", "#06b6d4"),
    };
  } catch {
    return { primaryColor: "#0f766e", secondaryColor: "#06b6d4" };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { primaryColor, secondaryColor } = await getBrandThemeSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pColor = localStorage.getItem("primaryColor") || "${primaryColor}";
                  var sColor = localStorage.getItem("secondaryColor") || "${secondaryColor}";
                  var tMode = localStorage.getItem("siteTheme");
                  var root = document.documentElement;

                  if (tMode === 'dark') {
                    root.classList.add('dark');
                  } else if (tMode === 'light') {
                    root.classList.remove('dark');
                  }

                  if (pColor) {
                    root.style.setProperty('--color-primary', pColor, 'important');
                    root.style.setProperty('--color-primary-hover', pColor + 'cc', 'important');
                    root.style.setProperty('--color-primary-light', pColor + '1a', 'important');
                    root.style.setProperty('--color-primary-dark', pColor, 'important');
                    root.style.setProperty('--color-secondary', sColor, 'important');
                    root.style.setProperty('--color-secondary-hover', sColor + 'cc', 'important');
                    root.style.setProperty('--color-secondary-light', sColor + '1a', 'important');

                    var scales = ['teal', 'emerald', 'green'];
                    for (var i = 0; i < scales.length; i++) {
                      var prefix = scales[i];
                      root.style.setProperty('--color-' + prefix + '-50', pColor + '0a', 'important');
                      root.style.setProperty('--color-' + prefix + '-100', pColor + '1a', 'important');
                      root.style.setProperty('--color-' + prefix + '-150', pColor + '26', 'important');
                      root.style.setProperty('--color-' + prefix + '-200', pColor + '33', 'important');
                      root.style.setProperty('--color-' + prefix + '-250', pColor + '40', 'important');
                      root.style.setProperty('--color-' + prefix + '-300', pColor + '4d', 'important');
                      root.style.setProperty('--color-' + prefix + '-400', pColor + '66', 'important');
                      root.style.setProperty('--color-' + prefix + '-500', pColor, 'important');
                      root.style.setProperty('--color-' + prefix + '-600', pColor + 'd9', 'important');
                      root.style.setProperty('--color-' + prefix + '-700', pColor, 'important');
                      root.style.setProperty('--color-' + prefix + '-750', pColor + 'e6', 'important');
                      root.style.setProperty('--color-' + prefix + '-800', pColor + 'f2', 'important');
                      root.style.setProperty('--color-' + prefix + '-900', pColor, 'important');
                      root.style.setProperty('--color-' + prefix + '-950', pColor, 'important');
                    }
                    root.style.setProperty('--color-cyan-500', sColor, 'important');
                    root.style.setProperty('--color-cyan-700', sColor, 'important');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-primary: ${primaryColor} !important;
                --color-primary-hover: ${primaryColor}cc !important;
                --color-primary-light: ${primaryColor}1a !important;
                --color-primary-dark: ${primaryColor} !important;
                --color-secondary: ${secondaryColor} !important;
                --color-secondary-hover: ${secondaryColor}cc !important;
                --color-secondary-light: ${secondaryColor}1a !important;
                --color-teal-50: ${primaryColor}0a !important;
                --color-teal-100: ${primaryColor}1a !important;
                --color-teal-200: ${primaryColor}33 !important;
                --color-teal-500: ${primaryColor} !important;
                --color-teal-600: ${primaryColor}d9 !important;
                --color-teal-700: ${primaryColor} !important;
                --color-teal-750: ${primaryColor}e6 !important;
                --color-teal-800: ${primaryColor}f2 !important;
                --color-emerald-500: ${primaryColor} !important;
                --color-emerald-600: ${primaryColor} !important;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Suspense fallback={null}>
          <ReferralTracker />
          <ScrollToTop />
        </Suspense>
        <LanguageProvider>
          <AuthModalProvider>
            <MaintenanceGuard>
              {children}
              <AIChatbot />
            </MaintenanceGuard>
          </AuthModalProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
