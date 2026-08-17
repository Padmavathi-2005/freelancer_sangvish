"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { FiGlobe, FiUploadCloud, FiExternalLink, FiPlus, FiTrash2 } from "react-icons/fi";
import { Home3HeroSlide, DEFAULT_HOME3_HERO_SLIDES } from "@/components/home/Home3Hero";

interface SiteSettingsTabProps {
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function SiteSettingsTab({
  handleSaveSetting
}: SiteSettingsTabProps) {

  // Site name/logo/favicon/OG details states
  const [siteName, setSiteName] = useState("Buy2Lancer");
  const [siteLogo, setSiteLogo] = useState("/public/logo.png");
  const [siteLogoDark, setSiteLogoDark] = useState("/public/logo.png");
  const [siteFavicon, setSiteFavicon] = useState("/public/favicon.ico");
  const [siteOgImage, setSiteOgImage] = useState("/public/og-image.png");
  const [siteChatbotAvatar, setSiteChatbotAvatar] = useState("/public/chatbot-avatar.png");
  const [siteDescription, setSiteDescription] = useState("LancerFlow Freelance Marketplace");
  const [siteKeywords, setSiteKeywords] = useState("freelance, marketplace, gig, order");
  const [siteShortName, setSiteShortName] = useState("Lancer");

  const [appStoreUrl, setAppStoreUrl] = useState("https://apps.apple.com");
  const [googlePlayUrl, setGooglePlayUrl] = useState("https://play.google.com");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com");
  const [defaultHomePage, setDefaultHomePage] = useState("home_1");

  // Home 3 Hero Carousel Slides state
  const [hero3Slides, setHero3Slides] = useState<Home3HeroSlide[]>(DEFAULT_HOME3_HERO_SLIDES);
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState<{ index: number; target: "image_1" | "image_2" } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [toastTitle, setToastTitle] = useState("Settings Saved");
  const [toastText, setToastText] = useState("Platform configuration updated successfully.");

  const [uploadingField, setUploadingField] = useState<"logo" | "logo_dark" | "favicon" | "og_image" | "chatbot_avatar" | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "logo_dark" | "favicon" | "og_image" | "chatbot_avatar") => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingField(target);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }
      
      const data = await res.json();
      if (target === "logo") setSiteLogo(data.url);
      else if (target === "logo_dark") setSiteLogoDark(data.url);
      else if (target === "favicon") setSiteFavicon(data.url);
      else if (target === "og_image") setSiteOgImage(data.url);
      else if (target === "chatbot_avatar") setSiteChatbotAvatar(data.url);
      
      triggerToast("Upload Success", `${target.replace("_", " ").toUpperCase()} uploaded successfully!`);
    } catch (err: any) {
      console.error(err);
      triggerToast("Upload Failed", err.message || `Could not upload image.`);
    } finally {
      setUploadingField(null);
    }
  };

  const triggerToast = (title: string, text: string) => {
    setToastTitle(title);
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Sync state if props change when fetched initially
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
            const data = await settingsRes.json();
            const rawSite = data.find((s: any) => s.setting_key === "site_settings")?.setting_value;

            const parseVal = (val: any) => {
              if (typeof val === "string") {
                try {
                  return JSON.parse(val);
                } catch (e) {
                  console.error("Failed to parse settings value:", e);
                }
              }
              return val || {};
            };

            const site = parseVal(rawSite);

            if (site.site_name) setSiteName(site.site_name);
            if (site.site_logo) setSiteLogo(site.site_logo);
            if (site.site_logo_dark) setSiteLogoDark(site.site_logo_dark);
            if (site.site_favicon) setSiteFavicon(site.site_favicon);
            if (site.site_og_image) setSiteOgImage(site.site_og_image);
            if (site.site_chatbot_avatar || site.chatbot_avatar) setSiteChatbotAvatar(site.site_chatbot_avatar || site.chatbot_avatar);
            if (site.site_description) setSiteDescription(site.site_description);
            if (site.site_keywords) setSiteKeywords(site.site_keywords);
            if (site.site_short_name) setSiteShortName(site.site_short_name);

            const rawAppStore = data.find((s: any) => s.setting_key === "app_store_url")?.setting_value;
            const rawGooglePlay = data.find((s: any) => s.setting_key === "google_play_url")?.setting_value;
            const rawInstagram = data.find((s: any) => s.setting_key === "instagram_url")?.setting_value;
            const rawLinkedin = data.find((s: any) => s.setting_key === "linkedin_url")?.setting_value;
            const rawDefaultHome = data.find((s: any) => s.setting_key === "default_home_page")?.setting_value;
            const rawHero3Slides = data.find((s: any) => s.setting_key === "home3_hero_slides")?.setting_value;

            if (rawAppStore) setAppStoreUrl(typeof rawAppStore === "string" ? rawAppStore.replace(/"/g, "").trim() : rawAppStore);
            if (rawGooglePlay) setGooglePlayUrl(typeof rawGooglePlay === "string" ? rawGooglePlay.replace(/"/g, "").trim() : rawGooglePlay);
            if (rawInstagram) setInstagramUrl(typeof rawInstagram === "string" ? rawInstagram.replace(/"/g, "").trim() : rawInstagram);
            if (rawLinkedin) setLinkedinUrl(typeof rawLinkedin === "string" ? rawLinkedin.replace(/"/g, "").trim() : rawLinkedin);
            if (rawDefaultHome) setDefaultHomePage(typeof rawDefaultHome === "string" ? rawDefaultHome.replace(/"/g, "").trim() : rawDefaultHome);
            if (rawHero3Slides) {
              try {
                let parsed = rawHero3Slides;
                if (typeof parsed === "string") parsed = JSON.parse(parsed);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setHero3Slides(parsed);
                }
              } catch (e) {
                console.error("Failed to parse hero 3 slides:", e);
              }
            }
          }
      } catch (e) {
        console.error("Failed to load settings options", e);
      }
    };
    loadOptions();
  }, []);

  // Slide helper functions
  const handleSlideChange = (index: number, field: keyof Home3HeroSlide, value: string) => {
    setHero3Slides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSlide = () => {
    setHero3Slides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now()}`,
        title: "New Freelance Banner Title",
        highlight_text: "Freelance Banner",
        subtitle: "Add your slide description text here.",
        primary_btn_text: "Try it Free",
        primary_btn_link: "/talent",
        secondary_btn_text: "Learn More",
        secondary_btn_link: "/gigs",
        image_1: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
        image_2: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80",
        image_1_bg: "#0d9488",
        image_2_bg: "#eab308"
      }
    ]);
  };

  const handleRemoveSlide = (index: number) => {
    if (hero3Slides.length <= 1) {
      alert("You must keep at least one hero slide.");
      return;
    }
    setHero3Slides((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, target: "image_1" | "image_2") => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingSlideIdx({ index, target });
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      handleSlideChange(index, target, data.url);
      triggerToast("Upload Success", `Slide image uploaded successfully!`);
    } catch (err: any) {
      console.error(err);
      triggerToast("Upload Failed", err.message || "Failed to upload image");
    } finally {
      setUploadingSlideIdx(null);
    }
  };

  // Bulk manual save action for Site Settings
  const handleBulkSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setShowToast(false);

    const cleanToRelative = (urlStr: string) => {
      if (!urlStr) return "";
      const idx = urlStr.indexOf("/public/");
      if (idx !== -1) {
        return urlStr.substring(idx);
      }
      return urlStr;
    };

    try {
      // Save settings to DB
      await handleSaveSetting("site_settings", { 
        site_name: siteName, 
        site_logo: cleanToRelative(siteLogo),
        site_logo_dark: cleanToRelative(siteLogoDark),
        site_favicon: cleanToRelative(siteFavicon),
        site_og_image: cleanToRelative(siteOgImage),
        site_chatbot_avatar: cleanToRelative(siteChatbotAvatar),
        site_description: siteDescription,
        site_keywords: siteKeywords,
        site_short_name: siteShortName
      }, "site_settings");

      if (typeof window !== "undefined") {
        localStorage.setItem("cached_site_chatbot_avatar", siteChatbotAvatar);
      }

      await handleSaveSetting("app_store_url", appStoreUrl, "site_settings");
      await handleSaveSetting("google_play_url", googlePlayUrl, "site_settings");
      await handleSaveSetting("instagram_url", instagramUrl, "site_settings");
      await handleSaveSetting("linkedin_url", linkedinUrl, "site_settings");
      await handleSaveSetting("default_home_page", defaultHomePage, "site_settings");
      await handleSaveSetting("home3_hero_slides", JSON.stringify(hero3Slides), "site_settings");

      triggerToast("Settings Saved", "Site identity and SEO settings saved successfully!");
      setSaveStatus({ type: "success", text: "✓ Site settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium placeholder-slate-400 shadow-sm cursor-pointer";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1";

  // Helper to format/preview image URLs
  const formatImgSrc = (url: string) => {
    if (!url) return "";
    let cleanUrl = url;
    
    // Clean absolute domains to relative path
    const publicIdx = cleanUrl.indexOf("/public/");
    if (publicIdx !== -1) {
      cleanUrl = cleanUrl.substring(publicIdx);
    }
    
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
      return cleanUrl;
    }
    
    const apiDomain = API_URL.replace("/api", "");
    return `${apiDomain}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-8 shadow-sm animate-fadeIn text-left">
      
      {/* HEADER SECTION with Save Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-805 flex items-center gap-2">
            <FiGlobe className="w-5 h-5 text-slate-500" />
            <span>Site Identity & SEO Settings</span>
          </h3>
          <p className="text-slate-505 text-xs mt-0.5 font-semibold">Configure site name, logo, default home page design, favicon, and social meta descriptions.</p>
        </div>
        <button
          onClick={handleBulkSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-6 py-3 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer border-none"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Save Success/Error Alert banner */}
      {saveStatus && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition animate-fadeIn ${
          saveStatus.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
            : "bg-rose-50 text-rose-700 border-rose-100"
        }`}>
          {saveStatus.text}
        </div>
      )}

      {/* HOME PAGE DESIGN VARIATIONS SECTION */}
      <div className="border-b border-slate-100 pb-8">
        <h4 className="text-sm font-extrabold text-slate-855 mb-1">Default Home Page Layout</h4>
        <p className="text-xs text-slate-505 mb-5 font-semibold">Select the active landing page layout presented to visitors on the website home route (/)</p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 flex flex-col gap-1">
            <label className={labelClass}>Active Default Layout</label>
            <select
              value={defaultHomePage}
              onChange={(e) => setDefaultHomePage(e.target.value)}
              className={inputClass}
            >
              <option value="home_1">Home 1 — Classic Marketplace (Services, Projects, Pricing & FAQ)</option>
              <option value="home_2">Home 2 — Modern Talent Portal (Vetted Freelancers & Top Services)</option>
              <option value="home_3">Home 3 — Enterprise Hub (Dual Search, Live Tenders & Escrow)</option>
            </select>
          </div>

          <div className="md:col-span-5 flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
            <a
              href="/home-1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 shadow-xs"
            >
              <span>Preview Home 1</span>
              <FiExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
            <a
              href="/home-2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-teal-50 hover:bg-teal-100 text-teal-800 transition border border-teal-200 shadow-xs"
            >
              <span>Preview Home 2</span>
              <FiExternalLink className="w-3.5 h-3.5 text-teal-600" />
            </a>
            <a
              href="/home-3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white transition border border-slate-800 shadow-xs"
            >
              <span>Preview Home 3</span>
              <FiExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>
      </div>

      {/* BRANDING ASSETS SECTION */}
      <div className="border-b border-slate-100 pb-8">
        <h4 className="text-sm font-extrabold text-slate-855 mb-1">Branding Assets</h4>
        <p className="text-xs text-slate-505 mb-6 font-semibold">Upload your light theme logo, dark theme logo, browser favicon, social thumbnail, and AI chatbot avatar image.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* SITE LOGO UPLOADER (LIGHT THEME) */}
          <div className="flex flex-col gap-3 bg-slate-50/30 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Site Logo (Light Theme)</span>
            
            <div className="relative group border border-dashed border-slate-250 hover:border-teal-600 rounded-xl h-36 flex flex-col items-center justify-center bg-white overflow-hidden transition-all duration-200 shadow-sm">
              {siteLogo ? (
                <div className="w-full h-full p-4 flex items-center justify-center relative">
                  <img 
                    src={formatImgSrc(siteLogo)} 
                    className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                    alt="Light Logo Preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/public/logo.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                    <span className="text-white text-[10px] font-black uppercase tracking-wider bg-teal-650 px-3.5 py-2 rounded-xl shadow-sm cursor-pointer hover:bg-teal-700">
                      {uploadingField === "logo" ? "Uploading..." : "Change Logo"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <FiUploadCloud className="w-8 h-8 text-slate-350" />
                  <span className="text-[10px] font-bold">Upload light logo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingField !== null}
                onChange={(e) => handleImageUpload(e, "logo")}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <input
              type="text"
              value={siteLogo}
              onChange={(e) => setSiteLogo(e.target.value)}
              placeholder="/public/logo.png"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-500 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          {/* SITE LOGO UPLOADER (DARK THEME) */}
          <div className="flex flex-col gap-3 bg-slate-900 border border-slate-800 p-5 rounded-xl text-white">
            <span style={{ color: "#f1f5f9" }} className="text-[10px] font-black uppercase tracking-wider !text-slate-100">Site Logo (Dark Theme)</span>
            
            <div className="relative group border border-dashed border-slate-700 hover:border-teal-500 rounded-xl h-36 flex flex-col items-center justify-center bg-slate-950 overflow-hidden transition-all duration-200 shadow-sm">
              {siteLogoDark ? (
                <div className="w-full h-full p-4 flex items-center justify-center relative">
                  <img 
                    src={formatImgSrc(siteLogoDark)} 
                    className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                    alt="Dark Logo Preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/public/logo.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                    <span className="text-white text-[10px] font-black uppercase tracking-wider bg-teal-650 px-3.5 py-2 rounded-xl shadow-sm cursor-pointer hover:bg-teal-700">
                      {uploadingField === "logo_dark" ? "Uploading..." : "Change Dark Logo"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <FiUploadCloud className="w-8 h-8 text-slate-400" />
                  <span style={{ color: "#cbd5e1" }} className="text-[10px] font-bold !text-slate-300">Upload dark logo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingField !== null}
                onChange={(e) => handleImageUpload(e, "logo_dark")}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <input
              type="text"
              value={siteLogoDark}
              onChange={(e) => setSiteLogoDark(e.target.value)}
              placeholder="/public/images/logo-dark.png"
              style={{ color: "#ffffff" }}
              className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono !text-white focus:outline-none focus:border-teal-400 transition"
            />
          </div>

          {/* SITE FAVICON UPLOADER */}
          <div className="flex flex-col gap-3 bg-slate-50/30 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Site Favicon</span>
            
            <div className="relative group border border-dashed border-slate-250 hover:border-teal-600 rounded-xl h-36 flex flex-col items-center justify-center bg-white overflow-hidden transition-all duration-200 shadow-sm">
              {siteFavicon ? (
                <div className="w-full h-full p-6 flex items-center justify-center relative">
                  <img 
                    src={formatImgSrc(siteFavicon)} 
                    className="h-10 w-10 object-contain transition group-hover:scale-105"
                    alt="Favicon Preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/public/favicon.ico";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                    <span className="text-white text-[10px] font-black uppercase tracking-wider bg-teal-650 px-3.5 py-2 rounded-xl shadow-sm cursor-pointer hover:bg-teal-700">
                      {uploadingField === "favicon" ? "Uploading..." : "Change Favicon"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <FiUploadCloud className="w-8 h-8 text-slate-350" />
                  <span className="text-[10px] font-bold">Upload site favicon</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingField !== null}
                onChange={(e) => handleImageUpload(e, "favicon")}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <input
              type="text"
              value={siteFavicon}
              onChange={(e) => setSiteFavicon(e.target.value)}
              placeholder="/public/favicon.ico"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-500 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          {/* OG SHARING IMAGE UPLOADER */}
          <div className="flex flex-col gap-3 bg-slate-50/30 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Social OG Image</span>
            
            <div className="relative group border border-dashed border-slate-250 hover:border-teal-600 rounded-xl h-36 flex flex-col items-center justify-center bg-white overflow-hidden transition-all duration-200 shadow-sm">
              {siteOgImage ? (
                <div className="w-full h-full flex items-center justify-center relative">
                  <img 
                    src={formatImgSrc(siteOgImage)} 
                    className="w-full h-full object-cover transition group-hover:scale-105"
                    alt="OG Preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/public/og-image.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                    <span className="text-white text-[10px] font-black uppercase tracking-wider bg-teal-650 px-3.5 py-2 rounded-xl shadow-sm cursor-pointer hover:bg-teal-700">
                      {uploadingField === "og_image" ? "Uploading..." : "Change OG Image"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <FiUploadCloud className="w-8 h-8 text-slate-350" />
                  <span className="text-[10px] font-bold">Upload OG image</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingField !== null}
                onChange={(e) => handleImageUpload(e, "og_image")}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <input
              type="text"
              value={siteOgImage}
              onChange={(e) => setSiteOgImage(e.target.value)}
              placeholder="/public/og-image.png"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-500 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          {/* CHATBOT AVATAR IMAGE UPLOADER */}
          <div className="flex flex-col gap-3 bg-slate-50/30 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chatbot Avatar Image</span>
            
            <div className="relative group border border-dashed border-slate-250 hover:border-teal-600 rounded-xl h-36 flex flex-col items-center justify-center bg-white overflow-hidden transition-all duration-200 shadow-sm">
              {siteChatbotAvatar ? (
                <div className="w-full h-full p-4 flex items-center justify-center relative">
                  <img 
                    src={formatImgSrc(siteChatbotAvatar)} 
                    className="h-14 w-14 object-contain rounded-full border border-slate-200 shadow-xs transition group-hover:scale-105"
                    alt="Chatbot Avatar Preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/8943/8943377.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                    <span className="text-white text-[10px] font-black uppercase tracking-wider bg-teal-650 px-3.5 py-2 rounded-xl shadow-sm cursor-pointer hover:bg-teal-700">
                      {uploadingField === "chatbot_avatar" ? "Uploading..." : "Change Avatar"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <FiUploadCloud className="w-8 h-8 text-slate-350" />
                  <span className="text-[10px] font-bold">Upload Chatbot Avatar</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingField !== null}
                onChange={(e) => handleImageUpload(e, "chatbot_avatar")}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>

            <input
              type="text"
              value={siteChatbotAvatar}
              onChange={(e) => setSiteChatbotAvatar(e.target.value)}
              placeholder="/public/images/chatbot-avatar.png"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-500 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

        </div>
      </div>

      {/* GENERAL IDENTITY & SEO METADATA */}
      <div className="border-b border-slate-100 pb-8">
        <h4 className="text-sm font-extrabold text-slate-855 mb-1">General Identity & SEO Metadata</h4>
        <p className="text-xs text-slate-505 mb-6 font-semibold">Define search engine parameters and name identifiers used dynamically by crawler indexers.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Site Name</span>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Buy2Lancer"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Site Short Name (e.g. for Lancer's Choice tag)</span>
            <input
              type="text"
              value={siteShortName}
              onChange={(e) => setSiteShortName(e.target.value)}
              placeholder="Lancer"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Share / Meta Description</span>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              placeholder="Buy2Lancer is a leading web portal linking freelancers and clients..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium placeholder-slate-400 shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Meta Keywords (comma separated)</span>
            <textarea
              value={siteKeywords}
              onChange={(e) => setSiteKeywords(e.target.value)}
              placeholder="freelance, marketplace, buy, services, client, gigs"
              rows={4}
              className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* HOME 3 HERO CAROUSEL MANAGER */}
      <div className="border-b border-slate-100 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-855 flex items-center gap-2">
              <FiGlobe className="w-4 h-4 text-teal-600" />
              <span>Home 3 Hero Banner Carousel Slides</span>
            </h4>
            <p className="text-xs text-slate-505 font-semibold mt-0.5">
              Manage banner slides for Home Page Three. Upload 2 cut-out images per slide, customize title/highlight text, CTA buttons, and backdrop circle colors.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSlide}
            className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer border-none"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {hero3Slides.map((slide, idx) => (
            <div key={slide.id || idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-white shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="bg-teal-600/30 text-teal-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-teal-500/30">
                  Slide #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSlide(idx)}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Remove Slide</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Title</span>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => handleSlideChange(idx, "title", e.target.value)}
                    className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Underlined Highlight Text</span>
                  <input
                    type="text"
                    value={slide.highlight_text}
                    onChange={(e) => handleSlideChange(idx, "highlight_text", e.target.value)}
                    placeholder="Text inside title to highlight green"
                    className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subtitle / Description</span>
                <textarea
                  value={slide.subtitle}
                  onChange={(e) => handleSlideChange(idx, "subtitle", e.target.value)}
                  rows={2}
                  className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              {/* Buttons Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Button Text</span>
                  <input
                    type="text"
                    value={slide.primary_btn_text}
                    onChange={(e) => handleSlideChange(idx, "primary_btn_text", e.target.value)}
                    className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Button Link</span>
                  <input
                    type="text"
                    value={slide.primary_btn_link}
                    onChange={(e) => handleSlideChange(idx, "primary_btn_link", e.target.value)}
                    className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Secondary Button Text</span>
                  <input
                    type="text"
                    value={slide.secondary_btn_text}
                    onChange={(e) => handleSlideChange(idx, "secondary_btn_text", e.target.value)}
                    className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Secondary Button Link</span>
                  <input
                    type="text"
                    value={slide.secondary_btn_link}
                    onChange={(e) => handleSlideChange(idx, "secondary_btn_link", e.target.value)}
                    className="dark-card-input w-full border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Dual Cutout Images & Circle Background Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                
                {/* Image 1 Box */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Cut-out Person Image 1 (Left Circle)</span>
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: slide.image_1_bg || "#0d9488" }} 
                      className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center relative"
                    >
                      <img src={slide.image_1} className="w-full h-full object-cover object-top" alt="Cutout 1" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <input
                        type="text"
                        value={slide.image_1}
                        onChange={(e) => handleSlideChange(idx, "image_1", e.target.value)}
                        placeholder="Image URL"
                        className="dark-card-input w-full border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono"
                      />
                      <div className="flex items-center gap-2">
                        <label className="bg-teal-650 hover:bg-teal-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer shrink-0">
                          {uploadingSlideIdx?.index === idx && uploadingSlideIdx?.target === "image_1" ? "Uploading..." : "Upload Image 1"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlideImageUpload(e, idx, "image_1")}
                            className="hidden"
                          />
                        </label>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-bold text-slate-400">Circle Color:</span>
                          <input
                            type="color"
                            value={slide.image_1_bg || "#0d9488"}
                            onChange={(e) => handleSlideChange(idx, "image_1_bg", e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image 2 Box */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Cut-out Person Image 2 (Right Circle)</span>
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: slide.image_2_bg || "#eab308" }} 
                      className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center relative"
                    >
                      <img src={slide.image_2} className="w-full h-full object-cover object-top" alt="Cutout 2" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      <input
                        type="text"
                        value={slide.image_2}
                        onChange={(e) => handleSlideChange(idx, "image_2", e.target.value)}
                        placeholder="Image URL"
                        className="dark-card-input w-full border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono"
                      />
                      <div className="flex items-center gap-2">
                        <label className="bg-teal-650 hover:bg-teal-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer shrink-0">
                          {uploadingSlideIdx?.index === idx && uploadingSlideIdx?.target === "image_2" ? "Uploading..." : "Upload Image 2"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlideImageUpload(e, idx, "image_2")}
                            className="hidden"
                          />
                        </label>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] font-bold text-slate-400">Circle Color:</span>
                          <input
                            type="color"
                            value={slide.image_2_bg || "#eab308"}
                            onChange={(e) => handleSlideChange(idx, "image_2_bg", e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      </div>

      {/* PLATFORM APP & SOCIAL LINKS */}
      <div>
        <h4 className="text-sm font-extrabold text-slate-855 mb-1 flex items-center gap-2">
          <FiExternalLink className="w-4 h-4 text-slate-500" />
          <span>Platform App & Social Links</span>
        </h4>
        <p className="text-xs text-slate-505 mb-6 font-semibold">Manage external marketplace links for your downloadable mobile apps and corporate social handles.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>App Store Link</span>
            <input
              type="text"
              value={appStoreUrl}
              onChange={(e) => setAppStoreUrl(e.target.value)}
              placeholder="https://apps.apple.com"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Google Play Store Link</span>
            <input
              type="text"
              value={googlePlayUrl}
              onChange={(e) => setGooglePlayUrl(e.target.value)}
              placeholder="https://play.google.com"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Instagram Handle URL</span>
            <input
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>LinkedIn Organization URL</span>
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* FLOATING SUCCESS TOAST */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-slideIn max-w-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            ✓
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-white leading-tight">{toastTitle || "Notification"}</span>
            {toastText && (
              <span className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">{toastText}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
