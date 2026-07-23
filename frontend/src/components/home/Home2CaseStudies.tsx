"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FiArrowUpRight,
  FiBriefcase,
  FiDollarSign,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiTag
} from "react-icons/fi";

interface ProjectCardItem {
  id: number | string;
  category: string;
  title: string;
  description: string;
  budget?: string;
  type?: string;
  location?: string;
  image?: string;
  href: string;
  skills?: string[];
}

export default function Home2CaseStudies() {
  const { t } = useLanguage();
  const [projectsList, setProjectsList] = useState<ProjectCardItem[]>([]);

  // Realistic marketplace project cards
  const defaultProjects: ProjectCardItem[] = [
    {
      id: 1,
      category: "LEGAL SERVICES",
      title: "Legal Advice for Property Lease Agreements (Spain)",
      description: "Need a Spanish real estate legal consultant to review our multi-year tenancy lease contract template and ensure compliance with local laws.",
      budget: "$1,500 - Fixed Price",
      type: "Fixed",
      location: "Spain (Remote)",
      href: "/projects",
      skills: ["Real Estate Law", "Contract Review", "Spanish Legal"]
    },
    {
      id: 2,
      category: "MOBILE APP DEVELOPMENT",
      title: "Beta Testing & Bug Reporting for Mobile App",
      description: "Looking for QA beta testers to test our mobile iOS/Android app, submit detailed bug reports, and verify UX workflow performance.",
      budget: "$800 - Milestone",
      type: "Milestone",
      location: "Remote",
      href: "/projects",
      skills: ["QA Testing", "iOS / Android", "Bug Tracking"]
    },
    {
      id: 3,
      category: "SOFTWARE ENGINEERING",
      title: "Senior Full-Stack Engineer for API Integration",
      description: "We are looking for a senior software engineer to join our team on an hourly basis to build new API endpoints and optimize database queries.",
      budget: "$45/hr - Hourly",
      type: "Hourly",
      location: "United States (Remote)",
      href: "/projects",
      skills: ["React", "Node.js", "PostgreSQL"]
    },
    {
      id: 4,
      category: "ENTERPRISE SOLUTIONS",
      title: "Workplace Culture & Employer Brand Strategy",
      description: "Discover top brand strategies to boost your employer branding, improve talent retention, and optimize recruitment workflows.",
      budget: "$2,500 - Fixed Price",
      type: "Fixed",
      location: "Global Remote",
      href: "/projects",
      skills: ["HR Strategy", "Talent Acquisition", "Employer Branding"]
    },
    {
      id: 5,
      category: "DIGITAL MARKETING",
      title: "SEO & Growth Marketing for E-Commerce Platform",
      description: "Seeking an experienced SEO specialist to perform comprehensive technical audit, keyword strategy, and backlink optimization.",
      budget: "$1,200 - Monthly",
      type: "Retainer",
      location: "Remote",
      href: "/projects",
      skills: ["SEO Audit", "Content Strategy", "E-Commerce"]
    },
    {
      id: 6,
      category: "AI & MACHINE LEARNING",
      title: "Custom AI Chatbot Integration for Customer Support",
      description: "Develop and deploy an AI chatbot trained on internal documentation to handle tier-1 customer support queries automatically.",
      budget: "$3,000 - Milestone",
      type: "Milestone",
      location: "Remote",
      href: "/projects",
      skills: ["Python", "OpenAI API", "LangChain"]
    }
  ];

  useEffect(() => {
    const fetchRealProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/public`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: ProjectCardItem[] = data.slice(0, 6).map((item: any, idx: number) => {
              const defaultFallback = defaultProjects[idx % defaultProjects.length];
              return {
                id: item.job_id || item.id || idx,
                category: (item.category_name || defaultFallback.category).toUpperCase(),
                title: item.title || defaultFallback.title,
                description: item.description 
                  ? item.description.replace(/<[^>]*>?/gm, "").substring(0, 140) + "..." 
                  : defaultFallback.description,
                budget: item.budget 
                  ? `$${item.budget} - ${item.project_type || "Fixed"}` 
                  : (item.min_budget ? `$${item.min_budget} - $${item.max_budget}` : defaultFallback.budget),
                type: item.project_type || "Fixed",
                location: item.location || "Remote",
                image: item.attachment_url || item.cover_image || null,
                href: item.slug ? `/projects/${item.slug}` : `/projects`,
                skills: Array.isArray(item.skills) && item.skills.length > 0 
                  ? item.skills.map((s: any) => typeof s === "object" ? s.skill_name : s).slice(0, 3) 
                  : defaultFallback.skills
              };
            });
            setProjectsList(mapped);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load real DB projects:", err);
      }
      setProjectsList(defaultProjects);
    };

    fetchRealProjects();
  }, []);

  const items = projectsList.length > 0 ? projectsList : defaultProjects;

  // Distribute into 3 clean masonry columns
  const col1 = [items[0], items[3]].filter(Boolean);
  const col2 = [items[1], items[4]].filter(Boolean);
  const col3 = [items[2], items[5]].filter(Boolean);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full select-none text-center">
      
      {/* Header Section */}
      <div className="max-w-3xl mx-auto mb-14 flex flex-col gap-3">
        <span className="text-xs font-black text-primary uppercase tracking-widest block">
          {t("home2_cs_badge", "Featured Opportunities")}
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
          {t("home2_cs_title", "Discover High-Impact Projects & Opportunities")}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
          {t("home2_cs_subtitle", "Connect with verified clients and explore top projects designed for skilled professionals across every domain.")}
        </p>
      </div>

      {/* 3-Column Bento Grid Layout with Clean Real Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
        {/* Column 1 */}
        <div className="flex flex-col gap-6">
          {col1.map((item) => (
            <Link
              key={item.id} 
              href={item.href}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-7 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3.5 group cursor-pointer relative"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-black text-primary uppercase tracking-wider block">
                  {item.category}
                </span>
                <FiArrowUpRight className="w-4.5 h-4.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {item.description}
              </p>

              {item.image ? (
                <div className="mt-1 rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : null}

              {/* Skills & Budget Info */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                {item.skills && item.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.skills.map((sk, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg ml-auto">
                  {item.budget}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-6">
          {col2.map((item) => (
            <Link
              key={item.id} 
              href={item.href}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-7 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3.5 group cursor-pointer relative"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-black text-primary uppercase tracking-wider block">
                  {item.category}
                </span>
                <FiArrowUpRight className="w-4.5 h-4.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {item.description}
              </p>

              {item.image ? (
                <div className="mt-1 rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : null}

              {/* Skills & Budget Info */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                {item.skills && item.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.skills.map((sk, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg ml-auto">
                  {item.budget}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-6">
          {col3.map((item) => (
            <Link
              key={item.id} 
              href={item.href}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-7 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3.5 group cursor-pointer relative"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-black text-primary uppercase tracking-wider block">
                  {item.category}
                </span>
                <FiArrowUpRight className="w-4.5 h-4.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {item.description}
              </p>

              {item.image ? (
                <div className="mt-1 rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-44 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : null}

              {/* Skills & Budget Info */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                {item.skills && item.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.skills.map((sk, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {sk}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg ml-auto">
                  {item.budget}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
