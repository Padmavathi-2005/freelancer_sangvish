"use client";

import React, { useMemo, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useLanguage } from "@/context/LanguageContext";
import { FiTrendingUp, FiArrowUpRight, FiArrowDownRight, FiClock, FiLayers, FiFileText, FiDownload, FiDollarSign } from "react-icons/fi";

export default function ReportsPage() {
  const { t } = useLanguage();
  const {
    userRole,
    walletInfo,
    freelancerContracts,
    gigApplications,
    clientApplications,
    siteName
  } = useDashboard();

  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");

  const balance = parseFloat(walletInfo?.wallet?.balance || "0.00");
  const transactions = useMemo(() => walletInfo?.transactions || [], [walletInfo]);

  // Calculations for Freelancer
  const freelancerStats = useMemo(() => {
    const contracts = freelancerContracts || [];
    const gigs = gigApplications || [];

    const activeContracts = contracts.filter((c: any) => c.status === "In Progress" || c.status === "Under Review");
    const completedContracts = contracts.filter((c: any) => c.status === "Completed");

    const activeGigs = gigs.filter((g: any) => g.status !== "Completed" && g.status !== "Rejected" && g.status !== "Declined");
    const completedGigs = gigs.filter((g: any) => g.status === "Completed");

    // Released & escrow calculations
    let totalReleased = 0;
    let totalEscrow = 0;

    contracts.forEach((c: any) => {
      const budget = parseFloat(c.budget || 0);
      if (c.status === "Completed") {
        totalReleased += budget;
      } else {
        totalEscrow += budget;
      }
    });

    gigs.forEach((g: any) => {
      const budget = parseFloat(g.budget || 0);
      if (g.status === "Completed") {
        totalReleased += budget;
      } else if (g.status === "Accepted") {
        totalEscrow += budget;
      }
    });

    return {
      released: totalReleased,
      escrow: totalEscrow,
      activeProjectsCount: activeContracts.length,
      completedProjectsCount: completedContracts.length,
      activeGigsCount: activeGigs.length,
      completedGigsCount: completedGigs.length
    };
  }, [freelancerContracts, gigApplications]);

  // Calculations for Client
  const clientStats = useMemo(() => {
    const contracts = freelancerContracts || [];
    const gigs = clientApplications || [];

    const activeContracts = contracts.filter((c: any) => c.status === "In Progress" || c.status === "Under Review");
    const completedContracts = contracts.filter((c: any) => c.status === "Completed");

    const activeGigs = gigs.filter((g: any) => g.status !== "Completed" && g.status !== "Rejected" && g.status !== "Declined");
    const completedGigs = gigs.filter((g: any) => g.status === "Completed");

    let totalSpent = 0;
    let totalEscrow = 0;

    contracts.forEach((c: any) => {
      const budget = parseFloat(c.budget || 0);
      if (c.status === "Completed") {
        totalSpent += budget;
      } else {
        totalEscrow += budget;
      }
    });

    gigs.forEach((g: any) => {
      const budget = parseFloat(g.budget || 0);
      if (g.status === "Completed") {
        totalSpent += budget;
      } else if (g.status === "Accepted") {
        totalEscrow += budget;
      }
    });

    return {
      spent: totalSpent,
      escrow: totalEscrow,
      activeProjectsCount: activeContracts.length,
      completedProjectsCount: completedContracts.length,
      activeGigsCount: activeGigs.length,
      completedGigsCount: completedGigs.length
    };
  }, [freelancerContracts, clientApplications]);

  // Combine wallet transactions and withdrawal requests into a unified ledger statement
  const allLedgerItems = useMemo(() => {
    const rawTx = walletInfo?.transactions || [];
    const rawWithdrawals = walletInfo?.withdrawals || [];
    const userWalletId = walletInfo?.wallet?.wallet_id;

    const formattedTx = rawTx.map((tx: any) => {
      const isCredit =
        tx.type === "credit" ||
        tx.type === "deposit" ||
        tx.action === "credit" ||
        tx.action === "deposit" ||
        tx.type === "Deposit" ||
        (userWalletId && tx.receiver_wallet_id === userWalletId);

      const statusUpper = (tx.status || "Completed").toUpperCase();

      return {
        key: `tx-${tx.transaction_id || tx.id}`,
        displayId: `#TX-${tx.transaction_id || tx.id}`,
        description: tx.description || tx.reason || (isCredit ? "Wallet Deposit / Credit" : "Wallet Payment"),
        subtext: `${tx.method || "Escrow"} Payment`,
        createdAt: tx.created_at || tx.timestamp,
        status: statusUpper,
        amount: Math.abs(parseFloat(tx.amount || tx.budget || 0)),
        isCredit
      };
    });

    const formattedWithdrawals = rawWithdrawals.map((w: any) => {
      const statusUpper = (w.status || "Pending").toUpperCase();
      return {
        key: `withdrawal-${w.request_id}`,
        displayId: `#TX-${w.request_id}`,
        description: `Withdrawal request via ${w.payment_method || "Bank Transfer"}`,
        subtext: "Payout Withdrawal",
        createdAt: w.created_at,
        status: statusUpper,
        amount: Math.abs(parseFloat(w.amount || 0)),
        isCredit: false
      };
    });

    const combined = [...formattedWithdrawals, ...formattedTx];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  }, [walletInfo]);

  const filteredTransactions = useMemo(() => {
    if (filterType === "all") return allLedgerItems;
    return allLedgerItems.filter((t: any) => {
      return filterType === "credit" ? t.isCredit : !t.isCredit;
    });
  }, [allLedgerItems, filterType]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const translateTxDescription = (desc: string) => {
    if (!desc) return "";
    
    if (desc === "Simulated account deposit") {
      return t("simulated_account_deposit", "Simulated account deposit");
    }
    if (desc === "PayPal Deposit (Simulated)") {
      return t("paypal_deposit_simulated", "PayPal Deposit (Simulated)");
    }
    if (desc.startsWith("Stripe Deposit (Session:")) {
      const sessionId = desc.replace("Stripe Deposit (Session: ", "").replace(")", "");
      return t("stripe_deposit_session", "Stripe Deposit (Session: {{session_id}})").replace("{{session_id}}", sessionId);
    }
    if (desc.startsWith("Escrow refund due to freelancer cancelling work:")) {
      const projectName = desc.replace("Escrow refund due to freelancer cancelling work:", "").trim();
      return t("escrow_refund_cancelled_work", "Escrow refund due to freelancer cancelling work: {{projectName}}").replace("{{projectName}}", projectName);
    }
    if (desc.startsWith("Escrow payment for contract milestones:")) {
      const projectName = desc.replace("Escrow payment for contract milestones:", "").trim();
      return t("escrow_payment_milestones", "Escrow payment for contract milestones: {{projectName}}").replace("{{projectName}}", projectName);
    }
    if (desc.startsWith("Withdrawal request via")) {
      const method = desc.replace("Withdrawal request via", "").trim();
      return t("withdrawal_request_via", "Withdrawal request via {{method}}").replace("{{method}}", method);
    }
    if (desc === "Manual platform wallet release payout") {
      return t("manual_platform_payout", "Manual platform wallet release payout");
    }
    if (desc === "Referral sign-up bonus reward") {
      return t("referral_signup_bonus", "Referral sign-up bonus reward");
    }
    if (desc.startsWith("Referral reward for user_id =")) {
      const userId = desc.replace("Referral reward for user_id =", "").trim();
      return t("referral_reward_for", "Referral reward for user_id = {{userId}}").replace("{{userId}}", userId);
    }
    if (desc.startsWith("Affiliate commission reward for commission_id =")) {
      const commissionId = desc.replace("Affiliate commission reward for commission_id =", "").trim();
      return t("affiliate_commission_reward", "Affiliate commission reward for commission_id = {{commissionId}}").replace("{{commissionId}}", commissionId);
    }

    return desc;
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn print:bg-white print:p-0 print:space-y-4 print:w-full">
      {/* PDF Statement Document Branding Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-teal-700 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {siteName || "Buy2Lancer"} — {userRole === "client" ? t("expenditures_financial_report_header", "Expenditures & Financial Report") : t("earnings_financial_report_header", "Earnings & Financial Report")}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Generated on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-md border border-teal-200">
            {t("official_ledger_statement", "Official Ledger Statement")}
          </span>
        </div>
      </div>

      {/* Screen Header Panel */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-[10px] font-black text-teal-700 tracking-widest uppercase mb-1 block">{t("financial_analytics_label", "Financial Analytics")}</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {userRole === "client" ? t("expenditures_financial_report_header", "Expenditures & Financial Report") : t("earnings_financial_report_header", "Earnings & Financial Report")}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
            {t("reports_header_desc", "Real-time cashflow analytics, project milestone funding states, and detailed ledger statements.")}
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer shrink-0"
        >
          <FiDownload className="w-4 h-4 shrink-0" />
          <span>{t("btn_export_pdf_report", "Export PDF Report")}</span>
        </button>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:mb-6">
        {/* Main metric card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] print:border-2 print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-slate-900">
              {userRole === "client" ? t("total_expenditures", "Total Expenditures") : t("total_net_earnings", "Total Net Earnings")}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-650 border border-teal-100 flex items-center justify-center shrink-0">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight print:text-slate-900">
              ${(userRole === "client" ? clientStats.spent : freelancerStats.released).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold mt-1 print:text-slate-700">
              {t("total_expenditures_desc", "Confirmed cash released from completed contracts & services")}
            </p>
          </div>
        </div>

        {/* Escrow balance card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] print:border-2 print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-slate-900">
              {userRole === "client" ? t("escrow_payments_label", "Escrow Payments") : t("pending_escrow_label", "Pending Escrow")}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight print:text-slate-900">
              ${(userRole === "client" ? clientStats.escrow : freelancerStats.escrow).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold mt-1 print:text-slate-700">
              {userRole === "client"
                ? t("escrow_payments_desc", "Funds locked securely in active contracts and project milestones")
                : t("pending_escrow_desc", "Awaiting milestone release request approval")}
            </p>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] print:border-2 print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest print:text-slate-900">{t("available_wallet_balance_label", "Available Wallet Balance")}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight print:text-slate-900">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold mt-1 print:text-slate-700">
              {t("available_wallet_balance_desc", "Withdrawable balance or funds ready for deployment")}
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Activity Breakdown */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm print:border-2 print:border-slate-300 print:shadow-none print:p-4 print:mb-6 print:break-inside-avoid">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 print:text-slate-900">{t("contract_service_volume_header", "Contract & Service Volume")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 print:grid-cols-4 print:gap-3">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl print:bg-slate-100 print:border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block print:text-slate-900">{t("active_contracts", "Active Contracts")}</span>
            <span className="text-lg font-black text-slate-900 mt-1 block print:text-slate-900">
              {userRole === "client" ? clientStats.activeProjectsCount : freelancerStats.activeProjectsCount} {t("projects_unit", "Projects")}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl print:bg-slate-100 print:border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block print:text-slate-900">{t("completed_contracts_label", "Completed Contracts")}</span>
            <span className="text-lg font-black text-slate-900 mt-1 block print:text-slate-900">
              {userRole === "client" ? clientStats.completedProjectsCount : freelancerStats.completedProjectsCount} {t("projects_unit", "Projects")}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl print:bg-slate-100 print:border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block print:text-slate-900">{t("ongoing_gig_orders_label", "Ongoing Gig Orders")}</span>
            <span className="text-lg font-black text-slate-900 mt-1 block print:text-slate-900">
              {userRole === "client" ? clientStats.activeGigsCount : freelancerStats.activeGigsCount} {t("gigs_unit", "Gigs")}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl print:bg-slate-100 print:border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block print:text-slate-900">{t("completed_gigs_label", "Completed Gigs")}</span>
            <span className="text-lg font-black text-slate-900 mt-1 block print:text-slate-900">
              {userRole === "client" ? clientStats.completedGigsCount : freelancerStats.completedGigsCount} {t("gigs_unit", "Gigs")}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Statement ledger */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm print:border print:border-slate-200 print:rounded-xl print:shadow-none print:p-6 print:mt-4 print:break-inside-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5 print:mb-4 print:pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider print:text-slate-900">{t("ledger_statement_header", "Ledger Statement")}</h3>
            <p className="text-slate-400 text-xxs font-bold mt-0.5 print:text-slate-700">{t("ledger_statement_desc", "Filter and review transaction logs")}</p>
          </div>
          <div className="flex gap-1.5 select-none print:hidden">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition cursor-pointer border ${
                filterType === "all" ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t("all_logs_filter", "All Logs")}
            </button>
            <button
              onClick={() => setFilterType("credit")}
              className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition cursor-pointer border ${
                filterType === "credit" ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t("credits_only_filter", "Credits Only")}
            </button>
            <button
              onClick={() => setFilterType("debit")}
              className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition cursor-pointer border ${
                filterType === "debit" ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t("debits_only_filter", "Debits Only")}
            </button>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto print:overflow-visible print:break-inside-auto scrollbar-thin">
            <table className="w-full text-xs font-bold text-slate-600 min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 text-left">
                  <th className="pb-3.5 pl-3 pr-2 whitespace-nowrap">{t("transaction_id_col", "Transaction ID")}</th>
                  <th className="pb-3.5 px-2 whitespace-nowrap">{t("details_col", "Details")}</th>
                  <th className="pb-3.5 px-2 whitespace-nowrap">{t("date_col", "Date")}</th>
                  <th className="pb-3.5 px-2 whitespace-nowrap">{t("status_col", "Status")}</th>
                  <th className="pb-3.5 text-right pr-3 pl-2 whitespace-nowrap">{t("amount_col", "Amount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map((tx: any) => {
                  const isCredit = tx.isCredit;
                  const dateStr = new Date(tx.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={tx.key} className="hover:bg-slate-50/50 transition-colors print:break-inside-avoid">
                       <td className="py-4 pl-3 pr-2 font-mono text-xxs text-slate-400 whitespace-nowrap">
                        {tx.displayId}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}>
                            {isCredit ? <FiArrowUpRight className="w-4 h-4" /> : <FiArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-slate-855 font-black block">{translateTxDescription(tx.description)}</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{tx.subtext}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-slate-500 font-medium whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-4 px-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          tx.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                            : tx.status === "REJECTED" || tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                            : "bg-slate-100 text-slate-700 border border-slate-200/80 font-black"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`py-4 text-right font-black pr-3 pl-2 text-sm whitespace-nowrap ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                        {isCredit ? "+" : "-"}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <FiFileText className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-xs font-bold">{t("no_financial_logs_msg", "No financial logs match the current filters.")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
