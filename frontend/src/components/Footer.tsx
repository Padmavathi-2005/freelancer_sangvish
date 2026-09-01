"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL, API_BASE_URL } from "@/config/api";

const resolveLogoUrl = (url: string) => {
  if (!url) return "";
  let cleanUrl = url;
  const publicIdx = cleanUrl.indexOf("/public/");
  if (publicIdx !== -1) {
    cleanUrl = cleanUrl.substring(publicIdx);
  }
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }
  const baseBackendUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackendUrl}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
};

interface FooterProps {
  transparent?: boolean;
}

export default function Footer({ transparent = false }: FooterProps) {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [siteLogo, setSiteLogo] = useState<string>("/logo.png");
  const [siteLogoDark, setSiteLogoDark] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("Buy2Lancer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const cachedLogo = localStorage.getItem("cached_site_logo");
      const cachedLogoDark = localStorage.getItem("cached_site_logo_dark");
      const cachedName = localStorage.getItem("cached_site_name");
      if (cachedLogo) setSiteLogo(cachedLogo);
      if (cachedLogoDark) setSiteLogoDark(cachedLogoDark);
      if (cachedName) setSiteName(cachedName);
    }
    const fetchSettings = async () => {
      try {
        const apiUrl = API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/settings`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach((setting: any) => {
              let val = setting.setting_value;
              if (typeof val === "string") {
                try {
                  const trimmed = val.trim();
                  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                    val = JSON.parse(val);
                  }
                } catch (e) {}
              }
              if (setting.setting_key === "site_settings") {
                if (val?.site_logo) setSiteLogo(val.site_logo);
                if (val?.site_logo_dark) setSiteLogoDark(val.site_logo_dark);
                if (val?.site_name) setSiteName(val.site_name);
              } else if (setting.setting_key === "site_logo" && val) {
                setSiteLogo(val);
              } else if (setting.setting_key === "site_name" && val) {
                setSiteName(val);
              }
            });
          }
        }
      } catch {
        // Fallback silently if settings endpoint is temporarily unreachable
      }
    };
    fetchSettings();
  }, []);

  const footerLinks = {
    company: {
      title: t("footer_company", "Company"),
      links: [
        { label: t("footer_about", "About Us"), href: "/about-us" },
        { label: t("footer_careers", "Careers"), href: "/careers" },
        { label: t("footer_contact", "Contact"), href: "/contact" },
        { label: t("footer_faq", "FAQ"), href: "/faq" },
        { label: t("footer_terms", "Terms & Conditions"), href: "/terms-conditions" },
      ],
    },
    connect: {
      title: t("footer_connect", "Connect"),
      links: [
        { label: t("footer_newsletter", "Newsletter"), href: "/newsletter" },
        { label: t("instagram", "Instagram"), href: "/download" },
        { label: t("linkedin", "LinkedIn"), href: "/download" },
      ],
    },
    mobileApp: {
      title: t("footer_mobile_app", "Mobile App"),
      links: [
        { label: t("app_store", "App Store"), href: "/download" },
        { label: t("google_play", "Google Play"), href: "/download" },
      ],
    },
  };

  return (
    <footer className={`w-full pt-12 pb-10 px-4 sm:px-6 lg:px-8 relative z-10 select-none overflow-hidden ${
      transparent
        ? "border-t border-slate-800/80 bg-slate-950 text-white"
        : "bg-slate-900 dark:bg-zinc-950 border-t border-slate-800 text-white"
    }`}>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Main Grid structure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pt-4">
          
          {/* Logo & Brand Copy Column */}
          <div className="md:col-span-5 flex flex-col gap-4 text-left rtl:text-right items-start rtl:items-end">
            <a href="/" className="inline-flex items-center gap-2 select-none w-fit">
              <img
                src={resolveLogoUrl(siteLogoDark || siteLogo || "/logo.png")}
                alt={siteName || "Buy2Lancer"}
                className="h-9 w-auto max-w-[200px] object-contain shrink-0"
              />
            </a>
            
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-sm font-sans">
              {t("footer_brand_desc", "Precision in Professionalism. Join a curated marketplace where verified talent builds modern client solutions.")}
            </p>
            
            <p className="text-[11px] text-slate-400 font-extrabold tracking-wider uppercase mt-2">
              {t("footer_copyright", `© ${currentYear} Freelancer Marketplace. All rights reserved.`)}
            </p>
          </div>

          {/* Directory Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10">
            {Object.entries(footerLinks).map(([key, group]) => (
              <div key={key} className="flex flex-col text-left rtl:text-right items-start rtl:items-end">
                <h3 className="font-black text-white text-xs sm:text-sm tracking-widest uppercase mb-5 font-display select-none">
                  {group.title}
                </h3>
                <ul className="flex flex-col gap-3 text-xs sm:text-sm text-slate-300 font-semibold font-sans items-start rtl:items-end">
                  {group.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        className="hover:text-[#10b981] transition-all duration-150 block w-fit"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
