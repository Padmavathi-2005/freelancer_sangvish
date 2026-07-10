"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_URL } from "@/config/api";
import { FiSearch, FiCalendar, FiUser, FiFolder, FiClock, FiArrowRight } from "react-icons/fi";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch blogs
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoading(true);
        const url = `${API_URL}/blogs?search=${encodeURIComponent(debouncedSearch)}&category=${encodeURIComponent(category)}&page=${currentPage}&limit=9`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setBlogs(data.blogs || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
          }
        }
      } catch (error) {
        console.error("Failed to load blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadBlogs();
  }, [debouncedSearch, category, currentPage]);

  // Fetch all categories for filter bar (unfiltered list to get all unique categories)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/blogs?limit=100`);
        if (res.ok) {
          const data = await res.json();
          const cats: string[] = Array.from(
            new Set((data.blogs || []).map((b: any) => b.category || "General"))
          );
          setAllCategories(cats);
        }
      } catch (e) {
        console.error("Failed to load blog categories:", e);
      }
    };
    loadCategories();
  }, []);

  const calculateReadTime = (content: string) => {
    const words = content ? content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
    const time = Math.max(1, Math.ceil(words / 200));
    return `${time} min read`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      {/* CSS Styles for background animation */}
      <style jsx>{`
        @keyframes floatSlow {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-30px, 20px) scale(0.9); }
        }
        .animate-float-slow {
          animation: floatSlow 12s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: floatReverse 15s ease-in-out infinite;
        }
      `}</style>

      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden bg-white text-slate-900 py-16 lg:py-24 px-6 lg:px-10 border-b border-slate-200/80">
        <div className="absolute top-[-20%] left-[-10%] w-[45rem] h-[45rem] bg-teal-500/5 rounded-full filter blur-[100px] pointer-events-none animate-float-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none animate-float-reverse"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center flex flex-col items-center gap-6">
          <span className="text-teal-700 font-black text-xs uppercase tracking-widest bg-teal-50 border border-teal-200/60 px-3.5 py-1.5 rounded-full shadow-sm animate-fadeIn">
            LancerFlow Publications
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-slate-900 max-w-3xl font-display">
            Insights & Guides for the Modern Freelancer
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-semibold max-w-2xl leading-relaxed">
            Stay up to date with the latest industry insights, hiring tips, coding guides, and career advice curated by our engineering and business specialists.
          </p>

          {/* SEARCH INPUT */}
          <div className="w-full max-w-xl relative mt-4">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles by title, keywords, or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 rounded-2xl border border-slate-200 focus:border-teal-500/60 transition-all focus:outline-none placeholder-slate-400 font-semibold text-sm shadow-sm focus:shadow-md"
            />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT SECTION */}
      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-16 w-full flex flex-col gap-10">
        
        {/* HORIZONTAL CATEGORY FILTER PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <button
            onClick={() => { setCategory("all"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
              category === "all"
                ? "bg-teal-700 text-white border-teal-750 shadow-md shadow-teal-700/15"
                : "bg-white hover:bg-slate-100 text-slate-655 border-slate-200"
            }`}
          >
            All Publications
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                category === cat
                  ? "bg-teal-700 text-white border-teal-750 shadow-md shadow-teal-700/15"
                  : "bg-white hover:bg-slate-100 text-slate-655 border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ARTICLES GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-4 animate-pulse">
                <div className="bg-slate-200 rounded-2xl aspect-video w-full" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl p-8 max-w-xl mx-auto w-full flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-450 border border-slate-200 rounded-2xl flex items-center justify-center">
              <FiFolder className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">No Articles Found</h3>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
              We couldn't find any published blog posts matching your search query or selected category filter.
            </p>
            <button
              onClick={() => { setSearch(""); setCategory("all"); }}
              className="mt-2 text-teal-750 font-bold text-xs hover:underline"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <article
                key={blog.blog_id}
                className="group flex flex-col bg-white border border-slate-200/60 hover:border-teal-500/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-teal-950/5 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Cover Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  {blog.cover_image ? (
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500/10 to-teal-700/5 flex items-center justify-center">
                      <FiFolder className="w-10 h-10 text-teal-600/30" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-teal-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {blog.category || "General"}
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex-1 p-6 flex flex-col gap-3">
                  {/* Meta Indicators */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-450">
                    <span className="flex items-center gap-1.5">
                      <FiCalendar className="w-3.5 h-3.5" />
                      {new Date(blog.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiClock className="w-3.5 h-3.5" />
                      {calculateReadTime(blog.content)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black leading-snug text-slate-850 group-hover:text-teal-750 transition-colors">
                    <Link href={`/blogs/${blog.slug}`}>
                      {blog.title}
                    </Link>
                  </h3>

                  {/* Summary */}
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3">
                    {blog.summary || blog.content.replace(/<[^>]*>/g, "").substring(0, 160) + "..."}
                  </p>

                  {/* Footer Author & Action */}
                  <div className="border-t border-slate-100 pt-4 mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-200 overflow-hidden flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-slate-450" />
                      </div>
                      <span className="text-xs font-black text-slate-700">
                        {blog.author_name || "Administrator"}
                      </span>
                    </div>
                    <Link
                      href={`/blogs/${blog.slug}`}
                      className="text-teal-750 hover:text-teal-600 font-extrabold text-xs flex items-center gap-1 group/btn"
                    >
                      Read Post <FiArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentPage === 1
                  ? "bg-slate-100 border-slate-200 text-slate-400 pointer-events-none"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              Previous
            </button>
            <span className="text-xs font-black text-slate-500 px-4">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentPage === totalPages
                  ? "bg-slate-100 border-slate-200 text-slate-400 pointer-events-none"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Background Container for CTA and Footer */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 border-t border-slate-200/60 w-full mt-auto">
        <div className="absolute top-[-20%] left-[-15%] w-[45rem] h-[45rem] bg-teal-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[45rem] h-[45rem] bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 w-full">
          <Footer transparent={true} />
        </div>
      </div>
    </div>
  );
}
