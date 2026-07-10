"use client";

import React from "react";
import Table from "@/components/Table";
import CustomSelect from "@/components/CustomSelect";
import { AdminUser } from "@/app/admin/AdminContext";

interface UsersTabProps {
  usersSubTab: "users" | "admins";
  setUsersSubTab: (tab: "users" | "admins") => void;
  usersSearch: string;
  setUsersSearch: (v: string) => void;
  paginatedUsers: any[];
  usersPage: number;
  totalUsersPages: number;
  setUsersPage: (page: number) => void;
  filteredUsers: any[];
  usersFilterRole: string;
  setUsersFilterRole: (v: string) => void;
  userCounts: { total: number; freelancers: number; clients: number };
  itemsPerPage: number;
  handleToggleUserActive: (userId: number) => Promise<void>;

  adminsList: AdminUser[];
  adminUser: AdminUser | null;
  newAdminName: string;
  setNewAdminName: (v: string) => void;
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  newAdminPassword: string;
  setNewAdminPassword: (v: string) => void;
  newAdminRole: string;
  setNewAdminRole: (v: string) => void;
  adminError: string | null;
  adminSuccess: string | null;
  adminLoading: boolean;
  handleCreateAdmin: (e: React.FormEvent) => Promise<void>;
  handleDeleteAdmin: (id: number) => Promise<void>;
  fetchError: string | null;
}

export default function UsersTab({
  usersSubTab,
  setUsersSubTab,
  usersSearch,
  setUsersSearch,
  paginatedUsers,
  usersPage,
  totalUsersPages,
  setUsersPage,
  filteredUsers,
  usersFilterRole,
  setUsersFilterRole,
  userCounts,
  itemsPerPage,
  handleToggleUserActive,
  adminsList,
  adminUser,
  newAdminName,
  setNewAdminName,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPassword,
  setNewAdminPassword,
  newAdminRole,
  setNewAdminRole,
  adminError,
  adminSuccess,
  adminLoading,
  handleCreateAdmin,
  handleDeleteAdmin,
  fetchError
}: UsersTabProps) {

  const userColumns = [
    {
      header: "S.No",
      accessor: (row: any, idx: number) => ((usersPage - 1) * itemsPerPage) + idx + 1
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
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Users sub tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start select-none">
        <button
          onClick={() => setUsersSubTab("users")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            usersSubTab === "users" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Registered user accounts
        </button>
        <button
          onClick={() => setUsersSubTab("admins")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            usersSubTab === "admins" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Platform administrators
        </button>
      </div>

      {usersSubTab === "users" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800">User accounts directory</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Review profiles, active registration statuses, account verification flags and toggle lock/block states.</p>
          </div>

          {/* Onboarding Counts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Accounts</span>
              <span className="text-xl font-black text-slate-900 mt-1">{userCounts.total}</span>
            </div>
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Onboarded Freelancers</span>
              <span className="text-xl font-black text-purple-700 mt-1">{userCounts.freelancers}</span>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Onboarded Clients</span>
              <span className="text-xl font-black text-blue-700 mt-1">{userCounts.clients}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search users..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-805 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-2 select-none w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Profile Filter:</span>
              <CustomSelect
                options={[
                  { value: "all", label: "All Users" },
                  { value: "freelancer", label: "Freelancers (Onboarded)" },
                  { value: "client", label: "Clients (Onboarded)" }
                ]}
                value={usersFilterRole}
                onChange={(val) => {
                  setUsersFilterRole(val as string);
                  setUsersPage(1);
                }}
                className="w-full sm:w-56"
              />
            </div>
          </div>

          <Table
            columns={userColumns}
            data={paginatedUsers}
            currentPage={usersPage}
            totalPages={totalUsersPages}
            onPageChange={setUsersPage}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            emptyMessage="No registered users found."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-fadeIn text-left">
          {fetchError && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-xl">
              ⚠️ {fetchError}
            </div>
          )}

          {/* Admins List Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-800">System Administrators</h3>
              <p className="text-slate-555 text-xs sm:text-sm mt-0.5">Below are the administrators registered on the platform.</p>
            </div>

            <div className="flex flex-col gap-3">
              {adminsList.length === 0 ? (
                <p className="text-slate-500 text-sm font-semibold italic">No administrators found or loading...</p>
              ) : (
                adminsList.map((adm) => (
                  <div 
                    key={adm.admin_id} 
                    className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-700/10 border border-teal-700/20 text-teal-750 font-extrabold flex items-center justify-center">
                        {adm.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{adm.full_name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            adm.role === "MAIN_ADMIN" 
                              ? "bg-teal-50 text-teal-700 border border-teal-200/50" 
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {adm.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block font-medium mt-0.5">{adm.email}</span>
                      </div>
                    </div>

                    {/* Actions: delete sub-admins, only accessible for main admin */}
                    {adminUser?.role === "MAIN_ADMIN" && adm.role !== "MAIN_ADMIN" && (
                      <button
                        onClick={() => handleDeleteAdmin(adm.admin_id)}
                        className="px-3 py-1.5 bg-rose-50 border border-rose-250/50 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold text-rose-600 rounded-xl cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Create Admin Form (Only main admins can view/create) */}
          {adminUser?.role === "MAIN_ADMIN" ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-808">Create New Admin Account</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Create a new administrative user with specific access controls.</p>
              </div>

              <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4 max-w-md">
                {adminError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <span>❌ {adminError}</span>
                  </div>
                )}
                {adminSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <span>✅ {adminSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="e.g. john@freelancer.com"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <input
                    type="password"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-505 uppercase tracking-widest">Administrative Role</label>
                  <CustomSelect
                    options={[
                      { value: "SUB_ADMIN", label: "Sub-Admin (Default)" },
                      { value: "MAIN_ADMIN", label: "Main-Admin (Root)" }
                    ]}
                    value={newAdminRole}
                    onChange={(val) => setNewAdminRole(val as string)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-teal-700 hover:bg-teal-800 border border-teal-700/20 text-white font-bold py-3 rounded-xl transition-all mt-2 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-705/10"
                >
                  {adminLoading ? "Registering Admin..." : "Register Admin"}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold italic text-center">
              🔒 Sub-admin accounts do not have permission to register new administrators.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
