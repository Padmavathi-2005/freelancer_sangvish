"use client";
import { API_URL } from "@/config/api";


import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Table from "@/components/Table";
import { FiAlertTriangle, FiClock, FiCheck, FiX, FiUser, FiUsers, FiFileText, FiEye } from "react-icons/fi";

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
  onVettingUpdate?: () => void;
}

export default function OnboardingTab({
  onboardedSearch,
  setOnboardedSearch,
  onboardedFilterRole,
  setOnboardedFilterRole,
  onboardedPage,
  setOnboardedPage,
  filteredOnboardedUsers,
  userCounts,
  itemsPerPage,
  handleToggleUserActive,
  onVettingUpdate
}: OnboardingTabProps) {

  const [vettingLoading, setVettingLoading] = useState<number | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<"freelancer" | "client">("freelancer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedUserForDocs, setSelectedUserForDocs] = useState<any | null>(null);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [updatingDocId, setUpdatingDocId] = useState<number | null>(null);

  const handleViewUserDocuments = async (user: any) => {
    setSelectedUserForDocs(user);
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/documents/admin/user/${user.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserDocuments(data);
      } else {
        console.error("Failed to load documents");
      }
    } catch (e) {
      console.error("Error loading user documents", e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpdateDocStatus = async (docId: number, status: "Approved" | "Rejected", reason?: string) => {
    setUpdatingDocId(docId);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/documents/admin/${docId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, rejection_reason: reason })
      });
      if (res.ok) {
        // Refresh list
        if (selectedUserForDocs) {
          const refreshRes = await fetch(`${API_URL}/documents/admin/user/${selectedUserForDocs.user_id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setUserDocuments(refreshData);
          }
        }
      } else {
        alert("Failed to update status");
      }
    } catch (e) {
      console.error("Error updating status", e);
    } finally {
      setUpdatingDocId(null);
    }
  };

  // Force onboardingFilterRole to "all" to prevent double-filtering
  useEffect(() => {
    setOnboardedFilterRole("all");
  }, [setOnboardedFilterRole]);

  const handleVettingAction = async (userId: number, status: "Approved" | "Rejected") => {
    setVettingLoading(userId);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/users/${userId}/vetting`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vetting_status: status })
      });
      if (res.ok && onVettingUpdate) {
        onVettingUpdate();
      }
    } catch (e) {
      console.error("Failed to update vetting status:", e);
    } finally {
      setVettingLoading(null);
    }
  };

  const VettingBadge = ({ status }: { status: string | null }) => {
    if (!status || status === "Pending") {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-705 border border-amber-200">
          <FiClock className="w-2.5 h-2.5 text-amber-600 shrink-0" /> Pending
        </span>
      );
    }
    if (status === "Approved") {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-705 border border-emerald-200">
          <FiCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-705 border border-rose-200">
        <FiX className="w-2.5 h-2.5 text-rose-600 shrink-0" /> Rejected
      </span>
    );
  };

  // Freelancer tab columns
  const freelancerColumns = [
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
      header: "Professional Title",
      accessor: (row: any) => row.professional_title || "N/A"
    },
    {
      header: "Vetting Status",
      accessor: (row: any) => <VettingBadge status={row.vetting_status} />
    },
    {
      header: "Documents",
      accessor: (row: any) => (
        <button
          onClick={() => handleViewUserDocuments(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black border border-slate-200 bg-white text-slate-750 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors shadow-sm"
        >
          <FiFileText className="w-3 h-3 text-slate-500" />
          <span>View Docs</span>
        </button>
      )
    },
    {
      header: "Account",
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
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {row.vetting_status === "Pending" && (
            <>
              <button
                onClick={() => handleVettingAction(row.user_id, "Approved")}
                disabled={vettingLoading === row.user_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors text-emerald-705 hover:bg-emerald-50 border-emerald-200 bg-white disabled:opacity-50"
              >
                {vettingLoading === row.user_id ? "..." : (
                  <>
                    <FiCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Approve
                  </>
                )}
              </button>
              <button
                onClick={() => handleVettingAction(row.user_id, "Rejected")}
                disabled={vettingLoading === row.user_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors text-rose-605 hover:bg-rose-50 border-rose-200 bg-white disabled:opacity-50"
              >
                {vettingLoading === row.user_id ? "..." : (
                  <>
                    <FiX className="w-2.5 h-2.5 text-rose-600 shrink-0" /> Reject
                  </>
                )}
              </button>
            </>
          )}

          {row.vetting_status === "Rejected" && (
            <button
              onClick={() => handleVettingAction(row.user_id, "Approved")}
              disabled={vettingLoading === row.user_id}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors text-emerald-705 hover:bg-emerald-50 border-emerald-200 bg-white disabled:opacity-50"
            >
              {vettingLoading === row.user_id ? "..." : (
                <>
                  <FiCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Approve
                </>
              )}
            </button>
          )}

          <button
            onClick={() => handleToggleUserActive(row.user_id)}
            className={`px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors ${
              row.is_active !== false
                ? "text-rose-600 hover:bg-rose-50 border-rose-200 bg-white"
                : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60 bg-white"
            }`}
          >
            {row.is_active !== false ? "Block" : "Unblock"}
          </button>
        </div>
      )
    }
  ];

  // Client tab columns
  const clientColumns = [
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
      header: "Company Details",
      accessor: (row: any) => (
        <div className="flex flex-col gap-0.5 text-left">
          <span className="font-bold text-xs text-slate-800">{row.company_name || "N/A"}</span>
          <span className="text-[10px] text-slate-400 font-semibold">{row.industry || "N/A"} • {row.company_size || "N/A"}</span>
        </div>
      )
    },
    {
      header: "Vetting Status",
      accessor: (row: any) => <VettingBadge status={row.vetting_status} />
    },
    {
      header: "Account",
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
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {row.vetting_status === "Pending" && (
            <>
              <button
                onClick={() => handleVettingAction(row.user_id, "Approved")}
                disabled={vettingLoading === row.user_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors text-emerald-705 hover:bg-emerald-50 border-emerald-200 bg-white disabled:opacity-50"
              >
                {vettingLoading === row.user_id ? "..." : (
                  <>
                    <FiCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Approve
                  </>
                )}
              </button>
              <button
                onClick={() => handleVettingAction(row.user_id, "Rejected")}
                disabled={vettingLoading === row.user_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors text-rose-605 hover:bg-rose-50 border-rose-200 bg-white disabled:opacity-50"
              >
                {vettingLoading === row.user_id ? "..." : (
                  <>
                    <FiX className="w-2.5 h-2.5 text-rose-600 shrink-0" /> Reject
                  </>
                )}
              </button>
            </>
          )}

          {row.vetting_status === "Rejected" && (
            <button
              onClick={() => handleVettingAction(row.user_id, "Approved")}
              disabled={vettingLoading === row.user_id}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors text-emerald-705 hover:bg-emerald-50 border-emerald-200 bg-white disabled:opacity-50"
            >
              {vettingLoading === row.user_id ? "..." : (
                <>
                  <FiCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Approve
                </>
              )}
            </button>
          )}

          <button
            onClick={() => handleToggleUserActive(row.user_id)}
            className={`px-2.5 py-1 text-[10px] font-black border rounded-lg cursor-pointer transition-colors ${
              row.is_active !== false
                ? "text-rose-600 hover:bg-rose-50 border-rose-200 bg-white"
                : "text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60 bg-white"
            }`}
          >
            {row.is_active !== false ? "Block" : "Unblock"}
          </button>
        </div>
      )
    }
  ];

  // Local filtering based on active tab section
  const tabFilteredUsers = useMemo(() => {
    return filteredOnboardedUsers.filter(u => {
      if (activeTabSection === "freelancer") {
        return !!u.freelancer_onboarding;
      } else {
        return !!u.client_onboarding;
      }
    });
  }, [filteredOnboardedUsers, activeTabSection]);

  const paginatedUsers = useMemo(() => {
    const start = (onboardedPage - 1) * itemsPerPage;
    return tabFilteredUsers.slice(start, start + itemsPerPage);
  }, [tabFilteredUsers, onboardedPage, itemsPerPage]);

  const totalTabPages = useMemo(() => {
    return Math.ceil(tabFilteredUsers.length / itemsPerPage) || 1;
  }, [tabFilteredUsers, itemsPerPage]);

  const pendingVettingCount = useMemo(() => {
    return filteredOnboardedUsers.filter(
      u => u.vetting_status === "Pending"
    ).length;
  }, [filteredOnboardedUsers]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left">
      <div>
        <h3 className="text-lg font-bold text-slate-800">Onboarding Directory</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Directory of clients and freelancers who have submitted or completed onboarding setup.</p>
      </div>

      {/* Onboarded Counts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5 flex flex-col justify-between h-24 shadow-sm">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Onboarded Freelancers</span>
          <span className="text-2xl font-black text-purple-700 mt-1">{userCounts.freelancers}</span>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex flex-col justify-between h-24 shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Onboarded Clients</span>
          <span className="text-2xl font-black text-blue-700 mt-1">{userCounts.clients}</span>
        </div>
        <div className={`border rounded-xl p-5 flex flex-col justify-between h-24 shadow-sm ${pendingVettingCount > 0 ? "bg-amber-50/50 border-amber-100" : "bg-slate-50/50 border-slate-100"}`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${pendingVettingCount > 0 ? "text-amber-600" : "text-slate-400"}`}>Pending Vetting</span>
          <span className={`text-2xl font-black mt-1 ${pendingVettingCount > 0 ? "text-amber-700" : "text-slate-400"}`}>{pendingVettingCount}</span>
        </div>
      </div>

      {/* Pending vetting alert banner */}
      {pendingVettingCount > 0 && (
        <div className="flex items-center gap-3.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0 shadow-sm">
            <FiAlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black text-amber-800">
              {pendingVettingCount} freelancer{pendingVettingCount > 1 ? "s" : ""} pending manual vetting review
            </p>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
              Auto-vetting is OFF. Review and approve or reject freelancers below before they can access their dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Tab Section Switcher and Search Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-2">
        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 select-none flex-wrap gap-1">
          <button
            onClick={() => {
              setActiveTabSection("freelancer");
              setOnboardedPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTabSection === "freelancer"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-855"
            }`}
          >
            <FiUser className="w-3.5 h-3.5" />
            Freelancer Vetting
          </button>
          <button
            onClick={() => {
              setActiveTabSection("client");
              setOnboardedPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTabSection === "client"
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                : "text-slate-500 hover:text-slate-855"
            }`}
          >
            <FiUsers className="w-3.5 h-3.5" />
            Client Directory
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search onboarded users..."
            value={onboardedSearch}
            onChange={(e) => {
              setOnboardedSearch(e.target.value);
              setOnboardedPage(1);
            }}
            className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <Table
        columns={activeTabSection === "freelancer" ? freelancerColumns : clientColumns}
        data={paginatedUsers}
        currentPage={onboardedPage}
        totalPages={totalTabPages}
        onPageChange={setOnboardedPage}
        totalItems={tabFilteredUsers.length}
        itemsPerPage={itemsPerPage}
        emptyMessage={activeTabSection === "freelancer" ? "No onboarded freelancers found." : "No onboarded clients found."}
      />

      {/* Document Vetting Modal */}
      {selectedUserForDocs && mounted && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex justify-center items-start p-4 backdrop-blur-[1px] overflow-y-auto select-none">
          <div className="bg-white border border-slate-255 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-fadeIn text-left flex flex-col my-8">
            <div className="bg-white border-b border-slate-150 px-6 py-4 flex justify-between items-center text-slate-800 shrink-0">
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                  Vetting Documents
                </h3>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  Reviewing: <span className="text-teal-705 font-extrabold">{selectedUserForDocs.first_name} {selectedUserForDocs.last_name || ""}</span> ({selectedUserForDocs.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDocs(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-4">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-t-transparent border-teal-700 rounded-full animate-spin" />
                </div>
              ) : userDocuments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-semibold text-xs bg-slate-50 rounded-xl border border-slate-100">
                  No documents have been uploaded by this freelancer yet.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {userDocuments.map((doc) => (
                    <div key={doc.document_id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-sm">{doc.field_name}</span>
                          {doc.is_required && (
                            <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-605 border border-rose-100 px-1.5 py-0.5 rounded-md">Required</span>
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            doc.status === "Approved"
                              ? "bg-emerald-55 bg-emerald-50 text-emerald-700 border-emerald-200"
                              : doc.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{doc.field_description}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            Expiry Date: <strong className="text-slate-600">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : "N/A"}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            Submitted: <strong className="text-slate-600">{new Date(doc.submitted_at).toLocaleString()}</strong>
                          </span>
                        </div>

                        {doc.status === "Rejected" && doc.rejection_reason && (
                          <div className="mt-2.5 p-2 bg-rose-50/50 border border-rose-100 rounded-lg text-[10px] text-rose-700 leading-relaxed font-bold">
                            ⚠️ Rejection Reason: {doc.rejection_reason}
                          </div>
                        )}

                        {/* Text value rendering for text inputs */}
                        {doc.field_type && !doc.field_type.startsWith("file_") && (
                          <div className="mt-2.5 p-2.5 bg-slate-100/70 border border-slate-200/50 rounded-lg text-xs font-semibold text-slate-800">
                            Submitted Value: <strong className="text-teal-700 font-mono text-[13px]">{doc.text_value || "N/A"}</strong>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto">
                        {(!doc.field_type || doc.field_type.startsWith("file_")) && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black uppercase rounded-xl transition shadow-sm text-center"
                          >
                            <FiEye className="w-3.5 h-3.5 shrink-0" />
                            <span>View file</span>
                          </a>
                        )}

                        <div className="flex gap-2">
                          {doc.status !== "Approved" && (
                            <button
                              onClick={() => handleUpdateDocStatus(doc.document_id, "Approved")}
                              disabled={updatingDocId === doc.document_id}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-black uppercase rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              <FiCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {doc.status !== "Rejected" && (
                            <button
                              onClick={() => {
                                const reason = prompt("Enter the reason for rejecting this document:");
                                if (reason === null) return; // User cancelled
                                handleUpdateDocStatus(doc.document_id, "Rejected", reason);
                              }}
                              disabled={updatingDocId === doc.document_id}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xxs font-black uppercase rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              <FiX className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedUserForDocs(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
