"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAdmin } from "../AdminContext";
import { useLanguage } from "@/context/LanguageContext";
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
  FiAward,
  FiInfo,
  FiGift,
  FiLayers,
  FiArrowRight,
  FiX
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
  is_onboarded: boolean;
  referral_stage: "pending" | "onboarding_completed" | "purchased" | "completed" | "approved" | "rejected";
  details?: string | any;
}

export default function AdminReferralsPage() {
  const { t } = useLanguage();
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [typeFilter, setTypeFilter] = useState<"all" | "signup_bonus" | "referral_bonus">("all");

  // Modal Audit Steps state
  const [selectedAuditPayout, setSelectedAuditPayout] = useState<ReferralPayout | null>(null);

  // Drag to scroll table state
  const tableRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeft(tableRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableRef.current.scrollLeft = scrollLeft - walk;
  };

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
    
    if (!window.confirm(`${t("admin_confirm_approve_payout_prompt", "Are you sure you want to approve this payout?")} $${parseFloat(p.amount).toFixed(2)} ${t("admin_will_be_credited_to", "will be credited to")} ${recipient}.`)) return;
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
        triggerToast("success", t("admin_payout_approved_credited", "Payout Approved & Credited"), data.message);
        if (selectedAuditPayout?.payout_id === p.payout_id) {
          setSelectedAuditPayout(null);
        }
        fetchPayouts();
      } else {
        triggerToast("error", t("admin_action_failed", "Action Failed"), data.message || t("admin_failed_approve_payout", "Failed to approve payout."));
      }
    } catch (err) {
      console.error("Error approving payout:", err);
      triggerToast("error", t("error", "Error"), t("admin_failed_connect_server", "Failed to connect to server."));
    }
  };

  const handleReject = async (payoutId: number) => {
    if (!window.confirm(t("admin_confirm_reject_payout_prompt", "Are you sure you want to reject this payout request?"))) return;
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
        triggerToast("success", t("admin_request_rejected", "Request Rejected"), data.message);
        if (selectedAuditPayout?.payout_id === payoutId) {
          setSelectedAuditPayout(null);
        }
        fetchPayouts();
      } else {
        triggerToast("error", t("admin_action_failed", "Action Failed"), data.message || t("admin_failed_reject_payout", "Failed to reject payout."));
      }
    } catch (err) {
      console.error("Error rejecting payout:", err);
      triggerToast("error", t("error", "Error"), t("admin_failed_connect_server", "Failed to connect to server."));
    }
  };

  // Helper to identify if a payout is a Signup Bonus vs Referral Bonus
  const isSignupPayout = (p: ReferralPayout) => {
    try {
      const detailsObj = typeof p.details === "string" ? JSON.parse(p.details) : (p.details || {});
      return detailsObj.type === "signup_bonus";
    } catch (e) {
      return false;
    }
  };

  // Filter and search calculations
  const filteredPayouts = payouts.filter((p) => {
    const isSignup = isSignupPayout(p);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesType = typeFilter === "all" || (typeFilter === "signup_bonus" ? isSignup : !isSignup);
    
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      p.referrer_name.toLowerCase().includes(cleanSearch) ||
      p.referrer_email.toLowerCase().includes(cleanSearch) ||
      p.referred_name.toLowerCase().includes(cleanSearch) ||
      p.referred_email.toLowerCase().includes(cleanSearch);
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const signupPayoutsCount = payouts.filter(p => isSignupPayout(p)).length;
  const referralPayoutsCount = payouts.filter(p => !isSignupPayout(p)).length;

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left rtl:text-right">

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-fadeIn max-w-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
            toastType === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
            {toastType === "success" ? "✓" : "✕"}
          </div>
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs font-black text-white leading-tight">{toastTitle || "Notification"}</span>
            {toastMsg && (
              <span className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">{toastMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <h2 className="text-xl font-black tracking-tight">{t("admin_referral_signup_auditing", "Referral & Sign-Up Bonus Auditing")}</h2>
        <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {t("admin_referral_signup_auditing_desc", "Audit step-by-step progress, verify eligibility, and approve bonus wallet payouts")}
        </p>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-600 text-lg shrink-0">
            <FiClock />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("admin_pending_audits", "Pending Audits")}</span>
            <span className="text-2xl font-black mt-1 block">
              {payouts.filter(p => p.status === "pending").length}
            </span>
          </div>
        </div>

        <div className={`p-5 rounded-xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 text-lg shrink-0">
            <FiGift />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("admin_signup_bonus_requests", "Sign-Up Bonus Requests")}</span>
            <span className="text-2xl font-black mt-1 block text-purple-600 dark:text-purple-400">
              {signupPayoutsCount}
            </span>
          </div>
        </div>

        <div className={`p-5 rounded-xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 text-lg shrink-0">
            <FiCheckCircle />
          </div>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("admin_total_released_payouts", "Total Released Payouts")}</span>
            <span className="text-2xl font-black mt-1 block text-emerald-600 dark:text-emerald-400">
              ${payouts.filter(p => p.status === "approved").reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className={`p-4 rounded-xl border flex flex-col lg:flex-row gap-4 items-center justify-between shadow-sm ${
        isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
      }`}>
        
        {/* Type & Status Tabs */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto min-w-0 max-w-full">
          
          {/* Type Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto min-w-0 max-w-full">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap shrink-0 ${
                typeFilter === "all" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {t("admin_all_types", "All Types")} ({payouts.length})
            </button>
            <button
              onClick={() => setTypeFilter("signup_bonus")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                typeFilter === "signup_bonus" ? "bg-purple-600 text-white shadow-xs" : "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              }`}
            >
              <FiGift className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{t("admin_signup_bonuses_tab", "Sign-up Bonuses")} ({signupPayoutsCount})</span>
            </button>
            <button
              onClick={() => setTypeFilter("referral_bonus")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                typeFilter === "referral_bonus" ? "bg-teal-700 text-white shadow-xs" : "text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
              }`}
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{t("admin_referral_rewards_tab", "Referral Rewards")} ({referralPayoutsCount})</span>
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto min-w-0 max-w-full">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  statusFilter === status
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm"
                    : (isDark ? "text-slate-400 hover:bg-slate-900" : "text-slate-500 hover:bg-slate-100")
                }`}
              >
                {status === "all" ? t("admin_all", "All") : status === "pending" ? t("pending", "Pending") : status === "approved" ? t("approved", "Approved") : t("rejected", "Rejected")}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 w-full lg:max-w-xs ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`}>
          <FiSearch className="text-slate-450 shrink-0" />
          <input
            type="text"
            placeholder={t("admin_search_email_name", "Search email, name...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs font-semibold border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none w-full"
          />
        </div>
      </div>

      {/* Main Auditing Table */}
      <div className={`border rounded-xl overflow-hidden shadow-sm min-w-0 max-w-full ${
        isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
      }`}>
        {filteredPayouts.length > 0 ? (
          <div 
            ref={tableRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`overflow-x-auto w-full select-none cursor-grab active:cursor-grabbing transition-colors ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full text-left rtl:text-right border-collapse min-w-[650px]">
              <thead>
                <tr className={`border-b text-xs font-bold select-none ${
                  isDark ? "bg-slate-900/50 border-slate-800 text-slate-400" : "bg-slate-100/60 border-slate-200 text-slate-600"
                }`}>
                  <th className="px-6 py-3.5 whitespace-nowrap text-left rtl:text-right">{t("admin_target_user_promoter", "Target User / Promoter")}</th>
                  <th className="px-6 py-3.5 whitespace-nowrap text-left rtl:text-right">{t("admin_reward_type_amount", "Reward Type & Amount")}</th>
                  <th className="px-6 py-3.5 whitespace-nowrap text-left rtl:text-right">{t("admin_audit_checks_roadmap", "Audit Checks & Roadmap")}</th>
                  <th className="px-6 py-3.5 whitespace-nowrap text-left rtl:text-right">{t("status_label", "Status")}</th>
                  <th className="px-6 py-3.5 text-right rtl:text-left whitespace-nowrap">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p) => {
                  const isSignup = isSignupPayout(p);
                  const hasDuplicatePhone = p.duplicate_phone_count > 0;

                  return (
                    <tr 
                      key={p.payout_id} 
                      className={`border-b transition-colors ${
                        isDark ? "border-slate-850 hover:bg-slate-900/25" : "border-slate-100 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* User Info */}
                      <td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.referred_name || p.referrer_name}</span>
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <FiMail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            {p.referred_email || p.referrer_email}
                          </span>
                          {p.referred_phone && (
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <FiPhone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              {p.referred_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reward Type & Amount */}
                      <td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border whitespace-nowrap ${
                            isSignup 
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" 
                              : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
                          }`}>
                            {isSignup ? <FiGift className="w-3 h-3 text-purple-600" /> : <FiLayers className="w-3 h-3 text-teal-600" />}
                            <span>{isSignup ? t("signup_bonus_label", "Sign-up Bonus") : t("referral_reward_label", "Referral Reward")}</span>
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            ${parseFloat(p.amount).toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Audit Checks Badges & Interactive Roadmap Trigger */}
                      <td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right">
                        <div className="flex items-center gap-2 flex-wrap">
                          
                          {/* Email Verified */}
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1.5 whitespace-nowrap ${
                            p.referred_email_verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {p.referred_email_verified ? <FiCheck className="w-3 h-3 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            <span>{t("admin_email_verified", "Email Verified")}</span>
                          </span>

                          {/* Profile Onboarded */}
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1.5 whitespace-nowrap ${
                            p.is_onboarded || p.has_completed_order ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {p.is_onboarded || p.has_completed_order ? <FiCheck className="w-3 h-3 text-emerald-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                            <span>{t("admin_profile_onboarded", "Profile Onboarded")}</span>
                          </span>

                          {/* Requirement Check: Signup bonus vs Referral promoter reward */}
                          {isSignup ? (
                            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 whitespace-nowrap">
                              <FiCheckCircle className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>{t("admin_signup_eligibility_met", "Sign-up Eligibility Met")}</span>
                            </span>
                          ) : p.has_completed_order ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 whitespace-nowrap">
                              <FiAward className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{t("admin_order_completed", "Order Completed")}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 whitespace-nowrap">
                              <FiAlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{t("admin_order_pending", "Order Pending")}</span>
                            </span>
                          )}

                          {hasDuplicatePhone && (
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 whitespace-nowrap">
                              <FiAlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>{t("admin_duplicate_phone", "Duplicate Phone")}</span>
                            </span>
                          )}

                          {/* INTERACTIVE ROADMAP POPUP BUTTON */}
                          <button
                            type="button"
                            onClick={() => setSelectedAuditPayout(p)}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[11px] font-bold px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <FiInfo className="w-3 h-3 text-teal-600" />
                            <span>{t("admin_view_audit_steps", "View Audit Steps ↗")}</span>
                          </button>

                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-left rtl:text-right">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border whitespace-nowrap ${
                          p.status === "approved"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : p.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}>
                          {p.status === "approved" ? (
                            <>
                              <FiCheck className="w-3.5 h-3.5 text-white" />
                              <span>{t("admin_approved_paid", "Approved & Paid")}</span>
                            </>
                          ) : p.status === "rejected" ? (
                            <>
                              <FiXCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{t("rejected", "Rejected")}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span>{t("admin_pending_audit", "Pending Audit")}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right rtl:text-left whitespace-nowrap">
                        {p.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => handleApprove(p)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 hover:shadow-md transition-all cursor-pointer border-0 inline-flex items-center gap-1.5"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              <span>{t("admin_approve_payout", "Approve Payout")}</span>
                            </button>
                            <button
                              onClick={() => handleReject(p.payout_id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 hover:text-rose-700 transition-all cursor-pointer"
                            >
                              {t("reject", "Reject")}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg select-none inline-flex items-center gap-1.5 whitespace-nowrap">
                            <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t("admin_paid_label", "Paid")}</span>
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
                No referral reward or sign-up bonus requests fit the current search filters.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* POPUP MODAL: STEP-BY-STEP AUDIT WORKFLOW ROADMAP */}
      {selectedAuditPayout && (() => {
        const p = selectedAuditPayout;
        const isSignup = isSignupPayout(p);
        const recipientName = p.referred_name || p.referrer_name || "User";
        const recipientEmail = p.referred_email || p.referrer_email;

        // Timeline steps configuration
        interface AuditStepItem {
          title: string;
          desc: string;
          completed: boolean;
          statusLabel: string;
          isCurrent?: boolean;
          isRejected?: boolean;
        }

        const steps: AuditStepItem[] = [
          {
            title: t("admin_account_registration_step", "1. Account Registration"),
            desc: `${t("admin_user_registered_on", "User registered account on ")}${new Date(p.created_at || Date.now()).toLocaleDateString()}`,
            completed: true,
            statusLabel: t("admin_completed_status", "Completed")
          },
          {
            title: t("admin_email_verification_step", "2. Email Verification"),
            desc: p.referred_email_verified ? t("admin_email_otp_verified", "Email OTP verified successfully") : t("admin_pending_email_verification", "Pending email verification"),
            completed: p.referred_email_verified,
            statusLabel: p.referred_email_verified ? t("admin_verified_tick", "Verified ✅") : t("admin_pending_hourglass", "Pending ⏳")
          },
          {
            title: t("admin_profile_onboarding_step", "3. Profile Onboarding Setup"),
            desc: p.is_onboarded ? t("admin_completed_onboarding_wizard", "User completed all onboarding wizard steps (5/5)") : t("admin_profile_onboarding_in_progress", "User profile onboarding in progress"),
            completed: p.is_onboarded,
            statusLabel: p.is_onboarded ? t("admin_completed_tick", "Completed ✅") : t("admin_in_progress_hourglass", "In Progress ⏳")
          }
        ];

        if (!isSignup) {
          steps.push({
            title: t("admin_first_purchase_step", "4. First Gig / Project Purchase"),
            desc: p.has_completed_order ? t("admin_referred_completed_first_transaction", "Referred user completed first transaction order") : t("admin_waiting_first_purchase", "Waiting for referred user to make a purchase"),
            completed: p.has_completed_order,
            statusLabel: p.has_completed_order ? t("admin_verified_tick", "Verified ✅") : t("admin_waiting_hourglass", "Waiting ⏳")
          });
        }

        steps.push({
          title: `${isSignup ? "4" : "5"}. ${t("admin_audit_approval_step", "Admin Audit & Approval")}`,
          desc: p.status === "approved" 
            ? t("admin_approved_by_admin", "Approved by admin") 
            : p.status === "rejected" 
            ? t("admin_rejected_by_admin", "Rejected by admin") 
            : t("admin_awaiting_approval_decision", "Awaiting admin approval decision"),
          completed: p.status === "approved",
          isCurrent: p.status === "pending",
          isRejected: p.status === "rejected",
          statusLabel: p.status === "approved" ? t("admin_approved_green", "Approved 🟢") : p.status === "rejected" ? t("admin_rejected_red", "Rejected 🔴") : t("admin_pending_review_yellow", "Pending Review 🟡")
        });

        steps.push({
          title: `${isSignup ? "5" : "6"}. ${t("admin_wallet_balance_release_step", "Wallet Balance Release")}`,
          desc: p.status === "approved"
            ? `$${parseFloat(p.amount).toFixed(2)}${t("admin_credited_into_active_wallet", " credited into user active wallet")}`
            : `$${parseFloat(p.amount).toFixed(2)}${t("admin_credited_upon_approval", " will be credited upon approval")}`,
          completed: p.status === "approved",
          statusLabel: p.status === "approved" ? t("admin_credited_green", "Credited 🟢") : t("admin_next_step_arrow", "Next Step ➡️")
        });

        if (!mounted) return null;

        return createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-[2px] animate-fadeIn">
            <div className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col text-left rtl:text-right ${
              isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}>
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black ${
                    isSignup ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-teal-700"
                  }`}>
                    {isSignup ? <FiGift /> : <FiLayers />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {t("admin_audit_progress_roadmap", "Audit Progress Roadmap #")}{p.payout_id}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                      {isSignup ? t("admin_signup_bonus_verification", "Sign-Up Bonus Verification") : t("admin_referral_reward_verification", "Referral Reward Verification")} • ${parseFloat(p.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAuditPayout(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* User Details Banner */}
              <div className="px-6 py-3 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{t("admin_target_recipient", "Target Recipient")}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{recipientName} ({recipientEmail})</span>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-md capitalize ${
                  p.status === "approved" ? "bg-emerald-100 text-emerald-800" : p.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {t("status_label", "Status")}: {p.status === "approved" ? t("approved", "Approved") : p.status === "rejected" ? t("rejected", "Rejected") : t("pending", "Pending")}
                </span>
              </div>

              {/* Step-by-Step Progress Timeline */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">{t("admin_qualification_workflow", "Step-by-Step Qualification Workflow:")}</h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {steps.map((step, idx) => (
                    <div key={idx} className="relative flex items-start justify-between gap-3 group">
                      
                      {/* Step Circle Indicator */}
                      <div className={`absolute -left-6 top-0.5 w-5.5 h-5.5 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        step.completed
                          ? "bg-emerald-500 text-white ring-4 ring-emerald-500/10"
                          : step.isRejected
                          ? "bg-rose-500 text-white ring-4 ring-rose-500/10"
                          : step.isCurrent
                          ? "bg-amber-50 text-white ring-4 ring-amber-500/20 animate-pulse"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {step.completed ? "✓" : step.isRejected ? "✕" : idx + 1}
                      </div>

                      {/* Step Text Info */}
                      <div className="flex flex-col text-left rtl:text-right">
                        <span className={`text-xs font-extrabold ${step.completed ? "text-emerald-700 dark:text-emerald-400" : step.isCurrent ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
                          {step.title}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {step.desc}
                        </span>
                      </div>

                      {/* Step Status Badge */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap ${
                        step.completed
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : step.isRejected
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : step.isCurrent
                          ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}>
                        {step.statusLabel}
                      </span>

                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <button
                  type="button"
                  onClick={() => setSelectedAuditPayout(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t("admin_close", "Close")}
                </button>
                {p.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(p.payout_id)}
                      className="px-4 py-2 rounded-xl text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                    >
                      {t("admin_reject_request", "Reject Request")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(p)}
                      className="px-4.5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                      <span>{t("admin_approve_payout", "Approve Payout")} (${parseFloat(p.amount).toFixed(2)})</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
}
