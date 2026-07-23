"use client";
import { API_URL } from "@/config/api";


import React, { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiStar } from "react-icons/fi";

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
}

const FALLBACK_FREELANCERS: Freelancer[] = [
  {
    user_id: 0,
    name: "Sarah J.",
    email: "",
    profile_image: null,
    professional_title: "Senior UI Designer",
    hourly_rate: "85",
    bio: null,
    experience_level: "Expert",
    category_name: "Design",
    sub_category_name: null,
    skills: ["Figma", "UX Research"],
  },
  {
    user_id: 0,
    name: "David M.",
    email: "",
    profile_image: null,
    professional_title: "AI Engineer",
    hourly_rate: "120",
    bio: null,
    experience_level: "Expert",
    category_name: "Technology",
    sub_category_name: null,
    skills: ["Python", "Machine Learning"],
  },
  {
    user_id: 0,
    name: "Alex R.",
    email: "",
    profile_image: null,
    professional_title: "Full Stack Developer",
    hourly_rate: "95",
    bio: null,
    experience_level: "Expert",
    category_name: "Technology",
    sub_category_name: null,
    skills: ["React", "Node.js"],
  },
];

export default function FeaturedFreelancers() {
  const { t } = useLanguage();
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
            if (typeof parsed === "string") {
              try { parsed = JSON.parse(parsed); } catch {}
            }
            if (parsed.site_short_name) {
              setSiteShortName(parsed.site_short_name);
            } else if (parsed.site_name) {
              setSiteShortName(parsed.site_name);
            }
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
          // Normalize skills — the API returns skill_name strings; handle both array forms
          const normalized = data.map((f) => ({
            ...f,
            skills: Array.isArray(f.skills)
              ? f.skills.map((s: any) => (typeof s === "string" ? s : s.skill_name)).filter(Boolean)
              : [],
          }));
          // Show is_featured first, then top by completeness (those with rate and title first)
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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!loading && freelancers.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white border-t border-slate-200/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {t("featured_title", "Featured Freelancers")}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2 font-medium">
              {t("featured_subtitle", "Top-rated professionals ready to start immediately.")}
            </p>
          </div>
          <Link
            href="/talent"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:opacity-80 transition-all duration-200 group shrink-0"
          >
            {t("featured_btn", "See all")}
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {loading ? (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-6 flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-200 rounded-full w-16" />
                  <div className="h-6 bg-slate-200 rounded-full w-20" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                  <div className="h-5 bg-slate-200 rounded w-16" />
                  <div className="h-8 bg-slate-200 rounded-xl w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))" }}
          >
            {freelancers.map((freelancer, index) => {
              const slugParam = freelancer.slug || freelancer.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

              const handleCardClick = (e: React.MouseEvent) => {
                if ((e.target as HTMLElement).closest("button, a")) return;
                if (freelancer.user_id) {
                  router.push(`/freelancer/${slugParam}`);
                } else {
                  router.push("/talent");
                }
              };

              return (
                <div
                  key={freelancer.user_id || index}
                  onClick={handleCardClick}
                  className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:border-primary/30 hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-5">
                      {freelancer.profile_image && !failedImages[freelancer.user_id] ? (
                        <img
                          src={freelancer.profile_image.startsWith("/") && !freelancer.profile_image.startsWith("/public") ? `https://freelancer.sangvish.com${freelancer.profile_image}` : freelancer.profile_image}
                          alt={freelancer.name || "Freelancer"}
                          className="w-14 h-14 rounded-full object-cover border border-slate-100 shrink-0"
                          onError={() => {
                            setFailedImages((prev) => ({ ...prev, [freelancer.user_id]: true }));
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-lg text-primary border border-primary/10 shrink-0">
                          {getInitials(freelancer.name || freelancer.email || "Freelancer")}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-base truncate">
                            {freelancer.name || freelancer.email || "Freelancer"}
                          </span>
                          {freelancer.is_featured && (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0 flex items-center gap-1">
                              <FiStar className="w-2.5 h-2.5 fill-white text-white shrink-0" />
                              <span>{siteShortName}'s Choice</span>
                            </span>
                          )}
                          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                          {freelancer.professional_title || freelancer.category_name || "Freelancer"}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          <span className="text-primary font-bold">★ {freelancer.rating ? freelancer.rating.toFixed(1) : "5.0"}</span>
                          {freelancer.experience_level && (
                            <span className="text-slate-400 font-medium">• {freelancer.experience_level}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skills/Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {freelancer.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills.length === 0 && freelancer.sub_category_name && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                          {freelancer.sub_category_name}
                        </span>
                      )}
                      {freelancer.skills.length === 0 && !freelancer.sub_category_name && (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold italic">
                          {t("skills_not_listed", "Skills not listed")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Price & Hire CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">
                        {freelancer.hourly_rate ? t("hourly_rate", "Hourly Rate") : t("rate", "Rate")}
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {freelancer.hourly_rate
                          ? `$${parseFloat(freelancer.hourly_rate).toLocaleString()}/hr`
                          : t("request_quote", "Request Quote")}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                        if (!token) {
                          router.push("/login");
                        } else if (freelancer.user_id) {
                          router.push(`/freelancer/${slugParam}?hire=true`);
                        } else {
                          router.push("/talent");
                        }
                      }}
                      className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] hover:shadow-lg cursor-pointer border-none"
                    >
                      {t("btn_hire_now", "Hire Now")}
                    </button>
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
