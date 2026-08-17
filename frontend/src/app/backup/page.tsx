"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_URL } from "@/config/api";
import { FiDatabase, FiDownload, FiCheckCircle, FiAlertCircle, FiRefreshCw } from "react-icons/fi";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  const triggerBackup = async () => {
    setLoading(true);
    setError("");
    setBackupResult(null);

    try {
      const res = await fetch(`${API_URL}/backup`, { method: "POST" });
      const data = await res.json();

      if (res.ok && data.filename) {
        setBackupResult(data);
        // Automatically trigger browser download
        const downloadUrl = `${API_URL}/backup/download/${data.filename}`;
        window.location.href = downloadUrl;
      } else {
        throw new Error(data.message || data.error || "Failed to create database backup.");
      }
    } catch (err: any) {
      console.error("Backup error:", err);
      setError(err.message || "An unexpected error occurred during database backup.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerBackup();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full flex flex-col items-center justify-center text-center">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl w-full flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
            <FiDatabase className="w-10 h-10" />
          </div>

          <div className="flex flex-col gap-2 max-w-lg">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Database Backup
            </h1>
            <p className="text-slate-500 text-sm font-semibold leading-relaxed">
              Generate a full schema-aware PostgreSQL dump of all live tables and download the timestamped <code className="text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded">.sql</code> file.
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-6 animate-pulse">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
              <span className="text-xs font-bold text-teal-700">Generating live database backup...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold w-full max-w-md flex items-center gap-3 text-left">
              <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {backupResult && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold w-full max-w-md flex flex-col gap-3 text-left shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                <FiCheckCircle className="w-5 h-5 shrink-0" />
                <span>Backup Created Successfully!</span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-slate-600 font-mono bg-white p-3 rounded-xl border border-emerald-200/80">
                <p><strong className="text-slate-800">Filename:</strong> {backupResult.filename}</p>
                <p><strong className="text-slate-800">Size:</strong> {(backupResult.sizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                <p><strong className="text-slate-800">Timestamp:</strong> {new Date(backupResult.timestamp).toLocaleString()}</p>
              </div>
              <a
                href={`${API_URL}/backup/download/${backupResult.filename}`}
                className="mt-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-center flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer no-underline"
              >
                <FiDownload className="w-4 h-4" /> Download Backup SQL File
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 w-full">
            <button
              onClick={triggerBackup}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Generate New Backup</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
