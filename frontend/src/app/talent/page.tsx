"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomSelect from "@/components/CustomSelect";
import { useLanguage } from "@/context/LanguageContext";
import { FiSearch, FiSliders, FiRefreshCw, FiDollarSign, FiStar, FiCheckCircle, FiUser, FiHeart } from "react-icons/fi";
import { checkAndSwitchRole } from "@/utils/roleRedirect";

function TalentSearchContent() {
  const { t, formatPrice } = useLanguage();
  const router = useRouter();
  useEffect(() => {
    const handleRoleVerification = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        const result = await checkAndSwitchRole("client", "/talent", false);
        if (result.targetUrl !== "/talent") {
          router.push(result.targetUrl);
        }
      }
    };
    handleRoleVerification();
  }, [router]);
  const searchParams = useSearchParams();



  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [minRate, setMinRate] = useState<string>("");
  const [maxRate, setMaxRate] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [vettedOnly, setVettedOnly] = useState<boolean>(false);
  const [filterSkill, setFilterSkill] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Data states
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteShortName, setSiteShortName] = useState("Lancer");

  // Wishlist and Toast states
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    try {
      const uStr = localStorage.getItem("user");
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u && (u.user_id || u.id)) setCurrentUserId(Number(u.user_id || u.id));
      }
    } catch (e) {}
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("lancerflow_wishlist_freelancers");
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse freelancers wishlist:", e);
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
        console.error("Failed to load settings in talent page:", e);
      }
    };
    loadSettings();
  }, []);

  const isInWishlist = (userId: number) => {
    return wishlist.some((item: any) => item.user_id === userId);
  };

  const handleToggleWishlist = (freelancer: any) => {
    if (currentUserId && (Number(freelancer.user_id) === currentUserId || Number(freelancer.id) === currentUserId)) {
      showToast("error", "You cannot wishlist your own profile.");
      return;
    }
    const isSaved = isInWishlist(freelancer.user_id);
    let updated;

    if (isSaved) {
      updated = wishlist.filter((item: any) => item.user_id !== freelancer.user_id);
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist_freelancers", JSON.stringify(updated));
      showToast("success", `Removed "${freelancer.name}" from Wishlist`);
    } else {
      updated = [...wishlist, freelancer];
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist_freelancers", JSON.stringify(updated));
      showToast("success", `Added "${freelancer.name}" to Wishlist`);
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
        console.error("Failed to fetch taxonomies on talent page:", err);
      }
    };
    fetchTaxonomies();
  }, []);

  // Fetch Freelancers from public endpoint
  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/freelancers/public/list`);
        if (res.ok) {
          const data = await res.json();
          setFreelancers(data);
        }
      } catch (err) {
        console.error("Failed to fetch freelancers on talent page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  // Active subcategories based on selected category
  const activeSubcategories = useMemo(() => {
    if (!selectedCategory) return subcategories;
    const catObj = categories.find(
      (c) =>
        c.category_id?.toString() === selectedCategory ||
        c.category_name?.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (!catObj) return subcategories;
    const catIdStr = String(catObj.category_id || catObj.id);
    return subcategories.filter(
      (s) => String(s.category_id || s.categoryId) === catIdStr
    );
  }, [selectedCategory, categories, subcategories]);

  // Sync state if query params change
  useEffect(() => {
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const subcat = searchParams.get("subcategory");
    if (query !== null) setSearchQuery(query);
    if (category !== null) {
      if (categories.length > 0) {
        const found = categories.find(
          (c) =>
            c.category_id?.toString() === category ||
            c.category_name?.toLowerCase() === category.toLowerCase() ||
            c.slug?.toLowerCase() === category.toLowerCase()
        );
        setSelectedCategory(found ? found.category_name : category);
      } else {
        setSelectedCategory(category);
      }
    }
    if (subcat !== null) {
      if (subcategories.length > 0) {
        const found = subcategories.find(
          (s) =>
            s.sub_category_id?.toString() === subcat ||
            s.sub_category_name?.toLowerCase() === subcat.toLowerCase() ||
            s.slug?.toLowerCase() === subcat.toLowerCase()
        );
        setSelectedSubcategory(found ? found.sub_category_name : subcat);
      } else {
        setSelectedSubcategory(subcat);
      }
    }
  }, [searchParams, categories, subcategories]);

  // Filter Logic
  const filteredFreelancers = freelancers.filter((f) => {
    // 1. Text search across ALL details (name, username, title, bio, category, subcategory, hourly rate, experience level, country/location, skills)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = (f.name || f.username || f.full_name || "")?.toLowerCase().includes(query);
      const matchTitle = f.professional_title?.toLowerCase().includes(query);
      const matchBio = f.bio?.toLowerCase().includes(query);
      const matchCategory = f.category_name?.toLowerCase().includes(query);
      const matchSubCat = f.sub_category_name?.toLowerCase().includes(query);
      const matchRate = f.hourly_rate ? `${f.hourly_rate}`.includes(query) || `$${f.hourly_rate}`.includes(query) || `${f.hourly_rate}/hr`.toLowerCase().includes(query) : false;
      const matchLevel = f.experience_level?.toLowerCase().includes(query);
      const matchCountry = (f.country || f.location || "")?.toLowerCase().includes(query);
      const matchSkills = Array.isArray(f.skills) && f.skills.some((s: any) => {
        const str = typeof s === "object" && s !== null ? s.skill_name || s.name || "" : `${s}`;
        return str.toLowerCase().includes(query);
      });

      if (!matchName && !matchTitle && !matchBio && !matchCategory && !matchSubCat && !matchRate && !matchLevel && !matchCountry && !matchSkills) {
        return false;
      }
    }

    // 2. Category filter
    if (selectedCategory) {
      // Allow match by category name or ID
      const isMatch =
        f.category_id?.toString() === selectedCategory ||
        f.category_name?.toLowerCase() === selectedCategory.toLowerCase();
      if (!isMatch) return false;
    }

    // 3. Subcategory filter
    if (selectedSubcategory) {
      const isMatch =
        f.sub_category_id?.toString() === selectedSubcategory ||
        f.sub_category_name?.toLowerCase() === selectedSubcategory.toLowerCase();
      if (!isMatch) return false;
    }

    // 4. Hourly Rate range
    const rate = parseFloat(f.hourly_rate || 0);
    if (minRate && !isNaN(parseFloat(minRate))) {
      if (rate < parseFloat(minRate)) return false;
    }
    if (maxRate && !isNaN(parseFloat(maxRate))) {
      if (rate > parseFloat(maxRate)) return false;
    }

    // 5. Experience Level
    if (experienceLevel) {
      const fLevel = f.experience_level?.toLowerCase() || "";
      const selLevel = experienceLevel.toLowerCase();
      const isMatch = fLevel === selLevel ||
        ((selLevel === "beginner" || selLevel === "entry level" || selLevel === "entry_level" || selLevel === "entry") &&
         (fLevel === "beginner" || fLevel === "entry level" || fLevel === "entry_level" || fLevel === "entry"));
      if (!isMatch) return false;
    }

    // 6. Vetting Status (Vetted only check)
    if (vettedOnly) {
      if (f.vetting_status !== "Approved") return false;
    }

    // 7. Specific Skill filter
    if (filterSkill.trim()) {
      const targetSkill = filterSkill.toLowerCase().trim();
      const match = Array.isArray(f.skills) && f.skills.some((s: string) => s.toLowerCase().includes(targetSkill));
      if (!match) return false;
    }

    return true;
  });

  // Log search queries for Analytics
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const delayDebounce = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const deviceType = window.innerWidth < 768 ? "Mobile" : "Desktop";
        await fetch(`${API_URL}/analytics/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            query_text: searchQuery.trim(),
            search_type: "talent",
            results_count: filteredFreelancers.length,
            device_type: deviceType
          })
        });
      } catch (err) {
        console.error("Failed to log search analytics:", err);
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, filteredFreelancers.length]);

  // Sorting
  const sortedFreelancers = [...filteredFreelancers].sort((a: any, b: any) => {
    // Featured always sorted first!
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    if (sortBy === "rate_desc") {
      return parseFloat(b.hourly_rate || 0) - parseFloat(a.hourly_rate || 0);
    }
    if (sortBy === "rate_asc") {
      return parseFloat(a.hourly_rate || 0) - parseFloat(b.hourly_rate || 0);
    }
    // Default recommended sorting (Approved vetting first, then highest rate)
    const scoreA = (a.vetting_status === "Approved" ? 100 : 0) + parseFloat(a.hourly_rate || 0) / 10;
    const scoreB = (b.vetting_status === "Approved" ? 100 : 0) + parseFloat(b.hourly_rate || 0) / 10;
    return scoreB - scoreA;
  });

  const paginatedFreelancers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedFreelancers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFreelancers, currentPage]);

  const totalPages = Math.ceil(sortedFreelancers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSubcategory, minRate, maxRate, experienceLevel, vettedOnly, filterSkill, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setMinRate("");
    setMaxRate("");
    setExperienceLevel("");
    setVettedOnly(false);
    setFilterSkill("");
    setSortBy("recommended");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      {/* Search Type Switcher */}
      <div className="w-full bg-white border-b border-slate-200 py-3.5 select-none overflow-x-auto max-w-full no-scrollbar">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 sm:gap-6 shrink-0 w-max sm:w-full">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("search_category", "Search Category")}</span>
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
              {t("nav_gigs", "Explore Gigs")}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (searchQuery) params.set("query", searchQuery);
                if (selectedCategory) params.set("category", selectedCategory);
                router.push(`/projects${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-slate-50 hover:bg-slate-100 text-slate-655 transition-all cursor-pointer border-none"
            >
              {t("nav_projects", "Find Projects")}
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (searchQuery) params.set("query", searchQuery);
                if (selectedCategory) params.set("category", selectedCategory);
                router.push(`/talent${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-primary text-white shadow-sm transition-all cursor-pointer border-none"
            >
              {t("nav_talent", "Hire Freelancers")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="max-w-[1600px] mx-auto w-full py-6 sm:py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden col-span-1">
          <button
            type="button"
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-xs text-xs font-black text-slate-800 hover:bg-slate-50 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FiSliders className="w-4 h-4 text-teal-700" />
              <span>{t("refine_search", "Refine Search & Filters")}</span>
            </span>
            <span className="text-xxs font-extrabold bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {t("filters", "Filters")}
            </span>
          </button>
        </div>

        {/* Left Side: Filtering Sidebar */}
        <aside className={`lg:col-span-3 space-y-6 ${showMobileFilter ? "block animate-fadeIn" : "hidden lg:block"}`}>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 sticky top-24 h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-850 uppercase tracking-wider flex items-center gap-2 select-none">
                <FiSliders className="w-4 h-4 text-teal-700" />
                <span>{t("refine_search", "Refine Search")}</span>
              </h2>
              <button
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-slate-400 hover:text-teal-700 transition flex items-center gap-1 cursor-pointer border-0 bg-transparent"
              >
                <FiRefreshCw className="w-3 h-3" />
                <span>{t("reset", "Reset")}</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("category", "Specialty Category")}</label>
              <CustomSelect
                placeholder={t("all_categories", "All Categories")}
                value={selectedCategory}
                options={categories.map((c) => ({ value: c.category_name, label: c.category_name }))}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubcategory("");
                }}
              />
            </div>

            {/* Subcategory Filter */}
            {selectedCategory && activeSubcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("subcategory", "Subcategory")}</label>
                <CustomSelect
                  placeholder={t("all_subcategories", "All Subcategories")}
                  value={selectedSubcategory}
                  options={activeSubcategories.map((s) => ({ value: s.sub_category_name, label: s.sub_category_name }))}
                  onChange={(val) => setSelectedSubcategory(val)}
                />
              </div>
            )}

            {/* Hourly Rate Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("hourly_rate_range", "Hourly Rate Range ($)")}</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={t("min", "Min")}
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder={t("max", "Max")}
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("experience_level", "Experience Level")}</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">{t("any_level", "Any Level")}</option>
                <option value="Beginner">{t("entry_level", "Entry Level")}</option>
                <option value="Intermediate">{t("intermediate", "Intermediate")}</option>
                <option value="Expert">{t("expert", "Expert")}</option>
              </select>
            </div>

            {/* Specific Skill Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("filter_by_skill", "Filter by Skill")}</label>
              <input
                type="text"
                placeholder={t("filter_by_skill_placeholder", "e.g. React, Figma...")}
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value.replace(/\d{3,}/g, ""))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
              />
            </div>

            {/* Vetting Status Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={vettedOnly}
                  onChange={(e) => setVettedOnly(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-extrabold text-slate-700">{t("vetted_contractors_only", "Vetted Contractors Only")}</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Side: Search Results Listing */}
        <section className="lg:col-span-9 space-y-6">
          {/* Top Panel bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            {/* Search Input */}
            <div className="flex-1 max-w-md relative select-none">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder={t("search_freelancers_placeholder", "Search for freelancers...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9.5 pr-4 text-xs font-bold text-slate-800 placeholder-slate-450 outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Stats and Sort */}
            <div className="flex flex-wrap items-center gap-4 shrink-0 select-none">
              <p className="text-slate-500 text-xs font-bold">
                {t("showing", "Showing")} <span className="text-slate-800 font-extrabold">{sortedFreelancers.length}</span> {t("professionals", "professionals")}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">{t("sort_by", "Sort By")}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="recommended">{t("sort_recommended", "Recommended")}</option>
                  <option value="rate_desc">{t("sort_rate_high_low", "Hourly Rate: High to Low")}</option>
                  <option value="rate_asc">{t("sort_rate_low_high", "Hourly Rate: Low to High")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading status */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl gap-4">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading freelancers...</p>
            </div>
          ) : sortedFreelancers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl text-center p-6">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl mb-4">
                👋
              </div>
              <h3 className="text-base font-black text-slate-850">No talent found</h3>
              <p className="text-xs text-slate-500 font-bold max-w-sm mt-2">
                Try checking for other categories, adjusting hourly rate limits, or resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 bg-primary hover:bg-primary-hover text-white text-xs font-black py-2.5 px-6 rounded-xl shadow-sm transition cursor-pointer border-none"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedFreelancers.map((f) => {
                const hourlyRate = parseFloat(f.hourly_rate || 0);
                const initials = f.name
                  ? f.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()
                  : "FL";

                return (
                  <div
                    key={f.user_id}
                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start gap-5 relative group"
                  >
                    {/* Avatar */}
                    <div
                      className="w-14 h-14 rounded-xl text-white flex items-center justify-center text-lg font-black shrink-0 shadow-inner select-none relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, var(--color-primary, #10b981) 0%, var(--color-secondary, #06b6d4) 100%)`
                      }}
                    >
                      <span>{initials}</span>
                      {f.profile_image && (
                        <img
                          src={`https://freelancer.sangvish.com${f.profile_image}`}
                          alt={f.name}
                          className="absolute inset-0 w-full h-full object-cover rounded-xl"
                          onError={(e: any) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-850 group-hover:text-primary transition-colors leading-tight">
                          {f.name}
                        </h3>
                        {f.is_featured && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0 flex items-center gap-1">
                            <FiStar className="w-2.5 h-2.5 fill-white text-white shrink-0" />
                            <span>{siteShortName}'s Choice</span>
                          </span>
                        )}
                        {f.vetting_status === "Approved" && (
                          <FiCheckCircle className="w-4.5 h-4.5 text-primary shrink-0" title="Vetted Contractor" />
                        )}
                        {f.experience_level && (
                          <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                            {f.experience_level}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-black text-slate-800 mt-1 leading-snug">
                        {f.professional_title || "Freelancer Partner"}
                      </p>

                      <p className="text-xs text-slate-500 font-bold leading-relaxed mt-2 line-clamp-2">
                        {f.bio || "No professional overview bio provided yet by this freelancer partner."}
                      </p>

                      {/* Skills list */}
                      {Array.isArray(f.skills) && f.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {f.skills.map((skill: any, sIdx: number) => {
                            const skillName = typeof skill === "object" && skill !== null ? skill.skill_name || skill.name || "" : skill;
                            return (
                              <span
                                key={sIdx}
                                className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-100"
                              >
                                {skillName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right / Pricing Action */}
                    <div className="sm:border-l sm:border-slate-100 sm:pl-6 flex flex-col justify-between items-start sm:items-end gap-4 self-stretch min-w-[160px]">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Hourly Rate</span>
                        <div className="flex items-baseline gap-0.5 text-slate-850 font-black text-lg mt-0.5">
                          <FiDollarSign className="w-3.5 h-3.5 text-slate-400 self-center" />
                          <span>{hourlyRate.toFixed(0)}</span>
                          <span className="text-slate-450 text-[10px] font-bold">/hr</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full mt-auto">
                        {!Boolean(currentUserId && Number(f.user_id) === currentUserId) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(f);
                            }}
                            className="w-9 h-9 rounded-xl bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0"
                            title="Save to wishlist"
                          >
                            <FiHeart className={`w-4 h-4 transition-colors ${isInWishlist(f.user_id) ? "text-rose-500 fill-rose-500" : "text-slate-500 dark:text-slate-300"}`} />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/freelancer/${f.slug || f.user_id}`)}
                          className="flex-1 text-white text-[11px] font-extrabold py-2.5 rounded-xl shadow-md transition-all duration-300 cursor-pointer text-center border-none hover:shadow-lg hover:brightness-110 active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, var(--color-primary, #10b981) 0%, var(--color-secondary, #06b6d4) 100%)`
                          }}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100 text-xs font-bold select-none text-slate-805">
                  <span className="text-slate-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedFreelancers.length)} of {sortedFreelancers.length} professionals
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      Next
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

export default function TalentSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <TalentSearchContent />
    </Suspense>
  );
}
