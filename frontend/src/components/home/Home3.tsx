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

import Home3Hero from "@/components/home/Home3Hero";
import CompanyScrollSection from "@/components/home/CompanyScrollSection";
import GlobalTrustSection from "@/components/home/GlobalTrustSection";

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
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans w-full max-w-full relative">
      <Header />

      {/* HERO SECTION 3 - BANNER CAROUSEL */}
      <Home3Hero />

      {/* TRUSTED COMPANIES MARQUEE TICKER (SAME AS HOME 1) */}
      <CompanyScrollSection />

      {/* GLOBAL TRUST OF 1 MILLION BUSINESSES SECTION */}
      <GlobalTrustSection />

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
