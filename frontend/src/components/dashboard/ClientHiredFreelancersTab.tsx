import { API_URL } from "@/config/api";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";

interface ClientHiredFreelancersTabProps {
  hiredFreelancers: any[];
  loadingHiredFreelancers: boolean;
  setActiveTab: (tab: any) => void;
  setIsCreatingJob: (creating: boolean) => void;
  setSelectedProjectDetails: (details: any) => void;
  setSelectedGigOrderDetails: (details: any) => void;
  setSelectedFreelancerProfile: (profile: any) => void;
}

export default function ClientHiredFreelancersTab({
  hiredFreelancers,
  loadingHiredFreelancers,
  setActiveTab,
  setIsCreatingJob,
  setSelectedProjectDetails,
  setSelectedGigOrderDetails,
  setSelectedFreelancerProfile,
}: ClientHiredFreelancersTabProps) {
  const { t, formatPrice } = useLanguage();
  return (
    <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("already_hired_freelancers", "Already Hired Freelancers")}
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-semibold">{t("hired_freelancers_desc", "Track, contact, and view the active engagements of freelancers you have hired.")}</p>
      </div>

      {loadingHiredFreelancers ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">{t("loading_hired_freelancers", "Loading hired freelancers...")}</p>
        </div>
      ) : hiredFreelancers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-355 rounded-xl p-8 shadow-inner gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
            <i className="fa-solid fa-users-slash"></i>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">{t("no_freelancers_hired_yet", "No freelancers hired yet")}</h3>
            <p className="text-slate-400 text-xs max-w-sm font-semibold">{t("no_freelancers_hired_yet_desc", "Start hiring by browsing recommended talent or posting a project.")}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveTab("find_work")} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer">
              {t("btn_browse_talent", "Browse Talent")}
            </button>
            <button onClick={() => { setIsCreatingJob(true); setActiveTab("proposals"); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer">
              {t("btn_post_project", "Post a Project")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hiredFreelancers.map((freelancer) => {
            const displayName = freelancer.name || freelancer.email || "Freelancer";
            const initials = displayName.split(" ").map((n: string) => n ? n[0] : "").join("").toUpperCase().slice(0, 2) || "FL";
            return (
              <div key={freelancer.user_id} className="bg-white border border-slate-200/85 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
                
                {/* Header Profile Section */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <button
                      onClick={() => setSelectedFreelancerProfile({
                        user_id: freelancer.user_id,
                        name: displayName,
                        role: freelancer.title || t("elite_developer", "Elite Developer"),
                        email: freelancer.email,
                        skills: [],
                        hourlyRate: freelancer.hourly_rate || 50,
                        rating: 4.9,
                        completedJobs: 25,
                        bio: t("hired_contract_partner_bio", "Active hired contract partner on your dashboard.")
                      })}
                      className="font-black text-slate-800 hover:text-primary transition-colors text-sm text-left block cursor-pointer"
                    >
                      {displayName}
                    </button>
                    <p className="text-slate-450 text-[10px] font-bold mt-0.5 truncate">{freelancer.title || t("elite_developer", "Elite Developer")} • {freelancer.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-150">
                        {formatPrice(freelancer.hourly_rate || 50)}{t("per_hour", "/hr")}
                      </span>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                        ★ 4.9
                      </span>
                    </div>
                  </div>
                </div>

                {/* Associated Contracts & Works */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("engagements_with_you", "Engagements with You")}</h4>
                    {freelancer.contracts && freelancer.contracts.length > 0 && (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200">
                        {freelancer.contracts.length} {t("total", "total")}
                      </span>
                    )}
                  </div>

                  {freelancer.contracts && freelancer.contracts.length > 0 ? (() => {
                      // Sort: reviewed first, then by date. Show max 3.
                      const sorted = [...freelancer.contracts].sort((a: any, b: any) => {
                        if ((a.rating !== null) !== (b.rating !== null)) return a.rating !== null ? -1 : 1;
                        return 0;
                      });
                      const preview = sorted.slice(0, 3);
                      const remaining = freelancer.contracts.length - 3;
                      return (
                    <div className="flex flex-col gap-1.5 text-left">
                      {preview.map((c: any, idx: number) => {
                        const isGig = c.type === "gig";
                        let statusColor = "bg-slate-100 text-slate-700 border-slate-200";
                        if (c.status === "Completed") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-150/70";
                        else if (c.status === "In Progress" || c.status === "Work Started") statusColor = "bg-blue-50 text-blue-700 border-blue-150/70";
                        else if (c.status === "Disputed") statusColor = "bg-amber-50 text-amber-700 border-amber-150/70";
                        else if (c.status === "Cancelled") statusColor = "bg-rose-50 text-rose-700 border-rose-150/70";

                        return (
                          <div key={idx} className="flex flex-col gap-0.5 p-2 rounded-lg border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-all text-left">
                            <div className="flex justify-between items-center gap-2">
                              <button
                                onClick={async () => {
                                  const token = localStorage.getItem("token");
                                  if (isGig) {
                                    const res = await fetch(`${API_URL}/freelancer/client/gigs/applications`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      const appList = await res.json();
                                      const foundApp = appList.find((a: any) => a.contract_id === c.contract_id);
                                      if (foundApp) {
                                        setSelectedGigOrderDetails(foundApp);
                                        setActiveTab("client_orders");
                                      }
                                    }
                                  } else {
                                    const res = await fetch(`${API_URL}/jobs/client`, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      const clientJobsList = await res.json();
                                      const foundJob = clientJobsList.find((j: any) => j.contract_id === c.contract_id || j.job_id === c.contract_id);
                                      if (foundJob) {
                                        setSelectedProjectDetails(foundJob);
                                        setActiveTab("proposals");
                                        setIsCreatingJob(false);
                                      }
                                    }
                                  }
                                }}
                                className="text-[9px] font-semibold text-slate-700 hover:text-primary transition-colors text-left flex items-center gap-1.5 min-w-0 cursor-pointer"
                              >
                                {isGig ? (
                                  <i className="fa-solid fa-store text-slate-400 text-[7px] shrink-0"></i>
                                ) : (
                                  <i className="fa-solid fa-briefcase text-slate-400 text-[7px] shrink-0"></i>
                                )}
                                <span className="truncate">{c.title}</span>
                              </button>
                              
                              <div className="flex items-center gap-1 shrink-0 select-none">
                                <span className={`text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded border ${statusColor}`}>
                                  {c.status}
                                </span>
                                <span className="text-[8px] font-bold text-slate-600 tabular-nums">
                                  ${parseFloat(c.budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                {/* Inline rating star if reviewed */}
                                {c.rating !== null && c.rating !== undefined && (
                                  <span className="flex items-center gap-0.5 text-[7px] font-bold text-amber-500 bg-amber-50 px-1 py-0.5 rounded border border-amber-100">
                                    ★ {c.rating}.0
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {remaining > 0 && (
                        <p className="text-[9px] text-slate-400 font-semibold text-center pt-0.5">
                          +{remaining} {t("more_click_profile_all", "more · click profile to view all")}
                        </p>
                      )}
                    </div>
                      );
                    })() : (
                      <p className="text-slate-400 text-xxs font-semibold">{t("no_active_engagements", "No active engagements found.")}</p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
