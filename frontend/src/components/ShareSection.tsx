"use client";
import React, { useState, useEffect, useMemo } from "react";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";

interface ShareSectionProps {
  title?: string;
  type: "gig" | "project" | "freelancer";
  itemTitle: string;
  itemDescription?: string;
  itemImage?: string;
  priceOrBudget?: string;
  customUrl?: string;
  referralCode?: string;
  isAffiliate?: boolean;
  onToast?: (type: "success" | "error", message: string) => void;
  className?: string;
  hideHeader?: boolean;
}

export default function ShareSection({
  title,
  type,
  itemTitle,
  itemDescription = "",
  itemImage = "",
  priceOrBudget,
  customUrl,
  referralCode,
  isAffiliate = false,
  onToast,
  className = "",
  hideHeader = false,
}: ShareSectionProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mountedUrl, setMountedUrl] = useState(customUrl || "");
  const [siteName, setSiteName] = useState("LancerFlow");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMountedUrl(customUrl || window.location.href);
    }
  }, [customUrl]);

  // Dynamically load real site name from Admin Site Settings API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const settingsData: any[] = await res.json();
          const raw = settingsData.find((s) => s.setting_key === "site_settings")?.setting_value;
          if (raw) {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (parsed?.site_name) {
              setSiteName(parsed.site_name);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load site settings for share section", e);
      }
    };
    fetchSettings();
  }, []);

  // Helper to safely obtain full target share URL at click time
  const getTargetShareUrl = () => {
    const base = customUrl || mountedUrl;
    if (!base) return "";

    if (isAffiliate && referralCode) {
      return base.includes("?") ? `${base}&ref=${referralCode}` : `${base}?ref=${referralCode}`;
    }
    return base;
  };

  // Replace localhost for public social sharers if needed
  const getPublicShareUrl = () => {
    let url = getTargetShareUrl();
    if (!url) return "https://freelancer.sangvish.com";
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      return url.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "https://freelancer.sangvish.com");
    }
    return url;
  };

  const cleanDescription = (itemDescription || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const shortDesc = cleanDescription.length > 160 ? cleanDescription.substring(0, 157) + "..." : cleanDescription;

  // Header Title
  const sectionTitle = title || (
    type === "gig" 
      ? t("share_this_service", "Share this Service")
      : type === "project" 
      ? t("share_this_project", "Share this Project")
      : t("share_this_profile", "Share Profile")
  );

  // Construct clean, natural sentence templates for all platforms
  const { emailSubject, shareBodyText, linkedinUrl, whatsappUrl, twitterUrl, facebookUrl, gmailUrl } = useMemo(() => {
    const targetUrl = getTargetShareUrl();
    const publicUrl = getPublicShareUrl();

    let subject = "";
    let body = "";
    let fullMsg = "";
    let waMsg = "";
    let tweetMsg = "";

    if (type === "gig") {
      subject = `Check out this service on ${siteName}: ${itemTitle}`;
      
      body = `Check out this service on ${siteName}:\n\n` +
        `${itemTitle}\n` +
        `${shortDesc ? `\n${shortDesc}\n` : ""}` +
        `\n${targetUrl}`;

      fullMsg = `Check out this service on ${siteName}: ${itemTitle}\n` +
        `${shortDesc ? `\n${shortDesc}\n` : ""}` +
        `\n${targetUrl}`;

      waMsg = `Check out this service on *${siteName}*:\n\n` +
        `*${itemTitle}*\n` +
        `${shortDesc ? `\n${shortDesc}\n` : ""}` +
        `\n${targetUrl}`;

      tweetMsg = `Check out this service on ${siteName}: ${itemTitle}`;
    } else if (type === "project") {
      subject = `Check out this project on ${siteName}: ${itemTitle}`;
      
      body = `Check out this project on ${siteName}:\n\n` +
        `${itemTitle}\n` +
        `${shortDesc ? `\n${shortDesc}\n` : ""}` +
        `\n${targetUrl}`;

      fullMsg = `Check out this project on ${siteName}: ${itemTitle}\n` +
        `${shortDesc ? `\n${shortDesc}\n` : ""}` +
        `\n${targetUrl}`;

      waMsg = `Check out this project on *${siteName}*:\n\n` +
        `*${itemTitle}*\n` +
        `${shortDesc ? `\n${shortDesc}\n` : ""}` +
        `\n${targetUrl}`;

      tweetMsg = `Check out this project on ${siteName}: ${itemTitle}`;
    } else {
      subject = `Check out this freelancer profile on ${siteName}: ${itemTitle}`;
      
      body = `Check out ${itemTitle}'s profile on ${siteName}:\n\n` +
        `${shortDesc ? `${shortDesc}\n\n` : ""}` +
        `${targetUrl}`;

      fullMsg = `Check out ${itemTitle}'s profile on ${siteName}:\n` +
        `${shortDesc ? `\n${shortDesc}\n` : ""}` +
        `\n${targetUrl}`;

      waMsg = `Check out *${itemTitle}*'s profile on *${siteName}*:\n\n` +
        `${shortDesc ? `${shortDesc}\n\n` : ""}` +
        `${targetUrl}`;

      tweetMsg = `Check out ${itemTitle}'s profile on ${siteName}!`;
    }

    const liUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(fullMsg)}`;
    const wUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}&url=${encodeURIComponent(targetUrl)}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
    const gmUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return {
      emailSubject: subject,
      shareBodyText: body,
      linkedinUrl: liUrl,
      whatsappUrl: wUrl,
      twitterUrl: twUrl,
      facebookUrl: fbUrl,
      gmailUrl: gmUrl,
    };
  }, [type, itemTitle, shortDesc, priceOrBudget, siteName, customUrl, mountedUrl, isAffiliate, referralCode]);

  // Handlers for click events
  const handleEmailShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(shareBodyText)}`;
    if (typeof window !== "undefined") {
      window.open(gmailUrl, "_blank");
      try {
        window.location.href = mailtoUrl;
      } catch (err) {}
    }
    if (onToast) {
      onToast("success", "Opened Gmail composer in new tab!");
    }
  };

  const handleFacebookShare = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(facebookUrl, "_blank", "width=650,height=650,scrollbars=yes");
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(whatsappUrl, "_blank");
  };

  const handleLinkedInShare = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(linkedinUrl, "_blank", "width=650,height=750,scrollbars=yes");
  };

  const handleTwitterShare = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(twitterUrl, "_blank", "width=650,height=650,scrollbars=yes");
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || copied) return;
    const shareUrl = getTargetShareUrl();
    if (typeof window !== "undefined" && shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }, 700);
    }
  };

  return (
    <div className={hideHeader ? className : `bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col gap-3 text-left ${className}`}>
      {!hideHeader && (
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2.5 flex items-center gap-2 select-none">
          <i className="fa-solid fa-share-nodes text-teal-700"></i>
          <span>{sectionTitle}</span>
        </h3>
      )}

      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        {/* Email */}
        <a
          href={gmailUrl}
          onClick={handleEmailShare}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-600 active:bg-indigo-700 text-indigo-600 hover:text-white active:text-white flex items-center justify-center transition-all duration-300 border border-indigo-100/70 hover:border-indigo-600 active:border-indigo-700 shadow-sm hover:shadow-indigo-100 hover:-translate-y-0.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Share via Email (Gmail / Mail App)"
        >
          <i className="fa-solid fa-envelope text-sm text-indigo-600 group-hover:text-white group-active:text-white transition-colors"></i>
        </a>

        {/* Facebook */}
        <a
          href={facebookUrl}
          onClick={handleFacebookShare}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2] active:bg-[#1877F2]/90 text-[#1877F2] hover:text-white active:text-white flex items-center justify-center transition-all duration-300 border border-[#1877F2]/20 hover:border-[#1877F2] active:border-[#1877F2] shadow-sm hover:shadow-blue-50 hover:-translate-y-0.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Share on Facebook"
        >
          <i className="fa-brands fa-facebook-f text-sm text-[#1877F2] group-hover:text-white group-active:text-white transition-colors"></i>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          onClick={handleWhatsAppShare}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-500 active:bg-emerald-600 text-emerald-600 hover:text-white active:text-white flex items-center justify-center transition-all duration-300 border border-emerald-100/70 hover:border-emerald-500 active:border-emerald-600 shadow-sm hover:shadow-emerald-100 hover:-translate-y-0.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title="Share on WhatsApp"
        >
          <i className="fa-brands fa-whatsapp text-sm text-emerald-600 group-hover:text-white group-active:text-white transition-colors"></i>
        </a>

        {/* LinkedIn */}
        <a
          href={linkedinUrl}
          onClick={handleLinkedInShare}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl bg-[#0077b5]/10 hover:bg-[#0077b5] active:bg-[#0077b5]/90 text-[#0077b5] hover:text-white active:text-white flex items-center justify-center transition-all duration-300 border border-[#0077b5]/20 hover:border-[#0077b5] active:border-[#0077b5] shadow-sm hover:shadow-blue-50 hover:-translate-y-0.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
          title="Share on LinkedIn"
        >
          <i className="fa-brands fa-linkedin-in text-sm text-[#0077b5] group-hover:text-white group-active:text-white transition-colors"></i>
        </a>

        {/* Twitter / X */}
        <a
          href={twitterUrl}
          onClick={handleTwitterShare}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-xl bg-slate-900/10 hover:bg-slate-900 active:bg-black text-slate-900 hover:text-white active:text-white flex items-center justify-center transition-all duration-300 border border-slate-900/20 hover:border-slate-900 active:border-black shadow-sm hover:shadow-slate-100 hover:-translate-y-0.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900"
          title="Share on X"
        >
          <svg className="w-3.5 h-3.5 fill-slate-900 group-hover:fill-white group-active:fill-white transition-colors shrink-0" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopy}
          disabled={loading || copied}
          className="w-9 h-9 rounded-xl bg-teal-50 hover:bg-teal-700 active:bg-teal-800 text-teal-700 hover:text-white active:text-white flex items-center justify-center transition-all duration-300 border border-teal-100 hover:border-teal-700 active:border-teal-800 shadow-sm hover:shadow-teal-100 hover:-translate-y-0.5 cursor-pointer group disabled:opacity-85 focus:outline-none focus:ring-2 focus:ring-teal-500"
          title="Copy Link"
        >
          <i className={`fa-solid ${
            loading 
              ? 'fa-spinner fa-spin' 
              : copied 
                ? 'fa-circle-check text-emerald-500 group-hover:text-white group-active:text-white' 
                : 'fa-copy text-teal-700 group-hover:text-white group-active:text-white'
          } text-sm transition-colors`}></i>
        </button>
      </div>
    </div>
  );
}
