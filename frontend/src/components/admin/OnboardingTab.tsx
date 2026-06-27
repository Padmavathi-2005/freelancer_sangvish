"use client";

import React from "react";
import Table from "@/components/Table";
import CustomSelect from "@/components/CustomSelect";

interface OnboardingTabProps {
  onboardedSearch: string;
  setOnboardedSearch: (v: string) => void;
  onboardedFilterRole: string;
  setOnboardedFilterRole: (v: string) => void;
  paginatedOnboardedUsers: any[];
  onboardedPage: number;
  totalOnboardedPages: number;
  setOnboardedPage: (page: number) => void;
  filteredOnboardedUsers: any[];
  userCounts: { total: number; freelancers: number; clients: number };
  itemsPerPage: number;
  handleToggleUserActive: (userId: number) => Promise<void>;
}

export default function OnboardingTab({
  onboardedSearch,
  setOnboardedSearch,
  onboardedFilterRole,
  setOnboardedFilterRole,
  paginatedOnboardedUsers,
  onboardedPage,
  totalOnboardedPages,
  setOnboardedPage,
  filteredOnboardedUsers,
  userCounts,
  itemsPerPage,
  handleToggleUserActive
}: OnboardingTabProps) {

  const userColumns = [
    {
      header: "S.No",
      accessor: (row: any, idx: number) => ((onboardedPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: "User Name",
      accessor: (row: any) => `${row.first_name} ${row.last_name || ""}`
    },
    {
      header: "Email",
      accessor: (row: any) => row.email
    },
    {
      header: "Profiles",
      accessor: (row: any) => (
        <div className="flex gap-2 justify-center">
          {row.client_onboarding && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Client</span>
          )}
          {row.freelancer_onboarding && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Freelancer</span>
          )}
          {!row.client_onboarding && !row.freelancer_onboarding && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200">No profile</span>
          )}
        </div>
      )
    },
    {
      header: "Status",
      accessor: (row: any) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          row.is_active !== false 
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}>
          {row.is_active !== false ? "Active" : "Blocked"}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <button
          onClick={() => handleToggleUserActive(row.user_id)}
          className={`px-2.5 py-1 text-[11px] font-bold border rounded-lg cursor-pointer transition-colors ${
            row.is_active !== false 
              ? "text-rose-600 hover:bg-rose-50 border-rose-200/60 bg-white" 
              : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60 bg-white"
          }`}
        >
          {row.is_active !== false ? "Block" : "Unblock"}
        </button>
      )
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Onboarding Directory</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Directory of clients and freelancers who have successfully completed onboarding setup.</p>
      </div>

      {/* Onboarded Counts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between h-24 shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Onboarded Freelancers</span>
          <span className="text-2xl font-black text-purple-700 mt-1">{userCounts.freelancers}</span>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col justify-between h-24 shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Onboarded Clients</span>
          <span className="text-2xl font-black text-blue-700 mt-1">{userCounts.clients}</span>
        </div>
      </div>

      {/* Search & Filter section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search onboarded users..."
            value={onboardedSearch}
            onChange={(e) => {
              setOnboardedSearch(e.target.value);
              setOnboardedPage(1);
            }}
            className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2 select-none w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Profile Type:</span>
          <CustomSelect
            options={[
              { value: "all", label: "All Onboarded" },
              { value: "freelancer", label: "Freelancers Only" },
              { value: "client", label: "Clients Only" }
            ]}
            value={onboardedFilterRole}
            onChange={(val) => {
              setOnboardedFilterRole(val as string);
              setOnboardedPage(1);
            }}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      <Table
        columns={userColumns}
        data={paginatedOnboardedUsers}
        currentPage={onboardedPage}
        totalPages={totalOnboardedPages}
        onPageChange={setOnboardedPage}
        totalItems={filteredOnboardedUsers.length}
        itemsPerPage={itemsPerPage}
        emptyMessage="No onboarded profiles found."
      />
    </div>
  );
}
