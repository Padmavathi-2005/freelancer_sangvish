import { API_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { FiBriefcase, FiMessageSquare, FiRefreshCw, FiClock, FiCheckCircle, FiDollarSign, FiAlertTriangle, FiX } from "react-icons/fi";
import GigMilestoneTracker from "./GigMilestoneTracker";
import { createPortal } from "react-dom";
import CustomSelect from "@/components/CustomSelect";

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
  const {
    triggerToast,
    handleStartConversation,
    setActiveTab,
  } = useDashboard();

  useEffect(() => {
    fetchFreelancerApplications();
  }, []);

  const [activeFilterTab, setActiveFilterTab] = useState<"pending" | "active" | "completed" | "all">("all");
  const [selectedGigOrder, setSelectedGigOrder] = useState<any | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("Work quality is poor");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeReasons, setDisputeReasons] = useState<string[]>([
    "Work not delivered",
    "Work quality is poor",
    "Requirements not followed",
    "Freelancer is unresponsive",
    "Delivery is incomplete",
    "Suspected fraud",
    "Other"
  ]);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const disputeSetting = data.find((s: any) => s.setting_key === "dispute_reasons");
          if (disputeSetting) {
            let val = disputeSetting.setting_value;
            if (typeof val === "string") {
              try { val = JSON.parse(val); } catch {}
            }
            if (Array.isArray(val)) {
              setDisputeReasons(val);
              if (val.length > 0) {
                setDisputeReason(val[0]);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load dispute reasons:", e);
      }
    };
    fetchReasons();
  }, []);

  const pendingCount = React.useMemo(() => gigApplications.filter(a => a.status === "Pending").length, [gigApplications]);
  const activeCount = React.useMemo(() => gigApplications.filter(a => a.status === "Accepted" && a.contract_id && a.contract_status !== "Completed" && a.contract_status !== "Cancelled").length, [gigApplications]);
  const completedCount = React.useMemo(() => gigApplications.filter(a => a.status === "Completed" || (a.contract_id && a.contract_status === "Completed")).length, [gigApplications]);

  const filteredApplications = React.useMemo(() => {
    return gigApplications.filter((app) => {
      const hasContract = !!app.contract_id;
      const contractStatus = app.contract_status;
      
      if (activeFilterTab === "pending") {
        return app.status === "Pending";
      }
      if (activeFilterTab === "active") {
        return app.status === "Accepted" && hasContract && contractStatus !== "Completed" && contractStatus !== "Cancelled";
      }
      if (activeFilterTab === "completed") {
        return app.status === "Completed" || (hasContract && contractStatus === "Completed");
      }
      return true;
    });
  }, [gigApplications, activeFilterTab]);

  const handleOpenChat = async (clientId: number) => {
    try {
      await handleStartConversation(clientId);
      setActiveTab("inbox");
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const handleStartWork = async (contractId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${contractId}/start-work`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Work started!", "Contract status updated to Work Started.");
        await fetchFreelancerApplications();
        // Update selectedGigOrder state
        const refreshed = gigApplications.find(a => a.application_id === selectedGigOrder.application_id);
        if (refreshed) {
          setSelectedGigOrder({
            ...refreshed,
            contract_status: "Work Started"
          });
        } else {
          setSelectedGigOrder((prev: any) => ({
            ...prev,
            contract_status: "Work Started"
          }));
        }
      } else {
        triggerToast("error", data.message || "Failed to start work.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to start work.");
    }
  };

  const handleSubmitDeliverables = async (contractId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${contractId}/request-payment`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Deliverables submitted!", "Notification sent to client for payment approval.");
        await fetchFreelancerApplications();
        // Update selectedGigOrder state
        const refreshed = gigApplications.find(a => a.application_id === selectedGigOrder.application_id);
        if (refreshed) {
          setSelectedGigOrder({
            ...refreshed,
            contract_status: "Under Review"
          });
        } else {
          setSelectedGigOrder((prev: any) => ({
            ...prev,
            contract_status: "Under Review"
          }));
        }
      } else {
        triggerToast("error", data.message || "Failed to submit deliverables.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to submit deliverables.");
    }
  };

  const handleRaiseDispute = async (contractId: number) => {
    if (!disputeDescription.trim()) {
      alert("Please provide a description of your dispute.");
      return;
    }
    try {
      setDisputeLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${contractId}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: disputeReason,
          description: disputeDescription.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Dispute raised successfully!", "Check your inbox chat thread for the mediation interface.");
        setShowDisputeModal(false);
        setDisputeDescription("");
        await fetchFreelancerApplications();
        // Update selectedGigOrder state
        const refreshed = gigApplications.find(a => a.application_id === selectedGigOrder.application_id);
        if (refreshed) {
          setSelectedGigOrder({
            ...refreshed,
            contract_status: "Disputed"
          });
        } else {
          setSelectedGigOrder((prev: any) => ({
            ...prev,
            contract_status: "Disputed"
          }));
        }
      } else {
        triggerToast("error", data.message || "Failed to raise dispute.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setDisputeLoading(false);
    }
  };

  // ─── Detail View ───────────────────────────────────────────────────────────
  if (selectedGigOrder) {
    const app = selectedGigOrder;
    const hasContract = !!app.contract_id;
    const contractStatus = app.contract_status;
    const isPaid = app.payment_status === "Paid";
    
    // Status text resolving
    let currentStatusText = app.status;
    if (hasContract) {
      if (contractStatus === "Hired") currentStatusText = "Paid (Awaiting Work Start)";
      else if (contractStatus === "Work Started") currentStatusText = "Work Started";
      else if (contractStatus === "Under Review") currentStatusText = "Under Review (Deliverables Submitted)";
      else if (contractStatus === "Completed") currentStatusText = "Completed";
      else if (contractStatus === "Disputed") currentStatusText = "Disputed";
      else if (contractStatus === "Cancelled") currentStatusText = "Cancelled";
    }

    return (
      <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-805">
        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <button
              onClick={() => { setSelectedGigOrder(null); }}
              className="text-slate-500 hover:text-slate-800 text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60 mb-2.5 inline-flex items-center gap-1.5"
            >
              ← Back to My Orders
            </button>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
              <span>{app.gig_title}</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-semibold">
              Order #{app.application_id} · by {app.client_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenChat(app.client_id)}
              className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 cursor-pointer py-2.5 px-4 rounded-xl border-0 transition-all shadow-sm"
            >
              <FiMessageSquare className="w-3.5 h-3.5" /> Open Chat
            </button>
            <button
              onClick={() => fetchFreelancerApplications().then(() => {
                const refreshed = gigApplications.find(
                  (a) => a.application_id === app.application_id
                );
                if (refreshed) setSelectedGigOrder(refreshed);
              })}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <FiRefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
          <h3 className="text-sm font-extrabold text-slate-850 border-b border-slate-100 pb-2">Order Specifications</h3>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Order ID: #{app.application_id}</span>
              <p className="text-xs text-slate-500 font-bold mt-2">
                Client Partner: <strong className="text-slate-700">{app.client_name}</strong> ({app.client_email})
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Price & Budget</span>
                <span className="text-sm font-black text-slate-800 bg-slate-100 border border-slate-200/50 px-3 py-1 rounded-xl block mt-1">
                  {app.currency_symbol || "$"}{parseFloat(app.price).toLocaleString()}
                </span>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                app.status === "Completed" || contractStatus === "Completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : app.status === "Rejected" || contractStatus === "Cancelled"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {currentStatusText}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">Project Requirements</span>
            <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap font-medium">{app.requirements}</p>
          </div>
        </div>

        {/* Steps Tracker */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
          <h3 className="text-sm font-extrabold text-slate-850 border-b border-slate-100 pb-2">Work & Payment Status</h3>
          <div className="flex flex-col">
            {([
              { label: "Order Received", date: app.created_at, done: true, sub: "Client placed service order request" },
              { label: "Order Accepted", date: app.accepted_at || (app.status !== "Pending" ? app.created_at : undefined), done: app.status !== "Pending", sub: app.status !== "Pending" ? "You accepted the order request" : "Awaiting your acceptance" },
              { label: "Escrow Deposited", date: app.paid_at, done: isPaid, sub: isPaid ? "Client funded the order (held in escrow)" : "Awaiting client checkout payment" },
              { label: "Work Started", date: app.work_started_at, done: contractStatus === "Work Started" || contractStatus === "Under Review" || contractStatus === "Completed", sub: (contractStatus === "Work Started" || contractStatus === "Under Review" || contractStatus === "Completed") ? "Service implementation is in progress" : "Awaiting Work Start action" },
              { label: "Deliverables Submitted", date: app.submitted_at, done: contractStatus === "Under Review" || contractStatus === "Completed", sub: (contractStatus === "Under Review" || contractStatus === "Completed") ? "Project deliverables sent to client" : "Pending work completion submission" },
              { label: "Order Completed", date: app.completed_at, done: contractStatus === "Completed" || app.status === "Completed", sub: (contractStatus === "Completed" || app.status === "Completed") ? "All milestones approved and paid out" : "Awaiting final approval" },
            ]).map((step, idx, arr) => {
              const done = step.done;
              const isLast = idx === arr.length - 1;
              const circleStyle = done ? "bg-teal-600 border-teal-600 text-white shadow-teal-100" : "bg-slate-50 border-slate-200 text-slate-400";
              return (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border-2 transition-all ${circleStyle}`}>
                      {done ? "✓" : idx + 1}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[28px] mt-1 mb-0.5 ${done ? "bg-teal-300" : "bg-slate-150"}`} />
                    )}
                  </div>
                  <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <p className={`text-xs font-extrabold ${done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                        {step.sub && <p className={`text-[10px] font-semibold mt-0.5 ${done ? "text-teal-600" : "text-slate-400"}`}>{step.sub}</p>}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                        {step.date ? new Date(step.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {app.status === "Pending" && (
            <>
              <div className="text-left">
                <p className="text-xs font-black text-slate-850">Accept or Decline this Service Order</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Accepting confirms you are available to complete this work. The client will be notified to fund the order.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to decline this order?")) {
                      await handleUpdateApplicationStatus(app.application_id, "Rejected");
                      setSelectedGigOrder(null);
                    }
                  }}
                  className="px-4.5 py-2.5 rounded-xl font-bold text-xs border border-rose-200 text-rose-650 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 transition-all cursor-pointer shadow-sm"
                >
                  Decline Order
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateApplicationStatus(app.application_id, "Accepted");
                    const refreshed = gigApplications.find(a => a.application_id === app.application_id);
                    setSelectedGigOrder(refreshed ? { ...refreshed, status: "Accepted" } : null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Accept & Start Order
                </button>
              </div>
            </>
          )}

          {app.status === "Accepted" && !isPaid && (
            <div className="text-left py-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping shrink-0" />
              <div>
                <p className="text-xs font-black text-slate-850">Awaiting Client Escrow Deposit</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  You accepted the order! Once the client pays and secures the funds in escrow, you will be able to start tracking milestones and submit work.
                </p>
              </div>
            </div>
          )}

          {isPaid && contractStatus === "Hired" && (
            <>
              <div className="text-left">
                <p className="text-xs font-black text-slate-850">Ready to start working?</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  Click below to activate the contract and begin tracking milestones. The client will be notified.
                </p>
              </div>
              <button
                onClick={() => handleStartWork(app.contract_id)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer border-0"
              >
                Start Work
              </button>
            </>
          )}

          {isPaid && (contractStatus === "Work Started" || contractStatus === "In Progress") && (
            <>
              <div className="text-left">
                <p className="text-xs font-black text-slate-850">Submit Deliverables & Request Payout</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  If you have completed the order scope, submit your deliverables for client review to release the escrow funds.
                </p>
              </div>
              <div className="flex gap-2.5 shrink-0">
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="px-4.5 py-2.5 rounded-xl font-bold text-xs border border-rose-200 text-rose-650 hover:bg-rose-50 transition-all cursor-pointer shadow-sm"
                >
                  Raise Dispute
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to submit your deliverables and request milestone payment?")) {
                      handleSubmitDeliverables(app.contract_id);
                    }
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer border-0"
                >
                  Submit Deliverables
                </button>
              </div>
            </>
          )}

          {contractStatus === "Under Review" && (
            <div className="text-left py-1 flex items-center justify-between w-full gap-4">
              <div>
                <p className="text-xs font-black text-slate-850">⏳ Deliverables Awaiting Approval</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  You submitted the completed service files. The client has been notified to review and release your escrow payout.
                </p>
              </div>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs border border-rose-200 text-rose-650 hover:bg-rose-50 transition-all cursor-pointer shadow-sm shrink-0"
              >
                Raise Dispute
              </button>
            </div>
          )}

          {contractStatus === "Disputed" && (
            <div className="text-left py-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shrink-0" />
              <div>
                <p className="text-xs font-black text-slate-850">⚠️ Dispute Raised & Under Mediation</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  This gig order is currently disputed. Check your Inbox messages for the mediation channel with our admin team.
                </p>
              </div>
            </div>
          )}

          {(contractStatus === "Completed" || app.status === "Completed") && (
            <div className="text-left py-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" />
              <div>
                <p className="text-xs font-black text-slate-850">✓ Gig Order Finished & Payout Released</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                  All work has been approved. The escrow payout has been transferred to your wallet balance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Milestone Tracker */}
        {isPaid && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
            <h3 className="text-sm font-extrabold text-slate-850 border-b border-slate-100 pb-2">Milestones Tracker</h3>
            <GigMilestoneTracker
              application={app}
              onUpdateApplication={(updatedApp) => {
                setSelectedGigOrder(updatedApp);
                fetchFreelancerApplications();
              }}
              triggerToast={triggerToast}
              setSelectedFreelancerProfile={() => {}}
            />
          </div>
        )}

        {/* Dispute Modal Portal */}
        {showDisputeModal && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[0.5px] p-4 overflow-y-auto">
            <div className="relative bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-md w-full animate-fadeIn overflow-hidden text-left text-slate-800 p-6 flex flex-col gap-5">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800">Raise Escrow Dispute</h3>
                <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-slate-650 font-bold text-xs">✕</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleRaiseDispute(app.contract_id); }} className="space-y-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide block mb-1">Reason for dispute *</label>
                  <CustomSelect
                    options={disputeReasons.map((r) => ({ value: r, label: r }))}
                    value={disputeReason}
                    onChange={(val: any) => setDisputeReason(val as string)}
                    placeholder="Select Reason"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide block mb-1">Describe the issue *</label>
                  <textarea
                    rows={4}
                    value={disputeDescription}
                    onChange={(e) => setDisputeDescription(e.target.value)}
                    placeholder="Provide details about the work delivered and why you are raising a dispute..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disputeLoading}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    {disputeLoading ? "Submitting..." : "Submit Dispute"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }


  // ─── List View ─────────────────────────────────────────────────────────────
  return (
    <div className="relative z-10 flex flex-col gap-8 w-full animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
            <span>Service Orders</span>
          </h2>
          <p className="text-slate-404 text-xs mt-1 font-semibold">Review custom project requirements and accept or reject orders sent by clients.</p>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilterTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilterTab === "all"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            All Orders ({gigApplications.length})
          </button>
          <button
            onClick={() => setActiveFilterTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilterTab === "pending"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilterTab("active")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilterTab === "active"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveFilterTab("completed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilterTab === "completed"
                ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Completed ({completedCount})
          </button>
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
      ) : filteredApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl p-8 shadow-sm">
          <FiBriefcase className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">No {activeFilterTab} orders found</h3>
          <p className="text-slate-404 text-xs max-w-sm font-semibold">You don't have any orders matching this category currently.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredApplications.map((app) => (
            <div
              key={app.application_id}
              onClick={() => setSelectedGigOrder(app)}
              className="bg-white border border-slate-200/80 hover:border-slate-300 transition-all rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
              
              {/* Top Meta info */}
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Service Order ID: #{app.application_id}</span>
                  <h3 className="text-sm font-black text-slate-855 mt-0.5">Gig: {app.gig_title}</h3>
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
                <p className="text-slate-650 text-xs leading-relaxed whitespace-pre-wrap font-medium">{app.requirements.length > 180 ? app.requirements.substring(0, 180) + "..." : app.requirements}</p>
              </div>

              {/* Actions for Pending */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                <span className="text-xxs font-extrabold text-primary hover:underline">Click card to view details & track milestones →</span>
                {app.status === "Pending" && (
                  <div className="flex gap-2.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to decline this order?")) {
                          await handleUpdateApplicationStatus(app.application_id, "Rejected");
                        }
                      }}
                      className="px-4.5 py-2 rounded-xl font-bold text-xs border border-rose-200 text-rose-650 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 transition-all cursor-pointer shadow-sm border-0"
                    >
                      Decline Order
                    </button>
                    <button
                      onClick={async () => {
                        await handleUpdateApplicationStatus(app.application_id, "Accepted");
                      }}
                      className="px-4.5 py-2 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-md hover:shadow-lg transition-all cursor-pointer border-0"
                    >
                      Accept Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GigApplicationsTab;
