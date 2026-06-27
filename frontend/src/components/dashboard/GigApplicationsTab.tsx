import React, { useEffect } from "react";

interface GigApplicationsTabProps {
  loadingApplications: boolean;
  gigApplications: any[];
  fetchFreelancerApplications: () => Promise<void>;
  handleUpdateApplicationStatus: (applicationId: number, status: "Accepted" | "Rejected") => Promise<void>;
}

const GigApplicationsTab: React.FC<GigApplicationsTabProps> = ({
  loadingApplications,
  gigApplications,
  fetchFreelancerApplications,
  handleUpdateApplicationStatus,
}) => {
  useEffect(() => {
    fetchFreelancerApplications();
  }, []);

  return (
    <div className="relative z-10 flex flex-col gap-8 w-full animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            📥 Service Orders
          </h2>
          <p className="text-slate-404 text-xs mt-1 font-semibold">Review custom project requirements and accept or reject orders sent by clients.</p>
        </div>
      </div>

      {/* List */}
      {loadingApplications ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-emerald-500 border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-404 text-xs font-semibold">Loading orders...</p>
        </div>
      ) : gigApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-2xl p-8 shadow-inner">
          <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">No orders received</h3>
          <p className="text-slate-404 text-xs max-w-sm font-semibold">When clients order your active gigs, they will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {gigApplications.map((app) => (
            <div key={app.application_id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
              
              {/* Top Meta info */}
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Service Order ID: #{app.application_id}</span>
                  <h3 className="text-sm font-black text-slate-805 mt-0.5">Gig: {app.gig_title}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">Client: {app.client_name} ({app.client_email})</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-800 bg-slate-100 border border-slate-200/50 px-3 py-1 rounded-xl">
                    {app.currency_symbol || "$"}{parseFloat(app.price).toLocaleString()}
                  </span>
                  
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider border ${
                    app.status === "Accepted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : app.status === "Rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 mt-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">Project Instructions & Requirements</span>
                <p className="text-slate-650 text-xs leading-relaxed whitespace-pre-wrap font-medium">{app.requirements}</p>
              </div>

              {/* Actions for Pending */}
              {app.status === "Pending" && (
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => handleUpdateApplicationStatus(app.application_id, "Rejected")}
                    className="px-4.5 py-2 rounded-xl font-bold text-xs border border-rose-200 text-rose-650 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 transition-all cursor-pointer shadow-sm"
                  >
                    Decline Order
                  </button>
                  <button
                    onClick={() => handleUpdateApplicationStatus(app.application_id, "Accepted")}
                    className="px-4.5 py-2 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Accept & Start Order
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GigApplicationsTab;
