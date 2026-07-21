"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiHome, FiSearch, FiCpu } from "react-icons/fi";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/projects?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-955 flex flex-col items-center justify-center relative overflow-hidden px-6 py-12 select-none text-slate-800">
      
      {/* Premium Backdrop Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Pulsing gradient orbs */}
        <div className="absolute top-[10%] left-[5%] w-[40rem] h-[40rem] bg-violet-600/10 rounded-full filter blur-[150px] animate-pulse duration-4000"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full filter blur-[150px] animate-pulse duration-3000" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-500/5 rounded-full filter blur-[120px]"></div>
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.15) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px"
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-xl w-full text-center space-y-8 animate-fadeIn">
        
        {/* Glassmorphic main container */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
          {/* Top colored accent line */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-600 via-teal-500 to-cyan-500"></div>
          
          {/* Giant Glowing 404 number */}
          <div className="relative inline-block mb-2">
            <h1 className="text-[100px] sm:text-[140px] font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-teal-400 to-cyan-400 filter drop-shadow-[0_0_30px_rgba(139,92,246,0.25)] select-none">
              404
            </h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-violet-500/5 filter blur-3xl rounded-full pointer-events-none"></div>
          </div>

          {/* Messaging */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Lost in Workspace Orbit
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-md mx-auto leading-relaxed">
              The page you are looking for might have been moved, renamed, or is temporarily unavailable in this workspace.
            </p>
          </div>

          {/* Search bar helper */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-sm mx-auto relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search jobs, services, profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-3 pl-10 pr-24 text-slate-200 text-xs focus:outline-none focus:border-violet-500 focus:bg-slate-950 transition-all font-semibold"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-750 hover:to-purple-750 text-white px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* Floating action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-850 hover:border-slate-750 text-xs font-black transition-all cursor-pointer shadow-lg active:scale-95 select-none"
            >
              <FiArrowLeft className="w-4 h-4 shrink-0" />
              <span>Go Back</span>
            </button>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <span className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-750 hover:to-purple-750 text-white text-xs font-black transition-all cursor-pointer shadow-lg shadow-violet-550/10 hover:shadow-violet-550/20 active:scale-95 select-none">
                <FiHome className="w-4 h-4 shrink-0" />
                <span>Workspace Hub</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Footer info link */}
        <div className="pt-4">
          <Link href="/" className="text-xxs font-black text-slate-500 hover:text-violet-400 uppercase tracking-widest transition">
            Back to Homepage
          </Link>
        </div>

      </div>
    </main>
  );
}
