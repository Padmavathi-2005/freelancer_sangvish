"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_URL } from "@/config/api";
import { FiRefreshCw, FiCheckCircle, FiAlertCircle, FiShield } from "react-icons/fi";

export default function RestorePage() {
  const [loading, setLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  const triggerRestore = async () => {
    setLoading(true);
    setError("");
    setRestoreResult(null);

    try {
      const res = await fetch(`${API_URL}/restore`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setRestoreResult(data);
      } else {
        throw new Error(data.message || data.error || "Failed to restore database.");
      }
    } catch (err: any) {
      console.error("Restore error:", err);
      setError(err.message || "An unexpected error occurred during database restoration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerRestore();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full flex flex-col items-center justify-center text-center">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl w-full flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
            <FiShield className="w-10 h-10" />
          </div>

          <div className="flex flex-col gap-2 max-w-lg">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Database Restore
            </h1>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Restoring live PostgreSQL database from the latest stored <code className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">.sql</code> backup file.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-6 animate-pulse">
              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-600 rounded-full animate-spin" />
              <span className="text-xs font-bold text-amber-700">Restoring live database from backup file...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold w-full max-w-md flex items-center gap-3 text-left">
              <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {restoreResult && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold w-full max-w-md flex flex-col gap-3 text-left shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                <FiCheckCircle className="w-5 h-5 shrink-0" />
                <span>Database Restored Successfully!</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-slate-600 font-mono bg-white p-3 rounded-xl border border-emerald-200/80">
                <p><strong className="text-slate-800">Status:</strong> {restoreResult.message}</p>
                <p><strong className="text-slate-800">Source File:</strong> {restoreResult.filename}</p>
                <p><strong className="text-slate-800">Restored At:</strong> {new Date(restoreResult.restoredAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 w-full">
            <button
              onClick={triggerRestore}
              disabled={loading}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Restoring..." : "Restore Again"}</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
