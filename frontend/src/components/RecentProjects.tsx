"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { convertPrice } from "@/utils/currencyHelper";
import { FiBriefcase, FiClock, FiMapPin, FiGrid, FiArrowRight } from "react-icons/fi";

export default function RecentProjects() {
  const { t, currency } = useLanguage();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/jobs/public`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch landing page projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const dummyProjects = [
    {
      job_id: 1001,
      title: "Enterprise SaaS React Dashboard & GraphQL Integration",
      description: "Looking for an expert Next.js and GraphQL engineer to refactor our dashboard, optimize render cycles, and connect to a schema-first backend.",
      category_name: "Web Development",
      project_type: "Fixed",
      experience_level: "Expert",
      min_budget: 3000,
      max_budget: 5000,
      budget: 5000,
      location: "Remote",
      duration: "1-3 months",
      company_name: "Acme SaaS Solutions",
      created_at: new Date().toISOString(),
    },
    {
      job_id: 1002,
      title: "Brand Identity, Typography System & Figma Landing Page Design",
      description: "Need a professional UI/UX designer to craft a high-converting homepage design in Figma, along with a complete branding guide and component library.",
      category_name: "UI/UX Design",
      project_type: "Fixed",
      experience_level: "Intermediate",
      min_budget: 1200,
      max_budget: 2000,
      budget: 2000,
      location: "Remote",
      duration: "Less than 1 month",
      company_name: "Apex Studio Ltd",
      created_at: new Date().toISOString(),
    },
    {
      job_id: 1003,
      title: "Python Data Pipeline for AI Chatbot Analytics Platform",
      description: "We are seeking a senior Python developer to build robust data ingestion pipelines from multiple APIs, clean raw inputs, and store telemetry in Postgres.",
      category_name: "AI & Data Science",
      project_type: "Hourly",
      experience_level: "Expert",
      min_budget: 45,
      max_budget: 75,
      budget: 75,
      location: "Remote",
      duration: "3-6 months",
      company_name: "Helix AI Analytics",
      created_at: new Date().toISOString(),
    },
    {
      job_id: 1004,
      title: "Mobile App Development for E-Commerce Marketplace",
      description: "Looking for a React Native developer to build a cross-platform mobile app with payment integration, push notifications, and real-time inventory updates.",
      category_name: "Mobile Development",
      project_type: "Fixed",
      experience_level: "Intermediate",
      min_budget: 4000,
      max_budget: 8000,
      budget: 8000,
      location: "Remote",
      duration: "3-6 months",
      company_name: "ShopEase Inc",
      created_at: new Date().toISOString(),
    },
  ];

  const activeProjectsList = projects.slice(0, 6);

  if (!loading && activeProjectsList.length === 0) {
    return null;
  }

  const skeletonCount = 4;

  return (
    <section className="w-full bg-white border-t border-slate-200/50 py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div>
            <span className="text-[10px] font-black text-teal-700 tracking-widest uppercase block mb-1">
              Active Marketplace Needs
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {t("recent_projects_title", "Latest Projects")}
            </h2>
          </div>
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-xs font-black text-teal-700 hover:text-teal-800 transition-colors bg-teal-50 border border-teal-150 px-4 py-2.5 rounded-xl shadow-sm cursor-pointer group"
          >
            <FiGrid className="w-3.5 h-3.5 shrink-0" />
            <span>Browse All</span>
            <FiArrowRight className="w-3 h-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* 
          Grid: fixed card min-width of ~280px, auto-fill fills as many as fit.
          On user's screen (≈1280px): 4 columns.
          On larger screens: 5, 6... auto — cards never get bigger.
        */}
        {loading ? (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
          >
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="border border-slate-200/60 rounded-3xl p-5 flex flex-col gap-3 animate-pulse bg-slate-50">
                <div className="flex justify-between gap-2">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-4 bg-slate-200 rounded w-12" />
                </div>
                <div className="h-4 bg-slate-200 rounded w-4/5" />
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="border-t border-slate-100 pt-3 mt-2 flex justify-between">
                  <div className="h-4 bg-slate-200 rounded w-20" />
                  <div className="h-4 bg-slate-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
          >
            {activeProjectsList.map((job) => {
              const convMin = convertPrice(job.min_budget || 0, currency);
              const convMax = convertPrice(job.max_budget || 0, currency);
              const convBudget = convertPrice(job.budget || 0, currency);

              const displayBudget =
                job.min_budget && job.max_budget
                  ? `${convMin.symbol}${convMin.amount.toLocaleString()} – ${convMax.symbol}${convMax.amount.toLocaleString()}`
                  : `${convBudget.symbol}${convBudget.amount.toLocaleString()}`;

              const typeColor =
                job.project_type === "Hourly"
                  ? "bg-violet-50 text-violet-700 border-violet-100"
                  : "bg-sky-50 text-sky-700 border-sky-100";

              return (
                <div
                  key={job.job_id}
                  onClick={() => router.push(`/projects?query=${encodeURIComponent(job.title)}`)}
                  className="group border border-slate-200/60 rounded-3xl p-5 transition-all duration-300 hover:scale-[1.015] hover:border-teal-500/25 hover:shadow-xl hover:shadow-slate-200/60 cursor-pointer bg-slate-50/50 hover:bg-white flex flex-col justify-between gap-4"
                >
                  {/* Top */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider leading-5">
                        {job.category_name || "Development"}
                      </span>
                      <span className={`text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase leading-5 ${typeColor}`}>
                        {job.project_type || "Fixed"}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-teal-800 transition-colors">
                      {job.title}
                    </h3>

                    <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed font-medium">
                      {job.description}
                    </p>
                  </div>

                  {/* Bottom */}
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Budget</span>
                      <span className="text-slate-900 text-sm font-extrabold">
                        {displayBudget}
                        {job.project_type === "Hourly" ? <span className="text-xs font-bold text-slate-500">/hr</span> : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
                      {job.duration && (
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3 shrink-0 text-slate-350" />
                          <span>{job.duration}</span>
                        </div>
                      )}
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 shrink-0 text-slate-350" />
                          <span>{job.location}</span>
                        </div>
                      )}
                    </div>

                    {job.company_name && (
                      <div className="text-[10px] font-semibold text-slate-400/90 italic border-t border-slate-100/50 pt-2 flex items-center gap-1 mt-1">
                        <FiBriefcase className="w-3 h-3 shrink-0" />
                        <span className="truncate">Posted by {job.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
