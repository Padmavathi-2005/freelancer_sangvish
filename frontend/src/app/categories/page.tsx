"use client";

import { API_URL, API_BASE_URL } from "@/config/api";
import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FiSearch } from "react-icons/fi";

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
  if (lower.includes("ai") || lower.includes("machine") || lower.includes("intelligence") || lower.includes("automat"))
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
  if (lower.includes("writ") || lower.includes("content") || lower.includes("blog") || lower.includes("translate"))
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
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function CategoriesContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [catRes, subRes, statRes] = await Promise.all([
          fetch(`${API_URL}/admin/categories`),
          fetch(`${API_URL}/admin/sub-categories`),
          fetch(`${API_URL}/categories-stats`)
        ]);

        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(cats);
        }
        if (subRes.ok) {
          const subs = await subRes.json();
          setSubcategories(subs);
        }
        if (statRes.ok) {
          const stats = await statRes.json();
          setCategoryStats(stats);
        }
      } catch (err) {
        console.error("Failed to load category page data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mergedCategories = useMemo(() => {
    return categories.map(cat => {
      const stat = categoryStats.find(s => s.category_id === cat.category_id);
      const subs = subcategories.filter(sub => sub.category_id === cat.category_id);
      return {
        ...cat,
        freelancer_count: stat ? parseInt(stat.freelancer_count || "0") : 0,
        subcategories: subs
      };
    });
  }, [categories, subcategories, categoryStats]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return mergedCategories;
    const q = searchQuery.toLowerCase();
    return mergedCategories.filter(cat => 
      cat.category_name.toLowerCase().includes(q)
    );
  }, [mergedCategories, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      {/* Main Workspace Container */}
      <main className="max-w-[1600px] mx-auto w-full py-12 px-4 sm:px-6 lg:px-8 flex-1">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-200/60 pb-8 mb-10 select-none">
          <div className="text-left">
            <span className="text-[10px] font-black text-[#0F766E] tracking-widest uppercase block mb-1">
              LancerFlow Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              Browse Categories
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-semibold leading-relaxed">
              Find customized services and top-tier freelancers across all industries.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/20 rounded-xl py-2 pl-9.5 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-xxs"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 4, 8].map(i => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse flex flex-col">
                <div className="h-32 bg-slate-100" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl text-center p-6 max-w-xl mx-auto shadow-sm select-none">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl mb-4">
              🔍
            </div>
            <h3 className="text-base font-black text-slate-855">No categories found</h3>
            <p className="text-xs text-slate-500 font-bold max-w-xs mt-2 leading-relaxed">
              We couldn't find any categories matching "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-6 bg-[#0F766E] hover:bg-[#0c5a54] text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-sm transition cursor-pointer border-none"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {filteredCategories.map((cat: any) => {
              const count = cat.freelancer_count;
              const catImage = cat.category_image
                ? cat.category_image.startsWith("http")
                  ? cat.category_image
                  : `${API_BASE_URL}/${cat.category_image.replace(/^\/?/, "")}`
                : null;

              return (
                <div 
                  key={cat.category_id}
                  onClick={() => router.push(`/talent?category=${encodeURIComponent(cat.category_name)}`)}
                  className="group rounded-xl border border-slate-200 bg-white overflow-hidden cursor-pointer
                             transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70
                             hover:border-[#0F766E]/30 flex flex-col text-left"
                >
                  {/* Image / icon area */}
                  <div className="relative h-44 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {catImage ? (
                      <img
                        src={catImage}
                        alt={cat.category_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-[#0F766E]/40">
                        <CategoryIcon name={cat.category_name} />
                      </div>
                    )}
                    {/* Freelancer count badge */}
                    {count > 0 && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full
                                       bg-[#0F766E] text-white shadow-sm">
                        {count.toLocaleString()} active
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">{cat.category_name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed min-h-[34px]">
                        {cat.description || "Browse custom services and top-tier freelancers across all industries."}
                      </p>
                    </div>

                    {/* Browse button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/talent?category=${encodeURIComponent(cat.category_name)}`);
                      }}
                      className="mt-auto w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl
                                 bg-[#0F766E] hover:bg-[#0c5a54] text-white transition-all duration-300 group-hover:shadow-md group-hover:shadow-[#0F766E]/20 border-none"
                    >
                      Browse
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5">
                        <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
