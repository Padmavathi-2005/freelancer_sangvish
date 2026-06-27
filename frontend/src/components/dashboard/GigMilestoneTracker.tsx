import React from "react";
import { FiCheck, FiDollarSign } from "react-icons/fi";

interface GigMilestoneTrackerProps {
  application: any;
  onUpdateApplication: (updatedApp: any) => void;
  triggerToast: (type: "success" | "warning" | "error", message: string, details?: string) => void;
  setSelectedFreelancerProfile: (profile: any) => void;
}

export default function GigMilestoneTracker({
  application,
  onUpdateApplication,
  triggerToast,
  setSelectedFreelancerProfile,
}: GigMilestoneTrackerProps) {
  let milestoneList = [];
  try {
    milestoneList = typeof application.milestones === 'string'
      ? JSON.parse(application.milestones)
      : (application.milestones || []);
  } catch (e) {
    console.error(e);
  }

  const price = parseFloat(application.price);
  if (milestoneList.length === 0) {
    const gm1 = Math.round(price * 0.3 * 100) / 100;
    const gm2 = Math.round(price * 0.5 * 100) / 100;
    const gm3 = Math.round((price - gm1 - gm2) * 100) / 100;
    milestoneList = [
      { id: "gm1", title: "Project initiation and requirements analysis", percentage: 30, amount: gm1, completed: false, paid: false },
      { id: "gm2", title: "Core implementation and layout staging", percentage: 50, amount: gm2, completed: false, paid: false },
      { id: "gm3", title: "Final testing, polish and deployment handoff", percentage: 20, amount: gm3, completed: false, paid: false }
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
      const res = await fetch(`http://localhost:5000/api/freelancer/gigs/applications/${application.application_id}/milestones`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ milestones: updated })
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateApplication(data.application);
        triggerToast("success", "Gig milestone status updated!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200/55 p-4 rounded-xl text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Milestones Completed</span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-black text-slate-800">{progressPercent}%</span>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200/55 p-4 rounded-xl text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Payments Paid</span>
          <span className="text-base font-black text-slate-800 mt-1 block font-sans">
            ${paidAmount.toLocaleString()} <span className="text-xxs font-bold text-slate-450 font-sans">/ ${totalAmount.toLocaleString()}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">Gig Milestones Checklist</h4>
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
