"use client";

import React from "react";
import Table from "@/components/Table";
import { DisputeCase, useAdmin } from "@/app/admin/AdminContext";

interface TransactionsTabProps {
  transactionsSubTab: "transactions" | "disputes";
  setTransactionsSubTab: (tab: "transactions" | "disputes") => void;
  transactionsSearch: string;
  setTransactionsSearch: (v: string) => void;
  paginatedTransactions: any[];
  transactionsPage: number;
  totalTransactionsPages: number;
  setTransactionsPage: (page: number) => void;
  filteredTransactions: any[];
  itemsPerPage: number;

  disputes: DisputeCase[];
  resolveDispute: (id: string, resolution: DisputeCase["status"]) => void;
}

export default function TransactionsTab({
  transactionsSubTab,
  setTransactionsSubTab,
  transactionsSearch,
  setTransactionsSearch,
  paginatedTransactions,
  transactionsPage,
  totalTransactionsPages,
  setTransactionsPage,
  filteredTransactions,
  itemsPerPage,
  disputes,
  resolveDispute
}: TransactionsTabProps) {
  const { highlightedDisputeId, setHighlightedDisputeId } = useAdmin();
  
  const transactionColumns = [
    {
      header: "S.No",
      accessor: (row: any, idx: number) => ((transactionsPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: "Contract Title",
      accessor: (row: any) => <div className="font-bold text-slate-800">{row.title}</div>
    },
    {
      header: "Job",
      accessor: (row: any) => row.job_title || "Direct Gig Order"
    },
    {
      header: "Client",
      accessor: (row: any) => row.client_name
    },
    {
      header: "Freelancer",
      accessor: (row: any) => row.freelancer_name
    },
    {
      header: "Budget",
      accessor: (row: any) => `$${Number(row.budget).toLocaleString()}`
    },
    {
      header: "Progress",
      accessor: (row: any) => `${row.progress || 0}%`
    },
    {
      header: "Status",
      accessor: (row: any) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
          row.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
          row.status === "In Progress" ? "bg-teal-50 text-teal-700 border border-teal-200/60" :
          "bg-rose-50 text-rose-700 border border-rose-250"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Transactions Sub-tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start select-none">
        <button
          onClick={() => setTransactionsSubTab("transactions")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            transactionsSubTab === "transactions" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Escrow Contracts
        </button>
        <button
          onClick={() => setTransactionsSubTab("disputes")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            transactionsSubTab === "disputes" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Arbitration disputes
        </button>
      </div>

      {transactionsSubTab === "transactions" ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Transaction & contract escrows</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Track secure escrow deposits, progress percentages, and active milestones payout releases.</p>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search contracts..."
                value={transactionsSearch}
                onChange={(e) => setTransactionsSearch(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <Table
            columns={transactionColumns}
            data={paginatedTransactions}
            currentPage={transactionsPage}
            totalPages={totalTransactionsPages}
            onPageChange={setTransactionsPage}
            totalItems={filteredTransactions.length}
            itemsPerPage={itemsPerPage}
            emptyMessage="No contract records found."
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-805">Disputes & Arbitration Hub</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Review client complaints, freelancer counters, and execute escrow payouts or refunds.</p>
          </div>

          {disputes.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-slate-505 text-sm font-semibold">All dispute folders are currently resolved.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {disputes.map((disp) => (
                <div 
                  key={disp.id} 
                  onMouseEnter={() => {
                    if (disp.id === highlightedDisputeId) {
                      setHighlightedDisputeId(null);
                    }
                  }}
                  className={`p-6 bg-white border rounded-2xl flex flex-col gap-5 shadow-sm transition-all duration-300 ${
                    disp.id === highlightedDisputeId
                      ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/[0.02] scale-[1.01] shadow-md shadow-rose-500/5 animate-pulse"
                      : "border-slate-200"
                  } ${
                    disp.status !== "Under Mediation" ? "opacity-60 border-slate-100" : ""
                  }`}
                >
                  {/* Dispute Summary Block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded">
                        Dispute #{disp.id}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-805 mt-2">{disp.project}</h4>
                      <div className="text-xs text-slate-500 font-semibold mt-1">
                        Client: <span className="text-slate-700">{disp.client}</span> &nbsp;|&nbsp; Freelancer: <span className="text-slate-700">{disp.freelancer}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xxs uppercase tracking-wider text-slate-400 font-semibold block">Escrow held</span>
                      <span className="text-xl font-black text-rose-600">${disp.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dispute Reason */}
                  <div className="text-xs p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-semibold">
                    <span className="font-extrabold">Reason filed: </span>
                    {disp.reason}
                  </div>

                  {/* Statements Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800">
                      <h5 className="font-bold text-slate-800 mb-2 border-b border-slate-200/80 pb-1">Client Statement</h5>
                      <blockquote className="italic text-slate-500 leading-relaxed">&ldquo;{disp.clientStatement}&rdquo;</blockquote>
                    </div>
                    <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800">
                      <h5 className="font-bold text-slate-800 mb-2 border-b border-slate-200/80 pb-1">Freelancer Statement</h5>
                      <blockquote className="italic text-slate-500 leading-relaxed">&ldquo;{disp.freelancerStatement}&rdquo;</blockquote>
                    </div>
                  </div>

                  {/* Arbitration controls */}
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Mediation Status: </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                        disp.status === "Under Mediation" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        disp.status.includes("Refunded") ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
                        disp.status.includes("Released") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {disp.status}
                      </span>
                    </div>

                    {disp.status === "Under Mediation" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => resolveDispute(disp.id, "Resolved (Refunded Client)")}
                          className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-500 border border-cyan-200 text-cyan-700 hover:text-white transition-all text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Refund Client (100%)
                        </button>
                        <button
                          onClick={() => resolveDispute(disp.id, "Resolved (Released to Freelancer)")}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-500 border border-emerald-200 text-emerald-700 hover:text-white transition-all text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Payout Freelancer (100%)
                        </button>
                        <button
                          onClick={() => resolveDispute(disp.id, "Resolved (Split)")}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Split 50 / 50
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => resolveDispute(disp.id, "Under Mediation")}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-650 cursor-pointer underline bg-transparent border-0"
                      >
                        Reopen Case
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
