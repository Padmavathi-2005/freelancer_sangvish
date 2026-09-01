"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import LandingSectionsEditor from "./LandingSectionsEditor";
import FaqEditor from "./FaqEditor";
import CustomSelect from "@/components/CustomSelect";
import { useLanguage } from "@/context/LanguageContext";

interface FrontendContentTabProps {
  frontendHeroContent: {
    hero_badge: string;
    hero_title: string;
    hero_subtitle: string;
    hero_search_placeholder: string;
    hero_search_btn: string;
    hero_popular_label: string;
    search: string;
  };
  setFrontendHeroContent: (v: any) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function FrontendContentTab({
  frontendHeroContent,
  setFrontendHeroContent,
  handleSaveSetting
}: FrontendContentTabProps) {
  const { t } = useLanguage();
  // Default selected section is "hero" (Home 1 Hero)
  const [selectedSection, setSelectedSection] = useState("hero");

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastText, setToastText] = useState("");

  const triggerToast = (title: string, text: string) => {
    setToastTitle(title);
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-8 shadow-sm animate-fadeIn text-left rtl:text-right">
      
      {/* HEADER SECTION with Section Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-855 text-left rtl:text-right">{t("admin_frontend_content_mgmt", "Frontend Content Management")}</h3>
          <p className="text-slate-505 text-xs mt-0.5 text-left rtl:text-right">{t("admin_frontend_content_mgmt_desc", "Select a homepage section below to edit copywriting or FAQ content.")}</p>
        </div>
        
        {/* Section switcher select dropdown with grouped sub-headings */}
        <CustomSelect
          options={[
            { value: "hdr_h1", label: t("hdr_h1", "── Home 1 Landing ──"), isHeader: true },
            { value: "hero", label: t("home1_hero", "Home 1 Hero") },

            { value: "hdr_h2", label: t("hdr_h2", "── Home 2 Landing ──"), isHeader: true },
            { value: "home2_hero", label: t("home2_hero", "Home 2 Hero") },
            { value: "home2_features", label: t("home2_features", "Home 2 Features Pool") },
            { value: "promo_cards", label: t("promo_cards", "Promo Banner Cards") },

            { value: "hdr_gen", label: t("hdr_gen", "── General & Site Content ──"), isHeader: true },
            { value: "general_sections", label: t("general_sections", "General Headings") },
            { value: "why_choose", label: t("why_choose", "Why Choose Us Grid") },
            { value: "how_it_works", label: t("how_it_works", "How It Works Steps") },
            { value: "faq", label: t("faq", "Frequently Asked Questions (FAQ)") }
          ]}
          value={selectedSection}
          onChange={(val) => setSelectedSection(val as string)}
          className="w-full sm:w-72"
        />
      </div>

      {/* Editor Content Area */}
      <div className="mt-2">
        {selectedSection === "faq" ? (
          <FaqEditor triggerToast={triggerToast} />
        ) : (
          <LandingSectionsEditor 
            triggerToast={triggerToast}
            frontendHeroContent={frontendHeroContent}
            setFrontendHeroContent={setFrontendHeroContent}
            handleSaveSetting={handleSaveSetting}
            defaultSubTab={selectedSection}
          />
        )}
      </div>

      {/* FLOATING SUCCESS TOAST */}
      {showToast && typeof document !== "undefined" && createPortal(
        <div className="fixed top-20 right-5 z-[999999] bg-[#0c1312] border border-[#14322e] text-white px-5 py-3 rounded-xl shadow-xl shadow-teal-950/10 flex items-center gap-3 animate-slideIn text-left rtl:text-right">
          <span className="text-emerald-400 font-bold text-base">✓</span>
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs font-black text-white">{toastTitle}</span>
            <span className="text-[10px] text-slate-300 font-semibold mt-0.5">{toastText}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
