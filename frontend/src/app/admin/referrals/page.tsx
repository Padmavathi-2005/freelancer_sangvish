"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../AdminContext";
import {
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiClock,
  FiSearch,
  FiCheck,
  FiMail,
  FiPhone,
  FiAward
} from "react-icons/fi";

interface ReferralPayout {
  payout_id: number;
  referrer_id: number;
  referred_id: number;
  status: "pending" | "approved" | "rejected";
  amount: string;
  created_at: string;
  referrer_name: string;
  referrer_email: string;
  referred_name: string;
  referred_email: string;
  referred_phone: string | null;
  referred_email_verified: boolean;
  referred_phone_verified: boolean;
  duplicate_phone_count: number;
  has_completed_order: boolean;
  details?: string | any;
}

export default function AdminReferralsPage() {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Local Toast
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastTitle, setToastTitle] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const triggerToast = (type: "success" | "error", title: string, msg: string) => {
    setToastType(type);
    setToastTitle(title);
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/payouts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load referral payouts.");
      }
    } catch (err) {
      console.error("Error fetching admin referral payouts:", err);
      setError("Network error. Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleApprove = async (p: ReferralPayout) => {
    let detailsObj: any = {};
    try {
      detailsObj = typeof p.details === "string" ? JSON.parse(p.details) : (p.details || {});
    } catch (e) {}
    const isSignup = detailsObj.type === "signup_bonus";
    const recipient = isSignup ? p.referred_name : p.referrer_name;
    const targetRole = isSignup ? "referred user" : "promoter";
    
    if (!window.confirm(`Are you sure you want to approve this referral payout? $${parseFloat(p.amount).toFixed(2)} will be paid to the ${targetRole} (${recipient}).`)) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/payouts/${p.payout_id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Payout Approved & Paid", data.message);
        fetchPayouts();
      } else {
        triggerToast("error", "Action Failed", data.message || "Failed to approve payout.");
      }
    } catch (err) {
      console.error("Error approving payout:", err);
      triggerToast("error", "Error", "Failed to connect to server.");
    }
  };

  const handleReject = async (payoutId: number) => {
    if (!window.confirm("Are you sure you want to reject this referral payout request?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/referrals/payouts/${payoutId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Request Rejected", data.message);
        fetchPayouts();
      } else {
        triggerToast("error", "Action Failed", data.message || "Failed to reject payout.");
      }
    } catch (err) {
      console.error("Error rejecting payout:", err);
      triggerToast("error", "Error", "Failed to connect to server.");
    }
  };

  // Filter and search calculations
  const filteredPayouts = payouts.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      p.referrer_name.toLowerCase().includes(cleanSearch) ||
      p.referrer_email.toLowerCase().includes(cleanSearch) ||
      p.referred_name.toLowerCase().includes(cleanSearch) ||
      p.referred_email.toLowerCase().includes(cleanSearch);
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-5 right-5 px-5 py-4 rounded-xl shadow-2xl flex flex-col gap-1 z-50 border ${
          toastType === "success"
            ? "bg-slate-900 border-slate-800 text-white"
            : "bg-rose-950 border-rose-800 text-white"
        }`}>
          <span className={`text-xs font-black ${toastType === "success" ? "text-teal-400" : "text-rose-400"}`}>{toastTitle}</span>
          <span className="text-[11px] font-semibold text-slate-300">{toastMsg}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h2 className="text-xl font-black tracking-tight">Referral Program Auditing</h2>
        <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Audit and approve wallet payout bonuses for refer and earn campaigns
        </p>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-6 rounded-xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-600 text-lg shrink-0">
            <FiClock />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Pending Audits</span>
            <span className="text-2xl font-black mt-1 block">
              {payouts.filter(p => p.status === "pending").length}
            </span>
          </div>
        </div>

        <div className={`p-6 rounded-xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 text-lg shrink-0">
            <FiCheckCircle />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Approved Payouts</span>
            <span className="text-2xl font-black mt-1 block">
              {payouts.filter(p => p.status === "approved").length}
            </span>
          </div>
        </div>

        <div className={`p-6 rounded-xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 text-lg shrink-0">
            <FiDollarSign />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Paid Out</span>
            <span className="text-2xl font-black mt-1 block">
              ${payouts.filter(p => p.status === "approved").reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm ${
        isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === status
                  ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                  : (isDark ? "text-slate-400 hover:bg-slate-900" : "text-slate-500 hover:bg-slate-100")
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 w-full md:max-w-xs ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}>
          <FiSearch className="text-slate-450 shrink-0" />
          <input
            type="text"
            placeholder="Search email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs font-semibold outline-none w-full"
          />
        </div>
      </div>

      {/* Main auditing table */}
      <div className={`border rounded-xl overflow-hidden shadow-sm ${
        isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
      }`}>
        {filteredPayouts.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] font-black uppercase tracking-wider select-none ${
                  isDark ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-slate-100/30 border-slate-150 text-slate-450"
                }`}>
                  <th className="px-6 py-4">Referrer</th>
                  <th className="px-6 py-4">Referred Person</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Verification Audit</th>
                  <th className="px-6 py-4">Fraud Flags</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p) => {
                  const hasDuplicatePhone = p.duplicate_phone_count > 0;
                  const isLegit = !hasDuplicatePhone && p.has_completed_order;

                  return (
                    <tr 
                      key={p.payout_id} 
                      className={`border-b transition-colors ${
                        isDark ? "border-slate-850 hover:bg-slate-900/25" : "border-slate-100 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Referrer info */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black leading-normal">{p.referrer_name}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            <FiMail className="w-3 h-3 shrink-0" />
                            {p.referrer_email}
                          </span>
                        </div>
                      </td>

                      {/* Referred Person info */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black leading-normal">{p.referred_name}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            <FiMail className="w-3 h-3 shrink-0" />
                            {p.referred_email}
                          </span>
                          {p.referred_phone && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <FiPhone className="w-3 h-3 shrink-0" />
                              {p.referred_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payout Type */}
                      <td className="px-6 py-4.5">
                        {(() => {
                          let detailsObj: any = {};
                          try {
                            detailsObj = typeof p.details === "string" ? JSON.parse(p.details) : (p.details || {});
                          } catch (e) {}
                          const isSignup = detailsObj.type === "signup_bonus";
                          return (
                            <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                              isSignup 
                                ? "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900" 
                                : "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900"
                            }`}>
                              {isSignup ? "Sign-up Reward" : "Promoter Reward"}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Verification Audit details */}
                      <td className="px-6 py-4.5 text-xs font-semibold">
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-1.5">
                            {p.referred_email_verified ? (
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <FiXCircle className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                            )}
                            <span>Email Verified</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            {p.referred_phone_verified ? (
                              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <FiXCircle className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                            )}
                            <span>Phone Verified</span>
                          </span>
                        </div>
                      </td>

                      {/* Auditing and Fraud Flags */}
                      <td className="px-6 py-4.5 text-xs font-semibold">
                        <div className="flex flex-col gap-1.5">
                          {/* Unique Phone Check */}
                          {hasDuplicatePhone ? (
                            <span className="flex items-center gap-1.5 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/15 w-fit">
                              <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Duplicate Phone ({p.duplicate_phone_count} other accounts)</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 w-fit">
                              <FiCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>Unique Phone</span>
                            </span>
                          )}

                          {/* Order Completion Check */}
                          {p.has_completed_order ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 w-fit">
                              <FiAward className="w-3.5 h-3.5 shrink-0" />
                              <span>First Order Completed</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15 w-fit">
                              <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>No Orders Yet</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full ${
                          p.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : p.status === "rejected"
                            ? "bg-rose-50 text-rose-750 border border-rose-100"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-right">
                        {p.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(p)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-emerald-650 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/15 transition-all cursor-pointer ${
                                !isLegit ? "opacity-75" : ""
                              }`}
                              title={!isLegit ? "Warning: Payout failed safety audits" : "Audit looks clean"}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(p.payout_id)}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-rose-650 hover:bg-rose-50 border border-rose-200/60 hover:text-rose-700 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest select-none">
                            Audited
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 text-2xl rounded-full">
              <FiUsers />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-700">No Referral Payouts Found</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed font-semibold">
                No referral reward requests fit the current search filters.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
