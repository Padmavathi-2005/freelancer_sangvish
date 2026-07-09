"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface StepItem {
  step_id: number;
  key_suffix: string;
  sort_order: number;
}

export default function HowItWorks() {
  const { t } = useLanguage();
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const res = await fetch(`${API_URL}/how-it-works-steps`);
        if (res.ok) setSteps(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSteps();
  }, []);

  const stats = [
    {
      value: t("stats_val_1", "25K+"),
      label: t("stats_label_1", "Freelancers"),
    },
    {
      value: t("stats_val_2", "100K+"),
      label: t("stats_label_2", "Jobs Completed"),
    },
    {
      value: t("stats_val_3", "₹50Cr+"),
      label: t("stats_label_3", "Paid to Talent"),
    },
    {
      value: t("stats_val_4", "4.9/5"),
      label: t("stats_label_4", "Average Rating"),
    },
  ];

  if (loading) {
    return (
      <div className="w-full">
        <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* How It Works Timeline Section */}
      {steps.length > 0 && (
        <section className="w-full bg-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-[1600px] mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-16">
              {t("how_it_works_title", "How It Works")}
            </h2>

            {/* Timeline Wrapper */}
            <div className="relative max-w-5xl mx-auto">
              {/* Desktop Horizontal Line */}
              <div className="absolute top-[22px] left-[5%] right-[5%] h-[2px] bg-slate-200/80 z-0 hidden lg:block" />

              {/* Mobile Vertical Line */}
              <div className="absolute left-[22px] top-6 bottom-6 w-[2px] bg-slate-200/80 z-0 lg:hidden" />

              {/* Steps Container */}
              <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-4 relative z-10">
                {steps.map((step, index) => {
                  const titleKey = `how_it_works_step${step.key_suffix}_title`;
                  const descKey = `how_it_works_step${step.key_suffix}_desc`;

                  const title = t(titleKey, "");
                  const description = t(descKey, "");

                  if (!title) return null;

                  return (
                    <div 
                      key={step.step_id} 
                      className="flex lg:flex-col items-start lg:items-center text-left lg:text-center gap-4 lg:gap-5 lg:flex-1 group animate-fadeIn"
                    >
                      {/* Step Number Circle */}
                      <div className="w-11 h-11 rounded-full bg-[#0a5a54] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-[#0a5a54]/10 shrink-0 transition-transform duration-300 group-hover:scale-110">
                        {index + 1}
                      </div>

                      {/* Step Details */}
                      <div className="min-w-0 lg:pt-1">
                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed max-w-[200px]">
                          {description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dark Green Stats Bar Section */}
      <section className="w-full bg-[#063c38] text-white py-14 px-4 sm:px-6 lg:px-8 border-t border-emerald-950/20">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 items-center text-center">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col gap-2.5">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#22c55e] tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.18em] uppercase text-emerald-100/60 leading-none">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
