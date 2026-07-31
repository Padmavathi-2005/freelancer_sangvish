"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthModal } from "@/context/AuthModalContext";

export default function CTA() {
  const { t } = useLanguage();
  const { openLoginModal } = useAuthModal();

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        window.location.href = "/dashboard";
        return;
      }
    }
    openLoginModal("/dashboard");
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 text-center">
      <div className="bg-[#1b2337] rounded-[28px] sm:rounded-[36px] p-8 sm:p-14 lg:p-16 border border-slate-800/90 shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-center">
        
        {/* Decorative Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.16] mb-5 font-display">
            {t("cta_title", "Ready to Hire the Right Freelancer?")}
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal mb-10 font-sans">
            {t("cta_subtitle", "Join thousands of businesses who trust Freelancer to deliver exceptional results on time, every time.")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 select-none">
            <a
              href="/dashboard"
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-950/40 active:scale-[0.98] cursor-pointer text-center no-underline border-none"
            >
              {t("cta_btn_primary", "Get Started Now")}
            </a>
            
            <a
              href="/pricing"
              className="w-full sm:w-auto bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-sm text-center no-underline"
            >
              {t("cta_btn_secondary", "View Plans")}
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
