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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingContractId, setSubmittingContractId] = useState<number | null>(null);
  const [deliverableFiles, setDeliverableFiles] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          let disputeSetting = data.find((s: any) => s.setting_key === "freelancer_dispute_reasons");
          if (!disputeSetting) {
            disputeSetting = data.find((s: any) => s.setting_key === "dispute_reasons");
          }
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

  const handleUploadDeliverableFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      const filesArray = Array.from(e.target.files);
      const newUploads: any[] = [];
      for (const file of filesArray) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_URL}/upload`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          newUploads.push({ name: file.name, url: data.url });
        } else {
          triggerToast("error", `Failed to upload file: ${file.name}`);
        }
      }
      if (newUploads.length > 0) {
        setDeliverableFiles(prev => [...prev, ...newUploads]);
        triggerToast("success", `${newUploads.length} file(s) uploaded successfully!`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Error uploading files.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitDeliverables = async (contractId: number, files: { name: string; url: string }[] = []) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${contractId}/request-payment`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          submitted_files: files.length > 0 ? JSON.stringify(files) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Deliverables submitted!", "Notification sent to client for payment approval.");
        setShowSubmitModal(false);
        setDeliverableFiles([]);
        setSubmittingContractId(null);
        await fetchFreelancerApplications();
        // Update selectedGigOrder state safely
        if (selectedGigOrder) {
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
        }
      } else {
        triggerToast("error", data.message || "Failed to submit deliverables.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Failed to submit deliverables.");
    } finally {
      setIsSubmitting(false);
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

  const handleFreelancerCancelContract = async (contractId: number) => {
    const confirmation = confirm(
      `WARNING: Are you sure you want to cancel this contract? This will forfeit all work and automatically refund 100% of the escrowed funds back to the client.\n\nThis action cannot be undone.`
    );
    if (!confirmation) return;

    try {
      setDisputeLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${contractId}/freelancer-cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Contract cancelled & client fully refunded!", "You have cancelled the project and funds have been returned to the client.");
        await fetchFreelancerApplications();
        // Update selectedGigOrder state
        const refreshed = gigApplications.find(a => a.application_id === selectedGigOrder.application_id);
        if (refreshed) {
          setSelectedGigOrder({
            ...refreshed,
            contract_status: "Cancelled"
          });
        } else {
          setSelectedGigOrder((prev: any) => ({
            ...prev,
            contract_status: "Cancelled"
          }));
        }
      } else {
        triggerToast("error", data.message || "Failed to cancel contract.");
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                  onClick={() => handleFreelancerCancelContract(app.contract_id)}
                  className="px-4.5 py-2.5 rounded-xl font-bold text-xs border border-rose-200 text-rose-650 hover:bg-rose-50 transition-all cursor-pointer shadow-sm"
                >
                  Cancel Work & Refund Client
                </button>
                <button
                  onClick={() => {
                    setSubmittingContractId(app.contract_id);
                    setDeliverableFiles([]);
                    setShowSubmitModal(true);
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
                {app.submitted_files && (() => {
                  let filesList = [];
                  try {
                    filesList = JSON.parse(app.submitted_files);
                  } catch (e) {
                    if (app.submitted_files.includes("http")) {
                      filesList = app.submitted_files.split(",").map((url: string) => ({ name: "Submitted Deliverable", url }));
                    }
                  }
                  if (!Array.isArray(filesList) || filesList.length === 0) return null;
                  return (
                    <div className="mt-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Submitted Deliverables</span>
                      <div className="flex flex-col gap-1.5">
                        {filesList.map((file: any, idx: number) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 transition hover:underline"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="truncate max-w-[250px]">{file.name || "View Deliverable"}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
            <div className="relative bg-white border border-slate-200 shadow-2xl rounded-xl max-w-md w-full animate-fadeIn overflow-hidden text-left text-slate-800 p-6 flex flex-col gap-5">
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
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
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
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-emerald-500 border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-404 text-xs font-semibold">Loading orders...</p>
        </div>
      ) : gigApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-xl p-8 shadow-inner">
          <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">No orders received</h3>
          <p className="text-slate-404 text-xs max-w-sm font-semibold">When clients order your active gigs, they will appear here.</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-200 rounded-xl p-8 shadow-sm">
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
              className="bg-white border border-slate-200/80 hover:border-slate-300 transition-all rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden cursor-pointer"
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
                    app.status === "Accepted" || app.status === "Completed" || app.contract_status === "Completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : app.status === "Rejected" || app.contract_status === "Cancelled"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {app.contract_status === "Completed" ? "Completed" : app.status}
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
      {/* Submit Deliverables Modal */}
      {showSubmitModal && submittingContractId !== null && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-sm font-extrabold text-slate-800">Submit Deliverables</h3>
              </div>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setDeliverableFiles([]);
                  setSubmittingContractId(null);
                }}
                className="text-slate-404 hover:text-slate-650 font-bold text-xs bg-transparent border-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-left">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Order details</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-850">{selectedGigOrder?.gig_title || "Gig Order"}</h4>
                  <p className="text-[10px] text-primary font-extrabold mt-0.5">${parseFloat(selectedGigOrder?.price || "0").toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Upload Files / Deliverables</h5>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-[11px] rounded-xl cursor-pointer transition-all border-0 shadow-sm flex items-center gap-1.5 select-none font-bold">
                    <span>Add Deliverable File</span>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleUploadDeliverableFile} 
                      disabled={isUploading}
                      className="hidden" 
                    />
                  </label>
                  {isUploading && (
                    <span className="text-xs text-slate-400 font-semibold italic animate-pulse">Uploading file(s)...</span>
                  )}
                </div>

                {deliverableFiles.length > 0 && (
                  <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5">Files ready to submit ({deliverableFiles.length})</p>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {deliverableFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[250px]">{file.name}</span>
                          <button 
                            type="button"
                            onClick={() => setDeliverableFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-rose-650 hover:text-rose-805 font-bold bg-transparent border-0 cursor-pointer text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setDeliverableFiles([]);
                    setSubmittingContractId(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitDeliverables(submittingContractId!, deliverableFiles)}
                  disabled={isSubmitting || isUploading}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 border-0 text-center font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-white border-primary/40 rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Deliverable</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GigApplicationsTab;
