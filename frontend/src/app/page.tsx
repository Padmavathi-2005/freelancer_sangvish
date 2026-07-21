"use client";

import React, { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FeaturedFreelancers from "@/components/FeaturedFreelancers";
import PopularServices from "@/components/PopularServices";
import RecentProjects from "@/components/RecentProjects";
import Pricing from "@/components/Pricing";
import WhyChoose from "@/components/WhyChoose";
import HowItWorks from "@/components/HowItWorks";
import SuccessStories from "@/components/SuccessStories";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api`
          : "https://freelancer.sangvish.com/api";
        const res = await fetch(`${API_URL}/seo?route=/`);
        if (res.ok) {
          const seo = await res.json();
          if (seo.meta_title) document.title = seo.meta_title;
          
          let descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) {
            descMeta.setAttribute("content", seo.meta_description || "");
          } else {
            descMeta = document.createElement("meta");
            descMeta.setAttribute("name", "description");
            descMeta.setAttribute("content", seo.meta_description || "");
            document.head.appendChild(descMeta);
          }
          
          let kwMeta = document.querySelector('meta[name="keywords"]');
          if (kwMeta) {
            kwMeta.setAttribute("content", seo.meta_keywords || "");
          } else {
            kwMeta = document.createElement("meta");
            kwMeta.setAttribute("name", "keywords");
            kwMeta.setAttribute("content", seo.meta_keywords || "");
            document.head.appendChild(kwMeta);
          }
        }
      } catch (err) {
        console.error("Failed to load page SEO dynamic metadata:", err);
      }
    };
    fetchSEO();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-50 font-sans w-full max-w-full relative">
      <Header />
      <Hero />
      <Categories />
      <FeaturedFreelancers />
      <PopularServices />
      <RecentProjects />
      <Pricing />
      <WhyChoose />
      <HowItWorks />
      <SuccessStories />
      <FAQ />
      
      {/* Merged Background Container for CTA and Footer */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 border-t border-slate-200/60 w-full mt-auto">
        {/* Subtle decorative blurs */}
        <div className="absolute top-[-20%] left-[-15%] w-[45rem] h-[45rem] bg-teal-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 w-full">
          <CTA />
          <Footer transparent={true} />
        </div>
      </div>
    </div>
  );
}

