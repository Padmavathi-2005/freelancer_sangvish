"use client";
import { API_URL } from "@/config/api";
import UpgradeOverlay from "@/components/dashboard/UpgradeOverlay";
import ShareSection from "@/components/ShareSection";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { 
  FiBriefcase, 
  FiClock, 
  FiActivity, 
  FiUser, 
  FiMapPin, 
  FiDollarSign, 
  FiCheckCircle, 
  FiCheck,
  FiCopy,
  FiFileText,
  FiGlobe,
  FiSend,
  FiArrowLeft,
  FiAlertTriangle,
  FiX,
  FiCpu
} from "react-icons/fi";

const getMaxDaysFromDuration = (durationStr: string): number => {
  if (!durationStr) return Infinity;
  const str = durationStr.toLowerCase();
  if (str.includes("less than 1 month")) return 30;
  if (str.includes("1-3 months")) return 90;
  if (str.includes("3-6 months")) return 180;
  if (str.includes("more than 6 months")) return Infinity;
  
  const numbers = str.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const maxVal = Math.max(...numbers.map(Number));
    if (str.includes("month")) {
      return maxVal * 30;
    }
    if (str.includes("week")) {
      return maxVal * 7;
    }
    if (str.includes("year")) {
      return maxVal * 365;
    }
    if (str.includes("day")) {
      return maxVal;
    }
  }
  return Infinity;
};

interface ProjectDetailsClientProps {
  initialJob?: any;
  initialSlug?: string;
}

export default function ProjectDetailsClient({ initialJob, initialSlug }: ProjectDetailsClientProps) {
  const { t, formatPrice } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const slug = (params?.slug as string) || initialSlug || "";

  // Data states
  const [job, setJob] = useState<any | null>(initialJob || null);
  const [loading, setLoading] = useState(initialJob ? false : true);
  const [error, setError] = useState("");
  const [isApplied, setIsApplied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Proposal Submission state
  const [bidAmount, setBidAmount] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [limitMsg, setLimitMsg] = useState("");
  const [activePlanName, setActivePlanName] = useState<string>("Standard");

  // AI Proposal Writer state
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [aiProposalError, setAiProposalError] = useState("");
  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleGenerateProposal = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      openLoginModal(`/projects/${slug}`);
      return;
    }
    if (!job) return;
    setGeneratingProposal(true);
    setAiProposalError("");
    setShowAiPanel(true);
    setCoverLetter("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/ai/generate-proposal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectTitle: job.title,
          projectDescription: job.description,
          projectBudget: job.budget || job.max_budget,
          projectType: job.project_type,
          projectSkills: Array.isArray(job.skills)
            ? job.skills.map((s: any) => (typeof s === "object" ? s.skill_name : s))
            : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || "Failed to generate proposal.";
        setAiProposalError(errorMsg);
        showToast("error", errorMsg);
        return;
      }
      setCoverLetter(data.proposal || "");
    } catch (err: any) {
      const errorMsg = "Network error. Please check your connection and try again.";
      setAiProposalError(errorMsg);
      showToast("error", errorMsg);
    } finally {
      setGeneratingProposal(false);
    }
  };

  // Share link and toast states
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);

  // Affiliate states
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          setIsAffiliate(profile.is_affiliate === true || profile.is_affiliate === 1);
          setUserReferralCode(profile.referral_code || "");
        }
      } catch (err) {
        console.error("Error fetching user profile for affiliate check:", err);
      }
    };
    fetchProfile();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      showToast("success", "Share link copied to clipboard!");
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const fetchJobDetails = async () => {
    try {
      if (!job) setLoading(true);
      const res = await fetch(`${API_URL}/jobs/public/${slug}`);
      if (!res.ok) {
        throw new Error("Project not found.");
      }
      const data = await res.json();
      setJob(data);

      // Check current user state
      const token = localStorage.getItem("token");
      const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const currentRole = loggedUser.user_role || loggedUser.role || localStorage.getItem("onboarding_role") || "";
      if (currentRole) {
        setUserRole(currentRole);
      }

      if (loggedUser && loggedUser.user_id) {
        setIsOwner(parseInt(loggedUser.user_id) === parseInt(data.client_id));
        
        // If logged in, fetch proposals for this job to check if already applied
        if (token) {
          const propRes = await fetch(`${API_URL}/proposals/job/${data.job_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (propRes.ok) {
            const proposals = await propRes.json();
            const hasApplied = proposals.some((p: any) => parseInt(p.freelancer_id) === parseInt(loggedUser.user_id));
            setIsApplied(hasApplied);
          }

          // Fetch rolling proposal limit status
          if (currentRole === "freelancer") {
            const limitRes = await fetch(`${API_URL}/proposals/limit-check`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (limitRes.ok) {
              const limitData = await limitRes.json();
              setLimitReached(limitData.limitReached);
              if (limitData.limitReached) {
                setLimitMsg(`Your monthly proposal limit of ${limitData.limit} has been reached for this billing cycle. Your limit resets on ${limitData.resetDate}.`);
              }
            }
          }

          // Fetch subscription to determine commission
          try {
            const subRes = await fetch(`${API_URL}/users/me/subscription`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              if (subData && subData.plan_name) {
                setActivePlanName(subData.plan_name);
              }
            }
          } catch (e) {
            console.error("Error fetching subscription:", e);
          }
        }
      }
      setError("");
    } catch (err: any) {
      console.error(err);
      if (!job) setError(err.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchJobDetails();
    }
  }, [slug]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !bidAmount.trim() || !coverLetter.trim()) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        openLoginModal();
        return;
      }

      // Check onboarding and vetting status
      const checkRes = await fetch(`${API_URL}/users/onboarding-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (!data.hasFreelancerProfile) {
          setSubmitError("You have not completed your freelancer profile onboarding. Redirecting...");
          localStorage.setItem("user_role", "freelancer");
          localStorage.setItem("onboarding_role", "freelancer");
          setTimeout(() => {
            router.push("/dashboard/settings");
          }, 2000);
          setSubmitting(false);
          return;
        }
        if (data.freelancerVettingStatus !== "Approved") {
          setSubmitError("Your freelancer profile is pending administrator approval.");
          setSubmitting(false);
          return;
        }
      } else {
        setSubmitError("Failed to check profile status.");
        setSubmitting(false);
        return;
      }

      // Validation checks
      const parsedBid = parseFloat(bidAmount);
      if (isNaN(parsedBid) || parsedBid <= 0) {
        setSubmitError("Please enter a valid positive bid amount.");
        setSubmitting(false);
        return;
      }

      const projectMaxBudget = parseFloat(job.budget || job.max_budget || 0);
      if (projectMaxBudget > 0 && parsedBid > projectMaxBudget) {
        setSubmitError(`Your bid amount ($${parsedBid.toLocaleString()}) cannot exceed the client's project budget ($${projectMaxBudget.toLocaleString()}).`);
        setSubmitting(false);
        return;
      }

      if (job.project_type !== "Hourly") {
        const daysEntered = parseInt(deliveryDays);
        if (isNaN(daysEntered) || daysEntered <= 0) {
          setSubmitError("Please enter a valid positive number of delivery days.");
          setSubmitting(false);
          return;
        }

        if (job.duration) {
          const maxDays = getMaxDaysFromDuration(job.duration);
          if (daysEntered > maxDays) {
            setSubmitError(`Your estimated delivery days (${daysEntered} days) exceeds the project's expected duration (${job.duration}).`);
            setSubmitting(false);
            return;
          }
        }
      }

      const res = await fetch(`${API_URL}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: job.job_id,
          bid_amount: parsedBid,
          delivery_days: job.project_type === "Hourly" ? 7 : parseInt(deliveryDays),
          cover_letter: coverLetter.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(true);
        setIsApplied(true);
      } else if (res.status === 403) {
        setLimitModalMessage(data.message || "Your monthly proposal limit has been reached.");
        setShowLimitModal(true);
      } else {
        setSubmitError(data.message || "Failed to submit proposal.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to submit proposal. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full justify-between">
        <Header />
        <div className="flex-grow flex flex-col justify-center items-center py-20 px-6 text-center">
          <h1 className="text-7xl font-black text-slate-200 tracking-tight select-none">404</h1>
          <h2 className="text-xl font-extrabold text-slate-800 mt-4">Project Not Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            The project you are trying to view does not exist or has been archived.
          </p>
          <button
            onClick={() => router.push("/projects")}
            className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all border-none cursor-pointer"
          >
            Back to Projects Marketplace
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const finalBudget = parseFloat(job.budget || job.max_budget || 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans w-full max-w-full relative">
      <Header />

      <main className="max-w-7xl mx-auto w-full py-10 px-4 sm:px-6 lg:px-8 flex flex-col gap-6 text-left">
        {/* Back navigation */}
        <button
          onClick={() => router.push("/projects")}
          className="self-start text-xs font-black text-slate-500 hover:text-primary transition flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>{t("btn_back_to_projects", "Back to Projects")}</span>
        </button>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 flex flex-col gap-6 self-start">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-cyan-500" />
              
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {job.category_name || "General"}
                  </span>
                  {job.sub_category_name && (
                    <span className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {job.sub_category_name}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {job.title}
                </h1>
              </div>

              {/* Badges strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("project_type", "Project Type")}</span>
                  <span className="text-xs font-extrabold text-slate-800 mt-1 block flex items-center gap-1">
                    <FiBriefcase className="w-3.5 h-3.5 text-primary" />
                    {job.project_type || "Fixed"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("experience_level", "Experience Level")}</span>
                  <span className="text-xs font-extrabold text-slate-800 mt-1 block flex items-center gap-1">
                    <FiUser className="w-3.5 h-3.5 text-primary" />
                    {job.experience_level || "Intermediate"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("duration", "Duration")}</span>
                  <span className="text-xs font-extrabold text-slate-800 mt-1 block flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5 text-primary" />
                    {job.duration || "1-3 months"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("location", "Location")}</span>
                  <span className="text-xs font-extrabold text-slate-808 mt-1 block flex items-center gap-1">
                    <FiMapPin className="w-3.5 h-3.5 text-primary" />
                    {job.location || "Remote"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">{t("project_description", "Project Description")}</h3>
                <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {/* Skills */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">{t("skills_required", "Skills Required")}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.skills.map((skill: any, idx: number) => {
                      const name = typeof skill === "object" ? skill.skill_name : skill;
                      return (
                        <span key={idx} className="bg-slate-50 border border-slate-200/60 text-slate-700 text-xxs font-black px-3.5 py-1.5 rounded-xl">
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Languages */}
              {Array.isArray(job.languages) && job.languages.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">{t("preferred_languages", "Preferred Languages")}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.languages.map((lang: any, idx: number) => {
                      const name = typeof lang === "object" ? lang.language_name : lang;
                      return (
                        <span key={idx} className="bg-slate-50 border border-slate-200/60 text-slate-700 text-xxs font-black px-3.5 py-1.5 rounded-xl">
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Client details & Proposal form */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Affiliate Share card */}
            {isAffiliate && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
                  <span className="text-emerald-600">★</span> {t("affiliate_share", "Affiliate Share")}
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                  Share this project link. If a user registers and books/completes this project, you will earn a recurring 10% commission on the platform service fee!
                </p>
                <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-xl p-1.5 pl-3 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/projects/${job.slug || job.job_id}?ref=${userReferralCode || "REF_USER"}`}
                    style={{ outline: "none", border: "none", boxShadow: "none" }}
                    className="flex-1 min-w-0 bg-transparent text-xs font-mono font-semibold text-slate-700 select-all truncate border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 shadow-none p-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${typeof window !== "undefined" ? window.location.origin : ""}/projects/${job.slug || job.job_id}?ref=${userReferralCode || "REF_USER"}`;
                      navigator.clipboard.writeText(link);
                      setCopiedAffiliate(true);
                      showToast("success", "Affiliate referral link copied to clipboard!");
                      setTimeout(() => setCopiedAffiliate(false), 2000);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-none text-white shadow-xs ${
                      copiedAffiliate
                        ? "bg-emerald-700 hover:bg-emerald-800"
                        : "bg-teal-700 hover:bg-teal-800 active:scale-95"
                    }`}
                    title="Copy affiliate link"
                  >
                    {copiedAffiliate ? (
                      <>
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct Social Share Options with Affiliate Link */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Quick Social Share:
                  </span>
                  <ShareSection
                    type="project"
                    itemTitle={job?.title || ""}
                    itemDescription={job?.description || ""}
                    customUrl={typeof window !== "undefined" ? window.location.href : ""}
                    isAffiliate={isAffiliate}
                    referralCode={userReferralCode}
                    onToast={(type, message) => showToast(type, message)}
                    hideHeader={true}
                    className="flex flex-col gap-2"
                  />
                </div>
              </div>
            )}

            {/* Budget / Hiring card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t("project_budget", "Project Budget")}</span>
              <div className="flex items-center justify-center gap-1 text-primary font-black text-2xl">
                <span>
                  {job.project_type === "Hourly"
                    ? `${formatPrice(job.budget || job.hourly_rate || 50)}/hr`
                    : formatPrice(finalBudget)}
                </span>
              </div>

              {isOwner ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold p-3.5 rounded-xl">
                  You are the owner of this project posting.
                </div>
              ) : isApplied ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3.5 rounded-xl flex items-center justify-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Proposal Submitted</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitProposal} className="flex flex-col gap-3.5 text-left mt-2">
                  {limitReached && (
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xxs font-bold leading-relaxed flex items-start gap-2">
                      <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{limitMsg}</span>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xxs font-bold leading-relaxed">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {job.project_type === "Hourly" ? t("hourly_rate_bid", "Your Hourly Rate ($/hr)") : t("your_bid_amount", "Your Bid Amount ($)")}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder={job.project_type === "Hourly" ? "e.g. 45" : "e.g. 500"}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-primary transition"
                    />
                  </div>

                  {job.project_type !== "Hourly" && (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        {t("delivery_in_days", "Delivery in Days")}
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="e.g. 7"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-primary transition"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        {t("cover_letter", "Cover Letter")}
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateProposal}
                        disabled={generatingProposal}
                        className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 transition flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                      >
                        <FiCpu className="w-3 h-3 text-cyan-600" />
                        <span>{generatingProposal ? "Writing..." : "AI Proposal Generator"}</span>
                      </button>
                    </div>
                    <textarea
                      required
                      rows={4}
                      placeholder="Explain why you are the best fit for this project..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-primary transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-black py-3 rounded-xl border-none cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FiSend className="w-3.5 h-3.5" />
                        <span>{t("submit_proposal", "Submit Proposal")}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Client info card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                {t("about_client", "About Client")}
              </h3>
              
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("client_name", "Client Name")}</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{job.company_name || job.client_name}</span>
                </div>
                {job.industry && (
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("industry", "Industry")}</span>
                    <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{job.industry}</span>
                  </div>
                )}
                {job.website && (
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("website", "Website")}</span>
                    <a
                      href={job.website.startsWith("http") ? job.website : `https://${job.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-primary hover:underline block mt-0.5 flex items-center gap-1"
                    >
                      <FiGlobe className="w-3.5 h-3.5 text-primary" />
                      <span>{job.website}</span>
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t("member_since", "Member Since")}</span>
                  <span className="text-xs font-bold text-slate-500 block mt-0.5">
                    {new Date(job.client_member_since).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>
            </div>

            {/* SHARE THIS PROJECT */}
            <ShareSection
              type="project"
              itemTitle={(() => {
                let manual = "";
                if (job?.seo) {
                  try {
                    const parsed = typeof job.seo === 'string' ? JSON.parse(job.seo) : job.seo;
                    manual = parsed?.meta_title || parsed?.title || "";
                  } catch (e) {}
                }
                return manual || job?.title || "";
              })()}
              itemDescription={(() => {
                let manual = "";
                if (job?.seo) {
                  try {
                    const parsed = typeof job.seo === 'string' ? JSON.parse(job.seo) : job.seo;
                    manual = parsed?.meta_description || parsed?.description || "";
                  } catch (e) {}
                }
                return manual || job?.description || "";
              })()}
              itemImage={(() => {
                let manual = "";
                if (job?.seo) {
                  try {
                    const parsed = typeof job.seo === 'string' ? JSON.parse(job.seo) : job.seo;
                    manual = parsed?.image || parsed?.og_image || "";
                  } catch (e) {}
                }
                return manual || job?.client_image || job?.company_logo || "";
              })()}
              priceOrBudget={job?.budget ? formatPrice(parseFloat(job.budget)) : job?.min_budget ? `${formatPrice(job.min_budget)} - ${formatPrice(job.max_budget)}` : ""}
              isAffiliate={isAffiliate}
              referralCode={userReferralCode}
              onToast={(type, message) => showToast(type, message)}
            />

          </div>
        </div>
      </main>

      {/* Limit Exceeded Upgrade Popup Overlay */}
      <UpgradeOverlay 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        message={limitModalMessage} 
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-white border border-slate-200/80 rounded-2xl py-3.5 px-4.5 shadow-2xl shadow-slate-100 flex items-center gap-3 animate-slideUp text-left max-w-sm select-none">
          {toast.type === "success" ? (
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <FiAlertTriangle className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-bold text-slate-800">{toast.message}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}
