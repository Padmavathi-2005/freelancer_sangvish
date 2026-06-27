"use client";

import React from "react";
import Table from "@/components/Table";

interface GigsTabProps {
  gigsSearch: string;
  setGigsSearch: (v: string) => void;
  paginatedGigs: any[];
  gigsPage: number;
  totalGigsPages: number;
  setGigsPage: (page: number) => void;
  filteredGigs: any[];
  itemsPerPage: number;
  handleUpdateGigStatus: (gigId: number, status: string) => Promise<void>;
  handleDeleteGig: (gigId: number) => Promise<void>;
}

export default function GigsTab({
  gigsSearch,
  setGigsSearch,
  paginatedGigs,
  gigsPage,
  totalGigsPages,
  setGigsPage,
  filteredGigs,
  itemsPerPage,
  handleUpdateGigStatus,
  handleDeleteGig
}: GigsTabProps) {

  const gigColumns = [
    {
      header: "S.No",
      accessor: (row: any, idx: number) => ((gigsPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: "Title",
      accessor: (row: any) => <div className="max-w-[200px] truncate font-bold text-slate-808" title={row.title}>{row.title}</div>
    },
    {
      header: "Freelancer",
      accessor: (row: any) => row.freelancer_name
    },
    {
      header: "Category",
      accessor: (row: any) => row.category_name || row.sub_category_name || "Uncategorized"
    },
    {
      header: "Price",
      accessor: (row: any) => `$${Number(row.price).toLocaleString()}`
    },
    {
      header: "Status",
      accessor: (row: any) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          row.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-slate-50 text-slate-400 border border-slate-200"
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex gap-2 select-none justify-center">
          <button
            onClick={() => handleUpdateGigStatus(row.gig_id, row.status === "Active" ? "Inactive" : "Active")}
            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-205 rounded-lg cursor-pointer transition-colors bg-white"
          >
            {row.status === "Active" ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => handleDeleteGig(row.gig_id)}
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/65 rounded-lg cursor-pointer transition-colors bg-white"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Gig listings management</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Track, deactivate, delete, and monitor active service gig offerings cataloged on the platform.</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search gigs..."
            value={gigsSearch}
            onChange={(e) => setGigsSearch(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <Table
        columns={gigColumns}
        data={paginatedGigs}
        currentPage={gigsPage}
        totalPages={totalGigsPages}
        onPageChange={setGigsPage}
        totalItems={filteredGigs.length}
        itemsPerPage={itemsPerPage}
        emptyMessage="No service gig listings found."
      />
    </div>
  );
}
