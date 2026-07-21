import React from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function CTA() {
  const { t } = useLanguage();

  return (
    <section className="w-full pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-900 tracking-tight leading-tight mb-5 font-display">
          {t("cta_title", "Ready to Hire the Right Freelancer?")}
        </h2>
        
        <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium mb-10 font-sans">
          {t("cta_subtitle", "Join thousands of businesses who trust Freelancer to deliver exceptional results on time, every time.")}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 select-none">
          <a
            href="/register"
            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98] cursor-pointer text-center no-underline"
          >
            {t("cta_btn_primary", "Get Started Now")}
          </a>
          
          <a
            href="/#pricing"
            className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-sm text-center no-underline"
          >
            {t("cta_btn_secondary", "Talk to Sales")}
          </a>
        </div>
      </div>
    </section>
  );
}

