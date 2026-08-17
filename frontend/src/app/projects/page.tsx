"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomSelect from "@/components/CustomSelect";
import ShareSection from "@/components/ShareSection";
import { useLanguage } from "@/context/LanguageContext";
import { convertPrice } from "@/utils/currencyHelper";
import { FiSearch, FiSliders, FiRefreshCw, FiDollarSign, FiClock, FiActivity, FiUser, FiBriefcase, FiHeart, FiStar, FiCpu, FiX } from "react-icons/fi";
import { checkAndSwitchRole } from "@/utils/roleRedirect";

function ProjectsSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLoginModal } = useAuthModal();
  const { currency, t } = useLanguage();

  useEffect(() => {
    const handleRoleVerification = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      if (token && user) {
        const result = await checkAndSwitchRole("freelancer", "/projects", false);
        if (result.targetUrl !== "/projects") {
          router.push(result.targetUrl);
        }
      }
    };
    handleRoleVerification();
  }, [router]);

  const currencyObj = convertPrice(100, currency);
  const symbol = currencyObj.symbol;
  const rate = currencyObj.amount / 100;

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

  // Dynamic SEO Setup
  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const res = await fetch(`${API_URL}/seo?route=/projects`);
        if (res.ok) {
          const seo = await res.json();
          if (seo.meta_title) document.title = seo.meta_title;
          
          let descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) {
            descMeta.setAttribute("content", seo.meta_description || "");
          } else {
            descMeta = document.createElement("meta");
            descMeta.setAttribute("name", "description");
            descMeta.setAttribute("content", seo.meta_description || "");
            document.head.appendChild(descMeta);
          }
          
          let kwMeta = document.querySelector('meta[name="keywords"]');
          if (kwMeta) {
            kwMeta.setAttribute("content", seo.meta_keywords || "");
          } else {
            kwMeta = document.createElement("meta");
            kwMeta.setAttribute("name", "keywords");
            kwMeta.setAttribute("content", seo.meta_keywords || "");
            document.head.appendChild(kwMeta);
          }
        }
      } catch (err) {
        console.error("Failed to load page SEO dynamic metadata:", err);
      }
    };
    fetchSEO();
  }, []);
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
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
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

  // Affiliate states
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState("");
  const [activeShareProject, setActiveShareProject] = useState<any | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          setIsAffiliate(profile.is_affiliate === true || profile.is_affiliate === 1);
          setUserReferralCode(profile.referral_code || "");
        }
      } catch (err) {
        console.error("Error fetching user profile for affiliate check:", err);
      }
    };
    fetchProfile();
  }, []);

  // AI Project Matching state
  const [activeTab, setActiveTab] = useState<"all" | "ai">("all");
  const [aiMatches, setAiMatches] = useState<any[]>([]);
  const [aiMatchLoading, setAiMatchLoading] = useState(false);
  const [aiMatchError, setAiMatchError] = useState("");
  const [aiMatchFetched, setAiMatchFetched] = useState(false);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  const runLocalMatchingFallback = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      let profile: any = null;
      let fSkills: string[] = [];
      let fCatId = "";
      let fExp = "";

      try {
        const profileRes = await fetch(`${API_URL}/freelancer/onboarding/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          profile = data.profile || null;
          fSkills = Array.isArray(data.skills)
            ? data.skills.map((s: any) => (s.skill_name || s.name || "").toLowerCase()).filter(Boolean)
            : [];
          if (profile) {
            fCatId = profile.category_id?.toString() || "";
            fExp = profile.experience_level?.toLowerCase() || "";
          }
        }
      } catch (err) {
        console.warn("Could not fetch user profile details for local match, using defaults:", err);
      }

      const localMatches = jobs.map((job) => {
        let score = 30;
        let matchedSkills: string[] = [];

        if (fCatId && job.category_id?.toString() === fCatId) {
          score += 25;
        }

        let jSkills: any[] = [];
        try {
          jSkills = Array.isArray(job.skills)
            ? job.skills
            : (typeof job.skills === "string" ? JSON.parse(job.skills) : []);
        } catch (e) {
          jSkills = [];
        }
        
        const finalJSkills = Array.isArray(jSkills) 
          ? jSkills.map((s: any) => (typeof s === "object" && s !== null ? s.skill_name || s.name : s).toLowerCase()).filter(Boolean)
          : [];

        finalJSkills.forEach((js: string) => {
          if (fSkills.includes(js)) {
            matchedSkills.push(js);
          }
        });

        score += Math.min(35, matchedSkills.length * 10);

        if (fExp && job.experience_level?.toLowerCase() === fExp) {
          score += 10;
        }

        let reason = "";
        if (matchedSkills.length > 0) {
          const capitalizedSkills = matchedSkills.slice(0, 3).map(s => s.toUpperCase()).join(", ");
          reason = `Matched based on your profile skills in ${capitalizedSkills} (${score}% compatibility).`;
        } else if (fCatId && job.category_id?.toString() === fCatId) {
          reason = `Matched based on your profile category with ${score}% compatibility.`;
        } else {
          reason = `Matched based on your profile experience level (${score}% compatibility).`;
        }

        return {
          ...job,
          score,
          reason
        };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);

      setAiMatches(localMatches);
      setIsLocalFallback(true);
      setAiMatchFetched(true);
      setAiMatchError("");
    } catch (err: any) {
      console.error("Local matching fallback failed:", err);
      setAiMatchError("Local matching failed. Please try again.");
    }
  };

  const fetchAiMatches = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      openLoginModal("/projects");
      return;
    }
    setAiMatchLoading(true);
    setAiMatchError("");
    setIsLocalFallback(false);
    setActiveTab("ai");
    try {
      const res = await fetch(`${API_URL}/ai/match-projects`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        console.warn("AI match request returned non-OK status. Falling back to local match calculations...");
        await runLocalMatchingFallback();
        return;
      }
      setAiMatches(data.matches || []);
      setAiMatchFetched(true);
      setIsLocalFallback(false);
    } catch (err: any) {
      console.warn("AI match request failed with network exception. Falling back to local match calculations...", err);
      await runLocalMatchingFallback();
    } finally {
      setAiMatchLoading(false);
    }
  };

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/proposals/my-proposals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<number>(data.map((p: any) => p.job_id));
          setAppliedJobIds(ids);
        }
      } catch (err) {
        console.error("Failed to fetch submitted proposals:", err);
      }
    };
    fetchAppliedJobs();
  }, []);

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
    if (currentUserId && (Number(job.user_id) === currentUserId || Number(job.posted_by_id) === currentUserId)) {
      showToast("error", "You cannot wishlist your own project.");
      return;
    }
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

  // Active subcategories based on selected category
  const activeSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const catObj = categories.find(
      (c) =>
        c.category_id?.toString() === selectedCategory ||
        c.category_name?.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (!catObj) return [];
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
  const filteredJobs = jobs.filter((job) => {
    // 1. Text search across ALL details (title, description, category, subcategory, client name/username, budget, project type, duration/days, experience level, skills)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchTitle = job.title?.toLowerCase().includes(query);
      const matchDesc = job.description?.toLowerCase().includes(query);
      const matchCategory = job.category_name?.toLowerCase().includes(query);
      const matchSubCat = job.sub_category_name?.toLowerCase().includes(query);
      const matchClient = (job.client_name || job.username || job.posted_by || "")?.toLowerCase().includes(query);
      const matchBudget = (job.budget || job.max_budget) ? `${job.budget || job.max_budget}`.includes(query) || `$${job.budget || job.max_budget}`.includes(query) : false;
      const matchType = job.project_type?.toLowerCase().includes(query);
      const matchDuration = job.duration?.toLowerCase().includes(query) || (job.delivery_days ? `${job.delivery_days}`.includes(query) || `${job.delivery_days} days`.toLowerCase().includes(query) : false);
      const matchLevel = job.experience_level?.toLowerCase().includes(query);
      const matchSkills = Array.isArray(job.skills) && job.skills.some((s: any) => {
        const str = typeof s === "object" && s !== null ? s.skill_name || s.name || "" : `${s}`;
        return str.toLowerCase().includes(query);
      });

      if (!matchTitle && !matchDesc && !matchCategory && !matchSubCat && !matchClient && !matchBudget && !matchType && !matchDuration && !matchLevel && !matchSkills) {
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
      const jobLevel = job.experience_level?.toLowerCase() || "";
      const selLevel = experienceLevel.toLowerCase();
      const isMatch = jobLevel === selLevel ||
        ((selLevel === "beginner" || selLevel === "entry level" || selLevel === "entry_level" || selLevel === "entry") &&
         (jobLevel === "beginner" || jobLevel === "entry level" || jobLevel === "entry_level" || jobLevel === "entry"));
      if (!isMatch) return false;
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
            search_type: "projects",
            results_count: filteredJobs.length,
            device_type: deviceType
          })
        });
      } catch (err) {
        console.error("Failed to log search analytics:", err);
      }
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, filteredJobs.length]);


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
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      {/* Search Type Switcher */}
      <div className="w-full bg-white border-b border-slate-200 py-3.5 select-none overflow-x-auto max-w-full no-scrollbar">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 sm:gap-6 shrink-0 w-max sm:w-full">
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
              <span>{t("refine_search_title", "Refine Search")} & {t("filters", "Filters")}</span>
            </span>
            <span className="text-xxs font-extrabold bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {t("filters", "Filters")}
            </span>
          </button>
        </div>

        {/* Left Side: Filtering Sidebar */}
        <aside className={`lg:col-span-3 space-y-6 ${showMobileFilter ? "block animate-fadeIn" : "hidden lg:block"}`}>
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xxs space-y-5 sticky top-24 h-fit z-20">
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
              <CustomSelect
                placeholder={t("all_categories_opt", "All Categories")}
                value={selectedCategory}
                options={categories.map((c) => ({ value: c.category_name, label: c.category_name }))}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubcategory("");
                }}
              />
            </div>

            {/* Subcategory Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block select-none">{t("subcategory_label", "Subcategory")}</label>
              <CustomSelect
                placeholder={
                  selectedCategory 
                    ? t("all_subcategories_opt", "All Subcategories") 
                    : t("select_category_first", "Select Category First")
                }
                value={selectedSubcategory}
                options={activeSubcategories.map((s) => ({ value: s.sub_category_name, label: s.sub_category_name }))}
                onChange={(val) => setSelectedSubcategory(val)}
                disabled={!selectedCategory}
              />
            </div>

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
                <option value="Beginner">{t("entry_level_opt", "Entry Level")}</option>
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
                onChange={(e) => setSearchQuery(e.target.value.replace(/\d{3,}/g, ""))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9.5 pr-4 text-xs font-bold text-slate-808 placeholder-slate-400 outline-none focus:border-primary focus:bg-white transition-all"
              />
            </div>

            {/* Stats, Sort and AI Match Tab */}
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
              {/* AI Match Tab Button */}
              <button
                onClick={() => {
                  if (activeTab === "ai") {
                    setActiveTab("all");
                  } else {
                    fetchAiMatches();
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all duration-200 cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-transparent shadow-md shadow-violet-200"
                    : "bg-white border-violet-200 text-violet-700 hover:bg-violet-50"
                }`}
              >
                <FiCpu className="w-3.5 h-3.5 shrink-0" />
                <span>{activeTab === "ai" ? t("show_all_btn", "Show All") : t("ai_matches_btn", "AI Matches")}</span>
              </button>
            </div>
          </div>

          {/* AI Matches Panel */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              {/* Header Banner */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-purple-700 rounded-xl p-4 text-white select-none">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black leading-tight">{t("ai_project_matching_banner_title", "AI Project Matching")}</p>
                  <p className="text-xs text-white/75 font-semibold mt-0.5">{t("ai_project_matching_banner_desc", "Personalised recommendations based on your profile, skills & experience")}</p>
                </div>
                <button
                  onClick={fetchAiMatches}
                  disabled={aiMatchLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black border border-white/20 transition cursor-pointer disabled:opacity-60"
                >
                  <svg className={`w-3.5 h-3.5 ${aiMatchLoading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>{t("refresh_btn", "Refresh")}</span>
                </button>
              </div>

              {/* Loading */}
              {aiMatchLoading && (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-600 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2c-.3 0-.6.1-.8.4L9.8 6.8c-.2.5-.6.9-1.1 1.1L4.4 9.2c-.5.2-.8.6-.8 1.1s.3.9.8 1.1l4.3 1.3c.5.2.9.6 1.1 1.1l1.3 4.3c.2.5.6.8 1.1.8s.9-.3 1.1-.8l1.3-4.3c.2-.5.6-.9 1.1-1.1l4.3-1.3c.5-.2.8-.6.8-1.1s-.3-.9-.8-1.1l-4.3-1.3c-.5-.2-.9-.6-1.1-1.1L12.8 2.4c-.2-.3-.5-.4-.8-.4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800">{t("analysing_profile_status", "Analysing your profile...")}</p>
                    <p className="text-xs text-slate-404 text-slate-400 font-semibold mt-1">{t("ai_matching_skills_status", "AI is matching your skills to the best open projects")}</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {!aiMatchLoading && aiMatchError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-3">
                  <span className="text-lg shrink-0">⚠️</span>
                  <div>
                    <p className="text-xs font-black text-rose-700">{aiMatchError}</p>
                    <button onClick={fetchAiMatches} className="mt-2 text-xs font-black text-rose-600 hover:underline cursor-pointer border-none bg-transparent">{t("try_again_btn", "Try again")}</button>
                  </div>
                </div>
              )}

              {/* No Matches */}
              {!aiMatchLoading && !aiMatchError && aiMatchFetched && aiMatches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl text-center gap-3">
                  <span className="text-4xl">🔍</span>
                  <p className="text-sm font-black text-slate-800">{t("no_strong_matches_found", "No strong matches found")}</p>
                    <p className="text-xs text-slate-505 text-slate-500 font-semibold max-w-xs">{t("no_strong_matches_desc", "Try completing more of your freelancer profile so the AI can better understand your expertise.")}</p>
                </div>
              )}
              {!aiMatchLoading && !aiMatchError && aiMatches.length > 0 && (
                <div className="space-y-4">
                  {aiMatches.map((match: any, idx: number) => {
                    const score = match.score || 0;
                    const isTop = idx === 0;
                    const scoreColor =
                      score >= 85 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                      score >= 70 ? "text-teal-700 bg-teal-50 border-teal-200" :
                      score >= 55 ? "text-amber-700 bg-amber-50 border-amber-200" :
                      "text-slate-600 bg-slate-50 border-slate-200";
                    const barColor =
                      score >= 85 ? "bg-emerald-500" :
                      score >= 70 ? "bg-teal-500" :
                      score >= 55 ? "bg-amber-500" :
                      "bg-slate-400";
                    const budget = parseFloat(match.budget || match.max_budget || 0);
                    const skills: string[] = Array.isArray(match.skills)
                      ? match.skills.map((s: any) => typeof s === "object" ? s.skill_name || s.name : s)
                      : [];

                    return (
                      <div
                        key={match.job_id}
                        onClick={() => router.push(`/projects/${match.slug || match.job_id}`)}
                        className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${
                          isTop ? "border-violet-300 ring-1 ring-violet-200" : "border-slate-200 hover:border-violet-200"
                        }`}
                      >
                        {/* Top glow accent for best match */}
                        {isTop && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600" />}

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {/* Best Match Crown */}
                              {isTop && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
                                  👑 {t("best_match_label", "Best Match")}
                                </span>
                              )}
                              {match.category_name && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                  {match.category_name}
                                </span>
                              )}
                              {match.project_type && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                                  {match.project_type}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-black text-slate-900 leading-snug group-hover:text-violet-700 transition-colors line-clamp-2">
                              {match.title}
                            </h3>

                            <p className="text-xs text-slate-500 font-semibold mt-1.5 line-clamp-2 leading-relaxed">
                              {match.description}
                            </p>

                            {/* AI Match Reason */}
                            {match.reason && (
                              <div className="mt-3 flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-lg p-2.5">
                                <svg className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                                <p className="text-[10px] font-semibold text-violet-800 leading-relaxed">{match.reason}</p>
                              </div>
                            )}

                            {/* Skills */}
                            {skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {skills.slice(0, 5).map((skill: string, i: number) => (
                                  <span key={i} className="text-[9px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Score Badge */}
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 font-black ${scoreColor}`}>
                              <span className="text-xl leading-none">{score}%</span>
                              <span className="text-[8px] uppercase tracking-wider mt-0.5">{t("match_score_label", "Match")}</span>
                            </div>
                            {/* Score progress bar */}
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-4">
                            {budget > 0 && (
                              <span className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                                <FiDollarSign className="w-3.5 h-3.5 text-primary" />
                                {(budget * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency !== "USD" ? currency : ""}
                              </span>
                            )}
                            {match.duration && (
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                                <FiClock className="w-3.5 h-3.5" />
                                {match.duration}
                              </span>
                            )}
                            {match.experience_level && (
                              <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                                <FiActivity className="w-3.5 h-3.5" />
                                {match.experience_level}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {isAffiliate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveShareProject(match);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 text-[10px] font-black py-1.5 px-3 rounded-lg shadow-sm transition cursor-pointer border-none"
                                title="Share & Earn Affiliate Commission"
                              >
                                  {t("share_earn_btn", "Share & Earn")}
                                </button>
                            )}
                            <span className="text-[10px] font-black text-violet-605 text-violet-600 uppercase tracking-wider group-hover:underline">{t("view_project_btn", "View Project →")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* All Projects: Loading status */}
          {activeTab === "all" && loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-xl gap-4">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400">{t("loading_projects_message", "Loading active projects...")}</p>
            </div>
          ) : activeTab === "all" && sortedJobs.length === 0 ? (
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
                      {!(currentUserId && (Number(job.client_id) === currentUserId || Number(job.user_id) === currentUserId)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(job);
                          }}
                          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-md flex items-center justify-center border border-slate-200/50 dark:border-slate-700 transition-all z-20 cursor-pointer"
                          title="Save to wishlist"
                        >
                          <FiHeart className={`w-4 h-4 transition-colors ${isInWishlist(job.job_id) ? "text-rose-500 fill-rose-500" : "text-slate-500 dark:text-slate-300"}`} />
                        </button>
                      )}

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

                        <div className="flex gap-2">
                          {isAffiliate && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveShareProject(job);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 text-[10px] font-black py-2 px-4 rounded-xl shadow-sm transition cursor-pointer border-none"
                              title="Share & Earn Affiliate Commission"
                            >
                              {t("share_earn_btn", "Share & Earn")}
                            </button>
                          )}
                          {appliedJobIds.has(job.job_id) ? (
                            <button
                              disabled
                              className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black py-2 px-4 rounded-xl shadow-sm cursor-not-allowed select-none"
                            >
                              {t("proposal_submitted_btn", "Proposal Submitted")}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${job.slug || job.job_id}`);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-sm transition cursor-pointer border-none"
                            >
                              {t("submit_proposal_btn", "Submit Proposal")}
                            </button>
                          )}
                        </div>
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

      {/* Share & Earn Pop-up Modal */}
      {activeShareProject && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveShareProject(null)}
          />
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative z-10 flex flex-col gap-4 text-left animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center text-base">
                  🎁
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Share & Earn Commission</h3>
                  <p className="text-[10px] font-bold text-slate-400">Promote this project and earn affiliate commission</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveShareProject(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer border-none"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <ShareSection
              type="project"
              itemTitle={activeShareProject.title || "Project"}
              itemDescription={activeShareProject.description || ""}
              priceOrBudget={activeShareProject.budget ? `$${parseFloat(activeShareProject.budget || 0).toLocaleString()}` : ""}
              customUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/projects/${activeShareProject.slug || activeShareProject.job_id}`}
              referralCode={userReferralCode}
              isAffiliate={isAffiliate}
              onToast={(type, msg) => {
                setToast({ type: type === "error" ? "error" : "success", message: msg });
                setTimeout(() => setToast(null), 3000);
              }}
            />
          </div>
        </div>
      )}

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
