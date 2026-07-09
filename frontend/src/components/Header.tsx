"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { FiZap, FiPlus, FiGrid, FiChevronDown, FiChevronRight, FiSearch } from "react-icons/fi";

export default function Header() {
  const { lang, currency, currencySymbol, activeLanguages, currencies, changeLanguage, changeCurrency, t } = useLanguage();
  const { openLoginModal } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (token) {
        let name = "";
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.first_name) {
              name = user.first_name;
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
        }, 0);
      }
    }

    const fetchPagesList = async () => {
      try {
        const res = await fetch("https://freelancer.sangvish.com/api/pages");
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
        const catRes = await fetch("https://freelancer.sangvish.com/api/admin/categories");
        const subRes = await fetch("https://freelancer.sangvish.com/api/admin/sub-categories");
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
    <header className="w-full bg-slate-100/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section: Logo & Links */}
          <div className="flex items-center gap-10">
            {/* Logo with Home Dropdown on hover */}
            <div className="relative group/home shrink-0">
              <a href="/" className="flex items-center gap-2 select-none py-2">
                {/* Logo Icon */}
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-750 font-extrabold shadow-sm shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-xl font-black tracking-tight font-display flex items-baseline gap-0.5">
                  <span className="text-slate-800">Buy2</span>
                  <span className="text-teal-700">Lancer</span>
                </span>
              </a>

              {/* Home Dropdown Options on Hover */}
              <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200/85 rounded-xl shadow-xl py-1.5 opacity-0 invisible group-hover/home:opacity-100 group-hover/home:visible transition-all duration-200 z-50">
                <a href="/" className="block px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-primary font-bold transition-colors">
                  Home Landing
                </a>
                <a href="/dashboard" className="block px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-primary font-bold transition-colors">
                  Dashboard
                </a>
                <a href="/admin/login" className="block px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-primary font-bold transition-colors">
                  Admin Portal
                </a>
              </div>
            </div>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-7">
              {/* Categories Dropdown (Triggers mega dropdown on hover) */}
              <div className="group/mega py-2">
                <button className="text-slate-700 hover:text-primary font-bold text-sm leading-none transition-all duration-200 flex items-center gap-1 cursor-pointer">
                  Categories
                  <FiChevronDown className="w-3.5 h-3.5 text-slate-450 transition-transform duration-250 group-hover/mega:rotate-180" />
                </button>

                {/* MEGA MENU DROPDOWN PANEL (Viewport Edge-to-Edge Screen Width - Matches Header bg-slate-100/95) */}
                <div className="absolute left-0 right-0 w-screen mt-3 bg-slate-100/95 backdrop-blur-md border-t border-b border-slate-200 shadow-2xl opacity-0 invisible group-hover/mega:opacity-100 group-hover/mega:visible transition-all duration-200 z-50 animate-fadeIn overflow-hidden">
                  <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-6 relative z-10">
                    
                    {/* Horizontal row of Categories */}
                    <div className="flex flex-row flex-wrap gap-x-5 gap-y-3 border-b border-slate-200 pb-4">
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
                                : "text-slate-655 hover:bg-white hover:text-primary border border-transparent"
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
                                <h4 className="text-[13px] font-black text-slate-855 uppercase tracking-widest">
                                  {activeCat?.category_name} Subcategories &rarr;
                                </h4>
                              </a>

                              {catSubs.length === 0 ? (
                                <p className="text-slate-400 text-xs font-bold italic py-4 pl-3">
                                  No sub-categories available in this category.
                                </p>
                              ) : (
                                <div className="grid grid-cols-5 gap-6">
                                  <div className="col-span-4 grid grid-cols-4 gap-4">
                                    {catSubs.map((sub) => (
                                      <a
                                        key={sub.sub_category_id}
                                        href={getCategoryLink(activeCat?.category_name || "", sub.sub_category_name)}
                                        className="px-4 py-2.5 rounded-xl text-slate-605 hover:text-primary hover:bg-white text-xs font-black transition-all flex items-center gap-2 border border-transparent hover:border-slate-200"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                                        <span>{sub.sub_category_name}</span>
                                      </a>
                                    ))}
                                  </div>
                                  <div className="col-span-1 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between min-h-[140px] text-left shadow-sm">
                                    <div>
                                      <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-1">PROMOTED</span>
                                      <h5 className="text-xs font-black text-slate-800 leading-snug">Hire Expert Freelancers</h5>
                                      <p className="text-[10px] text-slate-500 font-bold mt-1">Get custom solutions tailored precisely to your budget and deadlines.</p>
                                    </div>
                                    <a href="/gigs" className="mt-3 bg-primary hover:bg-primary-hover text-white text-[10px] font-black text-center py-2.5 px-3 rounded-lg shadow-sm transition-all block w-full">
                                      Explore Gigs
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-1.5 select-none">
                          <span>👆</span>
                          <p className="text-xs font-bold">Hover over any category above to explore subcategories.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <a href="/talent" className="text-slate-700 hover:text-primary font-bold text-sm leading-none transition-all duration-200">
                Hire Freelancers
              </a>
              <a href="/projects" className="text-slate-700 hover:text-primary font-bold text-sm leading-none transition-all duration-200">
                Find Projects
              </a>
              <a href="/gigs" className="text-slate-700 hover:text-primary font-bold text-sm leading-none transition-all duration-200">
                Explore Gigs
              </a>

            </nav>
          </div>

          {/* Right Section: CTAs */}
          <div className="hidden lg:flex items-center gap-5">
            {/* Language Switcher */}
            <div className="relative group/lang">
              <button className="text-slate-650 hover:text-teal-750 font-bold text-xs flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200/60 px-3 py-2 rounded-xl border border-slate-200/50 transition-all duration-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                </svg>
                <span>{lang}</span>
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
              <button className="text-slate-650 hover:text-teal-750 font-bold text-xs flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200/60 px-3 py-2 rounded-xl border border-slate-200/50 transition-all duration-200">
                <span className="font-extrabold text-teal-700 mr-0.5">{currencySymbol}</span>
                <span>{currency}</span>
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

            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-2 focus:outline-none cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center font-extrabold text-white shadow-sm transition-transform duration-200 hover:scale-105 select-none">
                    {userFirstName ? userFirstName.substring(0, 2).toUpperCase() : "US"}
                  </div>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown Menu (visible on hover) */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/85 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Welcome</p>
                    <p className="text-sm font-black text-slate-800 truncate mt-1">{userFirstName || "User"}</p>
                  </div>
                  <a href="/dashboard" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary font-bold transition-colors">
                    {t("dashboard", "Go to Dashboard")}
                  </a>
                  <button
                    onClick={handleHeaderLogout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openLoginModal("/dashboard")}
                className="text-slate-650 hover:text-primary font-bold text-sm transition-all duration-200 cursor-pointer bg-transparent border-none"
              >
                {t("sign_in", "Sign in")}
              </button>
            )}
            <button
              onClick={() => openLoginModal("/dashboard")}
              className="bg-primary hover:bg-primary-hover text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all duration-250 hover:shadow-lg hover:shadow-primary/20 transform active:scale-[0.98] cursor-pointer border-none"
            >
              {t("get_started", "Get Started")}
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden">
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
        className={`lg:hidden border-t border-slate-200 bg-slate-100 absolute w-full left-0 top-full shadow-lg transition-all duration-300 origin-top ${
          isOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-3 flex flex-col">
          <a href="/" className="bg-primary-light text-primary font-bold px-4 py-2.5 rounded-lg text-base">
            {t("home", "Home")}
          </a>
          <a href="/about-us" className="text-slate-600 hover:text-primary font-medium px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
            {t("about_us", "About us")}
          </a>
          <a href="/faq" className="text-slate-600 hover:text-primary font-medium px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
            {t("faq", "FAQ")}
          </a>
          <a href="/terms-conditions" className="text-slate-600 hover:text-primary font-medium px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
            {t("terms_conditions", "Terms & condition")}
          </a>

          {/* Dynamic Custom CMS Pages list (excluding already mapped static ones to keep drawer clean) */}
          {cmsPages.filter(p => !["about-us", "faq", "terms-conditions"].includes(p.slug)).map((page, pIdx) => (
            <a
              key={pIdx}
              href={`/${page.slug}`}
              className="text-slate-600 hover:text-primary font-medium px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors"
            >
              {page.title}
            </a>
          ))}

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
          </div>

          <hr className="border-slate-200 my-2" />
          {isLoggedIn ? (
            <>
              <div className="px-4 py-2 bg-slate-50 border border-slate-200/55 rounded-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
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
          <button
            onClick={() => openLoginModal("/dashboard")}
            className="bg-primary hover:bg-primary-hover text-white text-center font-bold px-4 py-3.5 rounded-lg text-base shadow-md transition-all border-none cursor-pointer"
          >
            {t("get_started", "Get Started")}
          </button>
        </div>
      </div>
    </header>
  );
}
