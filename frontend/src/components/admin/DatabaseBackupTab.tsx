"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  FiHardDrive,
  FiDownload,
  FiTrash2,
  FiRefreshCw,
  FiPlus,
  FiDatabase,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiFile,
} from "react-icons/fi";

const API = "https://freelancer.sangvish.com/api/admin";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
}

interface Backup {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export default function DatabaseBackupTab({ isDark }: { isDark: boolean }) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/backups`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      } else {
        showToast("Failed to load backups.", "error");
      }
    } catch {
      showToast("Network error while fetching backups.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API}/backups`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Backup "${data.filename}" created successfully!`, "success");
        fetchBackups();
      } else {
        showToast(data.error || "Failed to create backup.", "error");
      }
    } catch {
      showToast("Network error while creating backup.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    setDownloadingFile(filename);
    try {
      const res = await fetch(`${API}/backups/${encodeURIComponent(filename)}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast(`"${filename}" downloaded.`, "success");
      } else {
        showToast("Failed to download backup.", "error");
      }
    } catch {
      showToast("Network error during download.", "error");
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeletingFile(confirmDelete);
    setConfirmDelete(null);
    try {
      const res = await fetch(`${API}/backups/${encodeURIComponent(confirmDelete)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Backup deleted.", "success");
        fetchBackups();
      } else {
        showToast(data.error || "Failed to delete backup.", "error");
      }
    } catch {
      showToast("Network error during deletion.", "error");
    } finally {
      setDeletingFile(null);
    }
  };

  const card = isDark
    ? "bg-slate-900 border border-slate-800 rounded-2xl"
    : "bg-white border border-slate-200 rounded-2xl shadow-sm";

  const tableHeaderClass = isDark
    ? "bg-slate-850 text-slate-400 border-b border-slate-800"
    : "bg-slate-50 text-slate-500 border-b border-slate-200";

  const rowClass = isDark
    ? "border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors"
    : "border-b border-slate-100 hover:bg-slate-50/60 transition-colors";

  const textMain = isDark ? "text-slate-100" : "text-slate-800";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Toast — rendered via Portal to escape overflow-y-auto stacking context */}
      {toast && typeof document !== "undefined" && ReactDOM.createPortal(
        <div
          className={`fixed top-5 right-5 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-bold border ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : toast.type === "error"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {toast.type === "success" ? (
            <FiCheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <FiAlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>,
        document.body
      )}

      {/* Confirm Delete Modal — portal to cover sidebar & header */}
      {confirmDelete && typeof document !== "undefined" && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/40 z-[99999] flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <FiTrash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className={`text-sm font-black ${textMain}`}>Delete Backup?</h3>
                <p className={`text-xs ${textMuted} mt-0.5`}>This action cannot be undone.</p>
              </div>
            </div>
            <p className={`text-xs font-mono px-3 py-2 rounded-lg truncate mb-5 ${
              isDark
                ? "bg-slate-800 text-slate-200 border border-slate-700"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}>
              {confirmDelete}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isDark
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <FiDatabase className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className={`text-base font-black ${textMain}`}>Database Backups</h2>
            <p className={`text-xs ${textMuted}`}>
              {backups.length} backup{backups.length !== 1 ? "s" : ""} stored on server
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
              isDark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-teal-600/25 transition-all cursor-pointer disabled:opacity-60"
          >
            {creating ? (
              <>
                <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <FiPlus className="w-3.5 h-3.5" />
                Create Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className={`${card} p-4`}>
          <p className={`text-[10px] font-black uppercase tracking-wider ${textMuted} mb-1`}>Total Backups</p>
          <p className={`text-2xl font-black ${textMain}`}>{backups.length}</p>
        </div>
        <div className={`${card} p-4`}>
          <p className={`text-[10px] font-black uppercase tracking-wider ${textMuted} mb-1`}>Total Size</p>
          <p className={`text-2xl font-black ${textMain}`}>
            {formatBytes(backups.reduce((acc, b) => acc + b.sizeBytes, 0))}
          </p>
        </div>
        <div className={`${card} p-4 col-span-2 sm:col-span-1`}>
          <p className={`text-[10px] font-black uppercase tracking-wider ${textMuted} mb-1`}>Latest Backup</p>
          <p className={`text-xs font-bold ${textMain} truncate`}>
            {backups.length > 0 ? formatDate(backups[0].createdAt) : "None yet"}
          </p>
        </div>
      </div>

      {/* Backups Table */}
      <div className={card}>
        <div className={`px-5 py-3.5 flex items-center justify-between ${tableHeaderClass} rounded-t-2xl`}>
          <span className="text-[10px] font-black uppercase tracking-widest">Backup Files</span>
          <span className={`text-[10px] font-semibold ${textMuted}`}>{backups.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <FiRefreshCw className="w-5 h-5 animate-spin text-teal-500" />
            <span className={`text-xs font-bold ${textMuted}`}>Loading backups…</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
              <FiHardDrive className={`w-6 h-6 ${textMuted}`} />
            </div>
            <p className={`text-sm font-bold ${textMain}`}>No backups yet</p>
            <p className={`text-xs ${textMuted}`}>Click "Create Backup" to generate your first database snapshot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`${tableHeaderClass} text-left`}>
                  <th className="px-5 py-3 font-black text-[10px] tracking-wider uppercase">Filename</th>
                  <th className="px-4 py-3 font-black text-[10px] tracking-wider uppercase">Size</th>
                  <th className="px-4 py-3 font-black text-[10px] tracking-wider uppercase">Created At</th>
                  <th className="px-4 py-3 font-black text-[10px] tracking-wider uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.filename} className={rowClass}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <FiFile className="w-3.5 h-3.5 text-teal-500" />
                        </div>
                        <span className={`font-mono text-[11px] font-bold ${textMain}`}>{backup.filename}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 font-semibold ${textMuted}`}>
                      {formatBytes(backup.sizeBytes)}
                    </td>
                    <td className={`px-4 py-3.5`}>
                      <div className={`flex items-center gap-1.5 ${textMuted}`}>
                        <FiClock className="w-3 h-3 shrink-0" />
                        <span className="font-semibold">{formatDate(backup.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          disabled={downloadingFile === backup.filename}
                          title="Download"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border disabled:opacity-50 ${
                            isDark
                              ? "border-teal-800 text-teal-400 hover:bg-teal-900/40"
                              : "border-teal-200 text-teal-700 hover:bg-teal-50"
                          }`}
                        >
                          {downloadingFile === backup.filename ? (
                            <FiRefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <FiDownload className="w-3 h-3" />
                          )}
                          Download
                        </button>
                        <button
                          onClick={() => setConfirmDelete(backup.filename)}
                          disabled={deletingFile === backup.filename}
                          title="Delete"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border disabled:opacity-50 ${
                            isDark
                              ? "border-rose-900 text-rose-400 hover:bg-rose-950/40"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          {deletingFile === backup.filename ? (
                            <FiRefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <FiTrash2 className="w-3 h-3" />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div
        className={`rounded-2xl border p-4 flex items-start gap-3 ${
          isDark ? "bg-amber-950/10 border-amber-900/40" : "bg-amber-50 border-amber-200"
        }`}
      >
        <FiAlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className={`text-xs font-black ${isDark ? "text-amber-400" : "text-amber-700"}`}>Storage Note</p>
          <p className={`text-xs mt-0.5 ${isDark ? "text-amber-500/80" : "text-amber-600"}`}>
            Backup files are stored in the <span className="font-mono font-bold">/backups</span> folder on the server. 
            Download and store copies in a secure location for disaster recovery. Large tables may take a few seconds to dump.
          </p>
        </div>
      </div>
    </div>
  );
}
