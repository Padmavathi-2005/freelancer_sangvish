import { API_URL, API_BASE_URL } from "@/config/api";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiDollarSign, FiCheckCircle, FiCreditCard, FiUnlock, FiMessageSquare, FiBriefcase, FiFileText, FiCircle, FiClock } from "react-icons/fi";
import { FaStripe, FaPaypal, FaWallet, FaCreditCard } from "react-icons/fa";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import CustomSelect from "@/components/CustomSelect";

const getAvatarSrc = (imagePath: string | null) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/")) {
    if (imagePath.startsWith("/public")) return imagePath;
    return `https://freelancer.sangvish.com${imagePath}`;
  }
  return `${API_BASE_URL}/${imagePath}`;
};

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
  const { approveContractPayment, handleStartConversation, setActiveTab, userRole, startWorkContract, requestMilestoneFunding } = useDashboard();
  const [projectProposals, setProjectProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [expandedProposalId, setExpandedProposalId] = useState<number | null>(null);
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState<number | null>(null);
  const [milestoneFiles, setMilestoneFiles] = useState<{name: string, url: string}[]>([]);
  const [isMilestoneUploading, setIsMilestoneUploading] = useState(false);
  const [milestoneFeedbackFiles, setMilestoneFeedbackFiles] = useState<{name: string, url: string}[]>([]);
  const [isFeedbackUploading, setIsFeedbackUploading] = useState(false);
  const [customRevisionFee, setCustomRevisionFee] = useState<string>("");
  const [expandedRevisionHistoryId, setExpandedRevisionHistoryId] = useState<number | null>(null);
  const [activeRevisionAccordionId, setActiveRevisionAccordionId] = useState<string | null>(null);

  const [payingProposal, setPayingProposal] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState<"stripe" | "paypal" | "wallet">("stripe");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceItem, setSelectedInvoiceItem] = useState<any | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeRevisionId, setActiveRevisionId] = useState<number | null>(null);
  const [milestoneFeedback, setMilestoneFeedback] = useState("");
  const [confirmFundingMilestoneId, setConfirmFundingMilestoneId] = useState<number | null>(null);
  const [milestoneActionLoading, setMilestoneActionLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [userReviewed, setUserReviewed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [activePaymentModal, setActivePaymentModal] = useState<{
    type: "milestone" | "revision";
    id: number;
    amount: number;
    title: string;
  } | null>(null);
  const [modalPayMethod, setModalPayMethod] = useState<"stripe" | "paypal" | "wallet">("stripe");
  const [modalPayLoading, setModalPayLoading] = useState(false);
  const [modalPayError, setModalPayError] = useState("");

  // Hourly / Timecard States
  const [timecards, setTimecards] = useState<any[]>([]);
  const [loadingTimecards, setLoadingTimecards] = useState(false);
  const [activeTimecardTab, setActiveTimecardTab] = useState<"activities" | "invoices">("activities");
  const [showTimecardModal, setShowTimecardModal] = useState(false);
  const [newTimecardDate, setNewTimecardDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [newTimecardHours, setNewTimecardHours] = useState("");
  const [newTimecardMinutes, setNewTimecardMinutes] = useState("");
  const [newTimecardDescription, setNewTimecardDescription] = useState("");
  const [isSubmittingTimecard, setIsSubmittingTimecard] = useState(false);
  const [timecardActionLoadingId, setTimecardActionLoadingId] = useState<number | null>(null);
  const [selectedPendingTimecards, setSelectedPendingTimecards] = useState<number[]>([]);
  const [payingTimecard, setPayingTimecard] = useState<any | null>(null);
  const [payTimecardLoading, setPayTimecardLoading] = useState(false);
  const [payTimecardError, setPayTimecardError] = useState("");
  const [payTimecardMethod, setPayTimecardMethod] = useState<"stripe" | "paypal" | "wallet">("stripe");
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [isApprovingCompletion, setIsApprovingCompletion] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [siteName, setSiteName] = useState(() => localStorage.getItem("cached_site_name") || "Buy2Lancer");
  const [siteLogo, setSiteLogo] = useState(() => localStorage.getItem("cached_site_logo") || "");

  const [congratsModalData, setCongratsModalData] = useState<{
    show: boolean;
    amount: number;
    title: string;
    projectId?: string | number;
  } | null>(null);

  useEffect(() => {
    if (congratsModalData?.show) {
      const timer = setTimeout(() => {
        setCongratsModalData(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [congratsModalData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment_success") === "true" || params.get("session_id")) {
        setCongratsModalData({
          show: true,
          amount: job?.budget ? parseFloat(job.budget) : 0,
          title: job?.title || "Project Contract",
          projectId: job?.job_id
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [job]);

  const [trackerTab, setTrackerTab] = useState<"milestones" | "proposals">("milestones");
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  const jobContracts = useMemo(() => {
    if (!Array.isArray(contracts)) return [];
    if (job?.job_id) {
      return contracts.filter((c: any) => c && (Number(c.job_id) === Number(job.job_id)));
    }
    if (job?.contract_id) {
      return contracts.filter((c: any) => c && (Number(c.contract_id) === Number(job.contract_id)));
    }
    return [];
  }, [contracts, job]);

  const acceptedProposal = useMemo(() => {
    if (!Array.isArray(projectProposals)) return null;
    return projectProposals.find((p: any) => p && (p.status === "accepted" || p.status === "Accepted"));
  }, [projectProposals]);

  const activeContract = useMemo(() => {
    if (selectedContractId && jobContracts.length > 0) {
      const found = jobContracts.find((c: any) => c.contract_id === selectedContractId);
      if (found) return found;
    }
    if (jobContracts.length > 0) return jobContracts[0];
    if (Array.isArray(contracts)) {
      if (job?.contract_id) {
        return contracts.find((c: any) => c && Number(c.contract_id) === Number(job.contract_id)) || null;
      }
      return contracts.find((c: any) => c && Number(c.job_id) === Number(job?.job_id)) || null;
    }
    return null;
  }, [selectedContractId, jobContracts, contracts, job]);

  const partnerName = useMemo(() => {
    if (userRole === "client") {
      return activeContract?.freelancer_name || "Freelancer";
    } else {
      return activeContract?.client_name || job?.client_name || job?.posted_by_name || "Client";
    }
  }, [userRole, activeContract, job]);

  const partnerEmail = useMemo(() => {
    if (userRole === "client") {
      return activeContract?.freelancer_email || "";
    } else {
      return activeContract?.client_email || job?.client_email || "";
    }
  }, [userRole, activeContract, job]);

  const partnerId = useMemo(() => {
    if (userRole === "client") {
      return activeContract?.freelancer_id || activeContract?.freelancer_user_id || null;
    } else {
      return activeContract?.client_id || activeContract?.client_user_id || job?.user_id || job?.posted_by_id || null;
    }
  }, [userRole, activeContract, job]);

  const partnerImage = useMemo(() => {
    if (userRole === "client") {
      return getAvatarSrc(activeContract?.freelancer_image || null);
    } else {
      return getAvatarSrc(activeContract?.client_image || job?.client_image || null);
    }
  }, [userRole, activeContract, job]);

  const milestoneItems = useMemo(() => {
    if (!activeContract) return [];
    try {
      if (Array.isArray(activeContract.milestones)) return activeContract.milestones;
      if (typeof activeContract.milestones === "string") return JSON.parse(activeContract.milestones);
    } catch (e) {}
    return [];
  }, [activeContract]);


  const handleCancelContract = async () => {
    if (!activeContract) return;
    if (!confirm("Are you sure you want to cancel this contract? All unreleased funds will be refunded to your wallet.")) return;
    setMilestoneActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${activeContract.contract_id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Contract cancelled successfully.", "Funds have been refunded to your wallet.");
        fetchContracts();
        if (onUpdateJob) onUpdateJob({ ...job, status: "Cancelled" });
      } else {
        triggerToast("error", data.message || "Failed to cancel contract.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("error", "Failed to cancel contract.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  const handleFreelancerCancelContract = async () => {
    if (!activeContract) return;
    if (!confirm("Are you sure you want to cancel this contract and refund the client?")) return;
    setMilestoneActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${activeContract.contract_id}/freelancer-cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Contract cancelled.", "Unreleased funds refunded to client.");
        fetchContracts();
        if (onUpdateJob) onUpdateJob({ ...job, status: "Cancelled" });
      } else {
        triggerToast("error", data.message || "Failed to cancel contract.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("error", "Failed to cancel contract.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          let name = "";
          let logo = "";
          if (Array.isArray(data)) {
            data.forEach((s: any) => {
              if (s.setting_key === "site_name") name = s.setting_value;
              if (s.setting_key === "site_logo") logo = s.setting_value;
            });
          } else if (data && typeof data === "object") {
            name = data.site_name || "";
            logo = data.site_logo || "";
          }
          if (name) {
            setSiteName(name);
            localStorage.setItem("cached_site_name", name);
          }
          if (logo) {
            setSiteLogo(logo);
            localStorage.setItem("cached_site_logo", logo);
          }
        }
      } catch (e) {
        // fallback
      }
    };
    fetchSiteSettings();
  }, []);

  const logoUrl = siteLogo
    ? (siteLogo.startsWith("http") ? siteLogo : `${API_URL}${siteLogo.startsWith("/") ? "" : "/"}${siteLogo}`)
    : "";

  // Contract Chat States
  const [contractConvId, setContractConvId] = useState<number | null>(null);
  const [contractMessages, setContractMessages] = useState<any[]>([]);
  const [newContractMsg, setNewContractMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUserReview = async () => {
      if (activeContract && activeContract.status === "Completed") {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/proposals/contracts/${activeContract.contract_id}/review`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserReviewed(data.reviewed);
            if (data.reviewed && data.review) {
              setReviewRating(parseFloat(data.review.rating) || 5);
              setReviewComment(data.review.comment || "");
            }
          }
        } catch (e) {
          console.error("Error checking contract review status:", e);
        }
      }
    };
    checkUserReview();
  }, [activeContract]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract) return;

    setReviewLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/proposals/contracts/${activeContract.contract_id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Review submitted successfully!", "Thank you for sharing your feedback.");
        setUserReviewed(true);
        setShowReviewModal(false);
      } else {
        triggerToast("error", data.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "An error occurred while submitting review.");
    } finally {
      setReviewLoading(false);
    }
  };
  const [disputeReason, setDisputeReason] = useState("Work quality is poor");
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
          const targetKey = userRole === "client" ? "client_dispute_reasons" : "freelancer_dispute_reasons";
          let disputeSetting = data.find((s: any) => s.setting_key === targetKey);
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
  }, [userRole]);

  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);

  const fetchProposals = async () => {
    try {
      setLoadingProposals(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/proposals/job/${job.job_id}`, {
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

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setContracts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingContracts(false);
    }
  };

  const fetchTimecards = async (contractId: number) => {
    try {
      setLoadingTimecards(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${contractId}/timecards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTimecards(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch timecards:", e);
    } finally {
      setLoadingTimecards(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchContracts();
  }, [job.job_id, job.contract_id]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchProposals();
      fetchContracts();
    };
    window.addEventListener("refresh-milestones", handleRefresh);
    return () => {
      window.removeEventListener("refresh-milestones", handleRefresh);
    };
  }, [job.job_id, job.contract_id]);

  useEffect(() => {
    if (!Array.isArray(contracts)) return;
    const activeContract = contracts.find(c => {
      if (job?.contract_id) {
        return c && Number(c.contract_id) === Number(job.contract_id);
      }
      return c && Number(c.job_id) === Number(job?.job_id);
    });
    if (activeContract) {
      if (job.project_type === "Hourly") {
        fetchTimecards(activeContract.contract_id);
      }
    }
  }, [contracts, job.job_id, job.contract_id, job.project_type]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [contractMessages]);

  const handleProposalPayment = async () => {
    if (!payingProposal) return;
    setPayError("");
    setPayLoading(true);

    const token = localStorage.getItem("token");
    const bidAmount = parseFloat(payingProposal.bid_amount);

    try {
      if (payMethod === "stripe") {
        const res = await fetch(`${API_URL}/payments/proposal/stripe/create-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            proposal_id: payingProposal.proposal_id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        } else {
          setPayError(data.message || "Failed to initiate Stripe session.");
        }
      } else {
        // Direct Wallet or simulated PayPal payment
        const res = await fetch(`${API_URL}/payments/proposal/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            proposal_id: payingProposal.proposal_id,
            method: payMethod,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          const milestoneList = (() => {
            try {
              return typeof payingProposal.milestones === "string"
                ? JSON.parse(payingProposal.milestones)
                : (payingProposal.milestones || []);
            } catch (e) {
              return [];
            }
          })();
          const hasMilestones = milestoneList && milestoneList.length > 0;
          const upfrontAmount = hasMilestones ? parseFloat(milestoneList[0].amount) : bidAmount;

          triggerToast(
            "success",
            `Hired successfully! ${payMethod === "paypal" ? "PayPal" : "Wallet"} payment of $${upfrontAmount.toFixed(2)} confirmed.`,
            "Your contract is now active."
          );
          setCongratsModalData({
            show: true,
            amount: upfrontAmount,
            title: job?.title || "Project Contract",
            projectId: job?.job_id
          });
          setPayingProposal(null);
          fetchProposals();
          fetchContracts();
          if (onUpdateJob) {
            onUpdateJob({ ...job, status: "Closed" });
          }
        } else {
          setPayError(data.message || "Payment failed. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
      setPayError("Network error. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  const handleSubmitTimecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract) return;

    const hrs = parseInt(newTimecardHours) || 0;
    const mins = parseInt(newTimecardMinutes) || 0;
    if (hrs < 0 || mins < 0) {
      triggerToast("error", "Hours and minutes cannot be negative.");
      return;
    }
    if (hrs === 0 && mins === 0) {
      triggerToast("error", "Hours or minutes must be greater than zero.");
      return;
    }

    setIsSubmittingTimecard(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${activeContract.contract_id}/timecards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          work_date: newTimecardDate,
          hours: hrs,
          minutes: mins,
          description: newTimecardDescription
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Timecard submitted successfully!", "Awaiting client's review and payment.");
        setTimecards(prev => [data, ...prev]);
        setShowTimecardModal(false);
        setNewTimecardHours("");
        setNewTimecardMinutes("");
        setNewTimecardDescription("");
      } else {
        triggerToast("error", data.message || "Failed to submit timecard.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "An error occurred while submitting timecard.");
    } finally {
      setIsSubmittingTimecard(false);
    }
  };

  const handleApproveTimecard = async (timecardId: number, amount: number) => {
    if (!activeContract) return;

    setTimecardActionLoadingId(timecardId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${activeContract.contract_id}/timecards/${timecardId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Timecard approved and paid!", `$${amount.toFixed(2)} has been transferred from escrow/wallet.`);
        fetchTimecards(activeContract.contract_id);
        fetchContracts(); // refresh contract budget
      } else {
        triggerToast("error", data.message || "Failed to approve timecard.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "An error occurred while approving timecard.");
    } finally {
      setTimecardActionLoadingId(null);
    }
  };

  const handleRequestPayment = async () => {
    if (!activeContract || selectedPendingTimecards.length === 0) return;

    setTimecardActionLoadingId(-1);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${activeContract.contract_id}/timecards/request-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          timecard_ids: selectedPendingTimecards
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Payment requested successfully!", "The client has been notified of your request.");
        setSelectedPendingTimecards([]);
        fetchTimecards(activeContract.contract_id);
      } else {
        triggerToast("error", data.message || "Failed to request payment.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "An error occurred while requesting payment.");
    } finally {
      setTimecardActionLoadingId(null);
    }
  };

  const handleDeclineTimecard = async (timecardId: number) => {
    if (!activeContract) return;

    setTimecardActionLoadingId(timecardId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${activeContract.contract_id}/timecards/${timecardId}/decline`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Timecard payment request declined.", "The freelancer has been notified.");
        fetchTimecards(activeContract.contract_id);
      } else {
        triggerToast("error", data.message || "Failed to decline timecard.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "An error occurred while declining timecard.");
    } finally {
      setTimecardActionLoadingId(null);
    }
  };

  const handleTimecardPayment = async () => {
    if (!payingTimecard) return;
    setPayTimecardError("");
    setPayTimecardLoading(true);

    const token = localStorage.getItem("token");
    if (!activeContract) return;

    try {
      if (payTimecardMethod === "stripe") {
        const res = await fetch(`${API_URL}/payments/timecard/stripe/create-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            contract_id: activeContract.contract_id,
            timecard_id: payingTimecard.timecard_id,
            redirect_path: window.location.pathname
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        } else {
          setPayTimecardError(data.message || "Failed to initiate Stripe session.");
        }
      } else {
        const res = await fetch(`${API_URL}/payments/timecard/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            contract_id: activeContract.contract_id,
            timecard_id: payingTimecard.timecard_id,
            method: payTimecardMethod,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast(
            "success",
            `Approved & Paid! ${payTimecardMethod === "paypal" ? "PayPal" : "Wallet"} payment of $${parseFloat(payingTimecard.amount).toFixed(2)} confirmed.`,
            "The freelancer has been paid."
          );
          setPayingTimecard(null);
          fetchTimecards(activeContract.contract_id);
          fetchContracts(); // refresh contract budget
        } else {
          setPayTimecardError(data.message || "Payment failed. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
      setPayTimecardError("Network error. Please try again.");
    } finally {
      setPayTimecardLoading(false);
    }
  };

  const fetchContractMessages = async (convId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/messages/conversation/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setContractMessages(await res.json());
      }
    } catch (e) {
      console.error("Error loading chat messages:", e);
    }
  };

  const initContractChat = async () => {
    if (!activeContract) return;
    const recId = userRole === "freelancer" ? activeContract.client_id : activeContract.freelancer_id;
    try {
      setLoadingMessages(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/messages/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: recId })
      });
      if (res.ok) {
        const data = await res.json();
        setContractConvId(data.conversationId);
        fetchContractMessages(data.conversationId);
      }
    } catch (e) {
      console.error("Error initializing contract chat:", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendContractMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractMsg.trim() || !contractConvId) return;

    setSendingMsg(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: contractConvId,
          content: newContractMsg.trim()
        })
      });
      if (res.ok) {
        const sent = await res.json();
        setContractMessages(prev => [...prev, sent]);
        setNewContractMsg("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Keep selected contract and tab in sync
  useEffect(() => {
    if (jobContracts.length > 0 && !selectedContractId) {
      const preferred = jobContracts.find((c: any) => Number(c.contract_id) === Number(job?.contract_id));
      setSelectedContractId(preferred ? preferred.contract_id : jobContracts[0].contract_id);
    }
  }, [contracts, job]);

  useEffect(() => {
    if (jobContracts.length === 0 && !acceptedProposal) {
      setTrackerTab("proposals");
    } else {
      setTrackerTab("milestones");
    }
  }, [contracts, projectProposals]);

  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidatePage, setCandidatePage] = useState(1);
  const candidatesPerPage = 5;

  const filteredCandidates = useMemo(() => {
    return projectProposals.filter((p) => {
      if (candidateSearch.trim()) {
        const query = candidateSearch.toLowerCase();
        const matchName = p.freelancer_name?.toLowerCase().includes(query);
        const matchTitle = p.freelancer_title?.toLowerCase().includes(query);
        const matchEmail = p.freelancer_email?.toLowerCase().includes(query);
        const matchLetter = p.cover_letter?.toLowerCase().includes(query);
        return matchName || matchTitle || matchEmail || matchLetter;
      }
      return true;
    });
  }, [projectProposals, candidateSearch]);

  const paginatedCandidates = useMemo(() => {
    const startIndex = (candidatePage - 1) * candidatesPerPage;
    return filteredCandidates.slice(startIndex, startIndex + candidatesPerPage);
  }, [filteredCandidates, candidatePage]);

  const totalCandidatePages = Math.ceil(filteredCandidates.length / candidatesPerPage);

  useEffect(() => {
    setCandidatePage(1);
  }, [candidateSearch]);

  if (loadingProposals) {
    return (
      <div className="flex items-center justify-center py-6 gap-2">
        <div className="w-4 h-4 border-2 border-t-primary border-slate-200 rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xxs font-bold">Loading proposal milestones...</span>
      </div>
    );
  }

  if (trackerTab === "proposals") {
    return (
      <div className="flex flex-col gap-4 text-left">
        {userRole === "client" && (jobContracts.length > 0 || acceptedProposal) && (
          <div className="flex border-b border-slate-200 mb-2 gap-6 text-xs font-black uppercase tracking-wider">
            <button
              onClick={() => setTrackerTab("milestones")}
              className="pb-2.5 border-b-2 transition-all cursor-pointer border-transparent text-slate-450 hover:text-slate-700"
            >
              <i className="fa-solid fa-clock-rotate-left mr-1.5"></i> Milestones Tracker ({jobContracts.length})
            </button>
            <button
              onClick={() => setTrackerTab("proposals")}
              className="pb-2.5 border-b-2 transition-all cursor-pointer border-primary text-slate-850"
            >
              <i className="fa-solid fa-users mr-1.5"></i> Freelancer Proposals ({projectProposals.length})
            </button>
          </div>
        )}
        
        {projectProposals.length > 0 && (
          <div className="relative w-full">
            <input
              type="text"
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Search candidate proposals by freelancer name, credentials, cover letter..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-850 focus:outline-none focus:border-teal-700 focus:bg-white transition-all shadow-xs"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
        )}

        {filteredCandidates.length === 0 ? (
          <p className="text-slate-400 text-xs italic font-medium py-2">
            {projectProposals.length === 0 ? "No bids received yet for this project." : "No proposals match your search query."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {paginatedCandidates.map((proposal: any) => {
              const isAlreadyHired = proposal.status === "Accepted" || jobContracts.some(c => c.freelancer_id === proposal.freelancer_id);
              const milestoneList = (() => {
                try {
                  return typeof proposal.milestones === "string"
                    ? JSON.parse(proposal.milestones)
                    : (proposal.milestones || []);
                } catch (e) {
                  return [];
                }
              })();
              const hasMilestones = milestoneList && milestoneList.length > 0;

              return (
                <div key={proposal.proposal_id} className="bg-slate-50 border border-slate-250/70 rounded-xl p-4 flex flex-col gap-3 text-left">
                  <div className="flex justify-between items-start gap-3 w-full">
                    <a
                      href={`/freelancer/${proposal.freelancer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-2.5 items-center group cursor-pointer min-w-0 flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs group-hover:bg-primary transition-all select-none shrink-0">
                        <span className="text-primary group-hover:text-white transition-colors">
                          {proposal.freelancer_name ? proposal.freelancer_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : "FL"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="font-extrabold text-slate-800 text-xs truncate leading-none group-hover:text-primary transition-colors">{proposal.freelancer_name}</h5>
                        <span className="text-slate-400 text-[10px] font-bold block mt-1 truncate">{proposal.freelancer_title || "Freelancer"} • {proposal.freelancer_email}</span>
                      </div>
                    </a>
                    {isAlreadyHired ? (
                      <span className="text-[9px] font-black border px-2 py-0.5 rounded uppercase tracking-wider shrink-0 bg-emerald-50 text-emerald-755 border-emerald-150">
                        Hired
                      </span>
                    ) : (
                      <span className={`text-[9px] font-black border px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        proposal.status === "Accepted_By_Freelancer"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-150"
                          : "bg-amber-50 text-amber-700 border-amber-150"
                      }`}>
                        {proposal.status === "Accepted_By_Freelancer" ? "Accepted by Freelancer" : proposal.status}
                      </span>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200/50 rounded-lg p-3">
                    <p className="text-slate-650 text-[11px] font-medium leading-relaxed whitespace-pre-line">{proposal.cover_letter}</p>
                  </div>

                  {/* Expanded Milestone Breakdown */}
                  {expandedProposalId === proposal.proposal_id && hasMilestones && (
                    <div className="bg-white border border-slate-200/60 rounded-lg p-3 flex flex-col gap-2 animate-fadeIn">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Milestones structure</span>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {milestoneList.map((m: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] font-semibold py-1.5 border-b border-slate-100 last:border-0">
                            <span className="text-slate-700 truncate max-w-[280px]">
                              {idx + 1}. {m.title}
                            </span>
                            <span className="font-extrabold text-slate-800">
                              ${parseFloat(m.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold border-t border-slate-100 pt-3 mt-1">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span>Bid: <strong className="text-slate-800 font-black">${parseFloat(proposal.bid_amount).toLocaleString()}</strong></span>
                      <span>Timeline: <strong className="text-slate-800 font-black">{proposal.delivery_days} days</strong></span>
                      {hasMilestones && (
                        <button
                          type="button"
                          onClick={() => setExpandedProposalId(expandedProposalId === proposal.proposal_id ? null : proposal.proposal_id)}
                          className="text-primary hover:text-primary-dark font-extrabold text-[10px] flex items-center gap-1 cursor-pointer bg-primary-light/50 px-2.5 py-1 rounded-lg border border-primary/10 transition-all select-none"
                        >
                          <i className={`fa-solid ${expandedProposalId === proposal.proposal_id ? "fa-chevron-up" : "fa-chevron-down"} text-[8px]`}></i>
                          <span>{expandedProposalId === proposal.proposal_id ? "Hide Milestones" : `Milestones (${milestoneList.length})`}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {isAlreadyHired ? (
                        <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] py-1.5 px-4 rounded-xl border border-emerald-150 select-none flex items-center gap-1">
                          <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i> Hired
                        </span>
                      ) : proposal.initiated_by === "client" && proposal.status === "Pending" ? (
                        <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] py-1.5 px-4 rounded-xl border border-slate-200 select-none">
                          ⏳ Awaiting Response
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const projectMaxBudget = parseFloat(job.max_budget || job.budget || "0");
                            const currentHiredSum = jobContracts.reduce((sum, c) => sum + parseFloat(c.budget), 0);
                            const bidAmount = parseFloat(proposal.bid_amount);
                            
                            const numFreelancersStr = job.num_freelancers || "1 freelancer";
                            let limit = 1;
                            if (numFreelancersStr.includes("2-3")) {
                              limit = 3;
                            } else if (numFreelancersStr.includes("2-5")) {
                              limit = 5;
                            } else if (
                              numFreelancersStr.includes("More than 5") ||
                              numFreelancersStr.includes("5+") ||
                              numFreelancersStr.includes("many") ||
                              numFreelancersStr.includes("4+")
                            ) {
                              limit = 999;
                            } else {
                              const match = numFreelancersStr.match(/^(\d+)/);
                              if (match) {
                                limit = parseInt(match[1]);
                              }
                            }

                            const isMultiHire = limit > 1;
                            const isBudgetExceeded = isMultiHire
                              ? bidAmount > projectMaxBudget
                              : (currentHiredSum + bidAmount) > projectMaxBudget;

                            if (projectMaxBudget > 0 && isBudgetExceeded) {
                              triggerToast(
                                "error",
                                "Hiring budget limit exceeded!",
                                isMultiHire
                                  ? `Total project budget is $${projectMaxBudget.toLocaleString()} per freelancer, but the candidate's bid of $${bidAmount.toLocaleString()} exceeds this limit.`
                                  : `Total project budget is $${projectMaxBudget.toLocaleString()}, but you have already committed $${currentHiredSum.toLocaleString()} to active hired freelancers. Hiring this freelancer for $${bidAmount.toLocaleString()} would exceed the limit.`
                              );
                              return;
                            }

                            setPayingProposal(proposal);
                            setPayError("");
                          }}
                          className="bg-primary hover:bg-primary-hover text-white py-1.5 px-4 rounded-xl font-bold text-[10px] cursor-pointer transition-all shadow-sm border-0"
                        >
                          {proposal.status === "Accepted_By_Freelancer" ? "🚀 Pay & Launch Project" : "Accept & Hire"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {totalCandidatePages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 text-[10px] font-bold select-none">
                <span className="text-slate-400">
                  Showing {(candidatePage - 1) * candidatesPerPage + 1} - {Math.min(candidatePage * candidatesPerPage, filteredCandidates.length)} of {filteredCandidates.length} candidates
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCandidatePage(p => Math.max(1, p - 1))}
                    disabled={candidatePage === 1}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCandidatePage(p => Math.min(totalCandidatePages, p + 1))}
                    disabled={candidatePage === totalCandidatePages}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {payingProposal && (() => {
          const milestoneList = (() => {
            try {
              return typeof payingProposal.milestones === "string"
                ? JSON.parse(payingProposal.milestones)
                : (payingProposal.milestones || []);
            } catch (e) {
              return [];
            }
          })();
          const hasMilestones = milestoneList && milestoneList.length > 0;
          const upfrontAmount = hasMilestones ? parseFloat(milestoneList[0].amount) : parseFloat(payingProposal.bid_amount);

          console.log("=== HIRE POPUP DEBUG ===");
          console.log("payingProposal object:", payingProposal);
          console.log("milestoneList (parsed):", milestoneList);
          console.log("hasMilestones:", hasMilestones);
          console.log("upfrontAmount calculated:", upfrontAmount);

          return typeof window !== "undefined" && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[0.5px] p-4 overflow-y-auto">
              <div className="relative bg-white border border-slate-200 shadow-2xl rounded-xl max-w-md w-full animate-fadeIn overflow-hidden text-left text-slate-800 flex flex-col max-h-[90vh]">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500" />

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <FiCreditCard className="text-primary text-sm" />
                    <h3 className="text-sm font-extrabold text-slate-800">Escrow Payment Required</h3>
                  </div>
                  <button
                    onClick={() => setPayingProposal(null)}
                    className="text-slate-400 hover:text-slate-650 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-1">
                  {/* Cost breakdown */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                      <span>Hiring Target</span>
                      <span className="font-extrabold text-slate-800">{payingProposal.freelancer_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                      <span>Project Bid Amount</span>
                      <span className="font-black text-slate-800 text-sm">${parseFloat(payingProposal.bid_amount).toLocaleString()}</span>
                    </div>

                    {/* Milestones list structure */}
                    {hasMilestones && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-200/50 pt-3 mt-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Milestones structure</span>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                          {milestoneList.map((m: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] font-semibold py-1 border-b border-slate-100/30 last:border-0">
                              <span className="text-slate-600 truncate max-w-[250px]">
                                {idx + 1}. {m.title}
                              </span>
                              <span className={idx === 0 ? "font-extrabold text-primary" : "text-slate-500"}>
                                ${parseFloat(m.amount).toLocaleString()} {idx === 0 && <span className="text-[8px] bg-teal-50 text-primary border border-teal-150 px-1 py-0.5 rounded ml-1 font-bold">Due Now</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-200/50 pt-2 mt-1">
                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span className="text-primary font-bold">Due Now (held in escrow)</span>
                        <span className="font-black text-primary text-base">${upfrontAmount.toLocaleString()}</span>
                      </div>
                      <p className="text-[9px] text-slate-450 font-semibold mt-2 bg-slate-100 rounded-lg px-2.5 py-2 leading-relaxed">
                        {hasMilestones 
                          ? "Only the first milestone is funded now and held in escrow. Remaining milestones will be funded step-by-step as you progress."
                          : "Escrow payment of 100% is charged now and held securely by the admin. Funds will be released to the freelancer upon milestone approvals."}
                      </p>
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
                        {m === "stripe" && <FaCreditCard className={`w-4 h-4 ${payMethod === "stripe" ? "text-primary" : "text-slate-400"}`} />}
                        {m === "paypal" && <FaPaypal className={`w-4 h-4 ${payMethod === "paypal" ? "text-primary" : "text-slate-400"}`} />}
                        {m === "wallet" && <FaWallet className={`w-4 h-4 ${payMethod === "wallet" ? "text-primary" : "text-slate-400"}`} />}
                        <span className="text-[10px] font-black capitalize">{m === "stripe" ? "Card" : m}</span>
                      </button>
                    ))}
                  </div>

                  {/* Method info hint */}
                  <div className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                    {payMethod === "stripe" && (
                      <span>
                        <strong className="text-slate-700 font-bold">Stripe Card:</strong> You will be redirected to Stripe's secure checkout page.
                      </span>
                    )}
                    {payMethod === "paypal" && (
                      <span>
                        <strong className="text-slate-700 font-bold">PayPal:</strong> Pays instantly via simulated sandbox integration.
                      </span>
                    )}
                    {payMethod === "wallet" && (
                      <span>
                        <strong className="text-slate-700 font-bold">Wallet:</strong> Pays instantly from your available LancerFlow balance.
                      </span>
                    )}
                  </div>
                </div>

                {payError && (
                  <div className="text-rose-600 text-[10px] font-bold bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    ⚠️ {payError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 border-t border-slate-100 pt-4 mt-1">
                  <button
                    type="button"
                    onClick={() => setPayingProposal(null)}
                    disabled={payLoading}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProposalPayment}
                    disabled={payLoading}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {payLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-t-white border-primary/40 rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="text-sm" />
                        <span>Pay & Hire</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        , document.body);
        })()}
      </div>
    );
  }

  let milestoneList = [];
  if (activeContract) {
    milestoneList = activeContract.milestones || [];
  } else if (acceptedProposal) {
    try {
      milestoneList = typeof acceptedProposal.milestones === 'string'
        ? JSON.parse(acceptedProposal.milestones)
        : (acceptedProposal.milestones || []);
    } catch (e) {
      console.error(e);
    }
  }

  const bidAmount = acceptedProposal ? parseFloat(acceptedProposal.bid_amount) : (activeContract ? parseFloat(activeContract.budget) : 0);
  if (milestoneList.length === 0 && !activeContract) {
    const m1 = Math.round(bidAmount * 0.3 * 100) / 100;
    const m2 = Math.round(bidAmount * 0.5 * 100) / 100;
    const m3 = Math.round((bidAmount - m1 - m2) * 100) / 100;
    milestoneList = [
      { id: "m1", title: "Project discovery and high-fidelity prototype handoff", amount: m1, completed: false, paid: false },
      { id: "m2", title: "Core implementation and database schema integration", amount: m2, completed: false, paid: false },
      { id: "m3", title: "Final deployment, QA audits and project handoff", amount: m3, completed: false, paid: false }
    ];
  }

  // Check if dispute resolved with a split
  let isDisputeSplit = false;
  let freelancerPayoutPercent = 100;
  
  if (activeContract && activeContract.dispute_status === 'Resolved' && activeContract.dispute_resolution_type === 'Partial_Refund') {
    isDisputeSplit = true;
    const details = activeContract.dispute_resolution_details || "";
    const match = details.match(/Freelancer\s+receives\s+(\d+(?:\.\d+)?)\s*%/i);
    if (match) {
      freelancerPayoutPercent = parseFloat(match[1]);
    } else {
      const clientMatch = details.match(/Client\s+receives\s+(\d+(?:\.\d+)?)\s*%/i);
      if (clientMatch) {
        freelancerPayoutPercent = 100 - parseFloat(clientMatch[1]);
      } else {
        freelancerPayoutPercent = 50; // default split
      }
    }
  }

  const totalExtraRevisionPaid = activeContract
    ? milestoneList.reduce((sum: number, m: any) => sum + (parseFloat(m.extra_revision_fee || 0) > 0 && m.revision_status !== 'Awaiting Funding' ? parseFloat(m.extra_revision_fee) : 0), 0)
    : 0;

  const totalAmount = activeContract
    ? parseFloat(activeContract.budget) + totalExtraRevisionPaid
    : milestoneList.reduce((sum: number, m: any) => sum + parseFloat(m.amount), 0);

  const completedAmount = activeContract
    ? milestoneList.reduce((sum: number, m: any) => sum + (m.status === 'Completed' || m.payment_status === 'Paid' ? parseFloat(m.amount) + (parseFloat(m.extra_revision_fee || 0) > 0 && m.revision_status !== 'Awaiting Funding' ? parseFloat(m.extra_revision_fee) : 0) : 0), 0)
    : milestoneList.reduce((sum: number, m: any) => sum + (m.completed ? parseFloat(m.amount) : 0), 0);

  const progressPercent = activeContract
    ? (activeContract.progress || 0)
    : (totalAmount > 0 ? Math.round((completedAmount / totalAmount) * 100) : 0);

  const paidAmountBase = activeContract
    ? (isDisputeSplit 
        ? totalAmount * (freelancerPayoutPercent / 100)
        : milestoneList.reduce((sum: number, m: any) => sum + (m.payment_status === 'Paid' ? parseFloat(m.amount) : 0), 0))
    : milestoneList.reduce((sum: number, m: any) => sum + (m.paid ? parseFloat(m.amount) : 0), 0);

  const paidAmount = paidAmountBase + totalExtraRevisionPaid;

  const clientPaidAmountBase = activeContract
    ? milestoneList.reduce((sum: number, m: any) => sum + (m.payment_status === 'Paid' || m.payment_status === 'Funded' ? parseFloat(m.amount) : 0), 0)
    : milestoneList.reduce((sum: number, m: any) => sum + (m.paid ? parseFloat(m.amount) : 0), 0);

  const clientPaidAmount = clientPaidAmountBase + totalExtraRevisionPaid;

  const platformFee = paidAmount * 0.05;
  const netFreelancerPayout = paidAmount - platformFee;

  const returnedAmount = isDisputeSplit ? totalAmount - paidAmount : 0;

  const hourlyRate = activeContract?.accepted_bid_amount
    ? parseFloat(activeContract.accepted_bid_amount)
    : (acceptedProposal ? parseFloat(acceptedProposal.bid_amount) : (parseFloat(job.budget) || 50.00));
  const maxHours = job.max_hours || 40;
  const totalPaidHours = timecards
    ? timecards.filter((tc: any) => tc.status === "Paid").reduce((sum: number, tc: any) => sum + parseFloat(tc.amount), 0)
    : 0;
  const remainingAmountHours = Math.max(0, (maxHours * hourlyRate) - totalPaidHours);
  const hoursServedDecimal = timecards
    ? timecards.filter((tc: any) => tc.status === "Paid").reduce((sum: number, tc: any) => sum + tc.hours + (tc.minutes / 60), 0)
    : 0;
  const hoursServedStr = hoursServedDecimal.toFixed(1);

  const handleToggleMilestone = async (mId: string, field: 'completed' | 'paid') => {
    const updated = milestoneList.map((m: any) => {
      if (m.id === mId || m.title === mId) {
        return { ...m, [field]: !m[field] };
      }
      return m;
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/proposals/${acceptedProposal.proposal_id}/milestones`, {
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

  const handleSubmitMilestone = async (milestoneId: number, files: {name: string, url: string}[] = []) => {
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/submit`, {
        method: "POST",
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
        fetchContracts();
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
        body: JSON.stringify({ 
          feedback: milestoneFeedback,
          submitted_files: milestoneFeedbackFiles.length > 0 ? JSON.stringify(milestoneFeedbackFiles) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Revision request submitted.", "Awaiting freelancer acceptance.");
        setActiveRevisionId(null);
        setMilestoneFeedback("");
        setMilestoneFeedbackFiles([]);
        fetchContracts();
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

  const handleAcceptRevision = async (milestoneId: number, extraFee: number = 0) => {
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/accept-revision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ extra_fee: extraFee })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Revision accepted!", data.message);
        fetchContracts();
      } else {
        triggerToast("error", data.message || "Failed to accept revision.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  const handleFundRevision = async (milestoneId: number) => {
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/fund-revision`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Revision payment funded successfully!", "Work is started.");
        fetchContracts();
      } else {
        triggerToast("error", data.message || "Failed to fund revision.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  const handleRejectRevisionProposal = async (milestoneId: number) => {
    if (!confirm("Are you sure you want to decline this revision fee proposal? The milestone will go back to the freelancer to accept or propose a different fee.")) return;
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/reject-revision-proposal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Revision proposal declined.", data.message);
        fetchContracts();
      } else {
        triggerToast("error", data.message || "Failed to decline revision proposal.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setMilestoneActionLoading(false);
    }
  };

  const handleProcessModalPayment = async () => {
    if (!activePaymentModal) return;
    try {
      setModalPayLoading(true);
      setModalPayError("");
      const token = localStorage.getItem("token");

      const { type, id, amount } = activePaymentModal;

      // 1. If choosing Stripe, redirect directly to Stripe Hosted Checkout
      if (modalPayMethod === "stripe") {
        const res = await fetch(`${API_URL}/payments/contract/milestone/stripe/create-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ milestone_id: id, type, redirect_path: window.location.pathname })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        } else {
          setModalPayError(data.message || "Failed to initiate Stripe session.");
          return;
        }
      }

      // 2. Auto deposit via PayPal sandbox simulator if chosen
      if (modalPayMethod === "paypal") {
        // Fetch current wallet to see if we need deposit
        const walletRes = await fetch(`${API_URL}/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (walletRes.ok) {
          const walletInfo = await walletRes.json();
          const currentBalance = parseFloat(walletInfo.balance || "0");
          const needed = amount - currentBalance;
          if (needed > 0) {
            const depositRes = await fetch(`${API_URL}/wallet/deposit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ amount: needed })
            });
            if (!depositRes.ok) {
              const depData = await depositRes.json();
              throw new Error(depData.message || "Failed to auto-deposit funds into wallet.");
            }
          }
        }
      }

      // 3. Perform the actual milestone funding call (which is paid from wallet)
      const url = type === "milestone" 
        ? `${API_URL}/payments/contract/milestone/${id}/fund`
        : `${API_URL}/payments/contract/milestone/${id}/fund-revision`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", type === "milestone" ? "Milestone funded successfully!" : "Extra revision funded successfully!", data.message);
        setCongratsModalData({
          show: true,
          amount: amount || 0,
          title: job?.title || "Project Contract",
          projectId: job?.job_id
        });
        setActivePaymentModal(null);
        fetchContracts();
      } else {
        setModalPayError(data.message || "Failed to complete payment.");
      }
    } catch (err: any) {
      console.error(err);
      setModalPayError(err.message || "Network error. Please try again.");
    } finally {
      setModalPayLoading(false);
    }
  };

  const handleFundMilestone = async (milestoneId: number, title: string, amount: number) => {
    if (!confirm(`Are you sure you want to fund milestone "${title}" for $${amount.toFixed(2)} from your wallet?`)) return;
    try {
      setMilestoneActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/fund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Milestone funded successfully!", data.message);
        setCongratsModalData({
          show: true,
          amount: amount || 0,
          title: title || job?.title || "Project Milestone",
          projectId: job?.job_id
        });
        fetchContracts();
      } else {
        triggerToast("error", data.message || "Failed to fund milestone.");
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/release`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Milestone payment released successfully!", `Released $${amount.toFixed(2)} to freelancer.`);
        fetchContracts();
      } else {
        triggerToast("error", data.message || "Failed to release milestone payment.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    }
  };


  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract) return;
    if (!disputeDescription.trim()) {
      alert("Please provide a description of your dispute.");
      return;
    }
    try {
      setDisputeLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${activeContract.contract_id}/dispute`, {
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
        fetchContracts();
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

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setUploadedFiles(prev => [...prev, ...newUploads]);
        triggerToast("success", `${newUploads.length} file(s) uploaded successfully!`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Error uploading files.");
    } finally {
      setIsUploading(false);
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

  const handleUploadFeedbackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsFeedbackUploading(true);
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
        setMilestoneFeedbackFiles(prev => [...prev, ...newUploads]);
        triggerToast("success", `${newUploads.length} file(s) uploaded successfully!`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Error uploading files.");
    } finally {
      setIsFeedbackUploading(false);
    }
  };

  const handleSubmitCompletion = async () => {
    if (!activeContract) return;
    if (!window.confirm("Are you sure you want to mark this project as completed and submit it for client review?")) {
      return;
    }
    setIsSubmittingCompletion(true);
    try {
      const res = await fetch(`${API_URL}/freelancer/contracts/${activeContract.contract_id}/submit-completion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          submitted_files: JSON.stringify(uploadedFiles)
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Project completion submitted successfully!");
        setUploadedFiles([]);
        fetchContracts();
      } else {
        triggerToast("error", data.message || "Failed to submit completion.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleApproveCompletion = async () => {
    if (!activeContract) return;
    if (!window.confirm("Approve project completion and release any final remaining escrow? This will close the contract and open feedback reviews.")) {
      return;
    }
    setIsApprovingCompletion(true);
    try {
      const res = await fetch(`${API_URL}/freelancer/contracts/${activeContract.contract_id}/approve-completion`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Project completed and closed successfully!");
        fetchContracts();
      } else {
        triggerToast("error", data.message || "Failed to approve completion.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setIsApprovingCompletion(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("printable-invoice-area");
    if (!element || isDownloadingPDF) return;

    setIsDownloadingPDF(true);

    // Helper to safely clean all unsupported CSS color functions (like oklch, oklab, lab, color-mix, color)
    // by balancing parentheses and resolving them using the browser's native canvas engine.
    const cleanCssString = (css: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      const colorCache: Record<string, string> = {};

      const resolveColor = (matched: string) => {
        if (colorCache[matched]) {
          return colorCache[matched];
        }
        let finalColor = "rgba(0,0,0,0.1)";
        if (ctx) {
          try {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = matched;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            finalColor = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
            colorCache[matched] = finalColor;
          } catch (e) {
            // Ignore resolution error and fallback
          }
        }
        return finalColor;
      };

      const targets = ["oklch(", "oklab(", "lab(", "color-mix(", "color("];
      let result = "";
      let i = 0;
      const len = css.length;

      while (i < len) {
        let matchedTarget = null;
        for (const target of targets) {
          if (css.startsWith(target, i)) {
            matchedTarget = target;
            break;
          }
        }

        if (matchedTarget !== null) {
          const startIdx = i;
          let parenCount = 1;
          let j = i + matchedTarget.length;
          while (j < len && parenCount > 0) {
            const char = css[j];
            if (char === "(") {
              parenCount++;
            } else if (char === ")") {
              parenCount--;
            }
            j++;
          }

          if (parenCount === 0) {
            const matchedStr = css.substring(startIdx, j);
            const resolved = resolveColor(matchedStr);
            result += resolved;
            i = j;
            continue;
          }
        }

        result += css[i];
        i++;
      }

      return result;
    };


    // Helper to temporarily clean internal inline stylesheets containing unsupported oklch/lab rules for html2canvas
    const cleanStyles = () => {
      const styleRestorers: (() => void)[] = [];

      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const el = sheet.ownerNode;
          if (el instanceof HTMLStyleElement) {
            // Edit internal style tags in-place
            const originalText = el.textContent || "";
            const cleanedText = cleanCssString(originalText);
            el.textContent = cleanedText;
            styleRestorers.push(() => {
              el.textContent = originalText;
            });
          }
        } catch (e) {
          // Ignore cross-origin stylesheet errors
        }
      }

      return () => {
        // Run all restorers in reverse order
        for (let i = styleRestorers.length - 1; i >= 0; i--) {
          try {
            styleRestorers[i]();
          } catch (e) {
            // Ignore restorer errors
          }
        }
      };
    };

    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;

    // Override fetch to clean oklch/lab out of CSS requests fetched by html2canvas
    window.fetch = async function (...args) {
      try {
        const res = await originalFetch.apply(this, args);
        const url = args[0];
        const contentType = res.headers.get("content-type") || "";
        const isCss = contentType.includes("text/css") || (typeof url === "string" && (url.includes(".css") || url.includes("stylesheet")));
        if (isCss) {
          const cssText = await res.text();
          const cleanedText = cleanCssString(cssText);
          return new Response(cleanedText, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        }
        return res;
      } catch (e) {
        return originalFetch.apply(this, args);
      }
    };

    // Override XHR to clean oklch/lab out of CSS requests fetched by html2canvas using a dynamic Proxy
    const MyXHR = function (this: any) {
      const xhr = new originalXHR();
      let cleanedResponseText: string | null = null;

      return new Proxy(xhr, {
        get(target, prop) {
          if (prop === "responseText" && cleanedResponseText !== null) {
            return cleanedResponseText;
          }
          if (prop === "response" && cleanedResponseText !== null) {
            return cleanedResponseText;
          }
          if (prop === "open") {
            return function (method: string, url: string, ...rest: any[]) {
              (target as any)._url = url;
              return (target as any).open(method, url, ...rest);
            };
          }
          const value = (target as any)[prop];
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        },
        set(target, prop, value) {
          if (prop === "onreadystatechange") {
            const origHandler = value;
            target.onreadystatechange = function (this: any) {
              if (target.readyState === 4 && target.status === 200) {
                const contentType = target.getResponseHeader("content-type") || "";
                const url = (target as any)._url || "";
                const isCss = contentType.includes("text/css") || url.includes(".css") || url.includes("stylesheet");
                if (isCss) {
                  const cssText = target.responseText;
                  cleanedResponseText = cleanCssString(cssText);
                }
              }
              if (origHandler) {
                origHandler.call(this);
              }
            };
            return true;
          }
          (target as any)[prop] = value;
          return true;
        }
      });
    };
    (MyXHR as any).prototype = originalXHR.prototype;
    Object.setPrototypeOf(MyXHR, originalXHR);
    (window as any).XMLHttpRequest = MyXHR as any;

    // Helper to clean inline style attributes of elements inside the print area
    const cleanInlineStyles = (root: HTMLElement) => {
      const elements = Array.from(root.getElementsByTagName("*"));
      const revertedStyles: { el: HTMLElement; originalStyle: string }[] = [];
      for (const el of elements) {
        const styleAttr = el.getAttribute("style");
        if (styleAttr && (styleAttr.includes("oklch") || styleAttr.includes("lab") || styleAttr.includes("color"))) {
          revertedStyles.push({ el: el as HTMLElement, originalStyle: styleAttr });
          el.setAttribute("style", cleanCssString(styleAttr));
        }
      }
      const rootStyle = root.getAttribute("style");
      if (rootStyle && (rootStyle.includes("oklch") || rootStyle.includes("lab") || rootStyle.includes("color"))) {
        revertedStyles.push({ el: root, originalStyle: rootStyle });
        root.setAttribute("style", cleanCssString(rootStyle));
      }
      return () => {
        for (const { el, originalStyle } of revertedStyles) {
          el.setAttribute("style", originalStyle);
        }
      };
    };

    const restoreStyles = cleanStyles();
    const restoreInlineStyles = cleanInlineStyles(element);

    let restored = false;
    const restoreAll = () => {
      if (restored) return;
      restored = true;
      restoreStyles();
      restoreInlineStyles();
      window.fetch = originalFetch;
      window.XMLHttpRequest = originalXHR;
    };

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin:       [8, 8, 8, 8] as [number, number, number, number],
        filename:     selectedInvoiceItem 
          ? `Invoice-${selectedInvoiceItem.type === 'timecard' ? 'TC' : 'MS'}-${selectedInvoiceItem.id}.pdf`
          : `Invoice-CON-${activeContract.contract_id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true, 
          logging: false, 
          scrollX: 0, 
          scrollY: 0,
          width: 580,
          windowWidth: 580,
          onclone: (clonedDoc: Document) => {
            // Inject complete, explicit CSS styles for printable invoice area in clonedDoc
            const style = clonedDoc.createElement("style");
            style.textContent = `
              #printable-invoice-area {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                font-size: 10px !important;
                color: #1e293b !important;
                background-color: #ffffff !important;
                padding: 16px !important;
                width: 580px !important;
                max-width: 580px !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }
              #printable-invoice-area * { box-sizing: border-box !important; }

              /* Explicitly define Tailwind font sizes since external stylesheets are disabled in clone */
              #printable-invoice-area .text-xxs { font-size: 8px !important; }
              #printable-invoice-area .text-\[8px\] { font-size: 8px !important; }
              #printable-invoice-area .text-\[9px\] { font-size: 9px !important; }
              #printable-invoice-area .text-\[10px\] { font-size: 10px !important; }
              #printable-invoice-area .text-xs { font-size: 11px !important; }
              #printable-invoice-area .text-\[11px\] { font-size: 11px !important; }
              #printable-invoice-area .text-sm { font-size: 12px !important; }
              #printable-invoice-area .text-md { font-size: 13px !important; }
              #printable-invoice-area .text-lg { font-size: 14px !important; }
              #printable-invoice-area h4 { font-size: 11px !important; }
              #printable-invoice-area p { font-size: 9px !important; }

              /* Clear browser user-agent margins and paddings for all text elements to keep styling neat */
              #printable-invoice-area h1,
              #printable-invoice-area h2,
              #printable-invoice-area h3,
              #printable-invoice-area h4,
              #printable-invoice-area h5,
              #printable-invoice-area h6,
              #printable-invoice-area p,
              #printable-invoice-area ul,
              #printable-invoice-area ol {
                margin: 0 !important;
                padding: 0 !important;
              }

              /* Prevent page breaks inside any layout containers, tables, row items, or cards */
              #printable-invoice-area table,
              #printable-invoice-area tr,
              #printable-invoice-area div,
              #printable-invoice-area section,
              #printable-invoice-area .bg-slate-50 {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              /* Explicit compact centered badge classes for html2canvas */
              #printable-invoice-area span.invoice-badge-green,
              #printable-invoice-area span.invoice-badge-gray,
              #printable-invoice-area span.invoice-badge-teal,
              #printable-invoice-area span.invoice-badge-amber,
              #printable-invoice-area span.invoice-badge-rose {
                display: inline-block !important;
                vertical-align: middle !important;
                margin-top: 4px !important;
                white-space: nowrap !important;
                font-size: 8px !important;
                font-weight: 800 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                line-height: 1.2 !important;
                background: none !important;
                border: none !important;
                padding: 0 !important;
              }

              #printable-invoice-area span.invoice-badge-green {
                color: #059669 !important;
              }

              #printable-invoice-area span.invoice-badge-gray {
                color: #64748b !important;
              }

              #printable-invoice-area span.invoice-badge-teal {
                color: #0d9488 !important;
              }

              #printable-invoice-area span.invoice-badge-amber {
                color: #d97706 !important;
              }

              #printable-invoice-area span.invoice-badge-rose {
                color: #e11d48 !important;
              }

              /* Prevent vertical text clipping & squashing */
              #printable-invoice-area span,
              #printable-invoice-area p,
              #printable-invoice-area h1,
              #printable-invoice-area h2,
              #printable-invoice-area h3,
              #printable-invoice-area h4,
              #printable-invoice-area h5,
              #printable-invoice-area h6,
              #printable-invoice-area td,
              #printable-invoice-area th,
              #printable-invoice-area div {
                overflow: visible !important;
                line-height: 1.4 !important;
                white-space: normal !important;
                text-overflow: clip !important;
              }

              #printable-invoice-area .truncate {
                overflow: visible !important;
                white-space: normal !important;
                text-overflow: clip !important;
              }

              #printable-invoice-area .overflow-hidden {
                overflow: hidden !important;
              }

              #printable-invoice-area .flex { display: flex !important; }
              #printable-invoice-area .flex-col { flex-direction: column !important; }
              #printable-invoice-area .flex-row { flex-direction: row !important; }
              #printable-invoice-area .items-center { align-items: center !important; }
              #printable-invoice-area .items-start { align-items: flex-start !important; }
              #printable-invoice-area .justify-between { justify-content: space-between !important; }
              #printable-invoice-area .grid { display: grid !important; }
              #printable-invoice-area .grid-cols-2 { display: grid !important; grid-template-columns: 1fr 1fr !important; }
              #printable-invoice-area .gap-4 { gap: 16px !important; }
              #printable-invoice-area .gap-3 { gap: 12px !important; }
              #printable-invoice-area .gap-2 { gap: 8px !important; }
              #printable-invoice-area .gap-1.5 { gap: 6px !important; }
              #printable-invoice-area .gap-1 { gap: 4px !important; }

              #printable-invoice-area .bg-white { background-color: #ffffff !important; }
              #printable-invoice-area .bg-slate-50, #printable-invoice-area .bg-slate-50\\/50, #printable-invoice-area .bg-slate-50\\/20 { background-color: #f8fafc !important; }
              #printable-invoice-area .bg-emerald-50 { background-color: #ecfdf5 !important; }
              #printable-invoice-area .bg-teal-50 { background-color: #f0fdfa !important; }
              #printable-invoice-area .bg-amber-50 { background-color: #fffbeb !important; }
              #printable-invoice-area .bg-rose-50, #printable-invoice-area .bg-rose-50\\/30 { background-color: #fff1f2 !important; }
              #printable-invoice-area .bg-slate-100 { background-color: #f1f5f9 !important; }
              #printable-invoice-area .bg-primary, #printable-invoice-area .bg-gradient-to-r, #printable-invoice-area .bg-gradient-to-tr { background-color: #2563eb !important; }

              #printable-invoice-area .text-slate-800, #printable-invoice-area .text-slate-805, #printable-invoice-area .text-slate-850, #printable-invoice-area .text-slate-900 { color: #0f172a !important; }
              #printable-invoice-area .text-slate-700, #printable-invoice-area .text-slate-650 { color: #334155 !important; }
              #printable-invoice-area .text-slate-500 { color: #64748b !important; }
              #printable-invoice-area .text-slate-400, #printable-invoice-area .text-slate-450 { color: #94a3b8 !important; }
              #printable-invoice-area .text-emerald-600, #printable-invoice-area .text-emerald-700 { color: #047857 !important; }
              #printable-invoice-area .text-teal-700 { color: #0f766e !important; }
              #printable-invoice-area .text-amber-700 { color: #b45309 !important; }
              #printable-invoice-area .text-rose-600, #printable-invoice-area .text-rose-700, #printable-invoice-area .text-rose-800 { color: #be123c !important; }
              #printable-invoice-area .text-primary { color: #2563eb !important; }
              #printable-invoice-area .text-white { color: #ffffff !important; }

              #printable-invoice-area .font-bold, #printable-invoice-area .font-extrabold, #printable-invoice-area .font-black { font-weight: 700 !important; }
              #printable-invoice-area .font-semibold { font-weight: 600 !important; }
              #printable-invoice-area .uppercase { text-transform: uppercase !important; }
              #printable-invoice-area .tracking-wider, #printable-invoice-area .tracking-widest, #printable-invoice-area .tracking-wide { letter-spacing: 0.05em !important; }

              #printable-invoice-area .border-b { border-bottom: 1px solid #e2e8f0 !important; }
              #printable-invoice-area .border-t { border-top: 1px solid #e2e8f0 !important; }
              #printable-invoice-area .border { border: 1px solid #e2e8f0 !important; }
              #printable-invoice-area .border-slate-100 { border-color: #f1f5f9 !important; }
              #printable-invoice-area .border-slate-150, #printable-invoice-area .border-slate-200, #printable-invoice-area .border-slate-200\\/80, #printable-invoice-area .border-slate-200\\/60 { border-color: #e2e8f0 !important; }
              #printable-invoice-area .border-slate-250 { border-color: #cbd5e1 !important; }
              #printable-invoice-area .border-emerald-100, #printable-invoice-area .border-emerald-150 { border-color: #a7f3d0 !important; }
              #printable-invoice-area .border-teal-100 { border-color: #99f6e4 !important; }
              #printable-invoice-area .border-rose-100 { border-color: #fecdd3 !important; }

              #printable-invoice-area .rounded-xl { border-radius: 12px !important; }
              #printable-invoice-area .rounded-lg { border-radius: 8px !important; }
              #printable-invoice-area .rounded-full { border-radius: 9999px !important; }
              #printable-invoice-area .rounded { border-radius: 4px !important; }

              #printable-invoice-area .p-5 { padding: 16px !important; }
              #printable-invoice-area .p-4 { padding: 12px !important; }
              #printable-invoice-area .p-3.5, #printable-invoice-area .p-3 { padding: 10px !important; }
              #printable-invoice-area .p-2.5 { padding: 8px 10px !important; }
              #printable-invoice-area .px-5 { padding-left: 16px !important; padding-right: 16px !important; }
              #printable-invoice-area .py-3 { padding-top: 8px !important; padding-bottom: 8px !important; }
              #printable-invoice-area .px-2.5 { padding-left: 10px !important; padding-right: 10px !important; }
              #printable-invoice-area .py-0.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
              #printable-invoice-area .px-1.5 { padding-left: 6px !important; padding-right: 6px !important; }
              #printable-invoice-area .py-0.2 { padding-top: 1px !important; padding-bottom: 1px !important; }

              #printable-invoice-area .mb-4 { margin-bottom: 12px !important; }
              #printable-invoice-area .mb-2 { margin-bottom: 6px !important; }
              #printable-invoice-area .mb-1 { margin-bottom: 4px !important; }
              #printable-invoice-area .mt-1 { margin-top: 4px !important; }
              #printable-invoice-area .mt-2 { margin-top: 6px !important; }
              #printable-invoice-area .mt-0.5 { margin-top: 2px !important; }

              #printable-invoice-area table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 8px !important; }
              #printable-invoice-area th { background-color: #f8fafc !important; text-align: left !important; padding: 6px 8px !important; border-bottom: 1px solid #cbd5e1 !important; color: #64748b !important; font-size: 8.5px !important; font-weight: 700 !important; text-transform: uppercase !important; }
              #printable-invoice-area td { padding: 6px 8px !important; border-bottom: 1px solid #e2e8f0 !important; text-align: left !important; font-size: 10px !important; }
              #printable-invoice-area .text-right { text-align: right !important; }
              #printable-invoice-area .w-64, #printable-invoice-area .sm\\:w-64 { width: 220px !important; }
              #printable-invoice-area .ml-auto { margin-left: auto !important; }
              #printable-invoice-area .block { display: block !important; }
              #printable-invoice-area .inline-block { display: inline-block !important; }
              #printable-invoice-area .inline-flex { display: inline-flex !important; }
              #printable-invoice-area .w-6 { width: 24px !important; min-width: 24px !important; }
              #printable-invoice-area .h-6 { height: 24px !important; min-height: 24px !important; }
              #printable-invoice-area .h-1.5 { height: 6px !important; }
              #printable-invoice-area .shrink-0 { flex-shrink: 0 !important; }
            `;
            clonedDoc.head.appendChild(style);

            // Disable external link stylesheets only in clonedDoc so html2canvas doesn't fail on lab()/oklch() rules in Tailwind CSS
            const linkElements = Array.from(clonedDoc.querySelectorAll("link[rel='stylesheet']"));
            for (const linkEl of linkElements) {
              (linkEl as HTMLLinkElement).disabled = true;
            }
          }
        },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css'] }
      };
      
      // Wait for the browser to recalculate layout
      await new Promise((resolve) => setTimeout(resolve, 150));

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Failed to generate PDF via html2pdf:", err);
    } finally {
      restoreAll();
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {userRole === "client" && (jobContracts.length > 0 || acceptedProposal) && (
        <div className="flex border-b border-slate-200 pb-0 gap-6 text-xs font-black uppercase tracking-wider mb-2">
          <button
            onClick={() => setTrackerTab("milestones")}
            className="pb-2.5 border-b-2 transition-all cursor-pointer border-primary text-slate-850"
          >
            <i className="fa-solid fa-clock-rotate-left mr-1.5"></i> Milestones Tracker ({jobContracts.length})
          </button>
          <button
            onClick={() => setTrackerTab("proposals")}
            className="pb-2.5 border-b-2 transition-all cursor-pointer border-transparent text-slate-450 hover:text-slate-700"
          >
            <i className="fa-solid fa-users mr-1.5"></i> Freelancer Proposals ({projectProposals.length})
          </button>
        </div>
      )}

      {userRole === "client" && jobContracts.length > 1 && (
        <div className="flex flex-col gap-2 mb-2">
          <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest text-left">
            Select Freelancer to Track:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {jobContracts.map((c) => {
              const isSelected = selectedContractId === c.contract_id;
              const initials = c.freelancer_name ? c.freelancer_name.split(" ").map((n: string) => n[0]).join("") : "FL";
              return (
                <button
                  key={c.contract_id}
                  onClick={() => setSelectedContractId(c.contract_id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-left focus:outline-none ${
                    isSelected
                      ? "border-primary bg-primary/[0.04] text-slate-900 shadow-sm"
                      : "border-slate-150 hover:border-slate-250 bg-white text-slate-600"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px] uppercase overflow-hidden shrink-0 shadow-xs">
                    {c.freelancer_image ? (
                      <img
                        src={getAvatarSrc(c.freelancer_image)}
                        alt={c.freelancer_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-black leading-none">{c.freelancer_name}</h5>
                    <span className="text-[9px] text-slate-450 font-bold block mt-1">
                      Budget: ${parseFloat(c.budget).toLocaleString()} • {c.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeContract?.status === "Cancelled" && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-bold flex items-center gap-2 mb-2">
          <span>⚠ This contract has been cancelled and all escrow funds have been fully refunded to the client's wallet.</span>
        </div>
      )}

      {/* Active Partner Info Header Card (Unified design to avoid repetitive stacked boxes) */}
      {activeContract && (
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Hired Freelancer / Client Partner */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm uppercase overflow-hidden shadow-xxs shrink-0">
              {partnerImage ? (
                <img src={partnerImage} className="w-full h-full object-cover" alt="Partner" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-black text-xs">
                  {partnerName ? partnerName.split(" ").map((n: string) => n[0]).join("") : "PA"}
                </div>
              )}
            </div>
            <div className="text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                {userRole === "client" ? "Hired Freelancer" : "Client Partner"}
              </span>
              <h4 className="text-xs font-black text-slate-800">{partnerName}</h4>
              <p className="text-[9px] text-slate-455 font-bold mt-0.5">{partnerEmail}</p>
            </div>
            {partnerId && (
              <button
                onClick={async () => {
                  try {
                    await handleStartConversation(partnerId);
                    setActiveTab("inbox");
                  } catch (err) {
                    console.error("Error starting chat:", err);
                  }
                }}
                className="text-[9px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all flex items-center gap-1 border-0 shrink-0 ml-1.5"
                title="Message Partner"
              >
                <FiMessageSquare className="w-3 h-3" /> Chat
              </button>
            )}
          </div>

          {/* Status & Progress */}
          <div className="flex flex-col gap-1.5 min-w-[200px] text-left">
            <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-wider">
              <span>Progress</span>
              <span className="text-slate-700 font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  activeContract.status === "Completed" ? "bg-emerald-400" :
                  activeContract.status === "Work Completed" ? "bg-purple-400" :
                  activeContract.status === "Under Review" ? "bg-amber-400" :
                  activeContract.status === "Disputed" ? "bg-rose-400" :
                  activeContract.status === "Work Started" ? "bg-blue-400" : "bg-slate-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  activeContract.status === "Completed" ? "bg-emerald-500" :
                  activeContract.status === "Work Completed" ? "bg-purple-500" :
                  activeContract.status === "Under Review" ? "bg-amber-500" :
                  activeContract.status === "Disputed" ? "bg-rose-500" :
                  activeContract.status === "Work Started" ? "bg-blue-500" : "bg-slate-500"
                }`}></span>
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                Status: <span className="uppercase font-black text-slate-750">
                  {activeContract.status === "Work Completed" ? "Work Completed" :
                   activeContract.status === "Under Review" ? "Awaiting Approval" :
                   activeContract.status === "Work Started" ? "In Progress" : activeContract.status}
                </span>
              </span>
            </div>
          </div>

          {/* Budget & Paid */}
          <div className="flex gap-6 border-t md:border-t-0 md:border-l border-slate-150 pt-4 md:pt-0 md:pl-6 text-left">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Budget</span>
              <span className="text-xs font-black text-slate-800">${parseFloat(activeContract.budget).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Paid</span>
              <span className="text-xs font-black text-emerald-600">${clientPaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { setSelectedInvoiceItem(null); setShowInvoiceModal(true); }}
              className="text-[10px] font-extrabold text-primary bg-primary/[0.04] border border-primary/20 hover:bg-primary/[0.08] rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-file-invoice-dollar"></i> View Invoice
            </button>
            {userRole === "client" && activeContract.status === "Hired" && (
              <button
                onClick={handleCancelContract}
                disabled={milestoneActionLoading}
                className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel Job
              </button>
            )}
            {userRole === "freelancer" && activeContract.status !== "Completed" && activeContract.status !== "Cancelled" && activeContract.status !== "CANCELLED" && (
              <button
                onClick={handleFreelancerCancelContract}
                disabled={milestoneActionLoading}
                className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-xl px-4 py-2 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel Job & Refund Client
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Project Progress Steps Timeline & Main Content Grid */}
      {activeContract && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-2">
          {/* Left Column: Timeline */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Project Timeline</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                activeContract.status === "Completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : activeContract.status === "Work Completed"
                    ? "bg-purple-50 text-purple-700 border-purple-100"
                    : activeContract.status === "Under Review"
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : activeContract.status === "Disputed"
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : activeContract.status === "Work Started"
                          ? "bg-teal-50 text-teal-700 border-teal-100"
                          : "bg-slate-50 text-slate-700 border-slate-100"
              }`}>
                {activeContract.status === "Under Review" ? "Awaiting Approval" : activeContract.status}
              </span>
            </div>

          {(() => {
            const milestones: any[] = milestoneList || [];
            const hasMilestones = milestones.length > 0;
            const events: { label: string; sub?: string; date?: string; done: boolean; color: string; amount?: string }[] = [];

            if (job.project_type === "Hourly") {
              events.push({
                label: "Hired & Payment",
                sub: `Agreed rate: $${hourlyRate.toFixed(2)}/hr | Limit: ${maxHours} hours`,
                date: activeContract.created_at,
                done: true,
                color: "teal",
                amount: `$${parseFloat(activeContract.budget || 0).toLocaleString()}`,
              });

              const isHourlyWorkStarted = !!activeContract.work_started_at || activeContract.status !== "Hired";
              events.push({
                label: "Work Started",
                sub: isHourlyWorkStarted ? "Freelancer began work on contract" : "Awaiting starting action",
                date: activeContract.work_started_at || (isHourlyWorkStarted ? activeContract.created_at : undefined),
                done: isHourlyWorkStarted,
                color: isHourlyWorkStarted ? "teal" : "slate",
              });

              events.push({
                label: "Timecard logging",
                sub: hoursServedDecimal > 0 ? `${hoursServedStr} hours logged and approved` : "No working hours logged yet",
                done: hoursServedDecimal > 0,
                color: hoursServedDecimal > 0 ? "emerald" : "slate",
              });

              if (activeContract.completed_at) {
                events.push({ label: "Completed", sub: "All timecard payouts resolved", date: activeContract.completed_at, done: true, color: "emerald" });
              } else if (activeContract.cancelled_at) {
                events.push({ label: "Cancelled", sub: "Contract ended & final hours processed", date: activeContract.cancelled_at, done: true, color: "rose" });
              } else if (activeContract.disputed_at) {
                events.push({ label: "Disputed", sub: "Under admin arbitration", date: activeContract.disputed_at, done: true, color: "orange" });
              } else {
                events.push({ label: "Completion / Resolution", sub: "Pending", done: false, color: "slate" });
              }
            } else {
              const firstMilestoneAmt = (milestones && milestones.length > 0)
                ? parseFloat(milestones[0].amount)
                : parseFloat(acceptedProposal?.bid_amount || 0);

              events.push({
                label: "Hired & Payment",
                sub: `You locked ${firstMilestoneAmt.toLocaleString()} into escrow`,
                date: activeContract.created_at,
                done: true,
                color: "teal",
                amount: `$${firstMilestoneAmt.toLocaleString()}`,
              });

              const isMilestoneWorkStarted = !!activeContract.work_started_at || activeContract.status !== "Hired";
              events.push({
                label: "Work Started",
                sub: isMilestoneWorkStarted ? "Freelancer began work on contract" : "Awaiting starting action",
                date: activeContract.work_started_at || (isMilestoneWorkStarted ? activeContract.created_at : undefined),
                done: isMilestoneWorkStarted,
                color: isMilestoneWorkStarted ? "teal" : "slate",
              });

              milestones.forEach((m: any, i: number) => {
                const paid = m.payment_status === "Paid" || m.status === "Completed" || activeContract.status === "Completed" || !!activeContract.completed_at;
                events.push({
                  label: `Milestone ${i + 1}: ${m.title}`,
                  sub: paid ? "Payment released from escrow" : "Awaiting completion & approval",
                  date: paid ? (m.paid_at || m.updated_at) : undefined,
                  done: paid,
                  color: paid ? "emerald" : "slate",
                  amount: `$${parseFloat(m.amount).toLocaleString()}`,
                });
              });

              if (activeContract.submitted_at) {
                const isCompleted = activeContract.status === "Completed" || !!activeContract.completed_at;
                events.push({
                  label: "Work Submitted",
                  sub: isCompleted 
                    ? "Work approved and escrow released" 
                    : (userRole === "client" ? "Awaiting your approval" : "Awaiting client approval"),
                  date: activeContract.submitted_at,
                  done: true,
                  color: isCompleted ? "emerald" : "amber",
                });
              } else if (!hasMilestones) {
                events.push({
                  label: "Work Submission",
                  sub: "Pending — freelancer hasn't submitted yet",
                  done: false,
                  color: "slate",
                });
              }

              if (activeContract.completed_at) {
                events.push({ label: "Completed", sub: "All payments released to freelancer", date: activeContract.completed_at, done: true, color: "emerald" });
              } else if (activeContract.cancelled_at) {
                events.push({ label: "Cancelled", sub: "Contract cancelled & escrow refunded", date: activeContract.cancelled_at, done: true, color: "rose" });
              } else if (activeContract.disputed_at) {
                events.push({ label: "Disputed", sub: "Under admin arbitration", date: activeContract.disputed_at, done: true, color: "orange" });
              } else {
                events.push({ label: "Completion / Resolution", sub: "Pending", done: false, color: "slate" });
              }
            }

            const colorMap: Record<string, { dot: string; line: string; sub: string; badge: string }> = {
              teal:    { dot: "bg-teal-600 border-teal-600 text-white shadow-teal-100",    line: "bg-teal-500",    sub: "text-teal-655",    badge: "bg-teal-50 border-teal-200 text-teal-700" },
              emerald: { dot: "bg-emerald-600 border-emerald-600 text-white shadow-emerald-100", line: "bg-emerald-500", sub: "text-emerald-655", badge: "bg-emerald-50 border-emerald-200 text-emerald-700" },
              amber:   { dot: "bg-amber-500 border-amber-500 text-white shadow-amber-100",   line: "bg-amber-500",   sub: "text-amber-600",   badge: "bg-amber-50 border-amber-200 text-amber-700" },
              rose:    { dot: "bg-rose-600 border-rose-600 text-white shadow-rose-100",     line: "bg-rose-500",    sub: "text-rose-600",    badge: "bg-rose-50 border-rose-200 text-rose-700" },
              orange:  { dot: "bg-orange-500 border-orange-500 text-white shadow-orange-100", line: "bg-orange-500", sub: "text-orange-600",  badge: "bg-orange-50 border-orange-200 text-orange-700" },
              slate:   { dot: "bg-slate-200 border-slate-300 text-slate-400 shadow-none",       line: "bg-slate-200",   sub: "text-slate-400",   badge: "bg-slate-100 border-slate-200 text-slate-500" },
            };

            const firstPendingIdx = events.findIndex(ev => !ev.done);

            return (
              <div className="flex flex-col gap-1">
                {events.map((ev, idx) => {
                  const c = colorMap[ev.color] || colorMap.slate;
                  const isLast = idx === events.length - 1;
                  const isNextStage = idx === firstPendingIdx;
                  const lineActive = ev.done && !isLast && events[idx + 1].done;

                  return (
                    <div key={idx} className="flex gap-4 group/step hover:translate-x-1 transition-all duration-200">
                      <div className="flex flex-col items-center self-stretch">
                        <div className="relative flex items-center justify-center shrink-0">
                          {isNextStage && (
                            <span className="absolute inline-flex h-8 w-8 rounded-full bg-teal-500/20 border border-teal-500/30 animate-ping opacity-75"></span>
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border-2 transition-all duration-300 relative z-10 ${
                            ev.done 
                              ? c.dot 
                              : isNextStage
                                ? "bg-teal-50/50 border-teal-500 text-teal-600 shadow-sm shadow-teal-50 animate-pulse"
                                : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}>
                            {ev.done ? "✓" : idx + 1}
                          </div>
                        </div>
                        {!isLast && (
                          <div className={`w-[2px] flex-grow mt-1 mb-1 transition-all duration-300 ${lineActive ? c.line : "bg-slate-200"}`} />
                        )}
                      </div>

                      <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"} min-w-0`}>
                        <div className="flex flex-col gap-1.5 text-left w-full min-w-0">
                          <div className="min-w-0">
                            <p className={`text-xs font-extrabold transition-colors duration-200 ${
                              ev.done 
                                ? "text-slate-800" 
                                : isNextStage 
                                  ? "text-teal-700 font-black" 
                                  : "text-slate-400"
                            } truncate`}>{ev.label}</p>
                            {ev.sub && (
                              <p className={`text-[10px] font-semibold mt-0.5 transition-colors duration-200 leading-normal ${
                                ev.done 
                                  ? c.sub 
                                  : isNextStage 
                                    ? "text-teal-600/80" 
                                    : "text-slate-400"
                              }`}>{ev.sub}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {ev.amount && (
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border transition-all duration-200 ${
                                ev.done 
                                  ? c.badge 
                                  : isNextStage 
                                    ? "bg-teal-50/40 border-teal-150 text-teal-600" 
                                    : "bg-slate-50 border-slate-200 text-slate-400"
                              }`}>{ev.amount}</span>
                            )}
                            <span className={`text-[10px] font-semibold whitespace-nowrap transition-colors duration-200 ${
                              isNextStage ? "text-teal-600 font-bold" : "text-slate-400"
                            }`}>
                              {ev.date ? new Date(ev.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Banners and Main Content Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
        {activeContract?.status === "Hired" && job.project_type !== "Hourly" && (
          <div className="bg-amber-50 border border-amber-205 text-amber-800 p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 mb-2 leading-relaxed text-left">
            <i className="fa-solid fa-circle-info text-amber-600 mt-0.5 shrink-0 text-sm"></i>
            <span>
              <strong>Hired! Escrow funded.</strong> We are awaiting the freelancer to start work on this contract. You can cancel and receive a full refund of your escrow before work starts. Milestone releases are locked until work begins.
            </span>
          </div>
        )}

        {/* 5. Main Content Area */}
        {job.project_type === "Hourly" ? (
          <div className="border-t border-slate-105 pt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-855 uppercase tracking-wider">Timecard activities</h3>
              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/80">
                Hours served: {hoursServedStr}
              </span>
            </div>

            <div className="flex border-b border-slate-200/80">
              <button
                onClick={() => setActiveTimecardTab("activities")}
                className={`flex-grow py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                  activeTimecardTab === "activities"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-400 hover:text-slate-655"
                }`}
              >
                <FiBriefcase className="w-4 h-4" />
                <span>View activity</span>
              </button>
              <button
                onClick={() => setActiveTimecardTab("invoices")}
                className={`flex-grow py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
                  activeTimecardTab === "invoices"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-400 hover:text-slate-655"
                }`}
              >
                <FiFileText className="w-4 h-4" />
                <span>Invoices</span>
              </button>
            </div>

            {activeTimecardTab === "activities" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2.5 items-center">
                  {userRole === "freelancer" && activeContract?.status !== "Completed" && activeContract?.status !== "Cancelled" && activeContract?.status !== "CANCELLED" && (
                    <button
                      onClick={() => {
                        setNewTimecardDate(new Date().toISOString().substring(0, 10));
                        setNewTimecardHours("");
                        setNewTimecardMinutes("");
                        setNewTimecardDescription("");
                        setShowTimecardModal(true);
                      }}
                      className="text-[10px] font-black text-primary hover:text-primary-hover border border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 px-4.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <span>+ Log working hours</span>
                    </button>
                  )}

                  {userRole === "freelancer" && selectedPendingTimecards.length > 0 && activeContract?.status !== "Completed" && activeContract?.status !== "Cancelled" && activeContract?.status !== "CANCELLED" && (
                    <button
                      onClick={handleRequestPayment}
                      disabled={timecardActionLoadingId === -1}
                      className="text-[10px] font-black text-white bg-primary hover:bg-primary-hover px-4.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-0 shadow-sm disabled:opacity-50"
                    >
                      {timecardActionLoadingId === -1 ? (
                        <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          <span>Request Payment for Selected ({selectedPendingTimecards.length})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {loadingTimecards ? (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <div className="w-4 h-4 border-2 border-t-primary border-slate-200/60 rounded-full animate-spin"></div>
                    <span className="text-slate-400 text-xxs font-bold">Loading timecards...</span>
                  </div>
                ) : timecards.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 border border-slate-200/40 rounded-xl">
                    <p className="text-xs font-bold text-slate-400">No timecard activities logged yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {timecards.map((tc: any, idx: number) => {
                      const formattedDate = new Date(tc.work_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      });
                      const isPending = tc.status === "Pending";
                      const isSelected = selectedPendingTimecards.includes(tc.timecard_id);

                      return (
                        <div key={idx} className="bg-white border border-slate-205/85 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-350 transition-all text-left">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {userRole === "freelancer" && isPending && activeContract?.status !== "Completed" && activeContract?.status !== "Cancelled" && activeContract?.status !== "CANCELLED" && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPendingTimecards(prev => [...prev, tc.timecard_id]);
                                  } else {
                                    setSelectedPendingTimecards(prev => prev.filter(id => id !== tc.timecard_id));
                                  }
                                }}
                                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer mt-1 shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{formattedDate}</span>
                              <h5 className="text-xs font-extrabold text-slate-808 mt-1 flex items-center gap-2">
                                <span>{tc.hours}h {tc.minutes}m worked</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                  tc.status === "Paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : tc.status === "Requested"
                                      ? "bg-amber-50 text-amber-700 border-amber-100"
                                      : tc.status === "Declined"
                                        ? "bg-rose-50 text-rose-700 border-rose-100"
                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                }`}>
                                  {tc.status === "Pending" ? "Logged" : tc.status}
                                </span>
                              </h5>
                              <p className="text-[11px] text-slate-505 font-medium mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                {tc.description || "No description provided."}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Amount</span>
                              <span className="text-xs font-black text-slate-808">${parseFloat(tc.amount).toFixed(2)}</span>
                            </div>
                            {userRole === "client" && tc.status === "Requested" && activeContract?.status !== "Completed" && activeContract?.status !== "Cancelled" && activeContract?.status !== "CANCELLED" && (
                              <div className="flex flex-col gap-1.5 items-end">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const amount = parseFloat(tc.amount);
                                      if (amount > parseFloat(activeContract.budget || 0)) {
                                        setPayingTimecard(tc);
                                      } else {
                                        if (confirm(`Approve and release payment of $${amount.toFixed(2)} for this timecard?`)) {
                                          handleApproveTimecard(tc.timecard_id, amount);
                                        }
                                      }
                                    }}
                                    disabled={timecardActionLoadingId === tc.timecard_id}
                                    className="bg-emerald-600 hover:bg-emerald-750 text-white text-[10px] font-black px-3.5 py-2 rounded-lg border-0 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5 animate-fadeIn"
                                  >
                                    {timecardActionLoadingId === tc.timecard_id ? (
                                      <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    ) : (
                                      <>
                                        <FiCheck className="w-3 h-3" />
                                        <span>Approve</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to decline the payment request for this timecard?`)) {
                                        handleDeclineTimecard(tc.timecard_id);
                                      }
                                    }}
                                    disabled={timecardActionLoadingId === tc.timecard_id}
                                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-655 text-[10px] font-black px-3.5 py-2 rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5 animate-fadeIn"
                                  >
                                    <span>Decline</span>
                                  </button>
                                </div>
                                <span className="text-[8px] font-semibold text-slate-455">
                                  Read above mentioned details before doing any action
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTimecardTab === "invoices" && (
              <div className="flex flex-col gap-3">
                {timecards.filter(tc => tc.status === "Paid").length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/50 border border-slate-200/40 rounded-xl">
                    <p className="text-xs font-bold text-slate-400">No paid invoices generated yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {timecards.filter(tc => tc.status === "Paid").map((tc: any, idx: number) => {
                      const formattedDate = new Date(tc.work_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      });
                      return (
                        <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-slate-350 transition-all text-left shadow-xxs">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice INV-{tc.timecard_id}</span>
                            <h5 className="text-xs font-black text-slate-800 mt-1">Paid on {formattedDate}</h5>
                            <p className="text-[10px] text-slate-455 font-semibold mt-0.5">{tc.hours}h {tc.minutes}m served</p>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="text-xs font-black text-emerald-600 block">${parseFloat(tc.amount).toFixed(2)}</span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <button
                                onClick={() => {
                                  setSelectedInvoiceItem({
                                    type: "timecard",
                                    id: tc.timecard_id,
                                    title: `Hourly Work (${tc.hours}h ${tc.minutes}m)`,
                                    amount: parseFloat(tc.amount),
                                    date: tc.updated_at || tc.created_at,
                                    hours: tc.hours,
                                    minutes: tc.minutes,
                                    description: tc.description || "Logged working hours payment release."
                                  });
                                  setShowInvoiceModal(true);
                                }}
                                className="text-[9px] font-extrabold text-primary hover:text-primary-hover hover:underline bg-transparent border-0 cursor-pointer p-0"
                              >
                                View Invoice
                              </button>
                              {userRole === "freelancer" && (
                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 select-none">
                                  <span>•</span>
                                  <span>Platform service fee was deducted from payout</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-extrabold text-slate-455 uppercase tracking-wider mb-1">Milestones Checklist</h4>
            {(() => {
              return milestoneList.map((m: any, idx: number) => {
                const isCompleted = activeContract
                  ? (m.status === "Completed" || m.payment_status === "Paid")
                  : m.completed;
                
                const hasIncompleteBefore = milestoneList.some((x: any) => {
                  return x.milestone_id < m.milestone_id && x.payment_status !== "Paid";
                });
                const isNextToFund = m.payment_status === "Pending" && !hasIncompleteBefore;
                let feedbackText = m.revision_feedback || "";
              let filesList: { name: string; url: string }[] = [];
              let historyList: any[] = [];
              
              if (feedbackText.trim().startsWith("[")) {
                try {
                  const parsed = JSON.parse(feedbackText);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    historyList = parsed;
                    const latest = parsed[parsed.length - 1];
                    feedbackText = latest.feedback;
                    filesList = latest.files || [];
                  }
                } catch (e) {}
              } else {
                try {
                  filesList = m.revision_submitted_files ? JSON.parse(m.revision_submitted_files) : [];
                } catch (e) {}
              }

              const isPaid = activeContract
                ? m.payment_status === "Paid"
                : m.paid;

              return (
                <div key={idx} className="flex flex-col gap-3">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xxs hover:border-slate-350 transition-all text-left">
                    <div className="flex items-start gap-3 min-w-0 flex-1 w-full sm:w-auto">
                      <div 
                        className={`flex items-center justify-center w-5 h-5 mt-0.5 select-none flex-shrink-0 ${activeContract ? "" : "cursor-pointer"}`}
                        onClick={() => {
                          if (!activeContract) {
                            handleToggleMilestone(m.id || m.title, 'completed');
                          }
                        }}
                      >
                        {isCompleted ? (
                          <FiCheckCircle className={`w-5 h-5 flex-shrink-0 ${isPaid ? "text-emerald-500" : "text-amber-500"}`} />
                        ) : (
                          <FiCircle className={`w-5 h-5 flex-shrink-0 text-slate-300 hover:text-slate-400 transition-colors`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className={`text-xs font-extrabold truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-808'}`}>
                          {m.title}
                        </h5>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xxs font-bold text-slate-400">${parseFloat(m.amount).toLocaleString()}</span>
                          {(m.status !== "Pending" || historyList.length > 0) && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedRevisionHistoryId(expandedRevisionHistoryId === m.milestone_id ? null : m.milestone_id);
                              }}
                              className="text-[9px] bg-slate-50 hover:bg-slate-100 hover:text-primary hover:border-primary/30 text-slate-500 px-1.5 py-0.5 rounded-md font-bold border border-slate-200/50 flex items-center gap-1 cursor-pointer transition-all select-none"
                            >
                              <i className="fa-solid fa-rotate-left text-[8px]" /> Revisions: {historyList.length} / {activeContract ? activeContract.revisions_limit || "3" : "3"}
                            </button>
                          )}
                          {isCompleted && !isPaid && (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-100">
                              PENDING RELEASE
                            </span>
                          )}
                          {isPaid && userRole === "freelancer" && (
                            <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 select-none">
                              <span>•</span>
                              <span>Platform service fee was deducted</span>
                            </span>
                          )}
                        </div>
                        {m.description && (
                          <p className="text-[10px] text-slate-500 font-medium mt-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 whitespace-pre-wrap leading-relaxed">
                            {m.description}
                          </p>
                        )}

                        {m.submitted_files && (() => {
                          let filesList: { name: string; url: string }[] = [];
                          try {
                            filesList = JSON.parse(m.submitted_files);
                          } catch (e) {
                            if (m.submitted_files.includes("http")) {
                              filesList = m.submitted_files.split(",").map((url: string) => ({ name: "Submitted Deliverable", url }));
                            }
                          }
                          if (filesList.length === 0) return null;
                          return (
                            <div className="mt-2 bg-emerald-50/20 border border-emerald-100/50 rounded-lg p-2.5 w-full">
                              <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider block mb-1">Submitted Files</span>
                              <div className="flex flex-col gap-1">
                                {filesList.map((file, fIdx) => (
                                  <div key={fIdx} className="flex justify-between items-center bg-white border border-emerald-100/30 rounded p-1.5 text-[10px] font-semibold">
                                    <span className="text-slate-700 truncate max-w-[200px]">{file.name}</span>
                                    <a 
                                      href={resolveDownloadUrl(file.url)} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-primary hover:underline hover:text-primary-dark font-bold ml-2 text-[9px]"
                                    >
                                      View File
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100/80 shrink-0">
                      {activeContract && activeContract.status !== "Cancelled" && (
                        <>
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceItem({
                                  type: "milestone",
                                  id: m.milestone_id,
                                  title: m.title,
                                  amount: parseFloat(m.amount),
                                  date: m.paid_at || m.updated_at || activeContract.updated_at,
                                  description: m.description || `Escrow release for milestone deliverable: ${m.title}`
                                });
                                setShowInvoiceModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 text-center shadow-xs"
                            >
                              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">PAID</span>
                              <span className="text-slate-300 text-[9px]">•</span>
                              <span className="text-[9px] font-extrabold text-primary hover:underline">Invoice</span>
                            </button>
                          ) : userRole === "freelancer" ? (
                            m.status === "Under Review" ? (
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                <FiClock className="w-3 h-3 text-amber-500" /> Under Review
                              </span>
                            ) : m.revision_status === "Pending Acceptance" ? (
                              <div className="flex flex-col gap-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 text-left max-w-[320px] ml-auto w-full">
                                <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider">Revision Requested by Client</span>
                                <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-0.5 whitespace-pre-wrap">{feedbackText}</p>
                                {filesList.length > 0 && (
                                  <div className="mt-1 flex flex-col gap-1">
                                    {filesList.map((file, fIdx) => (
                                      <a key={fIdx} href={resolveDownloadUrl(file.url)} target="_blank" rel="noreferrer" className="text-[9px] text-primary font-bold hover:underline">
                                        📎 {file.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                                <div className="border-t border-amber-100/50 pt-2.5 mt-1.5 flex flex-col gap-2">
                                  <div className="flex justify-between text-[9px] font-bold text-slate-455 uppercase">
                                    <span>Remaining Free Revisions:</span>
                                    <span className="text-slate-800 font-extrabold">
                                      {Math.max(0, parseInt(activeContract.revisions_limit || "3") - parseInt(m.revision_count || "0"))}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                  {(() => {
                                    const remainingFree = parseInt(activeContract.revisions_limit || "3") - parseInt(m.revision_count || "0");
                                    return (
                                      <div className="flex gap-2 w-full">
                                        {remainingFree > 0 ? (
                                          <div className="flex gap-2 w-full">
                                            <button
                                              onClick={() => handleAcceptRevision(m.milestone_id, 0)}
                                              disabled={milestoneActionLoading}
                                              className="flex-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 text-center"
                                            >
                                              Accept (Free)
                                            </button>
                                            <button
                                              onClick={() => setShowDisputeModal(true)}
                                              className="flex-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 py-1.5 rounded-lg cursor-pointer transition-all text-center"
                                            >
                                              File a Dispute
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col gap-2 w-full">
                                            <div className="flex gap-1.5 w-full">
                                              <input
                                                type="number"
                                                placeholder="Fee ($)"
                                                min={0}
                                                value={customRevisionFee}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val !== "" && parseFloat(val) < 0) return;
                                                  setCustomRevisionFee(val);
                                                }}
                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-center text-[10px] font-bold focus:outline-none focus:border-primary/40 min-w-0"
                                              />
                                              <button
                                                onClick={() => {
                                                  const feeVal = parseFloat(customRevisionFee);
                                                  if (isNaN(feeVal) || feeVal < 0) {
                                                    alert("Please enter a valid extra fee (0 or greater).");
                                                    return;
                                                  }
                                                  handleAcceptRevision(m.milestone_id, feeVal);
                                                  setCustomRevisionFee("");
                                                }}
                                                disabled={milestoneActionLoading || customRevisionFee === ""}
                                                className="text-[10px] font-black text-white bg-primary hover:bg-primary-hover px-3.5 py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 border-0 shrink-0"
                                              >
                                                Set Fee
                                              </button>
                                            </div>
                                            <button
                                              onClick={() => setShowDisputeModal(true)}
                                              className="w-full text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 py-1.5 rounded-lg cursor-pointer transition-all text-center"
                                            >
                                              File a Dispute
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  </div>
                                </div>
                              </div>
                            ) : m.revision_status === "Awaiting Funding" ? (
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-250 px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                <FiClock className="w-3 h-3 text-amber-500" /> Awaiting Client Funding (${parseFloat(m.extra_revision_fee || "0").toFixed(2)})
                              </span>
                            ) : m.payment_status === "Pending" ? (
                              <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                                  isNextToFund
                                    ? "text-amber-700 bg-amber-50 border-amber-200"
                                    : "text-slate-400 bg-slate-50 border-slate-200"
                                }`}>
                                  <FiClock className={`w-3.5 h-3.5 ${isNextToFund ? "text-amber-500" : "text-slate-400"}`} />
                                  {isNextToFund ? "Awaiting Escrow Funding" : "Awaiting Prior Funding"}
                                </span>
                                {isNextToFund && (
                                  <button
                                    onClick={() => {
                                      setConfirmFundingMilestoneId(m.milestone_id);
                                    }}
                                    className="text-[9px] font-extrabold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg cursor-pointer border-0 shadow-sm transition-all"
                                  >
                                    Request Escrow Funding
                                  </button>
                                )}
                              </div>
                            ) : (
                              (activeContract.status === "Work Started" || activeContract.status === "In Progress") && (
                                <button
                                  onClick={() => {
                                    setSubmittingMilestoneId(m.milestone_id);
                                    setMilestoneFiles([]);
                                  }}
                                  disabled={milestoneActionLoading}
                                  className="text-[10px] font-extrabold text-primary bg-primary/[0.04] border border-primary/20 hover:bg-primary/[0.08] px-3 py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                                >
                                  {m.revision_status === "In Progress" ? "Submit Revision work" : "Submit Deliverable"}
                                </button>
                              )
                            )
                          ) : userRole === "client" ? (
                            m.payment_status === "Pending" ? (
                              isNextToFund ? (
                                <div className="flex flex-col gap-2 bg-amber-50/50 border border-amber-100/60 rounded-xl p-3.5 text-left max-w-[320px] ml-auto w-full">
                                  <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">Escrow Funding Required</span>
                                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                                    This milestone must be funded before the freelancer can begin work.
                                  </p>
                                  <button
                                    onClick={() => {
                                      setActivePaymentModal({
                                        type: "milestone",
                                        id: m.milestone_id,
                                        amount: parseFloat(m.amount),
                                        title: m.title
                                      });
                                      setModalPayMethod("stripe");
                                      setModalPayError("");
                                    }}
                                    disabled={milestoneActionLoading}
                                    className="w-full bg-amber-600 hover:bg-amber-755 text-white text-[10px] font-extrabold py-1.5 rounded-lg shadow-sm border-0 cursor-pointer text-center"
                                  >
                                    Fund Milestone (${parseFloat(m.amount).toFixed(2)})
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                  <FiClock className="w-3 h-3 text-slate-400" /> Awaiting prior milestone completion
                                </span>
                              )
                            ) : m.status === "Under Review" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReleaseMilestone(m.milestone_id, m.title, parseFloat(m.amount))}
                                  disabled={milestoneActionLoading}
                                  className="text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-750 px-3 py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 border-0 shadow-sm"
                                >
                                  Approve & Pay
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveRevisionId(m.milestone_id);
                                    setMilestoneFeedback("");
                                    setMilestoneFeedbackFiles([]);
                                  }}
                                  disabled={milestoneActionLoading}
                                  className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                                >
                                  Request Revision
                                </button>
                              </div>
                            ) : m.revision_status === "Pending Acceptance" ? (
                              <div className="flex flex-col gap-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 text-left max-w-[320px] ml-auto w-full">
                                <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <FiClock className="w-3 h-3 text-amber-500" /> Awaiting Freelancer Acceptance
                                </span>
                                <p className="text-[10px] text-slate-650 font-semibold leading-relaxed mt-0.5 whitespace-pre-wrap">{feedbackText}</p>
                                {filesList.length > 0 && (
                                  <div className="mt-1 flex flex-col gap-1">
                                    {filesList.map((file, fIdx) => (
                                      <a key={fIdx} href={resolveDownloadUrl(file.url)} target="_blank" rel="noreferrer" className="text-[9px] text-primary font-bold hover:underline">
                                        📎 {file.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : m.revision_status === "Awaiting Funding" ? (
                                      <div className="flex flex-col gap-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 text-left max-w-[320px] ml-auto w-full">
                                <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">Paid Revision Proposal</span>
                                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                                  Freelancer has accepted the revision but requested an extra fee of <strong className="text-slate-800">${parseFloat(m.extra_revision_fee).toFixed(2)}</strong> because the free revisions limit ({activeContract.revisions_limit}) was reached.
                                </p>
                                <div className="flex flex-col gap-2 w-full">
                                   <div className="flex gap-2 w-full">
                                     <button
                                        onClick={() => {
                                          setActivePaymentModal({
                                            type: "revision",
                                            id: m.milestone_id,
                                            amount: parseFloat(m.extra_revision_fee),
                                            title: `Revision for: ${m.title}`
                                          });
                                          setModalPayMethod("stripe");
                                          setModalPayError("");
                                        }}
                                        disabled={milestoneActionLoading}
                                        className="flex-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-extrabold py-1.5 rounded-lg shadow-sm border-0 cursor-pointer text-center"
                                      >
                                        Fund (${parseFloat(m.extra_revision_fee).toFixed(2)})
                                      </button>
                                      <button
                                        onClick={() => handleRejectRevisionProposal(m.milestone_id)}
                                        disabled={milestoneActionLoading}
                                        className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-600 text-[10px] font-extrabold py-1.5 rounded-lg cursor-pointer transition-all text-center"
                                      >
                                        Decline
                                      </button>
                                   </div>
                                   <button
                                      onClick={() => setShowDisputeModal(true)}
                                      className="w-full text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 py-1.5 rounded-lg cursor-pointer transition-all text-center"
                                    >
                                      File a Dispute
                                    </button>
                                 </div>
                              </div>
                            ) : m.revision_status === "In Progress" ? (
                              <div className="flex flex-col gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-left max-w-[320px] ml-auto w-full">
                                <span className="text-[9px] font-black text-primary uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                  <FiClock className="w-3 h-3 text-primary" /> Revision in Progress
                                </span>
                                <p className="text-[10px] text-slate-650 font-semibold leading-relaxed mt-0.5 whitespace-pre-wrap">{feedbackText}</p>
                                {filesList.length > 0 && (
                                  <div className="mt-1 flex flex-col gap-1">
                                    {filesList.map((file, fIdx) => (
                                      <a key={fIdx} href={resolveDownloadUrl(file.url)} target="_blank" rel="noreferrer" className="text-[9px] text-primary font-bold hover:underline">
                                        📎 {file.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                <FiClock className="w-3 h-3 text-slate-400" /> Awaiting Work
                              </span>
                            )
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {activeRevisionId === m.milestone_id && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 text-left animate-fadeIn">
                      <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider block">Submit Revision Request</span>
                      {parseInt(m.revision_count || "0") >= parseInt(activeContract.revisions_limit || "3") && (
                        <div className="bg-amber-50 border border-amber-200/50 rounded-lg p-2.5 text-[10px] text-amber-800 font-semibold leading-normal flex items-start gap-1.5 shadow-xxs">
                          <i className="fa-solid fa-circle-exclamation text-amber-600 mt-0.5" />
                          <span>Note: The free revision limit has been reached ({activeContract.revisions_limit || "3"}). The freelancer may request an additional fee to complete this revision.</span>
                        </div>
                      )}
                      <textarea
                        value={milestoneFeedback}
                        onChange={(e) => setMilestoneFeedback(e.target.value)}
                        rows={3}
                        placeholder="Provide detailed feedback on what needs to be changed or fixed before releasing payment..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-550"
                      />
                      
                      <div className="flex items-center gap-3">
                        <label className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all border-0 shadow-sm flex items-center gap-1.5 select-none">
                          <i className="fa-solid fa-plus text-xs"></i>
                          <span>Add Reference File</span>
                          <input 
                            type="file" 
                            multiple 
                            onChange={handleUploadFeedbackFile} 
                            disabled={isFeedbackUploading}
                            className="hidden" 
                          />
                        </label>
                        {isFeedbackUploading && (
                          <span className="text-[10px] text-slate-400 font-semibold italic animate-pulse">Uploading...</span>
                        )}
                      </div>

                      {milestoneFeedbackFiles.length > 0 && (
                        <div className="border-t border-slate-200/60 pt-2 flex flex-col gap-1.5">
                          {milestoneFeedbackFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 text-[10px]">
                              <span className="font-semibold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                              <button 
                                type="button"
                                onClick={() => setMilestoneFeedbackFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-650 hover:text-rose-805 font-bold bg-transparent border-0 cursor-pointer text-[10px]"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

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
                  {m.revision_feedback && expandedRevisionHistoryId === m.milestone_id && (
                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 flex flex-col gap-4 text-left animate-fadeIn mt-2 w-full">
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <i className="fa-solid fa-clock-rotate-left text-slate-500 text-sm" /> Revision Logs & History
                        </span>
                        <span className="text-[10px] bg-slate-200/80 text-slate-600 px-3 py-1 rounded-full font-black border border-slate-300/30">
                          {historyList.length} Request(s)
                        </span>
                      </div>
                      
                      <div className="relative pl-7 flex flex-col gap-4 before:content-[''] before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-200">
                        {(() => {
                          let hList = historyList;
                          if (hList.length === 0 && m.revision_feedback) {
                            hList = [{
                              revision_number: 1,
                              feedback: m.revision_feedback,
                              files: filesList,
                              timestamp: m.updated_at
                            }];
                          }
                          
                          return hList.slice().reverse().map((hist: any, hIdx: number) => {
                            const formattedDate = hist.timestamp ? new Date(hist.timestamp).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "";
                            
                            const isAccordionOpen = activeRevisionAccordionId 
                              ? activeRevisionAccordionId === `${m.milestone_id}-${hist.revision_number}`
                              : hIdx === 0;

                            return (
                              <div key={hIdx} className="relative flex flex-col gap-1 w-full animate-fadeIn">
                                {/* Timeline Bullet Indicator */}
                                <div 
                                  className={`absolute -left-7 top-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all duration-300 z-10 select-none ${
                                    isAccordionOpen 
                                      ? "border-primary bg-primary text-white shadow-sm scale-110" 
                                      : "border-slate-300 bg-white text-slate-500 hover:border-slate-400"
                                  }`}
                                >
                                  {hist.revision_number}
                                </div>

                                {/* Accordion Step Card */}
                                <div className="w-full">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isAccordionOpen) {
                                        setActiveRevisionAccordionId("none");
                                      } else {
                                        setActiveRevisionAccordionId(`${m.milestone_id}-${hist.revision_number}`);
                                      }
                                    }}
                                    className="w-full flex justify-between items-center text-left px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 hover:bg-slate-50/50 transition-all cursor-pointer shadow-xxs border-solid"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="text-xs font-black text-slate-800 truncate">Revision Step #{hist.revision_number}</span>
                                      <span className="text-[9px] text-slate-400 font-extrabold bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md normal-case shrink-0">{formattedDate}</span>
                                    </div>
                                    <i className={`fa-solid ${isAccordionOpen ? "fa-chevron-up text-primary" : "fa-chevron-down text-slate-400"} text-[9px] transition-transform duration-300 shrink-0`} />
                                  </button>

                                  <div 
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                      isAccordionOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                                    }`}
                                  >
                                    <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-left animate-fadeIn">
                                      <p className="text-xs text-slate-650 font-medium leading-relaxed whitespace-pre-wrap">{hist.feedback}</p>
                                      {hist.files && hist.files.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-2">Reference Attachments</span>
                                          <div className="flex flex-wrap gap-2">
                                            {hist.files.map((file: any, fIdx: number) => (
                                              <a 
                                                key={fIdx} 
                                                href={resolveDownloadUrl(file.url)} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-primary px-3 py-1.5 rounded-lg transition-all no-underline shadow-xxs cursor-pointer"
                                              >
                                                <i className="fa-solid fa-paperclip text-[10px] text-slate-400" />
                                                <span className="truncate max-w-[200px]">{file.name}</span>
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
          </div>
        )
      }

      {activeContract && activeContract.submitted_files && (() => {
        let filesList: { name: string; url: string }[] = [];
        try {
          filesList = JSON.parse(activeContract.submitted_files);
        } catch (e) {
          if (activeContract.submitted_files.includes("http")) {
            filesList = activeContract.submitted_files.split(",").map((url: string) => ({ name: "Submitted Deliverable", url }));
          }
        }
        if (filesList.length === 0) return null;
        return (
          <div className="w-full text-left bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mt-6">
            <h5 className="text-xs font-black text-emerald-800 mb-1.5 flex items-center gap-1.5 font-bold">
              <i className="fa-solid fa-file-shield text-emerald-600"></i>
              Submitted Project Deliverables / Documents
            </h5>
            <div className="flex flex-col gap-1.5 mt-2">
              {filesList.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-emerald-100 rounded-lg p-2 text-xs">
                  <span className="font-semibold text-slate-700 truncate max-w-[250px]">{file.name}</span>
                  <a 
                    href={resolveDownloadUrl(file.url)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded shadow-sm hover:shadow transition-all no-underline"
                  >
                    Download / View
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 6. Action Buttons Footer */}
      {activeContract && activeContract.status !== "Cancelled" && activeContract.status !== "Completed" && activeContract.status !== "Disputed" && (
        <div className="border-t border-slate-105 pt-4 flex justify-end gap-3 items-center">
          {userRole === "client" && (activeContract.status === "Work Started" || activeContract.status === "In Progress" || activeContract.status === "Hired") && (
            <div className="flex gap-3">
              {activeContract.status === "Hired" && (
                <button
                  onClick={handleCancelContract}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  Cancel Contract & Refund Escrow
                </button>
              )}
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              >
                File a Dispute
              </button>
            </div>
          )}

          {userRole === "freelancer" && (activeContract.status === "Work Started" || activeContract.status === "In Progress" || activeContract.status === "Hired") && (() => {
            const totalLoggedHours = timecards.reduce((sum, tc) => sum + tc.hours + (tc.minutes / 60), 0);
            const minHoursRequired = job.project_type === "Hourly" ? parseFloat(job.max_hours || 0) : 0;
            const isHoursReqMet = minHoursRequired === 0 || totalLoggedHours >= minHoursRequired;
            const isHired = activeContract.status === "Hired";

            // Validation Checks
            const isSingleMilestone = milestoneList.length <= 1 || (milestoneList.length === 1 && milestoneList[0].title === "Entire Project Scope");
            
            const allMilestonesCompleted = milestoneList.every((m: any) => 
              m.status === 'Completed' || 
              m.payment_status === 'Paid' || 
              m.status === 'Under Review' || 
              m.status === 'Submitted' ||
              m.paid === true ||
              m.completed === true
            );
            
            const isHourly = job.project_type === "Hourly";
            const canSubmitCompletion = isHourly
              ? isHoursReqMet
              : (isSingleMilestone || allMilestonesCompleted);

            const showUploadSection = isHourly || isSingleMilestone || allMilestonesCompleted || isHired;
            if (!showUploadSection) return null;

            return (
              <div className="flex flex-col items-end gap-3 w-full mt-3">
                
                {/* Upload Deliverables Section */}
                {!isHired && (
                  <div className="w-full text-left bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <h5 className="text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5 font-bold">
                      <i className="fa-solid fa-cloud-arrow-up text-teal-650"></i>
                      Upload Project Deliverables / Documents
                    </h5>
                    <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                      Attach completed files, source code links, or final documentation for the client to review before final release.
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[11px] rounded-lg cursor-pointer transition-all border-0 shadow-sm flex items-center gap-1.5">
                        <i className="fa-solid fa-plus text-xs"></i>
                        <span>Add Files</span>
                        <input 
                          type="file" 
                          multiple 
                          onChange={handleUploadFile} 
                          disabled={isUploading}
                          className="hidden" 
                        />
                      </label>
                      {isUploading && (
                        <span className="text-xs text-slate-400 font-semibold italic animate-pulse">Uploading file(s)...</span>
                      )}
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                        <p className="text-[10px] font-black text-slate-450 uppercase mb-1.5 font-bold">Files ready to submit ({uploadedFiles.length})</p>
                        <div className="flex flex-col gap-1.5">
                          {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 text-xs">
                              <span className="font-semibold text-slate-700 truncate max-w-[250px]">{file.name}</span>
                              <button 
                                type="button"
                                onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
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
                )}

                {!isHired && !canSubmitCompletion && (
                  <div className="w-full text-left mt-2">
                    <span className="inline-block text-[10px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100 leading-normal">
                      {isHourly 
                        ? `Requires min ${minHoursRequired} hours logged to submit.` 
                        : "Please submit and complete all milestones before marking the entire project as completed."
                      }
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end items-center gap-3 w-full mt-2">

                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      File a Dispute
                    </button>
                    <button
                      onClick={handleFreelancerCancelContract}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      Cancel Contract & Refund Client
                    </button>
                    {isHired ? (
                      <button
                        onClick={async () => {
                          await startWorkContract(activeContract.contract_id);
                          fetchContracts();
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 border-0 shadow-sm whitespace-nowrap"
                      >
                        <i className="fa-solid fa-play text-xs"></i>
                        <span>Start Work</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitCompletion}
                        disabled={!canSubmitCompletion || isSubmittingCompletion}
                        className="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 border-0 shadow-sm whitespace-nowrap"
                      >
                        <i className="fa-solid fa-circle-check text-xs"></i>
                        <span>Submit Work Completed</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {userRole === "client" && activeContract.status === "Work Completed" && (
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleApproveCompletion}
                disabled={isApprovingCompletion}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 border-0 shadow-sm animate-fadeIn whitespace-nowrap"
              >
                <FiCheckCircle className="w-3.5 h-3.5" /> Approve Completion & Close Project
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                File a Dispute
              </button>
            </div>
          )}

          {userRole === "freelancer" && (activeContract.status === "Work Completed" || activeContract.status === "Under Review") && (
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 ml-auto w-full sm:w-auto">
              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                File a Dispute
              </button>
            </div>
          )}

          {activeContract.status === "Under Review" && userRole === "client" && (
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to approve this work and release all escrow payments to the freelancer? This action cannot be undone.")) {
                    await approveContractPayment(activeContract.contract_id);
                    fetchContracts();
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 border-0 shadow-sm whitespace-nowrap"
              >
                <FiCheckCircle className="w-3.5 h-3.5" /> Accept Work & Release Escrow
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                File a Dispute
              </button>
            </div>
          )}
        </div>
      )}

      {activeContract && activeContract.status === "Completed" && (
        <div className="border-t border-slate-105 pt-4 flex justify-end gap-3">
          <button
            onClick={() => setShowReviewModal(true)}
            className={`px-4 py-2 border rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              userReviewed 
                ? 'bg-slate-105 border-slate-250 text-slate-500' 
                : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <i className="fa-solid fa-star text-xs"></i>
            {userReviewed 
              ? "Your Submitted Review" 
              : (userRole === "client" ? "Rate & Review Freelancer" : "Rate & Review Client")}
          </button>
        </div>
      )}

      </div>
      </div>
      )}



      {/* Modals & Portals */}
      {payingTimecard && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[0.5px] p-4 overflow-y-auto">
          <div className="relative bg-white border border-slate-200 shadow-2xl rounded-xl max-w-md w-full animate-fadeIn overflow-hidden text-left text-slate-800 flex flex-col max-h-[90vh]">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500" />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FiCreditCard className="text-primary text-sm" />
                <h3 className="text-sm font-extrabold text-slate-800">Timecard Payment Required</h3>
              </div>
              <button
                onClick={() => setPayingTimecard(null)}
                className="text-slate-400 hover:text-slate-655 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-1">
              {/* Cost breakdown */}
              {activeContract && (() => {
                const amount = parseFloat(payingTimecard.amount);
                const escrowAvailable = parseFloat(activeContract.budget || 0);
                const escrowPayment = Math.min(escrowAvailable, amount);
                const extraPayment = Math.max(0, amount - escrowAvailable);

                return (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                      <span>Total Timecard Amount</span>
                      <span className="font-extrabold text-slate-800">${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                      <span>Covered by Escrow</span>
                      <span className="font-extrabold text-teal-600">-${escrowPayment.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200/50 pt-2 mt-1">
                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span className="text-primary font-bold">Extra Payment Due Now</span>
                        <span className="font-black text-primary text-base">${extraPayment.toFixed(2)}</span>
                      </div>
                      <p className="text-[9px] text-slate-455 font-semibold mt-2 bg-slate-100 rounded-lg px-2.5 py-2 leading-relaxed">
                        This timecard exceeds the remaining contract escrow. The difference of ${extraPayment.toFixed(2)} will be charged to your payment method.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Payment method selector */}
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Select Payment Method</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["stripe", "paypal", "wallet"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setPayTimecardMethod(m); setPayTimecardError(""); }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                        payTimecardMethod === m
                          ? "border-primary bg-primary/[0.04] text-primary shadow-sm"
                          : "border-slate-150 hover:border-slate-250 bg-white text-slate-500"
                      }`}
                    >
                      {m === "stripe" && <FaCreditCard className={`w-4 h-4 ${payTimecardMethod === m ? "text-primary" : "text-slate-400"}`} />}
                      {m === "paypal" && <FaPaypal className={`w-4 h-4 ${payTimecardMethod === m ? "text-primary" : "text-slate-400"}`} />}
                      {m === "wallet" && <FaWallet className={`w-4 h-4 ${payTimecardMethod === m ? "text-primary" : "text-slate-400"}`} />}
                      <span className="text-[10px] font-black capitalize">{m === "stripe" ? "Card" : m}</span>
                    </button>
                  ))}
                </div>

                {/* Method info hint */}
                <div className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-2 leading-relaxed">
                  {payTimecardMethod === "stripe" && (
                    <span>
                      <strong className="text-slate-700 font-bold">Stripe Card:</strong> You will be redirected to Stripe's secure checkout page.
                    </span>
                  )}
                  {payTimecardMethod === "paypal" && (
                    <span>
                      <strong className="text-slate-700 font-bold">PayPal:</strong> Pays instantly via simulated sandbox integration.
                    </span>
                  )}
                  {payTimecardMethod === "wallet" && (
                    <span>
                      <strong className="text-slate-700 font-bold">Wallet:</strong> Pays instantly from your available LancerFlow balance.
                    </span>
                  )}
                </div>
              </div>

              {payTimecardError && (
                <div className="text-rose-600 text-[10px] font-bold bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  ⚠️ {payTimecardError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-1">
                <button
                  type="button"
                  onClick={() => setPayingTimecard(null)}
                  disabled={payTimecardLoading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTimecardPayment}
                  disabled={payTimecardLoading}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {payTimecardLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-white border-primary/40 rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="text-sm" />
                      <span>Pay & Approve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {showTimecardModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[10000] bg-slate-900/35 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-xl w-full max-w-md overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative">
            <button
              type="button"
              onClick={() => setShowTimecardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 cursor-pointer border-0 bg-transparent"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">Submit your working hours</h3>
            
            <form onSubmit={handleSubmitTimecard} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Work Date</label>
                <input
                  type="date"
                  required
                  value={newTimecardDate}
                  onChange={(e) => setNewTimecardDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hours</label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    placeholder="e.g. 8"
                    value={newTimecardHours}
                    onChange={(e) => setNewTimecardHours(e.target.value)}
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Minutes</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    placeholder="e.g. 30"
                    value={newTimecardMinutes}
                    onChange={(e) => setNewTimecardMinutes(e.target.value)}
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E", "."].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Work Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the tasks completed during these hours..."
                  value={newTimecardDescription}
                  onChange={(e) => setNewTimecardDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTimecard}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-black py-3 rounded-xl border-0 cursor-pointer shadow-md transition-all mt-2 disabled:opacity-50"
              >
                {isSubmittingTimecard ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto"></div>
                ) : (
                  <span>Save activity</span>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Dispute Modal */}
      {showDisputeModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 p-6 shadow-xl animate-fadeIn">
            <h3 className="text-sm font-black text-slate-800 mb-1">Open Dispute</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Request contract mediation</p>
            <form onSubmit={handleRaiseDispute} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Reason for Dispute</label>
                <CustomSelect
                  options={disputeReasons.map((reason) => ({ value: reason, label: reason }))}
                  value={disputeReason}
                  onChange={(val) => setDisputeReason(val)}
                  placeholder="Select a reason"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Describe the Issue</label>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  rows={4}
                  placeholder="Explain why you are raising this dispute. Provide details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary placeholder:text-slate-400"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all border-0 cursor-pointer disabled:opacity-50"
                >
                  {disputeLoading ? "Opening..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Review Modal */}
      {showReviewModal && activeContract && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-[0.5px] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 p-6 shadow-2xl relative animate-scaleIn text-slate-800 text-left">
            
            {/* Sticky Close Icon */}
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-750 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-base shrink-0">
                <i className="fa-solid fa-star"></i>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {userReviewed ? "Your Feedback & Rating" : (userRole === "client" ? "Rate & Review Freelancer" : "Rate & Review Client")}
                </h3>
                <p className="text-slate-400 text-xxs font-semibold">
                  {userReviewed ? "This contract has been reviewed" : "Share your honest contract experience"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-5 mt-4">
              {/* Star Rating Selector */}
              <div className="flex flex-col items-center gap-2 bg-slate-50 border border-slate-200/50 p-4 rounded-xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rating Choice</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={userReviewed}
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-all ${userReviewed ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
                    >
                      <i className={`fa-star ${star <= reviewRating ? 'fa-solid text-amber-500' : 'fa-regular text-slate-300'}`}></i>
                    </button>
                  ))}
                </div>
                <span className="text-xxs font-bold text-slate-600">
                  {reviewRating === 5 && "⭐ Outstanding / Exceeded Expectations!"}
                  {reviewRating === 4 && "⭐ Great / High Quality Work!"}
                  {reviewRating === 3 && "⭐ Satisfactory / Met Requirements"}
                  {reviewRating === 2 && "⭐ Needs Improvement"}
                  {reviewRating === 1 && "⭐ Poor Quality / Very Dissatisfied"}
                </span>
              </div>

              {/* Comment Text Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Written Feedback</label>
                <textarea
                  value={reviewComment}
                  disabled={userReviewed}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder={userRole === "client" ? "Describe the freelancer's performance, communication, and work quality..." : "Describe the client's clarity, communication, and payments..."}
                  className="w-full bg-slate-50 border border-slate-250 hover:border-slate-355 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl p-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-primary placeholder:text-slate-400 resize-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-1 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer"
                >
                  Close
                </button>
                {!userReviewed && (
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md border-0 cursor-pointer disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {reviewLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        Submit Feedback
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Submit Milestone Work Deliverables Modal */}
      {submittingMilestoneId !== null && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[0.5px] p-4 overflow-y-auto">
          <div className="relative bg-white border border-slate-200 shadow-2xl rounded-xl max-w-md w-full animate-fadeIn overflow-hidden text-left text-slate-800">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500" />

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFileText className="text-primary text-sm" />
                <h3 className="text-sm font-extrabold text-slate-800">Submit Milestone Deliverables</h3>
              </div>
              <button
                onClick={() => {
                  setSubmittingMilestoneId(null);
                  setMilestoneFiles([]);
                }}
                className="text-slate-400 hover:text-slate-650 font-bold text-xs bg-transparent border-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2 text-left">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Milestone details</span>
                {(() => {
                  const currentM = milestoneList.find((m: any) => m.milestone_id === submittingMilestoneId);
                  return (
                    <div>
                      <h4 className="text-xs font-bold text-slate-850">{currentM?.title || "Milestone Deliverable"}</h4>
                      <p className="text-[10px] text-primary font-extrabold mt-0.5">${parseFloat(currentM?.amount || "0").toLocaleString()}</p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 font-bold">Upload Files / Deliverables</h5>
                <div className="flex items-center gap-3">
                  <label className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-[11px] rounded-xl cursor-pointer transition-all border-0 shadow-sm flex items-center gap-1.5 select-none">
                    <i className="fa-solid fa-plus text-xs"></i>
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
                  onClick={() => handleSubmitMilestone(submittingMilestoneId, milestoneFiles)}
                  disabled={milestoneActionLoading || isMilestoneUploading}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 border-0"
                >
                  {milestoneActionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-white border-primary/40 rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="text-sm" />
                      <span>Submit Milestone</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && activeContract && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/40 flex items-center justify-center p-4 print:p-0 print:bg-white">
          <style dangerouslySetInnerHTML={{__html: `
            #printable-invoice-area .p-5 {
              padding: 20px !important;
            }
            #printable-invoice-area .px-5 {
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
            #printable-invoice-area .py-3 {
              padding-top: 12px !important;
              padding-bottom: 12px !important;
            }
            #printable-invoice-area .p-3\\.5 {
              padding: 14px !important;
            }
            #printable-invoice-area .p-2\\.5 {
              padding: 10px !important;
            }
            #printable-invoice-area .mb-4 {
              margin-bottom: 16px !important;
            }
            #printable-invoice-area .mb-2 {
              margin-bottom: 8px !important;
            }
            #printable-invoice-area .mt-1 {
              margin-top: 4px !important;
            }
            #printable-invoice-area .mt-2 {
              margin-top: 8px !important;
            }
            #printable-invoice-area .rounded-xl {
              border-radius: 12px !important;
            }
            #printable-invoice-area .rounded-lg {
              border-radius: 8px !important;
            }
            #printable-invoice-area .gap-4 {
              gap: 16px !important;
            }
            #printable-invoice-area .gap-3 {
              gap: 12px !important;
            }
            #printable-invoice-area .gap-2 {
              gap: 8px !important;
            }
            #printable-invoice-area .gap-1\\.5 {
              gap: 6px !important;
            }
            #printable-invoice-area .gap-1 {
              gap: 4px !important;
            }
            #printable-invoice-area .px-2\\.5 {
              padding-left: 10px !important;
              padding-right: 10px !important;
            }
            #printable-invoice-area .py-0\\.5 {
              padding-top: 2px !important;
              padding-bottom: 2px !important;
            }
            #printable-invoice-area .px-1\\.5 {
              padding-left: 6px !important;
              padding-right: 6px !important;
            }
            #printable-invoice-area .py-0\\.2 {
              padding-top: 1px !important;
              padding-bottom: 1px !important;
            }
            #printable-invoice-area .border-slate-100 {
              border-color: #f1f5f9 !important;
            }
            #printable-invoice-area .border-slate-150 {
              border-color: #e2e8f0 !important;
            }
            #printable-invoice-area .border-slate-200\\/80 {
              border-color: rgba(226, 232, 240, 0.8) !important;
            }
            #printable-invoice-area .border-slate-200 {
              border-color: #e2e8f0 !important;
            }
            #printable-invoice-area .border-slate-250 {
              border-color: #cbd5e1 !important;
            }

            /* Fix for vertical text clipping (html2canvas line-height / overflow issue) */
            #printable-invoice-area span,
            #printable-invoice-area p,
            #printable-invoice-area h1,
            #printable-invoice-area h2,
            #printable-invoice-area h3,
            #printable-invoice-area h4,
            #printable-invoice-area h5,
            #printable-invoice-area h6,
            #printable-invoice-area td,
            #printable-invoice-area th {
              overflow: visible !important;
              line-height: 1.4 !important;
            }

            /* Width and layout fixes for total summary */
            #printable-invoice-area .w-64 {
              width: 256px !important;
            }
            #printable-invoice-area .grid-cols-2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
            }
            #printable-invoice-area .text-right {
              text-align: right !important;
            }

            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                background: #ffffff !important;
                overflow: visible !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-invoice-area, #printable-invoice-area * {
                visibility: visible;
              }
              #printable-invoice-area {
                position: absolute;
                top: 0;
                left: 0;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                box-shadow: none !important;
                border: none !important;
              }
              .print\:hidden {
                display: none !important;
              }
            }
          `}} />
          
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] border border-slate-200/80 shadow-2xl flex flex-col relative overflow-hidden animate-fadeIn print:shadow-none print:border-none print:max-w-none print:max-h-none"
          >
            {/* Non-scrollable Header Bar */}
            <div className="flex justify-end p-2 border-b border-slate-100 shrink-0 print:hidden bg-slate-50/50">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg p-1.5 cursor-pointer transition-all border-0 flex items-center justify-center"
                title="Close"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Scrollable Container Wrapper */}
            <div className="flex-grow overflow-y-auto scrollbar-thin max-h-[calc(90vh-60px)] print:max-h-none print:overflow-visible">
              
              {/* Printable Invoice Area */}
              <div 
                id="printable-invoice-area"
                className="bg-white flex flex-col w-full text-slate-800 text-left print:p-0"
              >
                {/* Invoice Top Accent Bar */}
                <div className="h-1.5 bg-gradient-to-r from-primary to-cyan-500 shrink-0 print:hidden" />

                {/* Invoice Header */}
                <table className="w-full border-collapse border-b border-slate-100 bg-slate-50/50" style={{ tableLayout: "fixed" }}>
                  <tbody>
                    <tr>
                      <td className="p-4 text-left align-middle" style={{ width: "55%" }}>
                        <div className="flex items-center gap-2">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={siteName}
                              style={{
                                height: "26px",
                                maxHeight: "26px",
                                maxWidth: "130px",
                                width: "auto",
                                objectFit: "contain",
                                display: "inline-block",
                                verticalAlign: "middle"
                              }}
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-extrabold text-[10px] shrink-0">
                              {siteName ? siteName.substring(0, 2).toUpperCase() : "B2L"}
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-900 tracking-wide">
                            {logoUrl ? "Invoice" : `${siteName} Invoice`}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                          {selectedInvoiceItem ? "Payment Receipt" : "Contract Escrow Ledger"}
                        </p>
                      </td>
                      <td className="p-4 text-right align-middle" style={{ width: "45%" }}>
                        <div style={{ display: "inline-block", textAlign: "right" }}>
                          <span className="invoice-badge-green">
                            Paid & Released
                          </span>
                        </div>
                        <p className="text-[9px] font-semibold text-slate-500 mt-1">
                          ID: <span className="text-slate-800 font-bold">
                            {selectedInvoiceItem 
                              ? `INV-${selectedInvoiceItem.type === 'timecard' ? 'TC' : 'MS'}-${selectedInvoiceItem.id || 'RC'}-${new Date(selectedInvoiceItem.date).getTime().toString().slice(-4)}`
                              : `INV-CON-${activeContract.contract_id}-${new Date(activeContract.created_at).getTime().toString().slice(-4)}`
                            }
                          </span>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Meta details (Date/Time Issued) */}
                <table className="w-full border-collapse bg-slate-50/20 border-b border-slate-100" style={{ tableLayout: "fixed" }}>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2.5 text-left text-[9px] font-semibold text-slate-500" style={{ width: "50%" }}>
                        <span>Date Issued: </span>
                        <span className="text-slate-800 font-bold">
                          {new Date(selectedInvoiceItem ? selectedInvoiceItem.date : activeContract.updated_at).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[9px] font-semibold text-slate-500" style={{ width: "50%" }}>
                        <span>Time Issued: </span>
                        <span className="text-slate-800 font-bold">
                          {new Date(selectedInvoiceItem ? selectedInvoiceItem.date : activeContract.updated_at).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Billed To / From Party Section */}
                <table className="w-full border-collapse border-b border-slate-100" style={{ tableLayout: "fixed" }}>
                  <tbody>
                    <tr>
                      <td className="p-4 text-left align-top" style={{ width: "50%" }}>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billed To (Host Client)</span>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-snug">{activeContract.client_name}</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{activeContract.client_email}</p>
                        <div className="mt-1.5">
                          <span className="invoice-badge-gray">
                            Client
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-left align-top" style={{ width: "50%" }}>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Service Provider (Freelancer)</span>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-snug">{activeContract.freelancer_name}</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{activeContract.freelancer_email}</p>
                        <div className="mt-1.5">
                          <span className="invoice-badge-gray">
                            Freelancer
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Project Details & Milestones Table */}
                <div className="p-5 flex-grow">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-2 text-left">Project details</span>
                  
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 mb-4 text-left">
                    <h4 className="text-[11px] font-bold text-slate-850 truncate">{job.title}</h4>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      Hired on {new Date(activeContract.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="border border-slate-200/80 rounded-xl overflow-hidden mb-4">
                    {selectedInvoiceItem ? (
                      /* Single Item Detail Receipt View */
                      <table className="w-full text-[10px] font-semibold text-slate-650 border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-150 text-[8px] font-bold text-slate-500 uppercase tracking-wider text-left">
                          <tr>
                            <th className="p-2.5" style={{ width: "45%" }}>Released Item / Description</th>
                            <th className="p-2.5" style={{ width: "30%" }}>Billing Type</th>
                            <th className="p-2.5 text-right" style={{ width: "25%" }}>Released Payout</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-left">
                          <tr className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <span className="font-bold text-slate-800 block">{selectedInvoiceItem.title}</span>
                              {selectedInvoiceItem.description && (
                                <span className="text-[8px] text-slate-400 block mt-1 leading-normal max-w-sm">
                                  Notes: {selectedInvoiceItem.description}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {selectedInvoiceItem.type === "timecard" ? (
                                <span className="inline-block text-primary text-[8px] font-black uppercase tracking-wider">
                                  Hourly ({selectedInvoiceItem.hours}h {selectedInvoiceItem.minutes}m @ ${hourlyRate.toFixed(2)}/hr)
                                </span>
                              ) : (
                                <span className="inline-block text-teal-700 text-[8px] font-black uppercase tracking-wider">
                                  Fixed Price Milestone
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-800 text-xs">
                              ${selectedInvoiceItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      /* Full Escrow Ledger View */
                      <table className="w-full text-[10px] font-semibold text-slate-650 border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-150 text-[8px] font-bold text-slate-500 uppercase tracking-wider text-left">
                          <tr>
                            <th className="p-2.5" style={{ width: "45%" }}>Description</th>
                            <th className="p-2.5 text-center" style={{ width: "20%" }}>Status</th>
                            <th className="p-2.5 text-right" style={{ width: "17.5%" }}>Agreed</th>
                            <th className="p-2.5 text-right" style={{ width: "17.5%" }}>Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-left">
                          {job.project_type === "Hourly" ? (
                            timecards.filter((tc: any) => tc.status === "Paid").map((tc: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2.5">
                                  <span className="font-bold text-slate-800 block">Hourly Work ({tc.hours}h {tc.minutes}m)</span>
                                  <span className="text-[8px] text-slate-400 block">Worked on {new Date(tc.work_date).toLocaleDateString()}</span>
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className="invoice-badge-green">
                                    Released
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-bold text-slate-700">
                                  ${parseFloat(tc.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-2.5 text-right font-bold text-slate-700">
                                  ${parseFloat(tc.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                          ) : (
                            milestoneList.map((m: any, idx: number) => {
                              const mPaid = activeContract ? m.payment_status === "Paid" : m.paid;
                              const mFunded = activeContract ? m.payment_status === "Funded" : false;
                              const paidVal = isDisputeSplit 
                                ? totalAmount * (freelancerPayoutPercent / 100)
                                : (mPaid || mFunded ? parseFloat(m.amount) : 0);
                              
                              const hasExtraRevision = parseFloat(m.extra_revision_fee || 0) > 0 && m.revision_status !== "Awaiting Funding";

                              return (
                                <React.Fragment key={idx}>
                                  <tr className="hover:bg-slate-50/50">
                                    <td className="p-2.5">
                                      <span className="font-bold text-slate-800 block truncate max-w-[200px]">{m.title}</span>
                                      <span className="text-[8px] text-slate-400 block">Phase {idx + 1}</span>
                                      {(mPaid || mFunded) && (
                                        <span className="text-[8px] text-slate-450 block mt-0.5 font-semibold">
                                          Paid on {new Date(m.updated_at || activeContract.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className={
                                        mPaid
                                          ? (isDisputeSplit ? "invoice-badge-amber" : "invoice-badge-green")
                                          : mFunded
                                            ? "invoice-badge-teal"
                                            : activeContract.status === "Cancelled"
                                              ? "invoice-badge-rose"
                                              : "invoice-badge-gray"
                                      }>
                                        {mPaid ? (isDisputeSplit ? "Split" : "Released") : mFunded ? "Escrow (Funded)" : activeContract.status === "Cancelled" ? "Refunded" : "Escrow"}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-slate-700">
                                      ${parseFloat(m.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-slate-700">
                                      ${paidVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                  {hasExtraRevision && (
                                    <tr className="hover:bg-slate-50/50 bg-slate-50/20 text-[9px] text-slate-500">
                                      <td className="p-2.5 pl-6">
                                        <span className="font-semibold text-slate-700 block">↳ Extra Revision Charge</span>
                                        <span className="text-[7.5px] text-slate-400 block">Milestone: {m.title}</span>
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <span className="invoice-badge-green">Released</span>
                                      </td>
                                      <td className="p-2.5 text-right font-bold text-slate-500">
                                        ${parseFloat(m.extra_revision_fee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="p-2.5 text-right font-bold text-slate-500">
                                        ${parseFloat(m.extra_revision_fee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Payment Details Source Section */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-left mb-4 text-[9px] font-semibold text-slate-500 leading-relaxed">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Details</span>
                    {selectedInvoiceItem ? (
                      selectedInvoiceItem.type === "timecard" ? (
                        <div>
                          <span>Payout amount of </span>
                          <strong className="text-slate-800">${selectedInvoiceItem.amount.toFixed(2)}</strong>
                          <span> was successfully released. </span>
                          <div className="mt-1">
                            <span className="block"><strong>Payment Method:</strong> Stripe Checkout & LancerFlow Escrow Wallet</span>
                            <span className="block mt-0.5"><strong>Transaction ID:</strong> TXN-TC-{selectedInvoiceItem.id}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span>Milestone payout of </span>
                          <strong className="text-slate-800">${selectedInvoiceItem.amount.toFixed(2)}</strong>
                          <span> was funded 100% upfront in contract escrow and released to the freelancer's wallet.</span>
                          <div className="mt-1">
                            <span className="block"><strong>Payment Method:</strong> LancerFlow Escrow Wallet (100% Upfront Escrow Funded)</span>
                            <span className="block mt-0.5"><strong>Transaction ID:</strong> TXN-MS-{selectedInvoiceItem.id}</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <div>
                        <span>All releases on this contract have been settled internal wallet-to-wallet using LancerFlow Escrow and Client balance checkout.</span>
                        <table className="w-full border-collapse mt-2">
                          <tbody>
                            <tr>
                              <td className="text-left align-top" style={{ width: "50%" }}>
                                <span className="block text-[8px] uppercase tracking-wider text-slate-400">Total Funded Escrow</span>
                                <strong className="text-slate-800 text-[10px]">${clientPaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                              </td>
                              <td className="text-left align-top" style={{ width: "50%" }}>
                                <span className="block text-[8px] uppercase tracking-wider text-slate-400">Primary Payment Gateway</span>
                                <strong className="text-slate-800 text-[10px]">Stripe Checkout / Escrow Wallet</strong>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Dispute Split Audit details if any */}
                  {!selectedInvoiceItem && isDisputeSplit && (
                    <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-3 text-left mb-4">
                      <div className="flex items-start gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5 shrink-0 text-xs"></i>
                        <div>
                          <h5 className="text-[8px] font-bold text-rose-800 uppercase tracking-wider">Escrow Dispute Mediation Audit</h5>
                          <p className="text-[9px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                            {activeContract.dispute_resolution_details}
                          </p>
                          <table className="w-full border-collapse mt-2 pt-2 border-t border-rose-100/50 text-[9px] font-bold uppercase text-slate-455">
                            <tbody>
                              <tr>
                                <td style={{ width: "50%" }}>
                                  <span>Client Refund:</span>
                                  <strong className="text-rose-700 block text-[10px] font-bold mt-0.5">${returnedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                </td>
                                <td style={{ width: "50%" }}>
                                  <span>Freelancer Payout:</span>
                                  <strong className="text-emerald-700 block text-[10px] font-bold mt-0.5">${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total Summary */}
                  <table className="border-collapse ml-auto text-[9px] font-bold text-slate-500 uppercase text-left border-t border-slate-200 pt-3" style={{ width: "240px" }}>
                    <tbody>
                      <tr>
                        <td className="py-1 text-left">Total Amount:</td>
                        <td className="py-1 text-right text-slate-700">${(selectedInvoiceItem ? selectedInvoiceItem.amount : totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {!selectedInvoiceItem && (
                        <tr>
                          <td className="py-1 text-left">Platform Service Fee (5%):</td>
                          <td className="py-1 text-right text-slate-400">-${platformFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-1 text-left">Net Released Payout:</td>
                        <td className="py-1 text-right text-emerald-600">${(selectedInvoiceItem ? selectedInvoiceItem.amount : netFreelancerPayout).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {!selectedInvoiceItem && isDisputeSplit && (
                        <tr className="text-rose-650">
                          <td className="py-1 text-left">Returned to Client:</td>
                          <td className="py-1 text-right">-${returnedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      <tr className="border-t border-slate-250 text-[10px] text-slate-800">
                        <td className="pt-2 text-left font-bold">Total Paid:</td>
                        <td className="pt-2 text-right text-primary font-extrabold">${(selectedInvoiceItem ? selectedInvoiceItem.amount : clientPaidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Controls Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0 print:hidden">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent border-0 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloadingPDF ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Downloading PDF...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-file-pdf"></i>
                    <span>Download PDF</span>
                  </>
                )}
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border-0"
              >
                <i className="fa-solid fa-print"></i>
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activePaymentModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[0.5px] animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full overflow-hidden flex flex-col animate-scaleUp max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                Fund Escrow Payment
              </span>
              <button
                type="button"
                onClick={() => setActivePaymentModal(null)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-4 text-left overflow-y-auto flex-1">
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex flex-col gap-0.5 max-w-[200px]">
                  <span className="text-[10px] font-black text-slate-700 truncate">
                    {activePaymentModal.title}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    {activePaymentModal.type === "milestone" ? "Milestone Funding" : "Extra Revision Fee"}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-black text-primary text-sm">
                    ${activePaymentModal.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Selector */}
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Select Payment Option
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["stripe", "paypal", "wallet"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setModalPayMethod(m);
                        setModalPayError("");
                      }}
                      className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                        modalPayMethod === m
                          ? "border-primary bg-primary/[0.04] text-primary shadow-sm"
                          : "border-slate-150 hover:border-slate-250 bg-white text-slate-500"
                      }`}
                    >
                      {m === "stripe" && <FaCreditCard className="w-4 h-4 mb-0.5" />}
                      {m === "paypal" && <FaPaypal className="w-4 h-4 mb-0.5" />}
                      {m === "wallet" && <FaWallet className="w-4 h-4 mb-0.5" />}
                      <span className="text-[9px] font-extrabold mt-0.5 capitalize">
                        {m === "stripe" ? "Card" : m}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Method info hint */}
                <div className="text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 mt-2 leading-relaxed">
                  {modalPayMethod === "stripe" && (
                    <span>
                      <strong className="text-slate-700 font-bold">Stripe Card:</strong> Pays securely via Stripe Hosted checkout redirect.
                    </span>
                  )}
                  {modalPayMethod === "paypal" && (
                    <span>
                      <strong className="text-slate-700 font-bold">PayPal:</strong> Pays instantly via simulated PayPal integration.
                    </span>
                  )}
                  {modalPayMethod === "wallet" && (
                    <span>
                      <strong className="text-slate-700 font-bold">Wallet:</strong> Pays instantly from your available LancerFlow balance.
                    </span>
                  )}
                </div>
              </div>

              {modalPayError && (
                <div className="text-rose-600 text-[9px] font-bold bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 leading-normal">
                  ⚠️ {modalPayError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setActivePaymentModal(null)}
                disabled={modalPayLoading}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessModalPayment}
                disabled={modalPayLoading}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 border-0"
              >
                {modalPayLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-t-white border-primary/40 rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="text-xs" />
                    <span>Pay Escrow</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Payment Completed Congratulations Modal */}
      {congratsModalData?.show && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn text-left">
          <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl border border-emerald-500/30 text-center relative overflow-hidden flex flex-col items-center gap-4 animate-scaleUp text-slate-800">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-inner border border-emerald-300 animate-bounce mt-2 select-none">
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
                Your escrow payment of <strong className="text-slate-900 font-black">${congratsModalData.amount.toLocaleString()}</strong> for <span className="font-bold text-slate-800">"{congratsModalData.title}"</span> has been confirmed. The contract is active!
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
                  setCongratsModalData(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer border-0"
              >
                View Project Tracker →
              </button>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-shrinkWidth" />
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmFundingMilestoneId && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-[1px] animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-2xl border border-amber-200 shadow-sm shrink-0">
              <FiClock className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Confirm Funding Request
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-2 leading-relaxed">
                Are you sure you want to request escrow funding for this milestone? An in-app notification will be sent to the client requesting them to deposit the milestone budget.
              </p>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setConfirmFundingMilestoneId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl transition cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const mId = confirmFundingMilestoneId;
                  setConfirmFundingMilestoneId(null);
                  await requestMilestoneFunding(mId);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer border-0"
              >
                Yes, Request Funding
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
