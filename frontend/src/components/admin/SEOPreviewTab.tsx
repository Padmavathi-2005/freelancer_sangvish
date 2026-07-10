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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-800 animate-fadeIn">
      {/* Route Selector & Input Forms */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Route Selector Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-2">Target Page Route</label>
          <div className="flex flex-wrap gap-2">
            {routesList.map((r) => (
              <button
                key={r.seo_id}
                onClick={() => handleSelectRoute(r)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedRoute?.seo_id === r.seo_id
                    ? "bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/10"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {r.route_path === "/" ? "Home Page" : r.route_path}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-800">SEO Metadata Customizer</h3>
            <p className="text-xs text-slate-450 mt-0.5">Control title tags and description tags sent to crawlers.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <FiCheck className="w-4 h-4 shrink-0" />
              <span>SEO changes saved successfully! Changes are live.</span>
            </div>
          )}

          {/* Title tag */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Title Tag</label>
              <span className={`text-[10px] font-bold ${metaTitle.length > 60 ? "text-amber-500" : "text-slate-400"}`}>
                {metaTitle.length}/60 chars (Recommended max)
              </span>
            </div>
            <input
              type="text"
              required
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Buy2Lancer - Professional Marketplace"
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800 font-medium"
            />
          </div>

          {/* Meta Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Description Tag</label>
              <span className={`text-[10px] font-bold ${metaDescription.length > 160 ? "text-amber-500" : "text-slate-400"}`}>
                {metaDescription.length}/160 chars (Recommended max)
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Provide a compelling call-to-action summary to increase organic Google click-through rates..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800 resize-none leading-relaxed"
            />
          </div>

          {/* Meta Keywords */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Keywords (Comma separated)</label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="e.g. freelance, dev, hire coder, outsource coding"
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800 font-medium"
            />
          </div>

          {/* OpenGraph/Social Titles */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">OpenGraph (Social Share overrides)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OG Title Override</label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Defaults to Meta Title"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OG Social Share Banner URL</label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="Paste banner image absolute URL"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-700 hover:bg-teal-850 text-white font-bold py-3 rounded-xl transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-700/10 border-0 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-t-white border-teal-600 rounded-full animate-spin"></div>
                <span>Saving Metadata changes...</span>
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <FiGlobe className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Google Search Snippet Preview</h3>
          </div>

          <div className="border border-slate-150 rounded-xl p-4 bg-white select-none">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">HTTPS</span>
              <span>freelancer.sangvish.com{selectedRoute?.route_path === "/" ? "" : selectedRoute?.route_path}</span>
            </div>
            {/* Title link */}
            <h4 className="text-[#1a0dab] hover:underline text-lg font-normal leading-tight mt-1.5 font-sans break-words cursor-pointer">
              {metaTitle || "Please specify a Meta Title"}
            </h4>
            {/* Description */}
            <p className="text-[#4d5156] text-[13px] leading-relaxed mt-1 font-sans break-words">
              {metaDescription || "Please specify a description. Google search crawlers will generate a fallback snippet based on random page texts if left empty."}
            </p>
          </div>
        </div>

        {/* Social Card Preview */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <FiEye className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Social Share Cards Preview</h3>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-[#f2f4f5] select-none hover:shadow-md transition-shadow">
            {/* OG Image */}
            <div className="h-44 bg-slate-100 relative flex items-center justify-center border-b border-slate-200 overflow-hidden">
              {ogImage ? (
                <img src={ogImage} alt="OG Card Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <FiGlobe className="w-8 h-8 stroke-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">No Banner Specified (Fallback Logo)</span>
                </div>
              )}
            </div>
            {/* OG Info text */}
            <div className="p-3 bg-white font-sans">
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">freelancer.sangvish.com</div>
              <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5 leading-tight">
                {ogTitle || metaTitle || "Card Title Display"}
              </h4>
              <p className="text-xs text-slate-450 line-clamp-2 mt-1 leading-relaxed">
                {ogDescription || metaDescription || "Shared link description summary text..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
