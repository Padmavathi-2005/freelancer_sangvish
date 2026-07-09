"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";

function getAdminToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }
  return "";
}

interface HeroContentEditorProps {
  frontendHeroContent: {
    hero_badge: string;
    hero_title: string;
    hero_subtitle: string;
    hero_search_placeholder: string;
    hero_search_btn: string;
    hero_popular_label: string;
  };
  setFrontendHeroContent: (v: any) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
  triggerToast: (title: string, text: string) => void;
}

export default function HeroContentEditor({
  frontendHeroContent,
  setFrontendHeroContent,
  handleSaveSetting,
  triggerToast
}: HeroContentEditorProps) {
  const [badge, setLocalBadge] = useState(frontendHeroContent?.hero_badge || "");
  const [title, setLocalTitle] = useState(frontendHeroContent?.hero_title || "");
  const [subtitle, setLocalSubtitle] = useState(frontendHeroContent?.hero_subtitle || "");
  const [placeholder, setLocalPlaceholder] = useState(frontendHeroContent?.hero_search_placeholder || "");
  const [searchBtn, setLocalSearchBtn] = useState(frontendHeroContent?.hero_search_btn || "");
  const [popularLabel, setLocalPopularLabel] = useState(frontendHeroContent?.hero_popular_label || "");

  const [availLanguages, setAvailLanguages] = useState<{ name: string; code: string }[]>([]);
  const [translationsByLang, setTranslationsByLang] = useState<Record<string, Record<string, string>>>({});
  const [selectedContentLang, setSelectedContentLang] = useState("EN");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadLangs = async () => {
      try {
        const langRes = await fetch(`${API_URL}/languages/active`);
        if (langRes.ok) setAvailLanguages(await langRes.json());
      } catch (e) {
        console.error("Failed to load active languages", e);
      }
    };
    loadLangs();
  }, []);

  useEffect(() => {
    if (frontendHeroContent) {
      setLocalBadge(frontendHeroContent.hero_badge || "");
      setLocalTitle(frontendHeroContent.hero_title || "");
      setLocalSubtitle(frontendHeroContent.hero_subtitle || "");
      setLocalPlaceholder(frontendHeroContent.hero_search_placeholder || "");
      setLocalSearchBtn(frontendHeroContent.hero_search_btn || "");
      setLocalPopularLabel(frontendHeroContent.hero_popular_label || "");
    }
  }, [frontendHeroContent]);

  useEffect(() => {
    const loadTranslations = async () => {
      if (availLanguages.length === 0) return;
      const transMap: Record<string, Record<string, string>> = {};
      
      for (const lang of availLanguages) {
        try {
          const res = await fetch(`${API_URL}/admin/translations/${lang.code}`, {
            headers: { Authorization: `Bearer ${getAdminToken()}` }
          });
          if (res.ok) {
            const data = await res.json();
            const keysObj: Record<string, string> = {};
            data.forEach((item: any) => {
              keysObj[item.key] = item.value;
            });
            transMap[lang.code.toUpperCase()] = keysObj;
          }
        } catch (e) {
          console.error(e);
        }
      }

      const merged: Record<string, Record<string, string>> = {};
      availLanguages.forEach((lang) => {
        const code = lang.code.toUpperCase();
        const dbVals = transMap[code] || {};
        merged[code] = {
          hero_badge: dbVals.hero_badge || (code === "EN" ? (frontendHeroContent?.hero_badge || "The Top 3% Global Freelancers") : ""),
          hero_title: dbVals.hero_title || (code === "EN" ? (frontendHeroContent?.hero_title || "Hire Expert Freelancers For Your Next Big Project") : ""),
          hero_subtitle: dbVals.hero_subtitle || (code === "EN" ? (frontendHeroContent?.hero_subtitle || "Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.") : ""),
          hero_search_placeholder: dbVals.hero_search_placeholder || (code === "EN" ? (frontendHeroContent?.hero_search_placeholder || "What skill are you looking for?") : ""),
          hero_search_btn: dbVals.hero_search_btn || (code === "EN" ? (frontendHeroContent?.hero_search_btn || "Search Talent") : ""),
          hero_popular_label: dbVals.hero_popular_label || (code === "EN" ? (frontendHeroContent?.hero_popular_label || "Popular: UI Design, React, AI Automation, SEO") : ""),
        };
      });
      setTranslationsByLang(merged);
    };
    loadTranslations();
  }, [availLanguages, frontendHeroContent]);

  const updateLangField = (langCode: string, key: string, val: string) => {
    setTranslationsByLang((prev) => ({
      ...prev,
      [langCode]: {
        ...(prev[langCode] || {}),
        [key]: val
      }
    }));
  };

  const handleCopywritingSave = async () => {
    setSaving(true);
    try {
      const nextHeroContent = {
        hero_badge: translationsByLang["EN"]?.hero_badge || badge,
        hero_title: translationsByLang["EN"]?.hero_title || title,
        hero_subtitle: translationsByLang["EN"]?.hero_subtitle || subtitle,
        hero_search_placeholder: translationsByLang["EN"]?.hero_search_placeholder || placeholder,
        hero_search_btn: translationsByLang["EN"]?.hero_search_btn || searchBtn,
        hero_popular_label: translationsByLang["EN"]?.hero_popular_label || popularLabel
      };

      await handleSaveSetting("frontend_hero_content", nextHeroContent, "frontend");

      const targetLangs = availLanguages.length > 0 ? availLanguages : [
        { name: "English", code: "EN" },
        { name: "Arabic", code: "AR" },
        { name: "French", code: "FR" },
        { name: "German", code: "DE" }
      ];

      for (const lang of targetLangs) {
        const code = lang.code.toUpperCase();
        const langData = translationsByLang[code] || {};
        const updates = [
          { key: "hero_badge", value: langData.hero_badge || "" },
          { key: "hero_title", value: langData.hero_title || "" },
          { key: "hero_subtitle", value: langData.hero_subtitle || "" },
          { key: "hero_search_placeholder", value: langData.hero_search_placeholder || "" },
          { key: "hero_search_btn", value: langData.hero_search_btn || "" },
          { key: "hero_popular_label", value: langData.hero_popular_label || "" }
        ];

        await fetch(`${API_URL}/admin/translations/${code}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`
          },
          body: JSON.stringify({ updates })
        });
      }

      setFrontendHeroContent(nextHeroContent);
      triggerToast("Content Saved", "Landing page hero copywriting translations saved successfully!");
    } catch (e) {
      console.error(e);
      triggerToast("Error Saving", "Failed to save copywriting settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h4 className="text-base font-bold text-slate-800">Hero Section Copywriting</h4>
          <p className="text-xs text-slate-500 mt-1">Configure landing page hero section copywriting for all active site languages.</p>
        </div>
        <button
          onClick={handleCopywritingSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer"
        >
          {saving ? "Saving translations..." : "Save Copywriting Translations"}
        </button>
      </div>

      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
        <span className="text-xs font-bold text-slate-500">Edit translations for:</span>
        <div className="flex items-center gap-1">
          {(availLanguages.length > 0 ? availLanguages : [
            { name: "English", code: "EN" },
            { name: "Arabic", code: "AR" },
            { name: "French", code: "FR" },
            { name: "German", code: "DE" }
          ]).map((langItem) => (
            <button
              key={langItem.code}
              type="button"
              onClick={() => setSelectedContentLang(langItem.code.toUpperCase())}
              className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl transition cursor-pointer ${
                selectedContentLang === langItem.code.toUpperCase()
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-550 hover:bg-slate-150"
              }`}
            >
              {langItem.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30 border border-slate-200/50 p-5 rounded-3xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hero Badge Text ({selectedContentLang})</label>
          <input
            type="text"
            value={translationsByLang[selectedContentLang]?.hero_badge || ""}
            onChange={(e) => updateLangField(selectedContentLang, "hero_badge", e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            placeholder="e.g. The Top 3% Global Freelancers"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Button Text ({selectedContentLang})</label>
          <input
            type="text"
            value={translationsByLang[selectedContentLang]?.hero_search_btn || ""}
            onChange={(e) => updateLangField(selectedContentLang, "hero_search_btn", e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            placeholder="e.g. Search Talent"
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hero Heading Title ({selectedContentLang})</label>
          <textarea
            rows={2}
            value={translationsByLang[selectedContentLang]?.hero_title || ""}
            onChange={(e) => updateLangField(selectedContentLang, "hero_title", e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition resize-y font-bold"
            placeholder="e.g. Hire Expert Freelancers For Your Next Big Project"
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hero Subtitle Paragraph ({selectedContentLang})</label>
          <textarea
            rows={3}
            value={translationsByLang[selectedContentLang]?.hero_subtitle || ""}
            onChange={(e) => updateLangField(selectedContentLang, "hero_subtitle", e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition resize-y leading-relaxed"
            placeholder="e.g. Connect with top-tier professionals. Execute faster with vetted talent..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Input Placeholder ({selectedContentLang})</label>
          <input
            type="text"
            value={translationsByLang[selectedContentLang]?.hero_search_placeholder || ""}
            onChange={(e) => updateLangField(selectedContentLang, "hero_search_placeholder", e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            placeholder="e.g. What skill are you looking for?"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Popular Tags Label ({selectedContentLang})</label>
          <input
            type="text"
            value={translationsByLang[selectedContentLang]?.hero_popular_label || ""}
            onChange={(e) => updateLangField(selectedContentLang, "hero_popular_label", e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
            placeholder="e.g. Popular: UI Design, React, AI Automation, SEO"
          />
        </div>
      </div>
    </div>
  );
}
