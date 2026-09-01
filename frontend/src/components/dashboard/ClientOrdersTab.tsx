import { API_URL, API_BASE_URL } from "@/config/api";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { FiBriefcase, FiCreditCard, FiCheckCircle, FiAlertTriangle, FiExternalLink, FiRefreshCw, FiStar, FiMessageSquare, FiX, FiUser, FiUnlock, FiClock, FiChevronDown } from "react-icons/fi";
import { FaWallet, FaStripe, FaPaypal } from "react-icons/fa";
import GigMilestoneTracker from "./GigMilestoneTracker";
import CustomSelect from "../CustomSelect";
import { useDashboard } from "../../app/dashboard/DashboardContext";
import { useLanguage } from "@/context/LanguageContext";

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

export const getOrderStatusPill = (app: any, t?: (key: string, fallback: string) => string) => {
  const translate = t || ((_, fallback) => fallback);
  if (!app) return { text: translate("pending_status", "PENDING"), style: "bg-amber-50 text-amber-700 border-amber-200" };

  if (app.contract_status === "Disputed" || app.dispute_status === "Open" || app.dispute_status === "Escalated") {
    return { text: translate("status_disputed", "Disputed / Under Mediation"), style: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (app.contract_status === "Completed" || app.status === "Completed") {
    return { text: translate("status_completed", "Completed"), style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (app.contract_status === "Under Review") {
    return { text: translate("status_under_review", "Under Review"), style: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (app.status === "Rejected") {
    return { text: translate("status_declined", "Declined"), style: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if (app.contract_status === "Cancelled" || app.status === "Cancelled") {
    return { text: translate("status_cancelled", "Cancelled"), style: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  if ((app.contract_id && app.contract_status !== "Cancelled") || app.contract_status === "In Progress" || app.contract_status === "Work Started" || app.payment_status === "Paid") {
    return { text: translate("status_work_started", "Work Started"), style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (app.status === "Accepted") {
    return { text: translate("status_accepted", "Accepted"), style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  return { text: translate("pending_status", app.status || "PENDING"), style: "bg-amber-50 text-amber-700 border-amber-200" };
};

export const resolveDownloadUrl = (url: string) => {
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

export const getInvoiceBreakdown = (app: any) => {
  if (!app) return { baseCost: 0, addonsList: [], customFeaturesList: [], total: 0, planName: null };
  const reqText = app.requirements || "";
  const total = parseFloat(app.price || 0);

  const planMatch = reqText.match(/\[Plan Ordered:\s*([^\]]+)\]/i);
  const planName = planMatch ? planMatch[1].trim() : null;

  const extrasMatch = reqText.match(/\[Ordered Extras\s*\/\s*Add-ons:\s*([\s\S]*?)\]/i);
  let addonsList: { title: string; price: number }[] = [];
  if (extrasMatch && extrasMatch[1]) {
    const rawExtras = extrasMatch[1].trim();
    const lines = rawExtras.split("\n").map((l: string) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const priceMatch = line.match(/(.*?)\(\+\$?([\d.]+)\)/);
      if (priceMatch) {
        const title = priceMatch[1].replace(/^[-\s]+/, "").trim();
        const price = parseFloat(priceMatch[2]);
        addonsList.push({ title, price });
      } else {
        const cleanTitle = line.replace(/^[-\s]+/, "").trim();
        if (cleanTitle) addonsList.push({ title: cleanTitle, price: 0 });
      }
    }
  }

  let customFeaturesList: { title: string; price: number }[] = [];
  let rawMilestones: any[] = [];
  try {
    rawMilestones = typeof app.milestones === "string" ? JSON.parse(app.milestones) : (app.milestones || []);
  } catch (e) {}
  for (const m of rawMilestones) {
    if (!m.title) continue;
    const titleLower = m.title.toLowerCase();
    if (titleLower.includes("primary") || titleLower.includes("base") || titleLower.includes("entire gig scope")) {
      continue;
    }
    const existsInAddons = addonsList.some(a => a.title.toLowerCase() === m.title.toLowerCase());
    if (!existsInAddons) {
      customFeaturesList.push({
        title: m.title,
        price: parseFloat(m.amount || 0)
      });
    }
  }

  const addonsSum = addonsList.reduce((sum, a) => sum + a.price, 0);
  const featuresSum = customFeaturesList.reduce((sum, f) => sum + f.price, 0);
  const baseCost = Math.max(0, total - (addonsSum + featuresSum));

  return { baseCost, addonsList, customFeaturesList, total, planName };
};

export const getOriginalPackagePrice = (app: any) => {
  if (!app || !app.gig_price) return null;
  const reqText = app.requirements || "";

  const planMatch = reqText.match(/\[Plan Ordered:\s*([^\]]+)\]/i);
  const planName = planMatch ? planMatch[1].trim() : null;

  let originalPrice = parseFloat(app.gig_price);
  if (app.gig_discount_percent && parseFloat(app.gig_discount_percent) > 0) {
    originalPrice = originalPrice * (1 - parseFloat(app.gig_discount_percent) / 100);
  }

  if (planName && app.gig_plans) {
    try {
      const parsedPlans = typeof app.gig_plans === "string" ? JSON.parse(app.gig_plans) : app.gig_plans;
      if (Array.isArray(parsedPlans)) {
        const matchingPlan = parsedPlans.find((p: any) => p.name.toLowerCase() === planName.toLowerCase());
        if (matchingPlan && matchingPlan.price) {
          let planPrice = parseFloat(matchingPlan.price);
          if (app.gig_discount_percent && parseFloat(app.gig_discount_percent) > 0) {
            planPrice = planPrice * (1 - parseFloat(app.gig_discount_percent) / 100);
          }
          originalPrice = planPrice;
        }
      }
    } catch (e) {}
  }
  return originalPrice;
};

export const checkIsNegotiated = (app: any) => {
  if (!app || !app.gig_price) return false;
  const reqText = app.requirements || "";
  const total = parseFloat(app.price || 0);

  const extrasMatch = reqText.match(/\[Ordered Extras\s*\/\s*Add-ons:\s*([\s\S]*?)\]/i);
  let addonsList: { title: string; price: number }[] = [];

  if (extrasMatch && extrasMatch[1]) {
    const rawExtras = extrasMatch[1].trim();
    const lines = rawExtras.split("\n").map((l: string) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const priceMatch = line.match(/(.*?)\(\+\$?([\d.]+)\)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[2]);
        addonsList.push({ title: "", price });
      }
    }
  }

  let customFeaturesList: { title: string; price: number }[] = [];
  let rawMilestones: any[] = [];
  try {
    rawMilestones = typeof app.milestones === "string" ? JSON.parse(app.milestones) : (app.milestones || []);
  } catch (e) {}

  for (const m of rawMilestones) {
    if (!m.title) continue;
    const titleLower = m.title.toLowerCase();
    if (titleLower.includes("primary") || titleLower.includes("base") || titleLower.includes("entire gig scope")) {
      continue;
    }
    customFeaturesList.push({ title: m.title, price: parseFloat(m.amount || 0) });
  }

  const addonsSum = addonsList.reduce((sum, a) => sum + a.price, 0);
  const featuresSum = customFeaturesList.reduce((sum, f) => sum + f.price, 0);
  const baseCost = Math.max(0, total - (addonsSum + featuresSum));

  const originalPrice = getOriginalPackagePrice(app);
  if (originalPrice === null) return false;

  return baseCost < originalPrice - 0.01;
};

export const renderOrderBreakdown = (app: any, t?: any) => {
  if (!app) return null;
  const translate = t || ((key: string, def: string) => def);
  const reqText = app.requirements || "";
  const total = parseFloat(app.price || 0);

  const planMatch = reqText.match(/\[Plan Ordered:\s*([^\]]+)\]/i);
  const planName = planMatch ? planMatch[1].trim() : null;

  // 1. Extract Add-ons from requirements string
  const extrasMatch = reqText.match(/\[Ordered Extras\s*\/\s*Add-ons:\s*([\s\S]*?)\]/i);
  let addonsList: { title: string; price: number }[] = [];

  if (extrasMatch && extrasMatch[1]) {
    const rawExtras = extrasMatch[1].trim();
    const lines = rawExtras.split("\n").map((l: string) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const priceMatch = line.match(/(.*?)\(\+\$?([\d.]+)\)/);
      if (priceMatch) {
        const title = priceMatch[1].replace(/^[-\s]+/, "").trim();
        const price = parseFloat(priceMatch[2]);
        addonsList.push({ title, price });
      } else {
        const cleanTitle = line.replace(/^[-\s]+/, "").trim();
        if (cleanTitle) addonsList.push({ title: cleanTitle, price: 0 });
      }
    }
  }

  // 2. Extract Custom Features from app.milestones
  let customFeaturesList: { title: string; price: number }[] = [];
  let rawMilestones: any[] = [];
  try {
    rawMilestones = typeof app.milestones === "string" ? JSON.parse(app.milestones) : (app.milestones || []);
  } catch (e) {}

  for (const m of rawMilestones) {
    if (!m.title) continue;
    const titleLower = m.title.toLowerCase();
    if (titleLower.includes("primary") || titleLower.includes("base") || titleLower.includes("entire gig scope")) {
      continue;
    }
    const existsInAddons = addonsList.some(a => a.title.toLowerCase() === m.title.toLowerCase());
    if (!existsInAddons) {
      customFeaturesList.push({
        title: m.title,
        price: parseFloat(m.amount || 0)
      });
    }
  }

  const addonsSum = addonsList.reduce((sum, a) => sum + a.price, 0);
  const featuresSum = customFeaturesList.reduce((sum, f) => sum + f.price, 0);
  const baseCost = Math.max(0, total - (addonsSum + featuresSum));

  let notes = reqText
    .replace(/\[Ordered Extras\s*\/\s*Add-ons:[\s\S]*?\]/gi, "")
    .replace(/\[Plan Ordered:\s*[^\]]+\]/gi, "")
    .trim();

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 px-3 py-1.5 rounded-lg shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{translate("base_project_cost_label", "Base Project Cost:")}</span>
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            {planName ? translate("plan_ordered_label", "{{plan}} Plan").replace("{{plan}}", translate(`plan_${planName.toLowerCase()}`, planName.toUpperCase())) : translate("base_service_label", "Base Service")} ({app.currency_symbol || "$"}{baseCost.toLocaleString()})
            {(() => {
              const isNegotiated = checkIsNegotiated(app);
              const origPrice = getOriginalPackagePrice(app);
              if (isNegotiated && origPrice) {
                return (
                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {translate("negotiated_from_label", "Negotiated from")} {app.currency_symbol || "$"}{origPrice.toLocaleString()}
                  </span>
                );
              }
              return null;
            })()}
          </span>
        </div>

        {addonsList.map((addon, idx) => (
          <div key={`addon-${idx}`} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/90 text-emerald-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">{translate("extra_addon_label", "Extra Add-on:")}</span>
            <span className="font-extrabold">
              {translate(addon.title, addon.title)} {addon.price > 0 ? `(+${app.currency_symbol || "$"}${addon.price})` : ""}
            </span>
          </div>
        ))}

        {customFeaturesList.map((feature, idx) => {
          const translatedFeatTitle = feature.title.replace(/Milestone\s*#?(\d+)/gi, (_: string, num: string) => {
            return translate("milestone_number_label", "Milestone #{num}").replace("{num}", num);
          });
          return (
            <div key={`feat-${idx}`} className="flex items-center gap-1.5 bg-sky-50 border border-sky-200/90 px-3 py-1.5 rounded-lg animate-fadeIn">
              <span className="text-[10px] font-black text-sky-600 uppercase tracking-wider">{translate("custom_feature_label", "Custom Feature:")}</span>
              <span className="font-extrabold text-slate-750">
                {translate(translatedFeatTitle, translatedFeatTitle)} {feature.price > 0 ? `(+${app.currency_symbol || "$"}${feature.price})` : ""}
              </span>
            </div>
          );
        })}
      </div>

      {notes && (
        <div className="border-t border-slate-200/60 pt-2 text-slate-600">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">{translate("project_instructions_requirements_label", "Project Instructions & Requirements:")}</span>
          <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
};

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
  const { t } = useLanguage();
  const [payMethod, setPayMethod] = useState<"wallet" | "stripe" | "paypal">("stripe");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);
  const [stripeReturnHandled, setStripeReturnHandled] = useState(false);
  const [congratsModalData, setCongratsModalData] = useState<{
    show: boolean;
    amount: number;
    title: string;
    orderId: string | number;
  } | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { handleStartConversation } = useDashboard();

  useEffect(() => {
    if (congratsModalData?.show) {
      const timer = setTimeout(() => {
        setCongratsModalData(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [congratsModalData]);

  const hasAutoSelected = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && clientApplications.length > 0 && !selectedGigOrderDetails && !hasAutoSelected.current) {
      const params = new URLSearchParams(window.location.search);
      const appIdParam = params.get("application_id") || params.get("order_id");
      if (appIdParam) {
        const found = clientApplications.find((a: any) => a.application_id.toString() === appIdParam.toString());
        if (found) {
          hasAutoSelected.current = true;
          setSelectedGigOrderDetails(found);
        }
      }
    }
  }, [clientApplications, selectedGigOrderDetails]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const currentAppId = params.get("application_id") || params.get("order_id");
      if (selectedGigOrderDetails) {
        const appId = selectedGigOrderDetails.application_id.toString();
        if (currentAppId !== appId) {
          window.history.pushState(null, "", `?application_id=${appId}`);
        }
      } else {
        if (currentAppId) {
          window.history.pushState(null, "", window.location.pathname);
        }
      }
    }
  }, [selectedGigOrderDetails]);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("Work quality is poor");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeReasons, setDisputeReasons] = useState<string[]>([
    "Work not delivered",
    "Work quality is poor",
    "Requirements not followed",
    "Freelancer is unresponsive",
    "Other"
  ]);

  useEffect(() => {
    const fetchDisputeReasons = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const setting = data.find((s: any) => s.setting_key === "client_dispute_reasons" || s.setting_key === "dispute_reasons");
          if (setting) {
            let val = setting.setting_value;
            if (typeof val === "string") val = JSON.parse(val);
            if (Array.isArray(val) && val.length > 0) {
              setDisputeReasons(val);
              setDisputeReason(val[0]);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load dispute reasons:", e);
      }
    };
    fetchDisputeReasons();
  }, []);

  const handleCancelGigOrder = async (contractId: number, budget: number) => {
    if (!confirm(`Are you sure you want to cancel this gig order and request a 100% refund of your escrowed funds ($${budget.toFixed(2)})?\n\nThis action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${contractId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Gig order cancelled and refunded!");
        await fetchClientApplications();
        if (selectedGigOrderDetails) {
          const updated = { ...selectedGigOrderDetails, status: "Cancelled", contract_status: "Cancelled" };
          setSelectedGigOrderDetails(updated);
          handleUpdateGigApplication(updated);
        }
      } else {
        triggerToast("error", data.message || "Failed to cancel gig order.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Failed to cancel order.");
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGigOrderDetails?.contract_id) return;
    if (!disputeDescription.trim()) {
      alert("Please provide a description of your dispute.");
      return;
    }

    try {
      setDisputeLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${selectedGigOrderDetails.contract_id}/dispute`, {
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
        if (selectedGigOrderDetails) {
          const updated = { ...selectedGigOrderDetails, contract_status: "Disputed", dispute_status: "Open" };
          setSelectedGigOrderDetails(updated);
          handleUpdateGigApplication(updated);
        }
        await fetchClientApplications();
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

  const renderDisputeModal = () => {
    if (!showDisputeModal || typeof document === "undefined") return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fadeIn"
        style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2.5px)" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 relative flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto scrollbar-thin">
          <button
            onClick={() => setShowDisputeModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer border-0 bg-transparent"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div>
            <h3 className="text-base font-black text-slate-800">Raise a Contract Dispute</h3>
            <p className="text-xs text-slate-400 mt-1">Provide the details of your claim. An administrator will review the case for mediation.</p>
          </div>

          <form onSubmit={handleRaiseDispute} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reason for Dispute</label>
              <CustomSelect
                options={disputeReasons.map((r) => ({ value: r, label: r }))}
                value={disputeReason}
                onChange={(val: any) => setDisputeReason(val as string)}
                placeholder="Select a reason"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Detailed Explanation</label>
              <textarea
                required
                rows={4}
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Explain the reason for the dispute, including what was not delivered or what expectations were missed..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-extrabold text-slate-600 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disputeLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 border-0"
              >
                {disputeLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Dispute</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  };

  const renderContractActions = (app: any) => {
    if (!app || !app.contract_id) return null;

    return (
      <div className="flex flex-col gap-4 w-full mt-4">
        {/* Under Review -> Display submitted files for the client */}
        {app.contract_status === "Under Review" && app.submitted_files && (() => {
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
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 text-left flex flex-col gap-3">
              <div>
                <p className="text-xs font-black text-slate-800">Submitted Deliverables for Review</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  The freelancer has submitted these files for your review. Please inspect them before marking the order as completed.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {filesList.map((file: any, idx: number) => (
                  <a
                    key={idx}
                    href={resolveDownloadUrl(file.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 transition hover:underline"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>{file.name || "View Deliverable"}</span>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Hired / Work hasn't started -> Client can cancel and get 100% refund */}
        {app.contract_status === "Hired" && (
          <div className="bg-rose-50/50 border border-rose-200/60 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-black text-rose-800">Cancel Order & Refund Escrow</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                You can cancel this order and receive a 100% refund of your escrowed budget since the freelancer hasn't started work yet.
              </p>
            </div>
            <button
              onClick={() => handleCancelGigOrder(app.contract_id, parseFloat(app.price))}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer border-0"
            >
              Cancel Order
            </button>
          </div>
        )}

        {/* Active work -> Client can raise a dispute */}
        {app.contract_status !== "Hired" &&
         app.contract_status !== "Cancelled" &&
         app.contract_status !== "Completed" &&
         app.contract_status !== "Disputed" && (
          <div className="bg-amber-50/55 border border-amber-250/50 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-black text-amber-850">Need to raise a dispute?</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                If the freelancer is unresponsive or delivered work does not match specifications, you can raise an official dispute case for mediation.
              </p>
            </div>
            <button
              onClick={() => setShowDisputeModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer border-0"
            >
              File a Dispute
            </button>
          </div>
        )}

        {/* Dispute opened */}
        {app.contract_status === "Disputed" && (
          <div className="bg-rose-50/55 border border-rose-250/50 rounded-xl p-5 text-left flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-rose-800">This order is under dispute arbitration</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                An active dispute case has been opened. Escrow disbursements are locked pending review. Please communicate in the mediation chat thread.
              </p>
            </div>
          </div>
        )}

        {/* Cancelled */}
        {app.contract_status === "Cancelled" && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 text-left flex items-start gap-3">
            <FiX className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-slate-700">This order has been cancelled</p>
              <p className="text-[10px] text-slate-450 font-semibold mt-0.5 leading-relaxed">
                The contract has been cancelled and all escrowed funds have been fully refunded back to your wallet.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleOpenChat = async (freelancerId: number) => {
    await handleStartConversation(freelancerId);
    setActiveTab("inbox");
  };

  // Review states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGigOrderDetails) return;

    try {
      setSubmittingReview(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/client/gigs/${selectedGigOrderDetails.gig_id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          comment: reviewComment,
          application_id: selectedGigOrderDetails.application_id
        })
      });

      if (res.ok) {
        triggerToast("success", "Thank you! Your review has been submitted.");
        await fetchClientApplications();
        setSelectedGigOrderDetails(null);
        setReviewComment("");
        setRating(5);
      } else {
        const errData = await res.json();
        triggerToast("error", errData.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Error submitting review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ─── Handle Stripe return redirect ────────────────────────────────────────
  const handleStripeReturn = useCallback(async () => {
    if (typeof window === "undefined" || stripeReturnHandled) return;
    const params = new URLSearchParams(window.location.search);

    if (params.get("stripe_success") === "1") {
      const appId = params.get("application_id");
      const amount = params.get("amount");
      if (!appId || !amount) return;

      setStripeReturnHandled(true);
      // Clean the URL params
      const cleanUrl = window.location.pathname + "?tab=client_orders";
      window.history.replaceState({}, "", cleanUrl);

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/payments/stripe/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ application_id: parseInt(appId), amount_usd: parseFloat(amount) }),
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast("success", "Stripe payment confirmed! Contract is now active.", "Work will begin shortly.");
          setPaySuccess(true);
          await fetchClientApplications();
          setCongratsModalData({
            show: true,
            amount: parseFloat(amount),
            title: "Gig Order Contract",
            orderId: appId
          });
        } else {
          triggerToast("error", data.message || "Failed to confirm Stripe payment.");
        }
      } catch (e) {
        triggerToast("error", "Network error confirming Stripe payment.");
      }
    } else if (params.get("stripe_cancel") === "1") {
      setStripeReturnHandled(true);
      window.history.replaceState({}, "", window.location.pathname + "?tab=client_orders");
      triggerToast("warning", "Stripe payment was cancelled. Your order is still pending payment.");
    }
  }, [stripeReturnHandled]);

  useEffect(() => {
    fetchClientApplications();
    handleStripeReturn();
  }, []);

  // ─── Compute upfront amount ────────────────────────────────────────────────
  const getUpfront = (app: any) => {
    try {
      const m = typeof app.milestones === "string" ? JSON.parse(app.milestones) : (app.milestones || []);
      const hasMilestones = m.length > 0;
      const total = parseFloat(app.price);
      return { hasMilestones, upfront: total, total };
    } catch {
      return { hasMilestones: false, upfront: parseFloat(app.price), total: parseFloat(app.price) };
    }
  };

  // ─── Handle Pay button ─────────────────────────────────────────────────────
  const handlePayment = async (app: any) => {
    if (!app) return;
    setPayError("");
    setPayLoading(true);
    setPaySuccess(false);

    const token = localStorage.getItem("token");
    const { hasMilestones, upfront } = getUpfront(app);
    const label = hasMilestones
      ? `100% Upfront (Escrow) – ${app.gig_title}`
      : `Full Payment – ${app.gig_title}`;

    try {
      if (payMethod === "stripe") {
        // ── STRIPE: Create session → redirect to Stripe Hosted Checkout ──
        const res = await fetch(`${API_URL}/payments/stripe/create-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            application_id: app.application_id,
            amount_usd: upfront,
            label,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          // Redirect to Stripe's hosted checkout page
          window.location.href = data.url;
          return; // stops further execution as page will redirect
        } else {
          setPayError(data.message || "Failed to create Stripe payment session. Please try again.");
        }
        return;
      }

      // ── WALLET / PAYPAL: Direct payment via backend ──
      const res = await fetch(`${API_URL}/payments/wallet/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          application_id: app.application_id,
          method: payMethod, // "wallet" or "paypal"
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaySuccess(true);
        triggerToast(
          "success",
          `${payMethod === "paypal" ? "PayPal" : "Wallet"} payment of $${upfront.toFixed(2)} confirmed!`,
          "Contract is now active. Work will begin shortly."
        );
        await fetchClientApplications();
        // Update the selected detail view
        const updated = clientApplications.find((a) => a.application_id === app.application_id);
        if (updated) setSelectedGigOrderDetails(updated);

        setCongratsModalData({
          show: true,
          amount: upfront,
          title: app.gig_title || "Gig Order",
          orderId: app.application_id
        });
      } else {
        setPayError(data.message || "Payment failed. Please try again.");
      }
    } catch (err) {
      setPayError("Network error. Please check your connection and try again.");
    } finally {
      setPayLoading(false);
    }
  };

  // ─── Payment Panel ─────────────────────────────────────────────────────────
  const renderPaymentPanel = (app: any) => {
    if (!app) return null;
    if (app.contract_id) return null;

    const { hasMilestones, upfront, total } = getUpfront(app);

    if (app.status === "Pending") {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-800">{t("awaiting_freelancer_acceptance", "Awaiting Freelancer Acceptance")}</p>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5 leading-relaxed">
              {t("awaiting_acceptance_msg", "Your order has been sent to the freelancer. Payment will be requested once they accept. No charges have been made yet.")}
            </p>
          </div>
        </div>
      );
    }

    if (app.status === "Rejected") {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-3">
          <FiAlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-rose-800">{t("order_declined_by_freelancer", "Order Declined by Freelancer")}</p>
            <p className="text-[10px] text-rose-700 font-semibold mt-0.5">
              {t("order_declined_msg", "The freelancer declined this order. No payment was charged.")}
            </p>
          </div>
        </div>
      );
    }

    if (app.status === "Accepted") {
      if (paySuccess) {
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-emerald-800">Payment Confirmed — Contract Active!</p>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                Your payment has been received and the contract is now live. The freelancer has been notified to begin work.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col gap-0 relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-400" />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-extrabold text-slate-850">Payment Required</h3>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
              <FiCheckCircle className="w-3 h-3" /> Accepted by Freelancer
            </span>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Cost breakdown */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                <span>Total Order Value</span>
                <span className="font-black text-slate-800 text-sm">${total.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-150 pt-2 mt-1">
                {hasMilestones ? (
                  <>
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className="text-amber-700 font-bold">Due Now (100% upfront)</span>
                      <span className="font-black text-amber-700 text-base">${upfront.toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold mt-2 bg-slate-100 rounded-lg px-2 py-1.5 leading-relaxed">
                      Escrow payment of 100% is charged now and held securely. Milestones will be paid out from escrow upon approval.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className="text-amber-700 font-bold">Due Now (full payment)</span>
                      <span className="font-black text-amber-700 text-base">${upfront.toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold mt-2 bg-slate-100 rounded-lg px-2 py-1.5">
                      Standard gig — full payment is required upfront to start work.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Payment method selector */}
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-2.5">
                {(["stripe", "paypal", "wallet"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setPayMethod(m); setPayError(""); }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                      payMethod === m
                        ? "border-primary bg-primary/[0.04] text-primary shadow-sm"
                        : "border-slate-150 hover:border-slate-250 bg-white text-slate-500"
                    }`}
                  >
                    {m === "stripe" && <FaStripe className={`w-10 h-4 ${payMethod === "stripe" ? "text-primary" : "text-slate-400"}`} />}
                    {m === "paypal" && <FaPaypal className={`w-4 h-4 ${payMethod === "paypal" ? "text-primary" : "text-slate-400"}`} />}
                    {m === "wallet" && <FaWallet className={`w-4 h-4 ${payMethod === "wallet" ? "text-primary" : "text-slate-400"}`} />}
                    <span className="text-[10px] font-black capitalize">{m}</span>
                  </button>
                ))}
              </div>

              {/* Method info hint */}
              <div className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                {payMethod === "stripe" && (
                  <span>
                    <strong className="text-slate-700">Stripe:</strong> You will be redirected to Stripe's secure hosted checkout page. Pay <strong>${upfront.toFixed(2)}</strong> by card. You are redirected back after payment.
                  </span>
                )}
                {payMethod === "paypal" && (
                  <span>
                    <strong className="text-slate-700">PayPal:</strong> Your PayPal account is charged <strong>${upfront.toFixed(2)}</strong> and the contract activates instantly.
                  </span>
                )}
                {payMethod === "wallet" && (
                  <span>
                    <strong className="text-slate-700">Wallet:</strong> <strong>${upfront.toFixed(2)}</strong> is deducted from your platform wallet balance. Ensure your balance is sufficient.
                  </span>
                )}
              </div>
            </div>

            {/* Error message */}
            {payError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-start gap-2">
                <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{payError}</span>
              </div>
            )}

            {/* Pay button */}
            <button
              type="button"
              disabled={payLoading}
              onClick={() => handlePayment(app)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-sm py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {payLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {payMethod === "stripe" ? "Redirecting to Stripe..." : "Processing payment..."}
                </span>
              ) : (
                <>
                  {payMethod === "stripe" && <FiExternalLink className="w-4 h-4" />}
                  {payMethod === "paypal" && <FaPaypal className="w-4 h-4" />}
                  {payMethod === "wallet" && <FaWallet className="w-4 h-4" />}
                  <span>
                    Pay ${upfront.toFixed(2)} via {payMethod.charAt(0).toUpperCase() + payMethod.slice(1)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (app.status === "Completed") {
      if (app.review_rating) {
        return (
          <div className="bg-teal-50/50 border border-teal-150 rounded-xl p-6 flex flex-col gap-3 text-left">
            <h4 className="text-xs font-black text-teal-850 flex items-center gap-1.5">
              <FiCheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Service Reviewed Successfully</span>
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-700">Your Rating:</span>
              <div className="flex text-amber-400">
                {Array.from({ length: Math.round(parseFloat(app.review_rating)) }).map((_, i) => (
                  <FiStar key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>
            {app.review_comment && (
              <p className="text-xs text-slate-500 font-semibold italic bg-white p-3 border border-slate-200/60 rounded-xl leading-relaxed mt-1">
                "{app.review_comment}"
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 text-left">
          <div>
            <h4 className="text-sm font-black text-slate-900">Share Your Experience</h4>
            <p className="text-slate-500 text-xs mt-1 font-medium">Leave a review for the freelancer and their delivered work.</p>
          </div>

          <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Rating:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <FiStar
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Review Comment</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your collaboration, standard of work, responsiveness..."
                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-255 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800 font-semibold resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="bg-teal-700 hover:bg-teal-650 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all self-end disabled:opacity-50 cursor-pointer"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      );
    }

    return null;
  };

  // ─── Detail View ───────────────────────────────────────────────────────────
  if (selectedGigOrderDetails) {
    const { hasMilestones, upfront, total } = getUpfront(selectedGigOrderDetails);
    const needsPayment = selectedGigOrderDetails.status === "Accepted" && !selectedGigOrderDetails.contract_id;

    return (
      <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left">
        {/* Header */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <button
              onClick={() => { setSelectedGigOrderDetails(null); setPayError(""); setPaySuccess(false); }}
              className="text-slate-500 hover:text-slate-800 text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60 mb-2.5 inline-flex items-center gap-1.5"
            >
              ← {t("back_to_your_gig_orders", "Back to Your Gig Orders")}
            </button>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
              <span dir="auto">{t(selectedGigOrderDetails.gig_title, selectedGigOrderDetails.gig_title)}</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-semibold">
              {t("order_by_label", "Order")} #{selectedGigOrderDetails.application_id} · {t("by_label", "by")} {selectedGigOrderDetails.freelancer_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenChat(selectedGigOrderDetails.freelancer_id)}
              className="text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 cursor-pointer py-2.5 px-4 rounded-xl border-0 transition-all shadow-sm"
            >
              <FiMessageSquare className="w-3.5 h-3.5" /> {t("open_chat_btn", "Open Chat")}
            </button>
            <button
              onClick={() => fetchClientApplications().then(() => {
                const refreshed = clientApplications.find(
                  (a) => a.application_id === selectedGigOrderDetails.application_id
                );
                if (refreshed) setSelectedGigOrderDetails(refreshed);
              })}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <FiRefreshCw className="w-3 h-3" /> {t("refresh_btn", "Refresh")}
            </button>
            {selectedGigOrderDetails.payment_status === "Paid" && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="text-[10px] font-extrabold text-primary bg-primary/[0.04] border border-primary/20 hover:bg-primary/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap animate-fadeIn"
              >
                <i className="fa-solid fa-file-invoice-dollar"></i> {t("view_invoice_btn", "View Invoice")}
              </button>
            )}
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
          <h3 className="text-sm font-extrabold text-slate-850 border-b border-slate-100 pb-2">{t("order_specifications", "Order Specifications")}</h3>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 border-b border-slate-100/80 pb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t("order_id_label", "Order ID:")} #{selectedGigOrderDetails.application_id}</span>
              <p className="text-xs text-slate-500 font-bold">
                {t("freelancer_label", "Freelancer:")}{" "}
                <button
                  onClick={() => setSelectedFreelancerProfile({
                    user_id: selectedGigOrderDetails.freelancer_id,
                    name: selectedGigOrderDetails.freelancer_name || selectedGigOrderDetails.freelancer_email || `Freelancer #${selectedGigOrderDetails.freelancer_id || ''}`,
                    role: "Gig Service Provider",
                    email: selectedGigOrderDetails.freelancer_email || "",
                    skills: [], hourlyRate: 50, rating: 4.9, completedJobs: 15,
                    bio: "Hired service provider partner.",
                  })}
                  className="text-primary font-black hover:underline cursor-pointer"
                >
                  {selectedGigOrderDetails.freelancer_name || selectedGigOrderDetails.freelancer_email || (selectedGigOrderDetails.freelancer_id ? `Freelancer #${selectedGigOrderDetails.freelancer_id}` : "Assigned Freelancer")}
                </button>
                {selectedGigOrderDetails.freelancer_email && selectedGigOrderDetails.freelancer_name && (
                  <span className="text-[11px] text-slate-450 font-normal"> ({selectedGigOrderDetails.freelancer_email})</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("price_label", "Price:")}</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 bg-white sm:bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  {selectedGigOrderDetails.currency_symbol || "$"}{parseFloat(selectedGigOrderDetails.price).toLocaleString()}
                  {(() => {
                    const isNegotiated = checkIsNegotiated(selectedGigOrderDetails);
                    const origPrice = getOriginalPackagePrice(selectedGigOrderDetails);
                    if (isNegotiated && origPrice) {
                      return (
                        <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded uppercase tracking-wider">
                          {t("negotiated_from_label", "Negotiated from")} {selectedGigOrderDetails.currency_symbol || "$"}{origPrice.toLocaleString()}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </span>
              </div>
              {(() => {
                const badge = getOrderStatusPill(selectedGigOrderDetails, t);
                return (
                  <span className={`text-[9.5px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider whitespace-nowrap ${badge.style}`}>
                    {badge.text}
                  </span>
                );
              })()}
            </div>
          </div>

          {renderOrderBreakdown(selectedGigOrderDetails, t)}
        </div>



        {selectedGigOrderDetails.status === "Accepted" && selectedGigOrderDetails.payment_status === "Paid" && selectedGigOrderDetails.contract_status === "Under Review" && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-black text-slate-800">{t("is_service_completed_q", "Is the service work completed?")}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                {t("is_service_completed_desc", "If the freelancer has delivered all milestone files and finished the project scope, you can mark the order as Completed.")}
              </p>
            </div>
            <button
              onClick={async () => {
                if (!confirm("Are you sure you want to mark this order as completed?")) return;
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`${API_URL}/freelancer/gigs/applications/${selectedGigOrderDetails.application_id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: "Completed" })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    handleUpdateGigApplication(data.application);
                    setSelectedGigOrderDetails(data.application);
                    triggerToast("success", "Order marked as completed!");
                    await fetchClientApplications();
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer border-0"
            >
              {t("mark_as_completed_btn", "Mark as Completed")}
            </button>
          </div>
        )}

        {renderContractActions(selectedGigOrderDetails)}

        {/* Payment Panel */}
        {renderPaymentPanel(selectedGigOrderDetails)}

        {/* Milestone Tracker */}
        {selectedGigOrderDetails.status !== "Rejected" && selectedGigOrderDetails.status !== "Cancelled" && selectedGigOrderDetails.contract_status !== "Cancelled" && (
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
            <h3 className="text-sm font-extrabold text-slate-850 border-b border-slate-100 pb-2">{t("milestones_tracker_header", "Milestones Tracker")}</h3>
            <GigMilestoneTracker
              application={selectedGigOrderDetails}
              onUpdateApplication={(updatedApp) => {
                handleUpdateGigApplication(updatedApp);
                setSelectedGigOrderDetails(updatedApp);
              }}
              triggerToast={triggerToast}
              setSelectedFreelancerProfile={setSelectedFreelancerProfile}
            />
          </div>
        )}
        {renderDisputeModal()}
        {showInvoiceModal && selectedGigOrderDetails && typeof window !== "undefined" && createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/40 flex items-center justify-center p-4 print:p-0 print:bg-white animate-fadeIn text-slate-800">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] border border-slate-200/80 shadow-2xl flex flex-col relative overflow-hidden print:shadow-none print:border-none print:max-w-none print:max-h-none">
              {/* Header Bar */}
              <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0 print:hidden bg-slate-50/50">
                <span className="text-xs font-bold text-slate-855">Gig Order Receipt</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg px-3 py-1.5 cursor-pointer transition-all flex items-center gap-1"
                  >
                    <i className="fa-solid fa-print"></i> Print
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg p-1.5 cursor-pointer transition-all border-0 flex items-center justify-center"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-grow overflow-y-auto scrollbar-thin p-6 print:p-0 text-left">
                <div id="printable-invoice-area" className="flex flex-col w-full text-slate-805">
                  <div className="h-1.5 bg-gradient-to-r from-primary to-cyan-500 shrink-0 print:hidden -mx-6 -mt-6 mb-6" />

                  <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 tracking-wide">Buy2Lancer Invoice</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Payment Receipt</p>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                        Paid & Released
                      </span>
                      <p className="text-[10px] font-semibold text-slate-550 mt-2">
                        ID: <span className="text-slate-800 font-bold">INV-GIG-{selectedGigOrderDetails.application_id}-{new Date(selectedGigOrderDetails.created_at).getTime().toString().slice(-4)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Billed To / From */}
                  <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-100 text-xs">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Billed To (Client Partner)</span>
                      <p className="font-extrabold text-slate-705">{selectedGigOrderDetails.client_name || "Client Partner"}</p>
                      <p className="text-slate-505 mt-0.5 font-medium">{selectedGigOrderDetails.client_email}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Service Provider (Freelancer)</span>
                      <p className="font-extrabold text-slate-705">{selectedGigOrderDetails.freelancer_name || "Freelancer Partner"}</p>
                      <p className="text-slate-550 mt-0.5 font-medium">{selectedGigOrderDetails.freelancer_email}</p>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="py-5 border-b border-slate-100 text-xs">
                    <span className="text-[9px] font-black text-slate-405 uppercase tracking-wider block mb-2">Service Ordered</span>
                    <p className="font-extrabold text-slate-800 text-sm">{selectedGigOrderDetails.gig_title}</p>
                    <p className="text-slate-505 mt-1 font-semibold">Order ID: #{selectedGigOrderDetails.application_id} · Ordered on {new Date(selectedGigOrderDetails.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Itemized Table */}
                  <div className="py-5 text-xs">
                    <span className="text-[9px] font-black text-slate-405 uppercase tracking-wider block mb-3">Itemized Receipt Details</span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-405 uppercase tracking-wider">
                            <th className="p-3 text-left w-3/5">Description</th>
                            <th className="p-3 text-right w-2/5">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-750">
                          {(() => {
                            const { baseCost, addonsList, customFeaturesList, total, planName } = getInvoiceBreakdown(selectedGigOrderDetails);
                            return (
                              <>
                                <tr>
                                  <td className="p-3 text-left font-extrabold">
                                    {planName ? `${planName.toUpperCase()} Plan` : "Base Service Scope"}
                                  </td>
                                  <td className="p-3 text-right">
                                    {selectedGigOrderDetails.currency_symbol || "$"}{baseCost.toLocaleString()}
                                  </td>
                                </tr>
                                {addonsList.map((a, i) => (
                                  <tr key={`addon-row-${i}`} className="text-emerald-805">
                                    <td className="p-3 text-left font-semibold">
                                      <span className="text-[9px] font-black text-emerald-605 bg-emerald-50 border border-emerald-200/50 px-1 py-0.5 rounded uppercase mr-1.5">Extra Add-on</span>
                                      {a.title}
                                    </td>
                                    <td className="p-3 text-right">
                                      +{selectedGigOrderDetails.currency_symbol || "$"}{a.price.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                {customFeaturesList.map((f, i) => (
                                  <tr key={`feat-row-${i}`} className="text-sky-850">
                                    <td className="p-3 text-left font-semibold">
                                      <span className="text-[9px] font-black text-sky-600 bg-sky-50 border border-sky-200/50 px-1 py-0.5 rounded uppercase mr-1.5">Custom Feature</span>
                                      {f.title}
                                    </td>
                                    <td className="p-3 text-right">
                                      +{selectedGigOrderDetails.currency_symbol || "$"}{f.price.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                                  <td className="p-3.5 text-left text-sm">Total Paid</td>
                                  <td className="p-3.5 text-right text-sm">
                                    {selectedGigOrderDetails.currency_symbol || "$"}{total.toLocaleString()}
                                  </td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer Notes */}
                  <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 mt-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                    <p>This is a payment confirmation receipt. Payments are processed securely via Stripe, PayPal, or User Wallet escrow system. Please email support@buy2lancer.com for any billing inquiries.</p>
                  </div>
                </div>
              </div>
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
            <span>{t("my_service_orders_title", "My Service Orders")}</span>
          </h2>
          <p className="text-slate-404 text-xs mt-1 font-semibold">{t("my_service_orders_subtitle", "Track status, pay accepted orders, and view milestones.")}</p>
        </div>
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search_orders_placeholder", "Search by title, partner...")}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 focus:border-primary/50 rounded-xl outline-none transition-all shadow-2xs"
          />
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-[11px]"></i>
          </div>
        </div>
      </div>

      {/* List */}
      {loadingClientApplications ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-404 text-xs font-semibold">Loading orders...</p>
        </div>
      ) : clientApplications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-xl p-8 shadow-inner">
          <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">No orders placed yet</h3>
          <p className="text-slate-404 text-xs max-w-sm font-semibold">Explore gigs and place your first service order.</p>
          <button
            onClick={() => setActiveTab("explore_gigs")}
            className="mt-4 bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Explore Gigs
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(() => {
            const list = clientApplications.filter(app => {
              const term = searchTerm.toLowerCase().trim();
              if (!term) return true;
              return (
                (app.gig_title && app.gig_title.toLowerCase().includes(term)) ||
                (app.freelancer_name && app.freelancer_name.toLowerCase().includes(term)) ||
                (app.application_id && app.application_id.toString().includes(term))
              );
            });
            if (list.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-dashed border-slate-200 rounded-xl p-8 shadow-sm">
                  <FiBriefcase className="w-8 h-8 text-slate-300 mb-2.5" />
                  <h4 className="text-xs font-black text-slate-800">No matching orders found</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Try updating your search query or keywords.</p>
                </div>
              );
            }
            return list.map((app) => {
              const { hasMilestones, upfront, total } = getUpfront(app);
              const isPaid = Boolean(
                (app.contract_id && app.contract_status !== "Cancelled") || 
                app.payment_status === "Paid" || 
                app.contract_status === "In Progress" || 
                app.contract_status === "Under Review" || 
                app.contract_status === "Completed"
              );
              const needsPayment = app.status === "Accepted" && !isPaid;

              return (
                <div
                  key={app.application_id}
                  className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all animate-fadeIn ${
                    needsPayment ? "border-primary/30 ring-1 ring-primary/10" : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    needsPayment ? "bg-gradient-to-r from-primary to-emerald-400" : "bg-gradient-to-r from-primary to-cyan-500 opacity-60"
                  }`} />

                  {/* Top meta */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100/80 pb-4">
                    <div className="cursor-pointer space-y-0.5 min-w-0" onClick={() => setSelectedGigOrderDetails(app)}>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t("order_hash_indicator", "Order #")}{app.application_id}</span>
                      <h3 className="text-sm sm:text-base font-black text-slate-800 hover:text-primary transition-colors truncate">{t(app.gig_title, app.gig_title)}</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1 truncate">{app.freelancer_name} · <span className="font-normal text-slate-450">{app.freelancer_email}</span></p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("total_label", "Total:")}</span>
                          <span className="text-xs sm:text-sm font-black text-slate-800 bg-white sm:bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            {app.currency_symbol || "$"}{total.toLocaleString()}
                            {(() => {
                              const isNegotiated = checkIsNegotiated(app);
                              const origPrice = getOriginalPackagePrice(app);
                              if (isNegotiated && origPrice) {
                                return (
                                  <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded uppercase tracking-wider">
                                    {t("negotiated_from_label", "Negotiated from")} {app.currency_symbol || "$"}{origPrice.toLocaleString()}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </span>
                        </div>
                        {needsPayment && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">{t("due_label", "Due:")}</span>
                            <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                              ${upfront.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      {(() => {
                        const badge = getOrderStatusPill(app, t);
                        return (
                          <span className={`text-[9.5px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider whitespace-nowrap shrink-0 ${badge.style}`}>
                            {badge.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Requirements & Price Breakdown */}
                  {renderOrderBreakdown(app, t)}

                  {/* Footer action */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pt-3 border-t border-slate-100 mt-2">
                    <span 
                      onClick={() => setSelectedGigOrderDetails(app)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      {t("click_card_details_hint", "Click card to view details & track milestones →")}
                    </span>
                    <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-between sm:justify-end">
                      {needsPayment ? (
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                          <FiCreditCard className="w-3 h-3" />
                          {hasMilestones ? t("upfront_escrow_label", "100% upfront (escrow)") : t("full_payment_required_label", "Full payment required to start")}
                        </span>
                      ) : isPaid ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1">
                          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          {t("paid_escrow_protected_label", "Paid & Escrow Protected")}
                        </span>
                      ) : (
                        <span />
                      )}
                      <button
                        onClick={() => { setPayError(""); setPaySuccess(false); setSelectedGigOrderDetails(app); }}
                        className={`text-[10px] font-bold text-white flex items-center gap-1.5 cursor-pointer py-2 px-4 rounded-lg transition-all shadow-sm ${
                          needsPayment
                            ? "bg-primary hover:bg-primary-hover shadow-primary/20"
                            : "bg-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        {needsPayment ? t("pay_now_view_details_btn", "💳 Pay Now & View Details →") : t("view_details_arrow_btn", "View Details →")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Order Details Modal Popup */}
      {selectedGigOrderDetails && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedGigOrderDetails(null); }}
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2.5px)" }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-700 to-cyan-600 px-6 py-5 flex justify-between items-start rounded-t-2xl shrink-0">
              <div>
                <p className="text-[9px] font-black text-teal-200 uppercase tracking-widest">Order Details</p>
                <h3 className="text-base font-extrabold text-white mt-1 leading-snug">{t(selectedGigOrderDetails.gig_title, selectedGigOrderDetails.gig_title)}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    selectedGigOrderDetails.status === "Completed" ? "bg-emerald-50/20 border-emerald-300/40 text-emerald-100"
                    : selectedGigOrderDetails.status === "Rejected" ? "bg-rose-50/20 border-rose-300/40 text-rose-100"
                    : selectedGigOrderDetails.status === "Accepted" ? "bg-emerald-50/20 border-emerald-300/40 text-emerald-100"
                    : "bg-white/10 border-white/20 text-white/80"
                  }`}>
                    {selectedGigOrderDetails.status}
                  </span>
                  <span className="text-white/60 text-[10px] font-semibold">· Order #{selectedGigOrderDetails.application_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenChat(selectedGigOrderDetails.freelancer_id)}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-extrabold text-[10px] py-2 px-3 rounded-xl border border-white/25 cursor-pointer transition-all"
                >
                  <FiMessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <button
                  onClick={() => fetchClientApplications().then(() => {
                    const refreshed = clientApplications.find(
                      (a) => a.application_id === selectedGigOrderDetails.application_id
                    );
                    if (refreshed) setSelectedGigOrderDetails(refreshed);
                  })}
                  className="p-2 bg-white/15 hover:bg-white/25 rounded-xl border border-white/25 text-white cursor-pointer transition-all"
                  title="Refresh"
                >
                  <FiRefreshCw className="w-3 h-3" />
                </button>
                <button onClick={() => setSelectedGigOrderDetails(null)} className="text-white/70 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-white/10 transition-all border-0 bg-transparent">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Specifications Row */}
            <div className="grid grid-cols-3 border-b border-slate-100">
              <div className="p-4 text-center border-r border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Value</p>
                <p className="text-xs font-black text-slate-800 mt-0.5 truncate">
                  {selectedGigOrderDetails.currency_symbol || "$"}{parseFloat(selectedGigOrderDetails.price).toLocaleString()}
                </p>
              </div>
              <div className="p-4 text-center border-r border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Freelancer</p>
                <button
                  onClick={() => setSelectedFreelancerProfile({
                    user_id: selectedGigOrderDetails.freelancer_id,
                    name: selectedGigOrderDetails.freelancer_name,
                    role: "Elite Developer",
                    email: selectedGigOrderDetails.freelancer_email,
                    skills: [], hourlyRate: 50, rating: 4.9, completedJobs: 15,
                    bio: "Hired service provider partner.",
                  })}
                  className="text-xs font-extrabold text-primary hover:underline mt-0.5 truncate max-w-full inline-block"
                >
                  {selectedGigOrderDetails.freelancer_name}
                </button>
              </div>
              <div className="p-4 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Created</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {new Date(selectedGigOrderDetails.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 flex flex-col gap-6">
              {/* Requirements */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block mb-1">Your Requirements</span>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap font-medium">{selectedGigOrderDetails.requirements}</p>
              </div>

              {/* Complete Order Button Action */}
              {selectedGigOrderDetails.status === "Accepted" && selectedGigOrderDetails.payment_status === "Paid" && selectedGigOrderDetails.contract_status === "Under Review" && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-850">Is the service work completed?</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                      If the freelancer has delivered everything, mark this order as Completed.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to mark this order as completed?")) return;
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${API_URL}/freelancer/gigs/applications/${selectedGigOrderDetails.application_id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({ status: "Completed" })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          handleUpdateGigApplication(data.application);
                          setSelectedGigOrderDetails(data.application);
                          triggerToast("success", "Order marked as completed!");
                          await fetchClientApplications();
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer border-0"
                  >
                    Mark as Completed
                  </button>
                </div>
              )}

              {renderContractActions(selectedGigOrderDetails)}

              {/* Payment Info / Action panel */}
              {renderPaymentPanel(selectedGigOrderDetails)}

              {/* Milestones / Checklist Tracker */}
              {selectedGigOrderDetails.status !== "Rejected" && selectedGigOrderDetails.status !== "Cancelled" && selectedGigOrderDetails.contract_status !== "Cancelled" && (
                <div className="border-t border-slate-100 pt-5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Milestone Tracker & Payments</span>
                  <GigMilestoneTracker
                    application={selectedGigOrderDetails}
                    onUpdateApplication={(updatedApp) => {
                      handleUpdateGigApplication(updatedApp);
                      setSelectedGigOrderDetails(updatedApp);
                    }}
                    triggerToast={triggerToast}
                    setSelectedFreelancerProfile={setSelectedFreelancerProfile}
                  />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {renderDisputeModal()}

      {/* Payment Completed Congratulations Modal */}
      {congratsModalData?.show && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl border border-emerald-500/30 text-center relative overflow-hidden flex flex-col items-center gap-4 animate-scaleUp text-slate-800">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-inner border border-emerald-300 animate-bounce mt-2">
              🎉
            </div>

            <div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                Payment Completed
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-2.5">
                Congratulations! 🚀
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                Your escrow payment of <strong className="text-slate-900 font-black">${congratsModalData.amount.toLocaleString()}</strong> for <span className="font-bold text-slate-800">"{congratsModalData.title}"</span> has been confirmed. The freelancer has been notified to begin work!
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 w-full text-left flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-black">Status</span>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <FiCheckCircle className="w-4 h-4 text-emerald-600" /> Contract Active & In Escrow
              </span>
            </div>

            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => {
                  const found = clientApplications.find(a => a.application_id.toString() === congratsModalData.orderId.toString());
                  if (found) setSelectedGigOrderDetails(found);
                  setCongratsModalData(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer border-0"
              >
                View Order Tracker →
              </button>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-shrinkWidth" />
            </div>
          </div>
        </div>,
        document.body
      )}
      {showInvoiceModal && selectedGigOrderDetails && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 flex items-center justify-center p-4 print:p-0 print:bg-white animate-fadeIn">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] border border-slate-200/80 shadow-2xl flex flex-col relative overflow-hidden print:shadow-none print:border-none print:max-w-none print:max-h-none">
            {/* Header Bar */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0 print:hidden bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800">Gig Order Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="text-[10px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg px-3 py-1.5 cursor-pointer transition-all flex items-center gap-1"
                >
                  <i className="fa-solid fa-print"></i> Print
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg p-1.5 cursor-pointer transition-all border-0 flex items-center justify-center"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-y-auto scrollbar-thin p-6 print:p-0 text-left">
              <div id="printable-invoice-area" className="flex flex-col w-full text-slate-800">
                <div className="h-1.5 bg-gradient-to-r from-primary to-cyan-500 shrink-0 print:hidden -mx-6 -mt-6 mb-6" />

                <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-wide">Buy2Lancer Invoice</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Payment Receipt</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                      Paid & Released
                    </span>
                    <p className="text-[10px] font-semibold text-slate-500 mt-2">
                      ID: <span className="text-slate-800 font-bold">INV-GIG-{selectedGigOrderDetails.application_id}-{new Date(selectedGigOrderDetails.created_at).getTime().toString().slice(-4)}</span>
                    </p>
                  </div>
                </div>

                {/* Billed To / From */}
                <div className="grid grid-cols-2 gap-6 py-5 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Billed To (Client Partner)</span>
                    <p className="font-extrabold text-slate-700">{selectedGigOrderDetails.client_name || "Client Partner"}</p>
                    <p className="text-slate-500 mt-0.5 font-medium">{selectedGigOrderDetails.client_email}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Service Provider (Freelancer)</span>
                    <p className="font-extrabold text-slate-700">{selectedGigOrderDetails.freelancer_name || "Freelancer Partner"}</p>
                    <p className="text-slate-500 mt-0.5 font-medium">{selectedGigOrderDetails.freelancer_email}</p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="py-5 border-b border-slate-100 text-xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2">Service Ordered</span>
                  <p className="font-extrabold text-slate-800 text-sm">{selectedGigOrderDetails.gig_title}</p>
                  <p className="text-slate-500 mt-1 font-semibold">Order ID: #{selectedGigOrderDetails.application_id} · Ordered on {new Date(selectedGigOrderDetails.created_at).toLocaleDateString()}</p>
                </div>

                {/* Itemized Table */}
                <div className="py-5 text-xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-3">Itemized Receipt Details</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-405 uppercase tracking-wider">
                          <th className="p-3 text-left w-3/5">Description</th>
                          <th className="p-3 text-right w-2/5">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-750">
                        {(() => {
                          const { baseCost, addonsList, customFeaturesList, total, planName } = getInvoiceBreakdown(selectedGigOrderDetails);
                          return (
                            <>
                              <tr>
                                <td className="p-3 text-left font-extrabold">
                                  {planName ? `${planName.toUpperCase()} Plan` : "Base Service Scope"}
                                </td>
                                <td className="p-3 text-right">
                                  {selectedGigOrderDetails.currency_symbol || "$"}{baseCost.toLocaleString()}
                                </td>
                              </tr>
                              {addonsList.map((a, i) => (
                                <tr key={`addon-row-${i}`} className="text-emerald-800">
                                  <td className="p-3 text-left font-semibold">
                                    <span className="text-[9px] font-black text-emerald-605 bg-emerald-50 border border-emerald-200/50 px-1 py-0.5 rounded uppercase mr-1.5">Extra Add-on</span>
                                    {a.title}
                                  </td>
                                  <td className="p-3 text-right">
                                    +{selectedGigOrderDetails.currency_symbol || "$"}{a.price.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                              {customFeaturesList.map((f, i) => (
                                <tr key={`feat-row-${i}`} className="text-sky-850">
                                  <td className="p-3 text-left font-semibold">
                                    <span className="text-[9px] font-black text-sky-600 bg-sky-50 border border-sky-200/50 px-1 py-0.5 rounded uppercase mr-1.5">Custom Feature</span>
                                    {f.title}
                                  </td>
                                  <td className="p-3 text-right">
                                    +{selectedGigOrderDetails.currency_symbol || "$"}{f.price.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                                <td className="p-3.5 text-left text-sm">Total Paid</td>
                                <td className="p-3.5 text-right text-sm">
                                  {selectedGigOrderDetails.currency_symbol || "$"}{total.toLocaleString()}
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 mt-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                  <p>This is a payment confirmation receipt. Payments are processed securely via Stripe, PayPal, or User Wallet escrow system. Please email support@buy2lancer.com for any billing inquiries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ClientOrdersTab;
