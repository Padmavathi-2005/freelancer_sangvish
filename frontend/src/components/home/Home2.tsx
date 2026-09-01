"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CTA from "@/components/CTA";
import PopularServices from "@/components/PopularServices";
import FeaturedFreelancers from "@/components/FeaturedFreelancers";
import Home2Categories from "@/components/home/Home2Categories";
import Home2PromoCards from "@/components/home/Home2PromoCards";
import Home2FeaturesShowcase from "@/components/home/Home2FeaturesShowcase";
import RecentProjects from "@/components/RecentProjects";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FiSearch, 
  FiArrowRight, 
  FiChevronDown,
  FiCheckCircle, 
  FiShield, 
  FiZap, 
  FiStar, 
  FiUsers, 
  FiBriefcase
} from "react-icons/fi";

import CompanyScrollSection from "@/components/home/CompanyScrollSection";

export default function Home2() {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"sellers" | "services" | "projects">("sellers");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterOptions = [
    { value: "sellers", label: t("home2_filter_label", "Freelancer") },
    { value: "services", label: t("home2_filter_services_label", "Gigs") },
    { value: "projects", label: t("home2_filter_projects_label", "Projects") },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchFilter === "projects") {
      router.push(searchQuery.trim() ? `/projects?query=${encodeURIComponent(searchQuery.trim())}` : "/projects");
    } else if (searchFilter === "sellers") {
      router.push(searchQuery.trim() ? `/talent?query=${encodeURIComponent(searchQuery.trim())}` : "/talent");
    } else {
      router.push(searchQuery.trim() ? `/gigs?query=${encodeURIComponent(searchQuery.trim())}` : "/gigs");
    }
  };

  const currentFilterLabel = filterOptions.find((o) => o.value === searchFilter)?.label || "Freelancer";
  const chipsRaw = t("home2_category_chips", "Digital marketing, Analytics & Strategy, AI Services");
  const chipsList = chipsRaw ? chipsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-50 font-sans w-full max-w-full relative">
      <Header />

      {/* HERO SECTION 2 - SOFT PRIMARY COLOR LIGHT BACKGROUND */}
      <section className="relative overflow-hidden bg-primary/[0.05] dark:bg-primary/[0.12] pt-16 pb-20 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 select-none border-b border-primary/10">

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 relative z-10" style={{ direction: "ltr" }}>

          {/* CENTER: Main hero content */}
          <div className="flex-1 flex flex-col items-center text-center">

            {/* Main Headline with DB-driven Primary Color Highlight */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.28] sm:leading-[1.25] max-w-4xl font-display">
              <span className="inline-block">{t("home2_hero_title_prefix", "Transform")}</span>{" "}
              <span className="relative inline-block px-4 py-1.5 bg-[#0a5a54] text-white font-black rounded-2xl shadow-sm transform -rotate-1 mx-1.5 whitespace-nowrap my-1">
                {t("home2_hero_title_highlight", "Your Team with")}
              </span>{" "}
              <span className="inline-block">{t("home2_hero_title_suffix", "Top Talent Discovery")}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg text-slate-700 dark:text-slate-300 font-medium max-w-2xl leading-relaxed mt-5 sm:mt-6">
              {t("home2_hero_subtitle", "Flourish in a thriving freelance ecosystem dedicated to excellence and limitless opportunities.")}
            </p>

          {/* Solid White Search Card Box with No Internal Borders & Custom Dropdown */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-3xl bg-white dark:bg-zinc-900 p-2 rounded-2xl border-none shadow-md flex flex-col sm:flex-row items-center gap-2 mt-2 relative z-20"
          >
            {/* Input with No Focus Outline */}
            <div className="flex items-center gap-3 px-4 py-3 flex-1 w-full text-left border-none outline-none">
              <input
                type="text"
                placeholder={t("home2_search_placeholder", "Search by keyword")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", boxShadow: "none" }}
                className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 p-0 m-0 w-full font-medium border-0 outline-0 focus:outline-none focus:ring-0 shadow-none"
              />
            </div>

            {/* Custom Filter Dropdown */}
            <div ref={dropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 transition cursor-pointer border-none outline-none focus:outline-none"
              >
                <span>{currentFilterLabel}</span>
                <FiChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Floating Dropdown Menu */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 animate-fadeIn text-left">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSearchFilter(opt.value as any);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition flex items-center justify-between cursor-pointer border-none ${
                        searchFilter === opt.value
                          ? "bg-primary-light text-primary"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {searchFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Search Button */}
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover active:scale-95 text-white font-extrabold text-xs px-7 py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none shrink-0"
            >
              <span>{t("home2_search_btn", "Search")}</span>
              <FiSearch className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Popular Categories Chips Row - Solid White */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">{t("home2_popular_label", "Popular categories")}:</span>
            {chipsList.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => router.push(`/gigs?query=${encodeURIComponent(chip)}`)}
                className="bg-white hover:bg-primary-light hover:text-primary dark:bg-zinc-900 text-slate-800 dark:text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border-none shadow-xs"
              >
                {chip}
              </button>
            ))}
          </div>

          </div>{/* end center col */}

        </div>
      </section>

      {/* TRUSTED COMPANIES INFINITE MARQUEE SCROLL SECTION */}
      <CompanyScrollSection />

      {/* BIG FEATURED HERO BANNER IMAGE SECTION */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-zinc-800 group">
          <img 
            src={t("home2_banner_image", "/home2_banner.png")} 
            alt="Freelance Talent Banner" 
            className="w-full h-[22rem] sm:h-[30rem] lg:h-[36rem] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/tablet-work.png";
            }}
          />
          {/* Subtle gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Floating Overlay Info & CTA */}
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 z-10 text-left">
            <div className="max-w-2xl">
              <span className="bg-primary text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3 inline-block shadow-md">
                {t("home2_banner_badge", "Verified Global Network")}
              </span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight font-display drop-shadow-md">
                {t("home2_banner_title", "Empowering Top Talent & Enterprise Teams Worldwide")}
              </h2>
            </div>
            <button
              onClick={() => router.push("/talent")}
              className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-xl transition-all cursor-pointer border-none shrink-0 flex items-center gap-2"
            >
              <span>{t("home2_banner_btn", "Explore Talent Directory")}</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES (HOME 2 CUSTOM DESIGN) */}
      <Home2Categories />

      {/* PROMO CARDS (POST PROJECT & WORK ON BEST PROJECT) */}
      <Home2PromoCards />

      {/* DYNAMIC PLATFORM FEATURES SHOWCASE (PICKING 7 RANDOM ITEMS FROM ADMIN POOL) */}
      <Home2FeaturesShowcase />

      {/* FEATURED FREELANCERS SPOTLIGHT */}
      <FeaturedFreelancers />

      {/* POPULAR SERVICES SECTION */}
      <PopularServices />

      {/* RECENT CLIENT PROJECTS */}
      <RecentProjects />



      {/* CTA & FOOTER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-zinc-950 dark:to-black border-t border-slate-200/60 dark:border-zinc-800 w-full mt-auto">
        <div className="relative z-10 w-full">
          <CTA />
          <Footer transparent={true} />
        </div>
      </div>
    </div>
  );
}
