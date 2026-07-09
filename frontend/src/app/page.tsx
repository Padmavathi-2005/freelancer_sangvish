"use client";

import React from "react";
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
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
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

