import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthModalProvider } from "@/context/AuthModalContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const API_URL =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "https://freelancer.sangvish.com/api";

async function getSiteSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      next: { revalidate: 3600 }, // re-fetch at most once per hour
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

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();

  const siteName    = site?.site_name        || "LancerFlow";
  const description = site?.site_description || "Connect with top freelancers and clients on LancerFlow — the all-in-one freelance marketplace.";
  const ogImage     = site?.site_og_image    || null;
  const favicon     = site?.site_favicon     || null;
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
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <AuthModalProvider>
            {children}
          </AuthModalProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
