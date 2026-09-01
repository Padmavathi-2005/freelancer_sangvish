"use client";
import React, { useState, useEffect } from "react";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";
import { FiSearch, FiAlertCircle, FiTrendingUp, FiSmartphone, FiMonitor, FiCpu, FiGrid } from "react-icons/fi";

export default function SearchLogsTab() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    topQueries: any[];
    zeroResults: any[];
    devices: any[];
    supplyDemandMatrix: any[];
  } | null>(null);

  // Pagination states for supply-demand health matrix
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalSearches = data?.topQueries?.reduce((acc, q) => acc + parseInt(q.search_count), 0) || 0;
  const desktopCount = data?.devices?.find(d => d.device_type?.toLowerCase() === 'desktop')?.count || 0;
  const mobileCount = data?.devices?.find(d => d.device_type?.toLowerCase() === 'mobile')?.count || 0;

  // Supply-Demand Health Matrix pagination calculations
  const supplyDemandData = data?.supplyDemandMatrix || [];
  const totalItems = supplyDemandData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedMatrix = supplyDemandData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
          throw new Error(t("admin_failed_fetch_search_logs", "Failed to fetch search logs analytics data."));
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || t("admin_error_occurred", "An error occurred."));
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">{t("admin_loading_search_analytics", "Loading search analytics data...")}</p>
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

  return (
    <div className="flex flex-col gap-8 text-slate-800 animate-fadeIn text-left rtl:text-right">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-left rtl:text-right">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">{t("admin_total_queries_logged", "Total Queries Logged")}</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <FiSearch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{totalSearches}</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t("admin_registered_searches_desc", "Registered searches across directories")}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-left rtl:text-right">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">{t("admin_mobile_desktop_split", "Mobile vs Desktop Split")}</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <FiSmartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-black text-slate-900">
                {totalSearches > 0 ? ((mobileCount / (mobileCount + desktopCount || 1)) * 100).toFixed(0) : 0}%
              </h3>
              <span className="text-xs text-slate-500 font-bold mb-1">{t("admin_mobile", "Mobile")}</span>
              <span className="text-slate-300">|</span>
              <h3 className="text-2xl font-black text-slate-900">
                {totalSearches > 0 ? ((desktopCount / (mobileCount + desktopCount || 1)) * 100).toFixed(0) : 0}%
              </h3>
              <span className="text-xs text-slate-500 font-bold mb-1">{t("admin_desktop", "Desktop")}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t("admin_browser_agent_desc", "User browser agent classification")}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-left rtl:text-right">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">{t("admin_active_search_terms", "Active Search Terms")}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{data?.topQueries?.length || 0}</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-semibold">{t("admin_unique_query_phrases_desc", "Unique query phrases identified")}</p>
          </div>
        </div>
      </div>

      {/* Grid: Popular Queries vs Content Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Search Queries */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left rtl:text-right">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-800">{t("admin_popular_search_queries", "Popular Search Queries")}</h3>
              <p className="text-xs text-slate-450 mt-0.5">{t("admin_popular_queries_desc", "Most common terms typed by users.")}</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black rounded-lg">TOP 15</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse min-w-[360px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-left rtl:text-right">
                  <th className="px-3 py-2.5 text-left rtl:text-right whitespace-nowrap">{t("admin_query_text_header", "Query Text")}</th>
                  <th className="px-3 py-2.5 text-left rtl:text-right whitespace-nowrap">{t("admin_scope_header", "Scope")}</th>
                  <th className="px-3 py-2.5 text-right rtl:text-left whitespace-nowrap">{t("admin_searches_count_header", "Searches Count")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {data?.topQueries?.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-400 font-medium">{t("admin_no_search_logs_registered", "No search logs registered yet.")}</td>
                  </tr>
                ) : (
                  data?.topQueries?.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-3 font-bold text-slate-800 text-left rtl:text-right whitespace-nowrap">{q.query_text}</td>
                      <td className="px-3 py-3 text-left rtl:text-right whitespace-nowrap">
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
                      <td className="px-3 py-3 text-right rtl:text-left font-black text-slate-700 whitespace-nowrap">{q.search_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Gaps / Zero Result Searches */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left rtl:text-right">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-800">{t("admin_unsatisfied_client_demand", "Unsatisfied Client Demand")}</h3>
              <p className="text-xs text-slate-450 mt-0.5">{t("admin_zero_results_desc", "Queries that returned 0 results.")}</p>
            </div>
            <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-lg">ZERO RESULTS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse min-w-[360px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-left rtl:text-right">
                  <th className="px-3 py-2.5 text-left rtl:text-right whitespace-nowrap">{t("admin_query_text_header", "Query Text")}</th>
                  <th className="px-3 py-2.5 text-left rtl:text-right whitespace-nowrap">{t("admin_scope_header", "Scope")}</th>
                  <th className="px-3 py-2.5 text-right rtl:text-left whitespace-nowrap">{t("admin_attempts_header", "Attempts")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {data?.zeroResults?.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-slate-400 font-medium">{t("admin_no_content_gaps", "All searches have matching offerings (no gaps!).")}</td>
                  </tr>
                ) : (
                  data?.zeroResults?.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-3 font-bold text-rose-700 bg-rose-50/20 px-1.5 rounded text-left rtl:text-right whitespace-nowrap">{q.query_text}</td>
                      <td className="px-3 py-3 text-left rtl:text-right whitespace-nowrap">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-200/60 bg-slate-50 uppercase text-slate-500">
                          {q.search_type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right rtl:text-left font-black text-slate-700 whitespace-nowrap">{q.search_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supply-Demand Market Health Matrix */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left rtl:text-right">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-base font-black text-slate-800">{t("admin_supply_demand_health_matrix", "Supply-Demand Health Matrix")}</h3>
          <p className="text-xs text-slate-450 mt-0.5">{t("admin_matrix_desc", "Compares active client search queries against available platform listings.")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-left rtl:text-right">
                <th className="px-4 py-3 text-left rtl:text-right whitespace-nowrap">{t("admin_search_term_header", "Search Term")}</th>
                <th className="px-4 py-3 text-left rtl:text-right whitespace-nowrap">{t("admin_query_scope_header", "Query Scope")}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{t("admin_search_volume_header", "Search Volume")}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{t("admin_available_supply_header", "Available Supply")}</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{t("admin_market_health_header", "Market Health")}</th>
                <th className="px-4 py-3 text-right rtl:text-left whitespace-nowrap">{t("admin_recommended_action_header", "Recommended Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">{t("admin_insufficient_logs_matrix", "Insufficient logs to compile matrix.")}</td>
                </tr>
              ) : (
                paginatedMatrix.map((matrix, idx) => {
                  const searches = parseInt(matrix.searches);
                  const supply = parseInt(matrix.active_supply);
                  
                  let healthLabel = t("admin_optimal_supply", "Optimal Supply");
                  let healthClass = "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                  let actionLabel = t("admin_action_maintain_status", "Maintain status");
                  
                  if (supply === 0) {
                    healthLabel = t("admin_critical_deficit", "Critical Deficit");
                    healthClass = "bg-rose-50 text-rose-700 border-rose-200/50 animate-pulse";
                    actionLabel = t("admin_action_onboard_providers", "Onboard providers immediately");
                  } else if (searches / supply > 5) {
                    healthLabel = t("admin_moderate_deficit", "Moderate Deficit");
                    healthClass = "bg-amber-50 text-amber-700 border-amber-200/50";
                    actionLabel = t("admin_action_promote_recruitment", "Promote category recruitment");
                  } else if (supply > searches * 2) {
                    healthLabel = t("admin_oversupply", "Oversupply");
                    healthClass = "bg-slate-100 text-slate-500 border-slate-200";
                    actionLabel = t("admin_action_boost_campaigns", "Boost client query campaigns");
                  }

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800 text-left rtl:text-right whitespace-nowrap">{matrix.query}</td>
                      <td className="px-4 py-3.5 uppercase text-[10px] font-extrabold text-slate-450 text-left rtl:text-right whitespace-nowrap">{matrix.type}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700 whitespace-nowrap">{searches}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700 whitespace-nowrap">{supply}</td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block whitespace-nowrap ${healthClass}`}>
                          {healthLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right rtl:text-left font-semibold text-teal-700 whitespace-nowrap">{actionLabel}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs select-none">
              <span>{t("pagination_show", "Show")}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-teal-700 transition"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>{t("table_entries", "entries")}</span>
              <span className="text-slate-400 ml-2 font-bold">
                {t("table_showing", "Showing")} {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}{" "}
                {t("table_to", "to")} {Math.min(totalItems, currentPage * pageSize)}{" "}
                {t("table_of", "of")} {totalItems} {t("table_entries", "entries")}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold cursor-pointer text-xs"
              >
                {t("btn_previous", "Previous")}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg border transition-all font-bold cursor-pointer text-xs ${
                    page === currentPage
                      ? "bg-teal-700 border-teal-700 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold cursor-pointer text-xs"
              >
                {t("btn_next", "Next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
