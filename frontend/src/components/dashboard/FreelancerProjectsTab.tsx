"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { FiCheckCircle, FiClock, FiDollarSign, FiCalendar, FiUser, FiMessageSquare, FiX, FiMail, FiExternalLink, FiBriefcase } from "react-icons/fi";
import ProjectMilestoneTracker from "./ProjectMilestoneTracker";

export default function FreelancerProjectsTab() {
  const {
    freelancerContracts,
    recommendedClients,
    fetchFreelancerContracts,
    fetchRecommendedClients,
    handleStartConversation,
    setActiveTab,
    requestContractPayment,
    startWorkContract,
    triggerToast
  } = useDashboard();

  const [activeSubTab, setActiveSubTab] = useState<"ongoing" | "completed" | "all">("ongoing");
  const [clientSectionTab, setClientSectionTab] = useState<"my_clients" | "recommended">("my_clients");
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  const handleOpenChat = async (clientId: number) => {
    try {
      await handleStartConversation(clientId);
      setActiveTab("inbox");
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFreelancerContracts(), fetchRecommendedClients()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Synchronize URL search params with selectedContract state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const contractIdParam = params.get("contract_id");
      if (contractIdParam) {
        const contrId = parseInt(contractIdParam);
        const foundContract = freelancerContracts.find((c: any) => c.contract_id === contrId);
        if (foundContract) {
          setSelectedContract(foundContract);
        } else if (!loading) {
          setSelectedContract(null);
        }
      } else {
        setSelectedContract(null);
      }
    };

    syncFromUrl();

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [freelancerContracts, loading]);

  // Synchronize state changes back to URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return; // Prevent clearing URL parameter during loading phase
    const params = new URLSearchParams(window.location.search);
    const currentParam = params.get("contract_id");

    if (selectedContract) {
      if (currentParam !== selectedContract.contract_id.toString()) {
        params.set("contract_id", selectedContract.contract_id.toString());
        window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
      }
    } else {
      if (currentParam) {
        params.delete("contract_id");
        const searchStr = params.toString();
        const newUrl = searchStr ? `${window.location.pathname}?${searchStr}` : window.location.pathname;
        window.history.pushState({}, "", newUrl);
      }
    }
  }, [selectedContract, loading]);

  // Filter contracts
  const filteredContracts = useMemo(() => {
    if (activeSubTab === "ongoing") {
      return freelancerContracts.filter(
        (c) => c.status === "Hired" || c.status === "Work Started" || c.status === "In Progress" || c.status === "Under Review"
      );
    }
    if (activeSubTab === "completed") {
      return freelancerContracts.filter((c) => c.status === "Completed");
    }
    return freelancerContracts;
  }, [freelancerContracts, activeSubTab]);

  // Compute metrics
  const ongoingCount = useMemo(() => {
    return freelancerContracts.filter(
      (c) => c.status === "Hired" || c.status === "Work Started" || c.status === "In Progress" || c.status === "Under Review"
    ).length;
  }, [freelancerContracts]);

  const completedCount = useMemo(() => {
    return freelancerContracts.filter((c) => c.status === "Completed").length;
  }, [freelancerContracts]);

  const totalEarnings = useMemo(() => {
    return freelancerContracts
      .filter((c) => c.status === "Completed")
      .reduce((sum, c) => sum + parseFloat(c.original_budget || c.budget), 0);
  }, [freelancerContracts]);

  // Unique clients freelancer has worked with
  const myClients = useMemo(() => {
    const clientsMap: Record<number, any> = {};
    freelancerContracts.forEach((c) => {
      if (c.client_id && !clientsMap[c.client_id]) {
        clientsMap[c.client_id] = {
          user_id: c.client_id,
          name: c.client_name,
          email: c.client_email,
          image: c.client_image
        };
      }
    });
    return Object.values(clientsMap);
  }, [freelancerContracts]);

  const handleContactClient = async (clientId: number) => {
    await handleStartConversation(clientId);
    setActiveTab("inbox");
  };

  return (
    <div className="flex flex-col gap-8 w-full text-slate-800">
      
      {/* Header */}
      <div className="text-left">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">My Projects & Contracts</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          Manage your active freelancer assignments, track completion milestones, and view client history.
        </p>
      </div>
      {/* Projects List Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-6">
        {selectedContract ? (
          <div className="flex flex-col gap-6 text-left animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="text-slate-500 hover:text-slate-800 text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60 mb-2.5 inline-flex items-center gap-1.5"
                >
                  ← Back to Projects
                </button>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <FiBriefcase className="w-5 h-5 text-teal-600 shrink-0" />
                  <span>{selectedContract.title}</span>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    selectedContract.status === "Completed" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : selectedContract.status === "Cancelled" ? "bg-rose-50 border-rose-200 text-rose-700"
                    : selectedContract.status === "Disputed" ? "bg-orange-50 border-orange-200 text-orange-700"
                    : "bg-teal-50 border-teal-200 text-teal-700"
                  }`}>
                    {selectedContract.status === "Under Review" ? "Awaiting Approval" : selectedContract.status}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold">· Contract #{selectedContract.contract_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenChat(selectedContract.client_id)}
                  className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 cursor-pointer py-2.5 px-4 rounded-xl border-0 transition-all shadow-sm"
                >
                  <FiMessageSquare className="w-3.5 h-3.5" /> Open Chat
                </button>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-150 rounded-xl p-4 bg-slate-50/50">
              <div className="text-center sm:text-left border-r border-slate-100 last:border-r-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  {selectedContract.project_type === "Hourly" ? "Hourly Rate" : "Budget"}
                </p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  {selectedContract.project_type === "Hourly"
                    ? `$${parseFloat(selectedContract.accepted_bid_amount || selectedContract.original_budget || selectedContract.budget).toLocaleString()} / hr`
                    : `$${parseFloat(selectedContract.original_budget || selectedContract.budget).toLocaleString()}`
                  }
                </p>
                {selectedContract.project_type === "Hourly" && (
                  <span className="text-[8px] font-bold text-slate-400 block mt-0.5">
                    Escrow Remaining: ${parseFloat(selectedContract.budget).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-center sm:text-left border-r border-slate-100 last:border-r-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Progress</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  {selectedContract.progress || 0}%
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Client Partner</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                  {selectedContract.client_name}
                </p>
              </div>
            </div>

            {/* Description snippet */}
            {selectedContract.project_description && (
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide block mb-1">Contract Scope & Description</span>
                <p className="text-slate-650 text-xs leading-relaxed font-medium whitespace-pre-wrap">{selectedContract.project_description}</p>
              </div>
            )}
            <ProjectMilestoneTracker
              job={{
                job_id: selectedContract.job_id,
                title: selectedContract.title,
                project_type: selectedContract.project_type,
                description: selectedContract.project_description,
                budget: selectedContract.original_budget || selectedContract.budget
              }}
              onUpdateJob={(updatedJob) => {
                setSelectedContract((prev: any) => prev ? {
                  ...prev,
                  title: updatedJob.title,
                  project_type: updatedJob.project_type,
                  project_description: updatedJob.description,
                  budget: updatedJob.budget
                } : null);
              }}
              triggerToast={triggerToast}
              setSelectedFreelancerProfile={() => {}}
            />
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex gap-2">
                {(["ongoing", "completed", "all"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                      activeSubTab === tab
                        ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {tab} Projects
                  </button>
                ))}
              </div>
            </div>

            {/* Content list */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-8 h-8 border-4 border-t-teal-700 border-slate-200 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-xs font-semibold">Loading projects...</p>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6">
                <svg className="w-10 h-10 text-slate-355 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xs font-black text-slate-700">No {activeSubTab} projects found</h3>
                <p className="text-[10px] text-slate-400 font-semibold max-w-xs mt-1">
                  You haven't been hired or started any projects matching this filter yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredContracts.map((c) => {
                  const startDate = new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });

                  return (
                    <div
                      key={c.contract_id}
                      onClick={() => setSelectedContract(c)}
                      className="bg-slate-50/40 hover:bg-white border border-slate-200/80 hover:border-teal-300 rounded-xl p-5 transition-all flex flex-col justify-between gap-5 text-left cursor-pointer hover:shadow-md"
                    >
                      <div>
                        {/* Badge & Price */}
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            c.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                              : c.status === "Under Review"
                                ? "bg-amber-50 text-amber-700 border border-amber-150"
                                : c.status === "Work Started"
                                  ? "bg-cyan-50 text-cyan-700 border border-cyan-150"
                                  : "bg-teal-50 text-teal-700 border border-teal-150"
                          }`}>
                            {c.status === "Under Review" ? "Awaiting Approval" : c.status}
                          </span>
                          <span className="text-xs font-black text-slate-900 bg-white border border-slate-200/60 px-2.5 py-1 rounded-lg">
                            ${parseFloat(c.original_budget || c.budget).toLocaleString()}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xs font-black text-slate-800 mt-3.5 line-clamp-1">{c.title}</h3>
                        
                        {/* Project DescriptionSnippet */}
                        {c.project_description && (
                          <p className="text-slate-500 text-[11px] font-medium leading-relaxed mt-2 line-clamp-2">
                            {c.project_description}
                          </p>
                        )}

                        {/* Progress details */}
                        <div className="flex flex-col gap-1.5 mt-4">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Milestone Progress</span>
                            <span>{c.progress || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                              className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 transition-all duration-300"
                              style={{ width: `${c.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        {c.status === "Hired" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("Are you ready to start work on this contract? This will notify the client and lock cancellations/refunds.")) {
                                await startWorkContract(c.contract_id);
                              }
                            }}
                            className="w-full mt-3.5 bg-teal-600 hover:bg-teal-750 text-white font-black text-[10px] py-2.5 px-3 rounded-xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-center cursor-pointer border-0"
                          >
                            🚀 Start Work
                          </button>
                        )}
                        {(c.status === "Work Started" || c.status === "In Progress") && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("Are you sure you want to submit your completed work and request payment approval?")) {
                                await requestContractPayment(c.contract_id);
                              }
                            }}
                            className="w-full mt-3.5 bg-teal-600 hover:bg-teal-750 text-white font-black text-[10px] py-2 px-3 rounded-xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-center cursor-pointer border-0"
                          >
                            Submit Completed Work
                          </button>
                        )}
                        {c.status === "Under Review" && (
                          <div className="w-full mt-3.5 bg-amber-50 text-amber-700 border border-amber-200/50 font-black text-[10px] py-2 px-3 rounded-xl uppercase tracking-wider text-center select-none">
                            ⏳ Work Submitted / Awaiting Approval
                          </div>
                        )}
                      </div>

                      {/* Footer Client / Deadline Details */}
                      <div className="flex items-center justify-between border-t border-slate-100/80 pt-3.5 mt-1 text-[10px] font-semibold text-slate-400">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                            {c.client_image ? (
                              <img src={c.client_image} alt={c.client_name} className="w-full h-full object-cover" />
                            ) : (
                              <FiUser className="w-3 h-3 text-slate-500" />
                            )}
                          </div>
                          <span className="text-slate-600 font-bold truncate">{c.client_name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 font-extrabold uppercase text-[9px] tracking-wide text-slate-400">
                          <FiCalendar className="w-3.5 h-3.5 text-slate-355" />
                          <span>Hired: {startDate}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM SECTION: CLIENTS & RECOMMENDATIONS */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-6 text-left">
        
        {/* Toggle between Clients and Recommended Clients */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setClientSectionTab("my_clients")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                clientSectionTab === "my_clients"
                  ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              My Clients
            </button>
            <button
              onClick={() => setClientSectionTab("recommended")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                clientSectionTab === "recommended"
                  ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              Recommended Clients
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {clientSectionTab === "my_clients" ? (
          myClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <span className="text-2xl mb-2">🤝</span>
              <h4 className="text-xs font-bold text-slate-600">No client history yet</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Complete your active contracts to start building client list history.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {myClients.map((client) => (
                <div key={client.user_id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition-all flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                      {client.image ? (
                        <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUser className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-800 truncate">{client.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <FiMail className="w-3 h-3 shrink-0" />
                        <span>{client.email}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleContactClient(client.user_id)}
                    className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-teal-700 font-bold text-[10px] py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FiMessageSquare className="w-3.5 h-3.5" />
                    <span>Message Client</span>
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* RECOMMENDED CLIENTS */
          recommendedClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <span className="text-2xl mb-2">✨</span>
              <h4 className="text-xs font-bold text-slate-600">No client recommendations</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                No active hiring clients found that fit recommendations right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recommendedClients.map((client) => (
                <div key={client.user_id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 overflow-hidden flex items-center justify-center shrink-0">
                        {client.profile_image ? (
                          <img src={client.profile_image} alt={client.name || "Client"} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-extrabold text-teal-700">{(client.name || "Client").substring(0, 1)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-800 truncate">{client.name}</h4>
                        <p className="text-[10px] font-black text-teal-600 mt-0.5 truncate uppercase tracking-wider">{client.company_name || client.industry || "Direct Hiring Client"}</p>
                      </div>
                    </div>

                    {client.company_description && (
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-3 line-clamp-2">
                        {client.company_description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/client/${client.user_id}`}
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-[10px] py-2.5 rounded-xl transition-all text-center no-underline flex items-center justify-center gap-1.5 border-0 shadow-sm cursor-pointer"
                    >
                      <FiBriefcase className="w-3.5 h-3.5" />
                      <span>View Client Profile</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

    </div>
  );
}
