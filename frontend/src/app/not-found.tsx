"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-6 select-none">
      
      {/* Glow effects in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[10%] w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-cyan-500/10 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: "2s" }}></div>
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8 animate-fadeIn">
        
        {/* Giant Glowing 404 number */}
        <div className="relative inline-block">
          <h1 className="text-[120px] sm:text-[150px] font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.3)]">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 filter blur-3xl rounded-full pointer-events-none"></div>
        </div>

        {/* Messaging */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Lost in Orbit
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-semibold max-w-sm mx-auto leading-relaxed">
            The page you are looking for might have been moved, deleted, or never existed in this workspace.
          </p>
        </div>

        {/* Floating action buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
          
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 text-xs font-black transition-all cursor-pointer shadow-lg active:scale-95"
          >
            ← Go Back
          </button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <span className="w-full inline-block text-center px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95">
              Enter Workspace Hub
            </span>
          </Link>

        </div>

        {/* Footer info link */}
        <div className="pt-6 border-t border-slate-900">
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-400 transition">
            Back to Homepage
          </Link>
        </div>

      </div>
    </main>
  );
}
