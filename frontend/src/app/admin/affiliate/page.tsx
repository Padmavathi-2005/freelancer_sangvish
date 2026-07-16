"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { useAdmin } from "../AdminContext";
import {
  FiBriefcase,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiClock,
  FiSearch,
  FiCheck,
  FiMail,
  FiActivity
} from "react-icons/fi";

interface AffiliateCommission {
  commission_id: number;
  affiliate_id: number;
  referred_user_id: number;
  transaction_id: number;
  amount: string;
  platform_fee: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  affiliate_name: string;
  affiliate_email: string;
  referred_name: string;
  referred_email: string;
}

export default function AdminAffiliatePage() {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/affiliates/commissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCommissions(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load affiliate commissions.");
      }
    } catch (err) {
      console.error("Error fetching admin affiliate commissions:", err);
      setError("Network error. Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const handleApprove = async (commissionId: number) => {
    if (!window.confirm("Are you sure you want to approve this affiliate commission? The funds will be credited to the affiliate's wallet.")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/affiliates/commissions/${commissionId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Commission Approved & Paid", data.message);
        fetchCommissions();
      } else {
        triggerToast("error", "Action Failed", data.message || "Failed to approve commission.");
      }
    } catch (err) {
      console.error("Error approving commission:", err);
      triggerToast("error", "Error", "Failed to connect to server.");
    }
  };

  const handleReject = async (commissionId: number) => {
    if (!window.confirm("Are you sure you want to reject this affiliate commission?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/affiliates/commissions/${commissionId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Commission Rejected", data.message);
        fetchCommissions();
      } else {
        triggerToast("error", "Action Failed", data.message || "Failed to reject commission.");
      }
    } catch (err) {
      console.error("Error rejecting commission:", err);
      triggerToast("error", "Error", "Failed to connect to server.");
    }
  };

  const filteredCommissions = commissions.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      c.affiliate_name.toLowerCase().includes(cleanSearch) ||
      c.affiliate_email.toLowerCase().includes(cleanSearch) ||
      c.referred_name.toLowerCase().includes(cleanSearch) ||
      c.referred_email.toLowerCase().includes(cleanSearch);
    
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
        <h2 className="text-xl font-black tracking-tight">Affiliate Program Auditing</h2>
        <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Audit and approve referral commissions generated on platform transaction fees
        </p>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-6 rounded-xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-600 text-lg shrink-0">
            <FiClock />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>Pending Commissions</span>
            <span className="text-2xl font-black mt-1 block">
              {commissions.filter(c => c.status === "pending").length}
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
              {commissions.filter(c => c.status === "approved").length}
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
              ${commissions.filter(c => c.status === "approved").reduce((sum, c) => sum + parseFloat(c.amount), 0).toFixed(2)}
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
        {filteredCommissions.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] font-black uppercase tracking-wider select-none ${
                  isDark ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-slate-100/30 border-slate-150 text-slate-450"
                }`}>
                  <th className="px-6 py-4">Affiliate Promoter</th>
                  <th className="px-6 py-4">Referred Transactor</th>
                  <th className="px-6 py-4">Platform Fee Earned</th>
                  <th className="px-6 py-4">Affiliate Share (10%)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((c) => (
                  <tr 
                    key={c.commission_id} 
                    className={`border-b transition-colors ${
                      isDark ? "border-slate-850 hover:bg-slate-900/25" : "border-slate-100 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Affiliate info */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black leading-normal">{c.affiliate_name}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <FiMail className="w-3 h-3 shrink-0" />
                          {c.affiliate_email}
                        </span>
                      </div>
                    </td>

                    {/* Referred Transactor info */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black leading-normal">{c.referred_name}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                          <FiMail className="w-3 h-3 shrink-0" />
                          {c.referred_email}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-450 mt-0.5">
                          Tx ID: #{c.transaction_id}
                        </span>
                      </div>
                    </td>

                    {/* Platform Fee */}
                    <td className="px-6 py-4.5 text-xs font-bold text-slate-500">
                      ${parseFloat(c.platform_fee).toFixed(2)}
                    </td>

                    {/* Affiliate share */}
                    <td className="px-6 py-4.5 text-xs font-black text-slate-800">
                      ${parseFloat(c.amount).toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4.5">
                      <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full ${
                        c.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : c.status === "rejected"
                          ? "bg-rose-50 text-rose-750 border border-rose-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4.5 text-right">
                      {c.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(c.commission_id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-emerald-650 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/15 transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(c.commission_id)}
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 text-2xl rounded-full">
              <FiActivity />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-700">No Affiliate Payouts Found</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed font-semibold">
                No affiliate commission requests fit the current search filters.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
