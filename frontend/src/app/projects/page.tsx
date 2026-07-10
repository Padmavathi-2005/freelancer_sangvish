"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { convertPrice } from "@/utils/currencyHelper";
import { FiSearch, FiSliders, FiRefreshCw, FiDollarSign, FiClock, FiActivity, FiUser, FiBriefcase, FiHeart, FiStar } from "react-icons/fi";

function ProjectsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLoginModal } = useAuthModal();
  const { currency, t } = useLanguage();

  const currencyObj = convertPrice(100, currency);
  const symbol = currencyObj.symbol;
  const rate = currencyObj.amount / 100;

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [minBudget, setMinBudget] = useState<string>("");
  const [maxBudget, setMaxBudget] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [projectType, setProjectType] = useState<string>("");
  const [projectDuration, setProjectDuration] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data states
  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteShortName, setSiteShortName] = useState("Lancer");

  // Wishlist and Toast states
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("lancerflow_wishlist_projects");
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse projects wishlist:", e);
      }
    }
  }, []);

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
        console.error("Failed to load settings in projects page:", e);
      }
    };
    loadSettings();
  }, []);

  const isInWishlist = (jobId: number) => {
    return wishlist.some((item: any) => item.job_id === jobId);
  };

  const handleToggleWishlist = (job: any) => {
    const isSaved = isInWishlist(job.job_id);
    let updated;

    if (isSaved) {
      updated = wishlist.filter((item: any) => item.job_id !== job.job_id);
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist_projects", JSON.stringify(updated));
      showToast("success", `Removed "${job.title.substring(0, 20)}..." from Wishlist`);
    } else {
      updated = [...wishlist, job];
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist_projects", JSON.stringify(updated));
      showToast("success", `Added "${job.title.substring(0, 20)}..." to Wishlist`);
    }
  };

  // Fetch taxonomies
  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const catRes = await fetch(`${API_URL}/admin/categories`);
        const subRes = await fetch(`${API_URL}/admin/sub-categories`);
        if (catRes.ok && subRes.ok) {
          const cats = await catRes.json();
          const subs = await subRes.json();
          setCategories(cats.filter((c: any) => c.status === "Active" || c.status === "active" || c.status === 1 || c.status === true || c.status === "true"));
          setSubcategories(subs.filter((s: any) => s.status === "Active" || s.status === "active" || s.status === 1 || s.status === true || s.status === "true"));
        }
      } catch (err) {
        console.error("Failed to fetch taxonomies on projects page:", err);
      }
    };
    fetchTaxonomies();
  }, []);

  // Fetch Projects/Jobs from public endpoint
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/jobs/public`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (err) {
        console.error("Failed to fetch jobs on projects page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Sync state if query params change
  useEffect(() => {
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const subcat = searchParams.get("subcategory");
    if (query !== null) setSearchQuery(query);
    if (category !== null) setSelectedCategory(category);
    if (subcat !== null) setSelectedSubcategory(subcat);
  }, [searchParams]);

  // Filter Logic
  const filteredJobs = jobs.filter((job) => {
    // 1. Text search (title, description, client name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = job.title?.toLowerCase().includes(query);
      const matchDesc = job.description?.toLowerCase().includes(query);
      const matchSkills = Array.isArray(job.skills) && job.skills.some((s: any) => {
        const skillStr = typeof s === "object" && s !== null ? s.skill_name || s.name || "" : s;
        return typeof skillStr === "string" && skillStr.toLowerCase().includes(query);
      });
      if (!matchTitle && !matchDesc && !matchSkills) {
        return false;
      }
    }

    // 2. Category filter
    if (selectedCategory) {
      const isMatch =
        job.category_id?.toString() === selectedCategory ||
        job.category_name?.toLowerCase() === selectedCategory.toLowerCase();
      if (!isMatch) return false;
    }

    // 3. Subcategory filter
    if (selectedSubcategory) {
      const isMatch =
        job.sub_category_id?.toString() === selectedSubcategory ||
        job.sub_category_name?.toLowerCase() === selectedSubcategory.toLowerCase();
      if (!isMatch) return false;
    }

    // 4. Budget range
    const jobBudget = parseFloat(job.budget || job.max_budget || 0);
    if (minBudget && !isNaN(parseFloat(minBudget))) {
      const minUsd = parseFloat(minBudget) / rate;
      if (jobBudget < minUsd) return false;
    }
    if (maxBudget && !isNaN(parseFloat(maxBudget))) {
      const maxUsd = parseFloat(maxBudget) / rate;
      if (jobBudget > maxUsd) return false;
    }

    // 5. Experience Level
    if (experienceLevel) {
      if (job.experience_level?.toLowerCase() !== experienceLevel.toLowerCase()) return false;
    }

    // 6. Project Type (Fixed / Hourly)
    if (projectType) {
      if (job.project_type?.toLowerCase() !== projectType.toLowerCase()) return false;
    }

    // 7. Project Duration
    if (projectDuration) {
      const dur = job.duration?.toLowerCase() || "";
      if (projectDuration === "short" && !dur.includes("1 month") && !dur.includes("less than")) return false;
      if (projectDuration === "medium" && !dur.includes("1 to 3") && !dur.includes("1-3")) return false;
      if (projectDuration === "long" && !dur.includes("3 to 6") && !dur.includes("3-6") && !dur.includes("more than") && !dur.includes("6+")) return false;
    }

    return true;
  });

  // Sorting
  const sortedJobs = [...filteredJobs].sort((a: any, b: any) => {
    // Featured always sorted first!
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    if (sortBy === "budget_desc") {
      return parseFloat(b.budget || b.max_budget || 0) - parseFloat(a.budget || a.max_budget || 0);
    }
    if (sortBy === "budget_asc") {
      return parseFloat(a.budget || a.max_budget || 0) - parseFloat(b.budget || b.max_budget || 0);
    }
    // Default latest sorting
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedJobs, currentPage]);

  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSubcategory, minBudget, maxBudget, experienceLevel, projectType, projectDuration, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setMinBudget("");
    setMaxBudget("");
    setExperienceLevel("");
    setProjectType("");
    setProjectDuration("");
    setSortBy("latest");
    router.replace("/projects");
  };

  const activeSubcategories = subcategories.filter((s: any) => {
    if (!selectedCategory) return true;
    const cat = categories.find(
      (c) =>
        c.category_id?.toString() === selectedCategory ||
        c.category_name?.toLowerCase() === selectedCategory.toLowerCase()
    );
    return cat ? s.category_id === cat.category_id : false;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      {/* Search Type Switcher */}
      <div className="w-full bg-white border-b border-slate-200 py-3.5 select-none">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("search_category_label", "Search Category")}</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (searchQuery) params.set("query", searchQuery);
                if (selectedCategory) params.set("category", selectedCategory);
                router.push(`/gigs${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-slate-50 hover:bg-slate-100 text-slate-655 transition-all cursor-pointer border-none"
            >
              {t("explore_gigs_btn", "Explore Gigs")}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (searchQuery) params.set("query", searchQuery);
                if (selectedCategory) params.set("category", selectedCategory);
                router.push(`/projects${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-primary text-white shadow-sm transition-all cursor-pointer border-none"
            >
              {t("find_projects_btn", "Find Projects")}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (searchQuery) params.set("query", searchQuery);
                if (selectedCategory) params.set("category", selectedCategory);
                router.push(`/talent${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-slate-50 hover:bg-slate-100 text-slate-655 transition-all cursor-pointer border-none"
            >
              {t("hire_freelancers_btn", "Hire Freelancers")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="max-w-[1600px] mx-auto w-full py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">

        {/* Left Side: Filtering Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xxs space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-850 uppercase tracking-wider flex items-center gap-2 select-none">
                <FiSliders className="w-4 h-4 text-teal-700" />
                <span>{t("refine_search_title", "Refine Search")}</span>
              </h2>
              <button
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-slate-400 hover:text-teal-700 transition flex items-center gap-1 cursor-pointer border-0 bg-transparent"
              >
                <FiRefreshCw className="w-3 h-3" />
                <span>{t("reset_btn", "Reset")}</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("category_label", "Category")}</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory("");
                }}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">{t("all_categories_opt", "All Categories")}</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id.toString()}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            {activeSubcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("subcategory_label", "Subcategory")}</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                >
                  <option value="">{t("all_subcategories_opt", "All Subcategories")}</option>
                  {activeSubcategories.map((s) => (
                    <option key={s.sub_category_id} value={s.sub_category_id.toString()}>
                      {s.sub_category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Budget Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("budget_range_label", "Budget Range")} ({symbol})</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={t("min_budget_placeholder", "Min")}
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder={t("max_budget_placeholder", "Max")}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("experience_level_label", "Experience Level")}</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">{t("any_level_opt", "Any Level")}</option>
                <option value="Entry">{t("entry_level_opt", "Entry Level")}</option>
                <option value="Intermediate">{t("intermediate_opt", "Intermediate")}</option>
                <option value="Expert">{t("expert_opt", "Expert")}</option>
              </select>
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("project_type_label", "Project Type")}</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">{t("all_types_opt", "All Types")}</option>
                <option value="Fixed">{t("fixed_price_opt", "Fixed Price")}</option>
                <option value="Hourly">{t("hourly_rate_opt", "Hourly Rate")}</option>
              </select>
            </div>

            {/* Project Duration */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("project_duration_label", "Project Duration")}</label>
              <select
                value={projectDuration}
                onChange={(e) => setProjectDuration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">{t("all_durations_opt", "All Durations")}</option>
                <option value="short">{t("short_term_opt", "Short Term (< 1 month)")}</option>
                <option value="medium">{t("medium_term_opt", "Medium Term (1 - 3 months)")}</option>
                <option value="long">{t("long_term_opt", "Long Term (> 3 months)")}</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Right Side: Search Results Listing */}
        <section className="lg:col-span-9 space-y-6">
          {/* Top Panel bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-xxs">
            {/* Search Input */}
            <div className="flex-1 max-w-md relative select-none">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder={t("search_projects_placeholder", "Search for projects...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9.5 pr-4 text-xs font-bold text-slate-808 placeholder-slate-400 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Stats and Sort */}
            <div className="flex flex-wrap items-center gap-4 shrink-0 select-none">
              <p className="text-slate-500 text-xs font-bold">
                {t("showing_label", "Showing")} <span className="text-slate-800 font-extrabold">{sortedJobs.length}</span> {t("active_projects_label", "active projects")}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">{t("sort_by_label", "Sort By")}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
                >
                  <option value="latest">{t("latest_posted_opt", "Latest Posted")}</option>
                  <option value="budget_desc">{t("budget_high_low_opt", "Budget: High to Low")}</option>
                  <option value="budget_asc">{t("budget_low_high_opt", "Budget: Low to High")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading status */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl gap-4">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400">{t("loading_projects_message", "Loading active projects...")}</p>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl text-center p-6">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl mb-4">
                💼
              </div>
              <h3 className="text-base font-black text-slate-855">{t("no_projects_title", "No projects found")}</h3>
              <p className="text-xs text-slate-500 font-bold max-w-sm mt-2">
                {t("no_projects_desc", "Try checking for other categories, adjusting budget scopes, or resetting filters.")}
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 bg-primary hover:bg-primary-hover text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-sm transition cursor-pointer border-none"
              >
                {t("reset_all_filters_btn", "Reset All Filters")}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                {paginatedJobs.map((job) => {
                  const finalBudget = parseFloat(job.budget || job.max_budget || 0);
                  return (
                    <div
                      key={job.job_id}
                      onClick={() => router.push(`/projects/${job.slug || job.job_id}`)}
                      className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative group cursor-pointer hover:border-primary/30"
                    >
                      {/* Wishlist Heart Toggle Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(job);
                        }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-50/90 hover:bg-white shadow-md flex items-center justify-center border border-slate-200/50 transition-all z-20 cursor-pointer"
                        title="Save to wishlist"
                      >
                        <FiHeart className={`w-4 h-4 transition-colors ${isInWishlist(job.job_id) ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                      </button>

                      <div>
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pr-10">
                          <div className="flex gap-2">
                            <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {job.category_name || "Project"}
                            </span>
                            {job.experience_level && (
                              <span className="bg-slate-50 text-slate-605 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                {job.experience_level}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-primary font-black text-sm">
                            <span>
                              {(() => {
                                const budgetVal = parseFloat(job.budget || 0);
                                const minVal = parseFloat(job.min_budget || 0);
                                const maxVal = parseFloat(job.max_budget || 0);

                                if (minVal > 0 && maxVal > 0) {
                                  const convMin = convertPrice(minVal, currency);
                                  const convMax = convertPrice(maxVal, currency);
                                  return `${convMin.symbol}${convMin.amount.toLocaleString()} – ${convMax.symbol}${convMax.amount.toLocaleString()}`;
                                } else if (budgetVal > 0) {
                                  const conv = convertPrice(budgetVal, currency);
                                  return `${conv.symbol}${conv.amount.toLocaleString()}`;
                                } else if (maxVal > 0) {
                                  const conv = convertPrice(maxVal, currency);
                                  return `${conv.symbol}${conv.amount.toLocaleString()}`;
                                }
                                  return t("contact_for_budget", "Contact for Budget");
                              })()}
                              {job.project_type === "Hourly" && (job.budget || job.max_budget || job.min_budget) ? (
                                <span className="text-xs font-bold text-slate-550">/hr</span>
                              ) : ""}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-855 group-hover:text-primary transition-colors leading-snug">
                            {job.title}
                          </h3>
                          {job.is_featured && (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0 flex items-center gap-1">
                              <FiStar className="w-2.5 h-2.5 fill-white text-white shrink-0" />
                              <span>{siteShortName}'s Choice</span>
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-500 font-bold leading-relaxed mt-2 line-clamp-3">
                          {job.description}
                        </p>

                        {/* Skills badge list */}
                        {Array.isArray(job.skills) && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {job.skills.map((skill: any, sIdx: number) => {
                              const skillName = typeof skill === "object" && skill !== null ? skill.skill_name || skill.name || "" : skill;
                              return (
                                <span
                                  key={sIdx}
                                  className="bg-slate-50 text-slate-605 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-100"
                                >
                                  {skillName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Bottom bar */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                          {job.project_type && (
                            <span className="flex items-center gap-1">
                              <FiBriefcase className="w-3.5 h-3.5 text-slate-400" />
                              <span>{job.project_type}</span>
                            </span>
                          )}
                          {job.duration && (
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{job.duration}</span>
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${job.slug || job.job_id}`);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-sm transition cursor-pointer border-none"
                        >
                          {t("submit_proposal_btn", "Submit Proposal")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100 text-xs font-bold select-none text-slate-805">
                  <span className="text-slate-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, sortedJobs.length)} of {sortedJobs.length} active projects
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      {t("pagination_prev", "Previous")}
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      {t("pagination_next", "Next")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl border bg-white animate-slideIn">
          <FiHeart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">{toast.message}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ProjectsSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ProjectsSearchContent />
    </Suspense>
  );
}
