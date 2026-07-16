"use client";
import { API_URL } from "@/config/api";
import UpgradeOverlay from "@/components/dashboard/UpgradeOverlay";


import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  FiBriefcase, 
  FiClock, 
  FiActivity, 
  FiUser, 
  FiMapPin, 
  FiDollarSign, 
  FiCheckCircle, 
  FiFileText,
  FiGlobe,
  FiSend,
  FiArrowLeft,
  FiAlertTriangle,
  FiX
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

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const slug = params?.slug as string;

  // Data states
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
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
        }
      }
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchJobDetails();
    }
  }, [slug]);

  // Inject Meta SEO tags dynamically
  useEffect(() => {
    if (!job) return;

    const resolveMediaUrl = (url: string) => {
      if (!url) return "";
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
        return url;
      }
      const cleanPath = url.startsWith("/") ? url : `/${url}`;
      return `https://freelancer.sangvish.com${cleanPath}`;
    };

    let seoTitle = job.title;
    let seoDesc = job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 150) + "..." : "";
    let seoImg = "/tablet-work.png";

    if (job.seo) {
      try {
        const parsedSeo = typeof job.seo === 'string' ? JSON.parse(job.seo) : job.seo;
        if (parsedSeo?.title) seoTitle = parsedSeo.title;
        if (parsedSeo?.description) seoDesc = parsedSeo.description;
        if (parsedSeo?.image) seoImg = parsedSeo.image;
      } catch (e) {
        console.error("Error parsing project SEO:", e);
      }
    }

    const absoluteImg = resolveMediaUrl(seoImg || "/tablet-work.png");

    // Update title
    document.title = `${seoTitle} | LancerFlow`;

    // Helper to create or update meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateMetaTag('og:title', seoTitle);
    updateMetaTag('og:description', seoDesc);
    updateMetaTag('og:image', absoluteImg);
    updateMetaTag('description', seoDesc, false);
    updateMetaTag('twitter:title', seoTitle, false);
    updateMetaTag('twitter:description', seoDesc, false);
    updateMetaTag('twitter:image', absoluteImg, false);
  }, [job]);

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
            router.push("/dashboard?tab=settings");
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
          <span>Back to Projects</span>
        </button>

        {/* Outer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 flex flex-col gap-6">
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
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Project Type</span>
                  <span className="text-xs font-extrabold text-slate-800 mt-1 block flex items-center gap-1">
                    <FiBriefcase className="w-3.5 h-3.5 text-primary" />
                    {job.project_type || "Fixed"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Experience Level</span>
                  <span className="text-xs font-extrabold text-slate-800 mt-1 block flex items-center gap-1">
                    <FiUser className="w-3.5 h-3.5 text-primary" />
                    {job.experience_level || "Intermediate"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Duration</span>
                  <span className="text-xs font-extrabold text-slate-800 mt-1 block flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5 text-primary" />
                    {job.duration || "1-3 months"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Location</span>
                  <span className="text-xs font-extrabold text-slate-808 mt-1 block flex items-center gap-1">
                    <FiMapPin className="w-3.5 h-3.5 text-primary" />
                    {job.location || "Remote"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">Project Description</h3>
                <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {/* Skills */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">Skills Required</h3>
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
                  <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">Preferred Languages</h3>
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
            
            {/* Budget / Hiring card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Project Budget</span>
              <div className="flex items-center justify-center gap-1 text-primary font-black text-2xl">
                <FiDollarSign className="w-6 h-6" />
                <span>
                  {job.project_type === "Hourly"
                    ? `${job.min_budget ? parseFloat(job.min_budget).toFixed(2) : "15.00"} - ${job.max_budget ? parseFloat(job.max_budget).toFixed(2) : "50.00"}/hr`
                    : finalBudget > 0 
                      ? `${finalBudget.toLocaleString()}` 
                      : "Contact client"
                  }
                </span>
              </div>
              {job.project_type === "Hourly" && (
                <p className="text-[10px] text-slate-400 font-bold -mt-2">
                  Up to {job.max_hours || 40} hours per week | Paid {job.payment_mode || "Weekly"}
                </p>
              )}
            </div>

            {/* Proposal submit form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Submit Proposal
              </h3>

              {!localStorage.getItem("token") ? (
                <div className="text-center py-4 flex flex-col gap-3">
                  <p className="text-xs text-slate-505 font-bold">You need to sign in to submit a proposal for this project.</p>
                  <button
                    onClick={() => openLoginModal(`/projects/${slug}`)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-black py-3 rounded-xl border-none cursor-pointer shadow-sm transition-all"
                  >
                    Login / Sign Up
                  </button>
                </div>
              ) : isOwner ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs font-bold text-center">
                  Owner view: Manage proposal responses and select candidates directly in your dashboard.
                </div>
              ) : userRole === "client" ? (
                <div className="bg-slate-50 border border-slate-200 text-slate-500 p-4 rounded-xl text-xs font-bold text-center">
                  Only freelancer accounts can submit proposals to client project postings.
                </div>
              ) : isApplied ? (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-xs font-black text-center flex flex-col items-center gap-2">
                  <FiCheckCircle className="w-8 h-8 text-emerald-600" />
                  <span>Proposal Submitted!</span>
                  <p className="text-[10px] text-emerald-700 font-bold leading-normal mt-1">
                    You have successfully submitted your proposal. The client will review your details and contact you via chat.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/proposals")}
                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    <FiFileText className="w-3.5 h-3.5" />
                    <span>View Submitted Proposals</span>
                  </button>
                </div>
              ) : limitReached ? (
                <div className="text-center py-4 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm mt-2">
                    <FiAlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mt-1">Proposal Limit Exceeded</h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed px-2 mt-0.5">
                    {limitMsg || "You have reached your monthly proposal limit."}
                  </p>
                  <button
                    onClick={() => router.push("/pricing")}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-black py-3 rounded-xl border-none cursor-pointer shadow-md hover:shadow-teal-600/25 transition-all mt-2"
                  >
                    Upgrade Plan
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProposal} className="flex flex-col gap-4 text-left">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      {job.project_type === "Hourly" ? "Your Hourly Rate ($/hr)" : "Your Bid Amount ($)"}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder={job.project_type === "Hourly" ? "25.00" : "1500"}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                    />
                  </div>

                  {job.project_type !== "Hourly" && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estimated Delivery Days</label>
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="7"
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cover Letter</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Describe your relevant skills, approach, and why you are the best fit for this project..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 focus:border-primary focus:outline-none resize-none h-28"
                    />
                  </div>

                  {submitError && (
                    <p className="text-xxs font-bold text-rose-500">{submitError}</p>
                  )}

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
                        <span>Submit Proposal</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Client info card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                About Client
              </h3>
              
              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Client Name</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{job.company_name || job.client_name}</span>
                </div>
                {job.industry && (
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Industry</span>
                    <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{job.industry}</span>
                  </div>
                )}
                {job.website && (
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Website</span>
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
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Member Since</span>
                  <span className="text-xs font-bold text-slate-500 block mt-0.5">
                    {new Date(job.client_member_since).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Limit Exceeded Upgrade Popup Overlay */}
      <UpgradeOverlay 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        message={limitModalMessage} 
      />

      <Footer />
    </div>
  );
}
