"use client";

import React, { useState, useEffect } from "react";

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const skillsToType = ["UI Design", "React", "AI Automation", "SEO", "Next.js", "Python"];

  useEffect(() => {
    let timer: any;
    const currentWord = skillsToType[currentWordIndex];

    if (isDeleting) {
      // Erasing letter
      timer = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1));
      }, 50);
    } else {
      // Typing letter
      timer = setTimeout(() => {
        setCurrentText((prev) => currentWord.slice(0, prev.length + 1));
      }, 120);
    }

    // Handle transition states
    if (!isDeleting && currentText === currentWord) {
      // Fully typed, pause, then start deleting
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && currentText === "") {
      // Fully deleted, pause, then move to next word
      clearTimeout(timer);
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % skillsToType.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIndex]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || skillsToType[currentWordIndex];
    alert(`Searching Freelancer database for: "${query}"...`);
  };

  const handleQuickTagClick = (skill: string) => {
    setSearchQuery(skill);
  };

  const companies = [
    {
      name: "Acme Corp",
      icon: (
        <svg className="w-5 h-5 text-slate-400/80 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
      ),
    },
    {
      name: "Globex",
      icon: (
        <svg className="w-5 h-5 text-slate-400/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
          <ellipse cx="12" cy="12" rx="8" ry="3" transform="rotate(30 12 12)" />
        </svg>
      ),
    },
    {
      name: "Soylent",
      icon: (
        <svg className="w-5 h-5 text-slate-400/80 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      ),
    },
    {
      name: "Initech",
      icon: (
        <svg className="w-5 h-5 text-slate-400/80 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
    },
    {
      name: "Umbrella",
      icon: (
        <svg className="w-5 h-5 text-slate-400/80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12m0 0a5 5 0 0 0 5-5H7a5 5 0 0 0 5 5zM12 12V6m0 0a3 3 0 0 1-3-3m3 3a3 3 0 0 0 3-3" />
        </svg>
      ),
    },
  ];

  return (
    <main className="flex-1 relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] lg:h-[calc(100vh-80px)] lg:min-h-[560px] lg:max-h-[720px] flex flex-col justify-between z-10 px-4 sm:px-6 lg:px-8">
      
      {/* Animated gradient mesh blobs and grid overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60"></div>
        
        {/* Floating gradient circles */}
        <div className="absolute -top-12 -left-12 w-96 h-96 bg-[#e6f0ef]/50 rounded-full mix-blend-multiply filter blur-3xl opacity-75 animate-blob"></div>
        <div className="absolute top-1/4 -right-12 w-[30rem] h-[30rem] bg-teal-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-16 left-1/3 w-96 h-96 bg-emerald-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Grid Content Container (Vertically centered on desktop) */}
      <div className="flex-1 flex items-center w-full relative z-10 max-w-7xl mx-auto pt-12 pb-8 lg:pt-16 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center w-full">
          
          {/* Left Column: Copy & Search */}
          <div className="lg:col-span-7 flex flex-col gap-3.5 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold bg-[#e6f0ef] text-[#0a5a54] self-center lg:self-start border border-[#0a5a54]/10 uppercase tracking-wider">
              🏆 The Top 3% Global Freelancers
            </span>

            <h1 className="text-3xl sm:text-[2.5rem] lg:text-[2.85rem] xl:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-slate-900 font-display">
              Hire <span className="text-[#0a5a54]">Expert Freelancers</span> <br />
              For Your Next Big <br />
              Project
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
              Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.
            </p>

            {/* Interactive Search Container */}
            <form 
              onSubmit={handleSearchSubmit} 
              className="w-full max-w-xl mx-auto lg:mx-0 mt-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100 flex flex-col sm:flex-row gap-1.5 transition-all duration-300 focus-within:border-[#0a5a54]/40 focus-within:shadow-2xl focus-within:shadow-[#0a5a54]/5"
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
                  className="w-full text-slate-800 text-sm sm:text-base focus:outline-none bg-transparent py-2.5 z-10"
                />
                
                {/* Fake Placeholder Overlay with Typewriter Animation */}
                {!isFocused && !searchQuery && (
                  <div className="absolute left-[38px] text-slate-400 text-sm sm:text-base pointer-events-none select-none z-0 flex items-center">
                    <span className="hidden sm:inline">What skill are you looking for? &nbsp;</span>
                    <span className="sm:hidden">Search &nbsp;</span>
                    <span className="text-slate-400/70 font-normal">e.g. </span>
                    <span className="text-[#0a5a54] font-semibold ml-1 relative">
                      {currentText}
                      <span className="absolute -right-[3px] top-[1.5px] bottom-[1.5px] w-[1.5px] bg-[#0a5a54] animate-blink"></span>
                    </span>
                  </div>
                )}
              </div>
              <button 
                type="submit" 
                className="bg-[#0a5a54] hover:bg-[#073f3a] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all duration-200 shrink-0 active:scale-[0.98] cursor-pointer hover:shadow-lg hover:shadow-[#0a5a54]/10"
              >
                Search Talent
              </button>
            </form>

            {/* Hot Skills */}
            <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start items-center text-xs font-semibold text-slate-500 mt-2">
              <span>Popular:</span>
              {["UI Design", "React", "AI Automation", "SEO"].map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleQuickTagClick(skill)}
                  className="hover:text-white hover:bg-[#0a5a54] hover:border-[#0a5a54] border border-emerald-600/20 bg-[#e6f0ef]/50 text-[#0a5a54] px-3.5 py-1 rounded-full transition-all duration-150 active:scale-95 cursor-pointer"
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Mockup Showcase */}
          <div className="lg:col-span-5 relative w-full flex justify-center items-center py-2 lg:py-0">
            
            {/* The Dark Green Container */}
            <div className="relative w-full aspect-[1.12] max-w-[290px] sm:max-w-[360px] xl:max-w-[395px] bg-[#042e2a] rounded-[2.2rem] p-4 sm:p-6 flex items-center justify-center shadow-xl overflow-visible">
              
              {/* Floating Grid/Pattern inside green box */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px] rounded-[2.2rem]"></div>
              
              {/* Decorative blurs */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-teal-400/20 rounded-full filter blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-emerald-400/20 rounded-full filter blur-2xl pointer-events-none"></div>

              {/* The Tablet Mockup */}
              <div className="relative w-[92%] aspect-[1.28] bg-slate-900 rounded-xl p-1 border-4 border-slate-950 shadow-xl overflow-hidden flex items-center justify-center">
                {/* Screen container */}
                <div className="relative w-full h-full rounded overflow-hidden bg-slate-950">
                  <img
                    src="/tablet-work.png"
                    alt="Mockup Screen"
                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
                  />
                  {/* Dark overlay for screen styling */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#042e2a]/40 via-transparent to-transparent"></div>
                </div>
              </div>

              {/* Floating Card: Sarah J. */}
              <div className="absolute top-[12%] -left-2 sm:-left-6 md:-left-[10%] z-20 animate-float-up">
                <div className="bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3.5 shadow-lg flex items-center gap-2 sm:gap-3 w-[140px] sm:w-[190px] lg:w-[205px] transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <img
                    src="/sarah-avatar.png"
                    alt="Sarah J."
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-slate-900 text-xs truncate">Sarah J.</span>
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 truncate">Senior UI Designer</p>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] font-bold">
                      <span className="text-[#0a5a54] flex items-center gap-0.5">
                        ★ <span className="text-slate-800">4.9</span>
                      </span>
                      <span className="text-slate-700">$85/hr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card: David M. */}
              <div className="absolute bottom-[14%] -right-2 sm:-right-6 md:-right-[10%] z-20 animate-float-up">
                <div className="bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3.5 shadow-lg flex items-center gap-2 sm:gap-3 w-[140px] sm:w-[190px] lg:w-[205px] transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <img
                    src="/david-avatar.png"
                    alt="David M."
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-slate-900 text-xs truncate">David M.</span>
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 truncate">AI Engineer</p>
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] font-bold">
                      <span className="text-[#0a5a54] flex items-center gap-0.5">
                        ★ <span className="text-slate-800">5.0</span>
                      </span>
                      <span className="text-slate-700">$120/hr</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Trusted Companies Logo Carousel Section (Fixed to bottom of screen with added spacing) */}
      <div className="w-full bg-slate-50/80 backdrop-blur-sm border-t border-slate-200/50 pt-5 pb-3.5 overflow-hidden shrink-0 z-10 mt-6 lg:mt-8">
        <p className="text-center text-[10px] sm:text-xs font-bold tracking-[0.22em] text-slate-400/90 uppercase mb-5">
          Trusted by Innovative Companies Worldwide
        </p>
        <div className="overflow-hidden relative w-full mask-gradient">
          <div className="animate-marquee flex items-center py-1.5">
            {[...companies, ...companies, ...companies, ...companies].map((company, index) => (
              <div key={index} className="flex items-center gap-2.5 mx-10 sm:mx-16 shrink-0">
                {company.icon}
                <span className="text-slate-400 font-extrabold text-xs sm:text-sm tracking-wider uppercase font-display">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
