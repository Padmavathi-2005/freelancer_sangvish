"use client";
import { API_URL, API_BASE_URL } from "@/config/api";

const resolveLogoUrl = (url: string) => {
  if (!url) return "";
  let cleanUrl = url;
  const publicIdx = cleanUrl.indexOf("/public/");
  if (publicIdx !== -1) {
    cleanUrl = cleanUrl.substring(publicIdx);
  }
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }
  const baseBackendUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackendUrl}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
};


import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { FiZap, FiPlus, FiGrid, FiChevronDown, FiChevronRight, FiSearch, FiUser, FiLogOut, FiBell, FiHeart, FiGift, FiCreditCard, FiBriefcase, FiSettings, FiExternalLink } from "react-icons/fi";
import NotificationsDropdown from "./dashboard/NotificationsDropdown";
import { checkAndSwitchRole } from "@/utils/roleRedirect";

export default function Header() {
  const router = useRouter();
  const handleTalentClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    let isLoggedIn = false;
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      isLoggedIn = !!(token && user);
    }
    if (isLoggedIn) {
      const result = await checkAndSwitchRole("client", "/talent", false);
      router.push(result.targetUrl);
    } else {
      router.push("/talent");
    }
  };

  const handleProjectsClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    let isLoggedIn = false;
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      isLoggedIn = !!(token && user);
    }
    if (isLoggedIn) {
      const result = await checkAndSwitchRole("freelancer", "/projects", false);
      router.push(result.targetUrl);
    } else {
      router.push("/projects");
    }
  };
  const pathname = usePathname() || "";



  const isHome1Active = pathname === "/" || pathname === "/home-1";
  const isHome2Active = pathname === "/home-2";
  const isHome3Active = pathname === "/home-3";

  const isTalentActive = pathname.startsWith("/talent");
  const isProjectsActive = pathname.startsWith("/projects");
  const isGigsActive = pathname.startsWith("/gigs");
  const isBlogsActive = pathname.startsWith("/blogs");

  const { lang, currency, currencySymbol, activeLanguages, currencies, changeLanguage, changeCurrency, t } = useLanguage();
  const { openLoginModal } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userSlug, setUserSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [siteTheme, setSiteTheme] = useState("light");

  const toggleTheme = async () => {
    const nextTheme = siteTheme === "light" ? "dark" : "light";
    setSiteTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("siteTheme", nextTheme);
      const primaryCol = localStorage.getItem("primaryColor") || "#0d9488";
      const secondaryCol = localStorage.getItem("secondaryColor") || "#06b6d4";
      const { applyTheme } = await import("@/utils/theme");
      applyTheme(nextTheme, primaryCol, secondaryCol);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/gigs?query=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const [cmsPages, setCmsPages] = useState<Array<{ title: string; slug: string }>>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null);
  const DEFAULT_SITE_LOGO = "/public/images/onboard/file-1783600571599-686657795.png";
  const [siteLogo, setSiteLogo] = useState(DEFAULT_SITE_LOGO);
  const [siteLogoDark, setSiteLogoDark] = useState(DEFAULT_SITE_LOGO);
  const [siteName, setSiteName] = useState("Buy2Lancer");
  const [mounted, setMounted] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setNotifications(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch notifications in Header:", e);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadNotificationsCount(data.unreadCount);
        }
      } catch (e) {
        console.error("Failed to fetch unread count in Header:", e);
      }
    };

    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUnreadNotificationsCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (e) {
      console.error("Failed to mark all notifications as read in Header:", e);
    }
  };

  const handleMarkSingleRead = async (notifId: number, notifType: string, refId: string | null) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/notifications/${notifId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let redirectUrl = "/dashboard";
      const type = notifType ? notifType.toLowerCase() : "";
      
      if (type === "message" || type === "chat") {
        redirectUrl = refId ? `/dashboard/inbox?chat_id=${refId}` : "/dashboard/inbox";
      } else if (type === "proposal" || type === "project") {
        redirectUrl = "/dashboard/proposals";
      } else if (type === "gig") {
        if (userRole === "client") {
          redirectUrl = refId ? `/dashboard/orders?application_id=${refId}` : "/dashboard/orders";
        } else {
          redirectUrl = refId ? `/dashboard/applications?application_id=${refId}` : "/dashboard/applications";
        }
      } else if (
        type === "wallet" || 
        type === "payout" || 
        type === "withdrawal" ||
        type === "signup_bonus" ||
        type === "referral_signup_bonus" ||
        type === "referral" ||
        type === "bonus"
      ) {
        redirectUrl = "/dashboard/wallet";
      } else if (
        type === "contract" ||
        type === "dispute" ||
        type === "work_started" ||
        type === "completion" ||
        type === "milestone" ||
        type === "payment"
      ) {
        let isGigContract = false;
        let gigAppId = null;
        if (refId) {
          try {
            const refNum = parseInt(refId);
            const token = localStorage.getItem("token");
            const endpoint = userRole === "client" 
              ? `${API_URL}/freelancer/client/gigs/applications`
              : `${API_URL}/freelancer/gigs/applications`;
            const checkRes = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (checkRes.ok) {
              const apps = await checkRes.json();
              const matchedApp = apps.find((a: any) => a.contract_id === refNum);
              if (matchedApp) {
                isGigContract = true;
                gigAppId = matchedApp.application_id;
              }
            }
          } catch (e) {
            console.error("Error checking gig contract:", e);
          }
        }

        if (isGigContract && gigAppId) {
          redirectUrl = userRole === "client"
            ? `/dashboard/orders?application_id=${gigAppId}`
            : `/dashboard/applications?application_id=${gigAppId}`;
        } else {
          redirectUrl = refId ? `/dashboard/my-projects?contract_id=${refId}` : "/dashboard/my-projects";
        }
      }
      
      window.location.href = redirectUrl;
    } catch (e) {
      console.error("Failed to mark notification as read and redirect:", e);
      window.location.href = "/dashboard";
    }
  };

  const getCategoryLink = (catName: string, subCatName: string) => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/projects")) {
        return `/projects?category=${encodeURIComponent(catName)}&subcategory=${encodeURIComponent(subCatName)}`;
      } else if (path.startsWith("/talent")) {
        return `/talent?category=${encodeURIComponent(catName)}&subcategory=${encodeURIComponent(subCatName)}`;
      }
    }
    return `/gigs?category=${encodeURIComponent(catName)}&subcategory=${encodeURIComponent(subCatName)}`;
  };

  const getCategoryOnlyLink = (catName: string) => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/projects")) {
        return `/projects?category=${encodeURIComponent(catName)}`;
      } else if (path.startsWith("/talent")) {
        return `/talent?category=${encodeURIComponent(catName)}`;
      }
    }
    return `/gigs?category=${encodeURIComponent(catName)}`;
  };


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("siteTheme") || "light";
      setSiteTheme(savedTheme);
      const primaryCol = localStorage.getItem("primaryColor") || "#0d9488";
      const secondaryCol = localStorage.getItem("secondaryColor") || "#06b6d4";
      import("@/utils/theme").then((mod) => {
        mod.applyTheme(savedTheme, primaryCol, secondaryCol);
      });

      setSiteLogo(localStorage.getItem("cached_site_logo") || "");
      setSiteLogoDark(localStorage.getItem("cached_site_logo_dark") || "");
      setSiteName(localStorage.getItem("cached_site_name") || "");
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (token) {
        let name = "";
        let lastName = "";
        let profileImg = "";
        let email = "";
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.first_name) {
              name = user.first_name;
            } else if (user.display_name) {
              name = user.display_name;
            } else if (user.name) {
              name = user.name;
            }
            if (user.last_name) {
              lastName = user.last_name;
            }
            if (user.profile_image) {
              profileImg = user.profile_image;
            }
            if (user.email) {
              email = user.email;
            }
            if (user.role) {
              setUserRole(user.role);
            }
            if (user.slug) {
              setUserSlug(user.slug);
            }
          } catch (e) {
            console.error("Failed to parse user in header:", e);
          }
        }
        setTimeout(() => {
          setIsLoggedIn(true);
          if (name) {
            setUserFirstName(name);
          }
          if (lastName) {
            setUserLastName(lastName);
          }
          if (profileImg) {
            setUserProfileImage(profileImg);
          }
          if (email) {
            setUserEmail(email);
          }
        }, 0);
      }
    }

    const fetchPagesList = async () => {
      try {
        const res = await fetch(`${API_URL}/pages`);
        if (res.ok) {
          const data = await res.json();
          setCmsPages(data);
        }
      } catch (err) {
        console.error("Failed to fetch public CMS pages in Header:", err);
      }
    };
    fetchPagesList();

    const fetchTaxonomies = async () => {
      try {
        const catRes = await fetch(`${API_URL}/admin/categories`);
        const subRes = await fetch(`${API_URL}/admin/sub-categories`);
        if (catRes.ok && subRes.ok) {
          const cats = await catRes.json();
          const subs = await subRes.json();
          const activeCats = cats.filter((c: any) => c.status === "Active" || c.status === "active" || c.status === 1 || c.status === true || c.status === "true");
          setCategories(activeCats);
          setSubcategories(subs.filter((s: any) => s.status === "Active" || s.status === "active" || s.status === 1 || s.status === true || s.status === "true"));
          if (activeCats.length > 0) {
            setHoveredCategoryId(activeCats[0].category_id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch taxonomies in Header:", err);
      }
    };
    fetchTaxonomies();

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          let loadedTheme = siteTheme;
          let loadedPrimary = localStorage.getItem("primaryColor") || "#0d9488";
          let loadedSecondary = localStorage.getItem("secondaryColor") || "#06b6d4";

          const formatHex = (colorStr: string, fallback: string) => {
            if (!colorStr) return fallback;
            const trimmed = colorStr.trim();
            if (trimmed.startsWith("#")) return trimmed;
            if (/^[0-9A-Fa-f]{3,8}$/.test(trimmed)) return "#" + trimmed;
            return trimmed;
          };

          data.forEach((setting: any) => {
            let val = setting.setting_value;
            if (typeof val === "string") {
              try {
                const trimmed = val.trim();
                if (trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed === "true" || trimmed === "false" || (!isNaN(Number(trimmed)) && trimmed !== "")) {
                  val = JSON.parse(val);
                }
              } catch (e) {}
            }

            if (setting.setting_key === "site_settings") {
              if (val?.site_logo) {
                setSiteLogo(val.site_logo);
                localStorage.setItem("cached_site_logo", val.site_logo);
              }
              if (val?.site_logo_dark) {
                setSiteLogoDark(val.site_logo_dark);
                localStorage.setItem("cached_site_logo_dark", val.site_logo_dark);
              }
              if (val?.site_name) {
                setSiteName(val.site_name);
                localStorage.setItem("cached_site_name", val.site_name);
              }
            } else if (setting.setting_key === "primary_color") {
              const rawColor = typeof val === "string" ? val : (val?.color || val?.primary_color);
              if (rawColor) {
                loadedPrimary = formatHex(rawColor, "#0f766e");
                localStorage.setItem("primaryColor", loadedPrimary);
              }
            } else if (setting.setting_key === "secondary_color") {
              const rawColor = typeof val === "string" ? val : (val?.color || val?.secondary_color);
              if (rawColor) {
                loadedSecondary = formatHex(rawColor, "#06b6d4");
                localStorage.setItem("secondaryColor", loadedSecondary);
              }
            } else if (setting.setting_key === "theme") {
              const themeVal = typeof val === "string" ? val : val?.theme;
              if (themeVal) {
                loadedTheme = themeVal;
                localStorage.setItem("siteTheme", loadedTheme);
                setSiteTheme(loadedTheme);
              }
            }
          });

          const { applyTheme } = await import("@/utils/theme");
          applyTheme(loadedTheme, loadedPrimary, loadedSecondary);
        }
      } catch (err) {
        console.error("Failed to load header brand settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleHeaderLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("onboarding_completed");
      localStorage.removeItem("onboarding_role");
      localStorage.removeItem("onboarding_step");
      window.location.href = "/";
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full bg-slate-100/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 z-[9999] px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section: Logo & Links */}
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div className="shrink-0">
              <a href="/" className="flex items-center gap-2 select-none py-2">
                <img
                  src={resolveLogoUrl(siteTheme === "dark" ? (siteLogoDark || siteLogo) : (siteLogo || siteLogoDark)) || resolveLogoUrl("/public/images/onboard/file-1783600571599-686657795.png")}
                  alt={siteName || "Buy2Lancer"}
                  className="h-8 w-auto max-w-[180px] object-contain shrink-0"
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              </a>
            </div>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-4">
              {/* Home Dropdown Link */}
              <div className="relative group/home py-2">
                <a
                  href="/"
                  className={`font-bold text-sm leading-none transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                    isHome1Active || isHome2Active || isHome3Active
                      ? "text-teal-700 dark:text-teal-400 font-black"
                      : "text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-teal-400"
                  }`}
                >
                  {t("nav_home", "Home")}
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-450 transition-transform duration-250 group-hover/home:rotate-180" />
                </a>

                {/* Home Variations Dropdown Options on Hover */}
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-slate-200/85 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 opacity-0 invisible group-hover/home:opacity-100 group-hover/home:visible transition-all duration-200 z-50">
                  <a
                    href="/"
                    className={`flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
                      isHome1Active
                        ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-teal-600 dark:hover:text-teal-400"
                    }`}
                  >
                    {t("home_1_default", "Home 1 (Default)")}
                    {isHome1Active && <span className="text-teal-600 dark:text-teal-400 font-black">✓</span>}
                  </a>
                  <a
                    href="/home-2"
                    className={`flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
                      isHome2Active
                        ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-teal-600 dark:hover:text-teal-400"
                    }`}
                  >
                    {t("home_2", "Home 2")}
                    {isHome2Active && <span className="text-teal-600 dark:text-teal-400 font-black">✓</span>}
                  </a>
                  <a
                    href="/home-3"
                    className={`flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
                      isHome3Active
                        ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-teal-600 dark:hover:text-teal-400"
                    }`}
                  >
                    {t("home_3", "Home 3")}
                    {isHome3Active && <span className="text-teal-600 dark:text-teal-400 font-black">✓</span>}
                  </a>
                </div>
              </div>

              {/* Categories Dropdown (Triggers mega dropdown on hover) */}
              <div className="group/mega py-2">
                <button className="text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-teal-400 font-bold text-sm leading-none transition-all duration-200 flex items-center gap-1 cursor-pointer">
                  {t("nav_categories", "Categories")}
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-450 transition-transform duration-250 group-hover/mega:rotate-180" />
                </button>

                {/* MEGA MENU DROPDOWN PANEL (Matches Header bg-slate-100/95) */}
                <div className="absolute left-0 right-0 w-full mt-3 bg-slate-100/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-b border-slate-200 dark:border-zinc-800 shadow-2xl opacity-0 invisible group-hover/mega:opacity-100 group-hover/mega:visible transition-all duration-200 z-50 animate-fadeIn overflow-hidden">
                  <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6 relative z-10">
                    
                    {/* Horizontal row of Categories */}
                    <div className="flex flex-row flex-wrap gap-x-5 gap-y-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
                      {categories.map((cat) => {
                        const isHovered = hoveredCategoryId === cat.category_id;
                        return (
                          <a
                            key={cat.category_id}
                            href={getCategoryOnlyLink(cat.category_name)}
                            onMouseEnter={() => setHoveredCategoryId(cat.category_id)}
                            className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all duration-150 cursor-pointer ${
                              isHovered
                                ? "bg-primary text-white border border-primary/20 shadow-sm shadow-primary/5"
                                : "text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-primary border border-transparent"
                            }`}
                          >
                            {cat.category_name}
                          </a>
                        );
                      })}
                    </div>

                    {/* Subcategories of the hovered Category */}
                    <div className="min-h-[160px] text-left">
                      {hoveredCategoryId ? (
                        (() => {
                          const activeCat = categories.find((c) => c.category_id === hoveredCategoryId);
                          const catSubs = subcategories.filter(
                            (sub) => sub.category_id === hoveredCategoryId
                          );
                          return (
                            <div className="space-y-4">
                              <a
                                href={getCategoryOnlyLink(activeCat?.category_name || "")}
                                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity w-fit"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <h4 className="text-[13px] font-black text-slate-800 dark:text-zinc-100 uppercase tracking-widest">
                                  {activeCat?.category_name} Subcategories &rarr;
                                </h4>
                              </a>

                              {catSubs.length === 0 ? (
                                <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold italic py-4 pl-3">
                                  No sub-categories available in this category.
                                </p>
                              ) : (
                                <div className="grid grid-cols-5 gap-6">
                                  <div className="col-span-4 grid grid-cols-4 gap-4">
                                    {catSubs.map((sub) => (
                                      <a
                                        key={sub.sub_category_id}
                                        href={getCategoryLink(activeCat?.category_name || "", sub.sub_category_name)}
                                        className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-primary hover:bg-white dark:hover:bg-zinc-800 text-xs font-black transition-all flex items-center gap-2 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                                        <span>{sub.sub_category_name}</span>
                                      </a>
                                    ))}
                                  </div>
                                  <div className="col-span-1 bg-gradient-to-br from-white to-slate-50 dark:from-zinc-850 dark:to-zinc-800 border border-slate-200 dark:border-zinc-700/80 rounded-xl p-4.5 flex flex-col justify-between min-h-[140px] text-left shadow-sm">
                                    <div>
                                      <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-1">{t("promoted", "PROMOTED")}</span>
                                      <h5 className="text-xs font-black text-slate-800 dark:text-white leading-snug">{t("hire_expert_freelancers", "Hire Expert Freelancers")}</h5>
                                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold mt-1">{t("promoted_desc", "Get custom solutions tailored precisely to your budget and deadlines.")}</p>
                                    </div>
                                    <a href="/gigs" className="mt-3 bg-primary hover:bg-primary-hover text-white text-[10px] font-black text-center py-2.5 px-3 rounded-lg shadow-sm transition-all block w-full">
                                      {t("nav_gigs", "Explore Gigs")}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-zinc-500 gap-1.5 select-none">
                          <span>👆</span>
                          <p className="text-xs font-bold">{t("hover_category_prompt", "Hover over any category above to explore subcategories.")}</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <a
                href="/talent"
                onClick={handleTalentClick}
                className={`font-bold text-sm leading-none transition-all duration-200 ${
                  isTalentActive ? "text-teal-700 dark:text-teal-400 font-black underline underline-offset-4 decoration-2" : "text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-teal-400"
                }`}
              >
                {t("nav_talent", "Hire Freelancers")}
              </a>
              <a
                href="/projects"
                onClick={handleProjectsClick}
                className={`font-bold text-sm leading-none transition-all duration-200 ${
                  isProjectsActive ? "text-teal-700 dark:text-teal-400 font-black underline underline-offset-4 decoration-2" : "text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-teal-400"
                }`}
              >
                {t("nav_projects", "Find Projects")}
              </a>
              <a
                href="/gigs"
                className={`font-bold text-sm leading-none transition-all duration-200 ${
                  isGigsActive ? "text-teal-700 dark:text-teal-400 font-black underline underline-offset-4 decoration-2" : "text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-teal-400"
                }`}
              >
                {t("nav_gigs", "Explore Gigs")}
              </a>
              <a
                href="/blogs"
                className={`font-bold text-sm leading-none transition-all duration-200 ${
                  isBlogsActive ? "text-teal-700 dark:text-teal-400 font-black underline underline-offset-4 decoration-2" : "text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-teal-400"
                }`}
              >
                {t("nav_blogs", "Blogs")}
              </a>

            </nav>
          </div>

          {/* Right Section: CTAs */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Language Switcher */}
            <div className="relative group/lang">
              <button 
                className="hover:text-primary dark:hover:text-teal-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200/60 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 transition-all duration-200"
                style={{ color: siteTheme === "dark" ? "#e4e4e7" : "#334155" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                </svg>
                {lang}
              </button>
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-150 z-50 max-h-64 overflow-y-auto scrollbar-thin">
                {activeLanguages.map((l, idx) => (
                  <button
                    key={l.code || idx}
                    onClick={() => changeLanguage(l.code)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer hover:bg-slate-50 ${
                      lang === l.code ? "text-teal-700 bg-teal-50/50" : "text-slate-600"
                    }`}
                  >
                    {l.name} ({l.code})
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Switcher */}
            <div className="relative group/curr">
              <button 
                className="hover:text-primary dark:hover:text-teal-400 font-bold text-xs flex items-center gap-1 cursor-pointer bg-slate-100 dark:bg-zinc-900/80 hover:bg-slate-200/60 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/80 transition-all duration-200"
                style={{ color: siteTheme === "dark" ? "#e4e4e7" : "#334155" }}
              >
                <span className="font-extrabold text-primary dark:text-teal-400 mr-0.5">{currencySymbol}</span>
                {currency}
              </button>
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 opacity-0 invisible group-hover/curr:opacity-100 group-hover/curr:visible transition-all duration-150 z-50 max-h-64 overflow-y-auto scrollbar-thin">
                {currencies.map((c, idx) => (
                  <button
                    key={c.code || idx}
                    onClick={() => changeCurrency(c.code)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer hover:bg-slate-50 ${
                      currency === c.code ? "text-teal-700 bg-teal-50/50" : "text-slate-600"
                    }`}
                  >
                    <span className="text-teal-655 font-black mr-1">{c.symbol}</span> {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="text-slate-650 hover:text-teal-750 font-bold text-xs flex items-center justify-center cursor-pointer bg-slate-100 hover:bg-slate-200/60 p-1.5 rounded-xl border border-slate-200/50 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {siteTheme === "dark" ? (
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {isLoggedIn && (
              <NotificationsDropdown
                notifications={notifications}
                unreadNotificationsCount={unreadNotificationsCount}
                isNotificationsOpen={isNotificationsOpen}
                setIsNotificationsOpen={setIsNotificationsOpen}
                handleMarkAllRead={handleMarkAllRead}
                handleMarkSingleRead={handleMarkSingleRead}
                setActiveTab={() => { window.location.href = "/dashboard/notifications"; }}
              />
            )}

            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-1 py-1 focus:outline-none cursor-pointer border-none bg-transparent">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center font-extrabold text-white shadow-sm select-none shrink-0 text-[11px] relative">
                    <span className="text-[11px] font-extrabold text-white">
                      {userFirstName ? userFirstName.substring(0, 2).toUpperCase() : "US"}
                    </span>
                    {userProfileImage && (
                      <img
                        src={resolveLogoUrl(userProfileImage)}
                        alt="Avatar"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <span className="font-extrabold text-slate-800 text-sm select-none group-hover:text-primary transition-colors">
                    {userFirstName || "User"}
                  </span>
                </button>

                {/* Dropdown Menu (visible on hover) */}
                <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-[0_15px_50px_-15px_rgba(0,0,0,0.12)] p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left">
                  {/* User Badge */}
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate">
                      {userFirstName} {userLastName}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-400 capitalize truncate">
                      {userRole || "Member"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {/* Dashboard */}
                    <a href="/dashboard" className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-zinc-200 hover:bg-primary-light dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-primary font-bold rounded-xl transition-all duration-200 group/item">
                      <div className="flex items-center gap-2.5">
                        <FiGrid className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:text-primary" />
                        <span>{t("dashboard", "Dashboard")}</span>
                      </div>
                      <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-primary" />
                    </a>

                    {/* Refer & Earn */}
                    <a href="/dashboard?tab=referrals" className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-zinc-200 hover:bg-primary-light dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-primary font-bold rounded-xl transition-all duration-200 group/item">
                      <div className="flex items-center gap-2.5">
                        <FiGift className="w-4 h-4 text-amber-500 group-hover:text-primary" />
                        <span>{t("refer_and_earn", "Refer & Earn")}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                        Earn $
                      </span>
                    </a>

                    {/* Wishlist */}
                    <a href="/dashboard/wishlist" className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-zinc-200 hover:bg-primary-light dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-primary font-bold rounded-xl transition-all duration-200 group/item">
                      <div className="flex items-center gap-2.5">
                        <FiHeart className="w-4 h-4 text-rose-500 group-hover:text-primary" />
                        <span>{t("wishlist", "Wishlist")}</span>
                      </div>
                      <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-primary" />
                    </a>

                    {/* Wallet & Earnings */}
                    <a href="/dashboard?tab=wallet" className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-zinc-200 hover:bg-primary-light dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-primary font-bold rounded-xl transition-all duration-200 group/item">
                      <div className="flex items-center gap-2.5">
                        <FiCreditCard className="w-4 h-4 text-emerald-500 group-hover:text-primary" />
                        <span>{t("wallet_earnings", "Wallet & Earnings")}</span>
                      </div>
                      <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-primary" />
                    </a>

                    {/* My Orders / Projects */}
                    <a href={userRole === "client" ? "/dashboard?tab=orders" : "/dashboard?tab=proposals"} className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-zinc-200 hover:bg-primary-light dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-primary font-bold rounded-xl transition-all duration-200 group/item">
                      <div className="flex items-center gap-2.5">
                        <FiBriefcase className="w-4 h-4 text-indigo-500 group-hover:text-primary" />
                        <span>{userRole === "client" ? t("my_orders", "My Orders") : t("my_proposals", "My Proposals")}</span>
                      </div>
                      <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-primary" />
                    </a>

                    {/* Settings / Account */}
                    <a href="/dashboard?tab=settings" className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-zinc-200 hover:bg-primary-light dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-primary font-bold rounded-xl transition-all duration-200 group/item">
                      <div className="flex items-center gap-2.5">
                        <FiSettings className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:text-primary" />
                        <span>{t("account_settings", "Account Settings")}</span>
                      </div>
                      <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-primary" />
                    </a>

                    {/* View Freelancer Profile (If applicable) */}
                    {userRole === "freelancer" && userSlug && (
                      <a href={`/freelancer/${userSlug}`} className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-700 dark:text-zinc-200 hover:bg-primary-light dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-primary font-bold rounded-xl transition-all duration-200 group/item">
                        <div className="flex items-center gap-2.5">
                          <FiExternalLink className="w-4 h-4 text-teal-500 group-hover:text-primary" />
                          <span>{t("view_public_profile", "Public Profile")}</span>
                        </div>
                        <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 text-primary" />
                      </a>
                    )}

                    <div className="h-px bg-slate-100 dark:bg-zinc-800 my-1 mx-2" />

                    {/* Logout */}
                    <button
                      onClick={handleHeaderLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold rounded-xl transition-all duration-200 cursor-pointer text-left border-none bg-transparent"
                    >
                      <FiLogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>{t("logout", "Logout")}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openLoginModal("/dashboard")}
                className="text-slate-650 hover:text-primary font-bold text-xs px-2 py-1 transition-all duration-200 cursor-pointer bg-transparent border-none"
              >
                {t("sign_in", "Sign in")}
              </button>
            )}
            {!isLoggedIn && (
              <button
                onClick={() => openLoginModal("/dashboard")}
                className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl transition-all duration-250 hover:shadow-lg hover:shadow-primary/20 transform active:scale-[0.98] cursor-pointer border-none"
              >
                {t("get_started", "Get Started")}
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn && (
              <a
                href="/dashboard/notifications"
                className="relative p-2 text-slate-500 hover:text-primary rounded-xl transition-all"
              >
                <FiBell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-extrabold leading-none text-white transform translate-x-1 -translate-y-1 bg-rose-600 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </a>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="text-slate-600 hover:text-primary p-2 rounded-lg hover:bg-slate-200/50 focus:outline-none transition-colors"
              aria-label="Toggle Menu"
            >
              {!isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>


      {/* Mobile Drawer menu */}
      <div
        className={`lg:hidden border-t border-slate-200 bg-slate-50 dark:bg-slate-900 absolute w-full left-0 top-full shadow-2xl transition-all duration-300 origin-top h-[calc(100vh-4rem)] overflow-y-auto z-50 ${
          isOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-4 pb-28 space-y-2 flex flex-col min-h-full">
          <div className="space-y-1 bg-slate-100 dark:bg-zinc-800 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700">
            <span className="block px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("home_variations", "Home Variations")}</span>
            <a
              href="/"
              className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                isHome1Active
                  ? "bg-teal-700 text-white font-extrabold shadow-sm"
                  : "text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-slate-200/60 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{t("home_1_default", "Home 1 (Default)")}</span>
              {isHome1Active && <span className="text-xs font-black">✓</span>}
            </a>
            <a
              href="/home-2"
              className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                isHome2Active
                  ? "bg-teal-700 text-white font-extrabold shadow-sm"
                  : "text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-slate-200/60 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{t("home_2", "Home 2")}</span>
              {isHome2Active && <span className="text-xs font-black">✓</span>}
            </a>
            <a
              href="/home-3"
              className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                isHome3Active
                  ? "bg-teal-700 text-white font-extrabold shadow-sm"
                  : "text-slate-800 dark:text-slate-200 hover:text-primary hover:bg-slate-200/60 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{t("home_3", "Home 3")}</span>
              {isHome3Active && <span className="text-xs font-black">✓</span>}
            </a>
          </div>

          <a
            href="/gigs"
            className={`font-bold px-4 py-2.5 rounded-lg text-base transition-all flex items-center justify-between ${
              isGigsActive
                ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold border-l-4 border-teal-600"
                : "text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Categories</span>
            {isGigsActive && <span className="text-xs font-black text-teal-600">●</span>}
          </a>
          <a
            href="/talent"
            onClick={handleTalentClick}
            className={`font-bold px-4 py-2.5 rounded-lg text-base transition-all flex items-center justify-between ${
              isTalentActive
                ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold border-l-4 border-teal-600"
                : "text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Hire Freelancers</span>
            {isTalentActive && <span className="text-xs font-black text-teal-600">●</span>}
          </a>
          <a
            href="/projects"
            onClick={handleProjectsClick}
            className={`font-bold px-4 py-2.5 rounded-lg text-base transition-all flex items-center justify-between ${
              isProjectsActive
                ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold border-l-4 border-teal-600"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Find Projects</span>
            {isProjectsActive && <span className="text-xs font-black text-teal-600">●</span>}
          </a>
          <a
            href="/gigs"
            className={`font-bold px-4 py-2.5 rounded-lg text-base transition-all flex items-center justify-between ${
              isGigsActive
                ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold border-l-4 border-teal-600"
                : "text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Explore Gigs</span>
            {isGigsActive && <span className="text-xs font-black text-teal-600">●</span>}
          </a>
          <a
            href="/blogs"
            className={`font-bold px-4 py-2.5 rounded-lg text-base transition-all flex items-center justify-between ${
              isBlogsActive
                ? "bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 font-extrabold border-l-4 border-teal-600"
                : "text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Blogs</span>
            {isBlogsActive && <span className="text-xs font-black text-teal-600">●</span>}
          </a>

          <hr className="border-slate-200 my-2" />

          {/* Mobile Switchers */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200/55 rounded-xl">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Language</label>
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-primary"
              >
                {activeLanguages.map((l, idx) => (
                  <option key={l.code || idx} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Currency</label>
              <select
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-primary"
              >
                {currencies.map((c, idx) => (
                  <option key={c.code || idx} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 items-center justify-center shrink-0 border-l border-slate-200 pl-3">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Theme</label>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center cursor-pointer shadow-sm mt-0.5"
              >
                {siteTheme === "dark" ? (
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <hr className="border-slate-200 my-2" />
          {isLoggedIn ? (
            <>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200/55 rounded-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                  {userFirstName ? userFirstName.substring(0, 2).toUpperCase() : "US"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Logged In As</p>
                  <p className="text-sm font-extrabold text-slate-800 truncate mt-1">{userFirstName || "User"}</p>
                </div>
              </div>
              <a href="/dashboard" className="text-primary font-bold px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
                {t("dashboard", "Go to Dashboard")}
              </a>
              <button
                onClick={handleHeaderLogout}
                className="text-rose-600 text-left font-bold px-4 py-2.5 rounded-lg text-base hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => openLoginModal("/dashboard")}
              className="text-slate-650 hover:text-primary font-bold text-base hover:bg-slate-200/50 transition-colors cursor-pointer text-left px-4 py-2.5 rounded-lg border-none bg-transparent"
            >
              {t("sign_in", "Sign in")}
            </button>
          )}
          {!isLoggedIn && (
            <button
              onClick={() => openLoginModal("/dashboard")}
              className="bg-primary hover:bg-primary-hover text-white text-center font-bold px-4 py-3.5 rounded-lg text-base shadow-md transition-all border-none cursor-pointer"
            >
              {t("get_started", "Get Started")}
            </button>
          )}
        </div>
      </div>
    </header>
    <div className="h-16 w-full shrink-0 pointer-events-none" />
    </>
  );
}
