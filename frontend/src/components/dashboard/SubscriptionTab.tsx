import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FiCheck, FiInfo, FiLayers, FiCalendar, FiCreditCard, FiDownload, FiFileText, FiPrinter } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";
import { API_URL } from "@/config/api";
import { useDashboard } from "@/app/dashboard/DashboardContext";

interface SubscriptionInfo {
  active_plan_id: number | null;
  plan_name: string | null;
  description: string | null;
  price: string | number;
  period: string | null;
  gig_discount_percent: number;
  features: string[] | string;
  credits: number;
  plan_duration: number;
  plan_role: string;
  user_created_at: string;
  active_plan_expires_at: string | null;
}

interface LimitInfo {
  limitReached: boolean;
  submittedCount: number;
  limit: number;
  resetDate: string | null;
  isPaidOption: boolean;
}

interface Invoice {
  invoice_id: number;
  invoice_number: string;
  plan_name: string;
  amount: string;
  payment_method: string;
  status: string;
  created_at: string;
  billing_name?: string;
  billing_email?: string;
}

export default function SubscriptionTab() {
  const { t } = useLanguage();
  const { siteName } = useDashboard();
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Session expired. Please log in.");
          setLoading(false);
          return;
        }

        const [subRes, limitRes, invoicesRes] = await Promise.all([
          fetch(`${API_URL}/users/me/subscription`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/proposals/limit-check`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/users/me/subscription-invoices`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!subRes.ok) {
          throw new Error("Failed to load subscription details.");
        }

        const subData = await subRes.json();
        let limitData = null;
        if (limitRes.ok) {
          limitData = await limitRes.json();
        }

        let invoicesData = [];
        if (invoicesRes.ok) {
          invoicesData = await invoicesRes.json();
        }

        setSubInfo(subData);
        setLimitInfo(limitData);
        setInvoices(invoicesData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      fetchSubData();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-700/30 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading plan subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subInfo) {
    return (
      <div className="flex-1 p-6 bg-slate-50/50 flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm max-w-lg mx-auto mt-10">
          <h2 className="text-base font-extrabold text-slate-800">Subscription Unavailable</h2>
          <p className="text-xs text-slate-500 font-semibold mt-2">{error || "Could not retrieve your current plan information."}</p>
          <Link href="/pricing" className="mt-4 inline-block bg-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-teal-800 transition">
            Browse Membership Plans
          </Link>
        </div>
      </div>
    );
  }

  // Parse features list
  let parsedFeatures: string[] = [];
  if (subInfo.features) {
    try {
      parsedFeatures = typeof subInfo.features === "string"
        ? JSON.parse(subInfo.features)
        : subInfo.features;
    } catch (e) {
      console.error(e);
    }
  }

  const planName = subInfo.plan_name || "Free Tier";
  const duration = subInfo.plan_duration || 30;
  const planPrice = parseFloat(subInfo.price as any || 0);

  // Proposal limits
  const totalBids = limitInfo ? limitInfo.limit : (subInfo.credits || 10);
  const usedBids = limitInfo ? limitInfo.submittedCount : 0;
  const remainingBids = Math.max(0, totalBids - usedBids);
  const progressPercent = Math.min(100, (usedBids / totalBids) * 100);

  return (
    <div className="space-y-5 sm:space-y-8 w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <FiLayers className="text-teal-700" /> {t("my_subscription_plan_header", "My Subscription Plan")}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          {t("my_subscription_plan_desc", "Monitor your active membership tier, monthly proposal limits, and premium features.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MEMBERSHIP STATUS CARD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 p-6 text-white shadow-xl shadow-teal-900/10 min-h-[220px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl -ml-8 -mb-8"></div>

            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-[10px] uppercase font-extrabold tracking-widest text-white/80">
                  {t("current_membership_label", "Current Membership")}
                </p>
                <h3 className="text-2xl font-black tracking-tight text-white/95 mt-1">
                  {planName}
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {t("active_status_label", "Active")}
              </span>
            </div>

            <div className="z-10 mt-6">
              <p className="text-3xl font-black tracking-tight">
                {planPrice === 0 ? t("free_price_label", "Free") : `$${planPrice.toFixed(2)}`}
              </p>
              <p className="text-[10px] text-white/90 font-bold uppercase tracking-wider mt-1">
                {t("billed_every_days", "Billed every {{duration}} Days").replace("{{duration}}", String(duration))}
              </p>
            </div>

            <div className="flex justify-between items-center gap-2 flex-wrap text-[10px] font-extrabold z-10 mt-4 border-t border-white/20 pt-3" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              {subInfo.active_plan_expires_at && subInfo.active_plan_id !== 1 && subInfo.active_plan_id !== 5 ? (
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  <FiCalendar className="shrink-0" />
                  <span>
                    {t("expires_days_left", "Expires: {{date}} ({{days}} Days Left)")
                      .replace("{{date}}", new Date(subInfo.active_plan_expires_at).toLocaleDateString())
                      .replace("{{days}}", String(Math.max(0, Math.ceil((new Date(subInfo.active_plan_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))))}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  <FiCalendar className="shrink-0" />
                  <span>
                    {t("cycle_limit_days", "Cycle Limit: {{duration}} Days").replace("{{duration}}", String(duration))}
                  </span>
                </div>
              )}
              <div className="uppercase font-black whitespace-nowrap shrink-0" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                {t("role_label", "Role: {{role}}").replace("{{role}}", subInfo.plan_role || "Seller")}
              </div>
            </div>
          </div>

          {/* Quick Upgrade/Change plan link */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FiCreditCard className="text-teal-650" /> {t("change_subscription_header", "Change Subscription")}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {t("change_subscription_desc", "Scale your membership tier to get additional credits instantly.")}
              </p>
            </div>
            <Link 
              href="/pricing"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-md shadow-teal-750/15 block text-center cursor-pointer"
            >
              {t("btn_explore_tiers_pricing", "Explore Tiers & Pricing")}
            </Link>
          </div>
        </div>

        {/* CREDITS / BIDS TRACKER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                🪙 {t("bidding_credits_usage_header", "Bidding Credits & Usage details")}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t("total_credits_label", "Total Credits")}</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{totalBids}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t("credits_used_label", "Credits Used")}</span>
                  <p className="text-2xl font-black text-teal-700 mt-1">{usedBids}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t("remaining_balance_label", "Remaining Balance")}</span>
                  <p className="text-2xl font-black text-teal-800 mt-1">{remainingBids}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>{t("cycle_proposal_quota_progress_label", "Cycle Proposal Quota Progress")}</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-gradient-to-r from-teal-650 to-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Reset info box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3 mt-6">
              <FiInfo className="text-teal-700 w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{t("next_reset_date_header", "Next Reset Date")}</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
                  {limitInfo?.resetDate 
                    ? t("next_reset_date_desc", "Your limit of {{total}} credits will refresh automatically on {{date}} (calculated from your registration date and plan duration).")
                        .replace("{{total}}", String(totalBids))
                        .replace("{{date}}", limitInfo.resetDate)
                    : t("next_reset_date_duration_desc", "Your limit of {{total}} credits will refresh automatically after {{duration}} days.")
                        .replace("{{total}}", String(totalBids))
                        .replace("{{duration}}", String(duration))}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PLAN DETAILS & PRIVILEGES */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          ✨ {t("active_plan_features_header", "Active Plan Features & Benefits")}
        </h2>
        {parsedFeatures.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold py-4 text-center">
            {t("no_features_detailed_msg", "No specific features detailed in plan.")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 text-xs font-black shrink-0">
                  <FiCheck />
                </div>
                <span className="text-xs font-extrabold text-slate-700">{feat}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INVOICE HISTORY SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <FiFileText className="text-teal-700 w-4 h-4" /> {t("invoice_history_header", "Invoice History")}
        </h2>
        {invoices.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold py-4 text-center">
            {t("no_invoices_generated_msg", "No paid invoices generated yet.")}
          </p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-widest font-black text-[9px]">
                  <th className="py-3 px-4 font-black">{t("invoice_number_col", "Invoice Number")}</th>
                  <th className="py-3 px-4 font-black">{t("plan_name_col", "Plan Name")}</th>
                  <th className="py-3 px-4 font-black">{t("billing_date_col", "Billing Date")}</th>
                  <th className="py-3 px-4 font-black">{t("payment_method_col", "Payment Method")}</th>
                  <th className="py-3 px-4 font-black">{t("amount_col", "Amount")}</th>
                  <th className="py-3 px-4 font-black">{t("status_col", "Status")}</th>
                  <th className="py-3 px-4 text-right font-black">{t("actions_col", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.invoice_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition font-semibold text-slate-700">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-3.5 px-4">{inv.plan_name}</td>
                    <td className="py-3.5 px-4">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 uppercase">{inv.payment_method}</td>
                    <td className="py-3.5 px-4 font-bold">${parseFloat(inv.amount).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full font-black uppercase">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowInvoiceModal(true);
                        }}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-teal-150 transition cursor-pointer inline-flex items-center gap-1.5 ml-auto"
                      >
                        <FiFileText /> {t("btn_view_invoice", "View Invoice")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVOICE MODAL */}
      {showInvoiceModal && selectedInvoice && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                📄 {t("invoice_details_header", "Subscription Invoice Details")}
              </h3>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-slate-400 hover:text-slate-650 font-black text-sm bg-transparent border-none cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-8 text-left" id="printable-subscription-invoice">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-xl font-black text-teal-800 tracking-tight">{siteName ? siteName.toUpperCase() : "BUY2LANCER"}</h1>
                  <p className="text-[10px] text-slate-450 font-semibold mt-1 leading-normal">
                    100 Pine Street, Suite 1250<br />
                    San Francisco, CA 94111<br />
                    billing@{(siteName || "buy2lancer").toLowerCase().replace(/\s+/g, "")}.com
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-150 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                    {t("official_receipt_label", "Official Receipt")}
                  </span>
                  <p className="text-xs font-bold text-slate-500 mt-4">{t("invoice_number_col", "Invoice Number")}: <span className="text-slate-900 font-extrabold">{selectedInvoice.invoice_number}</span></p>
                  <p className="text-xs font-bold text-slate-500 mt-1">{t("billing_date_col", "Billing Date")}: <span className="text-slate-900 font-extrabold">{new Date(selectedInvoice.created_at).toLocaleDateString()}</span></p>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-100">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">{t("billed_to_label", "Billed To")}</span>
                  <p className="text-xs font-black text-slate-800 mt-1.5">{selectedInvoice.billing_name || (siteName ? `${siteName} Member` : "Buy2Lancer Member")}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedInvoice.billing_email || ""}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">{t("payment_method_col", "Payment Method")}</span>
                  <p className="text-xs font-black text-slate-805 mt-1.5 uppercase">{selectedInvoice.payment_method}</p>
                  <p className="text-[10px] text-emerald-650 font-black mt-1 flex items-center gap-1">✓ {t("paid_in_full_label", "PAID IN FULL")}</p>
                </div>
              </div>

              {/* Line items table */}
              <div className="py-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-widest font-black text-[9px]">
                      <th className="py-2 pb-3 font-black">{t("item_description_col", "Item Description")}</th>
                      <th className="py-2 pb-3 text-center font-black">{t("qty_col", "Qty")}</th>
                      <th className="py-2 pb-3 text-right font-black">{t("price_col", "Price")}</th>
                      <th className="py-2 pb-3 text-right font-black">{t("total_col", "Total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 font-semibold text-slate-750">
                      <td className="py-4">
                        <p className="font-bold text-slate-800">{selectedInvoice.plan_name} Membership Plan Subscription</p>
                        <p className="text-[10px] text-slate-450 font-semibold mt-0.5 leading-normal">Recurring billing cycle access key activation</p>
                      </td>
                      <td className="py-4 text-center">1</td>
                      <td className="py-4 text-right">${parseFloat(selectedInvoice.amount).toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-slate-900">${parseFloat(selectedInvoice.amount).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary calculations */}
              <div className="flex justify-end pt-4 border-t border-slate-150">
                <div className="w-64 space-y-2 text-right text-xs">
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>{t("subtotal_label", "Subtotal:")}</span>
                    <span className="text-slate-800 font-bold">${parseFloat(selectedInvoice.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>{t("tax_label", "Tax (0%):")}</span>
                    <span className="text-slate-800 font-bold">$0.00</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-855 pt-2 border-t border-slate-100 text-sm">
                    <span>{t("total_paid_label", "Total Paid:")}</span>
                    <span className="text-teal-850">${parseFloat(selectedInvoice.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Thank you note */}
              <div className="mt-12 bg-slate-50 rounded-xl p-4 border border-slate-150 text-center">
                <p className="text-xs font-bold text-slate-650">{t("thank_you_subscribing", `Thank you for subscribing to ${siteName || "Buy2Lancer"}!`)}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{t("billing_inquiries_desc", `If you have any billing inquiries, please reach out to billing@${(siteName || "buy2lancer").toLowerCase().replace(/\s+/g, "")}.com.`)}</p>
              </div>
            </div>

            {/* Modal footer / actions */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  const printContent = document.getElementById("printable-subscription-invoice")?.innerHTML;
                  if (printContent) {
                    const iframe = document.createElement("iframe");
                    iframe.style.position = "fixed";
                    iframe.style.right = "0";
                    iframe.style.bottom = "0";
                    iframe.style.width = "0";
                    iframe.style.height = "0";
                    iframe.style.border = "none";
                    document.body.appendChild(iframe);
                    
                    const doc = iframe.contentWindow?.document || iframe.contentDocument;
                    if (doc) {
                      doc.write(`
                        <html>
                          <head>
                            <title>Subscription Invoice - ${siteName || "Buy2Lancer"}</title>
                            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                            <style>
                              body { font-family: sans-serif; padding: 40px; }
                              @media print {
                                .no-print { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="max-w-2xl mx-auto">${printContent}</div>
                            <script>
                              window.onload = function() {
                                window.print();
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      doc.close();
                      
                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 1000);
                    }
                  }
                }}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5 border-none"
              >
                <FiPrinter /> {t("btn_print_receipt", "Print Receipt")}
              </button>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer border-none"
              >
                {t("btn_close", "Close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
