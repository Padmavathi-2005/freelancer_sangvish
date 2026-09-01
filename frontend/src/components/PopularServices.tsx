"use client";
import { API_URL, API_BASE_URL } from "@/config/api";

const resolveMediaUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  let cleaned = url;
  if (cleaned.includes("localhost:5000")) {
    cleaned = cleaned.replace(/https?:\/\/localhost:5000/, API_BASE_URL);
  }
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
};


import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { convertPrice } from "@/utils/currencyHelper";
import { FiStar, FiHeart, FiClock, FiGrid, FiArrowRight } from "react-icons/fi";

export default function PopularServices() {
  const { t } = useLanguage();
  const router = useRouter();

  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/freelancer/client/gigs`);
        if (res.ok) {
          const data = await res.json();
          // Sort by a simple popularity score
          const scored = data.map((gig: any) => {
            const views = parseInt(gig.views || 0);
            const wishlist = parseInt(gig.wishlist_count || 0);
            const reviewsCount = parseInt(gig.reviews_count || 0);
            const rating = parseFloat(gig.reviews_avg_rating || 5.0);
            return { ...gig, score: views + wishlist * 3 + reviewsCount * 5 + rating * 10 };
          });
          scored.sort((a: any, b: any) => b.score - a.score);
          setGigs(scored);
        }
      } catch (err) {
        console.error("Failed to fetch landing page popular gigs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  const dummyGigs = [
    {
      gig_id: 1,
      title: "Complete Modern React & Next.js Website Development",
      category_name: "Web Development",
      views: 120, wishlist_count: 32, reviews_count: 24, reviews_avg_rating: 4.9,
      price: 199, delivery_days: 3, images: [],
    },
    {
      gig_id: 2,
      title: "Premium UI/UX Design for Mobile App and Web Platforms",
      category_name: "UI/UX Design",
      views: 95, wishlist_count: 18, reviews_count: 15, reviews_avg_rating: 4.8,
      price: 149, delivery_days: 5, images: [],
    },
    {
      gig_id: 3,
      title: "Custom AI Automation Workflow Integration & API Setup",
      category_name: "AI Automation",
      views: 145, wishlist_count: 45, reviews_count: 37, reviews_avg_rating: 5.0,
      price: 299, delivery_days: 7, images: [],
    },
    {
      gig_id: 4,
      title: "SEO Content Writing & Blog Strategy for Tech Startups",
      category_name: "Content Writing",
      views: 80, wishlist_count: 12, reviews_count: 19, reviews_avg_rating: 4.7,
      price: 79, delivery_days: 2, images: [],
    },
  ];

  const activeGigsList = gigs.slice(0, 8);

  if (!loading && activeGigsList.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[#f8fafc] border-t border-slate-200/50 py-16 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8">

        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div>
            <span className="text-[10px] font-black text-primary tracking-widest uppercase block mb-1">
              {t("top_ranked_services", "Top Ranked Services")}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {t("popular_services_title", "Popular Services")}
            </h2>
          </div>
          <button
            onClick={() => router.push("/gigs")}
            className="flex items-center gap-1.5 text-xs font-black text-primary hover:opacity-80 transition-colors bg-primary-light border border-primary/20 px-4 py-2.5 rounded-xl shadow-sm cursor-pointer group"
          >
            <FiGrid className="w-3.5 h-3.5 shrink-0" />
            <span>{t("view_all", "View All")}</span>
            <FiArrowRight className="w-3 h-3 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </button>
        </div>

        {/*
          Fixed-width card grid:
          minmax(260px, 1fr) → at 1280px: fits 4 cards exactly.
          At 1600px+: fits 5–6 cards — no card ever grows beyond 1fr of remaining space.
          Cards are fixed height via flex-col, image is fixed h-40.
        */}
        {loading ? (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-slate-200/60 rounded-xl overflow-hidden flex flex-col animate-pulse bg-white">
                <div className="w-full h-40 bg-slate-200" />
                <div className="p-4 flex flex-col gap-2.5">
                  <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-4/5" />
                  <div className="flex gap-3 mt-1">
                    <div className="h-3 bg-slate-200 rounded w-16" />
                    <div className="h-3 bg-slate-200 rounded w-12" />
                  </div>
                </div>
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex justify-between mt-auto">
                  <div className="h-3 bg-slate-200 rounded w-16" />
                  <div className="h-4 bg-slate-200 rounded w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}
          >
            {activeGigsList.map((gig) => (
              <GigCard key={gig.gig_id} gig={gig} router={router} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function GigCard({ gig, router }: { gig: any; router: any }) {
  const { currency, t } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lancerflow_wishlist");
    if (stored) {
      try {
        const wishlist = JSON.parse(stored);
        setIsSaved(wishlist.some((item: any) => item.gig_id === gig.gig_id));
      } catch (e) {}
    }
  }, [gig.gig_id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const stored = localStorage.getItem("lancerflow_wishlist");
    let wishlist = [];
    if (stored) {
      try {
        wishlist = JSON.parse(stored);
      } catch (err) {}
    }
    const isCurrentlySaved = wishlist.some((item: any) => item.gig_id === gig.gig_id);
    let updated;
    const token = localStorage.getItem("token");

    if (isCurrentlySaved) {
      updated = wishlist.filter((item: any) => item.gig_id !== gig.gig_id);
      setIsSaved(false);
      localStorage.setItem("lancerflow_wishlist", JSON.stringify(updated));
      try {
        if (token) {
          await fetch(`${API_URL}/freelancer/client/gigs/${gig.gig_id}/wishlist`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action: "remove" })
          });
        }
      } catch (err) {}
    } else {
      updated = [...wishlist, gig];
      setIsSaved(true);
      localStorage.setItem("lancerflow_wishlist", JSON.stringify(updated));
      try {
        if (token) {
          await fetch(`${API_URL}/freelancer/client/gigs/${gig.gig_id}/wishlist`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action: "add" })
          });
        }
      } catch (err) {}
    }
  };

  let coverUrl = "";
  try {
    if (Array.isArray(gig.images)) {
      coverUrl = gig.images[0];
    } else if (typeof gig.images === "string") {
      const parsed = JSON.parse(gig.images);
      if (Array.isArray(parsed)) coverUrl = parsed[0];
    }
  } catch {}

  const reviews = parseInt(gig.reviews_count || 0);
  const rating = reviews > 0 ? parseFloat(gig.reviews_avg_rating).toFixed(1) : "0.0";
  const converted = convertPrice(gig.price || 0, currency);

  return (
    <div
      onClick={() => router.push(`/gigs/${gig.slug || gig.gig_id}`)}
      className="group border border-slate-200/60 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.015] hover:border-teal-500/25 hover:shadow-xl hover:shadow-slate-200/60 cursor-pointer bg-white"
    >
      {/* Fixed-height cover — never stretches the card */}
      <div className="w-full h-40 shrink-0 overflow-hidden bg-gradient-to-tr from-slate-50 to-slate-100 relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            alt={gig.title}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 select-none">
            <div className="text-3xl">🎨</div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Service Preview</span>
          </div>
        )}
        {/* Category badge overlaid on image */}
        <span className="absolute top-3 left-3 text-[9px] font-black text-primary dark:text-white bg-white/90 dark:bg-zinc-950/85 border border-primary/20 dark:border-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm shadow-sm">
          {gig.category_name || "Development"}
        </span>
        {/* Interactive wishlist button */}
        {(() => {
          let currentUserId: number | null = null;
          try {
            const uStr = localStorage.getItem("user");
            if (uStr) {
              const u = JSON.parse(uStr);
              if (u && (u.user_id || u.id)) currentUserId = Number(u.user_id || u.id);
            }
          } catch (e) {}
          const isOwner = Boolean(currentUserId && (Number(gig.user_id) === currentUserId || Number(gig.freelancer_id) === currentUserId || Number(gig.user?.user_id) === currentUserId));
          if (isOwner) return null;
          return (
            <button
              onClick={toggleWishlist}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white dark:bg-zinc-950/80 dark:hover:bg-zinc-900 text-slate-400 dark:text-white shadow-md flex items-center justify-center border border-slate-100 dark:border-white/25 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer backdrop-blur-sm"
              title="Save to wishlist"
            >
              <FiHeart className={`w-3.5 h-3.5 transition-colors ${isSaved ? "text-rose-500 fill-rose-500" : "text-slate-400 dark:text-white/90"}`} />
            </button>
          );
        })()}
      </div>

      {/* Content */}
      <div className="p-4 pb-0 flex flex-col gap-2 flex-1 text-left">
        <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-teal-800 transition-colors">
          {gig.title}
        </h3>

        {gig.freelancer_name && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/freelancer/${gig.freelancer_slug || gig.freelancer_id}`);
            }}
            className="mt-1 flex items-center gap-2 group/author cursor-pointer w-fit select-none"
          >
            {gig.freelancer_image ? (
              <img
                src={resolveMediaUrl(gig.freelancer_image)}
                alt={gig.freelancer_name}
                className="w-5.5 h-5.5 rounded-full object-cover border border-slate-100/80"
              />
            ) : (
              <div className="w-5.5 h-5.5 rounded-full bg-teal-700/10 flex items-center justify-center font-bold text-[8px] text-teal-700 border border-teal-500/10 shrink-0 select-none">
                {gig.freelancer_name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-slate-500 font-bold hover:text-teal-750 group-hover/author:text-teal-700 transition-colors">
              {t("by", "By")} {gig.freelancer_name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-auto pt-2">
          <div className="flex items-center gap-0.5">
            <FiStar className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-slate-700 font-black">{rating}</span>
            <span className="text-slate-400 font-semibold">({reviews})</span>
          </div>
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3 shrink-0" />
            <span>{gig.delivery_days || 3}d {t("delivery", "delivery")}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2.5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{t("starting_at", "Starting at")}</span>
        <span className="text-base font-extrabold text-slate-900">
          {converted.formatted}
        </span>
      </div>
    </div>
  );
}
