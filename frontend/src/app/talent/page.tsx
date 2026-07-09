"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FiSearch, FiSliders, FiRefreshCw, FiDollarSign, FiStar, FiCheckCircle, FiUser, FiHeart } from "react-icons/fi";

function TalentSearchContent() {
  const router = useRouter();
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

  // Wishlist and Toast states
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const isInWishlist = (userId: number) => {
    return wishlist.some((item: any) => item.user_id === userId);
  };

  const handleToggleWishlist = (freelancer: any) => {
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
        const catRes = await fetch("https://freelancer.sangvish.com/api/admin/categories");
        const subRes = await fetch("https://freelancer.sangvish.com/api/admin/sub-categories");
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
        const res = await fetch("https://freelancer.sangvish.com/api/freelancers/public/list");
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
  const filteredFreelancers = freelancers.filter((f) => {
    // 1. Text search (name, title, bio, skills)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = f.name?.toLowerCase().includes(query);
      const matchTitle = f.professional_title?.toLowerCase().includes(query);
      const matchBio = f.bio?.toLowerCase().includes(query);
      const matchSkills = Array.isArray(f.skills) && f.skills.some((s: any) => {
        const skillStr = typeof s === "object" && s !== null ? s.skill_name || s.name || "" : s;
        return typeof skillStr === "string" && skillStr.toLowerCase().includes(query);
      });
      if (!matchName && !matchTitle && !matchBio && !matchSkills) {
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
      if (f.experience_level?.toLowerCase() !== experienceLevel.toLowerCase()) return false;
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

  // Sorting
  const sortedFreelancers = [...filteredFreelancers].sort((a: any, b: any) => {
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
    router.replace("/talent");
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Category</span>
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
              Explore Gigs
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
              Find Projects
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
              Hire Freelancers
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto w-full py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Side: Filtering Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-850 uppercase tracking-wider flex items-center gap-2 select-none">
                <FiSliders className="w-4 h-4 text-teal-700" />
                <span>Refine Search</span>
              </h2>
              <button
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-slate-400 hover:text-teal-700 transition flex items-center gap-1 cursor-pointer border-0 bg-transparent"
              >
                <FiRefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Specialty Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory("");
                }}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id.toString()}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            {selectedCategory && activeSubcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Subcategory</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                >
                  <option value="">All Subcategories</option>
                  {activeSubcategories.map((s) => (
                    <option key={s.sub_category_id} value={s.sub_category_id.toString()}>
                      {s.sub_category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hourly Rate Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Hourly Rate Range ($)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">Any Level</option>
                <option value="Entry">Entry Level</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            {/* Specific Skill Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Filter by Skill</label>
              <input
                type="text"
                placeholder="e.g. React, Figma..."
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
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
                <span className="text-xs font-extrabold text-slate-700">Vetted Contractors Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Side: Search Results Listing */}
        <section className="lg:col-span-9 space-y-6">
          {/* Top Panel bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            {/* Search Input */}
            <div className="flex-1 max-w-md relative select-none">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search for freelancers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-2 pl-9.5 pr-4 text-xs font-bold text-slate-800 placeholder-slate-450 outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Stats and Sort */}
            <div className="flex flex-wrap items-center gap-4 shrink-0 select-none">
              <p className="text-slate-500 text-xs font-bold">
                Showing <span className="text-slate-800 font-extrabold">{sortedFreelancers.length}</span> professionals
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-3xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rate_desc">Hourly Rate: High to Low</option>
                  <option value="rate_asc">Hourly Rate: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading status */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[2rem] gap-4">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400">Loading freelancers...</p>
            </div>
          ) : sortedFreelancers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-[2rem] text-center p-6">
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
              {sortedFreelancers.map((f) => {
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
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start gap-5 relative group"
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-inner select-none">
                      {f.profile_image ? (
                        <img
                          src={`https://freelancer.sangvish.com${f.profile_image}`}
                          alt={f.name}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e: any) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-850 group-hover:text-primary transition-colors leading-tight">
                          {f.name}
                        </h3>
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
                    <div className="sm:border-l sm:border-slate-100 sm:pl-6 flex flex-col justify-between items-start sm:items-end gap-4 self-stretch min-w-[120px]">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Hourly Rate</span>
                        <div className="flex items-baseline gap-0.5 text-slate-850 font-black text-lg mt-0.5">
                          <FiDollarSign className="w-3.5 h-3.5 text-slate-400 self-center" />
                          <span>{hourlyRate.toFixed(0)}</span>
                          <span className="text-slate-450 text-[10px] font-bold">/hr</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(f);
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-50/90 hover:bg-slate-100 flex items-center justify-center border border-slate-200 transition-all cursor-pointer shrink-0"
                          title="Save to wishlist"
                        >
                          <FiHeart className={`w-4 h-4 transition-colors ${isInWishlist(f.user_id) ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                        </button>
                        <button
                          onClick={() => router.push(`/freelancer/${f.slug || f.user_id}`)}
                          className="flex-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-black py-2.5 rounded-xl shadow-sm transition cursor-pointer text-center border-none"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
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
