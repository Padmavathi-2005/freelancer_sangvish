"use client";

import React, { useMemo, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { FiTrendingUp, FiArrowUpRight, FiArrowDownRight, FiClock, FiLayers, FiFileText, FiDownload, FiDollarSign } from "react-icons/fi";

export default function ReportsPage() {
  const {
    userRole,
    walletInfo,
    freelancerContracts,
    gigApplications,
    clientApplications,
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

  const filteredTransactions = useMemo(() => {
    if (filterType === "all") return transactions;
    return transactions.filter((t: any) => {
      const isCredit = t.type === "credit" || t.type === "deposit" || t.action === "credit" || t.action === "deposit";
      return filterType === "credit" ? isCredit : !isCredit;
    });
  }, [transactions, filterType]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-8 text-left animate-fadeIn print:bg-white print:p-0 print:space-y-4">
      {/* Header Panel */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
        <div>
          <span className="text-[10px] font-black text-teal-700 tracking-widest uppercase mb-1 block print:hidden">Financial Analytics</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {userRole === "client" ? "Expenditures & Financial Report" : "Earnings & Financial Report"}
          </h1>
          <p className="text-slate-505 text-xs mt-1 font-medium leading-relaxed">
            Real-time cashflow analytics, project milestone funding states, and detailed ledger statements.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer print:hidden"
        >
          <FiDownload className="w-4 h-4 shrink-0" />
          <span>Export PDF Report</span>
        </button>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main metric card */}
        <div className="bg-gradient-to-br from-teal-800 to-teal-650 rounded-xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px] border border-teal-700">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.04] rounded-full filter blur-xl"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100">
              {userRole === "client" ? "Total Expenditures" : "Total Net Earnings"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-teal-205">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              ${(userRole === "client" ? clientStats.spent : freelancerStats.released).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-teal-150 text-[10px] font-bold mt-1">
              Confirmed cash released from completed contracts & services
            </p>
          </div>
        </div>

        {/* Escrow balance card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {userRole === "client" ? "Escrow Payments" : "Pending Escrow"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${(userRole === "client" ? clientStats.escrow : freelancerStats.escrow).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-slate-450 text-[10px] font-bold mt-1">
              {userRole === "client"
                ? "Funds locked securely in active contracts and project milestones"
                : "Awaiting milestone release request approval"}
            </p>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Wallet Balance</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-slate-455 text-[10px] font-bold mt-1">
              Withdrawable balance or funds ready for deployment
            </p>
          </div>
        </div>
      </div>

      {/* Workspace Activity Breakdown */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6">Contract & Service Volume</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Contracts</span>
            <span className="text-lg font-black text-slate-850 mt-1 block">
              {userRole === "client" ? clientStats.activeProjectsCount : freelancerStats.activeProjectsCount} Projects
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Contracts</span>
            <span className="text-lg font-black text-slate-855 mt-1 block">
              {userRole === "client" ? clientStats.completedProjectsCount : freelancerStats.completedProjectsCount} Projects
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ongoing Gig Orders</span>
            <span className="text-lg font-black text-slate-855 mt-1 block">
              {userRole === "client" ? clientStats.activeGigsCount : freelancerStats.activeGigsCount} Gigs
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Gigs</span>
            <span className="text-lg font-black text-slate-855 mt-1 block">
              {userRole === "client" ? clientStats.completedGigsCount : freelancerStats.completedGigsCount} Gigs
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Statement ledger */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-5">
          <div>
            <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">Ledger Statement</h3>
            <p className="text-slate-400 text-xxs font-bold mt-0.5">Filter and review transaction logs</p>
          </div>
          <div className="flex gap-1.5 select-none print:hidden">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition cursor-pointer border ${
                filterType === "all" ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilterType("credit")}
              className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition cursor-pointer border ${
                filterType === "credit" ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Credits Only
            </button>
            <button
              onClick={() => setFilterType("debit")}
              className={`px-3 py-1.5 rounded-xl text-xxs font-bold transition cursor-pointer border ${
                filterType === "debit" ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Debits Only
            </button>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-bold text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 text-left">
                  <th className="pb-3.5 pl-2">Transaction ID</th>
                  <th className="pb-3.5">Details</th>
                  <th className="pb-3.5">Date</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map((tx: any) => {
                  const isCredit = tx.type === "credit" || tx.type === "deposit" || tx.action === "credit" || tx.action === "deposit";
                  const dateStr = new Date(tx.created_at || tx.timestamp).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={tx.transaction_id || tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-2 font-mono text-xxs text-slate-400">
                        #TX-{tx.transaction_id || tx.id}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          }`}>
                            {isCredit ? <FiArrowUpRight className="w-4 h-4" /> : <FiArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-slate-850 font-black block">{tx.description || tx.reason || "Wallet Transaction"}</span>
                            <span className="text-[10px] text-slate-400 font-bold capitalize block mt-0.5">{tx.method || "escrow"} payment</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-slate-500 font-medium">
                        {dateStr}
                      </td>
                      <td className="py-4">
                        <span className="bg-emerald-50 text-emerald-705 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                          {tx.status || "Completed"}
                        </span>
                      </td>
                      <td className={`py-4 text-right font-black pr-2 text-sm ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                        {isCredit ? "+" : "-"}${parseFloat(tx.amount || tx.budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            <p className="text-xs font-bold">No financial logs match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
