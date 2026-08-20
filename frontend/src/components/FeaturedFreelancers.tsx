"use client";
import { API_URL } from "@/config/api";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiStar, FiArrowRight, FiMapPin } from "react-icons/fi";

interface Freelancer {
  user_id: number;
  name: string;
  email: string;
  profile_image: string | null;
  professional_title: string | null;
  hourly_rate: string | null;
  bio: string | null;
  experience_level: string | null;
  category_name: string | null;
  sub_category_name: string | null;
  skills: string[];
  slug?: string;
  is_featured?: boolean;
  rating?: number;
  completed_jobs?: number;
  country?: string;
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-violet-600",
  "from-teal-500 to-cyan-600",
  "from-fuchsia-500 to-pink-600",
];

const FALLBACK_FREELANCERS: Freelancer[] = [
  { user_id: 0, name: "Sarah J.", email: "", profile_image: null, professional_title: "Senior UI Designer", hourly_rate: "85", bio: null, experience_level: "Expert", category_name: "Design", sub_category_name: null, skills: ["Figma", "UX Research", "Prototyping"] },
  { user_id: 0, name: "David M.", email: "", profile_image: null, professional_title: "AI Engineer", hourly_rate: "120", bio: null, experience_level: "Expert", category_name: "Technology", sub_category_name: null, skills: ["Python", "Machine Learning", "TensorFlow"] },
  { user_id: 0, name: "Alex R.", email: "", profile_image: null, professional_title: "Full Stack Developer", hourly_rate: "95", bio: null, experience_level: "Expert", category_name: "Technology", sub_category_name: null, skills: ["React", "Node.js", "PostgreSQL"] },
];

export default function FeaturedFreelancers() {
  const { t, formatPrice } = useLanguage();
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [siteShortName, setSiteShortName] = useState("Lancer");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const siteRaw = data.find((s: any) => s.setting_key === "site_settings")?.setting_value;
          if (siteRaw) {
            let parsed = siteRaw;
            if (typeof parsed === "string") { try { parsed = JSON.parse(parsed); } catch {} }
            if (parsed.site_short_name) setSiteShortName(parsed.site_short_name);
            else if (parsed.site_name) setSiteShortName(parsed.site_name);
          }
        }
      } catch (e) {
        console.error("Failed to load settings in featured freelancers:", e);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const res = await fetch(`${API_URL}/freelancers/public/list`);
        if (res.ok) {
          const data: Freelancer[] = await res.json();
          const normalized = data.map((f) => ({
            ...f,
            skills: Array.isArray(f.skills)
              ? f.skills.map((s: any) => (typeof s === "string" ? s : s.skill_name)).filter(Boolean)
              : [],
          }));
          const sorted = normalized.sort((a: any, b: any) => {
            if (a.is_featured && !b.is_featured) return -1;
            if (!a.is_featured && b.is_featured) return 1;
            const scoreA = (a.hourly_rate ? 1 : 0) + (a.professional_title ? 1 : 0) + (a.skills.length > 0 ? 1 : 0);
            const scoreB = (b.hourly_rate ? 1 : 0) + (b.professional_title ? 1 : 0) + (b.skills.length > 0 ? 1 : 0);
            return scoreB - scoreA;
          });
          setFreelancers(sorted.slice(0, 8));
        } else {
          setFreelancers([]);
        }
      } catch {
        setFreelancers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!loading && freelancers.length === 0) return null;

  const displayList = loading ? [] : freelancers;

  return (
    <section className="w-full bg-slate-50/60 dark:bg-zinc-950 border-t border-slate-200/50 dark:border-zinc-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-black text-primary uppercase tracking-widest block mb-2">
              {t("featured_label", "Top Talent")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight font-display">
              {t("featured_title", "Featured Freelancers")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {t("featured_subtitle", "Top-rated professionals ready to start immediately.")}
            </p>
          </div>
          <Link
            href="/talent"
            className="inline-flex items-center gap-1.5 text-sm font-black text-primary hover:text-primary-hover transition-all duration-200 group shrink-0"
          >
            {t("featured_btn", "See all")}
            <FiArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))" }}>
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-zinc-700 shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-1/2" />
                    </div>
                    <div className="h-8 bg-slate-200 dark:bg-zinc-700 rounded-xl w-16 shrink-0" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded-full w-16" />
                    <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded-full w-20" />
                  </div>
                  <div className="h-9 bg-slate-200 dark:bg-zinc-700 rounded-xl w-full" />
                </div>
              ))
            : displayList.map((freelancer, index) => {
                const slugParam = freelancer.slug || freelancer.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
                const rating = freelancer.rating ? freelancer.rating.toFixed(1) : "5.0";
                const skills = freelancer.skills.slice(0, 3);
                const hasSkills = skills.length > 0;
                const displaySkills = hasSkills ? skills : freelancer.sub_category_name ? [freelancer.sub_category_name] : [];

                const handleCardClick = (e: React.MouseEvent) => {
                  if ((e.target as HTMLElement).closest("button, a")) return;
                  router.push(freelancer.user_id ? `/freelancer/${slugParam}` : "/talent");
                };

                return (
                  <div
                    key={freelancer.user_id || index}
                    onClick={handleCardClick}
                    className="group relative bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-zinc-900/80 hover:-translate-y-1 hover:border-primary/30 dark:hover:border-primary/40 overflow-hidden"
                  >
                    {/* Subtle gradient top accent on hover */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Top Row: Avatar + Name + Rate badge */}
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="shrink-0 relative">
                        {freelancer.profile_image && !failedImages[freelancer.user_id] ? (
                          <img
                            src={
                              freelancer.profile_image.startsWith("/") && !freelancer.profile_image.startsWith("/public")
                                ? `https://freelancer.sangvish.com${freelancer.profile_image}`
                                : freelancer.profile_image
                            }
                            alt={freelancer.name || "Freelancer"}
                            className="w-13 h-13 w-[52px] h-[52px] rounded-xl object-cover border border-slate-100 dark:border-zinc-700"
                            onError={() => setFailedImages((prev) => ({ ...prev, [freelancer.user_id]: true }))}
                          />
                        ) : (
                          <div className="w-[52px] h-[52px] rounded-xl bg-[#0a5a54] dark:bg-teal-750 flex items-center justify-center font-black text-white text-base select-none shadow-sm border border-teal-600/20">
                            {getInitials(freelancer.name || freelancer.email || "FL")}
                          </div>
                        )}
                        {/* Online indicator */}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-zinc-900 rounded-full" />
                      </div>

                      {/* Name + Title + Rating */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white text-lg sm:text-xl truncate">
                            {freelancer.name || freelancer.email || "Freelancer"}
                          </span>
                          {/* Verified */}
                          <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {freelancer.is_featured && (
                            <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wide shrink-0 flex items-center gap-0.5">
                              <FiStar className="w-2 h-2 fill-white" />
                              {siteShortName}'s Pick
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                          {freelancer.professional_title || freelancer.category_name || "Freelancer"}
                        </p>
                        {/* Rating + Level */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-amber-500 text-xs font-black flex items-center gap-0.5">
                            ★ {rating}
                          </span>
                          {freelancer.experience_level && (
                            <>
                              <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{freelancer.experience_level}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Rate Badge */}
                      <div className="shrink-0 text-right">
                        {freelancer.hourly_rate ? (
                          <div className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-center">
                            <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wide leading-none mb-0.5">/hr</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                              {formatPrice(parseFloat(freelancer.hourly_rate))}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Quote</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {displaySkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {displaySkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold border border-slate-200/60 dark:border-zinc-700/60"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Row: Dynamic Category + Hire CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-auto">
                      {freelancer.category_name || freelancer.sub_category_name ? (
                        <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 truncate max-w-[170px] select-none">
                          {freelancer.category_name || freelancer.sub_category_name}
                        </span>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                          if (!token) router.push("/login");
                          else if (freelancer.user_id) router.push(`/freelancer/${slugParam}?hire=true`);
                          else router.push("/talent");
                        }}
                        className="flex items-center justify-center gap-1.5 bg-[#0a5a54] hover:bg-[#07433e] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all duration-200 active:scale-[0.97] hover:shadow-md cursor-pointer border-none group/btn shrink-0"
                      >
                        {t("btn_hire_now", "Hire Now")}
                        <FiArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
