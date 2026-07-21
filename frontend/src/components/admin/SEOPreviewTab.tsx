"use client";
import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { FiSave, FiAlertCircle, FiGlobe, FiEye, FiCheck } from "react-icons/fi";

interface SeoSetting {
  seo_id: number;
  route_path: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

export default function SEOPreviewTab() {
  const [routesList, setRoutesList] = useState<SeoSetting[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SeoSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteLogo, setSiteLogo] = useState("");

  const resolveLogoUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const baseBackendUrl = API_URL.replace(/\/api\/?$/, "");
    return `${baseBackendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Form states
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");

  const fetchSeoSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/seo/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to load SEO route configurations.");
      const data = await res.json();
      setRoutesList(data);
      if (data.length > 0) {
        handleSelectRoute(data[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoSettings();
    const fetchSiteLogo = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            if (setting.setting_key === "site_settings") {
              let val = setting.setting_value;
              if (typeof val === "string") {
                try { val = JSON.parse(val); } catch (e) {}
              }
              if (val?.site_logo) {
                setSiteLogo(val.site_logo);
              }
            }
          });
        }
      } catch (err) {
        console.error("Failed to load site logo in SEO Preview:", err);
      }
    };
    fetchSiteLogo();
  }, []);

  const handleSelectRoute = (route: SeoSetting) => {
    setSelectedRoute(route);
    setMetaTitle(route.meta_title || "");
    setMetaDescription(route.meta_description || "");
    setMetaKeywords(route.meta_keywords || "");
    setOgTitle(route.og_title || "");
    setOgDescription(route.og_description || "");
    setOgImage(route.og_image || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute) return;

    try {
      setSaving(true);
      setSuccess(false);
      setError(null);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

      const res = await fetch(`${API_URL}/seo/admin/${selectedRoute.seo_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          meta_title: metaTitle,
          meta_description: metaDescription,
          meta_keywords: metaKeywords,
          og_title: ogTitle || metaTitle,
          og_description: ogDescription || metaDescription,
          og_image: ogImage || null
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed to save settings.");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Update local list
      setRoutesList(prev => prev.map(r => r.seo_id === selectedRoute.seo_id ? {
        ...r,
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        og_title: ogTitle || metaTitle,
        og_description: ogDescription || metaDescription,
        og_image: ogImage
      } : r));

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading route details...</p>
      </div>
    );
  }

  // Progressive Character Count Helper
  const getProgressColor = (length: number, type: "title" | "desc") => {
    if (type === "title") {
      if (length < 30) return "bg-slate-400";
      if (length <= 60) return "bg-emerald-500 shadow-sm shadow-emerald-500/25";
      if (length <= 70) return "bg-amber-500 shadow-sm shadow-amber-500/25";
      return "bg-rose-500 shadow-sm shadow-rose-500/25";
    } else {
      if (length < 100) return "bg-slate-400";
      if (length <= 160) return "bg-emerald-500 shadow-sm shadow-emerald-500/25";
      if (length <= 180) return "bg-amber-500 shadow-sm shadow-amber-500/25";
      return "bg-rose-500 shadow-sm shadow-rose-500/25";
    }
  };

  const titleProgress = Math.min(100, (metaTitle.length / 60) * 100);
  const descProgress = Math.min(100, (metaDescription.length / 160) * 100);

  const resolvedPreviewImage = ogImage 
    ? resolveLogoUrl(ogImage)
    : (siteLogo 
        ? resolveLogoUrl(siteLogo) 
        : "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
      );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800 animate-fadeIn">
      {/* Route Selector & Input Forms */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Route Selector Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3.5 select-none">
            Target Page Route
          </label>
          <div className="flex flex-wrap gap-2">
            {routesList.map((r) => {
              const isSelected = selectedRoute?.seo_id === r.seo_id;
              return (
                <button
                  key={r.seo_id}
                  type="button"
                  onClick={() => handleSelectRoute(r)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-teal-700 text-white border-teal-750 shadow-md shadow-teal-700/15"
                      : "bg-slate-50/70 hover:bg-slate-100/90 text-slate-650 border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-teal-300 animate-pulse" : "bg-slate-300"}`}></div>
                  <span>{r.route_path === "/" ? "Home Page" : r.route_path}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FiGlobe className="text-teal-750" />
              <span>SEO Metadata Customizer</span>
            </h3>
            <p className="text-xs text-slate-450 mt-1">Control search tags and indexing titles sent to search engine crawlers.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-2 animate-shake">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
              <FiCheck className="w-4 h-4 shrink-0" />
              <span>SEO settings updated successfully! Changes are now live.</span>
            </div>
          )}

          {/* Title tag with progressive meter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Title Tag</label>
              <span className={`text-[10px] font-black tracking-tight transition-colors duration-205 ${
                metaTitle.length > 60 ? "text-rose-500" : metaTitle.length >= 45 ? "text-emerald-600" : "text-slate-400"
              }`}>
                {metaTitle.length}/60 chars
              </span>
            </div>
            <input
              type="text"
              required
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Buy2Lancer - Professional Freelance Services Marketplace"
              className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700 focus:bg-white focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 font-medium"
            />
            {/* Title Progressive Indicator Meter */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1 select-none">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(metaTitle.length, "title")}`}
                style={{ width: `${titleProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Meta Description with progressive meter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Description Tag</label>
              <span className={`text-[10px] font-black tracking-tight transition-colors duration-205 ${
                metaDescription.length > 160 ? "text-rose-500" : metaDescription.length >= 120 ? "text-emerald-600" : "text-slate-400"
              }`}>
                {metaDescription.length}/160 chars
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Provide a high-converting call-to-action summary to increase organic Google click-through rates..."
              className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700 focus:bg-white focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-850 resize-none leading-relaxed font-medium"
            />
            {/* Description Progressive Indicator Meter */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1 select-none">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(metaDescription.length, "desc")}`}
                style={{ width: `${descProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Meta Keywords */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Keywords (Comma separated)</label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="e.g. freelance, developer, outsource projects, hire expert"
              className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700 focus:bg-white focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 font-medium"
            />
          </div>

          {/* OpenGraph/Social Titles (Accordion Box) */}
          <div className="border-t border-slate-100 pt-5 mt-2">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-4 select-none">
              OpenGraph Settings (Social Overrides)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OG Title Override</label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Defaults to Meta Title"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-700 focus:bg-white focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 font-medium"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OG Image Banner URL</label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="Paste banner image absolute URL"
                  className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-700 focus:bg-white focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 font-medium"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OG Description Override</label>
              <textarea
                rows={2}
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Defaults to Meta Description if left empty"
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-700 focus:bg-white focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 font-medium resize-none leading-relaxed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-700/10 border-0 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-t-white border-teal-600 rounded-full animate-spin"></div>
                <span>Saving Metadata...</span>
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                <span>Save Route SEO settings</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Preview Snippets */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Google Snippet Preview */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-4 select-none">
            <FiGlobe className="w-4 h-4 text-teal-750" />
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Google Search Snippet Preview</h3>
          </div>

          {/* High-fidelity Google Search Card */}
          <div className="border border-slate-150 rounded-2xl p-4.5 bg-white select-none shadow-sm font-sans text-left">
            {/* Header info */}
            <div className="flex items-center gap-3">
              {/* Simulated Favicon Bubble */}
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/60 shadow-sm text-slate-500 font-bold text-xs select-none">
                {selectedRoute?.route_path === "/" ? "B" : "L"}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-slate-900 font-medium leading-tight">Buy2Lancer</span>
                <span className="text-[11px] text-slate-550 leading-tight">
                  https://freelancer.sangvish.com{selectedRoute?.route_path === "/" ? "" : ` › ${selectedRoute?.route_path.replace("/", "")}`}
                </span>
              </div>
            </div>
            
            {/* Clickable title link */}
            <h4 className="text-[#1a0dab] hover:underline text-xl font-normal leading-snug mt-2.5 font-sans break-words cursor-pointer select-text">
              {metaTitle || "Please specify a Meta Title"}
            </h4>
            
            {/* Description snippet */}
            <p className="text-[#4d5156] text-[13.5px] leading-relaxed mt-1 font-sans break-words select-text">
              {metaDescription || "Please specify a description. Google search crawlers will generate a fallback snippet based on random page texts if left empty."}
            </p>
          </div>
        </div>

        {/* Social Card Preview */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-4 select-none">
            <FiEye className="w-4 h-4 text-teal-750" />
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Social Share Cards Preview</h3>
          </div>

          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50 select-none hover:shadow-md transition-all duration-200">
            {/* OG Image banner container */}
            <div className="h-48 bg-slate-100 relative flex items-center justify-center border-b border-slate-200/80 overflow-hidden group">
              <img 
                src={resolvedPreviewImage} 
                alt="OG Card Preview" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              {/* Preview Indicator overlay */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                Card Preview
              </div>
            </div>
            
            {/* OG Metadata details text */}
            <div className="p-4 bg-white font-sans text-left">
              <div className="text-[9.5px] uppercase text-slate-400 font-black tracking-wider">freelancer.sangvish.com</div>
              <h4 className="text-sm font-bold text-slate-900 truncate mt-1 leading-snug">
                {ogTitle || metaTitle || "Card Title Display"}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                {ogDescription || metaDescription || "Shared link description summary text..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
