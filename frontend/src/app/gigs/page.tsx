"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FiStar, FiHeart, FiClock, FiSearch, FiSliders, FiRefreshCw, FiChevronRight, FiGrid } from "react-icons/fi";

function GigsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [maxDeliveryDays, setMaxDeliveryDays] = useState<string>("");
  const [filterRating, setFilterRating] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");

  // Wishlist and Toast states
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("lancerflow_wishlist");
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse wishlist:", e);
      }
    }
  }, []);

  const isInWishlist = (gigId: number) => {
    return wishlist.some((item: any) => item.gig_id === gigId);
  };

  const handleToggleWishlist = async (gig: any) => {
    const isSaved = isInWishlist(gig.gig_id);
    let updated;
    const token = localStorage.getItem("token");

    if (isSaved) {
      updated = wishlist.filter((item: any) => item.gig_id !== gig.gig_id);
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist", JSON.stringify(updated));
      showToast("success", `Removed "${gig.title.substring(0, 20)}..." from Wishlist`);

      try {
        if (token) {
          await fetch(`https://freelancer.sangvish.com/api/freelancer/client/gigs/${gig.gig_id}/wishlist`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action: "remove" })
          });
        }
      } catch (err) {
        console.error("Failed to sync wishlist removal:", err);
      }
    } else {
      updated = [...wishlist, gig];
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist", JSON.stringify(updated));
      showToast("success", `Added "${gig.title.substring(0, 20)}..." to Wishlist`);

      try {
        if (token) {
          await fetch(`https://freelancer.sangvish.com/api/freelancer/client/gigs/${gig.gig_id}/wishlist`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action: "add" })
          });
        }
      } catch (err) {
        console.error("Failed to sync wishlist addition:", err);
      }
    }
  };

  // Data states
  const [gigs, setGigs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch taxonomies (categories, subcategories)
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
        console.error("Failed to fetch taxonomies on search page:", err);
      }
    };
    fetchTaxonomies();
  }, []);

  // Fetch Gigs
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://freelancer.sangvish.com/api/freelancer/client/gigs");
        if (res.ok) {
          const data = await res.json();
          setGigs(data);
        }
      } catch (err) {
        console.error("Failed to fetch gigs on search page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
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

  // Filter & Sort Logic
  const filteredGigs = gigs.filter((gig) => {
    // 1. Text search (title, description, freelancer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = gig.title?.toLowerCase().includes(query);
      const matchDesc = gig.description?.toLowerCase().includes(query);
      const matchCategory = gig.category_name?.toLowerCase().includes(query);
      const matchFreelancer = gig.freelancer_name?.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchCategory && !matchFreelancer) {
        return false;
      }
    }

    // 2. Category filter
    if (selectedCategory) {
      // Check if selectedCategory is ID or Name
      const isMatch =
        gig.category_id?.toString() === selectedCategory ||
        gig.category_name?.toLowerCase() === selectedCategory.toLowerCase();
      if (!isMatch) return false;
    }

    // 3. Subcategory filter
    if (selectedSubcategory) {
      const isMatch =
        gig.sub_category_id?.toString() === selectedSubcategory ||
        gig.sub_category_name?.toLowerCase() === selectedSubcategory.toLowerCase();
      if (!isMatch) return false;
    }

    // 4. Min price filter
    if (minPrice && !isNaN(parseFloat(minPrice))) {
      if (parseFloat(gig.price) < parseFloat(minPrice)) return false;
    }

    // 5. Max price filter
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      if (parseFloat(gig.price) > parseFloat(maxPrice)) return false;
    }

    // 6. Delivery time threshold
    if (maxDeliveryDays && !isNaN(parseInt(maxDeliveryDays))) {
      if (parseInt(gig.delivery_days) > parseInt(maxDeliveryDays)) return false;
    }

    // 7. Rating filter
    if (filterRating) {
      const gigRating = parseFloat(gig.reviews_avg_rating || 5.0);
      if (parseFloat(filterRating) > gigRating) return false;
    }

    // 8. Experience Level filter
    if (experienceLevel) {
      if (gig.experience_level?.toLowerCase() !== experienceLevel.toLowerCase()) return false;
    }

    return true;
  });

  // Sorting
  const sortedGigs = [...filteredGigs].sort((a: any, b: any) => {
    if (sortBy === "price_asc") {
      return parseFloat(a.price) - parseFloat(b.price);
    }
    if (sortBy === "price_desc") {
      return parseFloat(b.price) - parseFloat(a.price);
    }
    if (sortBy === "rating") {
      const rateA = parseFloat(a.reviews_avg_rating || 0);
      const rateB = parseFloat(b.reviews_avg_rating || 0);
      if (rateA !== rateB) return rateB - rateA;
      return parseInt(b.reviews_count || 0) - parseInt(a.reviews_count || 0);
    }
    // Default "popular" sorting based on Views, wishlist, reviews
    const scoreA =
      parseInt(a.views || 0) +
      parseInt(a.wishlist_count || 0) * 3 +
      parseInt(a.reviews_count || 0) * 5 +
      parseFloat(a.reviews_avg_rating || 5.0) * 10;
    const scoreB =
      parseInt(b.views || 0) +
      parseInt(b.wishlist_count || 0) * 3 +
      parseInt(b.reviews_count || 0) * 5 +
      parseFloat(b.reviews_avg_rating || 5.0) * 10;
    return scoreB - scoreA;
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setMinPrice("");
    setMaxPrice("");
    setMaxDeliveryDays("");
    setFilterRating("");
    setExperienceLevel("");
    setSortBy("popular");
    router.replace("/gigs");
  };

  // Get dynamic subcategories list based on selected category
  const activeSubcategories = subcategories.filter((s: any) => {
    if (!selectedCategory) return true;
    
    // Find category detail
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
              className="px-4 py-2 rounded-xl text-xs font-black bg-primary text-white shadow-sm transition-all cursor-pointer border-none"
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
              className="px-4 py-2 rounded-xl text-xs font-black bg-slate-50 hover:bg-slate-100 text-slate-655 transition-all cursor-pointer border-none"
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
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Category</label>
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
                  <option key={c.category_id} value={c.category_name}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter (Displays only if a category is selected or is filtered) */}
            {selectedCategory && activeSubcategories.length > 0 && (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Subcategory</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                >
                  <option value="">All Subcategories</option>
                  {activeSubcategories.map((s) => (
                    <option key={s.sub_category_id} value={s.sub_category_name}>
                      {s.sub_category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Budget (USD)</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xxs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl pl-5 pr-2 py-1.5 text-xs text-slate-800 font-bold focus:outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xxs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl pl-5 pr-2 py-1.5 text-xs text-slate-800 font-bold focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Days Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Delivery Speed</label>
              <select
                value={maxDeliveryDays}
                onChange={(e) => setMaxDeliveryDays(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">Any time duration</option>
                <option value="1">Up to 24 hours</option>
                <option value="3">Up to 3 days</option>
                <option value="7">Up to 7 days</option>
                <option value="14">Up to 14 days</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Minimum Rating</label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-teal-700/50 rounded-3xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5 Stars &amp; Up</option>
                <option value="4.0">4.0 Stars &amp; Up</option>
                <option value="3.5">3.5 Stars &amp; Up</option>
              </select>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">Contractor Level</label>
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
          </div>
        </aside>

        {/* Right Side: Gig Grid Content */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* Grid control bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            {/* Search Input */}
            <div className="flex-1 max-w-md relative select-none">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search for service gigs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-2 pl-9.5 pr-4 text-xs font-bold text-slate-800 placeholder-slate-450 outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Stats and Sort */}
            <div className="flex flex-wrap items-center gap-4 shrink-0 select-none">
              <p className="text-xs font-bold text-slate-500">
                Showing <strong className="text-slate-800">{sortedGigs.length}</strong> active gigs
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-3xl px-3 py-1.5 text-xs font-bold text-slate-750 focus:outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27none%27%3E%3Cpath%20d%3D%27M7%209l3%203%203-3%27%20stroke%3D%27%2364748B%27%20stroke-width%3D%271.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
                >
                  <option value="popular">Recommended / Popular</option>
                  <option value="rating">Top Rated Status</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-teal-700/20 border-t-teal-700 rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Scanning marketplace database...</p>
            </div>
          ) : sortedGigs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto shadow-sm animate-fadeIn">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">No Services Found</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  We couldn't find any active services matching your filter criteria. Try adjusting the keywords, price ranges, or click reset to browse all.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="mt-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-teal-700/10 hover:shadow-lg transition-all cursor-pointer active:scale-95"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {sortedGigs.map((gig) => {
                // Parse cover image
                let coverUrl = "";
                try {
                  if (Array.isArray(gig.images)) {
                    coverUrl = gig.images[0];
                  } else if (typeof gig.images === "string") {
                    const parsed = JSON.parse(gig.images);
                    if (Array.isArray(parsed)) coverUrl = parsed[0];
                  }
                } catch (e) {}

                const reviews = parseInt(gig.reviews_count || 0);
                const rating = reviews > 0 ? parseFloat(gig.reviews_avg_rating).toFixed(1) : "0.0";

                return (
                  <div
                    key={gig.gig_id}
                    onClick={() => router.push(`/gigs/${gig.slug || gig.gig_id}`)}
                    className="group border border-slate-200/60 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-teal-500/25 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer bg-white justify-between"
                  >
                    <div>
                      {/* Thumbnail block */}
                      {coverUrl ? (
                        <div className="relative w-full h-44 overflow-hidden bg-slate-100 border-b border-slate-200/50">
                          <img src={coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={gig.title} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(gig);
                            }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/95 hover:bg-white shadow-md flex items-center justify-center border border-slate-100 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                            title="Add to wishlist"
                          >
                            <FiHeart className={`w-4 h-4 transition-colors ${isInWishlist(gig.gig_id) ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative w-full h-44 bg-gradient-to-tr from-slate-50 to-slate-100/55 flex items-center justify-center border-b border-slate-200/55 text-slate-350 select-none text-xxs font-extrabold tracking-wider uppercase">
                          🎨 Service Preview Showcase
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(gig);
                            }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/95 hover:bg-white shadow-md flex items-center justify-center border border-slate-100 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
                            title="Add to wishlist"
                          >
                            <FiHeart className={`w-4 h-4 transition-colors ${isInWishlist(gig.gig_id) ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                          </button>
                        </div>
                      )}

                      {/* Info Details body */}
                      <div className="p-5">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded uppercase tracking-wider block w-fit">
                            {gig.category_name || "Development"}
                          </span>
                          {gig.wishlist_count > 0 && (
                            <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 select-none">
                              <FiHeart className="w-3 h-3 fill-rose-500" />
                              <span>{gig.wishlist_count} saves</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2 mt-3 hover:text-teal-750 transition-colors">
                          {gig.title}
                        </h3>

                        {gig.freelancer_name && (
                          <div className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>By {gig.freelancer_name}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3.5 mt-4 border-t border-slate-100 pt-3 text-xxs font-extrabold text-slate-400">
                          <div className="flex items-center gap-0.5">
                            <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-slate-800">{rating}</span>
                            <span className="text-slate-400 font-medium">({reviews})</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <FiClock className="w-3.5 h-3.5 shrink-0" />
                            <span>{gig.delivery_days || 3}d delivery</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Block */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-400 select-none">
                      <span className="uppercase tracking-wider">Starting At</span>
                      <span className="text-base font-extrabold text-slate-900">${parseFloat(gig.price || 0).toLocaleString()}</span>
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

export default function GigsSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
      </div>
    }>
      <GigsSearchContent />
    </Suspense>
  );
}
