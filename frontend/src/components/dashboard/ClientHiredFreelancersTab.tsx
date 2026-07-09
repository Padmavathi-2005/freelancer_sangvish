import React from "react";

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
  return (
    <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Already Hired Freelancers
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-semibold">Track, contact, and view the active engagements of freelancers you have hired.</p>
      </div>

      {loadingHiredFreelancers ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Loading hired freelancers...</p>
        </div>
      ) : hiredFreelancers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-355 rounded-2xl p-8 shadow-inner gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
            <i className="fa-solid fa-users-slash"></i>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">No freelancers hired yet</h3>
            <p className="text-slate-400 text-xs max-w-sm font-semibold">Start hiring by browsing recommended talent or posting a project.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveTab("find_work")} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer">
              Browse Talent
            </button>
            <button onClick={() => { setIsCreatingJob(true); setActiveTab("proposals"); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer">
              Post a Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hiredFreelancers.map((freelancer) => {
            const initials = freelancer.name.split(" ").map((n: string) => n[0]).join("");
            return (
              <div key={freelancer.user_id} className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
                
                {/* Header Profile Section */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <button
                      onClick={() => setSelectedFreelancerProfile({
                        user_id: freelancer.user_id,
                        name: freelancer.name,
                        role: freelancer.title || "Elite Developer",
                        email: freelancer.email,
                        skills: [],
                        hourlyRate: freelancer.hourly_rate || 50,
                        rating: 4.9,
                        completedJobs: 25,
                        bio: "Active hired contract partner on your dashboard."
                      })}
                      className="font-black text-slate-800 hover:text-primary transition-colors text-sm text-left block cursor-pointer"
                    >
                      {freelancer.name}
                    </button>
                    <p className="text-slate-450 text-[10px] font-bold mt-0.5 truncate">{freelancer.title || "Elite Developer"} • {freelancer.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-150">
                        ${freelancer.hourly_rate || 50}/hr
                      </span>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                        ★ 4.9
                      </span>
                    </div>
                  </div>
                </div>

                {/* Associated Contracts & Works */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Engagements with You</h4>
                  
                  {/* Projects list */}
                  {freelancer.projects && freelancer.projects.length > 0 && (
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Posted Projects</span>
                      {freelancer.projects.map((proj: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={async () => {
                            const token = localStorage.getItem("token");
                            const res = await fetch(`https://freelancer.sangvish.com/api/jobs/client`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            if (res.ok) {
                              const clientJobsList = await res.json();
                              const foundJob = clientJobsList.find((j: any) => j.job_id === proj.project_id);
                              if (foundJob) {
                                setSelectedProjectDetails(foundJob);
                                setActiveTab("proposals");
                                setIsCreatingJob(false);
                              }
                            }
                          }}
                          className="text-xxs font-extrabold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-primary transition-all p-2 rounded-lg border border-slate-150 flex justify-between items-center cursor-pointer"
                        >
                          <span className="truncate pr-4 flex items-center gap-1.5"><i className="fa-solid fa-briefcase text-slate-400 text-[10px]"></i> {proj.title}</span>
                          <span className="text-xxs shrink-0 bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-black">Hired</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Gigs list */}
                  {freelancer.gigs && freelancer.gigs.length > 0 && (
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gig Orders</span>
                      {freelancer.gigs.map((gig: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={async () => {
                            const token = localStorage.getItem("token");
                            const res = await fetch("https://freelancer.sangvish.com/api/freelancer/client/gigs/applications", {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            if (res.ok) {
                              const appList = await res.json();
                              const foundApp = appList.find((a: any) => a.application_id === gig.application_id);
                              if (foundApp) {
                                setSelectedGigOrderDetails(foundApp);
                                setActiveTab("client_orders");
                              }
                            }
                          }}
                          className="text-xxs font-extrabold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-primary transition-all p-2 rounded-lg border border-slate-150 flex justify-between items-center cursor-pointer"
                        >
                          <span className="truncate pr-4 flex items-center gap-1.5"><i className="fa-solid fa-store text-slate-400 text-[10px]"></i> {gig.title}</span>
                          <span className="text-xxs shrink-0 bg-blue-50 text-blue-600 border border-blue-150 px-1.5 py-0.5 rounded uppercase tracking-wider font-black">Hired</span>
                        </button>
                      ))}
                    </div>
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
