"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FiCode, 
  FiBriefcase, 
  FiTrendingUp, 
  FiEdit3, 
  FiCpu, 
  FiMusic, 
  FiGlobe
} from "react-icons/fi";

interface Category {
  category_id: number;
  category_name: string;
  description?: string;
  icon?: string;
}

export default function Home2Categories() {
  const { t } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories((Array.isArray(data) ? data : []).filter((c: any) =>
            c.status === undefined || c.status === null || c.status === true || c.status === 1 || String(c.status).toLowerCase() === "active" || String(c.status).toLowerCase() === "true"
          ));
        }
      } catch (e) {
        console.error("Failed to load categories:", e);
      }
    };
    fetchCategories();
  }, []);

  const cardData = [
    { title: "Programming & Tech", desc: "Software Developer, Data Analyst, Network Engineer", icon: FiCode },
    { title: "Admin + Project Management", desc: "Administrative Assistant, Project Manager, Process Analyst", icon: FiBriefcase },
    { title: "Digital Marketing + Sales", desc: "Email Marketer, SEO Specialist, Web Developer", icon: FiTrendingUp },
    { title: "Writing & Translation", desc: "Proofreader, Senior Editor, Creative Support", icon: FiEdit3 },
    { title: "AI Services", desc: "Machine Learning Engineer, AI Consultant, Data Scientist", icon: FiCpu },
    { title: "Music & Audio", desc: "Sound Engineer, Music Producer, Audio Editor", icon: FiMusic },
    { title: "Remote Work", desc: "Customer Service Representative, Financial Analyst", icon: FiGlobe },
  ];

  const displayItems = cardData.map((item, index) => {
    const fetchedCat = categories[index];
    return {
      name: fetchedCat ? fetchedCat.category_name : item.title,
      desc: item.desc,
      Icon: item.icon,
      href: fetchedCat ? `/gigs?category=${encodeURIComponent(fetchedCat.category_name)}` : `/gigs?query=${encodeURIComponent(item.title)}`
    };
  });

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none text-center">
      
      {/* Centered Title & Subtitle */}
      <div className="max-w-3xl mx-auto mb-14 flex flex-col gap-3">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          {t("home2_categories_title", "Trending Top Categories")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
          {t("home2_categories_subtitle", "At our core, we are experts in connecting local business with top-notch talent. We are passionate about helping you find the perfect match in key areas of expertise.")}
        </p>
      </div>

      {/* Grid of 8 Cards (7 Category Cards + 1 Special Highlight CTA Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {displayItems.map((item, idx) => {
          const IconComp = item.Icon;
          return (
            <a
              key={idx}
              href={item.href}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-8 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <IconComp className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </a>
          );
        })}

        {/* 8th Highlight Card: Explore Categories (Dynamic Primary Theme) */}
        <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 p-8 rounded-2xl shadow-xs flex flex-col items-center justify-center text-center gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {t("explore_categories_title", "Explore Categories")}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              {t("explore_categories_subtitle", "More categories with lots of talent available to explore here")}
            </p>
          </div>
          <button
            onClick={() => router.push("/categories")}
            className="mt-2 bg-primary hover:bg-primary-hover active:scale-95 text-white font-extrabold text-xs px-8 py-3 rounded-xl transition-all shadow-md cursor-pointer border-none"
          >
            {t("show_all_btn", "Show All")}
          </button>
        </div>

      </div>
    </section>
  );
}
