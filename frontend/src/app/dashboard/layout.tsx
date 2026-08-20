"use client";
import { API_URL, API_BASE_URL } from "@/config/api";

const resolveLogoUrl = (url: string) => {
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

const formatExpDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [_, year, month] = isoMatch;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};


import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import { FiCheckCircle, FiZap, FiAlertTriangle, FiCheck, FiMenu, FiX, FiClock, FiShield, FiSearch, FiMail, FiTrendingUp, FiBriefcase, FiUsers, FiPlus, FiFileText, FiChevronDown, FiUploadCloud } from "react-icons/fi";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import CustomSelect from "@/components/CustomSelect";
import { useLanguage } from "@/context/LanguageContext";
import ReferralCelebrationModal from "@/components/ReferralCelebrationModal";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const {
    userName,
    profileImage,
    userRole,
    walletInfo,
    isSidebarOpen,
    setIsSidebarOpen,
    profileCompletionProgress,
    unreadNotificationsCount,
    notifications,
    isNotificationsOpen,
    setIsNotificationsOpen,
    handleMarkAllRead,
    handleMarkSingleRead,
    handleRoleSwitch,
    setSelectedProjectDetails,
    setSelectedGigOrderDetails,
    apiAlert,
    selectedFreelancerProfile,
    setSelectedFreelancerProfile,
    loadingProfileDetails,
    handleStartConversation,
    freelancerProposals,
    gigs,
    gigApplications,
    isCreatingJob,
    setIsCreatingJob,
    setIsCreatingGig,
    activeTab,
    setActiveTab,
    siteTheme,
    setSiteTheme,

    // Onboarding context variables
    onboardingCompleted,
    forceShowOnboarding,
    setForceShowOnboarding,
    showOnboardingModal,
    vettingStatus,
    onboardingStep,
    clientWizardStep,
    clientError,
    clientSuccess,
    companyName,
    setCompanyName,
    companySize,
    setCompanySize,
    industry,
    setIndustry,
    companyWebsite,
    setCompanyWebsite,
    companyDescription,
    setCompanyDescription,
    companyEstablishedYear,
    setCompanyEstablishedYear,
    hiringContactName,
    setHiringContactName,
    hiringContactDesignation,
    setHiringContactDesignation,
    setClientWizardStep,
    wizardStep,
    setWizardStep,
    categories,
    subCategories,
    availableSkills,
    languages,
    categoryId,
    handleCategoryChange,
    subCategoryId,
    setSubCategoryId,
    professionalTitle,
    setProfessionalTitle,
    experienceLevel,
    setExperienceLevel,
    totalExperienceYears,
    setTotalExperienceYears,
    hourlyRate,
    setHourlyRate,
    availabilityStatus,
    setAvailabilityStatus,
    linkedinUrl,
    setLinkedinUrl,
    portfolioWebsite,
    setPortfolioWebsite,
    resumeUrl,
    setResumeUrl,
    selectedSkillIds,
    setSelectedSkillIds,
    handleToggleSkill,
    selectedLanguageIds,
    setSelectedLanguageIds,
    selectedLanguages,
    setSelectedLanguages,
    handleUpdateLanguageProficiency,
    handleRemoveLanguage,
    step1Error,
    step1Success,
    step1FieldErrors,
    setStep1FieldErrors,
    clientFieldErrors,
    setClientFieldErrors,
    handleSaveStep1,
    experiences,
    educations,
    certifications,
    expCompany,
    setExpCompany,
    expTitle,
    setExpTitle,
    expEmpType,
    setExpEmpType,
    expCurrent,
    setExpCurrent,
    expStart,
    setExpStart,
    expEnd,
    setExpEnd,
    expDesc,
    setExpDesc,
    handleAddExperience,
    handleRemoveExperience,
    eduInst,
    setEduInst,
    eduDegree,
    setEduDegree,
    eduField,
    setEduField,
    eduStart,
    setEduStart,
    eduEnd,
    setEduEnd,
    handleAddEducation,
    handleRemoveEducation,
    certName,
    setCertName,
    certOrg,
    setCertOrg,
    certDate,
    setCertDate,
    certCredUrl,
    setCertCredUrl,
    handleAddCertification,
    handleRemoveCertification,
    handleSkipStep2,
    updateOnboardingStep,
    userEmail,
    userPhone,
    setUserPhone,
    emailVerified,
    phoneVerified,
    emailOtp,
    setEmailOtp,
    phoneOtp,
    setPhoneOtp,
    emailOtpSent,
    phoneOtpSent,
    otpError,
    emailOtpError,
    phoneOtpError,
    otpSuccess,
    handleSendEmailOtp,
    handleVerifyEmailOtp,
    handleSendPhoneOtp,
    handleVerifyPhoneOtp,
    handleSkipStep3,
    handleSaveStep3,
    projectTitle,
    setProjectTitle,
    projectDesc,
    setProjectDesc,
    projectImages,
    setProjectImages,
    projectVideo,
    setProjectVideo,
    projectDocs,
    setProjectDocs,
    portfolioSuccess,
    handleAddProject,
    handleFinishOnboarding,
    handleSelectFreelancer,
    handleSelectClient,
    handleSkip,
    handleSaveClientStep,
    clientNotice,
    enabledDocFields,
    userUploadedDocs,
    loadingDocFields,
    fetchEnabledDocFields,
    fetchUserUploadedDocs,
    handleUploadDocument,
    isFieldEnabled,
    isFieldRequired,
    totalClientSteps,
    totalFreelancerSteps,

    // Project proposal modal and settings confirmation
    showPublishConfirmModal,
    setShowPublishConfirmModal,
    handleSaveClientStepSettings,
    triggerToast,
    showProposalModal,
    setShowProposalModal,
    applyingJob,
    setApplyingJob,
    proposalError,
    setProposalError,
    proposalBidAmount,
    setProposalBidAmount,
    proposalDeliveryDays,
    setProposalDeliveryDays,
    proposalUseMilestones,
    setProposalUseMilestones,
    proposalMilestones,
    setProposalMilestones,
    handleRemoveProposalMilestone,
    newMilestoneTitle,
    setNewMilestoneTitle,
    newMilestoneAmount,
    setNewMilestoneAmount,
    handleAddProposalMilestone,
    proposalCoverLetter,
    setProposalCoverLetter,
    proposalSubmitting,
    handleSubmitProposal,
    selectedFreelancerFullProfile,
    loadingFullProfile,
    clientJobs,
    fetchClientJobs
  } = useDashboard();

  const currentMilestonesSum = proposalMilestones.reduce((sum, m) => sum + m.amount, 0);
  const isMilestoneLimitReached = currentMilestonesSum >= proposalBidAmount && proposalBidAmount > 0;

  const [expiryDates, setExpiryDates] = useState<Record<number, string>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<number, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [textValues, setTextValues] = useState<Record<number, string>>({});

  const pathname = usePathname();
  const navContainerRef = React.useRef<HTMLElement | null>(null);
  const activeNavItemRef = React.useRef<HTMLButtonElement | null>(null);

  const scrollToActiveNav = React.useCallback(() => {
    const navEl = navContainerRef.current;
    const activeEl = activeNavItemRef.current;
    if (navEl && activeEl) {
      const targetScrollTop = activeEl.offsetTop - (navEl.clientHeight / 2) + (activeEl.clientHeight / 2);
      navEl.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth"
      });
    }
  }, []);

  const bindActiveRef = (isActive: boolean) => (el: HTMLButtonElement | null) => {
    if (isActive) {
      activeNavItemRef.current = el;
      if (el) {
        scrollToActiveNav();
      }
    }
  };

  // Auto-scroll active sidebar navigation item into view when active tab or route changes
  React.useEffect(() => {
    scrollToActiveNav();
    const t1 = setTimeout(scrollToActiveNav, 100);
    const t2 = setTimeout(scrollToActiveNav, 300);
    const t3 = setTimeout(scrollToActiveNav, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeTab, pathname, userRole, onboardingStep, scrollToActiveNav]);

  // Scroll to proposal error when it changes
  React.useEffect(() => {
    if (proposalError) {
      setTimeout(() => {
        const errorElement = document.querySelector(".bg-rose-50");
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [proposalError]);

  const handleSaveTextValue = async (fieldId: number, textVal: string, expiryDate?: string) => {
    if (!textVal.trim()) {
      alert("Please enter a value before saving.");
      return;
    }
    try {
      setUploadingFields(prev => ({ ...prev, [fieldId]: true }));
      setFieldErrors(prev => ({ ...prev, [fieldId]: "" }));
      
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");
      
      const saveRes = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          field_id: fieldId,
          text_value: textVal,
          expiry_date: expiryDate || null
        })
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.message || "Failed to save details.");
      }

      await fetchUserUploadedDocs();
      triggerToast("success", "Value saved successfully!");
    } catch (err: any) {
      setFieldErrors(prev => ({ ...prev, [fieldId]: err.message || "Failed to save value." }));
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  // Direct Hire UI states
  const [showHireWizard, setShowHireWizard] = useState(false);
  const [hireJobMode, setHireJobMode] = useState<"existing" | "new">("existing");

  // AI Resume Reader State
  const [parsingResume, setParsingResume] = useState(false);
  const [parseError, setParseError] = useState("");

  const handleResumeUploadAndParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingResume(true);
    setParseError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload resume file.");
      }

      const uploadData = await uploadRes.json();
      const filename = uploadData.filename;

      if (uploadData.url) {
        setResumeUrl(uploadData.url);
      }

      // Call parse-resume
      const parseRes = await fetch(`${API_URL}/ai/parse-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ filename })
      });

      if (!parseRes.ok) {
        const errData = await parseRes.json();
        throw new Error(errData.error || "Failed to parse resume with AI.");
      }

      const parseData = await parseRes.json();
      const parsed = parseData.parsedResume;

      if (parsed) {
        if (parsed.professionalTitle) setProfessionalTitle(parsed.professionalTitle);
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.yearsOfExperience !== undefined) setTotalExperienceYears(String(parsed.yearsOfExperience));
        if (parsed.hourlyRate) setHourlyRate(String(parsed.hourlyRate));

        // Auto-match skills
        if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
          const matchedIds: number[] = [];
          parsed.skills.forEach((skillName: string) => {
            const match = availableSkills.find(s => s.skill_name.toLowerCase() === skillName.toLowerCase());
            if (match) {
              matchedIds.push(match.skill_id);
            }
          });
          if (matchedIds.length > 0) {
            setSelectedSkillIds(matchedIds);
          }
        }

        // Auto-match languages
        if (Array.isArray(parsed.languages) && parsed.languages.length > 0) {
          const matchedIds: number[] = [];
          const matchedLangsList: any[] = [];
          parsed.languages.forEach((langObj: any) => {
            const name = typeof langObj === "object" ? langObj.language : langObj;
            const prof = typeof langObj === "object" ? langObj.proficiency : "Fluent";
            const match = languages.find(l => l.language_name.toLowerCase() === name.toLowerCase());
            if (match) {
              matchedIds.push(match.language_id);
              matchedLangsList.push({ language_id: match.language_id, proficiency: prof });
            }
          });
          if (matchedIds.length > 0) {
            setSelectedLanguageIds(matchedIds);
            setSelectedLanguages(matchedLangsList);
          }
        }
        triggerToast("success", "Profile fields auto-filled successfully from resume!");
      }
    } catch (err: any) {
      setParseError(err.message || "An error occurred during resume parsing.");
    } finally {
      setParsingResume(false);
    }
  };

  const [selectedExistingJobId, setSelectedExistingJobId] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");
  const [hireBidAmount, setHireBidAmount] = useState(0);
  const [hireDeliveryDays, setHireDeliveryDays] = useState(0);
  const [hirePitch, setHirePitch] = useState("");
  const [hireMilestones, setHireMilestones] = useState<any[]>([]);
  const [newHMTitle, setNewHMTitle] = useState("");
  const [newHMAmount, setNewHMAmount] = useState<number | "">("");
  const [submittingDirectHire, setSubmittingDirectHire] = useState(false);
  const [directHireError, setDirectHireError] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [siteLogoDark, setSiteLogoDark] = useState("");
  const [siteName, setSiteName] = useState("");

  const clientScrollRef = React.useRef<HTMLDivElement>(null);
  const freelancerScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (clientError && clientScrollRef.current) {
      clientScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [clientError]);

  React.useEffect(() => {
    if ((step1Error || otpError) && freelancerScrollRef.current) {
      freelancerScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step1Error, otpError]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            if (setting.setting_key === "site_settings") {
              let val = setting.setting_value;
              if (typeof val === "string") {
                try {
                  val = JSON.parse(val);
                } catch (e) {}
              }
              if (val?.site_logo) setSiteLogo(val.site_logo);
              if (val?.site_logo_dark) setSiteLogoDark(val.site_logo_dark);
              if (val?.site_name) setSiteName(val.site_name);
            }
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard settings", err);
      }
    };
    fetchSettings();
  }, []);

  const subNavBtnClass = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer bg-teal-700/10 text-teal-700 flex items-center gap-3";
    }
    return "w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer text-slate-500 hover:text-slate-850 hover:bg-slate-50 flex items-center gap-3";
  };

  const navDropdownHeaderClass = (isOpen: boolean, paths: string[]) => {
    const isActive = paths.includes(pathname);
    if (isActive) {
      return "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between bg-slate-100 text-slate-900 border border-slate-205/50";
    }
    return "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between text-slate-500 hover:text-slate-850 hover:bg-slate-50";
  };

  // Helper for logout
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("onboarding_completed");
      localStorage.removeItem("onboarding_role");
      window.location.href = "/login";
    }
  };

  const isProfileIncomplete = !onboardingCompleted || vettingStatus === "Pending";
  const isFreelancerApproved = userRole !== "freelancer" || vettingStatus === "Approved";
  const isClientApproved = userRole !== "client" || vettingStatus === "Approved";
  const isLight = true;

  // DYNAMIC THEME CLASS MAPS
  const modalOverlayClass = isLight ? "bg-slate-900/35" : "bg-slate-955/70";
  const cardBgClass = isLight ? "bg-white border border-slate-200/80 shadow-2xl text-slate-800" : "bg-slate-900 border border-slate-800 shadow-2xl text-white";
  const textClass = isLight ? "text-slate-900" : "text-white";
  const subTextClass = isLight ? "text-slate-500 font-medium" : "text-slate-400 font-semibold";
  
  const inputClass = isLight 
    ? "w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none" 
    : "w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none";
  
  const subCardClass = isLight 
    ? "border border-slate-200 p-4 rounded-xl bg-slate-50" 
    : "border border-slate-855 p-4 rounded-xl bg-slate-955/40";
  
  const listBgClass = isLight 
    ? "space-y-2 mb-4 bg-slate-100/50 p-3 rounded-xl border border-slate-150" 
    : "space-y-2 mb-4 bg-slate-955 p-3 rounded-xl";

  const handleAddHM = () => {
    if (!newHMTitle.trim()) {
      setDirectHireError("Milestone title cannot be empty.");
      return;
    }
    if (!newHMAmount || Number(newHMAmount) <= 0) {
      setDirectHireError("Milestone amount must be a positive number.");
      return;
    }
    setHireMilestones([...hireMilestones, { title: newHMTitle, amount: Number(newHMAmount) }]);
    setNewHMTitle("");
    setNewHMAmount("");
    setDirectHireError("");
  };

  const handleRemoveHM = (index: number) => {
    setHireMilestones(hireMilestones.filter((_, i) => i !== index));
  };

  const handleSendDirectHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreelancerProfile) return;

    if (hireJobMode === "existing" && !selectedExistingJobId) {
      setDirectHireError("Please select an existing open project.");
      return;
    }
    if (hireJobMode === "new") {
      if (!newJobTitle.trim()) {
        setDirectHireError("Please provide a title for the new project.");
        return;
      }
      if (!newJobDesc.trim()) {
        setDirectHireError("Please provide a description for the new project.");
        return;
      }
    }
    if (hireBidAmount <= 0) {
      setDirectHireError("Offer amount must be a positive number.");
      return;
    }
    if (hireDeliveryDays <= 0) {
      setDirectHireError("Delivery days must be a positive number.");
      return;
    }

    setSubmittingDirectHire(true);
    setDirectHireError("");

    try {
      const token = localStorage.getItem("token");
      const payload = {
        freelancer_id: selectedFreelancerProfile.user_id,
        job_id: hireJobMode === "existing" ? parseInt(selectedExistingJobId) : undefined,
        new_job: hireJobMode === "new" ? { title: newJobTitle, description: newJobDesc } : undefined,
        bid_amount: hireBidAmount,
        delivery_days: hireDeliveryDays,
        cover_letter: hirePitch || `Direct hire offer for project`,
        milestones: hireMilestones.length > 0 ? hireMilestones : undefined
      };

      const res = await fetch(`${API_URL}/proposals/direct-hire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedFreelancerProfile(null);
        setShowHireWizard(false);
        setHireJobMode("existing");
        setSelectedExistingJobId("");
        setNewJobTitle("");
        setNewJobDesc("");
        setHireBidAmount(0);
        setHireDeliveryDays(0);
        setHirePitch("");
        setHireMilestones([]);
        triggerToast("success", "Hire offer sent!", "The freelancer has been notified of your direct hire offer.");
        fetchClientJobs();
      } else {
        setDirectHireError(data.message || "Failed to send hire offer.");
      }
    } catch (err) {
      setDirectHireError("Network error. Failed to send hire request.");
    } finally {
      setSubmittingDirectHire(false);
    }
  };

  if (onboardingStep === "loading") {
    return (
      <div className={`w-full min-h-screen ${isLight ? "bg-slate-50 text-slate-800" : "bg-slate-900 text-white"} flex flex-col items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-10 h-10 border-4 border-t-emerald-500 ${isLight ? "border-slate-200" : "border-slate-700"} rounded-full animate-spin`}></div>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} font-semibold text-sm`}>Loading onboarding credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden w-full bg-slate-50 flex flex-row print:bg-white print:h-auto print:overflow-visible print:block">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 lg:hidden cursor-pointer"
        />
      )}

      {/* LEFT SIDEBAR PANEL */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col h-screen lg:h-screen z-40 lg:z-0 transition-transform duration-300 transform lg:transform-none print:hidden ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <Link 
            href="/"
            className="flex items-center gap-2 select-none hover:opacity-80 transition-opacity cursor-pointer"
          >
            {((siteTheme === "dark" && siteLogoDark) ? siteLogoDark : siteLogo) ? (
              <img
                src={resolveLogoUrl((siteTheme === "dark" && siteLogoDark) ? siteLogoDark : siteLogo)}
                alt={siteName || "Buy2Lancer"}
                className="h-8 w-auto max-w-[150px] object-contain shrink-0"
              />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-750 font-extrabold shadow-sm shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-lg font-black tracking-tight font-display flex items-baseline gap-0.5">
                  {siteName ? (
                    (() => {
                      const words = siteName.split(" ");
                      if (words.length > 1) {
                        return (
                          <>
                            <span className="text-slate-800">{words[0]}</span>
                            <span className="text-teal-700">{words.slice(1).join(" ")}</span>
                          </>
                        );
                      }
                      const match = siteName.match(/^([a-z0-9]+)([A-Z].*)$/i);
                      if (match) {
                        return (
                          <>
                            <span className="text-slate-800">{match[1]}</span>
                            <span className="text-teal-700">{match[2]}</span>
                          </>
                        );
                      }
                      return <span className="text-slate-800">{siteName}</span>;
                    })()
                  ) : (
                    <>
                      <span className="text-slate-800">Buy2</span>
                      <span className="text-teal-700">Lancer</span>
                    </>
                  )}
                </span>
              </>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer flex items-center justify-center border border-slate-200 bg-slate-50"
            aria-label="Close sidebar"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Role Switcher */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-1.5 select-none">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-2">{t("active_workspace_role", "Active Workspace Role")}</span>
          <div onClick={() => setIsSidebarOpen(false)} className="bg-slate-100/80 p-1 rounded-xl flex gap-1 border border-slate-200/50">
            <button
              onClick={() => handleRoleSwitch("freelancer")}
              className={`flex-1 text-center py-1.5 rounded-lg text-xxs font-black transition-all cursor-pointer ${
                userRole === "freelancer"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/40 font-bold"
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              {t("freelancer_role", "Freelancer")}
            </button>
            <button
              onClick={() => handleRoleSwitch("client")}
              className={`flex-1 text-center py-1.5 rounded-lg text-xxs font-black transition-all cursor-pointer ${
                userRole === "client"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/40 font-bold"
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              {t("client_role", "Client")}
            </button>
          </div>
        </div>

        {userRole === "client" ? (
          <nav ref={navContainerRef} onClick={() => setIsSidebarOpen(false)} className="flex-1 min-h-0 p-4 flex flex-col gap-4 select-none overflow-y-auto scrollbar-thin">
            {/* Quick Action Button */}
            {!isProfileIncomplete && isClientApproved && (
              <div className="mb-2 shrink-0">
                <button
                  onClick={() => {
                    setActiveTab("proposals");
                    setIsCreatingJob(true);
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <FiZap className="w-4 h-4 text-white shrink-0" />
                  <span>{t("post_new_project_btn", "Post a New Project")}</span>
                </button>
              </div>
            )}
            
            {/* Common Workspace Hub */}
            <div className="flex flex-col gap-1">
              <button
                ref={bindActiveRef(activeTab === "workspace")}
                onClick={() => {
                  setActiveTab("workspace");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "workspace"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t("workspace_hub_menu", "Workspace Hub")}
              </button>
              <button
                ref={bindActiveRef(activeTab === "wishlist")}
                onClick={() => {
                  setActiveTab("wishlist");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "wishlist"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {t("my_wishlist_menu", "My Wishlist")}
              </button>
            </div>

            {/* HIRE FREELANCERS MODULE */}
            {!isProfileIncomplete && isClientApproved && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1">{t("hire_freelancers_header", "Hire Freelancers")}</span>
                
                <button
                  ref={bindActiveRef(activeTab === "find_work")}
                  onClick={() => {
                    setActiveTab("find_work");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "find_work"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>{t("search_browse_menu", "Search & Browse")}</span>
                </button>

                <button
                  ref={bindActiveRef(activeTab === "client_hired_freelancers")}
                  onClick={() => {
                    setActiveTab("client_hired_freelancers");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "client_hired_freelancers"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t("hired_freelancers_menu", "Hired Freelancers")}</span>
                </button>

                <button
                  ref={bindActiveRef(activeTab === "client_recommended_freelancers")}
                  onClick={() => {
                    setActiveTab("client_recommended_freelancers");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "client_recommended_freelancers"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>{t("recommendations_menu", "Recommendations")}</span>
                </button>

                <button
                  ref={bindActiveRef(activeTab === "proposals" && !isCreatingJob)}
                  onClick={() => {
                    setActiveTab("proposals");
                    setIsCreatingJob(false);
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between ${activeTab === "proposals" && !isCreatingJob
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <FiBriefcase className="w-4 h-4 shrink-0" />
                    <span>{t("my_posted_projects_menu", "My Posted Projects")}</span>
                  </div>
                </button>
              </div>
            )}

            {/* GIG ORDERS & SERVICES MODULE */}
            {!isProfileIncomplete && isClientApproved && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1">{t("gig_orders_services_header", "Gig Orders & Services")}</span>
                
                <button
                  ref={bindActiveRef(activeTab === "explore_gigs")}
                  onClick={() => {
                    setActiveTab("explore_gigs");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "explore_gigs"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {t("explore_gigs_menu", "Explore Gigs")}
                </button>

                <button
                  ref={bindActiveRef(activeTab === "client_orders")}
                  onClick={() => {
                    setActiveTab("client_orders");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "client_orders"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t("your_gig_orders_menu", "Your Gig Orders")}
                </button>
              </div>
            )}

            {/* COMMUNICATION & SETTINGS */}
            <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1">{t("communication_settings_header", "Communication & Settings")}</span>

              <button
                ref={bindActiveRef(activeTab === "notifications")}
                onClick={() => {
                  setActiveTab("notifications");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between ${activeTab === "notifications"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>{t("notifications_menu", "Notifications")}</span>
                </div>
                {unreadNotificationsCount > 0 && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === "notifications" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {isClientApproved && (
                <button
                  ref={bindActiveRef(activeTab === "inbox")}
                  onClick={() => {
                    setActiveTab("inbox");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "inbox"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                    }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {t("inbox_messages_menu", "Inbox Messages")}
                </button>
              )}

              <button
                ref={bindActiveRef(activeTab === "wallet")}
                onClick={() => {
                  setActiveTab("wallet");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "wallet"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t("my_wallet_menu", "My Wallet")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "reports")}
                onClick={() => {
                  setActiveTab("reports");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "reports"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-505 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                {t("financial_reports_menu", "Financial Reports")}
              </button>


              <button
                ref={bindActiveRef(activeTab === "subscription")}
                onClick={() => {
                  setActiveTab("subscription");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "subscription"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {t("subscription_menu", "My Subscription")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "referrals")}
                onClick={() => {
                  setActiveTab("referrals");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "referrals"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t("referrals_menu", "Refer & Earn")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "affiliate")}
                onClick={() => {
                  setActiveTab("affiliate");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "affiliate"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {t("affiliate_menu", "Affiliate Portal")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "settings")}
                onClick={() => {
                  setActiveTab("settings");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "settings"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t("settings_menu", "Settings")}
              </button>
            </div>
          </nav>
        ) : (
          <nav ref={navContainerRef} onClick={() => setIsSidebarOpen(false)} className="flex-1 min-h-0 p-4 flex flex-col gap-4 select-none overflow-y-auto scrollbar-thin">
            {/* Quick Action Button */}
            {isFreelancerApproved && (
              <div className="mb-2 shrink-0">
                <button
                  disabled={isProfileIncomplete}
                  onClick={() => {
                    setActiveTab("gigs");
                    setIsCreatingGig(true);
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${
                    isProfileIncomplete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <FiPlus className="w-4 h-4 text-white shrink-0" />
                  <span>{t("post_new_gig_btn", "Post a New Gig")}</span>
                </button>
              </div>
            )}
            {/* Common Workspace Hub */}
            <div className="flex flex-col gap-1">
              <button
                ref={bindActiveRef(activeTab === "workspace")}
                onClick={() => {
                  setActiveTab("workspace");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "workspace"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t("workspace_hub_menu", "Workspace Hub")}
              </button>
              <button
                ref={bindActiveRef(activeTab === "wishlist")}
                onClick={() => {
                  setActiveTab("wishlist");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "wishlist"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {t("my_wishlist_menu", "My Wishlist")}
              </button>
            </div>

            {/* FIND & DELIVER WORK */}
            {isFreelancerApproved && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1">{t("find_deliver_work_header", "Find & Deliver Work")}</span>
                
                <button
                  ref={bindActiveRef(activeTab === "find_work")}
                  disabled={isProfileIncomplete}
                  onClick={() => {
                    setActiveTab("find_work");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                    isProfileIncomplete
                      ? "opacity-50 cursor-not-allowed text-slate-400"
                      : activeTab === "find_work"
                        ? "bg-teal-700 text-white shadow-md shadow-teal-700/10 cursor-pointer"
                        : "text-slate-500 hover:text-slate-855 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>{t("find_work_menu", "Find Work")}</span>
                  </div>
                  {isProfileIncomplete && (
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </button>

                  <button
                    ref={bindActiveRef(activeTab === "proposals")}
                    disabled={isProfileIncomplete}
                    onClick={() => {
                      setActiveTab("proposals");
                      setSelectedProjectDetails(null);
                      setSelectedGigOrderDetails(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                      isProfileIncomplete
                        ? "opacity-50 cursor-not-allowed text-slate-400"
                        : activeTab === "proposals"
                          ? "bg-teal-700 text-white shadow-md shadow-teal-700/10 cursor-pointer"
                          : "text-slate-500 hover:text-slate-855 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{t("my_proposals_menu", "My Proposals")}</span>
                    </div>
                    {isProfileIncomplete ? (
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === "proposals" ? "bg-white/20 text-white" : "bg-teal-50 text-teal-700"}`}>
                        {freelancerProposals ? freelancerProposals.length : 0}
                      </span>
                    )}
                  </button>

                  <button
                    ref={bindActiveRef(activeTab === "my_projects")}
                    disabled={isProfileIncomplete}
                    onClick={() => {
                      setActiveTab("my_projects");
                      setSelectedProjectDetails(null);
                      setSelectedGigOrderDetails(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                      isProfileIncomplete
                        ? "opacity-50 cursor-not-allowed text-slate-400"
                        : activeTab === "my_projects"
                          ? "bg-teal-700 text-white shadow-md shadow-teal-700/10 cursor-pointer"
                          : "text-slate-500 hover:text-slate-855 hover:bg-slate-50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FiBriefcase className="w-4 h-4 shrink-0" />
                      <span>{t("my_projects_menu", "My Projects")}</span>
                    </div>
                    {isProfileIncomplete && (
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>

                <button
                  ref={bindActiveRef(activeTab === "gigs")}
                  disabled={isProfileIncomplete}
                  onClick={() => {
                    setActiveTab("gigs");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                    isProfileIncomplete
                      ? "opacity-50 cursor-not-allowed text-slate-400"
                      : activeTab === "gigs"
                        ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                        : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.75c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span>{t("my_gigs_menu", "My Gigs")}</span>
                  </div>
                  {isProfileIncomplete ? (
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === "gigs" ? "bg-white/20 text-white" : "bg-teal-50 text-teal-700"}`}>
                      {gigs ? gigs.length : 0}
                    </span>
                  )}
                </button>

                <button
                  ref={bindActiveRef(activeTab === "gig_applications")}
                  disabled={isProfileIncomplete}
                  onClick={() => {
                    setActiveTab("gig_applications");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                    isProfileIncomplete
                      ? "opacity-50 cursor-not-allowed text-slate-400"
                      : activeTab === "gig_applications"
                        ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                        : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-1.5l1.359-3.058a1.125 1.125 0 011.543-.58l1.359.604a1.125 1.125 0 001.388-.383l2.206-2.941" />
                    </svg>
                    <span>{t("gig_orders_menu", "Gig Orders")}</span>
                  </div>
                  {isProfileIncomplete ? (
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === "gig_applications" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-100/50"}`}>
                      {gigApplications ? gigApplications.length : 0}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* COMMUNICATION & SETTINGS */}
            <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1">{t("communication_settings_header", "Communication & Settings")}</span>

              <button
                ref={bindActiveRef(activeTab === "notifications")}
                disabled={isProfileIncomplete}
                onClick={() => {
                  setActiveTab("notifications");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                  isProfileIncomplete
                    ? "opacity-50 cursor-not-allowed text-slate-400"
                    : activeTab === "notifications"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>{t("notifications_menu", "Notifications")}</span>
                </div>
                {isProfileIncomplete ? (
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  unreadNotificationsCount > 0 && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === "notifications" ? "bg-white/20 text-white" : "bg-rose-50 text-rose-700 border border-rose-100/50"}`}>
                      {unreadNotificationsCount}
                    </span>
                  )
                )}
              </button>

              {isFreelancerApproved && (
                <button
                  ref={bindActiveRef(activeTab === "inbox")}
                  disabled={isProfileIncomplete}
                  onClick={() => {
                    setActiveTab("inbox");
                    setSelectedProjectDetails(null);
                    setSelectedGigOrderDetails(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                    isProfileIncomplete
                      ? "opacity-50 cursor-not-allowed text-slate-400"
                      : activeTab === "inbox"
                        ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                        : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{t("inbox_messages_menu", "Inbox Messages")}</span>
                  </div>
                  {isProfileIncomplete ? (
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === "inbox" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-100/50"}`}>
                      {t("new_badge", "New")}
                    </span>
                  )}
                </button>
              )}

              <button
                ref={bindActiveRef(activeTab === "wallet")}
                disabled={isProfileIncomplete}
                onClick={() => {
                  setActiveTab("wallet");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                  isProfileIncomplete
                    ? "opacity-50 cursor-not-allowed text-slate-400"
                    : activeTab === "wallet"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t("my_wallet_menu", "My Wallet")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "reports")}
                disabled={isProfileIncomplete}
                onClick={() => {
                  setActiveTab("reports");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                  isProfileIncomplete
                    ? "opacity-50 cursor-not-allowed text-slate-400"
                    : activeTab === "reports"
                      ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                      : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                {t("financial_reports_menu", "Financial Reports")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "subscription")}
                onClick={() => {
                  setActiveTab("subscription");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "subscription"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {t("subscription_menu", "My Subscription")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "referrals")}
                onClick={() => {
                  setActiveTab("referrals");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "referrals"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t("referrals_menu", "Refer & Earn")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "affiliate")}
                onClick={() => {
                  setActiveTab("affiliate");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "affiliate"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {t("affiliate_menu", "Affiliate Portal")}
              </button>

              <button
                ref={bindActiveRef(activeTab === "settings")}
                onClick={() => {
                  setActiveTab("settings");
                  setSelectedProjectDetails(null);
                  setSelectedGigOrderDetails(null);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-3 ${activeTab === "settings"
                    ? "bg-teal-700 text-white shadow-md shadow-teal-700/10"
                    : "text-slate-500 hover:text-slate-855 hover:bg-slate-50"
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t("settings_menu", "Settings")}
              </button>
            </div>
          </nav>
        )}

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white shadow-sm select-none shrink-0 overflow-hidden relative bg-gradient-to-tr from-teal-700 to-cyan-500">
                <span className="font-extrabold text-white">
                  {userName ? userName.substring(0, 2).toUpperCase() : "US"}
                </span>
                {profileImage && (
                  <img
                    src={profileImage.startsWith("http") ? profileImage : `https://freelancer.sangvish.com${profileImage}`}
                    alt={userName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                  <button
                    onClick={() => setActiveTab("wallet")}
                    className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="View Digital Wallet Balance"
                  >
                    <span>💳</span>
                    <span>${parseFloat(walletInfo?.wallet?.balance || "0.00").toFixed(2)}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{userRole === "client" ? t("client_role", "Client") : t("freelancer_role", "Freelancer")}</p>
                  {parseFloat(walletInfo?.wallet?.pending_bonus_balance || "0") > 0 && (
                    <span 
                      onClick={() => setActiveTab("wallet")}
                      className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md cursor-pointer hover:bg-amber-100" 
                      title="Pending Admin Payout Approval"
                    >
                      +${parseFloat(walletInfo.wallet.pending_bonus_balance).toFixed(2)} Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 cursor-pointer shadow-sm lg:hidden shrink-0"
            >
              {t("logout_btn", "Logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col max-w-full lg:h-screen lg:overflow-hidden relative z-10 print:h-auto print:overflow-visible print:block">
        <header className="h-16 w-full bg-white border-b border-slate-200 px-6 flex flex-row items-center justify-between relative z-50 shrink-0 shadow-sm print:hidden">
          {/* Left: Mobile hamburger menu toggle & role switch */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-xl transition-all cursor-pointer shadow-sm lg:hidden flex items-center justify-center w-9 h-9"
              aria-label="Open sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>

            {/* Header Role indicator */}
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline uppercase tracking-widest">{t("active_workspace_indicator", "Active Workspace:")}</span>
              <span className="px-3 py-1.5 rounded-xl border border-teal-150 bg-teal-50/50 text-xs font-bold text-teal-800 shadow-xxs">
                {userRole === "client" ? t("client_view_indicator", "Client View") : t("freelancer_view_indicator", "Freelancer View")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const nextTheme = siteTheme === "light" ? "dark" : "light";
                setSiteTheme(nextTheme);
              }}
              className={`p-2 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center ${
                siteTheme === "dark" 
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800" 
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              aria-label="Toggle theme"
            >
              {siteTheme === "dark" ? (
                // Sun Icon (Solid)
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                // Moon Icon (Solid)
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Notifications Bell Dropdown */}
            <NotificationsDropdown
              notifications={notifications}
              unreadNotificationsCount={unreadNotificationsCount}
              isNotificationsOpen={isNotificationsOpen}
              setIsNotificationsOpen={setIsNotificationsOpen}
              handleMarkAllRead={handleMarkAllRead}
              handleMarkSingleRead={handleMarkSingleRead}
              setActiveTab={setActiveTab}
            />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="hidden sm:block text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors px-4 py-2 rounded-xl bg-rose-50 border border-rose-200/60 hover:bg-rose-100 cursor-pointer shadow-sm shrink-0"
            >
              {t("logout_btn", "Logout")}
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <div className="flex-1 py-3 sm:py-8 px-2 sm:px-6 overflow-y-auto relative z-10 w-full flex flex-col gap-4 sm:gap-8 print:p-0 print:overflow-visible print:block print:gap-4">
          {/* Background Decorative Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>

          {!onboardingCompleted && (
            <div className="flex items-center justify-between gap-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/50 rounded-xl px-5 py-4 shadow-sm animate-fadeIn relative overflow-hidden shrink-0 select-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.03] rounded-full filter blur-xl"></div>
              
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-sm">
                  <FiAlertTriangle className="w-4 h-4 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-rose-800 dark:text-rose-450 uppercase tracking-wide">
                    {t("profile_onboarding_pending_title", "Profile Onboarding Pending")}
                  </h4>
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 font-extrabold mt-0.5 leading-relaxed">
                    {t("profile_onboarding_pending_desc", "Please complete your profile configuration to unlock full platform features and navigate pages.")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setForceShowOnboarding(true)}
                className="bg-rose-600 hover:bg-rose-750 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 border-0 cursor-pointer"
              >
                {t("complete_onboarding_btn", "Complete Onboarding")}
              </button>
            </div>
          )}

          {onboardingCompleted && vettingStatus === "Pending" && (
            <div className="flex items-center gap-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/50 rounded-xl px-5 py-4 shadow-sm animate-fadeIn relative overflow-hidden shrink-0 select-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.03] rounded-full filter blur-xl"></div>
              
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                <FiClock className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-amber-800 dark:text-amber-450 flex items-center gap-1.5 uppercase tracking-wide">
                  {t("onboarding_profile_under_review_title", "Onboarding Profile Under Review")}
                </h4>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold mt-0.5 leading-relaxed">
                  {t("onboarding_profile_under_review_desc", "Your credentials have been submitted successfully and are currently in the queue for manual admin vetting. Some workspace actions will remain locked until approval.")}
                </p>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Onboarding Popup Overlay */}
      {(showOnboardingModal || forceShowOnboarding) && (
        <div className={`fixed inset-0 z-[10000] ${modalOverlayClass} flex items-center justify-center p-4 overflow-y-auto select-none`}>
          
          {/* STEP 1: ROLE SELECTION MODAL */}
          {onboardingStep === "role_selection" && (
            <div className={`${cardBgClass} w-full max-w-xl rounded-xl overflow-hidden relative flex flex-col p-6 sm:p-8 animate-fadeIn`}>
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-25%] left-[-15%] w-[25rem] h-[25rem] bg-emerald-500/10 rounded-full filter blur-[80px]"></div>
                <div className="absolute bottom-[-25%] right-[-15%] w-[25rem] h-[25rem] bg-teal-500/10 rounded-full filter blur-[80px]"></div>
              </div>

              <button
                onClick={() => {
                  handleSkip();
                  setForceShowOnboarding(false);
                }}
                className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer z-20 flex items-center justify-center gap-1.5 border text-slate-500 hover:text-slate-850 bg-slate-100 hover:bg-slate-200/80 border-slate-200"
              >
                Close
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative z-10 flex-grow flex flex-col justify-center items-center py-4">
                <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase mb-1.5">Setup Onboarding</span>
                <h1 className="text-xl sm:text-2xl font-black leading-tight tracking-tight text-center max-w-sm text-slate-900">
                  How do you plan to use our platform?
                </h1>
                <p className="text-xs sm:text-sm text-center mt-2 max-w-xs leading-relaxed text-slate-500 font-medium">
                  Choose the workspace track that matches your goals. We&apos;ll configure your experience accordingly.
                </p>

                {clientNotice && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-xl animate-pulse text-center w-full">
                    💼 Client flow selected! Redirecting to dashboard workspace...
                  </div>
                )}

                <div className="flex flex-col gap-4 w-full mt-6">
                  <div
                    onClick={handleSelectFreelancer}
                    className="border p-4.5 rounded-xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md group flex items-start gap-4 text-left bg-slate-50/50 border-slate-200 hover:border-teal-700/50 hover:bg-white"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-base shrink-0 group-hover:scale-105 transition-transform duration-300">
                      💻
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold group-hover:text-emerald-500 transition-colors text-slate-900">
                        I&apos;m a Freelancer
                      </h3>
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                        I want to find remote contracts, grow my skills, and build project milestones.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={handleSelectClient}
                    className="border p-4.5 rounded-xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md group flex items-start gap-4 text-left bg-slate-50/50 border-slate-200 hover:border-teal-700/50 hover:bg-white"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-base shrink-0 group-hover:scale-105 transition-transform duration-300">
                      💼
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold group-hover:text-emerald-500 transition-colors text-slate-900">
                        I&apos;m a Client
                      </h3>
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                        I want to hire remote talent, fund contracts securely, and review deliverables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLIENT STEP-BY-STEP FLOW */}
          {onboardingStep === "client_flow" && (
            <div className="bg-white border border-slate-200/80 shadow-2xl text-slate-800 w-full max-w-3xl rounded-xl overflow-hidden relative flex flex-col p-6 sm:p-8 animate-fadeIn max-h-[90vh]">
              <button
                onClick={handleSkip}
                className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer z-20 flex items-center justify-center gap-1.5 border text-slate-500 hover:text-slate-855 bg-slate-100 hover:bg-slate-200/80 border-slate-200"
              >
                Close
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[30rem] h-[30rem] bg-emerald-500/5 rounded-full filter blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[30rem] h-[30rem] bg-teal-500/5 rounded-full filter blur-[100px]"></div>
              </div>

              <div className="relative z-10 flex items-center justify-between border-b border-slate-100/55 pb-4 mb-6 pr-16 sm:pr-24 text-left">
                <div>
                  <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Client Onboarding</span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">Step {clientWizardStep} of {totalClientSteps}</h2>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalClientSteps }, (_, i) => i + 1).map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === clientWizardStep
                          ? "w-8 bg-emerald-500"
                          : step < clientWizardStep
                          ? "w-3 bg-emerald-700"
                          : "w-3 bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div ref={clientScrollRef} className="relative z-10 flex-grow overflow-y-auto no-scrollbar pr-4 text-left">
                {clientError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl mb-4">
                    ⚠️ {clientError}
                  </div>
                )}
                {clientSuccess && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-xl mb-4 animate-pulse">
                    {clientWizardStep === totalClientSteps 
                      ? "🎉 Setup complete! Redirecting to workspace..." 
                      : "🎉 Section saved! Moving to next step..."}
                  </div>
                )}

                {/* STEP 1: COMPANY BASICS */}
                {clientWizardStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-slate-900">Company Basics</h3>
                    <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                      Let's set up the basic credentials of your organization or business.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {isFieldEnabled("company_name") && (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Company Name {isFieldRequired("company_name") ? "*" : ""}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Acme Corporation"
                            value={companyName}
                            onChange={(e) => {
                              setCompanyName(e.target.value);
                              if (clientFieldErrors.company_name) {
                                setClientFieldErrors((prev) => ({ ...prev, company_name: "" }));
                              }
                            }}
                            className={`${inputClass} ${clientFieldErrors.company_name ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {clientFieldErrors.company_name && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.company_name}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("industry") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Industry {isFieldRequired("industry") ? "*" : ""}
                          </label>
                          <div className={clientFieldErrors.industry ? "rounded-xl border border-rose-400 p-0.5" : ""}>
                            <CustomSelect
                              options={[
                                { value: "Technology", label: "Technology & Software" },
                                { value: "Finance", label: "Finance & Banking" },
                                { value: "Healthcare", label: "Healthcare & Medicine" },
                                { value: "Education", label: "Education & EdTech" },
                                { value: "Marketing", label: "Marketing & Advertising" },
                                { value: "Retail", label: "Retail & E-commerce" },
                                { value: "Other", label: "Other Industry" }
                              ]}
                              value={industry}
                              onChange={(val) => {
                                setIndustry(val as string);
                                if (clientFieldErrors.industry) {
                                  setClientFieldErrors((prev) => ({ ...prev, industry: "" }));
                                }
                              }}
                              placeholder="Select Industry"
                            />
                          </div>
                          {clientFieldErrors.industry && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.industry}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("company_size") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Company Size {isFieldRequired("company_size") ? "*" : ""}
                          </label>
                          <div className={clientFieldErrors.company_size ? "rounded-xl border border-rose-400 p-0.5" : ""}>
                            <CustomSelect
                              options={[
                                { value: "1-10", label: "1-10 employees" },
                                { value: "11-50", label: "11-50 employees" },
                                { value: "51-200", label: "51-200 employees" },
                                { value: "201-500", label: "201-500 employees" },
                                { value: "500+", label: "500+ employees" }
                              ]}
                              value={companySize}
                              onChange={(val) => {
                                setCompanySize(val as string);
                                if (clientFieldErrors.company_size) {
                                  setClientFieldErrors((prev) => ({ ...prev, company_size: "" }));
                                }
                              }}
                              placeholder="Select Company Size"
                            />
                          </div>
                          {clientFieldErrors.company_size && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.company_size}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("established_year") && (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Established Year {isFieldRequired("established_year") ? "*" : ""}
                          </label>
                          <input
                            type="number"
                            min="1800"
                            max={new Date().getFullYear()}
                            placeholder="e.g. 2020"
                            value={companyEstablishedYear}
                            onChange={(e) => {
                              setCompanyEstablishedYear(e.target.value);
                              if (clientFieldErrors.established_year) {
                                setClientFieldErrors((prev) => ({ ...prev, established_year: "" }));
                              }
                            }}
                            className={`${inputClass} ${clientFieldErrors.established_year ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {clientFieldErrors.established_year && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.established_year}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: COMPANY PRESENCE & DETAILS */}
                {clientWizardStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-slate-900">Company Presence & Details</h3>
                    <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                      Provide details about your company website and description to build trust with candidates.
                    </p>

                    <div className="space-y-4">
                      {isFieldEnabled("company_website") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Website URL {isFieldRequired("company_website") ? "*" : ""}
                          </label>
                          <input
                            type="url"
                            placeholder="https://www.company.com"
                            value={companyWebsite}
                            onChange={(e) => {
                              setCompanyWebsite(e.target.value);
                              if (clientFieldErrors.company_website) {
                                setClientFieldErrors((prev) => ({ ...prev, company_website: "" }));
                              }
                            }}
                            className={`${inputClass} ${clientFieldErrors.company_website ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {clientFieldErrors.company_website && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.company_website}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("company_description") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Company Description {isFieldRequired("company_description") ? "*" : ""}
                          </label>
                          <textarea
                            placeholder="Tell us about what your business does, your mission, and your work culture..."
                            value={companyDescription}
                            onChange={(e) => {
                              setCompanyDescription(e.target.value);
                              if (clientFieldErrors.company_description) {
                                setClientFieldErrors((prev) => ({ ...prev, company_description: "" }));
                              }
                            }}
                            className={`${inputClass} h-32 ${clientFieldErrors.company_description ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {clientFieldErrors.company_description && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.company_description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: REPRESENTATIVE CONTACT DETAILS */}
                {clientWizardStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-base font-black text-slate-900">Hiring Contact Details</h3>
                    <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                      Provide the contact representative details who will be interacting and hiring freelancers.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {isFieldEnabled("hiring_contact_name") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Hiring Contact Name {isFieldRequired("hiring_contact_name") ? "*" : ""}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. John Doe"
                            value={hiringContactName}
                            onChange={(e) => {
                              setHiringContactName(e.target.value);
                              if (clientFieldErrors.hiring_contact_name) {
                                setClientFieldErrors((prev) => ({ ...prev, hiring_contact_name: "" }));
                              }
                            }}
                            className={`${inputClass} ${clientFieldErrors.hiring_contact_name ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {clientFieldErrors.hiring_contact_name && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.hiring_contact_name}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("hiring_contact_designation") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Hiring Contact Designation {isFieldRequired("hiring_contact_designation") ? "*" : ""}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Head of Talent Acquisition"
                            value={hiringContactDesignation}
                            onChange={(e) => {
                              setHiringContactDesignation(e.target.value);
                              if (clientFieldErrors.hiring_contact_designation) {
                                setClientFieldErrors((prev) => ({ ...prev, hiring_contact_designation: "" }));
                              }
                            }}
                            className={`${inputClass} ${clientFieldErrors.hiring_contact_designation ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {clientFieldErrors.hiring_contact_designation && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {clientFieldErrors.hiring_contact_designation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CLIENT STEP 4: DOCUMENT VERIFICATION */}
                {clientWizardStep >= 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Document Verification</h3>
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                        Please upload valid evidence for the following documents. These will be reviewed by our compliance team.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {loadingDocFields ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin" />
                        </div>
                      ) : enabledDocFields.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-semibold text-xs bg-slate-50 rounded-xl border border-slate-200/50">
                          No document verification required. You can complete onboarding.
                        </div>
                      ) : (
                        enabledDocFields.map((field) => {
                          const userDoc = userUploadedDocs.find(d => d.field_id === field.field_id);
                          const isUploaded = !!userDoc;
                          const status = userDoc?.status || "Pending";
                          const isUploading = !!uploadingFields[field.field_id];
                          const errorMsg = fieldErrors[field.field_id];
                          const isFieldRequired = field.is_required == 1 || field.is_required === true || field.is_required === "1" || field.is_required === "true";

                          return (
                            <div key={field.field_id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 text-left space-y-4 relative overflow-hidden group">
                              {/* Field Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                                    <FiFileText className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                      <span>{field.field_name}</span>
                                      {isFieldRequired ? (
                                        <span className="text-rose-500 font-black text-sm leading-none ml-0.5 select-none" title="Required Field">*</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-400 normal-case ml-1 select-none tracking-normal">(Optional)</span>
                                      )}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">{field.field_description}</p>
                                  </div>
                                </div>

                                {isUploaded && (
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs ${
                                    status === "Approved"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : status === "Rejected"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}>
                                    {status === "Approved" ? "✓ Approved" : status === "Rejected" ? "✕ Rejected" : "⏳ Audit Pending"}
                                  </span>
                                )}
                              </div>

                              {/* Expiration Date Section if Required */}
                              {field.has_expiry && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0 flex items-center gap-1">
                                    <span>📅</span> Expiration Date {isFieldRequired && <span className="text-rose-500 font-extrabold text-xs">*</span>}:
                                  </label>
                                  <input
                                    type="date"
                                    value={expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "")}
                                    onChange={(e) => setExpiryDates({ ...expiryDates, [field.field_id]: e.target.value })}
                                    disabled={status === "Approved"}
                                    className="bg-white border border-slate-250 hover:border-slate-350 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 transition-all flex-1 max-w-xs"
                                  />
                                </div>
                              )}

                              {/* Upload Dropzone OR Uploaded Evidence Preview Card */}
                              {!isUploaded ? (
                                (!field.field_type || field.field_type.startsWith("file_")) ? (
                                  <label
                                    className={`w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer group/drop shadow-2xs ${status === "Approved" || isUploading ? "opacity-50 pointer-events-none" : ""}`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover/drop:scale-105 transition-transform duration-200">
                                        <FiUploadCloud className="w-4.5 h-4.5" />
                                      </div>
                                      <div className="min-w-0 text-left">
                                        <p className="text-xs font-black text-slate-800 group-hover/drop:text-emerald-700 transition-colors truncate">
                                          {isUploading ? "Uploading File to Server..." : "Click or Drag & Drop File Here"}
                                        </p>
                                        <p className="text-[10px] font-extrabold text-slate-400 mt-0.5 truncate">
                                          PDF, JPG, PNG or DOC (Max 10MB)
                                        </p>
                                      </div>
                                    </div>

                                    <span style={{ fontSize: "11px" }} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 group-hover/drop:bg-emerald-700 text-white font-extrabold shadow-2xs transition-all active:scale-95 select-none">
                                      <FiFileText className="w-3.5 h-3.5" />
                                      <span>Browse File</span>
                                    </span>

                                    <input
                                      type="file"
                                      accept={field.field_type === 'file_pdf' ? '.pdf' : field.field_type === 'file_image' ? 'image/png,image/jpeg,image/jpg' : field.field_type === 'file_word' ? '.doc,.docx' : '.pdf,.png,.jpg,.jpeg,.doc,.docx'}
                                      className="hidden"
                                      disabled={isUploading || status === "Approved"}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Validate file extension to prevent uploading video/non-doc files
                                        const allowedExtensions = /(\.pdf|\.jpg|\.jpeg|\.png|\.doc|\.docx)$/i;
                                        if (!allowedExtensions.exec(file.name)) {
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: "Invalid file type. Only PDF, JPG, JPEG, PNG, DOC, and DOCX are allowed." });
                                          triggerToast("error", "Invalid file type. Only PDF, JPG, JPEG, PNG, DOC, and DOCX are allowed.");
                                          return;
                                        }

                                        const expDate = expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "");
                                        if (field.has_expiry && !expDate) {
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: "Please select document expiration date first." });
                                          return;
                                        }
                                        try {
                                          setUploadingFields({ ...uploadingFields, [field.field_id]: true });
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: "" });
                                          await handleUploadDocument(field.field_id, file, expDate);
                                          triggerToast("success", `${field.field_name} uploaded successfully!`);
                                        } catch (err: any) {
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: err.message || "Failed to upload file." });
                                        } finally {
                                          setUploadingFields({ ...uploadingFields, [field.field_id]: false });
                                        }
                                      }}
                                    />
                                  </label>
                                ) : (
                                  <div className="space-y-2">
                                    <input
                                      type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                                      value={textValues[field.field_id] !== undefined ? textValues[field.field_id] : (userDoc?.text_value || "")}
                                      onChange={(e) => setTextValues({ ...textValues, [field.field_id]: e.target.value })}
                                      disabled={status === "Approved" || isUploading}
                                      placeholder={`Enter ${field.field_name}...`}
                                      className={inputClass}
                                    />
                                    <button
                                      type="button"
                                      disabled={status === "Approved" || isUploading}
                                      onClick={() => {
                                        const textVal = textValues[field.field_id] !== undefined ? textValues[field.field_id] : (userDoc?.text_value || "");
                                        const expDate = expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "");
                                        handleSaveTextValue(field.field_id, textVal, expDate);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                                    >
                                      <FiCheck className="w-4 h-4" />
                                      <span>{isUploading ? "Saving..." : "Save Information"}</span>
                                    </button>
                                  </div>
                                )
                              ) : (
                                /* Uploaded Card Preview */
                                <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                                      <FiCheck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-black text-slate-850 truncate">
                                        {userDoc.file_url ? userDoc.file_url.split('/').pop() : userDoc.text_value}
                                      </p>
                                      <p className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                                        <span>✓ Verified File Uploaded</span>
                                        {userDoc?.expiry_date && <span>• Expires: {userDoc.expiry_date.substring(0, 10)}</span>}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {userDoc?.file_url && (
                                      <a
                                        href={userDoc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        <span>View File</span>
                                        <span>↗</span>
                                      </a>
                                    )}

                                    {status !== "Approved" && (!field.field_type || field.field_type.startsWith("file_")) && (
                                      <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95">
                                        <span>Replace File</span>
                                        <input
                                          type="file"
                                          accept={field.field_type === 'file_pdf' ? '.pdf' : field.field_type === 'file_image' ? 'image/png,image/jpeg,image/jpg' : field.field_type === 'file_word' ? '.doc,.docx' : '*'}
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const expDate = expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "");
                                            try {
                                              setUploadingFields({ ...uploadingFields, [field.field_id]: true });
                                              setFieldErrors({ ...fieldErrors, [field.field_id]: "" });
                                              await handleUploadDocument(field.field_id, file, expDate);
                                              triggerToast("success", `${field.field_name} updated successfully!`);
                                            } catch (err: any) {
                                              setFieldErrors({ ...fieldErrors, [field.field_id]: err.message || "Failed to update file." });
                                            } finally {
                                              setUploadingFields({ ...uploadingFields, [field.field_id]: false });
                                            }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              )}

                              {errorMsg && (
                                <p className="text-[11px] text-rose-600 font-extrabold select-none bg-rose-50 border border-rose-200/70 p-2.5 rounded-xl flex items-center gap-1.5">
                                  <span>⚠️</span> {errorMsg}
                                </p>
                              )}

                              {status === "Rejected" && userDoc?.rejection_reason && (
                                <p className="text-[11px] text-rose-600 font-extrabold select-none bg-rose-50 border border-rose-200/70 p-2.5 rounded-xl flex items-center gap-1.5">
                                  <span>❌ Rejection Reason:</span> {userDoc.rejection_reason}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative z-10 flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 shrink-0">
                <button
                  type="button"
                  disabled={clientWizardStep === 1}
                  onClick={() => setClientWizardStep(clientWizardStep - 1)}
                  className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-slate-500 hover:text-slate-800 bg-slate-100"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveClientStep(clientWizardStep)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer text-white flex items-center gap-1 shadow-md"
                >
                  <span className="text-white">{clientWizardStep === totalClientSteps ? "Complete Onboarding ✓" : "Save & Continue →"}</span>
                </button>
              </div>
            </div>
          )}

          {/* FREELANCER STEP-BY-STEP FLOW */}
          {onboardingStep === "freelancer_flow" && (
            <div className="bg-white border border-slate-200/80 shadow-2xl text-slate-800 w-full max-w-5xl rounded-xl overflow-hidden relative flex flex-col p-6 sm:p-8 animate-fadeIn max-h-[90vh]">
              <button
                onClick={handleSkip}
                className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer z-20 flex items-center justify-center gap-1.5 border text-slate-500 hover:text-slate-850 bg-slate-100 hover:bg-slate-200/80 border-slate-200"
              >
                Close
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[30rem] h-[30rem] bg-emerald-500/5 rounded-full filter blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[30rem] h-[30rem] bg-teal-500/5 rounded-full filter blur-[100px]"></div>
              </div>

              <div className="relative z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 pr-16 sm:pr-24">
                <div>
                  <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Freelancer Onboarding</span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">Step {wizardStep} of {totalFreelancerSteps}</h2>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalFreelancerSteps }, (_, i) => i + 1).map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step === wizardStep
                          ? "w-8 bg-emerald-500"
                          : step < wizardStep
                          ? "w-3 bg-emerald-700"
                          : "w-3 bg-slate-450"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div ref={freelancerScrollRef} className="relative z-10 flex-grow overflow-y-auto no-scrollbar pr-4 text-left">
                
                {/* STEP 1 FORM - PROFILE DETAILS */}
                {wizardStep === 1 && (
                  <form onSubmit={handleSaveStep1} className="space-y-4">
                    <h3 className="text-base font-black text-slate-900">Setup Profile & Details</h3>
                    <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                      Tell clients about your professional domain, level of expertise, availability, and active skills.
                    </p>

                    {step1Error && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl">
                        ⚠️ {step1Error}
                      </div>
                    )}
                    {step1Success && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-xl">
                        🎉 Profile information updated! Navigating to Step 2...
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {isFieldEnabled("category") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Category {isFieldRequired("category") ? "*" : ""}
                          </label>
                          <div className={step1FieldErrors.category ? "rounded-xl border border-rose-400 p-0.5" : ""}>
                            <CustomSelect
                              options={categories.map((c) => ({ value: c.category_id, label: c.category_name }))}
                              value={categoryId}
                              onChange={(val) => {
                                handleCategoryChange(String(val));
                                if (step1FieldErrors.category) {
                                  setStep1FieldErrors((prev) => ({ ...prev, category: "", subcategory: "" }));
                                }
                              }}
                              placeholder="Select Category"
                            />
                          </div>
                          {step1FieldErrors.category && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.category}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("category") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Subcategory {isFieldRequired("category") ? "*" : ""}
                          </label>
                          <div className={step1FieldErrors.subcategory ? "rounded-xl border border-rose-400 p-0.5" : ""}>
                            <CustomSelect
                              options={subCategories.map((sc) => ({ value: sc.sub_category_id, label: sc.sub_category_name }))}
                              value={subCategoryId}
                              disabled={!categoryId}
                              onChange={(val) => {
                                setSubCategoryId(String(val));
                                if (step1FieldErrors.subcategory) {
                                  setStep1FieldErrors((prev) => ({ ...prev, subcategory: "" }));
                                }
                              }}
                              placeholder="Select Subcategory"
                            />
                          </div>
                          {step1FieldErrors.subcategory && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.subcategory}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("title") && (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Professional Title {isFieldRequired("title") ? "*" : ""}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Senior Full Stack Engineer (React, Node)"
                            value={professionalTitle}
                            onChange={(e) => {
                              setProfessionalTitle(e.target.value);
                              if (step1FieldErrors.title) {
                                setStep1FieldErrors((prev) => ({ ...prev, title: "" }));
                              }
                            }}
                            className={`${inputClass} ${step1FieldErrors.title ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {step1FieldErrors.title && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.title}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("experience_level") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Experience Level {isFieldRequired("experience_level") ? "*" : ""}
                          </label>
                          <div className={step1FieldErrors.experience_level ? "rounded-xl border border-rose-400 p-0.5" : ""}>
                            <CustomSelect
                              options={[
                                { value: "Beginner", label: "Beginner" },
                                { value: "Intermediate", label: "Intermediate" },
                                { value: "Expert", label: "Expert" }
                              ]}
                              value={experienceLevel}
                              onChange={(val) => {
                                setExperienceLevel(val as string);
                                if (step1FieldErrors.experience_level) {
                                  setStep1FieldErrors((prev) => ({ ...prev, experience_level: "" }));
                                }
                              }}
                              placeholder="Select Experience Level"
                            />
                          </div>
                          {step1FieldErrors.experience_level && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.experience_level}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("experience_level") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Years of Experience {isFieldRequired("experience_level") ? "*" : ""}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 5"
                            value={totalExperienceYears}
                            onChange={(e) => {
                              setTotalExperienceYears(e.target.value);
                              if (step1FieldErrors.total_experience_years) {
                                setStep1FieldErrors((prev) => ({ ...prev, total_experience_years: "" }));
                              }
                            }}
                            className={`${inputClass} ${step1FieldErrors.total_experience_years ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {step1FieldErrors.total_experience_years && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.total_experience_years}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("hourly_rate") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Hourly Rate ($) {isFieldRequired("hourly_rate") ? "*" : ""}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 45"
                            value={hourlyRate}
                            onChange={(e) => {
                              setHourlyRate(e.target.value);
                              if (step1FieldErrors.hourly_rate) {
                                setStep1FieldErrors((prev) => ({ ...prev, hourly_rate: "" }));
                              }
                            }}
                            className={`${inputClass} ${step1FieldErrors.hourly_rate ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {step1FieldErrors.hourly_rate && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.hourly_rate}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("availability_status") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Availability Status {isFieldRequired("availability_status") ? "*" : ""}
                          </label>
                          <div className={step1FieldErrors.availability_status ? "rounded-xl border border-rose-400 p-0.5" : ""}>
                            <CustomSelect
                              options={[
                                { value: "Available", label: "Available" },
                                { value: "Busy", label: "Busy" },
                                { value: "Not Available", label: "Not Available" }
                              ]}
                              value={availabilityStatus}
                              onChange={(val) => {
                                setAvailabilityStatus(val as string);
                                if (step1FieldErrors.availability_status) {
                                  setStep1FieldErrors((prev) => ({ ...prev, availability_status: "" }));
                                }
                              }}
                              placeholder="Select Availability"
                            />
                          </div>
                          {step1FieldErrors.availability_status && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.availability_status}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("linkedin") && (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            LinkedIn Profile Link {isFieldRequired("linkedin") ? "*" : ""}
                          </label>
                          <input
                            type="url"
                            placeholder="https://linkedin.com/in/username"
                            value={linkedinUrl}
                            onChange={(e) => {
                              setLinkedinUrl(e.target.value);
                              if (step1FieldErrors.linkedin) {
                                setStep1FieldErrors((prev) => ({ ...prev, linkedin: "" }));
                              }
                            }}
                            className={`${inputClass} ${step1FieldErrors.linkedin ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {step1FieldErrors.linkedin && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.linkedin}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("website") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Portfolio Website URL {isFieldRequired("website") ? "*" : ""}
                          </label>
                          <input
                            type="url"
                            placeholder="https://myportfolio.com"
                            value={portfolioWebsite}
                            onChange={(e) => {
                              setPortfolioWebsite(e.target.value);
                              if (step1FieldErrors.website) {
                                setStep1FieldErrors((prev) => ({ ...prev, website: "" }));
                              }
                            }}
                            className={`${inputClass} ${step1FieldErrors.website ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {step1FieldErrors.website && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.website}
                            </p>
                          )}
                        </div>
                      )}

                      {isFieldEnabled("github") && (
                        <div>
                          <label className="text-xs font-bold block mb-1 text-slate-600">
                            Resume Document URL {isFieldRequired("github") ? "*" : ""}
                          </label>
                          <input
                            type="url"
                            placeholder="https://drive.google.com/.../resume.pdf"
                            value={resumeUrl}
                            onChange={(e) => {
                              setResumeUrl(e.target.value);
                              if (step1FieldErrors.github) {
                                setStep1FieldErrors((prev) => ({ ...prev, github: "" }));
                              }
                            }}
                            className={`${inputClass} ${step1FieldErrors.github ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/30" : ""}`}
                          />
                          {step1FieldErrors.github && (
                            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.github}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {isFieldEnabled("skills") && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold block text-slate-600">
                            Select Skills {isFieldRequired("skills") ? "*" : ""} (At least 1)
                          </label>
                          {!subCategoryId && availableSkills.length > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Showing all skills
                            </span>
                          )}
                        </div>
                        {availableSkills.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Loading available skills...</p>
                        ) : (
                          <div className={`flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-xl border bg-slate-100/50 ${step1FieldErrors.skills ? "border-rose-400 ring-1 ring-rose-400/30" : "border-slate-200"}`}>
                            {availableSkills.map((sk) => {
                              const isChecked = selectedSkillIds.includes(sk.skill_id);
                              return (
                                <div
                                  key={sk.skill_id}
                                  onClick={() => {
                                    handleToggleSkill(sk.skill_id);
                                    if (step1FieldErrors.skills) {
                                      setStep1FieldErrors((prev) => ({ ...prev, skills: "" }));
                                    }
                                  }}
                                  style={{ fontSize: "11.5px", lineHeight: "16px" }}
                                  className={`px-2.5 py-1 rounded-md border font-semibold cursor-pointer transition-all duration-150 select-none ${
                                    isChecked
                                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs"
                                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  {sk.skill_name}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {step1FieldErrors.skills && (
                          <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                            <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.skills}
                          </p>
                        )}
                      </div>
                    )}

                    {isFieldEnabled("languages") && (
                      <div className="mt-4">
                        <label className="text-xs font-bold block mb-1.5 text-slate-600">
                          Select Languages {isFieldRequired("languages") ? "*" : ""} (At least 1)
                        </label>
                        <div className={step1FieldErrors.languages ? "rounded-xl border border-rose-400 p-0.5" : ""}>
                          <CustomSelect
                            multiple={true}
                            options={languages.map((l) => ({ value: l.language_id, label: l.language_name }))}
                            value={selectedLanguageIds}
                            onChange={(val) => {
                              setSelectedLanguageIds(val as number[]);
                              if (step1FieldErrors.languages) {
                                setStep1FieldErrors((prev) => ({ ...prev, languages: "" }));
                              }
                            }}
                            placeholder="Select Languages"
                          />
                        </div>
                        {step1FieldErrors.languages && (
                          <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                            <FiAlertTriangle className="w-3 h-3 shrink-0" /> {step1FieldErrors.languages}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Spoken Languages Proficiency Levels Section */}
                    {selectedLanguages.length > 0 && (
                      <div className="mt-4 space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4 animate-fadeIn">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Set Language Proficiency Levels</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {selectedLanguages.map((selLang) => {
                            const dbLangObj = languages.find(l => l.language_id === selLang.language_id);
                            const labelName = dbLangObj ? dbLangObj.language_name : `Language #${selLang.language_id}`;
                            return (
                              <div key={selLang.language_id} className="flex flex-col gap-1 bg-white border border-slate-200/60 rounded-xl p-2.5 shadow-sm relative group">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">{labelName}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLanguage(selLang.language_id)}
                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-transparent hover:border-rose-200"
                                    title={`Remove ${labelName}`}
                                  >
                                    <FiX className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="text-rose-600">Remove</span>
                                  </button>
                                </div>
                                <select
                                  value={selLang.proficiency}
                                  onChange={(e) => handleUpdateLanguageProficiency(selLang.language_id, e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 transition mt-1"
                                >
                                  <option value="Basic">Basic</option>
                                  <option value="Conversational">Conversational</option>
                                  <option value="Fluent">Fluent</option>
                                  <option value="Native/Bilingual">Native/Bilingual</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all px-6 py-2.5 rounded-xl font-black text-xs cursor-pointer text-white flex items-center gap-1 shadow-md"
                      >
                        Save & Next →
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2 FORM - CAREER INFORMATION (OPTIONAL) */}
                {wizardStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Career Information (Optional)</h3>
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                        Add past work experience, degree levels, or professional certifications to make your profile stand out. You can skip this step.
                      </p>
                    </div>

                    <div className={subCardClass}>
                      <h4 className="text-xs font-black text-emerald-500 mb-2 uppercase tracking-wide">Work Experience</h4>
                      
                      {experiences.length > 0 && (
                        <div className={listBgClass}>
                          {experiences.map((exp, idx) => (
                            <div key={idx} className="text-xs border-b border-slate-200 dark:border-slate-800 last:border-b-0 pb-2 last:pb-0 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-slate-900 truncate">{exp.job_title} @ {exp.company_name}</p>
                                <p className="text-slate-400 text-xxs">{formatExpDate(exp.start_date) || "N/A"} - {exp.currently_working ? "Present" : (formatExpDate(exp.end_date) || "N/A")}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveExperience(exp.experience_id!, idx)}
                                className="w-6 h-6 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center transition border-none cursor-pointer shrink-0"
                                title="Remove Experience"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={expCompany}
                          onChange={(e) => setExpCompany(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={expTitle}
                          onChange={(e) => setExpTitle(e.target.value)}
                          className={inputClass}
                        />
                        <CustomSelect
                          options={[
                            { value: "Full-time", label: "Full-time" },
                            { value: "Part-time", label: "Part-time" },
                            { value: "Contract", label: "Contract" },
                            { value: "Freelance", label: "Freelance" }
                          ]}
                          value={expEmpType}
                          onChange={(val) => setExpEmpType(val as string)}
                          placeholder="Select Employment Type"
                        />
                        <div className="flex gap-2 items-center">
                          <label className="text-[10px] font-bold flex items-center gap-1.5 text-slate-600">
                            <input
                              type="checkbox"
                              checked={expCurrent}
                              onChange={(e) => setExpCurrent(e.target.checked)}
                              className="rounded border-slate-350"
                            />
                            Currently Working
                          </label>
                        </div>
                        <input
                          type="date"
                          placeholder="Start Date"
                          value={expStart}
                          onChange={(e) => setExpStart(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="date"
                          placeholder="End Date"
                          disabled={expCurrent}
                          value={expEnd}
                          onChange={(e) => setExpEnd(e.target.value)}
                          className={`${inputClass} disabled:opacity-50`}
                        />
                        <textarea
                          placeholder="Brief description of work highlights..."
                          value={expDesc}
                          onChange={(e) => setExpDesc(e.target.value)}
                          className={`sm:col-span-2 ${inputClass} h-16`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        style={{ fontSize: "11px" }}
                        className="mt-3 inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-2xs"
                      >
                        + Add Experience
                      </button>
                    </div>

                    <div className={subCardClass}>
                      <h4 className="text-xs font-black text-emerald-500 mb-2 uppercase tracking-wide">Education</h4>
                      
                      {educations.length > 0 && (
                        <div className={listBgClass}>
                          {educations.map((edu, idx) => (
                            <div key={idx} className="text-xs border-b border-slate-200 dark:border-slate-800 last:border-b-0 pb-2 last:pb-0 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-slate-900 truncate">{edu.degree} in {edu.field_of_study}</p>
                                <p className="text-slate-400 text-xxs">{edu.institution_name} ({edu.start_year} - {edu.end_year || "N/A"})</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveEducation(edu.education_id!, idx)}
                                className="w-6 h-6 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center transition border-none cursor-pointer shrink-0"
                                title="Remove Education"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <input
                          type="text"
                          placeholder="Institution Name"
                          value={eduInst}
                          onChange={(e) => setEduInst(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="text"
                          placeholder="Degree (e.g. Bachelor of Science)"
                          value={eduDegree}
                          onChange={(e) => setEduDegree(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="text"
                          placeholder="Field of Study (e.g. Computer Science)"
                          value={eduField}
                          onChange={(e) => setEduField(e.target.value)}
                          className={`sm:col-span-2 ${inputClass}`}
                        />
                        <input
                          type="number"
                          placeholder="Start Year (e.g. 2018)"
                          value={eduStart}
                          onChange={(e) => setEduStart(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="number"
                          placeholder="End Year (or Expected)"
                          value={eduEnd}
                          onChange={(e) => setEduEnd(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        style={{ fontSize: "11px" }}
                        className="mt-3 inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-2xs"
                      >
                        + Add Education
                      </button>
                    </div>

                    <div className={subCardClass}>
                      <h4 className="text-xs font-black text-emerald-500 mb-2 uppercase tracking-wide">Certifications</h4>
                      
                      {certifications.length > 0 && (
                        <div className={listBgClass}>
                          {certifications.map((c, idx) => (
                            <div key={idx} className="text-xs border-b border-slate-200 dark:border-slate-800 last:border-b-0 pb-2 last:pb-0 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-slate-900 truncate">{c.certificate_name} - {c.issuing_organization}</p>
                                {c.credential_url && <p className="text-emerald-500 text-xxs truncate">{c.credential_url}</p>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCertification(c.certification_id!, idx)}
                                className="w-6 h-6 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center transition border-none cursor-pointer shrink-0"
                                title="Remove Certification"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <input
                          type="text"
                          placeholder="Certification Name"
                          value={certName}
                          onChange={(e) => setCertName(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="text"
                          placeholder="Issuing Organization"
                          value={certOrg}
                          onChange={(e) => setCertOrg(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="date"
                          placeholder="Issue Date"
                          value={certDate}
                          onChange={(e) => setCertDate(e.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="url"
                          placeholder="Credential Verification Link"
                          value={certCredUrl}
                          onChange={(e) => setCertCredUrl(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCertification}
                        style={{ fontSize: "11px" }}
                        className="mt-3 inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 shadow-2xs"
                      >
                        + Add Certification
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-850 bg-slate-100 hover:bg-slate-200"
                      >
                        ← Back
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSkipStep2}
                          className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-850 bg-slate-100 hover:bg-slate-200"
                        >
                          Skip Step
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setWizardStep(3);
                            await updateOnboardingStep(3);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer text-white"
                        >
                          Next Step →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 FORM - VERIFICATION (OPTIONAL) */}
                {wizardStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Contact Verification (Optional)</h3>
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                        You can verify your email and phone number to build trust, or skip this step to proceed.
                      </p>
                    </div>

                    {otpError && (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl">
                        ⚠️ {otpError}
                      </div>
                    )}
                    {otpSuccess && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-xl">
                        💡 {otpSuccess}
                      </div>
                    )}

                    <div className={`${subCardClass} space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📧</span>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">Verify Email Address</p>
                            <p className="text-xxs text-slate-400">{userEmail || "Loading Email..."}</p>
                          </div>
                        </div>
                        {emailVerified ? (
                          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/35 px-2.5 py-1 rounded uppercase tracking-wider">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </div>

                      {!emailVerified && (
                        <div className="space-y-2">
                          <div className="flex gap-2 flex-wrap items-center">
                            {!emailOtpSent ? (
                              <button
                                type="button"
                                onClick={handleSendEmailOtp}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                              >
                                Send OTP Code
                              </button>
                            ) : (
                              <div className="flex gap-2 w-full sm:w-auto">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="Enter OTP"
                                  value={emailOtp}
                                  onChange={(e) => setEmailOtp(e.target.value)}
                                  className={`${inputClass} ${emailOtpError ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                                  style={{ width: "8rem", textAlign: "center" }}
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyEmailOtp}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSendEmailOtp}
                                  className="text-slate-450 hover:text-emerald-500 text-[10px] px-2 font-bold cursor-pointer"
                                >
                                  Resend
                                </button>
                              </div>
                            )}
                          </div>
                          {emailOtpError && (
                            <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mt-1 select-none flex items-center gap-1">
                              ⚠️ {emailOtpError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`${subCardClass} space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📱</span>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900">Verify Phone Number</p>
                            <p className="text-xxs text-slate-400">{userPhone || "No Phone Registered"}</p>
                          </div>
                        </div>
                        {phoneVerified ? (
                          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/35 px-2.5 py-1 rounded uppercase tracking-wider">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </div>

                      {!phoneVerified && (
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="tel"
                              placeholder="+1 (555) 123-4567 or +91 9876543210"
                              value={userPhone}
                              onChange={(e) => setUserPhone(e.target.value)}
                              className={`${inputClass} ${phoneOtpError ? "border-rose-500 ring-2 ring-rose-500/20" : ""}`}
                            />
                            {phoneOtpError && (
                              <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 select-none flex items-center gap-1">
                                ⚠️ {phoneOtpError}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap items-center">
                            {!phoneOtpSent ? (
                              <button
                                type="button"
                                onClick={handleSendPhoneOtp}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                              >
                                Send OTP Code
                              </button>
                            ) : (
                              <div className="flex gap-2 w-full sm:w-auto">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="Enter OTP"
                                  value={phoneOtp}
                                  onChange={(e) => setPhoneOtp(e.target.value)}
                                  className={inputClass}
                                  style={{ width: "8rem", textAlign: "center" }}
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyPhoneOtp}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSendPhoneOtp}
                                  className="text-slate-450 hover:text-emerald-500 text-[10px] px-2 font-bold cursor-pointer"
                                >
                                  Resend
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200"
                      >
                        ← Back
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSkipStep3}
                          className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200"
                        >
                          Skip Step
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveStep3}
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all px-6 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer text-white shadow-md shadow-emerald-600/20"
                        >
                          Next Step →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 FORM - PORTFOLIO SECTIONS (OPTIONAL) */}
                {wizardStep === 4 && (
                  <form onSubmit={handleAddProject} className="space-y-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Add Project to Portfolio (Optional)</h3>
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-500 font-medium">
                        Add screenshots, documents, and descriptions of past contracts. This will build credibility with incoming buyers.
                      </p>
                    </div>

                    {portfolioSuccess && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold rounded-xl">
                        🎉 Project added successfully! Completing your onboarding profile...
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold block mb-1 text-slate-600">Project Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Decentralized Freelance Workspace Platform"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1 text-slate-600">Project Description</label>
                        <textarea
                          placeholder="Summarize the core problem solved, architectural choices, and tech stack used..."
                          value={projectDesc}
                          onChange={(e) => setProjectDesc(e.target.value)}
                          className={`${inputClass} h-24`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1 text-slate-600">Project Images (comma-separated URLs)</label>
                        <input
                          type="text"
                          placeholder="https://image1.jpg, https://image2.png"
                          value={projectImages}
                          onChange={(e) => setProjectImages(e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1 text-slate-600">Project Walkthrough Video URL</label>
                        <input
                          type="url"
                          placeholder="https://youtube.com/watch?v=..."
                          value={projectVideo}
                          onChange={(e) => setProjectVideo(e.target.value)}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1 text-slate-600">Project Documents (comma-separated URLs)</label>
                        <input
                          type="text"
                          placeholder="https://docs.pdf, https://source-file.zip"
                          value={projectDocs}
                          onChange={(e) => setProjectDocs(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200"
                      >
                        ← Back
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            setWizardStep(5);
                            await updateOnboardingStep(5);
                          }}
                          className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200"
                        >
                          Skip Project
                        </button>
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all px-6 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer text-white shadow-md shadow-emerald-600/20"
                        >
                          Add & Continue →
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* STEP 5 FORM - DOCUMENT VERIFICATION */}
                {wizardStep >= 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {wizardStep === 5 ? "Document Verification" : `Onboarding Step ${wizardStep}`}
                      </h3>
                      <p className="text-xs mt-0.5 leading-relaxed text-slate-505 font-medium">
                        Please upload valid evidence for the following documents. These will be reviewed by our compliance team.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {loadingDocFields ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin" />
                        </div>
                      ) : (() => {
                        const freelancerStepFields = enabledDocFields.filter(f => 
                          (f.applicable_to === 'freelancer' || f.applicable_to === 'both') && 
                          f.is_enabled && 
                          (f.step_number || 5) === wizardStep
                        );
                        if (freelancerStepFields.length === 0) {
                          return (
                            <div className="p-8 text-center text-slate-400 font-semibold text-xs bg-slate-50 rounded-xl border border-slate-200/50">
                              No verification required for this step. You can proceed.
                            </div>
                          );
                        }
                        return freelancerStepFields.map((field) => {
                          const userDoc = userUploadedDocs.find(d => d.field_id === field.field_id);
                          const isUploaded = !!userDoc;
                          const status = userDoc?.status || "Pending";
                          const isUploading = !!uploadingFields[field.field_id];
                          const errorMsg = fieldErrors[field.field_id];
                          const isFieldRequired = field.is_required == 1 || field.is_required === true || field.is_required === "1" || field.is_required === "true";

                          return (
                            <div key={field.field_id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 text-left space-y-4 relative overflow-hidden group">
                              {/* Field Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                                    <FiFileText className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                      <span>{field.field_name}</span>
                                      {isFieldRequired ? (
                                        <span className="text-rose-500 font-black text-sm leading-none ml-0.5 select-none" title="Required Field">*</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-400 normal-case ml-1 select-none tracking-normal">(Optional)</span>
                                      )}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">{field.field_description}</p>
                                  </div>
                                </div>

                                {isUploaded && (
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs ${
                                    status === "Approved"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : status === "Rejected"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}>
                                    {status === "Approved" ? "✓ Approved" : status === "Rejected" ? "✕ Rejected" : "⏳ Audit Pending"}
                                  </span>
                                )}
                              </div>

                              {/* Expiration Date Section if Required */}
                              {field.has_expiry && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider shrink-0 flex items-center gap-1">
                                    <span>📅</span> Expiration Date {isFieldRequired && <span className="text-rose-500 font-extrabold text-xs">*</span>}:
                                  </label>
                                  <input
                                    type="date"
                                    value={expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "")}
                                    onChange={(e) => setExpiryDates({ ...expiryDates, [field.field_id]: e.target.value })}
                                    disabled={status === "Approved"}
                                    className="bg-white border border-slate-250 hover:border-slate-350 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 transition-all flex-1 max-w-xs"
                                  />
                                </div>
                              )}

                              {/* Upload Dropzone OR Uploaded Evidence Preview Card */}
                              {!isUploaded ? (
                                (!field.field_type || field.field_type.startsWith("file_")) ? (
                                  <label
                                    className={`w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer group/drop shadow-2xs ${status === "Approved" || isUploading ? "opacity-50 pointer-events-none" : ""}`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover/drop:scale-105 transition-transform duration-200">
                                        <FiUploadCloud className="w-4.5 h-4.5" />
                                      </div>
                                      <div className="min-w-0 text-left">
                                        <p className="text-xs font-black text-slate-800 group-hover/drop:text-emerald-700 transition-colors truncate">
                                          {isUploading ? "Uploading File to Server..." : "Click or Drag & Drop File Here"}
                                        </p>
                                        <p className="text-[10px] font-extrabold text-slate-400 mt-0.5 truncate">
                                          PDF, JPG, PNG or DOC (Max 10MB)
                                        </p>
                                      </div>
                                    </div>

                                    <span style={{ fontSize: "11px" }} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 group-hover/drop:bg-emerald-700 text-white font-extrabold shadow-2xs transition-all active:scale-95 select-none">
                                      <FiFileText className="w-3.5 h-3.5" />
                                      <span>Browse File</span>
                                    </span>

                                    <input
                                      type="file"
                                      accept={field.field_type === 'file_pdf' ? '.pdf' : field.field_type === 'file_image' ? 'image/png,image/jpeg,image/jpg' : field.field_type === 'file_word' ? '.doc,.docx' : '.pdf,.png,.jpg,.jpeg,.doc,.docx'}
                                      className="hidden"
                                      disabled={isUploading || status === "Approved"}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        // Validate file extension to prevent uploading video/non-doc files
                                        const allowedExtensions = /(\.pdf|\.jpg|\.jpeg|\.png|\.doc|\.docx)$/i;
                                        if (!allowedExtensions.exec(file.name)) {
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: "Invalid file type. Only PDF, JPG, JPEG, PNG, DOC, and DOCX are allowed." });
                                          triggerToast("error", "Invalid file type. Only PDF, JPG, JPEG, PNG, DOC, and DOCX are allowed.");
                                          return;
                                        }

                                        const expDate = expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "");
                                        if (field.has_expiry && !expDate) {
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: "Please select document expiration date first." });
                                          return;
                                        }
                                        try {
                                          setUploadingFields({ ...uploadingFields, [field.field_id]: true });
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: "" });
                                          await handleUploadDocument(field.field_id, file, expDate);
                                          triggerToast("success", `${field.field_name} uploaded successfully!`);
                                        } catch (err: any) {
                                          setFieldErrors({ ...fieldErrors, [field.field_id]: err.message || "Failed to upload file." });
                                        } finally {
                                          setUploadingFields({ ...uploadingFields, [field.field_id]: false });
                                        }
                                      }}
                                    />
                                  </label>
                                ) : (
                                  <div className="space-y-2">
                                    <input
                                      type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                                      value={textValues[field.field_id] !== undefined ? textValues[field.field_id] : (userDoc?.text_value || "")}
                                      onChange={(e) => setTextValues({ ...textValues, [field.field_id]: e.target.value })}
                                      disabled={status === "Approved" || isUploading}
                                      placeholder={`Enter ${field.field_name}...`}
                                      className={inputClass}
                                    />
                                    <button
                                      type="button"
                                      disabled={status === "Approved" || isUploading}
                                      onClick={() => {
                                        const textVal = textValues[field.field_id] !== undefined ? textValues[field.field_id] : (userDoc?.text_value || "");
                                        const expDate = expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "");
                                        handleSaveTextValue(field.field_id, textVal, expDate);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                                    >
                                      <FiCheck className="w-4 h-4" />
                                      <span>{isUploading ? "Saving..." : "Save Information"}</span>
                                    </button>
                                  </div>
                                )
                              ) : (
                                /* Uploaded Card Preview */
                                <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                                      <FiCheck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-black text-slate-850 truncate">
                                        {userDoc.file_url ? userDoc.file_url.split('/').pop() : userDoc.text_value}
                                      </p>
                                      <p className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                                        <span>✓ Verified File Uploaded</span>
                                        {userDoc?.expiry_date && <span>• Expires: {userDoc.expiry_date.substring(0, 10)}</span>}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {userDoc?.file_url && (
                                      <a
                                        href={userDoc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        <span>View File</span>
                                        <span>↗</span>
                                      </a>
                                    )}

                                    {status !== "Approved" && (!field.field_type || field.field_type.startsWith("file_")) && (
                                      <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95">
                                        <span>Replace File</span>
                                        <input
                                          type="file"
                                          accept={field.field_type === 'file_pdf' ? '.pdf' : field.field_type === 'file_image' ? 'image/png,image/jpeg,image/jpg' : field.field_type === 'file_word' ? '.doc,.docx' : '*'}
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const expDate = expiryDates[field.field_id] || (userDoc?.expiry_date ? userDoc.expiry_date.substring(0, 10) : "");
                                            try {
                                              setUploadingFields({ ...uploadingFields, [field.field_id]: true });
                                              setFieldErrors({ ...fieldErrors, [field.field_id]: "" });
                                              await handleUploadDocument(field.field_id, file, expDate);
                                              triggerToast("success", `${field.field_name} updated successfully!`);
                                            } catch (err: any) {
                                              setFieldErrors({ ...fieldErrors, [field.field_id]: err.message || "Failed to update file." });
                                            } finally {
                                              setUploadingFields({ ...uploadingFields, [field.field_id]: false });
                                            }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              )}

                              {errorMsg && (
                                <p className="text-[11px] text-rose-600 font-extrabold select-none bg-rose-50 border border-rose-200/70 p-2.5 rounded-xl flex items-center gap-1.5">
                                  <span>⚠️</span> {errorMsg}
                                </p>
                              )}

                              {status === "Rejected" && userDoc?.rejection_reason && (
                                <p className="text-[11px] text-rose-600 font-extrabold select-none bg-rose-50 border border-rose-200/70 p-2.5 rounded-xl flex items-center gap-1.5">
                                  <span>❌ Rejection Reason:</span> {userDoc.rejection_reason}
                                </p>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        type="button"
                        onClick={async () => {
                          setWizardStep(wizardStep - 1);
                          await updateOnboardingStep(wizardStep - 1);
                        }}
                        className="font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          // Validate required document fields for THIS step
                          const stepFields = enabledDocFields.filter(f => 
                            (f.applicable_to === 'freelancer' || f.applicable_to === 'both') && 
                            f.is_enabled && 
                            (f.step_number || 5) === wizardStep
                          );
                          const missingRequired = stepFields.filter(field => {
                            const isReq = field.is_required == 1 || field.is_required === true || field.is_required === "1" || field.is_required === "true";
                            if (!isReq) return false;
                            const uploaded = userUploadedDocs.some(d => d.field_id === field.field_id);
                            return !uploaded;
                          });

                          if (missingRequired.length > 0) {
                            const list = missingRequired.map(f => f.field_name).join(", ");
                            triggerToast("error", `Please complete all required fields for this step: ${list}`);
                            return;
                          }

                          if (wizardStep < totalFreelancerSteps) {
                            setWizardStep(wizardStep + 1);
                            await updateOnboardingStep(wizardStep + 1);
                          } else {
                            // Submit onboarding
                            try {
                              await handleFinishOnboarding();
                              triggerToast("success", "Onboarding completed successfully!");
                            } catch (err: any) {
                              alert(err.message || "Failed to complete onboarding.");
                            }
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold active:scale-[0.98] transition-all px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
                      >
                        <span className="text-white">{wizardStep === totalFreelancerSteps ? "Complete Onboarding ✓" : "Save & Continue →"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Publish Profile Confirmation Modal */}
      {showPublishConfirmModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-xl w-full max-w-md overflow-hidden p-6 sm:p-8 animate-fadeIn text-center relative text-slate-800">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm select-none">
              🚀
            </div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">Publish Client Profile?</h2>
            <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">
              This will update your profile on the SQL database, flag your onboarding as complete, and activate your workspace hub dashboard.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPublishConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs border border-slate-200 text-slate-500 bg-slate-100 hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowPublishConfirmModal(false);
                  await handleSaveClientStepSettings(3); // Updates onboarding_completed = true in DB
                  localStorage.setItem("onboarding_completed", "true");
                  triggerToast("success", "Workspace activated! Welcome to LancerFlow.");
                  setTimeout(() => {
                    setActiveTab("workspace");
                    if (typeof window !== "undefined") {
                      window.location.reload();
                    }
                  }, 1200);
                }}
                className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-95"
              >
                <span>Publish & Unlock</span>
                <FiCheck className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Job Proposal Modal */}
      {showProposalModal && applyingJob && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/25 backdrop-blur-[0.5px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden p-6 sm:p-8 animate-fadeIn text-left max-h-[90vh] flex flex-col relative my-8">
            <button
              onClick={() => {
                setShowProposalModal(false);
                setApplyingJob(null);
                setProposalError("");
              }}
              className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-850 cursor-pointer"
            >
              {t("btn_close", "Close")}
            </button>

            <div className="border-b border-slate-100 pb-4 pr-16 text-slate-800">
              <span className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mb-1">{t("submit_project_proposal", "Submit Project Proposal")}</span>
              <h2 className="text-base font-black text-slate-855 line-clamp-1">{applyingJob.title}</h2>
              <p className="text-slate-400 text-[10px] font-semibold mt-1">{t("client_prefix", "Client:")} {applyingJob.company_name || applyingJob.client_name}</p>

              {/* Added Project Details Summary */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-[10px] font-semibold text-slate-450 uppercase tracking-wide">
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-wallet text-slate-400"></i>
                  <span>{t("budget_label", "Budget")}: <strong className="text-slate-700">
                    {applyingJob.min_budget && applyingJob.max_budget 
                      ? `$${parseFloat(applyingJob.min_budget).toLocaleString()} - $${parseFloat(applyingJob.max_budget).toLocaleString()}`
                      : `$${parseFloat(applyingJob.budget).toLocaleString()}`}
                    {applyingJob.project_type === "Hourly" ? " / hr" : ""}
                  </strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-graduation-cap text-slate-400"></i>
                  <span>{t("exp_level", "Exp")}: <strong className="text-slate-700">{applyingJob.experience_level && applyingJob.experience_level !== "null" ? applyingJob.experience_level : "Intermediate"}</strong></span>
                </div>
                {applyingJob.sub_category_name && (
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-tags text-slate-400"></i>
                    <span>{t("subcategory_label", "Subcategory:")} <strong className="text-slate-700">{applyingJob.sub_category_name}</strong></span>
                  </div>
                )}
                {applyingJob.duration && (
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar text-slate-400"></i>
                    <span>{t("duration_label", "Duration:")} <strong className="text-slate-700">{applyingJob.duration}</strong></span>
                  </div>
                )}
                {applyingJob.num_freelancers && (
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-users text-slate-400"></i>
                    <span>{t("freelancers_label", "Freelancers:")} <strong className="text-slate-700">{applyingJob.num_freelancers}</strong></span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmitProposal} className="flex-1 overflow-y-auto flex flex-col gap-5 mt-6 text-slate-800 pr-1.5 scrollbar-thin">


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{t("your_bid_usd_required", "Your Bid (USD) *")}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 1500"
                      value={proposalBidAmount || ""}
                      onChange={(e) => setProposalBidAmount(Number(e.target.value))}
                      className="w-full bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl py-2.5 pl-7 pr-4 text-xs focus:outline-none focus:border-teal-750 focus:bg-white transition-all text-slate-855 font-bold"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{t("project_budget_label", "Project budget")}: ${parseFloat(applyingJob.budget || applyingJob.max_budget || 0).toLocaleString()}</span>
                  {proposalBidAmount > 0 && parseFloat(applyingJob.budget || applyingJob.max_budget || 0) > 0 && proposalBidAmount > parseFloat(applyingJob.budget || applyingJob.max_budget || 0) && (
                    <span className="text-[10px] text-rose-600 font-extrabold mt-1 block animate-fadeIn">
                      ⚠️ {t("bid_exceed_budget_warning", "Your bid cannot exceed the project budget")} (${parseFloat(applyingJob.budget || applyingJob.max_budget || 0).toLocaleString()}).
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{t("delivery_time_days_required", "Delivery Time (Days) *")}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 7"
                    value={proposalDeliveryDays || ""}
                    onChange={(e) => setProposalDeliveryDays(Number(e.target.value))}
                    className="w-full bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-teal-750 focus:bg-white transition-all text-slate-855 font-bold"
                  />
                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{t("delivery_time_desc", "Estimated time to complete the work")}</span>
                </div>
              </div>

              {applyingJob.project_type === "Fixed" && (
                <>
                  {applyingJob.milestone_type === "Milestone" && (
                    <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-slate-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <i className="fa-solid fa-circle-info text-teal-700 text-xs"></i>
                      <span>{t("project_requires_milestones", "This project requires defining Milestones structure")}</span>
                    </div>
                  )}

                  {applyingJob.milestone_type === "Both" && (
                    <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                      <input
                        type="checkbox"
                        id="proposalUseMilestones"
                        checked={proposalUseMilestones}
                        onChange={(e) => {
                          setProposalUseMilestones(e.target.checked);
                          if (!e.target.checked) setProposalMilestones([]);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer accent-teal-700"
                      />
                      <label htmlFor="proposalUseMilestones" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        {t("propose_milestone_structure", "Propose milestone-based payment structure for this bid")}
                      </label>
                    </div>
                  )}

                  {(applyingJob.milestone_type === "Milestone" || (applyingJob.milestone_type === "Both" && proposalUseMilestones)) && (
                    <div className="flex flex-col gap-3 bg-slate-50/50 border border-slate-200 p-4 rounded-xl">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t("define_milestones", "Define Milestones")} ({proposalMilestones.length})</h4>
                      
                      {proposalMilestones.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {proposalMilestones.map((milestone, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate">{milestone.title}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-extrabold text-slate-700">${milestone.amount.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProposalMilestone(idx)}
                                  className="text-rose-500 hover:text-rose-700 font-bold hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                                  title={t("remove_milestone_tooltip", "Remove Milestone")}
                                >
                                  <i className="fa-solid fa-trash-can text-xs"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border-t border-slate-100 pt-3 mt-1">
                        <div className="sm:col-span-7 flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">{t("milestone_desc_required", "Milestone Description *")}</label>
                          <input
                            type="text"
                            placeholder={isMilestoneLimitReached ? t("bid_limit_reached", "Bid total limit reached") : t("milestone_desc_placeholder", "e.g. Design Figma layouts and style guide")}
                            value={newMilestoneTitle}
                            onChange={(e) => setNewMilestoneTitle(e.target.value)}
                            disabled={isMilestoneLimitReached}
                            className={`w-full border rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-teal-700/50 text-slate-855 font-bold ${
                              isMilestoneLimitReached
                                ? "bg-slate-100/80 border-slate-200 text-slate-455 cursor-not-allowed"
                                : "bg-white border-slate-250 hover:border-slate-350"
                            }`}
                          />
                        </div>
                        <div className="sm:col-span-3 flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">{t("amount_usd_required", "Amount (USD) *")}</label>
                          <input
                            type="number"
                            placeholder={t("amount_placeholder", "Amount")}
                            value={newMilestoneAmount}
                            onChange={(e) => setNewMilestoneAmount(e.target.value !== "" ? Number(e.target.value) : "")}
                            disabled={isMilestoneLimitReached}
                            className={`w-full border rounded-lg py-2 px-2.5 text-xs focus:outline-none focus:border-teal-700/50 text-slate-855 font-bold ${
                              isMilestoneLimitReached
                                ? "bg-slate-100/80 border-slate-200 text-slate-455 cursor-not-allowed"
                                : "bg-white border-slate-250 hover:border-slate-350"
                            }`}
                          />
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddProposalMilestone}
                            disabled={isMilestoneLimitReached}
                            className={`w-full h-[34px] rounded-lg shadow-sm transition-all flex items-center justify-center font-extrabold text-xs ${
                              isMilestoneLimitReached
                                ? "bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed opacity-60"
                                : "bg-teal-700 hover:bg-teal-800 text-white cursor-pointer hover:scale-[1.02]"
                            }`}
                            title={isMilestoneLimitReached ? t("bid_amount_reached", "Offered Bid Amount Reached") : t("add_milestone_btn", "Add Milestone")}
                          >
                            {t("btn_add", "Add")}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-extrabold uppercase mt-2 pt-2 border-t border-slate-100">
                        <span className="text-slate-400">{t("total_milestones_sum", "Total Milestones sum:")}</span>
                        <span className={`text-xs ${
                          proposalMilestones.reduce((sum, m) => sum + m.amount, 0) > proposalBidAmount
                            ? "text-rose-600 font-black"
                            : "text-slate-700 font-black"
                        }`}>
                          ${proposalMilestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()} / ${proposalBidAmount.toLocaleString()}
                        </span>
                      </div>

                      {proposalError && proposalError.toLowerCase().includes("milestone") && (
                        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold mt-2.5 flex items-center gap-1.5 animate-fadeIn">
                          <FiAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{proposalError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{t("cover_letter_pitch_required", "Cover Letter / Pitch *")}</label>
                <textarea
                  required
                  rows={6}
                  placeholder={t("cover_letter_placeholder", "Introduce yourself, describe your approach to this project, and detail why you're the perfect fit...")}
                  value={proposalCoverLetter}
                  onChange={(e) => setProposalCoverLetter(e.target.value)}
                  className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-855 font-medium resize-none"
                />
              </div>

              {proposalError && !proposalError.toLowerCase().includes("milestone") && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fadeIn">
                  <FiAlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{proposalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProposalModal(false);
                    setApplyingJob(null);
                    setProposalError("");
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/60 transition-all cursor-pointer"
                >
                  {t("btn_cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={proposalSubmitting}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {proposalSubmitting ? (
                    t("submitting_status", "Submitting...")
                  ) : (
                    <>
                      <span>{t("submit_proposal_btn", "Submit Proposal")}</span>
                      <FiCheck className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Freelancer Profile details & Hire request modal */}
      {selectedFreelancerProfile && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/35 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-3xl overflow-hidden p-6 sm:p-8 animate-fadeIn text-slate-800 my-8 max-h-[90vh] flex flex-col relative">
            <button
              onClick={() => {
                setSelectedFreelancerProfile(null);
                setShowHireWizard(false);
                setDirectHireError("");
              }}
              className="absolute top-6 sm:top-8 right-6 sm:right-8 font-black text-xs px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 hover:text-slate-950 transition-all cursor-pointer z-10 shadow-xs"
            >
              {t("close_btn", "Close")}
            </button>

            {!showHireWizard ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-left">
                  {/* 1. Header Profile details */}
                  <div className="flex flex-col sm:flex-row gap-5 border-b border-slate-100 pb-5">
                    <div className="w-24 h-24 bg-teal-50 border border-teal-100 text-teal-700 rounded-full flex items-center justify-center text-4xl font-black shrink-0 shadow-sm overflow-hidden">
                      {selectedFreelancerProfile.profile_image || selectedFreelancerFullProfile?.user?.profile_image ? (
                        <img
                          src={selectedFreelancerProfile.profile_image || selectedFreelancerFullProfile?.user?.profile_image}
                          alt={selectedFreelancerFullProfile?.user?.first_name || selectedFreelancerProfile.name || "Freelancer"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        (() => {
                          const displayName = selectedFreelancerFullProfile?.user?.first_name 
                            ? `${selectedFreelancerFullProfile.user.first_name} ${selectedFreelancerFullProfile.user.last_name || ''}`.trim()
                            : (selectedFreelancerProfile.name || selectedFreelancerProfile.freelancer_name || "FL");
                          return displayName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "FL";
                        })()
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-850 flex items-center gap-2">
                        <span>
                          {selectedFreelancerFullProfile?.user?.first_name 
                            ? `${selectedFreelancerFullProfile.user.first_name} ${selectedFreelancerFullProfile.user.last_name || ''}`.trim()
                            : (selectedFreelancerProfile.name && selectedFreelancerProfile.name !== "Freelancer #" && !selectedFreelancerProfile.name.startsWith("Freelancer #")
                                ? selectedFreelancerProfile.name 
                                : (selectedFreelancerProfile.freelancer_name || selectedFreelancerProfile.email || (selectedFreelancerProfile.user_id ? `Freelancer #${selectedFreelancerProfile.user_id}` : "Assigned Freelancer")))}
                        </span>
                        <span className="bg-teal-100 text-teal-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{t("verified_badge", "Verified")}</span>
                      </h2>
                      <p className="text-slate-500 font-bold text-sm mt-0.5">{selectedFreelancerProfile.role ? t("gig_service_provider", selectedFreelancerProfile.role) : t("professional_freelancer", "Professional Freelancer")}</p>
                      
                      <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <i className="fa-solid fa-dollar-sign text-teal-600 text-[10px]"></i>
                          <span>{t("rate_label", "Rate:")} <strong className="text-slate-700">${selectedFreelancerProfile.hourlyRate || selectedFreelancerProfile.hourly_rate || "45"}/hr</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="fa-solid fa-star text-amber-500 text-[10px]"></i>
                          <span>{t("rating_label", "Rating:")} <strong className="text-slate-700">5.0 (14 {t("completed_jobs_suffix", "completed jobs")})</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {loadingFullProfile ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-semibold text-xs">Fetching portfolio and qualifications...</p>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-2">
                      {/* Bio / Description */}
                      <div>
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">{t("about_overview_header", "About & Overview")}</h4>
                        <p className="text-xs leading-relaxed font-medium text-slate-650">
                          {selectedFreelancerFullProfile?.profile?.description || selectedFreelancerProfile.description || t("default_freelancer_bio", "Top rated developer specialized in modern web applications, scalable database systems, API integrations, and premium UI designs.")}
                        </p>
                      </div>

                      {/* Skills section */}
                      {selectedFreelancerFullProfile?.skills && selectedFreelancerFullProfile.skills.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Primary Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedFreelancerFullProfile.skills.map((s: any) => (
                              <span key={s.skill_id} className="bg-slate-50 border border-slate-200/60 text-slate-650 text-[10px] font-bold px-3 py-1.5 rounded-xl">
                                {s.skill_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Portfolio / Projects */}
                      {selectedFreelancerFullProfile?.projects && selectedFreelancerFullProfile.projects.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Portfolio Projects</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedFreelancerFullProfile.projects.map((p: any, idx: number) => (
                              <div key={idx} className="border border-slate-200 p-4 rounded-xl bg-slate-50 flex flex-col justify-between">
                                <div>
                                  <h5 className="text-xs font-black text-slate-800 truncate">{p.title}</h5>
                                  <p className="text-xxs font-medium text-slate-500 mt-1 line-clamp-3">{p.description}</p>
                                </div>
                                
                                {p.live_url && (
                                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Project Link:</span>
                                    <a
                                      href={p.live_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-teal-700 hover:text-teal-800 text-xxs font-black flex items-center gap-1 hover:underline cursor-pointer"
                                    >
                                      <span>View Live Project</span>
                                      <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline section: Experience, Education, Certifications */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                        {/* Experience */}
                        <div>
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{t("experience_header", "Experience")}</h4>
                          {selectedFreelancerFullProfile?.experiences && selectedFreelancerFullProfile.experiences.length > 0 ? (
                            <div className="space-y-3.5">
                              {selectedFreelancerFullProfile.experiences.map((exp: any, idx: number) => (
                                <div key={idx} className="border-l-2 border-teal-500/50 pl-3">
                                  <h5 className="text-xxs font-black text-slate-850 truncate">{exp.title}</h5>
                                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">{exp.company_name}</p>
                                  <span className="text-[9px] font-semibold text-slate-400 mt-0.5 block">{formatExpDate(exp.start_date) || "N/A"} - {exp.current_job || exp.currently_working ? "Present" : (formatExpDate(exp.end_date) || "N/A")}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xxs font-bold text-slate-400 italic">{t("no_experience_logged", "No experience logged.")}</p>
                          )}
                        </div>

                        {/* Education */}
                        <div>
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{t("education_header", "Education")}</h4>
                          {selectedFreelancerFullProfile?.education && selectedFreelancerFullProfile.education.length > 0 ? (
                            <div className="space-y-3.5">
                              {selectedFreelancerFullProfile.education.map((edu: any, idx: number) => (
                                <div key={idx} className="border-l-2 border-slate-300 pl-3">
                                  <h5 className="text-xxs font-black text-slate-850 truncate">{edu.degree}</h5>
                                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">{edu.institution}</p>
                                  <span className="text-[9px] font-semibold text-slate-400 mt-0.5 block">Graduated {edu.end_date}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xxs font-bold text-slate-400 italic">{t("no_education_logged", "No education logged.")}</p>
                          )}
                        </div>

                        {/* Certifications */}
                        <div>
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">{t("certifications_header", "Certifications")}</h4>
                          {selectedFreelancerFullProfile?.certifications && selectedFreelancerFullProfile.certifications.length > 0 ? (
                            <div className="space-y-3.5">
                              {selectedFreelancerFullProfile.certifications.map((c: any, idx: number) => (
                                <div key={idx} className="border-l-2 border-slate-350 pl-3">
                                  <h5 className="text-xxs font-black text-slate-850 truncate">{c.name}</h5>
                                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">{c.issuing_organization}</p>
                                  <span className="text-[9px] font-semibold text-slate-400 mt-0.5 block">Issued {c.issue_date}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xxs font-bold text-slate-400 italic">{t("no_certifications_logged", "No certifications logged.")}</p>
                          )}
                        </div>
                      </div>

                      {/* Engagements / Projects with You */}
                      {selectedFreelancerFullProfile?.clientContracts && selectedFreelancerFullProfile.clientContracts.length > 0 && (
                        <div className="pt-6 border-t border-slate-150">
                          <h4 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                            <i className="fa-solid fa-handshake text-teal-600 text-xs"></i>
                            <span>Engagements with You</span>
                          </h4>
                          <div className="grid grid-cols-1 gap-3.5">
                            {selectedFreelancerFullProfile.clientContracts.map((c: any, idx: number) => {
                              const isGig = c.type === "gig";
                              let statusColor = "bg-slate-100 text-slate-700 border-slate-200";
                              if (c.status === "Completed") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-150/70";
                              else if (c.status === "In Progress" || c.status === "Work Started") statusColor = "bg-blue-50 text-blue-700 border-blue-150/70";
                              else if (c.status === "Disputed") statusColor = "bg-amber-50 text-amber-700 border-amber-150/70";
                              else if (c.status === "Cancelled") statusColor = "bg-rose-50 text-rose-700 border-rose-150/70";

                              return (
                                <div key={idx} className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all text-left">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-start gap-2 min-w-0">
                                      {isGig ? (
                                        <i className="fa-solid fa-store text-slate-400 mt-1 text-[11px] shrink-0"></i>
                                      ) : (
                                        <i className="fa-solid fa-briefcase text-slate-400 mt-1 text-[11px] shrink-0"></i>
                                      )}
                                      <div>
                                        <h5 className="text-xs font-black text-slate-800 line-clamp-1">{c.title}</h5>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{isGig ? "Gig Order" : "Project Contract"}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0 select-none">
                                      <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                                        {c.status}
                                      </span>
                                      <span className="text-xs font-black text-slate-700">
                                        ${parseFloat(c.budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Review Section */}
                                  {c.rating !== null && (
                                    <div className="text-[10px] text-slate-600 font-semibold bg-white border border-slate-100 rounded-lg p-2.5 flex flex-col gap-1 mt-1">
                                      <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                                        <span>Your Review:</span>
                                        <span>{"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}</span>
                                        <span className="text-slate-400">({c.rating}.0)</span>
                                      </div>
                                      {c.comment && <p className="italic text-slate-500 font-medium">"{c.comment}"</p>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Fixed Footer Action buttons */}
                <div className="pt-4 mt-4 border-t border-slate-150 flex justify-end gap-3 shrink-0 bg-white">
                  <button
                    onClick={() => {
                      setSelectedFreelancerProfile(null);
                      setShowHireWizard(false);
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/60 transition-all cursor-pointer"
                  >
                    {t("cancel_btn", "Cancel")}
                  </button>
                  {userRole === "client" && (
                    <button
                      onClick={() => {
                        setShowHireWizard(true);
                        setHireBidAmount(parseFloat(selectedFreelancerProfile.hourlyRate || selectedFreelancerProfile.hourly_rate || "45") * 40); // default 40 hours equivalent
                        setHireDeliveryDays(14);
                        // Pre-populate open job list
                        if (clientJobs.length > 0) {
                          const openJobs = clientJobs.filter(j => j.status === "Open" && !j.contract_id);
                          if (openJobs.length > 0) {
                            setSelectedExistingJobId(openJobs[0].job_id.toString());
                          } else {
                            setHireJobMode("new");
                          }
                        } else {
                          setHireJobMode("new");
                        }
                      }}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 hover:shadow-lg"
                    >
                      <span>{t("hire_freelancer_btn", "Hire Freelancer")}</span>
                      <i className="fa-solid fa-briefcase"></i>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendDirectHireSubmit} className="flex-1 flex flex-col overflow-y-auto pr-1">
                <div className="border-b border-slate-100 pb-4 text-slate-800">
                  <span className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mb-1">Direct Offer Wizard</span>
                  <h2 className="text-base font-black text-slate-850">Hire Offer to {selectedFreelancerProfile.name}</h2>
                  <p className="text-slate-400 text-[10px] font-semibold mt-0.5">Send a project proposal invitation directly to the freelancer. Escalates to escrow payment upon accept.</p>
                </div>

                <div className="mt-5 space-y-5 text-slate-800">
                  {directHireError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-1.5">
                      <FiAlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{directHireError}</span>
                    </div>
                  )}

                  {/* 1. Job linking mode selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Project Attachment *</label>
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setHireJobMode("existing");
                          const openJobs = clientJobs.filter(j => j.status === "Open" && !j.contract_id);
                          if (openJobs.length > 0) setSelectedExistingJobId(openJobs[0].job_id.toString());
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          hireJobMode === "existing"
                            ? "bg-teal-50 border-teal-350 text-teal-850"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <i className="fa-solid fa-folder-open text-sm"></i>
                        <span>Select Existing Project</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHireJobMode("new")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          hireJobMode === "new"
                            ? "bg-teal-50 border-teal-350 text-teal-850"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <i className="fa-solid fa-circle-plus text-sm"></i>
                        <span>Create New Project Inline</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Job selector dropdown or fields */}
                  {hireJobMode === "existing" ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Select Open Project *</label>
                      {clientJobs.filter((j) => j.status === "Open" && !j.contract_id).length > 0 ? (
                        <CustomSelect
                          value={selectedExistingJobId}
                          onChange={(val) => setSelectedExistingJobId(val as string)}
                          options={clientJobs
                            .filter((j) => j.status === "Open" && !j.contract_id)
                            .map((job) => ({
                              value: job.job_id.toString(),
                              label: `${job.title} ($${parseFloat(job.budget).toLocaleString()})`
                            }))}
                          placeholder="Select Open Project"
                        />
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200/50 text-amber-700 text-xxs font-bold rounded-xl flex items-center gap-1.5">
                          <span>You have no open projects. Please select "Create New Project Inline" instead.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 bg-slate-50/50 border border-slate-200 p-4 rounded-xl">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Project Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Design Figma layouts and frontend mockups"
                          value={newJobTitle}
                          onChange={(e) => setNewJobTitle(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-teal-700/50 focus:outline-none font-bold"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Project Description *</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Provide a detailed description of the project requirements, expectations, and goals..."
                          value={newJobDesc}
                          onChange={(e) => setNewJobDesc(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-teal-700/50 focus:outline-none resize-none font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. Bid amount & Delivery Days */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Offer Budget Amount (USD) *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 1500"
                          value={hireBidAmount || ""}
                          onChange={(e) => setHireBidAmount(Number(e.target.value))}
                          className="w-full bg-slate-50/50 border border-slate-250 rounded-xl py-2.5 pl-7 pr-4 text-xs focus:border-teal-700/50 focus:outline-none focus:bg-white transition-all text-slate-850 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Delivery Limit (Days) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 10"
                        value={hireDeliveryDays || ""}
                        onChange={(e) => setHireDeliveryDays(Number(e.target.value))}
                        className="w-full bg-slate-50/50 border border-slate-250 rounded-xl py-2.5 px-4 text-xs focus:border-teal-700/50 focus:outline-none focus:bg-white transition-all text-slate-850 font-bold"
                      />
                    </div>
                  </div>

                  {/* 4. Milestones builder */}
                  <div className="flex flex-col gap-3 bg-slate-50/50 border border-slate-200 p-4 rounded-xl">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Define Contract Milestones ({hireMilestones.length})</h4>
                    
                    {hireMilestones.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {hireMilestones.map((m, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                                {idx + 1}
                              </span>
                              <p className="font-bold text-slate-800 truncate">{m.title}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-extrabold text-slate-700">${m.amount.toLocaleString()}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveHM(idx)}
                                className="text-rose-500 hover:text-rose-700 font-bold hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                              >
                                <i className="fa-solid fa-trash-can text-xs"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border-t border-slate-150/40 pt-3 mt-1">
                      <div className="sm:col-span-7 flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Milestone Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Design mockups"
                          value={newHMTitle}
                          onChange={(e) => setNewHMTitle(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-lg py-2 px-3 text-xs focus:border-teal-700/50 focus:outline-none text-slate-850 font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Amount (USD) *</label>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={newHMAmount}
                          onChange={(e) => setNewHMAmount(e.target.value !== "" ? Number(e.target.value) : "")}
                          className="w-full bg-white border border-slate-250 rounded-lg py-2 px-2.5 text-xs focus:border-teal-700/50 focus:outline-none text-slate-850 font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddHM}
                          className="bg-teal-700 hover:bg-teal-800 text-white w-full h-[34px] rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer hover:scale-[1.02] font-extrabold text-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-extrabold uppercase mt-2 pt-2 border-t border-slate-100 gap-1">
                      <span className="text-slate-450">Milestones sum:</span>
                      <span className={`text-xs ${
                        hireMilestones.reduce((sum, m) => sum + m.amount, 0) > hireBidAmount
                          ? "text-rose-600 font-black"
                          : "text-slate-700 font-black"
                      }`}>
                        ${hireMilestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()} / ${hireBidAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 5. Cover letter / offer pitch */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Offer Invitation Message (Pitch) *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Hi, I loved your profile and portfolio. I'd love to hire you directly to work on my project..."
                      value={hirePitch}
                      onChange={(e) => setHirePitch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-teal-700/50 focus:bg-white focus:outline-none resize-none font-medium"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHireWizard(false);
                      setDirectHireError("");
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-500 hover:text-slate-850 bg-slate-100 hover:bg-slate-200/60 transition-all cursor-pointer"
                  >
                    Back to Profile
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDirectHire}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {submittingDirectHire ? "Sending Request..." : "Send Hire Offer"}
                    <FiCheck className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      {/* Referral Celebration Bonus Popup Modal */}
      <ReferralCelebrationModal />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
