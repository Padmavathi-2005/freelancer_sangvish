"use client";
import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { FiSave, FiAlertCircle, FiGlobe, FiEye, FiCheck } from "react-icons/fi";
import { useAdmin } from "@/app/admin/AdminContext";

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
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

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
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const processOgImage = (file: File): Promise<File> => {
    const MIN_W = 300, MIN_H = 200, MAX_W = 1200, MAX_H = 630;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const { naturalWidth: w, naturalHeight: h } = img;
        if (w < MIN_W || h < MIN_H) {
          reject(new Error(`Image is too small (${w}×${h}px). Minimum required size is ${MIN_W}×${MIN_H}px.`));
          return;
        }
        if (w <= MAX_W && h <= MAX_H) { resolve(file); return; }
        const scale = Math.min(MAX_W / w, MAX_H / h);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Could not resize image")); return; }
          resolve(new File([blob], file.name, { type: file.type }));
        }, file.type);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read image")); };
      img.src = objectUrl;
    });
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingOgImage(true);
      setError(null);
      const processed = await processOgImage(e.target.files[0]);
      
      const formData = new FormData();
      formData.append("file", processed);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Upload failed");
      }
      const data = await res.json();
      setOgImage(data.url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingOgImage(false);
    }
  };

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
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn ${isDark ? "text-slate-200" : "text-slate-800"}`}>
      {/* Route Selector & Input Forms */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Route Selector Card */}
        <div className={`rounded-3xl p-6 shadow-sm border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/80"}`}>
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
                      : isDark
                      ? "bg-slate-900 hover:bg-slate-800/80 text-slate-200 border-slate-800 hover:border-slate-700"
                      : "bg-slate-50/70 hover:bg-slate-100/90 text-slate-650 border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-teal-300 animate-pulse" : isDark ? "bg-slate-700" : "bg-slate-300"}`}></div>
                  <span>{r.route_path === "/" ? "Home Page" : r.route_path}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSave} className={`rounded-3xl p-6 shadow-sm flex flex-col gap-6 border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/80"}`}>
          <div className={`border-b pb-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
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
          )}          {/* Title tag with progressive meter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meta Title Tag</label>
              <span className={`text-[10px] font-black tracking-tight tracking-tight transition-colors duration-205 ${
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
              className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 dark:text-slate-100 font-medium"
            />
            {/* Title Progressive Indicator Meter */}
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mt-1 select-none">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(metaTitle.length, "title")}`}
                style={{ width: `${titleProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Meta Description with progressive meter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meta Description Tag</label>
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
              className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-850 dark:text-slate-100 resize-none leading-relaxed font-medium"
            />
            {/* Description Progressive Indicator Meter */}
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mt-1 select-none">
              <div 
                className={`h-full transition-all duration-300 ${getProgressColor(metaDescription.length, "desc")}`}
                style={{ width: `${descProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Meta Keywords */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meta Keywords (Comma separated)</label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="e.g. freelance, developer, outsource projects, hire expert"
              className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 dark:text-slate-100 font-medium"
            />
          </div>

          {/* OpenGraph/Social Titles (Accordion Box) */}
          <div className={`border-t pt-5 mt-2 ${isDark ? "border-slate-850" : "border-slate-100"}`}>
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-4 select-none">
              OpenGraph Settings (Social Overrides)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">OG Title Override</label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Defaults to Meta Title"
                  className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Custom Sharing Image</label>
                <div className="flex gap-2">
                  {ogImage && (
                    <img src={resolveLogoUrl(ogImage)} alt="SEO Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-700/60 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-between gap-2 shadow-sm border-slate-250 dark:border-slate-750 hover:border-slate-350 dark:hover:border-slate-600">
                      <span className={uploadingOgImage ? "text-slate-400" : "font-bold text-slate-700"}>
                        {uploadingOgImage ? "Uploading..." : ogImage ? "Change Image" : "Upload Image"}
                      </span>
                      {uploadingOgImage && (
                        <div className="w-3.5 h-3.5 border-2 border-t-transparent border-teal-700 rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingOgImage}
                      onChange={handleOgImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <span className="text-[9px] text-slate-450 font-medium mt-0.5">Min 300x200px &bull; Large images auto-resized to 1200x630px</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-4">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">OG Description Override</label>
              <textarea
                rows={2}
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Defaults to Meta Description if left empty"
                className="w-full bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 focus:bg-white dark:focus:bg-slate-950 focus:shadow-md focus:shadow-teal-700/5 transition-all text-slate-800 dark:text-slate-100 font-medium resize-none leading-relaxed"
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
        <div className={`rounded-3xl p-6 shadow-sm border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/80"}`}>
          <div className={`flex items-center gap-2 border-b pb-3.5 mb-4 select-none ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <FiGlobe className="w-4 h-4 text-teal-750" />
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Google Search Snippet Preview</h3>
          </div>

          {/* High-fidelity Google Search Card */}
          <div className={`border rounded-2xl p-4.5 select-none shadow-sm font-sans text-left ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-150"}`}>
            {/* Header info */}
            <div className="flex items-center gap-3">
              {/* Simulated Favicon Bubble */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-sm font-bold text-xs select-none ${isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200/60 text-slate-500"}`}>
                {selectedRoute?.route_path === "/" ? "B" : "L"}
              </div>
              <div className="flex flex-col">
                <span className={`text-[13px] font-medium leading-tight ${isDark ? "text-slate-200" : "text-slate-900"}`}>Buy2Lancer</span>
                <span className={`text-[11px] leading-tight ${isDark ? "text-slate-400" : "text-slate-550"}`}>
                  https://freelancer.sangvish.com{selectedRoute?.route_path === "/" ? "" : ` › ${selectedRoute?.route_path.replace("/", "")}`}
                </span>
              </div>
            </div>
            
            {/* Clickable title link */}
            <h4 className={`hover:underline text-xl font-normal leading-snug mt-2.5 font-sans break-words cursor-pointer select-text ${isDark ? "text-blue-450" : "text-[#1a0dab]"}`}>
              {metaTitle || "Please specify a Meta Title"}
            </h4>
            
            {/* Description snippet */}
            <p className={`text-[13.5px] leading-relaxed mt-1 font-sans break-words select-text ${isDark ? "text-slate-350" : "text-[#4d5156]"}`}>
              {metaDescription || "Please specify a description. Google search crawlers will generate a fallback snippet based on random page texts if left empty."}
            </p>
          </div>
        </div>

        {/* Social Card Preview */}
        <div className={`rounded-3xl p-6 shadow-sm border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/80"}`}>
          <div className={`flex items-center gap-2 border-b pb-3.5 mb-4 select-none ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <FiEye className="w-4 h-4 text-teal-750" />
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Social Share Cards Preview</h3>
          </div>

          <div className={`border rounded-2xl overflow-hidden select-none hover:shadow-md transition-all duration-200 ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50/50 border-slate-200/80"}`}>
            {/* OG Image banner container */}
            <div className={`h-48 relative flex items-center justify-center border-b overflow-hidden group ${isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200/80"}`}>
              <img 
                src={resolvedPreviewImage} 
                alt="OG Card Preview" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200";
                }}
              />
              {/* Preview Indicator overlay */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                Card Preview
              </div>
            </div>
            
            {/* OG Metadata details text */}
            <div className={`p-4 font-sans text-left ${isDark ? "bg-slate-900" : "bg-white"}`}>
              <div className="text-[9.5px] uppercase text-slate-400 font-black tracking-wider">freelancer.sangvish.com</div>
              <h4 className={`text-sm font-bold truncate mt-1 leading-snug ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {ogTitle || metaTitle || "Card Title Display"}
              </h4>
              <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-555"}`}>
                {ogDescription || metaDescription || "Shared link description summary text..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
