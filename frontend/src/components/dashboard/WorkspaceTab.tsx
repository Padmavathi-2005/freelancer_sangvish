import React, { useState, useMemo } from "react";
import { FiCheckCircle, FiCircle, FiLock, FiAlertTriangle, FiClock } from "react-icons/fi";
import ProjectMilestoneTracker from "./ProjectMilestoneTracker";
import GigMilestoneTracker from "./GigMilestoneTracker";
import { useDashboard } from "@/app/dashboard/DashboardContext";

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  completed: boolean;
}

interface Contract {
  id: string;
  client: string;
  project: string;
  budget: number;
  status: "In Progress" | "Under Review" | "Completed";
  progress: number;
}

interface WorkspaceTabProps {
  userRole: string | null;
  userName: string;
  isProfileIncomplete: boolean;
  stepsStatus: any[];
  profileCompletionProgress: number;
  onOpenProfileWizard?: (step?: number) => void;
  setActiveTab: (tab: any) => void;
  setProfileStep: (step: number) => void;
  clientJobs: any[];
  allJobs: any[];
  freelancerProposals: any[];
  gigs: any[];
  clientGigs: any[];
  gigApplications: any[];
  clientApplications: any[];
  hiredFreelancers: any[];
  selectedProjectDetails: any | null;
  setSelectedProjectDetails: (details: any) => void;
  selectedGigOrderDetails: any | null;
  setSelectedGigOrderDetails: (details: any) => void;
  setSelectedFreelancerProfile: (profile: any) => void;
  triggerToast: any;
  fetchClientJobs: () => Promise<void>;
  fetchAllJobs: () => Promise<void>;
  fetchFreelancerProposals: () => Promise<void>;
  fetchGigs: () => Promise<void>;
  fetchClientGigs: () => Promise<void>;
  fetchFreelancerApplications: () => Promise<void>;
  fetchClientApplications: () => Promise<void>;
  fetchHiredFreelancers: () => Promise<void>;
}

export default function WorkspaceTab({
  userRole,
  userName,
  isProfileIncomplete,
  stepsStatus,
  profileCompletionProgress,
  onOpenProfileWizard,
  setActiveTab,
  setProfileStep,
  clientJobs,
  allJobs,
  freelancerProposals,
  gigs,
  clientGigs,
  gigApplications,
  clientApplications,
  hiredFreelancers,
  selectedProjectDetails,
  setSelectedProjectDetails,
  selectedGigOrderDetails,
  setSelectedGigOrderDetails,
  setSelectedFreelancerProfile,
  triggerToast,
  fetchClientJobs,
  fetchAllJobs,
  fetchFreelancerProposals,
  fetchGigs,
  fetchClientGigs,
  fetchFreelancerApplications,
  fetchClientApplications,
  fetchHiredFreelancers,
}: WorkspaceTabProps) {
  const { freelancerContracts, approveContractPayment, vettingStatus, walletInfo } = useDashboard();
  const balance = parseFloat(walletInfo?.wallet?.balance || "0.00");

  const clientSpentAmount = useMemo(() => {
    const contractsSum = freelancerContracts?.reduce((sum: number, c: any) => sum + parseFloat(c.budget || 0), 0) || 0;
    const gigsSum = clientApplications?.reduce((sum: number, a: any) => sum + parseFloat(a.budget || 0), 0) || 0;
    return contractsSum + gigsSum;
  }, [freelancerContracts, clientApplications]);

  const freelancerEarnedAmount = useMemo(() => {
    const contractsSum = freelancerContracts?.reduce((sum: number, c: any) => sum + parseFloat(c.budget || 0), 0) || 0;
    const gigsSum = gigApplications?.reduce((sum: number, a: any) => sum + parseFloat(a.budget || 0), 0) || 0;
    return contractsSum + gigsSum;
  }, [freelancerContracts, gigApplications]);

  const displayClientProjects = useMemo(() => {
    const ongoing = clientJobs.filter(j => j.status !== "Completed" && j.status !== "Closed");
    return (ongoing.length > 0 ? ongoing : clientJobs).slice(0, 2);
  }, [clientJobs]);

  const displayClientContracts = useMemo(() => {
    const ongoing = (freelancerContracts || []).filter((c: any) => c.status !== "Completed" && c.client_id !== undefined);
    return (ongoing.length > 0 ? ongoing : (freelancerContracts || []).filter((x: any) => x.client_id !== undefined)).slice(0, 2);
  }, [freelancerContracts]);

  const displayClientGigOrders = useMemo(() => {
    const ongoing = clientApplications.filter(a => a.status !== "Completed");
    return (ongoing.length > 0 ? ongoing : clientApplications).slice(0, 2);
  }, [clientApplications]);

  const displayFreelancerProposals = useMemo(() => {
    const ongoing = freelancerProposals.filter(p => p.status === "Pending");
    return (ongoing.length > 0 ? ongoing : freelancerProposals).slice(0, 2);
  }, [freelancerProposals]);

  const displayFreelancerContracts = useMemo(() => {
    const ongoing = (freelancerContracts || []).filter((c: any) => c.status !== "Completed");
    return (ongoing.length > 0 ? ongoing : (freelancerContracts || [])).slice(0, 2);
  }, [freelancerContracts]);

  const displayFreelancerGigOrders = useMemo(() => {
    const ongoing = gigApplications.filter(a => a.status !== "Completed");
    return (ongoing.length > 0 ? ongoing : gigApplications).slice(0, 2);
  }, [gigApplications]);

  const dynamicMonthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    // Build the last 6 calendar months, all starting at 0
    const grouped: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      grouped[months[d.getMonth()]] = 0;
    }

    // Add real transaction amounts on top
    const transactions = walletInfo?.transactions || [];
    transactions.forEach((tx: any) => {
      const txDate = new Date(tx.created_at || tx.timestamp);
      const mLabel = months[txDate.getMonth()];
      if (grouped[mLabel] !== undefined) {
        const amt = Math.abs(parseFloat(tx.amount || 0));
        grouped[mLabel] += amt;
      }
    });

    return Object.keys(grouped).map(m => ({
      month: m,
      amount: Math.round(grouped[m])
    }));
  }, [walletInfo]);

  const maxEarningVal = useMemo(() => {
    const m = Math.max(...dynamicMonthlyData.map((d) => d.amount));
    return m > 0 ? m : 1;
  }, [dynamicMonthlyData]);

  return (
    <div className="relative z-10 flex flex-col gap-8 w-full">
      {profileCompletionProgress < 100 && (
        <div 
          onClick={() => {
            if (onOpenProfileWizard) {
              onOpenProfileWizard();
            } else {
              const firstIncomplete = stepsStatus.find((s) => !s.done)?.number || 1;
              setActiveTab("settings");
              setProfileStep(firstIncomplete);
            }
          }}
          className="bg-gradient-to-r from-teal-600/5 to-cyan-500/5 border border-teal-650/30 hover:border-teal-600/70 hover:shadow-md cursor-pointer transition-all duration-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm animate-fadeIn relative z-10 group"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-wider group-hover:bg-primary/20 transition-all">Profile Status</span>
              <span className="text-xs font-black text-slate-800">{profileCompletionProgress}% Complete</span>
            </div>
            <h2 className="text-sm font-extrabold text-slate-855 group-hover:text-primary transition-colors">
              {userRole === "client" ? "Complete your Client Profile step-by-step" : "Complete your Freelancer Profile step-by-step"}
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              {userRole === "client" 
                ? "Filling in your company basics, online presence details, and hiring contact representative info unlocks remote talent lists."
                : "Filling in your professional title, experience history, education, certifications, and skills unlocks direct job placement contracts."}
            </p>
            
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/65 mt-3.5 max-w-md">
              <div className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300" style={{ width: `${profileCompletionProgress}%` }}></div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            {stepsStatus.map((step) => (
              <button
                key={step.number}
                onClick={() => {
                  if (onOpenProfileWizard) {
                    onOpenProfileWizard(step.number);
                  } else {
                    setActiveTab("settings");
                    setProfileStep(step.number);
                  }
                }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  step.done
                    ? "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100"
                    : "bg-white text-slate-600 border-slate-250 hover:border-primary/50 hover:bg-slate-50"
                }`}
              >
                {step.done ? (
                  <FiCheckCircle className="text-emerald-500 w-4 h-4 shrink-0" />
                ) : (
                  <FiCircle className="text-slate-355 w-4 h-4 shrink-0" />
                )}
                <span>{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative w-full z-10">
        {((userRole === "freelancer" || userRole === "client") && vettingStatus !== "Approved") && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[6px] rounded-xl flex flex-col items-center justify-center text-center p-8 z-30 select-none border border-slate-200/50 shadow-inner min-h-[400px]">
            <div className="w-12 h-12 bg-white border border-slate-200/60 text-slate-800 rounded-full flex items-center justify-center shadow-md animate-pulse mb-4">
              <span className="text-base">⏳</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 max-w-md">Verification Pending</h3>
            <p className="text-slate-500 text-xxs mt-1.5 max-w-sm font-semibold leading-relaxed">
              Your profile is currently under review by our administration team. You will be granted full access once your credentials have been approved.
            </p>
          </div>
        )}

        {isProfileIncomplete && !((userRole === "freelancer" || userRole === "client") && vettingStatus !== "Approved") && (
          <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-[6px] rounded-xl flex flex-col items-center justify-center text-center p-8 z-30 select-none border border-slate-200/50 shadow-inner">
            <div className="w-12 h-12 bg-white border border-slate-200/60 text-slate-800 rounded-full flex items-center justify-center shadow-md animate-bounce mb-4">
              <FiLock className="w-5 h-5 text-slate-750" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 max-w-md">Workspace Hub Locked</h3>
            <p className="text-slate-500 text-xxs mt-1.5 max-w-sm font-semibold leading-relaxed">
              {userRole === "client"
                ? "You must complete your client profile to unlock active project milestones, cost calculators, messaging threads, and contractor stats."
                : "You must complete your freelancer profile to unlock active milestones, bidding simulators, messaging threads, and contract stats."}
            </p>
            <button
              onClick={() => {
                if (onOpenProfileWizard) {
                  onOpenProfileWizard();
                } else {
                  const firstIncomplete = stepsStatus.find((s) => !s.done)?.number || 1;
                  setActiveTab("settings");
                  setProfileStep(firstIncomplete);
                }
              }}
              className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer mt-5 hover:scale-105"
            >
              Complete Profile Wizard
            </button>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${(isProfileIncomplete || ((userRole === "freelancer" || userRole === "client") && vettingStatus !== "Approved")) ? "pointer-events-none opacity-40 select-none" : ""}`}>
          {userRole === "client" ? (
            <>
              {/* LEFT COLUMN: CHARTS & ACTIONS */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {selectedProjectDetails ? (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-visible">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-505 opacity-80" />
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-slate-800">
                      <h3 className="text-xs font-extrabold uppercase tracking-wide">Project Milestone & Escrow</h3>
                      <button
                        onClick={() => setSelectedProjectDetails(null)}
                        className="text-[10px] text-teal-755 bg-teal-50 hover:bg-teal-100 font-bold border border-teal-150 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer border-0"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                    <ProjectMilestoneTracker
                      job={selectedProjectDetails}
                      onUpdateJob={(updatedJob) => setSelectedProjectDetails(updatedJob)}
                      triggerToast={triggerToast}
                      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
                    />
                  </div>
                ) : selectedGigOrderDetails ? (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-visible">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-slate-800">
                      <h3 className="text-xs font-extrabold uppercase tracking-wide">Gig Order Tracker</h3>
                      <button
                        onClick={() => setSelectedGigOrderDetails(null)}
                        className="text-[10px] text-teal-755 bg-teal-55 hover:bg-teal-100 font-bold border border-teal-155 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer border-0"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                    <GigMilestoneTracker
                      application={selectedGigOrderDetails}
                      onUpdateApplication={(updatedApp) => setSelectedGigOrderDetails(updatedApp)}
                      triggerToast={triggerToast}
                      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
                    />
                  </div>
                ) : (
                  <>
                    {/* Spending History Chart */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4">
                      <div className="text-left">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Spending History</h2>
                        <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Escrow spends & gig expenditures grouped by month</p>
                      </div>

                      <div className="relative h-32 flex items-end justify-between gap-3 pt-4 border-b border-slate-100 pb-2">
                        {dynamicMonthlyData.every(d => d.amount === 0) && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No activity yet</span>
                          </div>
                        )}
                        {dynamicMonthlyData.map((data, idx) => {
                          const hasData = data.amount > 0;
                          const heightPercent = hasData ? Math.max(10, Math.round((data.amount / maxEarningVal) * 100)) : 10;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                              <div className="relative w-full flex justify-center">
                                {hasData && (
                                  <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-950 text-white text-[9px] font-extrabold py-1 px-1.5 rounded shadow pointer-events-none z-20">
                                    ${data.amount.toLocaleString()}
                                  </span>
                                )}
                                <div
                                  className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${hasData ? "bg-primary/80 group-hover:bg-secondary" : "bg-slate-100"}`}
                                  style={{ height: `${heightPercent}px`, minHeight: "10px" }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold group-hover:text-slate-800 transition-colors">
                                {data.month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Posted Projects (showing 2) */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <h2 className="text-xs font-black text-slate-805 uppercase tracking-wide">My Posted Projects</h2>
                          <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Active posted briefs</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("proposals")}
                          className="text-[9px] text-teal-755 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg font-bold hover:bg-teal-100 transition-all cursor-pointer border-0"
                        >
                          View All
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-left">
                        {displayClientProjects.length > 0 ? (
                          displayClientProjects.map((job) => (
                            <div key={job.job_id} className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-4">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-black text-teal-755 uppercase bg-teal-50 px-1 py-0.5 rounded border border-teal-100 w-max">{job.project_type}</span>
                                <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">{job.title}</h4>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-xs font-black text-slate-800">${parseFloat(job.budget || job.max_budget || 0).toLocaleString()}</span>
                                <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider mt-0.5">{job.status}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/40">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No posted projects</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Hired Freelancer & Gig Orders */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Purchased Gigs</h2>
                          <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Ongoing service orders</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="text-[9px] text-teal-755 bg-teal-55 border border-teal-100 px-2.5 py-1 rounded-lg font-bold hover:bg-teal-100 transition-all cursor-pointer border-0"
                        >
                          View All
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-left">
                        {displayClientGigOrders.length > 0 ? (
                          displayClientGigOrders.map((app) => (
                            <div 
                              key={app.application_id}
                              onClick={() => setSelectedGigOrderDetails(app)}
                              className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-4 hover:border-slate-350 transition-all cursor-pointer"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-wider">Order #{app.application_id}</span>
                                <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{app.gig_title || "Service Delivery"}</h4>
                              </div>
                              <div className="flex flex-col items-end shrink-0 gap-1">
                                <span className="text-xs font-black text-slate-800">${parseFloat(app.budget || 0).toLocaleString()}</span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-cyan-50 text-cyan-700 border-cyan-100 uppercase">{app.status}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/40">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No purchased gigs</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Active Contracts */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <h2 className="text-xs font-black text-slate-808 uppercase tracking-wide">Active Contracts</h2>
                          <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Ongoing freelancer contracts</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("proposals")}
                          className="text-[9px] text-teal-755 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg font-bold hover:bg-teal-100 transition-all cursor-pointer border-0"
                        >
                          View All
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-left">
                        {displayClientContracts.length > 0 ? (
                          displayClientContracts.map((c) => (
                            <div 
                              key={c.contract_id}
                              onClick={() => setSelectedProjectDetails(c)}
                              className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-4 hover:border-slate-350 transition-all cursor-pointer"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wider truncate">{c.freelancer_name || "Contractor Partner"}</span>
                                <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{c.title}</h4>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Escrow: ${parseFloat(c.budget).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col items-end shrink-0 gap-1">
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-cyan-50 text-cyan-700 border-cyan-150 uppercase">{c.status}</span>
                                <span className="text-[9px] text-slate-450 font-bold">{c.progress || 0}% approved</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/40">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No active contracts</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: CLIENT SUMMARY & STATS */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <aside className="space-y-6">
                  {/* Wallet Balance Banner Card */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-md flex flex-col justify-between min-h-[120px]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-6 -mt-6"></div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">LancerFlow Wallet</p>
                        <h3 className="text-xs font-bold text-white/90 mt-0.5">Available Funds</h3>
                      </div>
                      <i className="fa-solid fa-wallet text-teal-500 text-sm"></i>
                    </div>
                    <div className="z-10 mt-4">
                      <p className="text-xl font-black tracking-tight">${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Active Virtual Balance</p>
                    </div>
                  </div>

                  {/* Workspace Metrics Card */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4 text-slate-850">
                    <div className="border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Workspace Metrics</h3>
                      <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Dynamic client account totals</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-650 text-xs shrink-0"><i className="fa-solid fa-receipt"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Expenditures</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">${clientSpentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs shrink-0"><i className="fa-solid fa-briefcase"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Posted Projects</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{clientJobs.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 text-xs shrink-0"><i className="fa-solid fa-store"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Purchased Gigs</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{clientApplications.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs shrink-0"><i className="fa-solid fa-user-check"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Hired Partners</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{hiredFreelancers.length}</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <>
              {/* LEFT COLUMN: CHARTS & ACTIONS */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {selectedProjectDetails ? (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-visible">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-slate-800">
                      <h3 className="text-xs font-extrabold uppercase tracking-wide">Project Milestone & Delivery</h3>
                      <button
                        onClick={() => setSelectedProjectDetails(null)}
                        className="text-[10px] text-teal-755 bg-teal-50 hover:bg-teal-100 font-bold border border-teal-150 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer border-0"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                    <ProjectMilestoneTracker
                      job={selectedProjectDetails}
                      onUpdateJob={(updatedJob) => setSelectedProjectDetails(updatedJob)}
                      triggerToast={triggerToast}
                      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
                    />
                  </div>
                ) : selectedGigOrderDetails ? (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-visible">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-slate-800">
                      <h3 className="text-xs font-extrabold uppercase tracking-wide">Gig Order Delivery</h3>
                      <button
                        onClick={() => setSelectedGigOrderDetails(null)}
                        className="text-[10px] text-teal-755 bg-teal-50 hover:bg-teal-100 font-bold border border-teal-155 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer border-0"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                    <GigMilestoneTracker
                      application={selectedGigOrderDetails}
                      onUpdateApplication={(updatedApp) => setSelectedGigOrderDetails(updatedApp)}
                      triggerToast={triggerToast}
                      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
                    />
                  </div>
                ) : (
                  <>
                    {/* Earning History Chart */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4">
                      <div className="text-left">
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Earning History</h2>
                        <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Net escrow payout releases grouped by calendar month</p>
                      </div>

                      <div className="relative h-32 flex items-end justify-between gap-3 pt-4 border-b border-slate-100 pb-2">
                        {dynamicMonthlyData.every(d => d.amount === 0) && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No earnings yet</span>
                          </div>
                        )}
                        {dynamicMonthlyData.map((data, idx) => {
                          const hasData = data.amount > 0;
                          const heightPercent = hasData ? Math.max(10, Math.round((data.amount / maxEarningVal) * 100)) : 10;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                              <div className="relative w-full flex justify-center">
                                {hasData && (
                                  <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-950 text-white text-[9px] font-extrabold py-1 px-1.5 rounded shadow pointer-events-none z-20">
                                    ${data.amount.toLocaleString()}
                                  </span>
                                )}
                                <div
                                  className={`w-full max-w-[18px] rounded-t-md transition-all duration-300 ${hasData ? "bg-primary/80 group-hover:bg-secondary" : "bg-slate-100"}`}
                                  style={{ height: `${heightPercent}px`, minHeight: "10px" }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold group-hover:text-slate-800 transition-colors">
                                {data.month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Submitted Bids */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide">Submitted Bids</h2>
                          <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Pending proposals & bids</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("proposals")}
                          className="text-[9px] text-teal-755 bg-teal-55 border border-teal-100 px-2.5 py-1 rounded-lg font-bold hover:bg-teal-100 transition-all cursor-pointer border-0"
                        >
                          View All
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-left">
                        {displayFreelancerProposals.length > 0 ? (
                          displayFreelancerProposals.map((prop) => (
                            <div key={prop.proposal_id} className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-4">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-black text-cyan-750 uppercase bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100 w-max">{prop.project_type || "Bid"}</span>
                                <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">{prop.project_title || "Project Application"}</h4>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-xs font-black text-slate-800">${parseFloat(prop.bid_amount || 0).toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">{prop.status}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/40">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No submitted bids</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Orders Received */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <h2 className="text-xs font-black text-slate-805 uppercase tracking-wide">Orders Received</h2>
                          <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Ongoing service deliveries</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("orders")}
                          className="text-[9px] text-teal-755 bg-teal-55 border border-teal-100 px-2.5 py-1 rounded-lg font-bold hover:bg-teal-100 transition-all cursor-pointer border-0"
                        >
                          View All
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-left">
                        {displayFreelancerGigOrders.length > 0 ? (
                          displayFreelancerGigOrders.map((app) => (
                            <div 
                              key={app.application_id}
                              onClick={() => setSelectedGigOrderDetails(app)}
                              className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-4 hover:border-slate-350 transition-all cursor-pointer"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-extrabold text-slate-450 uppercase tracking-wider">Order #{app.application_id}</span>
                                <h4 className="text-xs font-bold text-slate-805 truncate mt-0.5">{app.gig_title || "Active Service Delivery"}</h4>
                              </div>
                              <div className="flex flex-col items-end shrink-0 gap-1">
                                <span className="text-xs font-black text-slate-800">${parseFloat(app.budget || 0).toLocaleString()}</span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase">{app.status}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/40">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No gig orders received</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Active Contracts */}
                    <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <h2 className="text-xs font-black text-slate-808 uppercase tracking-wide">Active Contracts</h2>
                          <p className="text-slate-400 text-[9px] font-semibold mt-0.5">Current project contracts</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("proposals")}
                          className="text-[9px] text-teal-755 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg font-bold hover:bg-teal-100 transition-all cursor-pointer border-0"
                        >
                          View All
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 text-left">
                        {displayFreelancerContracts.length > 0 ? (
                          displayFreelancerContracts.map((c) => (
                            <div 
                              key={c.contract_id}
                              onClick={() => setSelectedProjectDetails(c)}
                              className="p-2.5 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between gap-4 hover:border-slate-355 transition-all cursor-pointer"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wider truncate">{c.client_name || "Client Buyer"}</span>
                                <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{c.title}</h4>
                                <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Budget: ${parseFloat(c.budget).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col items-end shrink-0 gap-1">
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-cyan-50 text-cyan-700 border-cyan-155 uppercase">{c.status}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/40">
                            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">No active contracts</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>

              {/* RIGHT COLUMN: FREELANCER SUMMARY & STATS */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <aside className="space-y-6">
                  {/* Wallet Balance Banner Card */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-md flex flex-col justify-between min-h-[120px]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl -mr-6 -mt-6"></div>
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">LancerFlow Wallet</p>
                        <h3 className="text-xs font-bold text-white/90 mt-0.5">Available Funds</h3>
                      </div>
                      <i className="fa-solid fa-wallet text-teal-500 text-sm"></i>
                    </div>
                    <div className="z-10 mt-4">
                      <p className="text-xl font-black tracking-tight">${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Active Virtual Balance</p>
                    </div>
                  </div>

                  {/* Workspace Metrics Card */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4 text-slate-850">
                    <div className="border-b border-slate-100 pb-2.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Workspace Metrics</h3>
                      <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Dynamic freelancer account totals</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-650 text-xs shrink-0"><i className="fa-solid fa-receipt"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Net Earnings</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">${freelancerEarnedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs shrink-0"><i className="fa-solid fa-paper-plane"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Bids</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{freelancerProposals.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-650 text-xs shrink-0"><i className="fa-solid fa-store"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Gigs</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{gigs.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 text-xs shrink-0"><i className="fa-solid fa-truck-loading"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gig Orders</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{gigApplications.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-150/40">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs shrink-0"><i className="fa-solid fa-file-contract"></i></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Active Contracts</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{(freelancerContracts || []).length}</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
