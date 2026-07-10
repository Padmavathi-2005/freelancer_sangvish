"use client";
import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { FiSearch, FiAlertCircle, FiTrendingUp, FiSmartphone, FiMonitor, FiCpu, FiGrid } from "react-icons/fi";

export default function SearchLogsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    topQueries: any[];
    zeroResults: any[];
    devices: any[];
    supplyDemandMatrix: any[];
  } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
        const res = await fetch(`${API_URL}/analytics/search-summary`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error("Failed to fetch search logs analytics data.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Loading search analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center gap-3">
        <FiAlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-semibold text-sm">{error}</span>
      </div>
    );
  }

  const totalSearches = data?.topQueries.reduce((acc, q) => acc + parseInt(q.search_count), 0) || 0;
  const desktopCount = data?.devices.find(d => d.device_type?.toLowerCase() === 'desktop')?.count || 0;
  const mobileCount = data?.devices.find(d => d.device_type?.toLowerCase() === 'mobile')?.count || 0;

  return (
    <div className="flex flex-col gap-8 text-slate-800 animate-fadeIn">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Total Queries Logged</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <FiSearch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{totalSearches}</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">Registered searches across directories</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Mobile vs Desktop Split</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <FiSmartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-black text-slate-900">
                {totalSearches > 0 ? ((mobileCount / (mobileCount + desktopCount || 1)) * 100).toFixed(0) : 0}%
              </h3>
              <span className="text-xs text-slate-500 font-bold mb-1">Mobile</span>
              <span className="text-slate-300">|</span>
              <h3 className="text-2xl font-black text-slate-900">
                {totalSearches > 0 ? ((desktopCount / (mobileCount + desktopCount || 1)) * 100).toFixed(0) : 0}%
              </h3>
              <span className="text-xs text-slate-500 font-bold mb-1">Desktop</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">User browser agent classification</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Active Search Terms</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{data?.topQueries.length || 0}</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">Unique query phrases identified</p>
          </div>
        </div>
      </div>

      {/* Grid: Popular Queries vs Content Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Search Queries */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-800">Popular Search Queries</h3>
              <p className="text-xs text-slate-450 mt-0.5">Most common terms typed by users.</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black rounded-lg">TOP 15</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5">Query Text</th>
                  <th className="py-2.5">Scope</th>
                  <th className="py-2.5 text-right">Searches Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {data?.topQueries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">No search logs registered yet.</td>
                  </tr>
                ) : (
                  data?.topQueries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-bold text-slate-800">{q.query_text}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${
                          q.search_type === "gigs" 
                            ? "bg-teal-50 text-teal-700 border-teal-200/50"
                            : q.search_type === "projects"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/50"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                        }`}>
                          {q.search_type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-slate-700">{q.search_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Gaps / Zero Result Searches */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800">Unsatisfied Client Demand</h3>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <p className="text-xs text-slate-450 mt-0.5">Queries that returned 0 results.</p>
            </div>
            <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-lg">ZERO RESULTS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5">Query Text</th>
                  <th className="py-2.5">Scope</th>
                  <th className="py-2.5 text-right">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {data?.zeroResults.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">All searches have matching offerings (no gaps!).</td>
                  </tr>
                ) : (
                  data?.zeroResults.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-bold text-rose-700 bg-rose-50/20 px-1 rounded">{q.query_text}</td>
                      <td className="py-3">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-200/60 bg-slate-50 uppercase text-slate-500">
                          {q.search_type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-slate-700">{q.search_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supply-Demand Market Health Matrix */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-base font-black text-slate-800">Supply-Demand Health Matrix</h3>
          <p className="text-xs text-slate-450 mt-0.5">Compares active client search queries against available platform listings.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3">Search Term</th>
                <th className="py-3">Query Scope</th>
                <th className="py-3 text-center">Search Volume</th>
                <th className="py-3 text-center">Available Supply</th>
                <th className="py-3 text-center">Market Health</th>
                <th className="py-3 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {data?.supplyDemandMatrix.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">Insufficient logs to compile matrix.</td>
                </tr>
              ) : (
                data?.supplyDemandMatrix.map((matrix, idx) => {
                  const searches = parseInt(matrix.searches);
                  const supply = parseInt(matrix.active_supply);
                  
                  let healthLabel = "Optimal Supply";
                  let healthClass = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                  let actionLabel = "Maintain status";
                  
                  if (supply === 0) {
                    healthLabel = "Critical Deficit";
                    healthClass = "bg-rose-50 text-rose-700 border-rose-200/50 animate-pulse";
                    actionLabel = "Onboard providers immediately";
                  } else if (searches / supply > 5) {
                    healthLabel = "Moderate Deficit";
                    healthClass = "bg-amber-50 text-amber-700 border-amber-200/50";
                    actionLabel = "Promote category recruitment";
                  } else if (supply > searches * 2) {
                    healthLabel = "Oversupply";
                    healthClass = "bg-slate-100 text-slate-500 border-slate-200";
                    actionLabel = "Boost client query campaigns";
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-800">{matrix.query}</td>
                      <td className="py-3.5 uppercase text-[10px] font-extrabold text-slate-450">{matrix.type}</td>
                      <td className="py-3.5 text-center font-bold text-slate-700">{searches}</td>
                      <td className="py-3.5 text-center font-bold text-slate-700">{supply}</td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${healthClass}`}>
                          {healthLabel}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-teal-700">{actionLabel}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
