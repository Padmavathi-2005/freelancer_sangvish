"use client";

import React from "react";
import Table from "@/components/Table";

interface ProjectOrdersTabProps {
  transactionsSearch: string;
  setTransactionsSearch: (v: string) => void;
  paginatedTransactions: any[];
  transactionsPage: number;
  totalTransactionsPages: number;
  setTransactionsPage: (page: number) => void;
  filteredTransactions: any[];
  itemsPerPage: number;
}

export default function ProjectOrdersTab({
  transactionsSearch,
  setTransactionsSearch,
  paginatedTransactions,
  transactionsPage,
  totalTransactionsPages,
  setTransactionsPage,
  filteredTransactions,
  itemsPerPage
}: ProjectOrdersTabProps) {

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
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          row.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
          row.status === "In Progress" ? "bg-teal-50 text-teal-705 border border-teal-200" :
          "bg-rose-50 text-rose-700 border border-rose-250"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Project orders & contracts</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Monitor client-freelancer active project agreements, milestones development, and escrow payments.</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search orders..."
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
        emptyMessage="No project orders found."
      />
    </div>
  );
}
