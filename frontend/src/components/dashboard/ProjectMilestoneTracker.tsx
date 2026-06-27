import React, { useState, useEffect } from "react";
import { FiCheck, FiDollarSign } from "react-icons/fi";

interface ProjectMilestoneTrackerProps {
  job: any;
  onUpdateJob: (updatedJob: any) => void;
  triggerToast: (type: "success" | "warning" | "error", message: string, details?: string) => void;
  setSelectedFreelancerProfile: (profile: any) => void;
}

export default function ProjectMilestoneTracker({
  job,
  onUpdateJob,
  triggerToast,
  setSelectedFreelancerProfile,
}: ProjectMilestoneTrackerProps) {
  const [projectProposals, setProjectProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const fetchProposals = async () => {
    try {
      setLoadingProposals(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/proposals/job/${job.job_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProjectProposals(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [job.job_id]);

  const acceptedProposal = projectProposals.find(p => p.status === 'Accepted');

  if (loadingProposals) {
    return (
      <div className="flex items-center justify-center py-6 gap-2">
        <div className="w-4 h-4 border-2 border-t-primary border-slate-200 rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xxs font-bold">Loading proposal milestones...</span>
      </div>
    );
  }

  if (!acceptedProposal) {
    return (
      <div className="flex flex-col gap-4 text-left">
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-semibold rounded-xl p-4">
          💡 This project is currently Open. Below are the proposals received from freelancers. You can review and accept one to start tracking milestones.
        </div>
        
        {projectProposals.length === 0 ? (
          <p className="text-slate-400 text-xs italic font-medium py-2">No bids received yet for this project.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {projectProposals.map((proposal) => (
              <div key={proposal.proposal_id} className="bg-slate-50 border border-slate-250/70 rounded-xl p-4 flex flex-col gap-3 text-left">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {proposal.freelancer_name ? proposal.freelancer_name.split(" ").map((n: string) => n[0]).join("") : "FL"}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-slate-800 text-xs truncate leading-none">{proposal.freelancer_name}</h5>
                      <span className="text-slate-400 text-[10px] font-bold block mt-1 truncate">{proposal.freelancer_title || "Freelancer"} • {proposal.freelancer_email}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {proposal.status}
                  </span>
                </div>

                <div className="bg-white border border-slate-200/50 rounded-lg p-3">
                  <p className="text-slate-650 text-[11px] font-medium leading-relaxed whitespace-pre-line">{proposal.cover_letter}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xxs font-bold uppercase tracking-wide border-t border-slate-100 pt-3 mt-1">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span>Bid: <strong className="text-slate-700">${parseFloat(proposal.bid_amount).toLocaleString()}</strong></span>
                    <span>Timeline: <strong className="text-slate-700">{proposal.delivery_days} days</strong></span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          const res = await fetch(`http://localhost:5000/api/proposals/${proposal.proposal_id}/status`, {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: "Accepted" })
                          });
                          if (res.ok) {
                            triggerToast("success", "Hired freelancer successfully!");
                            fetchProposals();
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="bg-primary hover:bg-primary-hover text-white py-1 px-3 rounded-lg font-bold text-[9px] cursor-pointer transition-all shadow-sm"
                    >
                      Accept & Hire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  let milestoneList = [];
  try {
    milestoneList = typeof acceptedProposal.milestones === 'string'
      ? JSON.parse(acceptedProposal.milestones)
      : (acceptedProposal.milestones || []);
  } catch (e) {
    console.error(e);
  }

  const bidAmount = parseFloat(acceptedProposal.bid_amount);
  if (milestoneList.length === 0) {
    const m1 = Math.round(bidAmount * 0.3 * 100) / 100;
    const m2 = Math.round(bidAmount * 0.5 * 100) / 100;
    const m3 = Math.round((bidAmount - m1 - m2) * 100) / 100;
    milestoneList = [
      { id: "m1", title: "Project discovery and high-fidelity prototype handoff", amount: m1, completed: false, paid: false },
      { id: "m2", title: "Core implementation and database schema integration", amount: m2, completed: false, paid: false },
      { id: "m3", title: "Final deployment, QA audits and project handoff", amount: m3, completed: false, paid: false }
    ];
  }

  const completedAmount = milestoneList.reduce((sum: number, m: any) => sum + (m.completed ? parseFloat(m.amount) : 0), 0);
  const totalAmount = milestoneList.reduce((sum: number, m: any) => sum + parseFloat(m.amount), 0);
  const progressPercent = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
  const paidAmount = milestoneList.reduce((sum: number, m: any) => sum + (m.paid ? parseFloat(m.amount) : 0), 0);

  const handleToggleMilestone = async (mId: string, field: 'completed' | 'paid') => {
    const updated = milestoneList.map((m: any) => {
      if (m.id === mId || m.title === mId) {
        return { ...m, [field]: !m[field] };
      }
      return m;
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/proposals/${acceptedProposal.proposal_id}/milestones`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ milestones: updated })
      });
      if (res.ok) {
        setProjectProposals(prev => prev.map(p => p.proposal_id === acceptedProposal.proposal_id ? { ...p, milestones: updated } : p));
        triggerToast("success", "Project milestone updated!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-black text-xs">
            {acceptedProposal.freelancer_name ? acceptedProposal.freelancer_name.split(" ").map((n: string) => n[0]).join("") : "FL"}
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Contract Hired Partner</span>
            <button
              onClick={() => setSelectedFreelancerProfile({
                user_id: acceptedProposal.freelancer_id,
                name: acceptedProposal.freelancer_name,
                role: acceptedProposal.freelancer_title || "Elite Developer",
                email: acceptedProposal.freelancer_email,
                skills: [],
                hourlyRate: acceptedProposal.freelancer_hourly_rate || 50,
                rating: 4.9,
                completedJobs: 25,
                bio: "Your active hired contract developer partner."
              })}
              className="font-extrabold text-slate-800 hover:text-primary transition-colors text-xs text-left cursor-pointer"
            >
              {acceptedProposal.freelancer_name}
            </button>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Agreed Bid</span>
          <span className="font-extrabold text-slate-800 text-sm">${parseFloat(acceptedProposal.bid_amount).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Milestones Completed</span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-black text-slate-800">{progressPercent}%</span>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Payments Paid</span>
          <span className="text-base font-black text-slate-800 mt-1 block">
            ${paidAmount.toLocaleString()} <span className="text-xxs font-bold text-slate-450">/ ${totalAmount.toLocaleString()}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">Milestones Checklist</h4>
        {milestoneList.map((m: any, idx: number) => (
          <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 shadow-xxs hover:border-slate-350 transition-all">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={m.completed}
                  onChange={() => handleToggleMilestone(m.id || m.title, 'completed')}
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold text-slate-800 ${m.completed ? 'line-through text-slate-400' : ''}`}>{m.title}</p>
                <span className="text-[10px] font-black text-primary block mt-1">${parseFloat(m.amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleToggleMilestone(m.id || m.title, 'paid')}
                className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider cursor-pointer transition-all ${
                  m.paid
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-355 hover:text-slate-600'
                }`}
              >
                {m.paid ? (
                  <span className="flex items-center gap-0.5">
                    <FiCheck className="w-2.5 h-2.5 text-emerald-600" /> Paid
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    <FiDollarSign className="w-2.5 h-2.5" /> Pay
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
