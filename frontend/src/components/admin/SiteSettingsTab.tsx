"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { FiGlobe, FiUploadCloud, FiExternalLink } from "react-icons/fi";

interface SiteSettingsTabProps {
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function SiteSettingsTab({
  handleSaveSetting
}: SiteSettingsTabProps) {

  // Site name/logo/favicon/OG details states
  const [siteName, setSiteName] = useState("Buy2Lancer");
  const [siteLogo, setSiteLogo] = useState("/public/logo.png");
  const [siteFavicon, setSiteFavicon] = useState("/public/favicon.ico");
  const [siteOgImage, setSiteOgImage] = useState("/public/og-image.png");
  const [siteDescription, setSiteDescription] = useState("LancerFlow Freelance Marketplace");
  const [siteKeywords, setSiteKeywords] = useState("freelance, marketplace, gig, order");
  const [siteShortName, setSiteShortName] = useState("Lancer");

  const [appStoreUrl, setAppStoreUrl] = useState("https://apps.apple.com");
  const [googlePlayUrl, setGooglePlayUrl] = useState("https://play.google.com");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com");

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [toastTitle, setToastTitle] = useState("Settings Saved");
  const [toastText, setToastText] = useState("Platform configuration updated successfully.");

  const [uploadingField, setUploadingField] = useState<"logo" | "favicon" | "og_image" | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "favicon" | "og_image") => {
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
      else if (target === "favicon") setSiteFavicon(data.url);
      else if (target === "og_image") setSiteOgImage(data.url);
      
      triggerToast("Upload Success", `${target.toUpperCase()} uploaded successfully!`);
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
            if (site.site_favicon) setSiteFavicon(site.site_favicon);
            if (site.site_og_image) setSiteOgImage(site.site_og_image);
            if (site.site_description) setSiteDescription(site.site_description);
            if (site.site_keywords) setSiteKeywords(site.site_keywords);
            if (site.site_short_name) setSiteShortName(site.site_short_name);

            const rawAppStore = data.find((s: any) => s.setting_key === "app_store_url")?.setting_value;
            const rawGooglePlay = data.find((s: any) => s.setting_key === "google_play_url")?.setting_value;
            const rawInstagram = data.find((s: any) => s.setting_key === "instagram_url")?.setting_value;
            const rawLinkedin = data.find((s: any) => s.setting_key === "linkedin_url")?.setting_value;

            if (rawAppStore) setAppStoreUrl(rawAppStore);
            if (rawGooglePlay) setGooglePlayUrl(rawGooglePlay);
            if (rawInstagram) setInstagramUrl(rawInstagram);
            if (rawLinkedin) setLinkedinUrl(rawLinkedin);
          }
      } catch (e) {
        console.error("Failed to load settings options", e);
      }
    };
    loadOptions();
  }, []);

  // Bulk manual save action for Site Settings
  const handleBulkSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setShowToast(false);

    try {
      // Save settings to DB
      await handleSaveSetting("site_settings", { 
        site_name: siteName, 
        site_logo: siteLogo,
        site_favicon: siteFavicon,
        site_og_image: siteOgImage,
        site_description: siteDescription,
        site_keywords: siteKeywords,
        site_short_name: siteShortName
      }, "site_settings");

      await handleSaveSetting("app_store_url", appStoreUrl, "site_settings");
      await handleSaveSetting("google_play_url", googlePlayUrl, "site_settings");
      await handleSaveSetting("instagram_url", instagramUrl, "site_settings");
      await handleSaveSetting("linkedin_url", linkedinUrl, "site_settings");

      triggerToast("Settings Saved", "Site identity and SEO settings saved successfully!");
      setSaveStatus({ type: "success", text: "✓ Site settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium placeholder-slate-400 shadow-sm";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1";

  // Helper to format/preview image URLs
  const formatImgSrc = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/") && !url.startsWith("/public")) {
      const apiDomain = API_URL.replace("/api", "");
      return `${apiDomain}${url}`;
    }
    return url;
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
          <p className="text-slate-505 text-xs mt-0.5 font-semibold">Configure site name, logo, favicon, social graph details, and meta descriptions for SEO.</p>
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

      {/* BRANDING ASSETS SECTION */}
      <div className="border-b border-slate-100 pb-8">
        <h4 className="text-sm font-extrabold text-slate-855 mb-1">Branding Assets</h4>
        <p className="text-xs text-slate-505 mb-6 font-semibold">Upload your corporate identity logo, browser favicon, and default sharing thumbnail.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* SITE LOGO UPLOADER */}
          <div className="flex flex-col gap-3 bg-slate-50/30 border border-slate-200/60 p-5 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Site Logo</span>
            
            <div className="relative group border border-dashed border-slate-250 hover:border-teal-600 rounded-xl h-36 flex flex-col items-center justify-center bg-white overflow-hidden transition-all duration-200 shadow-sm">
              {siteLogo ? (
                <div className="w-full h-full p-4 flex items-center justify-center relative">
                  <img 
                    src={formatImgSrc(siteLogo)} 
                    className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                    alt="Logo Preview" 
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
                  <span className="text-[10px] font-bold">Upload site logo</span>
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
        <div 
          className="fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-white/10 animate-slideIn"
          style={{ backgroundColor: "var(--color-primary, #0f766e)", color: "#ffffff" }}
        >
          <span className="text-white font-bold text-base" style={{ color: "#ffffff" }}>✓</span>
          <div className="flex flex-col">
            <span className="text-xs font-black" style={{ color: "#ffffff" }}>{toastTitle}</span>
            <span className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>{toastText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
