"use client";
import { API_URL, API_BASE_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

// ─── Fallback SVG icons per category keyword ────────────────────────────────
function CategoryIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();

  if (lower.includes("web"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    );
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    );
  if (lower.includes("ai") || lower.includes("machine") || lower.includes("automat"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
        <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
        <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
      </svg>
    );
  if (lower.includes("market") || lower.includes("seo") || lower.includes("social") || lower.includes("digital"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("ios") || lower.includes("app"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
      </svg>
    );
  if (lower.includes("writ") || lower.includes("content") || lower.includes("blog") || lower.includes("copy"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    );
  if (lower.includes("video") || lower.includes("animation") || lower.includes("motion"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    );
  if (lower.includes("data") || lower.includes("analytics") || lower.includes("database"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    );
  // default
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface CategoryStat {
  category_id: number;
  category_name: string;
  category_image: string | null;
  freelancer_count: string;
  description?: string | null;
}

const FALLBACK_CATEGORIES: CategoryStat[] = [
  { category_id: 1, category_name: "Web Development",    category_image: null, freelancer_count: "0" },
  { category_id: 2, category_name: "UI/UX Design",       category_image: null, freelancer_count: "0" },
  { category_id: 3, category_name: "AI & Automation",    category_image: null, freelancer_count: "0" },
  { category_id: 4, category_name: "Digital Marketing",  category_image: null, freelancer_count: "0" },
];

// ─── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse">
      <div className="h-32 bg-slate-100" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-8 bg-slate-100 rounded-xl mt-2" />
      </div>
    </div>
  );
}

function getCategoryFallbackImage(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("web") || lower.includes("code") || lower.includes("dev")) {
    return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("graphic")) {
    return "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("ai") || lower.includes("machine") || lower.includes("automat") || lower.includes("bot") || lower.includes("intelligence")) {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("market") || lower.includes("seo") || lower.includes("social") || lower.includes("digital") || lower.includes("ad")) {
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("ios") || lower.includes("app")) {
    return "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("writ") || lower.includes("content") || lower.includes("blog") || lower.includes("copy")) {
    return "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("video") || lower.includes("animation") || lower.includes("motion")) {
    return "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("data") || lower.includes("analytics") || lower.includes("database")) {
    return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80";
}

function resolveCategoryImageUrl(catImg: string | null | undefined, catName: string) {
  const fallback = getCategoryFallbackImage(catName);
  if (!catImg || typeof catImg !== "string" || !catImg.trim() || catImg === "null" || catImg === "undefined") {
    return fallback;
  }
  let clean = catImg.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  clean = clean.replace(/^\/?public\//, "/");
  const baseBackend = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackend}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

// ─── Category card ────────────────────────────────────────────────────────────
function CategoryCard({ cat, onClick }: { cat: CategoryStat; onClick: () => void }) {
  const { t } = useLanguage();
  const count = parseInt(cat.freelancer_count || "0");
  const fallbackImg = getCategoryFallbackImage(cat.category_name);
  const [imgSrc, setImgSrc] = useState(() => resolveCategoryImageUrl(cat.category_image, cat.category_name));

  useEffect(() => {
    setImgSrc(resolveCategoryImageUrl(cat.category_image, cat.category_name));
  }, [cat.category_image, cat.category_name]);

  return (
    <div
      onClick={onClick}
      className="group rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden cursor-pointer
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70 hover:shadow-zinc-950/30
                 hover:border-primary/30 flex flex-col"
    >
      {/* Image / icon area */}
      <div className="relative h-44 bg-slate-100 dark:bg-zinc-850 flex items-center justify-center overflow-hidden shrink-0">
        <img
          src={imgSrc}
          alt={cat.category_name}
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = fallbackImg;
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Freelancer count badge */}
        {count > 0 && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full
                           bg-primary text-white shadow-sm">
            {count.toLocaleString()} {t("active", "active")}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex flex-col flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-snug mb-1">{cat.category_name}</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[34px]">
            {cat.description || "Browse custom services and top-tier freelancers across all industries."}
          </p>
        </div>

        {/* Browse button — primary → secondary gradient */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
          className="mt-auto w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl
                     bg-primary text-white
                     hover:bg-primary-hover
                     transition-all duration-300 group-hover:shadow-md group-hover:shadow-primary/20"
        >
          {t("btn_browse", "Browse")}
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5">
            <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export default function Categories() {
  const { t } = useLanguage();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/categories-stats`);
        if (res.ok) {
          const data: CategoryStat[] = await res.json();
          setCategories(data.length > 0 ? data.slice(0, 4) : FALLBACK_CATEGORIES);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="w-full bg-[#f8fafc] dark:bg-zinc-950 border-t border-slate-200/60 dark:border-zinc-800/40 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 leading-tight">
              {t("categories_title", "Browse Popular Categories")}
            </h2>
          </div>

          {/* View all — primary filled, secondary on hover */}
          <button
            onClick={() => router.push("/categories")}
            className="flex-shrink-0 inline-flex items-center justify-center text-center gap-2
                       text-sm font-bold text-white bg-primary hover:bg-primary-hover
                       px-5 py-2.5 rounded-xl
                       shadow-md shadow-primary/20
                       transition-all duration-300 active:scale-[0.98]"
          >
            {t("btn_view_all_categories", "View all categories")}
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
            </svg>
          </button>
        </div>

        {/* ── 1 row of 4 — 2 cols on mobile, 4 cols on sm+ ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.category_id || i}
                cat={cat}
                onClick={() => router.push(`/talent?category=${encodeURIComponent(cat.category_name)}`)}
              />
            ))}
          </div>
        )}


      </div>
    </section>
  );
}
