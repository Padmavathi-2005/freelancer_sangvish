import { API_URL, API_BASE_URL } from "@/config/api";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiDollarSign, FiClock, FiX, FiExternalLink, FiFileText } from "react-icons/fi";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { useLanguage } from "@/context/LanguageContext";

interface GigMilestoneTrackerProps {
  application: any;
  onUpdateApplication: (updatedApp: any) => void;
  triggerToast: (type: "success" | "warning" | "error", message: string, details?: string) => void;
  setSelectedFreelancerProfile: (profile: any) => void;
}

const resolveDownloadUrl = (url: string) => {
  if (!url) return "";
  let cleanUrl = url;
  const publicIdx = cleanUrl.indexOf("/public/");
  if (publicIdx !== -1) {
    cleanUrl = cleanUrl.substring(publicIdx);
  }
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }
  const baseBackendUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseBackendUrl}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
};

export default function GigMilestoneTracker({
  application,
  onUpdateApplication,
  triggerToast,
  setSelectedFreelancerProfile,
}: GigMilestoneTrackerProps) {
  const { userRole } = useDashboard();
  const { t } = useLanguage();
  const [activeRevisionId, setActiveRevisionId] = useState<number | null>(null);
  const [milestoneFeedback, setMilestoneFeedback] = useState("");
  const [milestoneActionLoading, setMilestoneActionLoading] = useState(false);
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState<number | null>(null);
  const [milestoneFiles, setMilestoneFiles] = useState<{ name: string; url: string }[]>([]);
  const [isMilestoneUploading, setIsMilestoneUploading] = useState(false);

  let milestoneList: any[] = [];
  try {
    milestoneList = typeof application.milestones === 'string'
      ? JSON.parse(application.milestones)
      : (application.milestones || []);
  } catch (e) {
    console.error(e);
  }

  const price = parseFloat(application.price || 0);
  if (milestoneList.length === 0) {
    milestoneList = [
      { id: "gm1", title: "Primary Gig Scope & Deliverables", percentage: 100, amount: price, completed: false, paid: false }
    ];
  } else {
    // Check if milestones sum matches total order price
    const currentSum = milestoneList.reduce((sum: number, m: any) => sum + parseFloat(m.amount || 0), 0);
    const diff = price - currentSum;
    if (diff > 0.01) {
      const hasBaseScope = milestoneList.some((m: any) =>
        (m.title && m.title.toLowerCase().includes("primary")) ||
        (m.title && m.title.toLowerCase().includes("base")) ||
        (m.title && m.title.toLowerCase().includes("scope"))
      );
      if (!hasBaseScope) {
        milestoneList = [
          { id: "gm_base", title: "Primary Gig Scope & Deliverables", amount: diff, completed: false, paid: false },
          ...milestoneList
        ];
      }
    }
  }

  const refreshApplication = async () => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = userRole === "client" 
        ? `${API_URL}/freelancer/client/gigs/applications`
        : `${API_URL}/freelancer/gigs/applications`;
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const apps = await res.json();
        const found = apps.find((a: any) => a.application_id === application.application_id);
        if (found) {
          onUpdateApplication(found);
        }
      }
    } catch (e) {
      console.error("Failed to refresh gig application details:", e);
    }
  };

  const handleUploadMilestoneFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsMilestoneUploading(true);
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
        setMilestoneFiles(prev => [...prev, ...newUploads]);
        triggerToast("success", `${newUploads.length} file(s) uploaded successfully!`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Error uploading files.");
    } finally {
      setIsMilestoneUploading(false);
    }
  };

  const handleSubmitMilestone = async (milestoneId: any, files: { name: string; url: string }[] = []) => {
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");

      const targetM = milestoneList.find((m: any) => 
        (m.milestone_id && m.milestone_id.toString() === milestoneId?.toString()) ||
        (m.id && m.id.toString() === milestoneId?.toString()) ||
        m.title === milestoneId
      );

      const numId = targetM?.milestone_id ? parseInt(targetM.milestone_id) : parseInt(milestoneId);

      let url = "";
      let method = "POST";

      if (!isNaN(numId) && numId > 0) {
        url = `${API_URL}/payments/contract/milestone/${numId}/submit`;
        method = "POST";
      } else if (application.contract_id) {
        url = `${API_URL}/freelancer/contracts/${application.contract_id}/request-payment`;
        method = "PUT";
      } else {
        triggerToast("error", "Unable to submit: contract ID not found.");
        return;
      }

      const res = await fetch(url, {
        method,
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
        triggerToast("success", "Work submitted successfully!", "Awaiting client review.");
        setSubmittingMilestoneId(null);
        setMilestoneFiles([]);
        await refreshApplication();
      } else {
        triggerToast("error", data.message || "Failed to submit work.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  const handleRejectMilestone = async (milestoneId: number) => {
    if (!milestoneFeedback.trim()) return;
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ feedback: milestoneFeedback })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Revision request submitted.");
        setActiveRevisionId(null);
        setMilestoneFeedback("");
        await refreshApplication();
      } else {
        triggerToast("error", data.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  const handleReleaseMilestone = async (milestoneId: number, title: string, amount: number) => {
    if (!confirm(`Are you sure you want to release the payment of $${amount.toFixed(2)} for milestone "${title}"?`)) return;
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/release`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Milestone payment released successfully!", `Released $${amount.toFixed(2)} to freelancer.`);
        await refreshApplication();
      } else {
        triggerToast("error", data.message || "Failed to release milestone payment.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  const isCompleted = (m: any) => m.completed === true || m.completed === 'true' || m.status === 'Completed';
  const isPaid = (m: any) => m.paid === true || m.paid === 'true' || m.payment_status === 'Paid';

  const completedAmount = milestoneList.reduce((sum: number, m: any) => sum + (isCompleted(m) ? parseFloat(m.amount) : 0), 0);
  const totalAmount = milestoneList.reduce((sum: number, m: any) => sum + parseFloat(m.amount), 0);
  const progressPercent = totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0;
  const paidAmount = milestoneList.reduce((sum: number, m: any) => sum + (isPaid(m) ? parseFloat(m.amount) : 0), 0);

  const handleToggleMilestone = async (mId: string, field: 'completed' | 'paid') => {
    if (application.status === "Pending") {
      triggerToast(
        "warning",
        "Awaiting Freelancer Acceptance",
        "Your order is waiting for freelancer approval. Payment options will unlock once the freelancer accepts your order application. No charges have been made yet."
      );
      return;
    }
    const updated = milestoneList.map((m: any) => {
      const match = m.id === mId || m.title === mId || (m.milestone_id && m.milestone_id.toString() === mId);
      if (match) {
        if (field === 'completed') {
          const currentVal = isCompleted(m);
          return {
            ...m,
            completed: !currentVal,
            status: !currentVal ? 'Completed' : 'Pending'
          };
        } else {
          const currentVal = isPaid(m);
          return {
            ...m,
            paid: !currentVal,
            payment_status: !currentVal ? 'Paid' : 'Pending',
            paid_at: !currentVal ? new Date().toISOString() : null
          };
        }
      }
      return {
        ...m,
        completed: isCompleted(m),
        paid: isPaid(m),
        paid_at: m.paid_at || null
      };
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/gigs/applications/${application.application_id}/milestones`, {
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-slate-50 border border-slate-200/55 p-3 sm:p-4 rounded-xl text-center overflow-hidden">
          <span className="text-[8.5px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 whitespace-nowrap truncate">{t("milestones_completed", "Milestones Completed")}</span>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-black text-slate-800">{progressPercent}%</span>
            <div className="w-10 sm:w-16 h-2 bg-slate-200 rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200/55 p-3 sm:p-4 rounded-xl text-center overflow-hidden">
          <span className="text-[8.5px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 whitespace-nowrap truncate">{t("payments_paid", "Payments Paid")}</span>
          <span className="text-sm sm:text-base font-black text-slate-800 block font-sans whitespace-nowrap">
            ${paidAmount.toLocaleString()} <span className="text-xxs font-bold text-slate-450 font-sans">/ ${totalAmount.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* 2-Column Layout: Left = Project Timeline, Right = Milestones Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: PROJECT TIMELINE */}
        <div className="md:col-span-1 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-4 text-left shadow-2xs h-fit">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">{t("project_timeline", "Project Timeline")}</h4>
            {(application.contract_status === "Disputed" || application.dispute_status === "Open") && (
              <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase">Disputed</span>
            )}
          </div>

          <div className="flex flex-col">
            {(() => {
              const isOrderPaid = application.payment_status === "Paid" || Boolean(application.contract_id) || application.status === "Completed";
              const cStatus = application.contract_status || application.status;

              const timelineSteps: any[] = [
                {
                  label: t("step_hired_payment", "Hired & Payment"),
                  sub: isOrderPaid ? t("locked_in_escrow", "You locked ${{amount}} into escrow").replace("{{amount}}", `$${totalAmount.toLocaleString()}`) : t("awaiting_checkout_payment", "Awaiting checkout payment"),
                  amount: `$${totalAmount.toLocaleString()}`,
                  date: application.paid_at || application.created_at,
                  done: isOrderPaid
                },
                {
                  label: t("step_work_started", "Work Started"),
                  sub: (isOrderPaid || ["In Progress", "Work Started", "Under Review", "Completed", "Disputed"].includes(cStatus)) ? t("freelancer_began_work", "Freelancer began work on contract") : t("awaiting_work_start", "Awaiting work start"),
                  date: (isOrderPaid || ["In Progress", "Work Started", "Under Review", "Completed", "Disputed"].includes(cStatus)) ? (application.work_started_at || application.paid_at || application.accepted_at || application.created_at) : null,
                  done: isOrderPaid || ["In Progress", "Work Started", "Under Review", "Completed", "Disputed"].includes(cStatus)
                },
                ...milestoneList.map((m: any, idx: number) => {
                  const mPaid = isPaid(m);
                  const mRev = m.status === 'Under Review';
                  const mComp = isCompleted(m);

                  const mTitleTranslated = m.title && m.title.startsWith("Primary Service Package") 
                    ? `${t("primary_service_package", "Primary Service Package")} (${m.title.match(/\((.*?)\)/)?.[1] || "BASIC"})`
                    : m.title;

                  return {
                    label: `${t("milestone_label", "Milestone")} ${idx + 1}: ${mTitleTranslated}`,
                    sub: mPaid
                      ? t("payment_released_escrow", "Payment released from escrow")
                      : mRev
                      ? t("work_submitted_for_review", "Work submitted for client review")
                      : mComp
                      ? t("work_completed", "Work completed")
                      : t("awaiting_completion_approval", "Awaiting completion & approval"),
                    amount: `$${parseFloat(m.amount || 0).toLocaleString()}`,
                    date: (mPaid || mComp || mRev) ? (m.updated_at || application.paid_at || application.created_at) : null,
                    done: mPaid,
                    isReview: mRev && !mPaid
                  };
                }),
                (() => {
                  const allPaid = milestoneList.length > 0 && milestoneList.every((m: any) => isPaid(m));
                  const anySubmitted = cStatus === "Under Review" || milestoneList.some((m: any) => m.status === "Under Review" || isPaid(m));
                  return {
                    label: t("step_work_submitted", "Work Submitted"),
                    sub: allPaid
                      ? t("all_deliverables_approved", "All deliverables completed & approved")
                      : anySubmitted
                      ? t("work_submitted_awaiting_approval", "Work submitted - Awaiting client approval")
                      : t("pending_work_submission", "Pending work submission"),
                    date: anySubmitted ? (application.submitted_at || application.paid_at || application.created_at) : null,
                    done: allPaid,
                    isReview: anySubmitted && !allPaid
                  };
                })()
              ];

              if (cStatus === "Disputed" || application.dispute_status === "Open") {
                timelineSteps.push({
                  label: t("status_disputed", "Disputed"),
                  sub: t("under_admin_arbitration", "Under admin arbitration"),
                  date: application.disputed_at || application.updated_at || application.created_at,
                  done: true,
                  isDispute: true
                });
              }

              return timelineSteps.map((step: any, idx: number, arr: any[]) => {
                const done = step.done;
                const isLast = idx === arr.length - 1;
                const circleStyle = step.isDispute
                  ? "bg-rose-600 border-rose-600 text-white shadow-rose-100"
                  : done
                  ? "bg-teal-600 border-teal-600 text-white shadow-teal-100"
                  : step.isReview
                  ? "bg-amber-50 border-amber-500 text-amber-700 shadow-amber-100 font-black"
                  : "bg-white border-slate-300 text-slate-400";

                const circleIcon = step.isDispute
                  ? "⚠️"
                  : done
                  ? "✓"
                  : step.isReview
                  ? "⏳"
                  : idx + 1;

                return (
                  <div key={idx} className="flex gap-3 text-start">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 border-2 transition-all ${circleStyle}`}>
                        {circleIcon}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[22px] my-1 ${done ? (step.isDispute ? "bg-rose-300" : "bg-teal-300") : step.isReview ? "bg-amber-300" : "bg-slate-200"}`} />
                      )}
                    </div>

                    <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-3.5"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-extrabold leading-snug break-words ${step.isDispute ? "text-rose-700" : done ? "text-slate-850" : "text-slate-400"}`}>{step.label}</p>
                          <p className={`text-[10px] font-semibold mt-0.5 leading-snug break-words ${step.isDispute ? "text-rose-600" : done ? "text-teal-700" : "text-slate-400"}`}>{step.sub}</p>
                        </div>
                        {step.amount && (
                          <span className="text-[9.5px] font-black text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                            {step.amount}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 block mt-1">
                        {step.date ? new Date(step.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : t("status_pending", "Pending")}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Right Column: ORDER SCOPE & FEATURES CHECKLIST */}
        <div className="md:col-span-2 flex flex-col gap-2">
          <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1">{t("order_scope_checklist", "Order Scope & Features Checklist")}</h4>
          {milestoneList.map((m: any, idx: number) => {
            const mIdentifier = (m.milestone_id || m.id || m.title || idx).toString();
            const milestonePaid = isPaid(m);
            const hasContract = !!application.contract_id;

            return (
              <div key={idx} className="flex flex-col gap-3">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/60 transition-all shadow-2xs">
                  <div className="flex items-center h-5 mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isCompleted(m)}
                      disabled={hasContract}
                      onChange={() => !hasContract && handleToggleMilestone(mIdentifier, 'completed')}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-xs font-bold text-slate-800 leading-snug break-words ${isCompleted(m) ? 'line-through text-slate-400' : ''}`}>
                            {m.title && m.title.startsWith("Primary Service Package") 
                              ? `${t("primary_service_package", "Primary Service Package")} (${t(`plan_${(m.title.match(/\((.*?)\)/)?.[1] || "BASIC").toLowerCase()}`, m.title.match(/\((.*?)\)/)?.[1] || "BASIC")})`
                              : m.title}
                          </p>
                          {hasContract && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${
                              milestonePaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : m.status === 'Under Review'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : m.status === 'Revision Requested'
                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                              {milestonePaid ? t("status_paid", "Paid") : (m.status || t("status_pending", "Pending"))}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <span className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md font-bold border border-slate-200/60 flex items-center gap-1 select-none whitespace-nowrap">
                          {t("revisions_label", "Revisions:")} 0/3
                        </span>
                        <span className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md whitespace-nowrap">
                          ${parseFloat(m.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {milestonePaid && userRole === "freelancer" && (
                        <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 select-none">
                          <span>•</span>
                          <span>{t("platform_fee_deducted", "Platform service fee was deducted")}</span>
                        </span>
                      )}
                      {m.paid_at && (
                        <span className="text-[9px] font-bold text-emerald-600 whitespace-nowrap">
                          • {t("paid_on_label", "Paid on")} {new Date(m.paid_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-[10px] text-slate-500 font-medium mt-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 whitespace-pre-wrap leading-relaxed">
                        {m.description === "Core service package delivery and requirements fulfillment" 
                          ? t("core_service_package_desc", "Core service package delivery and requirements fulfillment") 
                          : m.description}
                      </p>
                    )}
                      {hasContract && m.status === 'Revision Requested' && m.feedback && (
                        <p className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-150 rounded-lg p-2 mt-2 leading-relaxed">
                          ⚠ Feedback: {m.feedback}
                        </p>
                      )}
                      {hasContract && m.submitted_files && (() => {
                        let filesList = [];
                        try {
                          filesList = JSON.parse(m.submitted_files);
                        } catch (e) {
                          if (m.submitted_files.includes("http")) {
                            filesList = m.submitted_files.split(",").map((url: string) => ({ name: "Submitted Deliverable", url }));
                          }
                        }
                        if (!Array.isArray(filesList) || filesList.length === 0) return null;
                        return (
                          <div className="mt-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left">
                            <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest block mb-2">Submitted Deliverables</span>
                            <div className="flex flex-col gap-1.5">
                              {filesList.map((file: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={resolveDownloadUrl(file.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 transition hover:underline"
                                >
                                  <FiExternalLink className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[250px]">{file.name || "View Deliverable"}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100/80">
                    {(() => {
                      const isDisputedOrder = application.contract_status === "Disputed" || application.dispute_status === "Open" || application.dispute_status === "Escalated";

                      if (isDisputedOrder) {
                        return milestonePaid ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> Paid
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 select-none">
                            🔒 Frozen - Under Dispute
                          </span>
                        );
                      }

                      if (!hasContract) {
                        return (
                          <button
                            onClick={() => handleToggleMilestone(mIdentifier, 'paid')}
                            title={application.status === "Pending" ? "Awaiting Freelancer Acceptance - Click for info" : "Pay milestone"}
                            className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider cursor-pointer transition-all ${
                              milestonePaid
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : application.status === "Pending"
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-2xs'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-355 hover:text-slate-600'
                            }`}
                          >
                            {milestonePaid ? (
                              <span className="flex items-center gap-0.5">
                                <FiCheck className="w-2.5 h-2.5 text-emerald-600" /> {t("status_paid", "Paid")}
                              </span>
                            ) : application.status === "Pending" ? (
                              <span className="flex items-center gap-1">
                                <FiClock className="w-2.5 h-2.5 text-amber-600 shrink-0" /> {t("awaiting_acceptance", "Awaiting Acceptance")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <FiDollarSign className="w-2.5 h-2.5" /> {t("pay_btn", "Pay")}
                              </span>
                            )}
                          </button>
                        );
                      }

                      if (milestonePaid) {
                        return (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> Paid
                          </span>
                        );
                      }

                      if (userRole === "freelancer") {
                        return m.status === "Under Review" ? (
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wider">
                            ⏳ Under Review
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSubmittingMilestoneId(m.milestone_id || m.id || mIdentifier);
                              setMilestoneFiles([]);
                            }}
                            disabled={milestoneActionLoading}
                            className="bg-primary hover:bg-primary-hover text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-0 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            Submit Work
                          </button>
                        );
                      }

                      if (userRole === "client") {
                        return m.status === "Under Review" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReleaseMilestone(m.milestone_id, m.title, parseFloat(m.amount))}
                              className="bg-emerald-600 hover:bg-emerald-750 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-0 cursor-pointer shadow-sm"
                            >
                              Approve & Pay
                            </button>
                            <button
                              onClick={() => {
                                setActiveRevisionId(m.milestone_id);
                                setMilestoneFeedback("");
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-605 border border-rose-200 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                            >
                              Request Revision
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wider">
                            ⏳ Awaiting Work
                          </span>
                        );
                      }

                      return null;
                    })()}
                  </div>

                {/* Revision Request Form */}
                {activeRevisionId === m.milestone_id && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 animate-fadeIn">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Describe Revision Requirements *</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Please update the wireframe styling and align colors with branding..."
                        value={milestoneFeedback}
                        onChange={(e) => setMilestoneFeedback(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none mt-1.5"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveRevisionId(null)}
                        className="px-3 py-1.5 bg-white border border-slate-250 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={milestoneActionLoading || !milestoneFeedback.trim()}
                        onClick={() => handleRejectMilestone(m.milestone_id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-750 text-white rounded-lg text-[10px] font-black border-0 cursor-pointer disabled:opacity-50"
                      >
                        Submit Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Submit deliverables modal */}
      {submittingMilestoneId !== null && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFileText className="text-primary text-sm shrink-0" />
                <h3 className="text-sm font-extrabold text-slate-800">Submit Milestone Deliverables</h3>
              </div>
              <button
                onClick={() => {
                  setSubmittingMilestoneId(null);
                  setMilestoneFiles([]);
                }}
                className="text-slate-404 hover:text-slate-650 font-bold text-xs bg-transparent border-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-left">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Milestone details</span>
                {(() => {
                  const currentM = milestoneList.find((m: any) => m.milestone_id === submittingMilestoneId || (m.id && m.id === submittingMilestoneId.toString()));
                  return (
                    <div>
                      <h4 className="text-xs font-bold text-slate-850">{currentM?.title || "Milestone Deliverable"}</h4>
                      <p className="text-[10px] text-primary font-extrabold mt-0.5">${parseFloat(currentM?.amount || "0").toLocaleString()}</p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Upload Files / Deliverables</h5>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-[11px] rounded-xl cursor-pointer transition-all border-0 shadow-sm flex items-center gap-1.5 select-none">
                    <span>Add Deliverable File</span>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleUploadMilestoneFile} 
                      disabled={isMilestoneUploading}
                      className="hidden" 
                    />
                  </label>
                  {isMilestoneUploading && (
                    <span className="text-xs text-slate-400 font-semibold italic animate-pulse">Uploading file(s)...</span>
                  )}
                </div>

                {milestoneFiles.length > 0 && (
                  <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1.5">Files ready to submit ({milestoneFiles.length})</p>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {milestoneFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[250px]">{file.name}</span>
                          <button 
                            type="button"
                            onClick={() => setMilestoneFiles(prev => prev.filter((_, i) => i !== idx))}
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
                    setSubmittingMilestoneId(null);
                    setMilestoneFiles([]);
                  }}
                  disabled={milestoneActionLoading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitMilestone(submittingMilestoneId!, milestoneFiles)}
                  disabled={milestoneActionLoading || isMilestoneUploading}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 border-0 text-center"
                >
                  {milestoneActionLoading ? (
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
}
