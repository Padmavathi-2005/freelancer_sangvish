"use client";

import React from "react";
import Table from "@/components/Table";
import { VettingApplication } from "@/app/admin/AdminContext";

interface ProjectsTabProps {
  projectsSubTab: "projects" | "vetting" | "proposals";
  setProjectsSubTab: (tab: "projects" | "vetting" | "proposals") => void;
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

  vettingApps: VettingApplication[];
  updateVettingStatus: (id: string, newStatus: VettingApplication["status"]) => void;

  pendingProposals?: any[];
  handleUpdateProposalVettingStatus?: (proposalId: number, status: "Approved" | "Rejected") => Promise<void>;
}

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
  vettingApps,
  updateVettingStatus,
  pendingProposals,
  handleUpdateProposalVettingStatus
}: ProjectsTabProps) {

  const [approvalFilter, setApprovalFilter] = React.useState<"all" | "approved" | "pending">("all");
  const [localPage, setLocalPage] = React.useState(1);

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
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
          row.status === "Open" ? "bg-emerald-50 text-emerald-707 border border-emerald-200/60" :
          row.status === "Closed" ? "bg-slate-50 text-slate-400 border border-slate-200" :
          row.status === "Pending Approval" ? "bg-amber-50 text-amber-700 border border-amber-200" :
          "bg-rose-50 text-rose-700 border border-rose-200"
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
          onClick={() => setProjectsSubTab("vetting")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            projectsSubTab === "vetting" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Talent vetting queue
        </button>
        <button
          onClick={() => setProjectsSubTab("proposals")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            projectsSubTab === "proposals" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Proposal vetting queue
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
      ) : projectsSubTab === "vetting" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-805">Talent Vetting Queue</h3>
            <p className="text-slate-505 text-xs sm:text-sm mt-0.5">Verify background credentials, portfolio samples, and assign elite Top 3% badges.</p>
          </div>

          {vettingApps.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-500 text-sm font-semibold">No applications pending review in this cycle.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {vettingApps.map((app) => (
                <div 
                  key={app.id} 
                  className={`p-5 bg-white border rounded-xl flex flex-col lg:flex-row justify-between lg:items-center gap-5 transition-all shadow-sm ${
                    app.status === "Approved" ? "border-emerald-200 bg-emerald-50/40" :
                    app.status === "Declined" ? "border-rose-200 bg-rose-50/40" :
                    app.status === "Info Requested" ? "border-amber-200 bg-amber-50/40" : "border-slate-200"
                  }`}
                >
                  <div className="flex-1 flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-teal-700/10 border border-teal-700/20 text-teal-750 font-black flex items-center justify-center text-lg select-none">
                      {app.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-base">{app.name}</span>
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded">
                          {app.rate}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          Exp: {app.experience}
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold text-slate-600 mt-1">{app.role}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {app.skills.map((skill) => (
                          <span key={skill} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 select-none justify-center">
                    {app.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => updateVettingStatus(app.id, "Approved")}
                          className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Approve (Top 3%)
                        </button>
                        <button
                          onClick={() => updateVettingStatus(app.id, "Info Requested")}
                          className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Request Info
                        </button>
                        <button
                          onClick={() => updateVettingStatus(app.id, "Declined")}
                          className="px-3.5 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          app.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          app.status === "Declined" ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" :
                          "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                          Status: {app.status}
                        </span>
                        <button
                          onClick={() => updateVettingStatus(app.id, "Pending")}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer underline bg-transparent border-0"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
