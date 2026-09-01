"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import { API_URL } from "@/config/api";

interface Freelancer {
  user_id: number;
  name: string | null;
  email: string;
  professional_title: string | null;
  experience_level: string | null;
  hourly_rate: string | null;
  rating: number;
  profile_image: string | null;
  category_name: string | null;
  sub_category_name: string | null;
  skills: string[];
  slug?: string;
  is_featured?: boolean;
}

const FALLBACK_FREELANCERS: Freelancer[] = [
  {
    user_id: 101,
    name: "David Miller",
    email: "david@example.com",
    professional_title: "AI Engineer",
    experience_level: "Expert",
    hourly_rate: "120.00",
    rating: 5.0,
    profile_image: null,
    category_name: "Artificial Intelligence",
    sub_category_name: "Machine Learning",
    skills: ["Python", "TensorFlow", "PyTorch"],
    is_featured: true,
  },
  {
    user_id: 102,
    name: "Sarah Jenkins",
    email: "sarah@example.com",
    professional_title: "Senior UI Designer",
    experience_level: "Expert",
    hourly_rate: "85.00",
    rating: 4.9,
    profile_image: null,
    category_name: "Design & Creative",
    sub_category_name: "UI/UX Design",
    skills: ["Figma", "UI Design", "Prototyping"],
    is_featured: true,
  },
  {
    user_id: 103,
    name: "Alex Rivera",
    email: "alex@example.com",
    professional_title: "Full Stack Developer",
    experience_level: "Intermediate",
    hourly_rate: "95.00",
    rating: 4.8,
    profile_image: null,
    category_name: "Web Development",
    sub_category_name: "React & Node",
    skills: ["React", "Node.js", "TypeScript"],
    is_featured: false,
  },
];

const AVATAR_GRADIENTS = [
  "from-teal-500 to-emerald-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-[#0a5a54]",
  "from-[#0a5a54] to-teal-700",
];

const getInitials = (name: string) => {
  if (!name) return "FL";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function Home1Freelancers() {
  const { t, formatPrice } = useLanguage();
  const router = useRouter();

  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const res = await fetch(`${API_URL}/freelancers/public/list`);
        if (res.ok) {
          const data: Freelancer[] = await res.json();
          const normalized = data.map((f: any) => ({
            ...f,
            rating: typeof f.rating === "number" ? f.rating : parseFloat(f.rating) || 5.0,
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
          setFreelancers(sorted);
        }
      } catch (e) {
        console.error("Failed to load freelancers in Home1Freelancers:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  const displayList = freelancers.length > 0 ? freelancers.slice(0, 6) : FALLBACK_FREELANCERS;

  return (
    <section className="w-full bg-slate-50/50 dark:bg-[#09090b] py-16 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-200/60 dark:border-zinc-800/60">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-black text-[#0a5a54] dark:text-teal-400 uppercase tracking-widest block mb-2">
              {t("featured_label", "Top Talent")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight font-display">
              {t("featured_title", "Featured Freelancers")}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
              {t("featured_subtitle", "Top-rated professionals ready to start immediately.")}
            </p>
          </div>
          <Link
            href="/talent"
            className="inline-flex items-center gap-1.5 text-sm font-black text-[#0a5a54] dark:text-teal-400 hover:text-[#073f3a] transition-all duration-200 group shrink-0"
          >
            {t("featured_btn", "See all")}
            <FiArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-zinc-700 shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-zinc-700 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-200 dark:bg-zinc-700 rounded-xl w-full mt-4" />
                </div>
              ))
            : displayList.map((freelancer, index) => {
                const slugParam = freelancer.slug || freelancer.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "freelancer";
                const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
                const rating = freelancer.rating ? freelancer.rating.toFixed(1) : "5.0";
                const skills = freelancer.skills.slice(0, 3);
                const displaySkills = skills.length > 0 ? skills : freelancer.sub_category_name ? [freelancer.sub_category_name] : [];

                return (
                  <div
                    key={freelancer.user_id || index}
                    onClick={() => router.push(freelancer.user_id ? `/freelancer/${slugParam}` : "/talent")}
                    className="group bg-slate-50/60 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white dark:hover:bg-zinc-900 hover:border-[#0a5a54]/30 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Top Header: Avatar + Meta */}
                      <div className="flex items-center gap-4 mb-5">
                        {freelancer.profile_image && !failedImages[freelancer.user_id] ? (
                          <img
                            src={
                              freelancer.profile_image.startsWith("/") && !freelancer.profile_image.startsWith("/public")
                                ? `https://freelancer.sangvish.com${freelancer.profile_image}`
                                : freelancer.profile_image
                            }
                            alt={freelancer.name || "Freelancer"}
                            className="w-14 h-14 rounded-full object-cover border border-slate-100 dark:border-zinc-700 shrink-0"
                            onError={() => setFailedImages((prev) => ({ ...prev, [freelancer.user_id]: true }))}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center font-black text-white text-base shrink-0 shadow-sm border border-primary/20">
                            {getInitials(freelancer.name || freelancer.email || "FL")}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-900 dark:text-white text-lg sm:text-xl truncate">
                              {(() => {
                                const rawName = freelancer.name || freelancer.email || "Freelancer";
                                return rawName.length > 15 ? `${rawName.substring(0, 15)}...` : rawName;
                              })()}
                            </span>
                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {freelancer.professional_title || freelancer.category_name || "Freelancer"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <span className="text-[#0a5a54] dark:text-teal-400 font-extrabold flex items-center gap-0.5">
                              ★ {rating}
                            </span>
                            {freelancer.experience_level && (
                              <>
                                <span className="inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 shrink-0" />
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{freelancer.experience_level}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Skills Badges */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {displaySkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 rounded-full bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Footer: Rate on left + Hire Now CTA button on right */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {freelancer.hourly_rate ? `${formatPrice(freelancer.hourly_rate)}/hr` : t("request_quote", "Request Quote")}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(freelancer.user_id ? `/freelancer/${slugParam}?hire=true` : "/talent");
                        }}
                        className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl transition-all duration-200 active:scale-[0.97] hover:shadow-md cursor-pointer border-none"
                      >
                        {t("btn_hire_now", "Hire Now")}
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
