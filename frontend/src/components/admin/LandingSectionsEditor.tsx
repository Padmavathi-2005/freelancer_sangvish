"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

function getAdminToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
  }
  return "";
}

interface LandingSectionsEditorProps {
  triggerToast: (title: string, text: string) => void;
  frontendHeroContent: any;
  setFrontendHeroContent: (v: any) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function LandingSectionsEditor({
  triggerToast,
  frontendHeroContent,
  setFrontendHeroContent,
  handleSaveSetting
}: LandingSectionsEditorProps) {
  const [activeSubTab, setActiveSubTab] = useState("hero");
  const [availLanguages, setAvailLanguages] = useState<{ name: string; code: string }[]>([]);
  const [translationsByLang, setTranslationsByLang] = useState<Record<string, Record<string, string>>>({});
  const [selectedContentLang, setSelectedContentLang] = useState("EN");
  const [saving, setSaving] = useState(false);

  // Dynamic sections lists
  const [whyChooseFeats, setWhyChooseFeats] = useState<any[]>([]);
  const [howItWorksSteps, setHowItWorksSteps] = useState<any[]>([]);
  const [featuresPool, setFeaturesPool] = useState<any[]>([]);
  const [loadingFeats, setLoadingFeats] = useState(true);
  const [loadingSteps, setLoadingSteps] = useState(true);

  // New feature item draft
  const [newFeatTag, setNewFeatTag] = useState("");
  const [newFeatTitle, setNewFeatTitle] = useState("");
  const [newFeatDesc, setNewFeatDesc] = useState("");
  const [newFeatBadge, setNewFeatBadge] = useState("");
  const [newFeatIcon, setNewFeatIcon] = useState("zap");
  const [newFeatImg, setNewFeatImg] = useState("");

  const fetchFeaturesPool = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        const item = data.find((s: any) => s.setting_key === "home2_features_list");
        if (item && item.setting_value) {
          let val = item.setting_value;
          if (typeof val === "string") {
            try { val = JSON.parse(val); } catch (e) {}
          }
          if (Array.isArray(val)) setFeaturesPool(val);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch dynamic Why Choose Us
  const fetchWhyChooseFeats = async () => {
    try {
      const res = await fetch(`${API_URL}/why-choose-features`);
      if (res.ok) setWhyChooseFeats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFeats(false);
    }
  };

  // Fetch dynamic How It Works
  const fetchHowItWorksSteps = async () => {
    try {
      const res = await fetch(`${API_URL}/how-it-works-steps`);
      if (res.ok) setHowItWorksSteps(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSteps(false);
    }
  };

  const loadLangs = async () => {
    try {
      const langRes = await fetch(`${API_URL}/languages/active`);
      if (langRes.ok) setAvailLanguages(await langRes.json());
    } catch (e) {
      console.error("Failed to load active languages", e);
    }
  };

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
        // Hero Section
        hero_badge: dbVals.hero_badge || (code === "EN" ? (frontendHeroContent?.hero_badge || "The Top 3% Global Freelancers") : ""),
        hero_title: dbVals.hero_title || (code === "EN" ? (frontendHeroContent?.hero_title || "Hire Expert Freelancers For Your Next Big Project") : ""),
        hero_subtitle: dbVals.hero_subtitle || (code === "EN" ? (frontendHeroContent?.hero_subtitle || "Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.") : ""),
        hero_search_placeholder: dbVals.hero_search_placeholder || (code === "EN" ? (frontendHeroContent?.hero_search_placeholder || "What skill are you looking for?") : ""),
        hero_search_btn: dbVals.hero_search_btn || (code === "EN" ? (frontendHeroContent?.hero_search_btn || "Search Talent") : ""),
        hero_popular_label: dbVals.hero_popular_label || (code === "EN" ? (frontendHeroContent?.hero_popular_label || "Popular: UI Design, React, AI Automation, SEO") : ""),
        search: dbVals.search || (code === "EN" ? (frontendHeroContent?.search || "Search") : ""),

        // Home 2 Hero Section
        home2_hero_title_prefix: dbVals.home2_hero_title_prefix || (code === "EN" ? "Transform" : ""),
        home2_hero_title_highlight: dbVals.home2_hero_title_highlight || (code === "EN" ? "Your Team with" : ""),
        home2_hero_title_suffix: dbVals.home2_hero_title_suffix || (code === "EN" ? "Top Talent Discovery" : ""),
        home2_hero_subtitle: dbVals.home2_hero_subtitle || (code === "EN" ? "Flourish in a thriving freelance ecosystem dedicated to excellence and limitless opportunities." : ""),
        home2_search_placeholder: dbVals.home2_search_placeholder || (code === "EN" ? "Search by keyword" : ""),
        home2_filter_label: dbVals.home2_filter_label || (code === "EN" ? "Sellers" : ""),
        home2_search_btn: dbVals.home2_search_btn || (code === "EN" ? "Search" : ""),
        home2_popular_label: dbVals.home2_popular_label || (code === "EN" ? "Popular categories" : ""),
        home2_category_chips: dbVals.home2_category_chips || (code === "EN" ? "Digital marketing, Analytics & Strategy, AI Services" : ""),

        // General headings
        trusted_title: dbVals.trusted_title || (code === "EN" ? "Trusted by Innovative Companies Worldwide" : ""),
        categories_title: dbVals.categories_title || (code === "EN" ? "Browse Popular Categories" : ""),
        featured_title: dbVals.featured_title || (code === "EN" ? "Featured Freelancers" : ""),
        featured_subtitle: dbVals.featured_subtitle || (code === "EN" ? "Top-rated professionals ready to start immediately." : ""),
        featured_btn: dbVals.featured_btn || (code === "EN" ? "See all" : ""),
        popular_services_title: dbVals.popular_services_title || (code === "EN" ? "Popular Services" : ""),
        recent_projects_title: dbVals.recent_projects_title || (code === "EN" ? "Latest Projects" : ""),
        faq_header_title: dbVals.faq_header_title || (code === "EN" ? "Frequently Asked Questions" : ""),
        cta_title: dbVals.cta_title || (code === "EN" ? "Ready to Hire the Right Freelancer?" : ""),
        cta_subtitle: dbVals.cta_subtitle || (code === "EN" ? "Join thousands of businesses who trust Freelancer to deliver exceptional results on time, every time." : ""),
        cta_btn_primary: dbVals.cta_btn_primary || (code === "EN" ? "Get Started Now" : ""),
        cta_btn_secondary: dbVals.cta_btn_secondary || (code === "EN" ? "Talk to Sales" : ""),
        success_stories_title: dbVals.success_stories_title || (code === "EN" ? "Success Stories" : ""),
        stats_val_1: dbVals.stats_val_1 || (code === "EN" ? "25K+" : ""),
        stats_label_1: dbVals.stats_label_1 || (code === "EN" ? "Freelancers" : ""),
        stats_val_2: dbVals.stats_val_2 || (code === "EN" ? "100K+" : ""),
        stats_label_2: dbVals.stats_label_2 || (code === "EN" ? "Jobs Completed" : ""),
        stats_val_3: dbVals.stats_val_3 || (code === "EN" ? "₹50Cr+" : ""),
        stats_label_3: dbVals.stats_label_3 || (code === "EN" ? "Paid to Talent" : ""),
        stats_val_4: dbVals.stats_val_4 || (code === "EN" ? "4.9/5" : ""),
        stats_label_4: dbVals.stats_label_4 || (code === "EN" ? "Average Rating" : ""),
        
        why_choose_title: dbVals.why_choose_title || (code === "EN" ? "Why Choose Freelancer?" : ""),
        why_choose_subtitle: dbVals.why_choose_subtitle || (code === "EN" ? "We provide a seamless experience to find, hire, and manage top freelance talent globally." : ""),
        how_it_works_title: dbVals.how_it_works_title || (code === "EN" ? "How It Works" : ""),

        // Fallbacks for dynamic grid / steps loaded dynamically
        ...dbVals
      };
    });
    setTranslationsByLang(merged);
  };

  useEffect(() => {
    loadLangs();
    fetchWhyChooseFeats();
    fetchHowItWorksSteps();
    fetchFeaturesPool();
  }, []);

  useEffect(() => {
    loadTranslations();
  }, [availLanguages, whyChooseFeats, howItWorksSteps]);

  const updateLangField = (langCode: string, key: string, val: string) => {
    setTranslationsByLang((prev) => ({
      ...prev,
      [langCode]: {
        ...(prev[langCode] || {}),
        [key]: val
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetLangs = availLanguages.length > 0 ? availLanguages : [
        { name: "English", code: "EN" },
        { name: "Arabic", code: "AR" },
        { name: "French", code: "FR" },
        { name: "German", code: "DE" }
      ];

      for (const lang of targetLangs) {
        const code = lang.code.toUpperCase();
        const langData = translationsByLang[code] || {};
        
        const updates = Object.keys(langData).map((key) => ({
          key,
          value: langData[key] || ""
        }));

        await fetch(`${API_URL}/admin/translations/${code}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`
          },
          body: JSON.stringify({ updates })
        });
      }

      // Save English backup copy to global settings table
      const enVals = translationsByLang["EN"] || {};
      const nextHeroContent = {
        hero_badge: enVals.hero_badge || "",
        hero_title: enVals.hero_title || "",
        hero_subtitle: enVals.hero_subtitle || "",
        hero_search_placeholder: enVals.hero_search_placeholder || "",
        hero_search_btn: enVals.hero_search_btn || "",
        hero_popular_label: enVals.hero_popular_label || "",
        search: enVals.search || ""
      };
      await handleSaveSetting("frontend_hero_content", nextHeroContent, "frontend");
      setFrontendHeroContent(nextHeroContent);

      triggerToast("Copy Saved", "Landing page sections copywriting translations saved successfully!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error Saving", "Failed to save translations.");
    } finally {
      setSaving(false);
    }
  };

  // Why Choose features Actions
  const handleAddWhyChooseFeat = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/why-choose-features`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        triggerToast("Benefit Added", "New Why Choose benefit item added successfully!");
        await fetchWhyChooseFeats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWhyChooseFeat = async (id: number, suffix: string) => {
    const key = `why_choose_feat${suffix}_title`;
    const titleText = translationsByLang[selectedContentLang]?.[key] || "this benefit";
    if (!window.confirm(`Are you sure you want to delete "${titleText}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/why-choose-features/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        triggerToast("Benefit Deleted", "Removed benefit and translations successfully.");
        await fetchWhyChooseFeats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // How It Works Steps Actions
  const handleAddHowItWorksStep = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/how-it-works-steps`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        triggerToast("Step Added", "New timeline step item added successfully!");
        await fetchHowItWorksSteps();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHowItWorksStep = async (id: number, suffix: string) => {
    const key = `how_it_works_step${suffix}_title`;
    const titleText = translationsByLang[selectedContentLang]?.[key] || "this workflow step";
    if (!window.confirm(`Are you sure you want to delete "${titleText}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/admin/how-it-works-steps/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAdminToken()}` }
      });
      if (res.ok) {
        triggerToast("Step Deleted", "Removed step and translations successfully.");
        await fetchHowItWorksSteps();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-slate-800">
      
      {/* Header action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h4 className="text-base font-bold text-slate-800">Landing Page Copywriting</h4>
          <p className="text-xs text-slate-500 mt-1">Configure all main marketing texts and grids in all active languages.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer"
        >
          {saving ? "Saving translations..." : "Save Copywriting Translations"}
        </button>
      </div>

      {/* Select Language Switcher */}
      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/50">
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

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-100 gap-6 text-xs font-bold text-slate-550">
        <button 
          onClick={() => setActiveSubTab("hero")}
          className={`pb-3 transition-all relative ${
            activeSubTab === "hero" ? "text-teal-750 font-black border-b-2 border-teal-750" : "hover:text-slate-800"
          }`}
        >
          Home 1 Hero
        </button>
        <button 
          onClick={() => setActiveSubTab("home2_hero")}
          className={`pb-3 transition-all relative ${
            activeSubTab === "home2_hero" ? "text-teal-750 font-black border-b-2 border-teal-750" : "hover:text-slate-800"
          }`}
        >
          Home 2 Hero
        </button>
        <button 
          onClick={() => setActiveSubTab("home2_features")}
          className={`pb-3 transition-all relative ${
            activeSubTab === "home2_features" ? "text-teal-750 font-black border-b-2 border-teal-750" : "hover:text-slate-800"
          }`}
        >
          Home 2 Features Pool
        </button>
        <button 
          onClick={() => setActiveSubTab("general_sections")}
          className={`pb-3 transition-all relative ${
            activeSubTab === "general_sections" ? "text-teal-750 font-black border-b-2 border-teal-750" : "hover:text-slate-800"
          }`}
        >
          General Headings
        </button>
        <button 
          onClick={() => setActiveSubTab("why_choose")}
          className={`pb-3 transition-all relative ${
            activeSubTab === "why_choose" ? "text-teal-750 font-black border-b-2 border-teal-750" : "hover:text-slate-800"
          }`}
        >
          Why Choose Us Grid
        </button>
        <button 
          onClick={() => setActiveSubTab("how_it_works")}
          className={`pb-3 transition-all relative ${
            activeSubTab === "how_it_works" ? "text-teal-750 font-black border-b-2 border-teal-750" : "hover:text-slate-800"
          }`}
        >
          How It Works Steps
        </button>
      </div>

      {/* Form Content */}
      <div className="mt-2 bg-slate-50/30 border border-slate-200/50 p-5 rounded-xl">
        
        {activeSubTab === "hero" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hero Badge Text ({selectedContentLang})</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.hero_badge || ""}
                onChange={(e) => updateLangField(selectedContentLang, "hero_badge", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Button Text ({selectedContentLang})</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.hero_search_btn || ""}
                onChange={(e) => updateLangField(selectedContentLang, "hero_search_btn", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mobile Search Label ({selectedContentLang})</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.search || ""}
                onChange={(e) => updateLangField(selectedContentLang, "search", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hero Heading Title ({selectedContentLang})</label>
              <textarea
                rows={2}
                value={translationsByLang[selectedContentLang]?.hero_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "hero_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition resize-y font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hero Subtitle Paragraph ({selectedContentLang})</label>
              <textarea
                rows={3}
                value={translationsByLang[selectedContentLang]?.hero_subtitle || ""}
                onChange={(e) => updateLangField(selectedContentLang, "hero_subtitle", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition resize-y leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Input Placeholder ({selectedContentLang})</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.hero_search_placeholder || ""}
                onChange={(e) => updateLangField(selectedContentLang, "hero_search_placeholder", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Popular Tags Label ({selectedContentLang})</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.hero_popular_label || ""}
                onChange={(e) => updateLangField(selectedContentLang, "hero_popular_label", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>
          </div>
        )}

        {activeSubTab === "home2_hero" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Title Prefix ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Transform"
                value={translationsByLang[selectedContentLang]?.home2_hero_title_prefix || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_hero_title_prefix", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Title Highlighted Text ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Your Team with"
                value={translationsByLang[selectedContentLang]?.home2_hero_title_highlight || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_hero_title_highlight", e.target.value)}
                className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Title Suffix ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Top Talent Discovery"
                value={translationsByLang[selectedContentLang]?.home2_hero_title_suffix || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_hero_title_suffix", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hero Subtitle ({selectedContentLang})</label>
              <textarea
                rows={2}
                placeholder="e.g. Flourish in a thriving freelance ecosystem..."
                value={translationsByLang[selectedContentLang]?.home2_hero_subtitle || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_hero_subtitle", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Input Placeholder ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Search by keyword"
                value={translationsByLang[selectedContentLang]?.home2_search_placeholder || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_search_placeholder", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Filter Label ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Sellers"
                value={translationsByLang[selectedContentLang]?.home2_filter_label || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_filter_label", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Button Text ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Search"
                value={translationsByLang[selectedContentLang]?.home2_search_btn || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_search_btn", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Popular Label ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Popular categories"
                value={translationsByLang[selectedContentLang]?.home2_popular_label || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_popular_label", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Popular Category Chips (Comma Separated) ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="Digital marketing, Analytics & Strategy, AI Services"
                value={translationsByLang[selectedContentLang]?.home2_category_chips || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_category_chips", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            {/* Home 2 Feature Banner Customization */}
            <div className="flex flex-col gap-1.5 md:col-span-3 pt-4 border-t border-slate-200/60 mt-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Home 2 Featured Banner Section</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Banner Badge ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Verified Global Network"
                value={translationsByLang[selectedContentLang]?.home2_banner_badge || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_banner_badge", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Banner Title ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Empowering Top Talent & Enterprise Teams Worldwide"
                value={translationsByLang[selectedContentLang]?.home2_banner_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_banner_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Banner Button Text ({selectedContentLang})</label>
              <input
                type="text"
                placeholder="e.g. Explore Talent Directory"
                value={translationsByLang[selectedContentLang]?.home2_banner_btn || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_banner_btn", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Banner Image URL / Relative Path</label>
              <input
                type="text"
                placeholder="/home2_banner.png"
                value={translationsByLang[selectedContentLang]?.home2_banner_image || ""}
                onChange={(e) => updateLangField(selectedContentLang, "home2_banner_image", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-medium"
              />
            </div>
          </div>
        )}

        {/* Home 2 Features Pool Subtab */}
        {activeSubTab === "home2_features" && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Add New Feature to Pool</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Category Tag (e.g. ESCROW SECURITY)"
                  value={newFeatTag}
                  onChange={(e) => setNewFeatTag(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Badge (e.g. 100% Safe)"
                  value={newFeatBadge}
                  onChange={(e) => setNewFeatBadge(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
                />
                <select
                  value={newFeatIcon}
                  onChange={(e) => setNewFeatIcon(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
                >
                  <option value="zap">Zap / Lightning</option>
                  <option value="cpu">CPU / AI Smart</option>
                  <option value="shield">Shield / Protection</option>
                  <option value="credit_card">Credit Card / Payouts</option>
                  <option value="user_check">User Check / Verified</option>
                  <option value="message">Message / Chat</option>
                  <option value="lock">Lock / Secure</option>
                  <option value="award">Award / NDA</option>
                  <option value="trending">Trending / Growth</option>
                  <option value="clock">Clock / Fast Hire</option>
                  <option value="globe">Globe / Worldwide</option>
                  <option value="check">Checkmark / Guarantee</option>
                </select>
                <input
                  type="text"
                  placeholder="Image URL / Relative Path (e.g. /home2_banner.png)"
                  value={newFeatImg}
                  onChange={(e) => setNewFeatImg(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none md:col-span-3"
                />
                <input
                  type="text"
                  placeholder="Feature Title"
                  value={newFeatTitle}
                  onChange={(e) => setNewFeatTitle(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none md:col-span-3"
                />
                <textarea
                  placeholder="Feature Description"
                  rows={2}
                  value={newFeatDesc}
                  onChange={(e) => setNewFeatDesc(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none md:col-span-3"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!newFeatTitle.trim()) return;
                  const newItem = {
                    id: Date.now(),
                    tag: newFeatTag.trim() || "PLATFORM FEATURE",
                    badge: newFeatBadge.trim(),
                    title: newFeatTitle.trim(),
                    desc: newFeatDesc.trim(),
                    iconName: newFeatIcon,
                    image: newFeatImg.trim() || undefined
                  };
                  const updated = [...featuresPool, newItem];
                  setFeaturesPool(updated);
                  setNewFeatTag("");
                  setNewFeatBadge("");
                  setNewFeatTitle("");
                  setNewFeatDesc("");
                  setNewFeatImg("");

                  try {
                    await fetch(`${API_URL}/settings`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        setting_key: "home2_features_list",
                        setting_value: JSON.stringify(updated)
                      })
                    });
                  } catch (e) {
                    console.error("Failed to save feature item:", e);
                  }
                }}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition self-start cursor-pointer border-none"
              >
                + Add Feature to Pool
              </button>
            </div>

            {/* Current Pool List */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Features Pool ({featuresPool.length} Total Items Available — System randomly displays 7 on each page load)
              </span>

              {featuresPool.map((feat, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-teal-750 uppercase bg-teal-50 px-2 py-0.5 rounded">{feat.tag}</span>
                      {feat.badge && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{feat.badge}</span>}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{feat.title}</h4>
                    <p className="text-[11px] text-slate-500">{feat.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = featuresPool.filter((_, i) => i !== idx);
                      setFeaturesPool(updated);
                      try {
                        await fetch(`${API_URL}/settings`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            setting_key: "home2_features_list",
                            setting_value: JSON.stringify(updated)
                          })
                        });
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 border-none cursor-pointer shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "general_sections" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trusted Companies Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.trusted_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "trusted_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Browse Categories Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.categories_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "categories_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Featured Freelancers Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.featured_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "featured_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Featured button text</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.featured_btn || ""}
                onChange={(e) => updateLangField(selectedContentLang, "featured_btn", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Featured Freelancers Subtitle</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.featured_subtitle || ""}
                onChange={(e) => updateLangField(selectedContentLang, "featured_subtitle", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Popular Services Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.popular_services_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "popular_services_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recent Projects Section Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.recent_projects_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "recent_projects_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">FAQ Section Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.faq_header_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "faq_header_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
              />
            </div>

            {/* CTA Section Copy */}
            <div className="flex flex-col gap-1.5 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
              <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Footer CTA Section</label>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CTA Header Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.cta_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "cta_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CTA Primary Button Label</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.cta_btn_primary || ""}
                onChange={(e) => updateLangField(selectedContentLang, "cta_btn_primary", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CTA Subtitle Description</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.cta_subtitle || ""}
                onChange={(e) => updateLangField(selectedContentLang, "cta_subtitle", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">CTA Secondary Button Label</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.cta_btn_secondary || ""}
                onChange={(e) => updateLangField(selectedContentLang, "cta_btn_secondary", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full"
              />
            </div>

            {/* Success Stories & Stats Copy */}
            <div className="flex flex-col gap-1.5 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
              <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Success Stories & Stats Bar</label>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Success Stories Heading Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.success_stories_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "success_stories_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition w-full font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stat 1 (Freelancers)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_val_1 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_val_1", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-700 transition"
                />
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_label_1 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_label_1", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 focus:outline-none focus:border-teal-700 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stat 2 (Jobs Completed)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_val_2 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_val_2", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-700 transition"
                />
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_label_2 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_label_2", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 focus:outline-none focus:border-teal-700 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stat 3 (Paid to Talent)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_val_3 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_val_3", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-700 transition"
                />
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_label_3 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_label_3", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 focus:outline-none focus:border-teal-700 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stat 4 (Average Rating)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_val_4 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_val_4", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-700 transition"
                />
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.stats_label_4 || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "stats_label_4", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 focus:outline-none focus:border-teal-700 transition"
                />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "why_choose" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Why Choose Section Title</label>
                <input
                  type="text"
                  value={translationsByLang[selectedContentLang]?.why_choose_title || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "why_choose_title", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Why Choose Section Subtitle</label>
                <textarea
                  rows={2}
                  value={translationsByLang[selectedContentLang]?.why_choose_subtitle || ""}
                  onChange={(e) => updateLangField(selectedContentLang, "why_choose_subtitle", e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* List of dynamic Why Choose features */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-bold text-slate-700">Grid Features List</h5>
                <button
                  type="button"
                  onClick={handleAddWhyChooseFeat}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Feature
                </button>
              </div>

              {loadingFeats ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-teal-750 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whyChooseFeats.map((feat, index) => {
                    const tKey = `why_choose_feat${feat.key_suffix}_title`;
                    const dKey = `why_choose_feat${feat.key_suffix}_desc`;

                    return (
                      <div key={feat.feature_id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 relative shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-[10px] font-black text-[#0a5a54] uppercase tracking-wider">Benefit #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteWhyChooseFeat(feat.feature_id, feat.key_suffix)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg transition hover:bg-rose-50 cursor-pointer"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Title ({selectedContentLang})</label>
                          <input
                            type="text"
                            value={translationsByLang[selectedContentLang]?.[tKey] || ""}
                            onChange={(e) => updateLangField(selectedContentLang, tKey, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-750 transition"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Description ({selectedContentLang})</label>
                          <textarea
                            rows={2}
                            value={translationsByLang[selectedContentLang]?.[dKey] || ""}
                            onChange={(e) => updateLangField(selectedContentLang, dKey, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-teal-750 transition resize-y leading-relaxed font-medium"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "how_it_works" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5 max-w-sm border-b border-slate-100 pb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">How It Works Section Title</label>
              <input
                type="text"
                value={translationsByLang[selectedContentLang]?.how_it_works_title || ""}
                onChange={(e) => updateLangField(selectedContentLang, "how_it_works_title", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-bold"
              />
            </div>

            {/* List of dynamic How It Works steps */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-bold text-slate-700">Timeline Steps List</h5>
                <button
                  type="button"
                  onClick={handleAddHowItWorksStep}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>

              {loadingSteps ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-teal-755 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {howItWorksSteps.map((step, index) => {
                    const tKey = `how_it_works_step${step.key_suffix}_title`;
                    const dKey = `how_it_works_step${step.key_suffix}_desc`;

                    return (
                      <div key={step.step_id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 relative shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-[10px] font-black text-[#0a5a54] uppercase tracking-wider">Step #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteHowItWorksStep(step.step_id, step.key_suffix)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg transition hover:bg-rose-50 cursor-pointer"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Title ({selectedContentLang})</label>
                          <input
                            type="text"
                            value={translationsByLang[selectedContentLang]?.[tKey] || ""}
                            onChange={(e) => updateLangField(selectedContentLang, tKey, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-teal-750 transition"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Description ({selectedContentLang})</label>
                          <textarea
                            rows={2}
                            value={translationsByLang[selectedContentLang]?.[dKey] || ""}
                            onChange={(e) => updateLangField(selectedContentLang, dKey, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-teal-750 transition resize-y leading-relaxed font-medium"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
