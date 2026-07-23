"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTA from "@/components/CTA";
import RecentProjects from "@/components/RecentProjects";
import PopularServices from "@/components/PopularServices";
import HowItWorks from "@/components/HowItWorks";
import SuccessStories from "@/components/SuccessStories";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FiSearch, 
  FiBriefcase, 
  FiShoppingBag, 
  FiArrowRight, 
  FiDollarSign, 
  FiCheckCircle, 
  FiCpu,
  FiZap,
  FiAward
} from "react-icons/fi";

export default function Home3() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"services" | "projects">("projects");
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "services") {
      router.push(query.trim() ? `/gigs?query=${encodeURIComponent(query.trim())}` : "/gigs");
    } else {
      router.push(query.trim() ? `/projects?query=${encodeURIComponent(query.trim())}` : "/projects");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans w-full max-w-full relative">
      <Header />

      {/* HERO SECTION 3 - ENTERPRISE HUB (DARK GLASSMORPHIC DUAL SEARCH) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 select-none text-left border-b border-slate-800">
        {/* Decorative Grid Backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Glow Spheres */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center gap-8">
          
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-4 py-1.5 rounded-full text-xs font-black text-emerald-400 backdrop-blur-md shadow-lg">
            <FiAward className="w-4 h-4 text-emerald-400" />
            <span>{t("enterprise_hub_badge", "Enterprise & High-Budget Freelance Network")}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight max-w-4xl font-display">
            {t("home3_hero_title", "Scale Your Business With Vetted Freelancers & Live Client Tenders")}
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl">
            {t("home3_hero_subtitle", "Post high-value client projects, bid on active marketplace tenders, or instantly order specialized freelance gig packages.")}
          </p>

          {/* DUAL SEARCH SWITCHER BOX */}
          <div className="w-full max-w-2xl bg-slate-800/90 border border-slate-700/80 backdrop-blur-2xl p-3 sm:p-4 rounded-3xl shadow-2xl flex flex-col gap-3">
            {/* Tab Header Buttons */}
            <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/50">
              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
                  activeTab === "projects"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiBriefcase className="w-4 h-4" />
                <span>{t("find_client_projects", "Find Client Projects")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("services")}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border-none ${
                  activeTab === "services"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>{t("buy_service_gigs", "Buy Service Gigs")}</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 border border-slate-700/60 rounded-2xl flex-1 w-full text-left">
                <FiSearch className="w-5 h-5 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "projects"
                      ? t("home3_search_projects_ph", "Search projects e.g. Next.js Developer, Mobile App...")
                      : t("home3_search_gigs_ph", "Search gigs e.g. Full Stack Web Development, Graphic Design...")
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-slate-400 outline-none w-full font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-7 py-3.5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 shrink-0 cursor-pointer border-none"
              >
                <span>{t("search_btn", "Search")}</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Stat Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-800/80 w-full max-w-4xl text-slate-300 text-xs font-extrabold">
            <div className="flex items-center justify-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{t("zero_commission_options", "Low Service Fees")}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FiZap className="w-4 h-4 text-amber-400" />
              <span>{t("ai_matched_proposals", "AI Proposal Assistant")}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FiDollarSign className="w-4 h-4 text-teal-400" />
              <span>{t("milestone_escrow", "Milestone Escrow")}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <FiCpu className="w-4 h-4 text-cyan-400" />
              <span>{t("verified_identity", "Vetted Identity Checks")}</span>
            </div>
          </div>

        </div>
      </section>

      {/* RECENT PROJECTS MARKETPLACE */}
      <RecentProjects />

      {/* POPULAR GIG SERVICES */}
      <PopularServices />

      {/* HOW IT WORKS PIPELINE */}
      <HowItWorks />

      {/* SUCCESS STORIES */}
      <SuccessStories />

      {/* CTA & FOOTER */}
      <div className="relative overflow-hidden bg-slate-950 border-t border-slate-800 w-full mt-auto">
        <div className="relative z-10 w-full">
          <CTA />
          <Footer transparent={true} />
        </div>
      </div>
    </div>
  );
}
