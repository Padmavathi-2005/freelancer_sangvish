"use client";

import React from "react";
import Link from "next/link";
import { FiHome } from "react-icons/fi";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-6 text-center select-none text-slate-800 dark:text-slate-200">
      <div className="max-w-md w-full space-y-6 animate-fadeIn">
        <h1 className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-500">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight">
            Page Not Found
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            The page you are looking for might have been moved, deleted, or does not exist.
          </p>
        </div>
        <div className="pt-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer no-underline"
          >
            <FiHome className="w-4 h-4 shrink-0" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
