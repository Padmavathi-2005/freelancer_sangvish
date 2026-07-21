"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminProvider, useAdmin } from "./AdminContext";
import { FiMenu, FiX, FiBell, FiAlertTriangle, FiCheckCircle, FiUser, FiLayers, FiSettings, FiDollarSign, FiBriefcase, FiZap, FiUsers, FiClipboard, FiCreditCard, FiFileText, FiGlobe, FiHardDrive } from "react-icons/fi";
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

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isAuthenticated,
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    adminUser,
    projectMenuOpen,
    setProjectMenuOpen,
    gigMenuOpen,
    setGigMenuOpen,
    settingsMenuOpen,
    setSettingsMenuOpen,
    pendingVettingCount,
    activeDisputesCount,
    adminTheme,
    setAdminTheme,
    usersList = [],
    adminWalletStats = null,
    adminNotifications = [],
    setAdminNotifications,
    setHighlightedDisputeId,
    transactionsSubTab,
    setTransactionsSubTab,
    categoriesSubTab,
    setCategoriesSubTab,
    projectsSubTab,
    setProjectsSubTab,
  } = useAdmin();

  const [isAdminNotificationsOpen, setIsAdminNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [siteLogo, setSiteLogo] = useState("");
  const [siteName, setSiteName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [marketingMenuOpen, setMarketingMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setSiteLogo(localStorage.getItem("cached_site_logo") || "");
      setSiteName(localStorage.getItem("cached_site_name") || "");
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            if (setting.setting_key === "site_settings") {
              let val = setting.setting_value;
              if (typeof val === "string") {
                try {
                  val = JSON.parse(val);
                } catch (e) {}
              }
              if (val?.site_logo) {
                setSiteLogo(val.site_logo);
                localStorage.setItem("cached_site_logo", val.site_logo);
              }
              if (val?.site_name) {
                setSiteName(val.site_name);
                localStorage.setItem("cached_site_name", val.site_name);
              }
            }
          });
        }
      } catch (err) {
        console.error("Failed to load layout brand settings", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAdminNotificationsOpen(false);
      }
    };
    if (isAdminNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAdminNotificationsOpen]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/admin/login";
    }
  };

  const isDark = adminTheme === "dark";

  useEffect(() => {
    if (activeTab === "general_settings" || activeTab === "site_settings" || activeTab === "site_management" || activeTab === "payment_settings" || activeTab === "frontend_content" || activeTab === "dispute_reasons" || activeTab === "footer_links" || activeTab === "social_login") {
      setSettingsMenuOpen(true);
      setProjectMenuOpen(false);
      setGigMenuOpen(false);
      setMarketingMenuOpen(false);
    } else if (activeTab === "projects" || activeTab === "project_orders") {
      setProjectMenuOpen(true);
      setGigMenuOpen(false);
      setSettingsMenuOpen(false);
      setMarketingMenuOpen(false);
    } else if (activeTab === "gigs_list" || activeTab === "gig_orders") {
      setGigMenuOpen(true);
      setProjectMenuOpen(false);
      setSettingsMenuOpen(false);
      setMarketingMenuOpen(false);
    } else if (activeTab === "search_logs" || activeTab === "seo_settings") {
      setMarketingMenuOpen(true);
      setSettingsMenuOpen(false);
      setProjectMenuOpen(false);
      setGigMenuOpen(false);
    }
  }, [activeTab]);

  const containerClass = `w-full min-h-screen flex flex-col lg:flex-row max-w-full relative lg:h-screen lg:overflow-hidden ${
    isDark ? "dark bg-slate-900 text-slate-100" : "light bg-slate-50 text-slate-800"
  }`;

  const sidebarClass = `fixed lg:static inset-y-0 left-0 w-64 shrink-0 flex flex-col h-screen lg:h-screen z-45 transition-transform duration-300 transform lg:transform-none ${
    isDark ? "bg-slate-950 border-r border-slate-800" : "bg-white border-r border-slate-200"
  } ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`;

  const sidebarHeaderClass = `h-16 px-6 flex items-center justify-between shrink-0 ${
    isDark ? "border-b border-slate-800" : "border-b border-slate-200"
  }`;

  const sidebarTitleClass = `text-xl font-extrabold tracking-tight ${
    isDark ? "text-teal-400" : "text-teal-750"
  }`;

  const closeSidebarBtnClass = `p-1.5 rounded-lg lg:hidden cursor-pointer flex items-center justify-center border ${
    isDark
      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-slate-800 bg-slate-950"
      : "text-slate-500 hover:text-slate-850 hover:bg-slate-100 border-slate-200 bg-slate-50"
  }`;

  const profileCardClass = `p-4 flex items-center justify-between gap-3 select-none ${
    isDark ? "border-b border-slate-800 bg-slate-900/40" : "border-b border-slate-100 bg-slate-50/50"
  }`;

  const profileNameClass = `font-extrabold text-sm ${
    isDark ? "text-slate-200" : "text-slate-800"
  }`;

  const navClass = "flex-1 p-3 flex flex-col gap-1 select-none overflow-y-auto";

  const navBtnClass = (tabName: string, subTabs?: string[], forceActive?: boolean) => {
    const isActive = forceActive !== undefined ? forceActive : (activeTab === tabName || (subTabs && subTabs.includes(activeTab)));
    if (isActive) {
      return "w-full text-left px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2.5 bg-teal-700 text-white shadow-md shadow-teal-700/10";
    }
    return isDark
      ? "w-full text-left px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
      : "w-full text-left px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2.5 text-slate-500 hover:text-slate-850 hover:bg-slate-50";
  };

  const navDropdownHeaderClass = (menuOpen: boolean, tabs: string[]) => {
    const isActive = tabs.includes(activeTab);
    if (isActive) {
      return isDark
        ? "w-full text-left px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between bg-slate-900 text-slate-100 border border-slate-800"
        : "w-full text-left px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between bg-slate-100 text-slate-900 border border-slate-200/50";
    }
    return isDark
      ? "w-full text-left px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
      : "w-full text-left px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between text-slate-500 hover:text-slate-850 hover:bg-slate-50";
  };

  const subNavBtnClass = (tabName: string, subTabs?: string[], forceActive?: boolean) => {
    const isActive = forceActive !== undefined ? forceActive : (activeTab === tabName || (subTabs && subTabs.includes(activeTab)));
    if (isActive) {
      return isDark
        ? "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer bg-teal-500/10 text-teal-400"
        : "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer bg-teal-700/10 text-teal-700";
    }
    return isDark
      ? "w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
      : "w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer text-slate-500 hover:text-slate-850 hover:bg-slate-50";
  };

  const sidebarFooterClass = `p-4 border-t select-none shrink-0 ${
    isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
  }`;

  const headerClass = `h-16 w-full border-b px-6 lg:px-10 flex flex-row items-center justify-between gap-4 relative z-30 shrink-0 shadow-sm transition-colors duration-300 ${
    isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
  }`;

  const menuOpenBtnClass = `p-2 -ml-2 border rounded-xl transition-all cursor-pointer shadow-sm lg:hidden flex items-center justify-center w-9 h-9 ${
    isDark
      ? "text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-950"
      : "text-slate-500 hover:text-slate-800 border-slate-200 bg-white"
  }`;

  const headerTitleClass = `text-sm font-extrabold select-none flex items-center gap-2 ${
    isDark ? "text-slate-100" : "text-slate-900"
  }`;

  const statsCardClass = `border rounded-xl p-5 flex flex-col justify-between h-28 shadow-sm transition-colors duration-300 ${
    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-850"
  }`;

  const statsTitleClass = `text-[10px] font-bold uppercase tracking-widest ${
    isDark ? "text-slate-400" : "text-slate-500"
  }`;

  const statsValueClass = `text-2xl font-black ${
    isDark ? "text-slate-200" : "text-slate-900"
  }`;

  const statsSubValueClass = `text-xs font-semibold ${
    isDark ? "text-slate-400" : "text-slate-500"
  }`;

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isAuthenticated !== true) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm">Verifying administration access session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 lg:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Control Panel */}
      <aside className={sidebarClass}>
        <div className={sidebarHeaderClass}>
          <Link 
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-all cursor-pointer min-w-0"
          >
            {mounted && siteLogo ? (
              <img 
                src={resolveLogoUrl(siteLogo)} 
                alt={siteName || "Logo"} 
                className="h-8 w-auto object-contain shrink-0" 
              />
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  L
                </div>
                <span className="text-sm font-black tracking-tight text-slate-805 dark:text-teal-400 truncate">
                  {mounted && siteName ? siteName : "Freelancer Panel"}
                </span>
              </>
            )}
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={closeSidebarBtnClass}
              aria-label="Close sidebar"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className={profileCardClass}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256" 
                alt="Admin" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className={profileNameClass}>{adminUser?.full_name || "Admin Admin"}</div>
              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active
              </div>
            </div>
          </div>
        </div>

        <nav onClick={() => setIsSidebarOpen(false)} className={navClass}>
          {/* Group 1: Core Overview */}
          <div className="text-[9px] font-black tracking-widest uppercase text-slate-450 dark:text-slate-500 mt-1 mb-2 px-2.5 select-none">
            Core Overview
          </div>

          <button
            onClick={() => setActiveTab("profile")}
            className={navBtnClass("profile", ["overview"])}
          >
            <div className="flex items-center gap-3 w-full">
              <FiUser className="w-4 h-4 shrink-0" />
              <span>My profile</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={navBtnClass("users")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiUsers className="w-4 h-4 shrink-0" />
              <span>User Management</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("onboarding")}
            className={navBtnClass("onboarding")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiClipboard className="w-4 h-4 shrink-0" />
              <span>Onboarding directory</span>
            </div>
          </button>

          {/* Group 2: Marketplace */}
          <div className="text-[9px] font-black tracking-widest uppercase text-slate-450 dark:text-slate-500 mt-4 mb-2 px-2.5 select-none">
            Marketplace
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                const nextVal = !projectMenuOpen;
                setProjectMenuOpen(nextVal);
                if (nextVal) {
                  setGigMenuOpen(false);
                  setSettingsMenuOpen(false);
                }
              }}
              className={navDropdownHeaderClass(projectMenuOpen, ["projects", "project_orders"])}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <FiBriefcase className="w-4 h-4 shrink-0" />
                  <span>Project management</span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    projectMenuOpen || activeTab === "projects" || activeTab === "project_orders" ? "rotate-180" : ""
                  }`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {(projectMenuOpen || activeTab === "projects" || activeTab === "project_orders") && (
              <div className={`pl-6 flex flex-col gap-1 border-l ml-6 mt-1 mb-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <button
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectsSubTab("projects");
                  }}
                  className={subNavBtnClass("projects", [], activeTab === "projects" && projectsSubTab === "projects")}
                >
                  Project listings
                </button>
                <button
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectsSubTab("proposals");
                  }}
                  className={subNavBtnClass("projects", [], activeTab === "projects" && projectsSubTab === "proposals")}
                >
                  Project proposals
                </button>
                <button
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectsSubTab("maintenance");
                  }}
                  className={subNavBtnClass("projects", [], activeTab === "projects" && projectsSubTab === "maintenance")}
                >
                  Form Config
                </button>
                <button
                  onClick={() => setActiveTab("project_orders")}
                  className={subNavBtnClass("project_orders")}
                >
                  Project contracts
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                const nextVal = !gigMenuOpen;
                setGigMenuOpen(nextVal);
                if (nextVal) {
                  setProjectMenuOpen(false);
                  setSettingsMenuOpen(false);
                }
              }}
              className={navDropdownHeaderClass(gigMenuOpen, ["gigs_list", "gig_orders"])}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <FiZap className="w-4 h-4 shrink-0" />
                  <span>Gig management</span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    gigMenuOpen || activeTab === "gigs_list" || activeTab === "gig_orders" ? "rotate-180" : ""
                  }`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {(gigMenuOpen || activeTab === "gigs_list" || activeTab === "gig_orders") && (
              <div className={`pl-6 flex flex-col gap-1 border-l ml-6 mt-1 mb-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <button
                  onClick={() => setActiveTab("gigs_list")}
                  className={subNavBtnClass("gigs_list")}
                >
                  Gig listings
                </button>
                <button
                  onClick={() => setActiveTab("gig_orders")}
                  className={subNavBtnClass("gig_orders")}
                >
                  Gig contracts
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setActiveTab("taxonomies");
              setCategoriesSubTab("categories");
            }}
            className={navBtnClass("taxonomies")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiLayers className="w-4 h-4 shrink-0" />
              <span>Categories & Skills</span>
            </div>
          </button>

          <Link
            href="/admin/subscription-plans"
            className={navBtnClass("subscription_plans")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiLayers className="w-4 h-4 shrink-0" />
              <span>Subscription Plans</span>
            </div>
          </Link>

          {/* Group 3: Financials & Mediation */}
          <div className="text-[9px] font-black tracking-widest uppercase text-slate-450 dark:text-slate-500 mt-4 mb-2 px-2.5 select-none">
            Finance & Mediation
          </div>

          <button
            onClick={() => {
              setActiveTab("transactions");
              setTransactionsSubTab("transactions");
            }}
            className={navBtnClass("transactions", [], activeTab === "transactions" && transactionsSubTab !== "disputes")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiDollarSign className="w-4 h-4 shrink-0" />
              <span>Transaction & payments</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab("transactions");
              setTransactionsSubTab("disputes");
            }}
            className={navBtnClass("notifications", [], activeTab === "transactions" && transactionsSubTab === "disputes")}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <FiBell className="w-4 h-4 shrink-0" />
                <span>Disputes & Alerts</span>
              </div>
              {adminNotifications.filter((n: any) => !n.read).length > 0 && (
                <span className="bg-rose-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                  {adminNotifications.filter((n: any) => !n.read).length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("wallet_management")}
            className={navBtnClass("wallet_management")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiCreditCard className="w-4 h-4 shrink-0" />
              <span>Payouts & Wallets</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("referrals")}
            className={navBtnClass("referrals")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiUsers className="w-4 h-4 shrink-0" />
              <span>Referral Payouts</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("affiliate")}
            className={navBtnClass("affiliate")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiBriefcase className="w-4 h-4 shrink-0" />
              <span>Affiliate Payouts</span>
            </div>
          </button>

          {/* Group 3.5: Marketing & Discovery */}
          <div className="text-[9px] font-black tracking-widest uppercase text-slate-450 dark:text-slate-500 mt-4 mb-2 px-2.5 select-none">
            Marketing & SEO
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                const nextVal = !marketingMenuOpen;
                setMarketingMenuOpen(nextVal);
                if (nextVal) {
                  setProjectMenuOpen(false);
                  setGigMenuOpen(false);
                  setSettingsMenuOpen(false);
                }
              }}
              className={navDropdownHeaderClass(marketingMenuOpen, ["search_logs", "seo_settings"])}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <FiGlobe className="w-4 h-4 shrink-0" />
                  <span>Marketing & SEO</span>
                </div>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    marketingMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {marketingMenuOpen && (
              <div className="pl-4 flex flex-col gap-1 mt-1 border-l border-slate-200/60 dark:border-slate-800 ml-4.5">
                <button
                  onClick={() => setActiveTab("search_logs")}
                  className={subNavBtnClass("search_logs")}
                >
                  Search Analytics
                </button>
                <button
                  onClick={() => setActiveTab("seo_settings")}
                  className={subNavBtnClass("seo_settings")}
                >
                  SEO & Meta Preview
                </button>
              </div>
            )}
          </div>

          {/* Group 4: Site Content & Settings */}
          <div className="text-[9px] font-black tracking-widest uppercase text-slate-450 dark:text-slate-500 mt-4 mb-2 px-2.5 select-none">
            Content & Settings
          </div>

          <button
            onClick={() => setActiveTab("cms_pages")}
            className={navBtnClass("cms_pages")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiFileText className="w-4 h-4 shrink-0" />
              <span>CMS Pages</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("blogs")}
            className={navBtnClass("blogs")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiFileText className="w-4 h-4 shrink-0" />
              <span>Manage Blogs</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={navBtnClass("settings", ["general_settings", "site_settings", "email_settings", "frontend_content", "footer_links", "social_login", "payment_settings", "dispute_reasons", "seo_settings"])}
          >
            <div className="flex items-center gap-3 w-full">
              <FiSettings className="w-4 h-4 shrink-0" />
              <span>System Settings</span>
            </div>
          </button>

          {/* Group 5: System Maintenance */}
          <div className="text-[9px] font-black tracking-widest uppercase text-rose-500/80 dark:text-rose-450/70 mt-4 mb-2 px-2.5 select-none">
            System & Maintenance
          </div>

          <button
            onClick={() => {
              setActiveTab("languages");
            }}
            className={navBtnClass("languages")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiGlobe className="w-4 h-4 shrink-0" />
              <span>Languages & Currencies</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab("cleanup");
            }}
            className={navBtnClass("cleanup")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiAlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Database Cleanup</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab("backups");
            }}
            className={navBtnClass("backups")}
          >
            <div className="flex items-center gap-3 w-full">
              <FiHardDrive className="w-4 h-4 shrink-0" />
              <span>DB Backups</span>
            </div>
          </button>
        </nav>

        <div className={sidebarFooterClass}>
          <button
            onClick={handleLogout}
            className={`w-full text-center py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
              isDark
                ? "text-rose-400 hover:text-rose-300 bg-rose-950/20 border-rose-900/60 hover:bg-rose-900/40"
                : "text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200/60 hover:bg-rose-100"
            }`}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col max-w-full lg:h-screen lg:overflow-hidden relative z-10">
        
        {/* Dashboard Top Header Bar */}
        <header className={headerClass}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={menuOpenBtnClass}
              aria-label="Open sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>

            <h1 className={headerTitleClass}>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                isDark ? "bg-teal-950/80 text-teal-400 border border-teal-900" : "bg-teal-50 text-teal-750 border border-teal-200"
              }`}>Admin</span>
              Control Terminal
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsAdminNotificationsOpen(!isAdminNotificationsOpen)}
                className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center relative ${
                  isDark 
                    ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800" 
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
                aria-label="Toggle notifications"
              >
                <FiBell className="w-4 h-4" />
                {adminNotifications.filter((n: any) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                    {adminNotifications.filter((n: any) => !n.read).length}
                  </span>
                )}
              </button>

              {isAdminNotificationsOpen && (
                <div className={`absolute right-0 mt-3 w-[23rem] rounded-xl border shadow-xl p-4 flex flex-col gap-3 select-none animate-fadeIn ${
                  isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
                }`}>
                  <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-850">
                    <span className="text-xs font-black uppercase tracking-wider">Mediation Center</span>
                    <button
                      onClick={() => {
                        setAdminNotifications((prev: any) => prev.map((n: any) => ({ ...n, read: true })));
                      }}
                      className="text-[10px] font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2 pr-2">
                    {adminNotifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No dispute notifications.</p>
                    ) : (
                      adminNotifications.map((notif: any) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            // Mark single as read
                            setAdminNotifications((prev: any) => prev.map((n: any) => n.id === notif.id ? { ...n, read: true } : n));
                            setIsAdminNotificationsOpen(false);

                            // Navigate to target Tab
                            if (notif.targetTab === "transactions") {
                              setActiveTab("transactions");
                              if (notif.targetSubTab === "disputes") {
                                setTransactionsSubTab("disputes");
                              }
                              setHighlightedDisputeId(notif.targetId);
                            } else if (notif.targetTab === "onboarding") {
                              setActiveTab("onboarding");
                            } else if (notif.targetTab === "projects") {
                              setActiveTab("projects");
                              if (notif.targetSubTab === "proposals") {
                                setProjectsSubTab("proposals");
                              }
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-row items-start gap-3.5 ${
                            notif.read
                              ? (isDark ? "bg-slate-900/25 border-slate-850" : "bg-slate-50 border-slate-200/65")
                              : (isDark ? "bg-teal-950/20 border-teal-900" : "bg-teal-50/80 border-teal-200/80")
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.targetTab === "transactions"
                              ? "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                              : "bg-teal-500/10 border border-teal-500/20 text-teal-600"
                          }`}>
                            {notif.targetTab === "transactions" ? (
                              <FiAlertTriangle className="w-4 h-4" />
                            ) : (
                              <FiUser className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className={`text-[10px] font-black flex items-center justify-between gap-2 ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}>
                              <span className="truncate">{notif.title}</span>
                              <span className="shrink-0">{notif.timestamp}</span>
                            </span>
                            <p className={`text-xs leading-relaxed mt-1.5 ${
                              notif.read
                                ? (isDark ? "text-slate-400 font-bold" : "text-slate-500 font-semibold")
                                : (isDark ? "text-slate-200 font-black" : "text-slate-800 font-extrabold")
                            }`}>{notif.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const nextTheme = adminTheme === "light" ? "dark" : "light";
                setAdminTheme(nextTheme);
              }}
              className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800" 
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                // Sun Icon (Solid)
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                // Moon Icon (Solid)
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 text-[10px] shadow-sm select-none transition-all duration-300 ${
              isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200/80 text-slate-600"
            }`}>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-bold">Secure</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative w-full flex flex-col gap-8">
          
          {/* Stats metrics widgets row */}
          {pathname === "/admin" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={statsCardClass}>
                <span className={statsTitleClass}>Active Talent Pool</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={statsValueClass}>
                    {usersList.filter((u: any) => u.freelancer_onboarding).length}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">Registered Contractors</span>
                </div>
              </div>
              
              <div className={statsCardClass}>
                <span className={statsTitleClass}>Vetting Applications</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={statsValueClass}>{pendingVettingCount}</span>
                  <span className={statsSubValueClass}>in review queue</span>
                </div>
              </div>

              <div className={statsCardClass}>
                <span className={statsTitleClass}>Escrow Holdings</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-2xl font-black ${isDark ? "text-teal-400" : "text-teal-700"}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(adminWalletStats?.totalEscrow || 0)}
                  </span>
                  <span className={statsSubValueClass}>held securely</span>
                </div>
              </div>

              <div className={statsCardClass}>
                <span className={statsTitleClass}>Dispute Cases</span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={statsValueClass}>{activeDisputesCount}</span>
                  <span className={`text-xs font-semibold ${activeDisputesCount > 0 ? "text-rose-500" : (isDark ? "text-slate-400" : "text-slate-500")}`}>
                    {activeDisputesCount > 0 ? "requires resolution" : "clear slate"}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Child pages content */}
          <section className="flex-1">
            {children}
          </section>

        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
