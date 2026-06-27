import React, { useEffect } from "react";
import { FiBriefcase } from "react-icons/fi";
import GigMilestoneTracker from "./GigMilestoneTracker";

interface ClientOrdersTabProps {
  selectedGigOrderDetails: any | null;
  setSelectedGigOrderDetails: (val: any | null) => void;
  loadingClientApplications: boolean;
  clientApplications: any[];
  fetchClientApplications: () => Promise<void>;
  handleUpdateGigApplication: (val: any) => void;
  triggerToast: any;
  setSelectedFreelancerProfile: (val: any) => void;
  setActiveTab: (val: any) => void;
}

const ClientOrdersTab: React.FC<ClientOrdersTabProps> = ({
  selectedGigOrderDetails,
  setSelectedGigOrderDetails,
  loadingClientApplications,
  clientApplications,
  fetchClientApplications,
  handleUpdateGigApplication,
  triggerToast,
  setSelectedFreelancerProfile,
  setActiveTab,
}) => {
  useEffect(() => {
    fetchClientApplications();
  }, []);

  return (
    selectedGigOrderDetails ? (
      <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left">
        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <button
              onClick={() => setSelectedGigOrderDetails(null)}
              className="text-slate-505 hover:text-slate-805 text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60 mb-2.5 inline-flex items-center gap-1.5 font-sans"
            >
              ← Back to Gig Orders
            </button>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
              <span>Gig Order: {selectedGigOrderDetails.gig_title}</span>
            </h2>
            <p className="text-slate-404 text-xs mt-1 font-semibold">Service order details, requirement specifications, and milestone tracking.</p>
          </div>
        </div>

        {/* Overview Details */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
          <h3 className="text-sm font-extrabold text-slate-850 border-b border-slate-100 pb-2">Order Specifications</h3>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Service Order ID: #{selectedGigOrderDetails.application_id}</span>
              <p className="text-xs text-slate-500 font-bold mt-2">
                Freelancer: <button
                  onClick={() => setSelectedFreelancerProfile({
                    user_id: selectedGigOrderDetails.freelancer_id,
                    name: selectedGigOrderDetails.freelancer_name,
                    role: "Gig Service Provider",
                    email: selectedGigOrderDetails.freelancer_email,
                    skills: [],
                    hourlyRate: 50,
                    rating: 4.9,
                    completedJobs: 15,
                    bio: "Hired service provider partner."
                  })}
                  className="text-primary font-black hover:underline cursor-pointer"
                >
                  {selectedGigOrderDetails.freelancer_name}
                </button> ({selectedGigOrderDetails.freelancer_email})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ordered Package Price</span>
              <span className="text-sm font-black text-slate-805 bg-slate-100 border border-slate-200/50 px-3 py-1 rounded-xl block mt-1.5">
                {selectedGigOrderDetails.currency_symbol || "$"}{parseFloat(selectedGigOrderDetails.price).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 mt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">Project Instructions & Requirements Sent</span>
            <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap font-medium">{selectedGigOrderDetails.requirements}</p>
          </div>
        </div>

        {/* Milestone Tracker Sub-component */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
          <h3 className="text-sm font-extrabold text-slate-855 border-b border-slate-100 pb-2">Gig Milestones Tracker</h3>
          <GigMilestoneTracker
            application={selectedGigOrderDetails}
            onUpdateApplication={handleUpdateGigApplication}
            triggerToast={triggerToast}
            setSelectedFreelancerProfile={setSelectedFreelancerProfile}
          />
        </div>
      </div>
    ) : (
      <div className="relative z-10 flex flex-col gap-8 w-full animate-fadeIn text-left">
        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
              <span>My Service Orders</span>
            </h2>
            <p className="text-slate-404 text-xs mt-1 font-semibold">Track the status and requirements of service orders you have placed with freelancers.</p>
          </div>
        </div>

        {/* List */}
        {loadingClientApplications ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
            <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
            <p className="text-slate-404 text-xs font-semibold">Loading orders...</p>
          </div>
        ) : clientApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-2xl p-8 shadow-inner">
            <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">No orders placed yet</h3>
            <p className="text-slate-404 text-xs max-w-sm font-semibold">Explore gigs and place your first service order to collaborate with freelancers.</p>
            <button
              onClick={() => setActiveTab("explore_gigs")}
              className="mt-4 bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer font-display"
            >
              Explore Gigs
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {clientApplications.map((app) => (
              <div key={app.application_id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:border-slate-300 animate-fadeIn">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
                
                {/* Top Meta info */}
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="cursor-pointer" onClick={() => setSelectedGigOrderDetails(app)}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Service Order ID: #{app.application_id}</span>
                    <h3 className="text-sm font-black text-slate-800 mt-0.5 hover:text-primary transition-colors">Gig: {app.gig_title}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Freelancer: {app.freelancer_name} ({app.freelancer_email})</p>
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
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">Your Order Requirements</span>
                  <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap font-medium">{app.requirements}</p>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setSelectedGigOrderDetails(app)}
                    className="text-[10px] font-bold text-white bg-primary hover:bg-primary-hover flex items-center gap-1.5 cursor-pointer py-1.5 px-3.5 rounded-lg transition-colors border border-transparent shadow-sm font-display"
                  >
                    Order Details & Milestones →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  );
};

export default ClientOrdersTab;
