"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiMail,
  FiClock,
  FiTrash2,
  FiCheckCircle,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiUsers,
  FiSlash,
  FiAlertCircle
} from "react-icons/fi";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";

interface Subscriber {
  id: number;
  email: string;
  status: "Subscribed" | "Unsubscribed";
  created_at: string;
}

interface NewsletterSubscribersTabProps {
  isDark?: boolean;
}

export default function NewsletterSubscribersTab({ isDark = false }: NewsletterSubscribersTabProps) {
  const { t } = useLanguage();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Subscribed" | "Unsubscribed">("All");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getToken = () => localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/newsletter-subscribers`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      } else {
        setError(t("admin_failed_load_affiliate_commissions", "Failed to fetch newsletter subscribers."));
      }
    } catch {
      setError(t("admin_failed_connect_server", "Network error while connecting to server."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "Subscribed" ? "Unsubscribed" : "Subscribed";
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/newsletter-subscribers/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setSubscribers((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: nextStatus as "Subscribed" | "Unsubscribed" } : item))
        );
        showToast(`${t("admin_subscriber_status_updated_to", "Subscriber status updated to")} ${nextStatus === "Subscribed" ? t("admin_active_subscribed", "Active Subscribed") : t("admin_unsubscribed", "Unsubscribed")}`);
      } else {
        showToast(t("admin_failed_update_status", "Failed to update status."), "error");
      }
    } catch {
      showToast(t("admin_network_error_update", "Network error during update."), "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("admin_confirm_delete_subscriber", "Are you sure you want to delete this email address from the subscriber list?"))) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/newsletter-subscribers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((item) => item.id !== id));
        showToast(t("admin_subscriber_deleted_success", "Subscriber deleted successfully!"));
      } else {
        showToast(t("admin_failed_delete_subscriber", "Failed to delete subscriber."), "error");
      }
    } catch {
      showToast(t("admin_network_error_deletion", "Network error during deletion."), "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast(t("admin_no_subscriber_data_export", "No subscriber data to export."), "error");
      return;
    }

    const headers = ["ID", "Email Address", "Status", "Subscribed At"];
    const rows = subscribers.map((sub) => [
      sub.id,
      `"${sub.email}"`,
      sub.status,
      `"${new Date(sub.created_at).toLocaleString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(t("admin_newsletter_csv_exported", "Newsletter subscriber CSV exported successfully!"));
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "All" || sub.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalCount = subscribers.length;
  const activeCount = subscribers.filter((s) => s.status === "Subscribed").length;
  const unsubscribedCount = subscribers.filter((s) => s.status === "Unsubscribed").length;

  return (
    <div className="flex flex-col gap-6 w-full text-left rtl:text-right">
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">{t("admin_newsletter_subscribers", "Newsletter Subscribers")}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {t("admin_newsletter_subscribers_desc", "Audit public email subscribers, manage subscription status, and export subscriber lists for email campaigns.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 border-0 whitespace-nowrap"
          >
            <FiDownload className="w-3.5 h-3.5" />
            {t("admin_export_csv", "Export CSV")}
          </button>

          <button
            onClick={fetchSubscribers}
            disabled={loading}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              isDark
                ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {t("admin_refresh_btn", "Refresh")}
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black shrink-0">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{t("admin_total_subscribers", "Total Subscribers")}</span>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">{totalCount}</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{t("admin_active_subscribed", "Active Subscribed")}</span>
            <span className="text-xl font-black text-emerald-600 leading-tight">{activeCount}</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black shrink-0">
            <FiSlash className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{t("admin_unsubscribed", "Unsubscribed")}</span>
            <span className="text-xl font-black text-rose-600 leading-tight">{unsubscribedCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {(["All", "Subscribed", "Unsubscribed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab
                  ? "bg-teal-700 text-white shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab === "All" ? t("admin_all", "All") : tab === "Subscribed" ? t("admin_active_subscribed", "Active Subscribed") : t("admin_unsubscribed", "Unsubscribed")}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t("admin_search_subscribers_placeholder", "Search by subscriber email...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-bold border focus:outline-none transition text-left rtl:text-right ${
              isDark
                ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white"
            }`}
          />
        </div>
      </div>

      {/* SUBSCRIBERS TABLE */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80"}`}>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3">
            <FiRefreshCw className="w-6 h-6 animate-spin text-teal-600" />
            <span>{t("admin_loading_newsletter_directory", "Loading newsletter subscriber directory...")}</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 text-xs font-bold flex flex-col items-center justify-center gap-2">
            <FiAlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
              <FiMail className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-200">{t("admin_no_newsletter_subscribers", "No newsletter subscribers found")}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{t("admin_no_newsletter_subscribers_desc", "When site visitors subscribe to the newsletter, their emails will appear here.")}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? "border-slate-850 text-slate-400 bg-slate-900/50" : "border-slate-150 text-slate-500 bg-slate-50"}`}>
                  <th className="py-3.5 px-4 text-left rtl:text-right">{t("email_address", "Email Address")}</th>
                  <th className="py-3.5 px-4 text-left rtl:text-right">{t("admin_subscribed_date_header", "Subscribed Date")}</th>
                  <th className="py-3.5 px-4 text-left rtl:text-right">{t("status_label", "Status")}</th>
                  <th className="py-3.5 px-4 text-right rtl:text-left">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {filteredSubscribers.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="py-4 px-4 whitespace-nowrap text-left rtl:text-right">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-black text-xs flex items-center justify-center shrink-0">
                          <FiMail className="w-4 h-4 text-teal-700" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.email}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] font-semibold text-left rtl:text-right">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-left rtl:text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.status === "Subscribed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {item.status === "Subscribed" ? t("admin_active_subscribed", "Active Subscribed") : t("admin_unsubscribed", "Unsubscribed")}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-right rtl:text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(item.id, item.status)}
                          disabled={actionLoading === item.id}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            item.status === "Subscribed"
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-0"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-0"
                          }`}
                        >
                          {item.status === "Subscribed" ? t("admin_mark_unsubscribed_btn", "Mark Unsubscribed") : t("admin_mark_subscribed_btn", "Mark Subscribed")}
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer border-0 bg-transparent"
                          title={t("admin_delete_subscriber_title", "Delete subscriber")}
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
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

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-fadeIn max-w-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
            {toast.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs font-black text-white leading-tight">{t("admin_notification_title", "Notification")}</span>
            <span className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
