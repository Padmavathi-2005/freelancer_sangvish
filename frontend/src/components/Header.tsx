"use client";

import React, { useState, useEffect } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");

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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section: Logo & Links */}
          <div className="flex items-center gap-12">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl font-extrabold tracking-tight text-primary font-display">Freelancer</span>
            </a>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#" className="text-primary font-bold text-sm leading-none relative after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-full after:h-[2px] after:bg-primary after:rounded-full transition-all duration-200">
                Browse
              </a>
              <a href="#" className="text-slate-500 hover:text-primary font-medium text-sm leading-none transition-all duration-200">
                Services
              </a>
              <a href="#" className="text-slate-500 hover:text-primary font-medium text-sm leading-none transition-all duration-200">
                Membership
              </a>
              <a href="#" className="text-slate-500 hover:text-primary font-medium text-sm leading-none transition-all duration-200">
                For Businesses
              </a>
            </nav>
          </div>

          {/* Right Section: CTAs */}
          <div className="hidden lg:flex items-center gap-6">
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
                    Go to Dashboard
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
              <a href="/login" className="text-slate-600 hover:text-primary font-semibold text-sm transition-all duration-200">
                Login
              </a>
            )}
            <a href="#" className="bg-primary hover:bg-primary-hover text-white font-bold text-sm px-6 py-3 rounded-lg transition-all duration-250 hover:shadow-lg hover:shadow-primary/20 transform active:scale-[0.98]">
              Hire Freelancers
            </a>
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
          <a href="#" className="bg-primary-light text-primary font-bold px-4 py-2.5 rounded-lg text-base">
            Browse
          </a>
          <a href="#" className="text-slate-600 hover:text-primary font-medium px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
            Services
          </a>
          <a href="#" className="text-slate-600 hover:text-primary font-medium px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
            Membership
          </a>
          <a href="#" className="text-slate-600 hover:text-primary font-medium px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
            For Businesses
          </a>
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
                Go to Dashboard
              </a>
              <button
                onClick={handleHeaderLogout}
                className="text-rose-600 text-left font-bold px-4 py-2.5 rounded-lg text-base hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <a href="/login" className="text-slate-600 hover:text-primary font-semibold px-4 py-2.5 rounded-lg text-base hover:bg-slate-200/50 transition-colors">
              Login
            </a>
          )}
          <a href="#" className="bg-primary hover:bg-primary-hover text-white text-center font-bold px-4 py-3.5 rounded-lg text-base shadow-md transition-all">
            Hire Freelancers
          </a>
        </div>
      </div>
    </header>
  );
}
