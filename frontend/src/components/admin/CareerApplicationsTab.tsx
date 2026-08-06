"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FiFileText, 
  FiClock, 
  FiTrash2, 
  FiSearch, 
  FiExternalLink, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiInbox,
  FiX,
  FiLoader,
  FiDownload
} from "react-icons/fi";
import { API_URL } from "@/config/api";

interface Application {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  cover_letter: string;
  resume_url: string | null;
  created_at: string;
}

interface CareerApplicationsTabProps {
  isDark?: boolean;
}

export default function CareerApplicationsTab({ isDark = false }: CareerApplicationsTabProps) {
  const [mounted, setMounted] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  
  // Modal for detail view
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getToken = () => localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/careers/applications`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      } else {
        setError("Failed to fetch career applications.");
      }
    } catch {
      setError("Network error while connecting to server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this career application?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/careers/applications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        showToast("Application deleted successfully.");
        setApplications((prev) => prev.filter((app) => app.id !== id));
        if (selectedApp?.id === id) {
          setSelectedApp(null);
        }
      } else {
        showToast("Failed to delete application.", "error");
      }
    } catch {
      showToast("Network error deleting application.", "error");
    }
  };

  const getResumeLink = (url: string | null) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    const baseUrl = API_URL.replace("/api", "");
    return `${baseUrl}${url}`;
  };

  // Filter logic
  const filteredApps = applications.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.phone && app.phone.includes(searchTerm)) ||
      (app.cover_letter && app.cover_letter.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesRole = roleFilter === "All" || app.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Extract unique roles for the filter dropdown
  const uniqueRoles = Array.from(new Set(applications.map((app) => app.role)));

  if (!mounted) return null;

  return (
    <div className="space-y-6 w-full animate-fadeIn text-left">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-lg border animate-slideUp bg-white text-slate-800 border-slate-200">
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            Career Applications
          </h2>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"} mt-1 font-semibold`}>
            Manage job applications, review CVs, and assess candidates.
          </p>
        </div>
        
        <button
          onClick={fetchApplications}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            isDark 
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className={`border rounded-xl p-4.5 flex flex-col md:flex-row gap-4.5 items-center justify-between ${
        isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/80"
      }`}>
        <div className="relative w-full md:max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by name, email, cover letter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
              isDark 
                ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-teal-600" 
                : "bg-slate-50 border-slate-200 focus:bg-white focus:border-teal-500"
            }`}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-505"}`}>
            Position:
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${
              isDark 
                ? "bg-slate-900 border-slate-800 text-slate-300" 
                : "bg-slate-50 border-slate-200 focus:bg-white"
            }`}
          >
            <option value="All">All Positions</option>
            {uniqueRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <FiLoader className="w-8 h-8 text-teal-600 animate-spin" />
          <p className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Loading career applications...
          </p>
        </div>
      ) : error ? (
        <div className={`p-6 border border-dashed rounded-xl text-center flex flex-col items-center gap-2 ${
          isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-550"
        }`}>
          <FiAlertCircle className="w-8 h-8 text-rose-500" />
          <span className="text-sm font-bold">{error}</span>
          <button 
            onClick={fetchApplications}
            className="mt-2 text-xs font-bold text-teal-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className={`py-16 border border-dashed rounded-xl text-center flex flex-col items-center gap-3.5 ${
          isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-550"
        }`}>
          <FiInbox className="w-10 h-10 text-slate-350" />
          <div>
            <p className="text-sm font-black">No Applications Found</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              {applications.length === 0 ? "No candidates have submitted their CVs yet." : "No applications match your search filters."}
            </p>
          </div>
        </div>
      ) : (
        <div className={`border rounded-xl overflow-hidden shadow-xs ${
          isDark ? "border-slate-800 bg-slate-950" : "border-slate-200/80 bg-white"
        }`}>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] font-bold uppercase tracking-wider select-none ${
                  isDark ? "border-slate-800 bg-slate-900/60 text-slate-400" : "border-slate-100 bg-slate-50/50 text-slate-505"
                }`}>
                  <th className="py-3.5 px-4.5 font-bold">Candidate</th>
                  <th className="py-3.5 px-4.5 font-bold">Target Position</th>
                  <th className="py-3.5 px-4.5 font-bold">Phone Number</th>
                  <th className="py-3.5 px-4.5 font-bold">Submission Date</th>
                  <th className="py-3.5 px-4.5 font-bold">CV / Resume</th>
                  <th className="py-3.5 px-4.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApps.map((app) => (
                  <tr 
                    key={app.id}
                    className={`hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    <td className="py-3.5 px-4.5">
                      <div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                          {app.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          {app.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4.5">
                      <span className="bg-teal-50 dark:bg-teal-950/45 border border-teal-100 dark:border-teal-900 text-teal-800 dark:text-teal-400 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                        {app.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4.5 text-slate-500 dark:text-slate-400">
                      {app.phone || "—"}
                    </td>
                    <td className="py-3.5 px-4.5 text-slate-400 font-semibold text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <FiClock />
                        {new Date(app.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4.5">
                      {app.resume_url ? (
                        <a
                          href={getResumeLink(app.resume_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 hover:underline font-bold text-[11px]"
                        >
                          <FiFileText />
                          <span>View Resume</span>
                          <FiExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No File</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 rounded-lg border border-slate-200/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-450 hover:text-rose-600 transition-all cursor-pointer"
                          title="Delete application"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border relative animate-scaleUp text-left ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-405 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <span className="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 text-[10px] font-black tracking-wider uppercase py-1 px-3.5 rounded-full select-none">
                  Application Details
                </span>
                <h3 className="text-xl font-black mt-3 leading-tight">{selectedApp.name}</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Submitted on {new Date(selectedApp.created_at).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y py-4 border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</span>
                  <a href={`mailto:${selectedApp.email}`} className="text-xs font-bold text-teal-600 hover:underline">
                    {selectedApp.email}
                  </a>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Phone Number</span>
                  <span className="text-xs font-bold">{selectedApp.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Target Position</span>
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{selectedApp.role}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Resume Attachment</span>
                  {selectedApp.resume_url ? (
                    <a
                      href={getResumeLink(selectedApp.resume_url)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:underline mt-0.5"
                    >
                      <FiDownload />
                      <span>Download CV File</span>
                    </a>
                  ) : (
                    <span className="text-xs italic text-slate-400">None</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cover Letter / Message</span>
                <div className={`p-4 rounded-xl text-xs font-semibold leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto ${
                  isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-655"
                }`}>
                  {selectedApp.cover_letter || <span className="italic text-slate-450">No cover letter message provided.</span>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 hover:text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
