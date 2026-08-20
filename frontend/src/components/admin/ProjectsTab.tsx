"use client";

import React from "react";
import Table from "@/components/Table";
import { useAdmin } from "@/app/admin/AdminContext";
import { API_URL } from "@/config/api";

interface ProjectsTabProps {
  projectsSubTab: "projects" | "proposals" | "maintenance";
  setProjectsSubTab: (tab: "projects" | "proposals" | "maintenance") => void;
  projectsSearch: string;
  setProjectsSearch: (v: string) => void;
  paginatedProjects: any[];
  projectsPage: number;
  totalProjectsPages: number;
  setProjectsPage: (page: number) => void;
  filteredProjects: any[];
  itemsPerPage: number;
  handleUpdateProjectStatus: (projectId: number, status: string) => Promise<void>;
  handleDeleteProject: (projectId: number) => Promise<void>;

  pendingProposals?: any[];
  handleUpdateProposalVettingStatus?: (proposalId: number, status: "Approved" | "Rejected") => Promise<void>;
}

const CONFIGURABLE_FIELDS = [
  { key: "project_durations", label: "Project Durations", placeholder: "e.g., 2-4 weeks", category: "site_settings", default: ["Less than 1 month", "1-3 months", "3-6 months", "More than 6 months"] },
  { key: "location_preferences", label: "Location Preferences", placeholder: "e.g., Hybrid", category: "site_settings", default: ["Remote", "Onsite", "Partially Remote"] },
  { key: "payment_modes", label: "Payment Modes", placeholder: "e.g., Bi-weekly", category: "site_settings", default: ["Daily", "Weekly", "Monthly"] }
];

export default function ProjectsTab({
  projectsSubTab,
  setProjectsSubTab,
  projectsSearch,
  setProjectsSearch,
  paginatedProjects,
  projectsPage,
  totalProjectsPages,
  setProjectsPage,
  filteredProjects,
  itemsPerPage,
  handleUpdateProjectStatus,
  handleDeleteProject,
  pendingProposals,
  handleUpdateProposalVettingStatus
}: ProjectsTabProps) {

  const [approvalFilter, setApprovalFilter] = React.useState<"all" | "approved" | "pending">("all");
  const [localPage, setLocalPage] = React.useState(1);

  const [fieldsConfig, setFieldsConfig] = React.useState<Record<string, any[]>>({});
  const [newOptionInputs, setNewOptionInputs] = React.useState<Record<string, string>>({});
  const [savingFields, setSavingFields] = React.useState(false);
  const [fieldsStatus, setFieldsStatus] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFieldsSettings = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/form-field-options`);
      if (res.ok) {
        const data = await res.json();
        const newConfig: Record<string, any[]> = {};
        for (const field of CONFIGURABLE_FIELDS) {
          newConfig[field.key] = data[field.key] || [];
        }
        setFieldsConfig(newConfig);
      }
    } catch (err) {
      console.error("Failed to fetch form field settings:", err);
    }
  }, []);

  React.useEffect(() => {
    if (projectsSubTab === "maintenance") {
      fetchFieldsSettings();
    }
  }, [projectsSubTab, fetchFieldsSettings]);

  const handleAddOption = async (fieldKey: string, optionValue: string) => {
    const trimmed = optionValue.trim();
    if (!trimmed) return;

    // Check duplicate
    const currentOptions = fieldsConfig[fieldKey] || [];
    if (currentOptions.some((o) => o.option_value.toLowerCase() === trimmed.toLowerCase())) {
      alert("This option already exists.");
      return;
    }

    try {
      setSavingFields(true);
      setFieldsStatus(null);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/admin/form-field-options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ field_key: fieldKey, option_value: trimmed })
      });

      const data = await res.json();
      if (res.ok) {
        setNewOptionInputs({
          ...newOptionInputs,
          [fieldKey]: ""
        });
        fetchFieldsSettings();
        setFieldsStatus({ type: "success", text: "Option added successfully." });
        setTimeout(() => setFieldsStatus(null), 3000);
      } else {
        alert(data.message || "Failed to add option.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add option. Please try again.");
    } finally {
      setSavingFields(false);
    }
  };

  const handleRemoveOption = async (optionId: number) => {
    if (!confirm("Are you sure you want to remove this option?")) return;

    try {
      setSavingFields(true);
      setFieldsStatus(null);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/admin/form-field-options/${optionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        fetchFieldsSettings();
        setFieldsStatus({ type: "success", text: "Option removed successfully." });
        setTimeout(() => setFieldsStatus(null), 3000);
      } else {
        alert(data.message || "Failed to remove option.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove option. Please try again.");
    } finally {
      setSavingFields(false);
    }
  };

  const filteredByApproval = React.useMemo(() => {
    return filteredProjects.filter((p: any) => {
      if (approvalFilter === "approved") {
        return p.status !== "Pending Approval" && p.status !== "Declined";
      }
      if (approvalFilter === "pending") {
        return p.status === "Pending Approval";
      }
      return true;
    });
  }, [filteredProjects, approvalFilter]);

  const paginatedProjectsLocal = React.useMemo(() => {
    const startIndex = (localPage - 1) * itemsPerPage;
    return filteredByApproval.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredByApproval, localPage, itemsPerPage]);

  const totalPagesLocal = Math.ceil(filteredByApproval.length / itemsPerPage);

  React.useEffect(() => {
    setLocalPage(1);
  }, [approvalFilter, projectsSearch]);

  const projectColumns = [
    {
      header: "S.No",
      accessor: (row: any, idx: number) => ((localPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: "Title",
      accessor: (row: any) => <div className="max-w-[200px] truncate font-bold text-slate-805" title={row.title}>{row.title}</div>
    },
    {
      header: "Client",
      accessor: (row: any) => row.client_name
    },
    {
      header: "Category",
      accessor: (row: any) => row.category_name || row.sub_category_name || "Uncategorized"
    },
    {
      header: "Budget",
      accessor: (row: any) => `$${Number(row.budget).toLocaleString()}`
    },
    {
      header: "Status",
      accessor: (row: any) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
          row.status === "Open" ? "bg-emerald-50 text-emerald-707 border-emerald-200/60" :
          row.status === "Closed" ? "bg-slate-50 text-slate-400 border-slate-200" :
          row.status === "Pending Approval" ? "bg-amber-50 text-amber-700 border-amber-200" :
          "bg-rose-50 text-rose-700 border-rose-200"
        }`}>
          {row.status === "Flagged" ? "Suspended" : row.status}
        </span>
      )
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex gap-2 select-none justify-center">
          {row.status === "Pending Approval" ? (
            <>
              <button
                onClick={() => handleUpdateProjectStatus(row.job_id, "Open")}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-250/60 rounded-lg cursor-pointer transition-colors bg-white"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateProjectStatus(row.job_id, "Declined")}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-605 hover:bg-rose-50 border border-rose-250/60 rounded-lg cursor-pointer transition-colors bg-white"
              >
                Decline
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleUpdateProjectStatus(row.job_id, row.status === "Open" ? "Flagged" : "Open")}
                className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200/60 rounded-lg cursor-pointer transition-colors bg-white"
              >
                {row.status === "Open" ? "Suspend" : "Activate"}
              </button>
              <button
                onClick={() => handleDeleteProject(row.job_id)}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg cursor-pointer transition-colors bg-white"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const proposalColumns = [
    {
      header: "S.No",
      accessor: (row: any, idx: number) => idx + 1
    },
    {
      header: "Project",
      accessor: (row: any) => <div className="font-bold text-slate-800">{row.job_title}</div>
    },
    {
      header: "Client",
      accessor: (row: any) => (
        <div>
          <div className="font-semibold text-slate-700">{row.client_name}</div>
          <div className="text-[10px] text-slate-400">{row.client_email}</div>
        </div>
      )
    },
    {
      header: "Freelancer",
      accessor: (row: any) => (
        <div>
          <div className="font-semibold text-slate-700">{row.freelancer_name}</div>
          <div className="text-[10px] text-slate-400">{row.freelancer_email}</div>
        </div>
      )
    },
    {
      header: "Bid / Delivery",
      accessor: (row: any) => (
        <div>
          <div className="font-extrabold text-teal-600">${Number(row.bid_amount).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">{row.delivery_days} days</div>
        </div>
      )
    },
    {
      header: "Cover Letter",
      accessor: (row: any) => <div className="max-w-[200px] truncate text-slate-600" title={row.cover_letter}>{row.cover_letter}</div>
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleUpdateProposalVettingStatus && handleUpdateProposalVettingStatus(row.proposal_id, "Approved")}
            className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-bold rounded-lg cursor-pointer"
          >
            Approve
          </button>
          <button
            onClick={() => handleUpdateProposalVettingStatus && handleUpdateProposalVettingStatus(row.proposal_id, "Rejected")}
            className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 hover:bg-rose-600 hover:text-white transition-all text-[10px] font-bold rounded-lg cursor-pointer"
          >
            Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Project management sub tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start select-none">
        <button
          onClick={() => setProjectsSubTab("projects")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            projectsSubTab === "projects" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Posted projects
        </button>
        <button
          onClick={() => setProjectsSubTab("proposals")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            projectsSubTab === "proposals" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-205/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Proposal vetting queue
        </button>
        <button
          onClick={() => setProjectsSubTab("maintenance")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            projectsSubTab === "maintenance" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Form Fields
        </button>
      </div>

      {projectsSubTab === "projects" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Project management</h3>
              <p className="text-slate-505 text-xs sm:text-sm mt-0.5 font-semibold">Manage, review, and approve client-posted projects/jobs across the platform.</p>
            </div>

            {/* Approval Tab Filters */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start select-none gap-1 shrink-0">
              <button
                onClick={() => setApprovalFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                  approvalFilter === "all"
                    ? "bg-white text-slate-805 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 bg-transparent"
                }`}
              >
                All Posted ({filteredProjects.length})
              </button>
              <button
                onClick={() => setApprovalFilter("approved")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                  approvalFilter === "approved"
                    ? "bg-white text-slate-805 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 bg-transparent"
                }`}
              >
                Approved & Live ({filteredProjects.filter((p: any) => p.status !== "Pending Approval" && p.status !== "Declined").length})
              </button>
              <button
                onClick={() => setApprovalFilter("pending")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer flex items-center gap-1.5 ${
                  approvalFilter === "pending"
                    ? "bg-white text-slate-805 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 bg-transparent"
                }`}
              >
                <span>Pending Vetting</span>
                {filteredProjects.filter((p: any) => p.status === "Pending Approval").length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black leading-none animate-pulse">
                    {filteredProjects.filter((p: any) => p.status === "Pending Approval").length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search projects..."
                value={projectsSearch}
                onChange={(e) => setProjectsSearch(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <Table
            columns={projectColumns}
            data={paginatedProjectsLocal}
            currentPage={localPage}
            totalPages={totalPagesLocal}
            onPageChange={setLocalPage}
            totalItems={filteredByApproval.length}
            itemsPerPage={itemsPerPage}
            emptyMessage={
              approvalFilter === "pending"
                ? "No project listings require vetting approval."
                : (approvalFilter === "approved" ? "No active/approved project listings found." : "No project listings found.")
            }
          />
        </div>
      ) : projectsSubTab === "proposals" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Proposal Vetting Queue</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Approve or reject bids submitted by freelancers before clients can see them.</p>
          </div>
          <Table
            columns={proposalColumns}
            data={pendingProposals || []}
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
            totalItems={(pendingProposals || []).length}
            itemsPerPage={100}
            emptyMessage="No pending proposals to vet."
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm text-left animate-fadeIn">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800">Project Form Fields Config</h3>
            <p className="text-slate-550 text-xs sm:text-sm mt-0.5 font-semibold">Manage the available select options for project posting fields.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {CONFIGURABLE_FIELDS.map((field) => {
              const options = fieldsConfig[field.key] || [];
              const inputValue = newOptionInputs[field.key] || "";
              
              return (
                <div key={field.key} className="flex flex-col gap-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">{field.label}</h4>
                  
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-slate-200/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
                        <span>{opt.option_value}</span>
                        <button
                          onClick={() => handleRemoveOption(opt.option_id)}
                          disabled={savingFields}
                          className="text-rose-500 hover:text-rose-700 disabled:opacity-50 bg-transparent border-none cursor-pointer p-1 font-semibold text-xs"
                          title="Remove Option"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {options.length === 0 && (
                      <p className="text-slate-400 text-xs font-semibold italic text-center py-4">No options configured.</p>
                    )}
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddOption(field.key, inputValue);
                    }} 
                    className="flex gap-2 mt-2 pt-3 border-t border-slate-200/50"
                  >
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={inputValue}
                      disabled={savingFields}
                      onChange={(e) => setNewOptionInputs({
                        ...newOptionInputs,
                        [field.key]: e.target.value
                      })}
                      className="min-w-0 flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-teal-700/50"
                    />
                    <button
                      type="submit"
                      disabled={savingFields}
                      className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer border-none"
                    >
                      Add
                    </button>
                  </form>
                </div>
              );
            })}
          </div>

          {fieldsStatus && (
            <div className="flex justify-end items-center gap-4 mt-2">
              <span className={`text-xs font-bold ${fieldsStatus.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {fieldsStatus.text}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
