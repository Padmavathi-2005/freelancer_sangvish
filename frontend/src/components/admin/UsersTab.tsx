"use client";

import React from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiClock, FiXCircle, FiChevronDown } from "react-icons/fi";
import Table from "@/components/Table";
import CustomSelect from "@/components/CustomSelect";
import { AdminUser } from "@/app/admin/AdminContext";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";

function VettingDropdown({ status, onChange }: { status: string; onChange: (newStatus: string) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentStatus = status || "Pending";

  const getBadgeStyle = (st: string) => {
    switch (st) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-sm";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-sm";
      default:
        return "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 shadow-sm";
    }
  };

  const renderIcon = (st: string) => {
    switch (st) {
      case "Approved":
        return <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case "Rejected":
        return <FiXCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      default:
        return <FiClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border transition-all cursor-pointer ${getBadgeStyle(currentStatus)}`}
      >
        {renderIcon(currentStatus)}
        <span>{currentStatus}</span>
        <FiChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 flex flex-col text-[11px] font-bold animate-fadeIn">
          <button
            type="button"
            onClick={() => { onChange("Approved"); setIsOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-left hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer ${currentStatus === "Approved" ? "bg-emerald-50/70 text-emerald-700 font-extrabold" : ""}`}
          >
            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Approved</span>
          </button>

          <button
            type="button"
            onClick={() => { onChange("Pending"); setIsOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-left hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-colors cursor-pointer ${currentStatus === "Pending" ? "bg-amber-50/70 text-amber-700 font-extrabold" : ""}`}
          >
            <FiClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Pending</span>
          </button>

          <button
            type="button"
            onClick={() => { onChange("Rejected"); setIsOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-left hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors cursor-pointer ${currentStatus === "Rejected" ? "bg-rose-50/70 text-rose-700 font-extrabold" : ""}`}
          >
            <FiXCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Rejected</span>
          </button>
        </div>
      )}
    </div>
  );
}

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
  handleUpdateUserByAdmin?: (userId: number, updatedData: any) => Promise<boolean>;
  handleUpdateUserVettingStatus?: (userId: number, vetting_status: string) => Promise<boolean>;

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
  handleUpdateUserByAdmin,
  handleUpdateUserVettingStatus,
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
  const { t } = useLanguage();

  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState<any>({});
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const startEditing = (user: any) => {
    setEditForm({ ...user });
    setIsEditing(true);
    setSaveMessage(null);
  };

  const handleSaveUser = async () => {
    if (!selectedUser || !handleUpdateUserByAdmin) return;
    setSaveLoading(true);
    setSaveMessage(null);
    const success = await handleUpdateUserByAdmin(selectedUser.user_id, editForm);
    setSaveLoading(false);
    if (success) {
      setSelectedUser({ ...selectedUser, ...editForm });
      setSaveMessage("✅ User details updated successfully!");
      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage(null);
      }, 1000);
    } else {
      setSaveMessage("❌ Failed to update user profile. Please try again.");
    }
  };

  const userColumns = [
    {
      header: t("s_no", "S.No"),
      accessor: (row: any, idx: number) => ((usersPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: t("user_name", "User Name"),
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          {row.profile_image ? (
            <img src={row.profile_image} alt={row.first_name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              {row.first_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex flex-col text-left rtl:text-right">
            <span className="font-bold text-slate-800 text-xs sm:text-sm">
              {row.first_name} {row.last_name || ""}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {row.display_name || `@${row.first_name?.toLowerCase()}`}
            </span>
          </div>
        </div>
      )
    },
    {
      header: t("email_phone", "Email & Phone"),
      accessor: (row: any) => (
        <div className="flex flex-col text-left rtl:text-right space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>{row.email}</span>
            {row.email_verified && (
              <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full" title="Email Verified">✓</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>{row.phone || t("no_phone", "No phone")}</span>
            {row.phone_verified && (
              <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full" title="Phone Verified">✓</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: t("profiles_title", "Profiles & Title"),
      accessor: (row: any) => (
        <div className="flex flex-col text-left rtl:text-right space-y-1">
          <div className="flex gap-1.5">
            {row.client_onboarding && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{t("client", "Client")}</span>
            )}
            {row.freelancer_onboarding && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">{t("freelancer", "Freelancer")}</span>
            )}
            {!row.client_onboarding && !row.freelancer_onboarding && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200">{t("no_profile", "No profile")}</span>
            )}
          </div>
          <span className="text-xs text-slate-600 font-medium truncate max-w-[180px]" title={row.professional_title || row.company_name || row.tagline}>
            {row.professional_title || row.company_name || row.tagline || "-"}
          </span>
        </div>
      )
    },
    {
      header: t("location", "Location"),
      accessor: (row: any) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.city || row.country ? `${row.city ? row.city + ", " : ""}${row.country || ""}` : t("not_set", "Not set")}
        </span>
      )
    },
    {
      header: t("vetting", "Vetting"),
      accessor: (row: any) => (
        <VettingDropdown
          status={row.vetting_status}
          onChange={async (newStatus) => {
            if (handleUpdateUserVettingStatus) {
              await handleUpdateUserVettingStatus(row.user_id, newStatus);
            }
          }}
        />
      )
    },
    {
      header: t("status_label", "Status"),
      accessor: (row: any) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          row.is_active !== false 
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}>
          {row.is_active !== false ? t("active", "Active") : t("blocked", "Blocked")}
        </span>
      )
    },
    {
      header: t("actions", "Actions"),
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedUser(row)}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            {t("view_details", "View Details")}
          </button>
          <button
            onClick={() => handleToggleUserActive(row.user_id)}
            className={`px-2.5 py-1 text-[11px] font-bold border rounded-lg cursor-pointer transition-colors ${
              row.is_active !== false 
                ? "text-rose-600 hover:bg-rose-50 border-rose-200/60 bg-white" 
                : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60 bg-white"
            }`}
          >
            {row.is_active !== false ? t("block", "Block") : t("unblock", "Unblock")}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-left rtl:text-right">
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
          {t("admin_registered_user_accounts", "Registered user accounts")}
        </button>
        <button
          onClick={() => setUsersSubTab("admins")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            usersSubTab === "admins" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t("admin_platform_administrators", "Platform administrators")}
        </button>
      </div>

      {usersSubTab === "users" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm text-left rtl:text-right">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{t("admin_user_accounts_directory", "User accounts directory")}</h3>
            <p className="text-slate-505 text-xs sm:text-sm mt-0.5">{t("admin_user_accounts_directory_desc", "Review profiles, active registration statuses, account verification flags and toggle lock/block states.")}</p>
          </div>

          {/* Onboarding Counts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("admin_total_accounts", "Total Accounts")}</span>
              <span className="text-xl font-black text-slate-900 mt-1">{userCounts.total}</span>
            </div>
            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{t("admin_onboarded_freelancers", "Onboarded Freelancers")}</span>
              <span className="text-xl font-black text-purple-700 mt-1">{userCounts.freelancers}</span>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t("admin_onboarded_clients", "Onboarded Clients")}</span>
              <span className="text-xl font-black text-blue-700 mt-1">{userCounts.clients}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder={t("admin_search_users_placeholder", "Search users...")}
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
              <span className="text-xs font-semibold text-slate-500 shrink-0">{t("admin_profile_filter", "Profile Filter:")}</span>
              <CustomSelect
                options={[
                  { value: "all", label: t("admin_all_users", "All Users") },
                  { value: "freelancer", label: t("admin_freelancers_onboarded", "Freelancers (Onboarded)") },
                  { value: "client", label: t("admin_clients_onboarded", "Clients (Onboarded)") }
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
            emptyMessage={t("admin_no_users_found", "No registered users found.")}
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
                    className="p-3.5 sm:p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 min-w-0 max-w-full"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-teal-700/10 border border-teal-700/20 text-teal-750 font-extrabold flex items-center justify-center shrink-0">
                        {adm.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-bold text-slate-800 text-sm truncate">{adm.full_name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            adm.role === "MAIN_ADMIN" 
                              ? "bg-teal-50 text-teal-700 border border-teal-200/50" 
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {adm.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block font-medium mt-0.5 truncate">{adm.email}</span>
                      </div>
                    </div>

                    {/* Actions: delete sub-admins, only accessible for main admin */}
                    {adminUser?.role === "MAIN_ADMIN" && adm.role !== "MAIN_ADMIN" && (
                      <button
                        onClick={() => handleDeleteAdmin(adm.admin_id)}
                        className="px-3 py-1.5 bg-rose-50 border border-rose-250/50 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold text-rose-600 rounded-xl cursor-pointer shrink-0 whitespace-nowrap"
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

      {/* FULL USER DETAILS MODAL (PORTAL TO DOCUMENT.BODY TO OVERLAY HEADER & SIDEBAR) */}
      {selectedUser && typeof window !== "undefined" && createPortal(
        <div 
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col text-left animate-fadeIn relative z-10"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                {selectedUser.profile_image ? (
                  <img src={selectedUser.profile_image} alt={selectedUser.first_name} className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {selectedUser.first_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {selectedUser.first_name} {selectedUser.last_name || ""}
                    </h2>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      selectedUser.is_active !== false 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {selectedUser.is_active !== false ? "Active Account" : "Blocked"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedUser.display_name || `@${selectedUser.first_name?.toLowerCase()}`} • User ID #{selectedUser.user_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isEditing) {
                      setIsEditing(false);
                    } else {
                      startEditing(selectedUser);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                    isEditing
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                  }`}
                >
                  {isEditing ? "Cancel Edit" : "✏️ Edit Profile"}
                </button>
                <button
                  onClick={() => { setSelectedUser(null); setIsEditing(false); }}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-6">
              
              {saveMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-bold border ${
                  saveMessage.includes("✅") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {saveMessage}
                </div>
              )}

              {isEditing ? (
                /* EDIT FORM VIEW */
                <div className="flex flex-col gap-5 text-left">
                  {/* Profile Image Edit Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                    {editForm.profile_image ? (
                      <img
                        src={editForm.profile_image}
                        alt="Profile Preview"
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                        {editForm.first_name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5 w-full text-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 uppercase text-[10px]">
                          Profile Image / Avatar Photo
                        </label>
                        {editForm.profile_image && (
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, profile_image: "" })}
                            className="text-rose-600 hover:underline cursor-pointer lowercase text-[10px] font-semibold"
                          >
                            Remove photo
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/... or image link"
                          value={editForm.profile_image || ""}
                          onChange={(e) => setEditForm({ ...editForm, profile_image: e.target.value })}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-teal-600 outline-none text-xs"
                        />
                        <label className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-sm">
                          📷 Upload File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  const token = localStorage.getItem("adminToken");
                                  const res = await fetch(`${API_URL}/upload`, {
                                    method: "POST",
                                    headers: token ? { "Authorization": `Bearer ${token}` } : {},
                                    body: formData
                                  });
                                  const contentType = res.headers.get("content-type");
                                  if (res.ok && contentType && contentType.includes("application/json")) {
                                    const data = await res.json();
                                    if (data.url) {
                                      setEditForm((prev: any) => ({ ...prev, profile_image: data.url }));
                                      return;
                                    }
                                  }
                                } catch (err) {
                                  // Fallback to Data URL
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditForm((prev: any) => ({ ...prev, profile_image: reader.result }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">First Name</label>
                      <input
                        type="text"
                        value={editForm.first_name || ""}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Last Name</label>
                      <input
                        type="text"
                        value={editForm.last_name || ""}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Display Name / Handle</label>
                      <input
                        type="text"
                        value={editForm.display_name || ""}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Email Address</label>
                      <input
                        type="email"
                        value={editForm.email || ""}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Phone Number</label>
                      <input
                        type="text"
                        value={editForm.phone || ""}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Country</label>
                      <input
                        type="text"
                        value={editForm.country || ""}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">City</label>
                      <input
                        type="text"
                        value={editForm.city || ""}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Professional Title</label>
                      <input
                        type="text"
                        value={editForm.professional_title || ""}
                        onChange={(e) => setEditForm({ ...editForm, professional_title: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Hourly Rate ($/hr)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.hourly_rate || ""}
                        onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-teal-600 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-bold text-slate-500 uppercase text-[10px]">Vetting Status</label>
                      <div className="pt-0.5">
                        <VettingDropdown
                          status={editForm.vetting_status || "Pending"}
                          onChange={(newStatus) => setEditForm({ ...editForm, vetting_status: newStatus })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editForm.email_verified}
                        onChange={(e) => setEditForm({ ...editForm, email_verified: e.target.checked })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <span>✓ Email Verified</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!editForm.phone_verified}
                        onChange={(e) => setEditForm({ ...editForm, phone_verified: e.target.checked })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <span>✓ Phone Verified</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-bold text-slate-500 uppercase text-[10px]">Biography / Description</label>
                    <textarea
                      rows={4}
                      value={editForm.bio || editForm.description || ""}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value, description: e.target.value })}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-normal leading-relaxed focus:bg-white focus:border-teal-600 outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* READ ONLY VIEW */
                <>
                  {/* Profile Badges Bar */}
                  <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    {selectedUser.freelancer_onboarding && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        💼 Freelancer Profile
                      </span>
                    )}
                    {selectedUser.client_onboarding && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        🏢 Client Profile
                      </span>
                    )}
                    {selectedUser.email_verified && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        ✓ Email Verified
                      </span>
                    )}
                    {selectedUser.phone_verified && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        ✓ Phone Verified
                      </span>
                    )}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      selectedUser.vetting_status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedUser.vetting_status === "Rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      Vetting: {selectedUser.vetting_status || "Pending"}
                    </span>

                    {/* Quick Vetting Action Buttons in Modal */}
                    <div className="flex items-center gap-1.5 sm:ml-auto">
                      <button
                        onClick={async () => {
                          if (handleUpdateUserVettingStatus) {
                            await handleUpdateUserVettingStatus(selectedUser.user_id, "Approved");
                            setSelectedUser((prev: any) => prev ? { ...prev, vetting_status: "Approved" } : null);
                          }
                        }}
                        className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer border ${
                          selectedUser.vetting_status === "Approved"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        ✓ Approve Profile
                      </button>
                      <button
                        onClick={async () => {
                          if (handleUpdateUserVettingStatus) {
                            await handleUpdateUserVettingStatus(selectedUser.user_id, "Rejected");
                            setSelectedUser((prev: any) => prev ? { ...prev, vetting_status: "Rejected" } : null);
                          }
                        }}
                        className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer border ${
                          selectedUser.vetting_status === "Rejected"
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                        }`}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column: Personal & Contact Information */}
                    <div className="flex flex-col gap-4">
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          📞 Contact & Location Info
                        </h3>
                        <div className="flex flex-col gap-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px] uppercase">Email Address</span>
                            <span className="font-bold text-slate-800 text-sm">{selectedUser.email}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px] uppercase">Phone Number</span>
                            <span className="font-bold text-slate-800">{selectedUser.phone || "Not provided"}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px] uppercase">Country / Location</span>
                            <span className="font-bold text-slate-800">
                              {selectedUser.city || selectedUser.country 
                                ? `${selectedUser.city ? selectedUser.city + ", " : ""}${selectedUser.state ? selectedUser.state + ", " : ""}${selectedUser.country || ""}`
                                : "Not provided"}
                            </span>
                          </div>
                          {selectedUser.address && (
                            <div>
                              <span className="font-bold text-slate-400 block text-[10px] uppercase">Full Address</span>
                              <span className="font-medium text-slate-700">{selectedUser.address} {selectedUser.pincode ? `(${selectedUser.pincode})` : ""}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px] uppercase">Member Since</span>
                            <span className="font-semibold text-slate-700">
                              {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Education History Section */}
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          🎓 Education History
                        </h3>
                        {Array.isArray(selectedUser.education_details) && selectedUser.education_details.length > 0 ? (
                          <div className="flex flex-col gap-2.5">
                            {selectedUser.education_details.map((edu: any, idx: number) => (
                              <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex flex-col gap-1">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">{edu.degree} in {edu.field_of_study}</span>
                                <span className="text-teal-700 font-semibold">{edu.institution_name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{edu.start_year} - {edu.end_year || "Present"}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No formal education history recorded yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Professional, Freelancer & Client Details */}
                    <div className="flex flex-col gap-4">
                      {/* Professional / Freelancer Overview */}
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          💼 Professional Overview
                        </h3>
                        <div className="flex flex-col gap-2.5 text-xs">
                          <div>
                            <span className="font-bold text-slate-400 block text-[10px] uppercase">Professional Title</span>
                            <span className="font-bold text-slate-900 text-sm">{selectedUser.professional_title || selectedUser.company_name || selectedUser.tagline || "N/A"}</span>
                          </div>
                          {selectedUser.hourly_rate && (
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="font-bold text-slate-400 block text-[10px] uppercase">Hourly Rate</span>
                                <span className="font-extrabold text-teal-700 text-sm">${selectedUser.hourly_rate}/hr</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-400 block text-[10px] uppercase">Experience Level</span>
                                <span className="font-extrabold text-slate-800">{selectedUser.experience_level || "Expert"} ({selectedUser.total_experience_years || 5}+ yrs)</span>
                              </div>
                            </div>
                          )}
                          {selectedUser.bio && (
                            <div>
                              <span className="font-bold text-slate-400 block text-[10px] uppercase mb-1">Biography / About</span>
                              <p className="text-xs text-slate-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80 max-h-36 overflow-y-auto">
                                {selectedUser.bio}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Portfolio & External Links */}
                      {(selectedUser.linkedin_url || selectedUser.portfolio_website || selectedUser.client_website || selectedUser.resume_url) && (
                        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            🔗 Portfolio & External Links
                          </h3>
                          <div className="flex flex-col gap-2 text-xs">
                            {selectedUser.portfolio_website && (
                              <a href={selectedUser.portfolio_website} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline font-bold truncate">
                                🌐 Portfolio: {selectedUser.portfolio_website}
                              </a>
                            )}
                            {selectedUser.linkedin_url && (
                              <a href={selectedUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline font-bold truncate">
                                💼 LinkedIn: {selectedUser.linkedin_url}
                              </a>
                            )}
                            {selectedUser.client_website && (
                              <a href={selectedUser.client_website} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline font-bold truncate">
                                🏢 Website: {selectedUser.client_website}
                              </a>
                            )}
                            {selectedUser.resume_url && (
                              <a href={selectedUser.resume_url} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:underline font-bold truncate">
                                📄 Resume Document: {selectedUser.resume_url}
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* System & Verification Matrix */}
                      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          🛡️ System Verification & Status
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Email Status</span>
                            <span className={`font-extrabold ${selectedUser.email_verified ? "text-emerald-600" : "text-amber-600"}`}>
                              {selectedUser.email_verified ? "✓ Verified" : "Unverified"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Phone Status</span>
                            <span className={`font-extrabold ${selectedUser.phone_verified ? "text-emerald-600" : "text-amber-600"}`}>
                              {selectedUser.phone_verified ? "✓ Verified" : "Unverified"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Identity Vetting</span>
                            <span className="font-extrabold text-slate-800">{selectedUser.vetting_status || "Pending"}</span>
                          </div>
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Account Lock</span>
                            <span className={`font-extrabold ${selectedUser.is_active !== false ? "text-emerald-600" : "text-rose-600"}`}>
                              {selectedUser.is_active !== false ? "Active" : "Blocked"}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                </>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex items-center justify-between bg-slate-50/60 sticky bottom-0 z-10 backdrop-blur-md">
              {isEditing ? (
                <div className="flex items-center gap-3 w-full justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    disabled={saveLoading}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saveLoading ? "Saving Changes..." : "💾 Save Profile Changes"}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      handleToggleUserActive(selectedUser.user_id);
                      setSelectedUser((prev: any) => prev ? { ...prev, is_active: prev.is_active === false } : null);
                    }}
                    className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-colors cursor-pointer ${
                      selectedUser.is_active !== false 
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200" 
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {selectedUser.is_active !== false ? "🔒 Block User Account" : "🔓 Unblock User Account"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditing(selectedUser)}
                      className="px-5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      ✏️ Edit Profile
                    </button>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
                    >
                      Close Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
