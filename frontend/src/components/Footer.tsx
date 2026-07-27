"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL, API_BASE_URL } from "@/config/api";

const resolveLogoUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface FooterProps {
  transparent?: boolean;
}

export default function Footer({ transparent = false }: FooterProps) {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [siteLogo, setSiteLogo] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
                  const parsed = JSON.parse(val);
                  if (typeof parsed === "string") val = parsed;
                } catch (e) {}
              }
              if (setting.setting_key === "site_logo" && val) setSiteLogo(val);
              if (setting.setting_key === "site_name" && val) setSiteName(val);
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
        { label: "Instagram", href: "/download" },
        { label: "LinkedIn", href: "/download" },
      ],
    },
    mobileApp: {
      title: t("footer_mobile_app", "Mobile App"),
      links: [
        { label: "App Store", href: "/download" },
        { label: "Google Play", href: "/download" },
      ],
    },
  };

  return (
    <footer className={`w-full pt-12 pb-10 px-4 sm:px-6 lg:px-8 relative z-10 select-none overflow-hidden ${
      transparent
        ? "border-t border-slate-200/70"
        : "bg-slate-100 border-t border-slate-200"
    }`}>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Main Grid structure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pt-4">
          
          {/* Logo & Brand Copy Column */}
          <div className="md:col-span-5 flex flex-col gap-4 text-left">
            <a href="/" className="inline-flex items-center gap-2 select-none w-fit">
              {mounted && siteLogo ? (
                <img
                  src={resolveLogoUrl(siteLogo)}
                  alt={siteName || "Freelancer"}
                  className="h-9 w-auto max-w-[200px] object-contain shrink-0"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-750 font-extrabold shadow-sm shrink-0">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="font-extrabold text-2xl text-slate-900 tracking-tight font-display flex items-baseline gap-0.5 select-none">
                    <span>{siteName || "Freelancer"}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mb-0.5" />
                  </span>
                </div>
              )}
            </a>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-sm font-sans">
              {t("footer_brand_desc", "Precision in Professionalism. Join a curated marketplace where verified talent builds modern client solutions.")}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-2">
              {t("footer_copyright", `© ${currentYear} Freelancer Marketplace. All rights reserved.`)}
            </p>
          </div>

          {/* Directory Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10">
            {Object.entries(footerLinks).map(([key, group]) => (
              <div key={key} className="flex flex-col text-left">
                <h3 className="font-black text-slate-800 text-xs sm:text-sm tracking-widest uppercase mb-5 font-display select-none">
                  {group.title}
                </h3>
                <ul className="flex flex-col gap-3 text-xs sm:text-sm text-slate-500 font-medium font-sans">
                  {group.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        className="hover:text-teal-700 hover:translate-x-0.5 transition-all duration-150 block w-fit"
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

