"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import { FiAward } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

// 5 distinct icon shapes to cycle through for company logos
const COMPANY_ICON_POOL = [
  <svg key="tri" className="w-5 h-5 text-slate-400/80 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z" /></svg>,
  <svg key="globe" className="w-5 h-5 text-slate-400/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><ellipse cx="12" cy="12" rx="8" ry="3" /></svg>,
  <svg key="info" className="w-5 h-5 text-slate-400/80 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>,
  <svg key="grid2" className="w-5 h-5 text-slate-400/80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="12" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="3" y="16" width="7" height="5" /></svg>,
  <svg key="umb" className="w-5 h-5 text-slate-400/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12m0 0a5 5 0 0 0 5-5H7a5 5 0 0 0 5 5zM12 12V6" /></svg>,
];

const FALLBACK_COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Netflix", "Stripe", "Airbnb"];

export default function Hero() {
  const { t } = useLanguage();
  const router = useRouter();

  const [heroContent, setHeroContent] = useState({
    hero_badge: "The Top 3% Global Freelancers",
    hero_title: "Hire Expert Freelancers For Your Next Big Project",
    hero_subtitle: "Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.",
    hero_search_placeholder: "What skill are you looking for?",
    hero_search_btn: "Search Talent",
    hero_popular_label: "Popular: UI Design, React, AI Automation, SEO",
  });

  const [companies, setCompanies] = useState<string[]>(FALLBACK_COMPANIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const skillsToType = ["UI Design", "React", "AI Automation", "SEO", "Next.js", "Python"];

  interface HeroFreelancer {
    name: string;
    professional_title: string;
    rating: number;
    hourly_rate: string | number;
    profile_image: string;
    slug: string;
  }

  const [topFreelancers, setTopFreelancers] = useState<HeroFreelancer[]>([
    {
      name: "Sarah J.",
      professional_title: "Senior UI Designer",
      rating: 4.9,
      hourly_rate: 85,
      profile_image: "/sarah-avatar.png",
      slug: "sarah-jenkins"
    },
    {
      name: "David M.",
      professional_title: "AI Engineer",
      rating: 5.0,
      hourly_rate: 120,
      profile_image: "/david-avatar.png",
      slug: "david-m"
    }
  ]);

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const getInitials = (name: string) => {
    if (!name) return "FL";
    const parts = name.replace(/\./g, "").trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const fetchTopFreelancers = async () => {
      try {
        const apiUrl = API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/freelancer/public/list`, {
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const freelancers = await res.json();
          if (Array.isArray(freelancers) && freelancers.length >= 2) {
            const sorted = freelancers.sort((a: any, b: any) => {
              const rA = parseFloat(a.rating || 0);
              const rB = parseFloat(b.rating || 0);
              if (rB !== rA) return rB - rA;
              return (b.completed_jobs || 0) - (a.completed_jobs || 0);
            });

            const formatted = sorted.slice(0, 2).map((f: any) => {
              let displayName = f.display_name || f.name;
              if (f.name && f.name.includes(" ")) {
                const parts = f.name.split(" ");
                displayName = `${parts[0]} ${parts[1].charAt(0)}.`;
              }
              return {
                name: displayName,
                professional_title: f.professional_title || "Freelancer Specialist",
                rating: parseFloat(f.rating || 0),
                hourly_rate: f.hourly_rate ? parseFloat(f.hourly_rate).toFixed(0) : "N/A",
                profile_image: f.profile_image 
                  ? (f.profile_image.startsWith("http") ? f.profile_image : `${apiUrl.replace("/api", "")}${f.profile_image.startsWith("/") ? f.profile_image : `/${f.profile_image}`}`)
                  : "",
                slug: f.slug || f.user_id.toString()
              };
            });
            setTopFreelancers(formatted);
          }
        }
      } catch {
        // Fallback silently to default top freelancers if backend is unreachable
      }
    };
    fetchTopFreelancers();
  }, []);

  const [siteTheme, setSiteTheme] = useState("light");

  // Sync theme changes in real-time
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("siteTheme") || "light";
      setSiteTheme(savedTheme);

      const handleStorageChange = () => {
        setSiteTheme(localStorage.getItem("siteTheme") || "light");
      };
      window.addEventListener("storage", handleStorageChange);

      const interval = setInterval(() => {
        const current = localStorage.getItem("siteTheme") || "light";
        if (current !== siteTheme) {
          setSiteTheme(current);
        }
      }, 300);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [siteTheme]);

  // Fetch hero settings from admin
  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const settings = await res.json();
          const heroSetting = settings.find((s: any) => s.setting_key === "frontend_hero_content");
          if (heroSetting) {
            let val = heroSetting.setting_value;
            if (typeof val === "string") {
              try { val = JSON.parse(val); } catch { }
            }
            if (val) {
              setHeroContent({
                hero_badge: val.hero_badge || "The Top 3% Global Freelancers",
                hero_title: val.hero_title || "Hire Expert Freelancers For Your Next Big Project",
                hero_subtitle: val.hero_subtitle || "Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.",
                hero_search_placeholder: val.hero_search_placeholder || "What skill are you looking for?",
                hero_search_btn: val.hero_search_btn || "Search Talent",
                hero_popular_label: val.hero_popular_label || "Popular: UI Design, React, AI Automation, SEO",
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to load hero settings:", e);
      }
    };
    fetchHeroSettings();
  }, []);

  // Fetch real client company names for ticker
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(`${API_URL}/client-companies`);
        if (res.ok) {
          const data: string[] = await res.json();
          if (data.length > 0) setCompanies(data);
        }
      } catch { }
    };
    fetchCompanies();
  }, []);

  // Typewriter effect
  useEffect(() => {
    let timer: any;
    const currentWord = skillsToType[currentWordIndex];

    if (isDeleting) {
      timer = setTimeout(() => setCurrentText((prev) => prev.slice(0, -1)), 50);
    } else {
      timer = setTimeout(() => setCurrentText((prev) => currentWord.slice(0, prev.length + 1)), 120);
    }

    if (!isDeleting && currentText === currentWord) {
      clearTimeout(timer);
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && currentText === "") {
      clearTimeout(timer);
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % skillsToType.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || skillsToType[currentWordIndex];
    window.location.href = `/talent?query=${encodeURIComponent(query)}`;
  };

  const handleQuickTagClick = (skill: string) => {
    setSearchQuery(skill);
  };

  return (
    <main className="flex-1 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 lg:h-[calc(100vh-80px)] lg:min-h-[560px] lg:max-h-[720px] flex flex-col justify-between z-10 px-4 sm:px-6 lg:px-8">

      {/* Animated gradient mesh blobs and grid overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 dark:opacity-30"></div>
        <div className="absolute -top-12 -left-12 w-96 h-96 bg-[#e6f0ef]/50 dark:bg-teal-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-75 animate-blob"></div>
        <div className="absolute top-1/4 -right-12 w-[30rem] h-[30rem] bg-teal-100/40 dark:bg-emerald-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-16 left-1/3 w-96 h-96 bg-emerald-100/30 dark:bg-teal-950/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center w-full relative z-10 max-w-[1600px] mx-auto pt-12 pb-8 lg:pt-16 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center w-full">

          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-3.5 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold bg-primary-light dark:bg-zinc-800 text-primary dark:text-white self-center lg:self-start border border-primary/20 dark:border-zinc-700/50 uppercase tracking-wider">
              <FiAward className="w-3.5 h-3.5 text-primary dark:text-white" />
              {t("hero_badge", heroContent.hero_badge)}
            </span>

            <h1 className="text-3xl sm:text-[2.5rem] lg:text-[2.85rem] xl:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white font-display whitespace-pre-line">
              {(() => {
                const titleText = t("hero_title", heroContent.hero_title);
                const highlight = "Expert Freelancers";
                if (titleText.includes(highlight)) {
                  const parts = titleText.split(highlight);
                  return (
                    <>
                      {parts[0]}
                      <span className="text-primary dark:text-white font-extrabold">{highlight}</span>
                      {parts[1]}
                    </>
                  );
                }
                return titleText;
              })()}
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
              {t("hero_subtitle", heroContent.hero_subtitle)}
            </p>

            {/* Search */}
            <form
              onSubmit={handleSearchSubmit}
              className="hero-search-form w-full max-w-xl mx-auto lg:mx-0 mt-2 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 shadow-xl shadow-slate-100 dark:shadow-none flex flex-col sm:flex-row gap-1.5 transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-2xl focus-within:shadow-primary/5"
            >
              <div className="flex-1 flex items-center px-3 gap-2.5 relative">
                <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={{ border: "none", outline: "none", boxShadow: "none" }}
                  className="w-full text-slate-800 dark:text-white text-sm sm:text-base border-none outline-none focus:outline-none focus:ring-0 shadow-none bg-transparent py-2.5 z-10"
                />
                {!isFocused && !searchQuery && (
                  <div className="absolute left-[38px] text-slate-400 dark:text-slate-350 text-sm sm:text-base pointer-events-none select-none z-0 flex items-center">
                    <span className="hidden sm:inline">{t("hero_search_placeholder", heroContent.hero_search_placeholder)}&nbsp;</span>
                    <span className="sm:hidden">{t("search", "Search")}&nbsp;</span>
                    <span className="text-slate-400/70 dark:text-slate-400 font-normal">e.g. </span>
                    <span className="text-primary dark:text-white font-semibold ml-1 relative">
                      {currentText}
                      <span className="absolute -right-[3px] top-[1.5px] bottom-[1.5px] w-[1.5px] bg-primary dark:bg-white animate-blink"></span>
                    </span>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all duration-200 shrink-0 active:scale-[0.98] cursor-pointer hover:shadow-lg"
              >
                {t("hero_search_btn", heroContent.hero_search_btn)}
              </button>
            </form>

            {/* Hot Skills */}
            <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
              <span>{t("hero_popular_label", heroContent.hero_popular_label).split(":")[0]}:</span>
              {(t("hero_popular_label", heroContent.hero_popular_label).includes(":")
                ? t("hero_popular_label", heroContent.hero_popular_label).split(":")[1]
                : t("hero_popular_label", heroContent.hero_popular_label)
              ).split(",").map(s => s.trim()).filter(Boolean).map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleQuickTagClick(skill)}
                  className="hover:text-white hover:bg-primary hover:border-primary border border-primary/20 dark:border-zinc-700 bg-primary-light dark:bg-zinc-800/80 text-primary dark:text-white px-3.5 py-1 rounded-full transition-all duration-150 active:scale-95 cursor-pointer dark:hover:bg-white dark:hover:text-slate-900 text-xs font-semibold"
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-5 relative w-full flex justify-center items-center py-2 lg:py-0">
            <div className="hero-mockup-container relative w-full aspect-[1.12] max-w-[290px] sm:max-w-[360px] xl:max-w-[395px] bg-[#042e2a] rounded-xl p-4 sm:p-6 flex items-center justify-center shadow-xl overflow-visible border border-transparent">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px] rounded-xl"></div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-teal-400/20 rounded-full filter blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-emerald-400/20 rounded-full filter blur-2xl pointer-events-none"></div>

              {/* Tablet Mockup */}
              <div className="relative w-[92%] aspect-[1.28] bg-slate-900 rounded-xl p-1 border-4 border-slate-950 shadow-xl overflow-hidden flex items-center justify-center">
                <div className="relative w-full h-full rounded overflow-hidden bg-slate-950">
                  <img src="/tablet-work.png" alt="Mockup Screen" className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#042e2a]/40 via-transparent to-transparent"></div>
                </div>
              </div>

              {/* Floating Card: 1st Pick */}
              {topFreelancers[0] && (
                <div className="absolute top-[12%] -left-2 sm:-left-6 md:-left-[10%] z-20 animate-float-up">
                  <div
                    onClick={() => router.push(`/freelancer/${topFreelancers[0].slug}`)}
                    className="hero-floating-card bg-white rounded-xl p-2.5 sm:p-3.5 shadow-lg flex items-center gap-2 sm:gap-3 w-[140px] sm:w-[190px] lg:w-[205px] transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer border border-slate-100"
                  >
                    {!topFreelancers[0].profile_image || imageErrors[topFreelancers[0].slug] ? (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-extrabold text-white shrink-0 text-xs shadow-sm select-none">
                        {getInitials(topFreelancers[0].name)}
                      </div>
                    ) : (
                      <img 
                        src={topFreelancers[0].profile_image} 
                        alt={topFreelancers[0].name} 
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/10 shrink-0"
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [topFreelancers[0].slug]: true }));
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-slate-900 text-xs truncate">{topFreelancers[0].name}</span>
                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 truncate">{topFreelancers[0].professional_title}</p>
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] font-bold">
                        <span className="text-primary flex items-center gap-0.5">★ <span className="text-slate-800">{topFreelancers[0].rating}</span></span>
                        <span className="text-slate-700">
                          {typeof topFreelancers[0].hourly_rate === 'number' || !isNaN(Number(topFreelancers[0].hourly_rate)) 
                            ? `$${parseFloat(topFreelancers[0].hourly_rate.toString()).toFixed(0)}/hr` 
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Card: 2nd Pick */}
              {topFreelancers[1] && (
                <div className="absolute bottom-[14%] -right-2 sm:-right-6 md:-right-[10%] z-20 animate-float-up">
                  <div
                    onClick={() => router.push(`/freelancer/${topFreelancers[1].slug}`)}
                    className="hero-floating-card bg-white rounded-xl p-2.5 sm:p-3.5 shadow-lg flex items-center gap-2 sm:gap-3 w-[140px] sm:w-[190px] lg:w-[205px] transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer border border-slate-100"
                  >
                    {!topFreelancers[1].profile_image || imageErrors[topFreelancers[1].slug] ? (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-extrabold text-white shrink-0 text-xs shadow-sm select-none">
                        {getInitials(topFreelancers[1].name)}
                      </div>
                    ) : (
                      <img 
                        src={topFreelancers[1].profile_image} 
                        alt={topFreelancers[1].name} 
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/10 shrink-0"
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [topFreelancers[1].slug]: true }));
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-slate-900 text-xs truncate">{topFreelancers[1].name}</span>
                        <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 truncate">{topFreelancers[1].professional_title}</p>
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] font-bold">
                        <span className="text-primary flex items-center gap-0.5">★ <span className="text-slate-800">{topFreelancers[1].rating}</span></span>
                        <span className="text-slate-700">
                          {typeof topFreelancers[1].hourly_rate === 'number' || !isNaN(Number(topFreelancers[1].hourly_rate)) 
                            ? `$${parseFloat(topFreelancers[1].hourly_rate.toString()).toFixed(0)}/hr` 
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Trusted Companies Ticker */}
      <div className="w-full bg-slate-50/80 dark:bg-zinc-900/50 backdrop-blur-sm border-t border-slate-200/50 dark:border-zinc-800/40 pt-5 pb-3.5 overflow-hidden shrink-0 z-10 mt-6 lg:mt-8">
        <p className="text-center text-[10px] sm:text-xs font-bold tracking-[0.22em] text-slate-400/90 uppercase mb-5">
          {t("trusted_title", "Trusted by Innovative Companies Worldwide")}
        </p>
        <div className="overflow-hidden relative w-full mask-gradient">
          <div className="animate-marquee flex items-center py-1.5">
            {[...companies, ...companies, ...companies, ...companies].map((name, index) => (
              <div key={index} className="flex items-center gap-2.5 mx-10 sm:mx-16 shrink-0">
                {COMPANY_ICON_POOL[index % COMPANY_ICON_POOL.length]}
                <span className="text-slate-400 font-extrabold text-xs sm:text-sm tracking-wider uppercase font-display">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
