import { API_URL } from "@/config/api";
import React, { useState, useMemo } from "react";
import CustomSelect from "../CustomSelect";

const formatExpDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};
import { FiSettings, FiUser, FiBriefcase, FiAlertTriangle, FiCheckCircle, FiCheck, FiTrash2, FiPlus, FiCircle, FiFileText, FiUpload, FiShield, FiPhone, FiMail, FiSend, FiKey, FiLoader } from "react-icons/fi";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { useLanguage } from "@/context/LanguageContext";

interface SettingsTabProps {
  userRole: string | null;
  clientBasics: any;
  setClientBasics: (basics: any) => void;
  profileBasics: any;
  setProfileBasics: (basics: any) => void;
  experiences: any[];
  setExperiences: (exps: any[]) => void;
  newExp: any;
  setNewExp: (exp: any) => void;
  education: any[];
  setEducation: (edu: any[]) => void;
  newEdu: any;
  setNewEdu: (edu: any) => void;
  certifications: any[];
  setCertifications: (certs: any[]) => void;
  newCert: any;
  setNewCert: (cert: any) => void;
  selectedSkills: string[];
  setSelectedSkills: (skills: string[] | ((prev: string[]) => string[])) => void;
  availableSkillsList: string[];
  triggerToast: any;
  profileStep: number;
  setProfileStep: (step: number) => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (editing: boolean) => void;
  showPublishConfirmModal: boolean;
  setShowPublishConfirmModal: (show: boolean) => void;
  stepsStatus: any[];
  profileCompletionProgress: number;
  handleSaveStep: (step: number) => Promise<void>;
  handleSaveClientStepSettings: (step: number) => Promise<void>;
  deleteExperience: (idx: number) => void;
  deleteEducation: (idx: number) => void;
  deleteCertification: (idx: number) => void;
  setActiveTab: (tab: any) => void;
  userName?: string;
  profileImage?: string | null;
  handleProfileImageUpload?: (file: File) => Promise<void>;
  setSelectedFreelancerProfile?: (profile: any) => void;
  userEmail?: string;
  userPhone?: string;
  setUserPhone?: (val: string) => void;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  emailOtp?: string;
  setEmailOtp?: (val: string) => void;
  emailOtpSent?: boolean;
  setEmailOtpSent?: (val: boolean) => void;
  sendingEmailOtp?: boolean;
  setSendingEmailOtp?: (val: boolean) => void;
  verifyingEmailOtp?: boolean;
  setVerifyingEmailOtp?: (val: boolean) => void;
  phoneOtp?: string;
  setPhoneOtp?: (val: string) => void;
  phoneOtpSent?: boolean;
  setPhoneOtpSent?: (val: boolean) => void;
  sendingPhoneOtp?: boolean;
  setSendingPhoneOtp?: (val: boolean) => void;
  verifyingPhoneOtp?: boolean;
  setVerifyingPhoneOtp?: (val: boolean) => void;
  otpSuccess?: string;
  setOtpSuccess?: (val: string) => void;
  otpError?: string;
  setOtpError?: (val: string) => void;
  handleSendEmailOtp?: () => Promise<void>;
  handleVerifyEmailOtp?: () => Promise<void>;
  handleSendPhoneOtp?: () => Promise<void>;
  handleVerifyPhoneOtp?: () => Promise<void>;
}

export default function SettingsTab({
  userRole,
  clientBasics,
  setClientBasics,
  profileBasics,
  setProfileBasics,
  experiences,
  setExperiences,
  newExp,
  setNewExp,
  education,
  setEducation,
  newEdu,
  setNewEdu,
  certifications,
  setCertifications,
  newCert,
  setNewCert,
  selectedSkills,
  setSelectedSkills,
  availableSkillsList,
  triggerToast,
  profileStep,
  setProfileStep,
  isEditingProfile,
  setIsEditingProfile,
  showPublishConfirmModal,
  setShowPublishConfirmModal,
  stepsStatus,
  profileCompletionProgress,
  handleSaveStep,
  handleSaveClientStepSettings,
  deleteExperience,
  deleteEducation,
  deleteCertification,
  setActiveTab,
  userName = "User",
  profileImage = null,
  handleProfileImageUpload,
  setSelectedFreelancerProfile,
  userEmail: propUserEmail,
}: SettingsTabProps) {
  const { t } = useLanguage();
  const dashboardContext = useDashboard();
  const {
    userEmail = propUserEmail || "",
    userPhone = "",
    setUserPhone = () => {},
    emailVerified = false,
    phoneVerified = false,
    emailOtp = "",
    setEmailOtp = () => {},
    phoneOtp = "",
    setPhoneOtp = () => {},
    emailOtpSent = false,
    phoneOtpSent = false,
    sendingEmailOtp = false,
    sendingPhoneOtp = false,
    verifyingEmailOtp = false,
    verifyingPhoneOtp = false,
    handleSendEmailOtp = async () => {},
    handleVerifyEmailOtp = async () => {},
    handleSendPhoneOtp = async () => {},
    handleVerifyPhoneOtp = async () => {},
    otpError = "",
    otpSuccess = ""
  } = dashboardContext || {};

  const getPhoneValidationFeedback = (phoneVal: string) => {
    if (!phoneVal) return null;
    const cleaned = phoneVal.replace(/[\s\-\(\)]/g, "");
    if (cleaned.length < 7) {
      return { isValid: false, message: "Too short. Must be at least 7 digits." };
    }
    if (cleaned.length > 15) {
      return { isValid: false, message: "Too long. Maximum 15 digits allowed." };
    }
    // Pattern check: must start with + or a digit, and be followed by digits
    if (!/^\+?[1-9]\d{6,14}$/.test(cleaned)) {
      return { isValid: false, message: "Invalid format. Must include country code (e.g. +91...)." };
    }
    return { isValid: true, message: "Valid phone number format." };
  };

  // Local state for settings subtabs
  const [settingsTabMode, setSettingsTabMode] = useState<"hub" | "profile" | "subscription" | "verification">("hub");
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<"account" | "profile" | "subscription">("account");
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugValidating, setSlugValidating] = useState(false);
  const [uploadingSeoImage, setUploadingSeoImage] = useState(false);

  // Resume Upload State
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState("");

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setResumeUploadError("");

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
      setProfileBasics({
        ...profileBasics,
        resume_url: uploadData.url || ""
      });
      triggerToast("success", "Resume uploaded successfully!");
    } catch (err: any) {
      setResumeUploadError(err.message || "An error occurred during resume upload.");
    } finally {
      setUploadingResume(false);
    }
  };

  const processSeoImage = (file: File): Promise<File> => {
    const MIN_W = 300, MIN_H = 200, MAX_W = 1200, MAX_H = 630;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const { naturalWidth: w, naturalHeight: h } = img;
        if (w < MIN_W || h < MIN_H) {
          reject(new Error(`Image is too small (${w}×${h}px). Minimum required size is ${MIN_W}×${MIN_H}px.`));
          return;
        }
        if (w <= MAX_W && h <= MAX_H) { resolve(file); return; }
        const scale = Math.min(MAX_W / w, MAX_H / h);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Resize failed")); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read image")); };
      img.src = objectUrl;
    });
  };

  const handleSeoImageUpload = async (file: File) => {
    const token = localStorage.getItem("token");
    try {
      setUploadingSeoImage(true);
      const processed = await processSeoImage(file);
      const formData = new FormData();
      formData.append("file", processed);
      const res = await fetch(`${API_URL}/upload?category=seo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setProfileBasics({ ...profileBasics, seo: { ...(profileBasics.seo || {}), image: data.url } });
      triggerToast("success", "SEO preview image uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload SEO image");
    } finally {
      setUploadingSeoImage(false);
    }
  };

  // Slugify helper
  const slugifyText = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleDisplayFreelancerNameChange = (nameVal: string) => {
    const slugVal = slugifyText(nameVal);
    setProfileBasics({
      ...profileBasics,
      display_name: nameVal,
      slug: slugVal
    });
  };

  const handleFreelancerSlugChange = (slugVal: string) => {
    setProfileBasics({
      ...profileBasics,
      slug: slugifyText(slugVal)
    });
  };

  // Debounced live user slug verification
  React.useEffect(() => {
    const userSlug = profileBasics?.slug;
    if (!userSlug || !userSlug.trim()) {
      setSlugAvailable(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        setSlugValidating(true);
        const res = await fetch(`${API_URL}/freelancer/profile/validate-slug?slug=${encodeURIComponent(userSlug)}`);
        if (res.ok) {
          const data = await res.json();
          setSlugAvailable(data.available);
        }
      } catch (err) {
        console.error("Error validating user slug", err);
      } finally {
        setSlugValidating(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [profileBasics?.slug]);

  React.useEffect(() => {
    const fetchSub = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/users/me/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserSubscription(data);
        }
        
        const resPlans = await fetch(`${API_URL}/subscription-plans`);
        if (resPlans.ok) {
          const dataPlans = await resPlans.json();
          setAllPlans(dataPlans);
        }
      } catch (err) {
        console.error("Failed to load subscription settings details:", err);
      }
    };
    fetchSub();
  }, []);

  const settingsSteps = useMemo(() => {
    if (userRole === "client") {
      return [
        { number: 1, label: t("company_basics_label", "Company Basics"), done: Boolean(clientBasics?.company_name) },
        { number: 2, label: t("company_details_label", "Company Details"), done: Boolean(clientBasics?.company_website || clientBasics?.company_description) },
        { number: 3, label: t("hiring_contact_info_label", "Hiring Contact Info"), done: Boolean(clientBasics?.hiring_contact_name) },
        { number: 4, label: t("contact_verification_label", "Contact Verification"), done: emailVerified && phoneVerified }
      ];
    } else {
      return [
        { number: 1, label: t("professional_basics_label", "Professional Basics"), done: Boolean(profileBasics?.professional_title) },
        { number: 2, label: t("work_experience_label", "Work Experience"), done: experiences.length > 0 },
        { number: 3, label: t("education_history_label", "Education History"), done: education.length > 0 },
        { number: 4, label: t("certifications_label", "Certifications"), done: certifications.length > 0 },
        { number: 5, label: t("skills_selector_label", "Skills Selector"), done: selectedSkills.length > 0 },
        { number: 6, label: t("contact_verification_label", "Contact Verification"), done: emailVerified && phoneVerified }
      ];
    }
  }, [userRole, clientBasics, profileBasics, experiences, education, certifications, selectedSkills, emailVerified, phoneVerified, t]);

  const settingsProgress = useMemo(() => {
    if (settingsSteps.length === 0) return 0;
    const doneCount = settingsSteps.filter((s: any) => s.done).length;
    return Math.round((doneCount / settingsSteps.length) * 100);
  }, [settingsSteps]);

  // Local state for horizontal stepper steps (when editing onboarded settings)
  const [freelancerSettingsStep, setFreelancerSettingsStep] = useState(1);
  const [clientSettingsStep, setClientSettingsStep] = useState(1);

  // Local state for newly inputted forms in Direct Mode
  const [tempExp, setTempExp] = useState({
    company_name: "",
    job_title: "",
    employment_type: "Full-time",
    start_date: "",
    end_date: "",
    currently_working: false,
    description: "",
  });

  const [tempEdu, setTempEdu] = useState({
    institution_name: "",
    degree: "",
    field_of_study: "",
    start_year: 2022,
    end_year: 2026,
  });

  const [tempCert, setTempCert] = useState({
    certificate_name: "",
    issuing_organization: "",
    issue_date: "",
    credential_url: "",
  });

  // Check if user is fully onboarded
  const isOnboardingComplete = profileCompletionProgress === 100;

  // Direct sync triggers for history items
  const directAddExperience = async () => {
    if (!tempExp.company_name || !tempExp.job_title) {
      triggerToast("error", "Job title and Company name are required!");
      return;
    }
    const updated = [...experiences, tempExp];
    setExperiences(updated);
    localStorage.setItem("profile_experiences", JSON.stringify(updated));
    setTempExp({
      company_name: "",
      job_title: "",
      employment_type: "Full-time",
      start_date: "",
      end_date: "",
      currently_working: false,
      description: "",
    });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/experiences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        triggerToast("success", "Work history updated successfully in database!");
      } else {
        throw new Error();
      }
    } catch {
      triggerToast("warning", "Saved locally!", "Syncing offline cache.");
    }
  };

  const directDeleteExperience = async (idx: number) => {
    const updated = experiences.filter((_, i) => i !== idx);
    setExperiences(updated);
    localStorage.setItem("profile_experiences", JSON.stringify(updated));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/experiences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        triggerToast("success", "Work history item deleted successfully!");
      } else {
        throw new Error();
      }
    } catch {
      triggerToast("warning", "Deleted locally!", "Syncing offline cache.");
    }
  };

  const directAddEducation = async () => {
    if (!tempEdu.institution_name || !tempEdu.degree) {
      triggerToast("error", "Institution and Degree level are required!");
      return;
    }
    const updated = [...education, tempEdu];
    setEducation(updated);
    localStorage.setItem("profile_education", JSON.stringify(updated));
    setTempEdu({
      institution_name: "",
      degree: "",
      field_of_study: "",
      start_year: 2022,
      end_year: 2026,
    });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/education`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        triggerToast("success", "Education history updated successfully in database!");
      } else {
        throw new Error();
      }
    } catch {
      triggerToast("warning", "Saved locally!", "Syncing offline cache.");
    }
  };

  const directDeleteEducation = async (idx: number) => {
    const updated = education.filter((_, i) => i !== idx);
    setEducation(updated);
    localStorage.setItem("profile_education", JSON.stringify(updated));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/education`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        triggerToast("success", "Education item deleted successfully!");
      } else {
        throw new Error();
      }
    } catch {
      triggerToast("warning", "Deleted locally!", "Syncing offline cache.");
    }
  };

  const directAddCertification = async () => {
    if (!tempCert.certificate_name || !tempCert.issuing_organization) {
      triggerToast("error", "Certificate name and Issuing org are required!");
      return;
    }
    const updated = [...certifications, tempCert];
    setCertifications(updated);
    localStorage.setItem("profile_certifications", JSON.stringify(updated));
    setTempCert({
      certificate_name: "",
      issuing_organization: "",
      issue_date: "",
      credential_url: "",
    });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/certifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        triggerToast("success", "Certification details saved successfully!");
      } else {
        throw new Error();
      }
    } catch {
      triggerToast("warning", "Saved locally!", "Syncing offline cache.");
    }
  };

  const directDeleteCertification = async (idx: number) => {
    const updated = certifications.filter((_, i) => i !== idx);
    setCertifications(updated);
    localStorage.setItem("profile_certifications", JSON.stringify(updated));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/certifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        triggerToast("success", "Certification removed successfully!");
      } else {
        throw new Error();
      }
    } catch {
      triggerToast("warning", "Deleted locally!", "Syncing offline cache.");
    }
  };

  const handleResetProfileStatus = () => {
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("profile_setup_complete");
    localStorage.removeItem("profile_basics");
    localStorage.removeItem("profile_experiences");
    localStorage.removeItem("profile_education");
    localStorage.removeItem("profile_skills");
    triggerToast("success", "Reset Onboarding Successful! Reloading...");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    triggerToast("info", "Logging out...");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }, 800);
  };

  // RENDER 0: SETTINGS HUB LANDING SCREEN
  if (settingsTabMode === "hub") {
    return (
      <div className="relative z-10 w-full animate-fadeIn flex flex-col gap-6 text-left">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">{t("settings_hub_header", "Settings Hub")}</h2>
          <p className="text-xs text-slate-400 dark:text-slate-400">{t("settings_hub_desc", "Configure your professional identity, view platform details, and manage subscriptions.")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* Box 1: Profile */}
          <div 
            onClick={() => {
              setSettingsTabMode("profile");
              if (!isOnboardingComplete) {
                setProfileStep(1);
              } else {
                setActiveSettingsSubTab("profile");
              }
            }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-teal-700/30 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[190px] text-left"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 flex items-center justify-center text-lg shadow-sm group-hover:bg-[#063c38] group-hover:text-white transition-all shrink-0">
                  <FiUser className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-slate-300 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {t("percent_complete_label", "{{percent}}% Complete").replace("{{percent}}", String(settingsProgress))}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white mt-4 group-hover:text-teal-750 transition-colors">
                {userRole === "client" ? t("company_profile_label", "Company Profile") : t("professional_profile_label", "Professional Profile")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-normal max-w-sm">
                {t("profile_card_desc", "Set up your professional title, availability rates, experiences, educations, and showcase skills.")}
              </p>
            </div>
          </div>

          {/* Box 2: Membership Plan */}
          <div 
            onClick={() => {
              setSettingsTabMode("subscription");
              if (!isOnboardingComplete) {
                setProfileStep(99);
              } else {
                setActiveSettingsSubTab("subscription");
              }
            }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-teal-700/30 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[190px] text-left"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 flex items-center justify-center text-lg shadow-sm group-hover:bg-[#063c38] group-hover:text-white transition-all shrink-0">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-teal-55 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {t("plan_name_label", "{{name}} Plan").replace("{{name}}", userSubscription?.plan_name || "Starter")}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white mt-4 group-hover:text-teal-755 transition-colors">
                {t("membership_plan_label", "Membership Plan")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-normal max-w-sm">
                {t("membership_plan_card_desc", "View current active membership details, check platform allowances, and upgrade subscription tiers.")}
              </p>
            </div>
          </div>

          {/* Box 3: Account Verification (Email & Mobile OTP) */}
          <div 
            onClick={() => {
              setSettingsTabMode("verification");
            }}
            className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-teal-700/30 rounded-xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[190px] text-left"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 flex items-center justify-center text-lg shadow-sm group-hover:bg-[#063c38] group-hover:text-white transition-all shrink-0">
                  <FiShield className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${emailVerified && phoneVerified ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"}`}>
                  {emailVerified && phoneVerified ? t("percent_verified_label", "100% Verified") : t("pending_verification_label", "Pending Verification")}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white mt-4 group-hover:text-teal-750 transition-colors">
                {t("account_contact_verification_label", "Account & Contact Verification")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 leading-normal max-w-sm">
                {t("verification_card_desc", "Verify your registered Email Address and Mobile Number with 6-digit OTP codes to build trust and unlock platform features.")}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("workspace")}
          className="w-full text-center py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all cursor-pointer mt-4"
        >
          {t("btn_back_workspace_hub", "← Back to Workspace Hub")}
        </button>
      </div>
    );
  }

  // RENDER: ACCOUNT & CONTACT VERIFICATION SCREEN
  if (settingsTabMode === "verification") {
    return (
      <div className="relative z-10 w-full animate-fadeIn flex flex-col gap-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <FiShield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xl font-black text-slate-800 dark:text-white">{t("account_contact_verification_label", "Account & Contact Verification")}</h2>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">{t("verification_card_desc", "Verify your registered Email Address and Mobile Number with 6-digit OTP codes to build trust and unlock platform features.")}</p>
          </div>
          <button
            onClick={() => setSettingsTabMode("hub")}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200/60 dark:border-zinc-700 shrink-0 cursor-pointer"
          >
            {t("btn_back_to_settings_hub", "← Back to Settings Hub")}
          </button>
        </div>

        {/* Global Feedback Banner */}
        {otpSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{otpSuccess}</span>
          </div>
        )}
        {otpError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-extrabold flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Email Verification */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 text-left">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 flex items-center justify-center text-base shrink-0">
                    <FiMail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">{t("email_verification_header", "Email Verification")}</h3>
                    <p className="text-[11px] text-slate-400">{t("registered_email_desc", "Registered platform email address")}</p>
                  </div>
                </div>
                {emailVerified ? (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <FiCheck className="w-3 h-3" /> {t("verified_status_label", "Verified")}
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
                    {t("unverified_status_label", "Unverified")}
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{t("email_address_label", "Email Address")}</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs text-slate-700 dark:text-slate-300 font-bold cursor-not-allowed opacity-80"
                  />
                </div>

                {!emailVerified && (
                  <div className="space-y-3 pt-2">
                    {!emailOtpSent ? (
                      <button
                        onClick={handleSendEmailOtp}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FiSend className="w-3.5 h-3.5" />
                        <span>{t("btn_send_email_otp", "Send Email OTP")}</span>
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder={t("enter_email_otp_placeholder", "Enter 6-digit Email OTP")}
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white font-mono font-bold text-center tracking-widest focus:outline-none focus:border-primary/50"
                          />
                          <button
                            onClick={handleVerifyEmailOtp}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                          >
                            {t("btn_verify_email", "Verify Email")}
                          </button>
                        </div>
                        <button
                          onClick={handleSendEmailOtp}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-left border-none bg-transparent cursor-pointer"
                        >
                          {t("resend_otp_prompt", "Didn't get code? Resend OTP")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Mobile Number Verification */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 text-left">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-zinc-800 text-teal-700 dark:text-teal-400 flex items-center justify-center text-base shrink-0">
                    <FiPhone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">{t("mobile_verification_header", "Mobile Number Verification")}</h3>
                    <p className="text-[11px] text-slate-400">{t("mobile_otp_auth_desc", "Mobile OTP Authentication")}</p>
                  </div>
                </div>
                {phoneVerified ? (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <FiCheck className="w-3 h-3" /> {t("verified_status_label", "Verified")}
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
                    {t("unverified_status_label", "Unverified")}
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{t("mobile_phone_number_label", "Mobile Phone Number")}</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567 or +91 9876543210"
                    value={userPhone}
                    disabled={phoneVerified}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9\s\-\+\(\)]/g, "");
                      setUserPhone(cleanVal);
                    }}
                    className="bg-slate-50 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white font-bold focus:outline-none focus:border-primary/50"
                  />
                  {userPhone && !phoneVerified && (() => {
                    const feedback = getPhoneValidationFeedback(userPhone);
                    if (!feedback) return null;
                    return (
                      <p className={`text-[10px] font-bold mt-1 ${feedback.isValid ? "text-emerald-600" : "text-amber-600"}`}>
                        {feedback.isValid ? "✓" : "⚠"} {feedback.message}
                      </p>
                    );
                  })()}
                </div>

                {!phoneVerified && (
                  <div className="space-y-3 pt-2">
                    {!phoneOtpSent ? (
                      <button
                        onClick={handleSendPhoneOtp}
                        disabled={!getPhoneValidationFeedback(userPhone)?.isValid}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiSend className="w-3.5 h-3.5" />
                        <span>{t("btn_send_mobile_otp", "Send Mobile OTP")}</span>
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder={t("enter_mobile_otp_placeholder", "Enter 6-digit OTP")}
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white font-mono font-bold text-center tracking-widest focus:outline-none focus:border-primary/50"
                          />
                          <button
                            onClick={handleVerifyPhoneOtp}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                          >
                            {t("btn_verify_phone", "Verify Phone")}
                          </button>
                        </div>
                        <button
                          onClick={handleSendPhoneOtp}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-left border-none bg-transparent cursor-pointer"
                        >
                          {t("resend_otp_prompt", "Didn't get code? Resend OTP")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER 1: STEP-BY-STEP CHECKLIST ONBOARDING (if profile not 100% complete)
  if (!isOnboardingComplete) {
    return (
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full animate-fadeIn">
        {/* LEFT CHECKLIST SIDEBAR */}
        <div className="xl:col-span-4 bg-white border border-slate-200/85 rounded-xl p-6 shadow-sm flex flex-col gap-6 order-last xl:order-first">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">{t("profile_setup_checklist_header", "Profile Setup Checklist")}</h2>
            <p className="text-slate-400 text-xs mt-1">{t("profile_setup_checklist_desc", "Complete each section to activate and publish your profile.")}</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 rounded-xl p-4.5">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" className="stroke-slate-200" strokeWidth="4" fill="transparent" />
                <circle cx="24" cy="24" r="20" className="stroke-teal-700 transition-all duration-300" strokeWidth="4" fill="transparent"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - settingsProgress / 100)} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none font-black text-slate-800">
                {settingsProgress}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{t("status_label", "Status")}</span>
              <span className="text-sm font-extrabold text-slate-855">
                {settingsProgress === 100 ? t("ready_to_publish_label", "Ready to Publish! 🎉") : t("in_progress_label", "In Progress")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {settingsSteps.map((step: any) => {
              const isCurrent = profileStep === step.number;
              return (
                <button
                  key={step.number}
                  onClick={() => {
                    setProfileStep(step.number);
                    setIsEditingProfile(true);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between group ${
                    isCurrent
                      ? "bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/10"
                      : "bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200/80 dark:border-zinc-700/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-white/20 text-white"
                        : step.done
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                    }`}>
                      {step.number}
                    </span>
                    <span>{step.label}</span>
                  </div>
                  {step.done ? (
                    <FiCheckCircle className={`w-4 h-4 shrink-0 ${isCurrent ? "text-white" : "text-emerald-600"}`} />
                  ) : (
                    <FiCircle className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
            
            {/* Membership Plan tab (Available even during onboarding checklist) */}
            <div className="border-t border-slate-100 pt-3 mt-1.5">
              <button
                onClick={() => {
                  setProfileStep(99);
                  setIsEditingProfile(true);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-between group ${
                  profileStep === 99
                    ? "bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/10"
                    : "bg-slate-50/50 border-slate-200/80 text-slate-650 hover:bg-white hover:border-slate-355"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    profileStep === 99
                      ? "bg-white/20 text-white"
                      : "bg-teal-50 text-teal-800 font-extrabold"
                  }`}>
                    ★
                  </span>
                  <span>{t("membership_plan_label", "Membership Plan")}</span>
                </div>
                <FiCheckCircle className={`w-4 h-4 shrink-0 ${profileStep === 99 ? "text-white" : "text-teal-650"}`} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setSettingsTabMode("hub")}
            className="w-full text-center py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer font-sans"
          >
            {t("btn_back_to_settings_hub", "← Back to Settings Hub")}
          </button>
        </div>

        {/* RIGHT WIZARD FLOW CONTENT */}
        <div className="xl:col-span-8 flex flex-col gap-6 w-full order-first xl:order-none">
          <div className="bg-white border border-slate-200/85 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 text-slate-800">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-teal-700 uppercase tracking-wider block">
                  {profileStep === 99 ? t("premium_perks_label", "Premium Perks") : t("step_indicator_label", "Step {{step}} of {{total}}").replace("{{step}}", String(profileStep)).replace("{{total}}", userRole === "client" ? "3" : "5")}
                </span>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  {profileStep === 99 ? t("membership_subscription_header", "Membership & Subscription") : (
                    userRole === "client" ? (
                      <>
                        {profileStep === 1 && t("company_basics_label", "Company Basics")}
                        {profileStep === 2 && t("company_presence_details_label", "Company Presence & Details")}
                        {profileStep === 3 && t("hiring_contact_info_label", "Hiring Contact Info")}
                      </>
                    ) : (
                      <>
                        {profileStep === 1 && t("core_professional_profile_label", "Core Professional Profile")}
                        {profileStep === 2 && t("work_experience_history_label", "Work Experience History")}
                        {profileStep === 3 && t("education_history_label", "Education History")}
                        {profileStep === 4 && t("professional_certifications_label", "Professional Certifications")}
                        {profileStep === 5 && t("skills_selector_label", "Skills Selector")}
                      </>
                    )
                  )}
                </h1>
              </div>
            </div>

            {/* MEMBERSHIP PLAN STEP OVERRIDE */}
            {profileStep === 99 && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4.5 shadow-xs text-left">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("current_plan_label", "Current Plan:")}</span>
                      <span className="text-xs bg-teal-50 border border-teal-100 text-teal-850 px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase">
                        {t("plan_name_label", "{{name}} Plan").replace("{{name}}", userSubscription?.plan_name || "Starter").replace(" Plan", "").replace("Forfait", "").replace("Plan", "").trim()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-1 leading-normal max-w-md">
                      {userSubscription?.description ? t(userSubscription.description.toLowerCase().replace(/[\s\-\.\,\!\?\(\)]+/g, "_"), userSubscription.description) : t("starter_plan_desc", "Basic membership tier with standard platform limits.")}
                    </p>
                  </div>

                  <div className="text-right sm:text-left shrink-0">
                    <span className="text-lg font-black text-slate-900 leading-tight font-sans">
                      {!userSubscription?.price || parseFloat(String(userSubscription.price).replace(/[^0-9.]/g, "")) === 0 || String(userSubscription.price).trim() === "0.00" || String(userSubscription.price).trim() === "0"
                        ? t("free_price_label", "Free")
                        : userSubscription.price}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mt-0.5">
                      {userSubscription?.period ? t(userSubscription.period.toLowerCase(), userSubscription.period) : ""}
                    </span>
                  </div>
                </div>

                {/* Next Upgrade Tier */}
                {(!userSubscription || (userSubscription.active_plan_id !== 3 && userSubscription.active_plan_id !== 7)) && (
                  <div className="bg-[#063c38]/5 border border-teal-700/10 p-5 rounded-xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4.5 mt-2 text-left">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#063c38] text-white flex items-center justify-center font-black shrink-0 shadow-sm text-sm">
                        🚀
                      </div>
                      <div>
                        <h5 className="font-black text-slate-850 text-xs">
                          {t("next_level_upgrade_label", "Next Level Upgrade:")} {(userSubscription?.active_plan_id === 2 || userSubscription?.active_plan_id === 6) ? t("enterprise_plan", "Enterprise Plan") : t("professional_plan", "Professional Plan")}
                        </h5>
                        <p className="text-slate-500 font-semibold mt-1 max-w-sm leading-normal">
                          {(userSubscription?.active_plan_id === 2 || userSubscription?.active_plan_id === 6) 
                            ? t("enterprise_upgrade_desc", "Gain unlimited active job posts, unlimited bid proposals, and custom enterprise support options.")
                            : t("professional_upgrade_desc", "Unlock advanced matching algorithms, priority support channels, and reduced transaction fees.")}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const currentId = userSubscription?.active_plan_id;
                        const nextPlanId = (currentId === 1 || currentId === 5)
                          ? currentId + 1
                          : (currentId === 2 || currentId === 6)
                            ? currentId + 1
                            : 2;
                        window.location.href = `/pricing/${nextPlanId}`;
                      }}
                      className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer text-center shrink-0"
                    >
                      {t("upgrade_now_btn", "Upgrade Now")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FREELANCER STEP 1: BASICS */}
            {userRole !== "client" && profileStep === 1 && (
              <div className="flex flex-col gap-5 text-left">
                {/* Modern Circular Profile Image Uploader */}
                <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl flex flex-col sm:flex-row items-center gap-6 shadow-sm mb-4">
                  <div className="relative w-24 h-24 select-none shrink-0">
                    <div className="w-full h-full rounded-full flex items-center justify-center font-black text-2xl text-white shadow-md overflow-hidden border-4 border-white ring-4 ring-slate-100 bg-gradient-to-tr from-primary to-cyan-500 relative">
                      <span className="text-2xl font-black text-white">
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
                    
                    {handleProfileImageUpload && (
                      <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-105 active:scale-95 group" title="Change profile photo">
                        <i className="fa-solid fa-camera text-[10px] transition-transform group-hover:scale-110"></i>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              await handleProfileImageUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-base font-black text-slate-850 leading-tight">Your Avatar Photo</h4>
                    <p className="text-xs text-slate-555 mt-1 leading-relaxed">Upload a professional, high-resolution headshot for your public freelancer card. Click the camera icon on the circle to choose a photo.</p>
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Professional Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Next.js Developer"
                      value={profileBasics.professional_title}
                      onChange={(e) => setProfileBasics({ ...profileBasics, professional_title: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Experience Level</label>
                    <CustomSelect
                      value={profileBasics.experience_level}
                      onChange={(val) => setProfileBasics({ ...profileBasics, experience_level: val })}
                      options={[
                        { value: "Beginner", label: "Entry (Beginner)" },
                        { value: "Intermediate", label: "Intermediate (Mid-level)" },
                        { value: "Expert", label: "Expert (Senior)" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Hourly Rate ($ USD / hr)</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={profileBasics.hourly_rate}
                      onChange={(e) => setProfileBasics({ ...profileBasics, hourly_rate: Number(e.target.value) })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Availability Status</label>
                    <CustomSelect
                      value={profileBasics.availability_status}
                      onChange={(val) => setProfileBasics({ ...profileBasics, availability_status: val })}
                      options={[
                        { value: "Available", label: "Available Full-time" },
                        { value: "Part-time", label: "Available Part-time" },
                        { value: "Busy", label: "Busy / In Contract" },
                        { value: "Not Available", label: "Not Available" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Total Experience Years</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={profileBasics.total_experience_years}
                      onChange={(e) => setProfileBasics({ ...profileBasics, total_experience_years: Number(e.target.value) })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">LinkedIn URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={profileBasics.linkedin_url}
                      onChange={(e) => setProfileBasics({ ...profileBasics, linkedin_url: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Portfolio Website</label>
                    <input
                      type="url"
                      placeholder="https://username.dev"
                      value={profileBasics.portfolio_website}
                      onChange={(e) => setProfileBasics({ ...profileBasics, portfolio_website: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left col-span-1 md:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Resume (PDF / TXT)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={profileBasics.resume_url || ""}
                        onChange={(e) => setProfileBasics({ ...profileBasics, resume_url: e.target.value })}
                        className="flex-1 bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                      />
                      <label className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-250 hover:border-slate-300 text-slate-650 rounded-xl cursor-pointer text-xs font-bold transition-all whitespace-nowrap shadow-sm">
                        <FiUpload className="w-4 h-4" />
                        <span>{uploadingResume ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          onChange={handleResumeUpload}
                          className="hidden"
                          disabled={uploadingResume}
                        />
                      </label>
                    </div>
                    {resumeUploadError && (
                      <p className="text-[10px] text-rose-500 font-bold select-none mt-1">⚠️ {resumeUploadError}</p>
                    )}
                  </div>
                </div>

                {/* SEO Configuration Section */}
                <div className="border-t border-slate-100 pt-5 mt-3 flex flex-col gap-4 text-left">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">SEO Search Metadata</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Meta Title</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe - Expert React Developer"
                        value={profileBasics.seo?.meta_title || ""}
                        onChange={(e) => setProfileBasics({
                          ...profileBasics,
                          seo: { ...(profileBasics.seo || {}), meta_title: e.target.value }
                        })}
                        className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Keywords</label>
                      <input
                        type="text"
                        placeholder="e.g. react, nodejs, developer"
                        value={profileBasics.seo?.meta_keywords || ""}
                        onChange={(e) => setProfileBasics({
                          ...profileBasics,
                          seo: { ...(profileBasics.seo || {}), meta_keywords: e.target.value }
                        })}
                        className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Meta Description</label>
                      <textarea
                        placeholder="e.g. Hire John Doe for premium React and web development services. Experienced, certified developer..."
                        value={profileBasics.seo?.meta_description || ""}
                        onChange={(e) => setProfileBasics({
                          ...profileBasics,
                          seo: { ...(profileBasics.seo || {}), meta_description: e.target.value }
                        })}
                        className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium h-20 resize-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Social Preview Image</label>
                      <div className="flex items-center gap-3">
                        {profileBasics.seo?.image && (
                          <img src={profileBasics.seo.image} alt="SEO Preview" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" />
                        )}
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="cursor-pointer">
                            <div className="bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all flex items-center justify-between gap-2">
                              <span className={uploadingSeoImage ? "text-slate-400" : "text-slate-700"}>
                                {uploadingSeoImage ? "Uploading..." : profileBasics.seo?.image ? "Change Image" : "Upload Image"}
                              </span>
                              {uploadingSeoImage && <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />}
                            </div>
                            <input type="file" accept="image/*" className="hidden" disabled={uploadingSeoImage}
                              onChange={(e) => { if (e.target.files?.[0]) handleSeoImageUpload(e.target.files[0]); }} />
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">Min 300×200px • Max auto-resized to 1200×630px</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5">
                  {setSelectedFreelancerProfile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFreelancerProfile({
                        user_id: 0,
                        name: userName,
                        role: profileBasics.professional_title || "Elite Specialist",
                        email: userEmail || "developer@lancerflow.net",
                        skills: selectedSkills || [],
                        hourlyRate: parseFloat(profileBasics.hourly_rate) || 45,
                        rating: 5.0,
                        completedJobs: 0,
                        bio: profileBasics.bio || "No professional overview bio provided yet by this freelancer partner.",
                        profile_image: profileImage || null,
                        description: profileBasics.bio || "No professional overview bio provided yet by this freelancer partner."
                      })}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-eye text-xs"></i>
                      <span>Preview Profile</span>
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      await handleSaveStep(1);
                      setProfileStep(2);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ml-auto animate-fadeIn"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* FREELANCER STEP 2: EXPERIENCE */}
            {userRole !== "client" && profileStep === 2 && (
              <div className="flex flex-col gap-6">
                {experiences.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Added Work History</h3>
                    <div className="flex flex-col gap-2.5">
                      {experiences.map((exp, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-800">{exp.job_title}</h4>
                            <p className="text-xs text-slate-505 font-bold mt-0.5">{exp.company_name} • {exp.employment_type}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              {formatExpDate(exp.start_date) || "N/A"} to {exp.currently_working ? "Present" : (formatExpDate(exp.end_date) || "N/A")}
                            </p>
                            {exp.description && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{exp.description}</p>}
                          </div>
                          <button
                            onClick={() => deleteExperience(idx)}
                            className="text-rose-600 bg-rose-50 border border-rose-200/40 p-2 rounded-lg hover:bg-rose-100 cursor-pointer shrink-0 transition-all flex items-center justify-center"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border border-slate-200/80 bg-slate-50/50 p-5 rounded-xl flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-800">Add Professional Experience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Job Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={newExp.job_title}
                        onChange={(e) => setNewExp({ ...newExp, job_title: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Acme Solutions"
                        value={newExp.company_name}
                        onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-855 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Employment Type</label>
                      <CustomSelect
                        value={newExp.employment_type}
                        onChange={(val) => setNewExp({ ...newExp, employment_type: val })}
                        options={[
                          { value: "Full-time", label: "Full-time" },
                          { value: "Part-time", label: "Part-time" },
                          { value: "Contract", label: "Contract" },
                          { value: "Freelance", label: "Freelance" },
                          { value: "Internship", label: "Internship" },
                        ]}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Start Date</label>
                      <input
                        type="date"
                        value={newExp.start_date}
                        onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                        className="bg-white border border-slate-255 rounded-xl px-3 py-2 text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">End Date</label>
                      <input
                        type="date"
                        disabled={newExp.currently_working}
                        value={newExp.currently_working ? "" : newExp.end_date}
                        onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                        className="bg-white border border-slate-255 rounded-xl px-3 py-2 text-xs text-slate-850 font-bold disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-650 text-left">
                    <input
                      type="checkbox"
                      id="currently_working"
                      checked={newExp.currently_working}
                      onChange={(e) => setNewExp({ ...newExp, currently_working: e.target.checked })}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="currently_working" className="cursor-pointer">I am currently working in this role</label>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Describe your responsibilities and achievements..."
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                    className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-850 font-medium"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (!newExp.company_name || !newExp.job_title) {
                        triggerToast("error", "Company name and job title are required!");
                        return;
                      }
                      const updated = [...experiences, newExp];
                      setExperiences(updated);
                      localStorage.setItem("profile_experiences", JSON.stringify(updated));
                      setNewExp({
                        company_name: "",
                        job_title: "",
                        employment_type: "Full-time",
                        start_date: "",
                        end_date: "",
                        currently_working: false,
                        description: "",
                      });
                      triggerToast("success", "Work history item added locally!");
                    }}
                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer self-start"
                  >
                    + Add Experience to List
                  </button>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5 flex-wrap sm:flex-nowrap gap-3">
                  <button
                    onClick={() => setProfileStep(1)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-extrabold whitespace-nowrap shrink-0"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveStep(2);
                      setProfileStep(3);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* FREELANCER STEP 3: EDUCATION */}
            {userRole !== "client" && profileStep === 3 && (
              <div className="flex flex-col gap-6">
                {education.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Added Academic History</h3>
                    <div className="flex flex-col gap-2.5">
                      {education.map((edu, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-805">{edu.degree} in {edu.field_of_study}</h4>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">{edu.institution_name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              Graduation: {edu.start_year} - {edu.end_year}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteEducation(idx)}
                            className="text-rose-600 bg-rose-50 border border-rose-200/40 p-2 rounded-lg hover:bg-rose-100 cursor-pointer shrink-0 transition-all flex items-center justify-center"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border border-slate-200/80 bg-slate-50/50 p-5 rounded-xl flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-800">Add Academic History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Institution Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={newEdu.institution_name}
                        onChange={(e) => setNewEdu({ ...newEdu, institution_name: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Degree</label>
                      <input
                        type="text"
                        placeholder="e.g. Bachelor of Science"
                        value={newEdu.degree}
                        onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Field of Study</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={newEdu.field_of_study}
                        onChange={(e) => setNewEdu({ ...newEdu, field_of_study: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Start Year</label>
                      <input
                        type="number"
                        value={newEdu.start_year}
                        onChange={(e) => setNewEdu({ ...newEdu, start_year: Number(e.target.value) })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">End Year (Expected)</label>
                      <input
                        type="number"
                        value={newEdu.end_year}
                        onChange={(e) => setNewEdu({ ...newEdu, end_year: Number(e.target.value) })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newEdu.institution_name || !newEdu.degree) {
                        triggerToast("error", "Institution name and Degree level are required!");
                        return;
                      }
                      const updated = [...education, newEdu];
                      setEducation(updated);
                      localStorage.setItem("profile_education", JSON.stringify(updated));
                      setNewEdu({
                        institution_name: "",
                        degree: "",
                        field_of_study: "",
                        start_year: 2022,
                        end_year: 2026,
                      });
                      triggerToast("success", "Education history item added locally!");
                    }}
                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer self-start"
                  >
                    + Add Education to List
                  </button>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5 flex-wrap sm:flex-nowrap gap-3">
                  <button
                    onClick={() => setProfileStep(2)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-extrabold whitespace-nowrap shrink-0"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveStep(3);
                      setProfileStep(4);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* FREELANCER STEP 4: CERTIFICATIONS */}
            {userRole !== "client" && profileStep === 4 && (
              <div className="flex flex-col gap-6">
                {certifications.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Added Certifications</h3>
                    <div className="flex flex-col gap-2.5">
                      {certifications.map((cert, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-800">{cert.certificate_name}</h4>
                            <p className="text-xs text-slate-505 font-bold mt-0.5">{cert.issuing_organization} • Issued: {cert.issue_date}</p>
                            {cert.credential_url && (
                              <a href={cert.credential_url} target="_blank" rel="noreferrer" className="text-xxs text-primary font-bold hover:underline block mt-1">
                                Verification URL Link ↗
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => deleteCertification(idx)}
                            className="text-rose-600 bg-rose-50 border border-rose-200/40 p-2 rounded-lg hover:bg-rose-100 cursor-pointer shrink-0 transition-all flex items-center justify-center"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border border-slate-200/80 bg-slate-50/50 p-5 rounded-xl flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-800">Add Professional Certification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Certificate Name</label>
                      <input
                        type="text"
                        placeholder="e.g. AWS Solutions Architect"
                        value={newCert.certificate_name}
                        onChange={(e) => setNewCert({ ...newCert, certificate_name: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase">Issuing Organization</label>
                      <input
                        type="text"
                        placeholder="e.g. Amazon Web Services"
                        value={newCert.issuing_organization}
                        onChange={(e) => setNewCert({ ...newCert, issuing_organization: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">Issue Date</span>
                      <input
                        type="date"
                        value={newCert.issue_date}
                        onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">Credential URL</span>
                      <input
                        type="url"
                        placeholder="https://credly.com/..."
                        value={newCert.credential_url}
                        onChange={(e) => setNewCert({ ...newCert, credential_url: e.target.value })}
                        className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!newCert.certificate_name || !newCert.issuing_organization) {
                        triggerToast("error", "Certificate name and Issuing org are required!");
                        return;
                      }
                      const updated = [...certifications, newCert];
                      setCertifications(updated);
                      localStorage.setItem("profile_certifications", JSON.stringify(updated));
                      setNewCert({
                        certificate_name: "",
                        issuing_organization: "",
                        issue_date: "",
                        credential_url: "",
                      });
                      triggerToast("success", "Certification added locally!");
                    }}
                    className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer self-start"
                  >
                    + Add Certification to List
                  </button>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5">
                  <button
                    onClick={() => setProfileStep(3)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-extrabold"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveStep(4);
                      setProfileStep(5);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* FREELANCER STEP 5: SKILLS */}
            {userRole !== "client" && profileStep === 5 && (
              <div className="flex flex-col gap-6">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed text-left">
                  Select tags representing your expert programming languages, frameworks, or design systems.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {availableSkillsList.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => {
                          setSelectedSkills((prev) =>
                            prev.includes(skill)
                              ? prev.filter((s) => s !== skill)
                              : [...prev, skill]
                          );
                        }}
                        style={{ fontSize: "11.5px", lineHeight: "16px" }}
                        className={`px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-teal-700 border-teal-700 text-white shadow-sm font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-6">
                  <button
                    onClick={() => setProfileStep(4)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-bold"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveStep(5);
                      setProfileStep(6);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs text-white">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* FREELANCER STEP 6 & CLIENT STEP 4: CONTACT & ACCOUNT VERIFICATION */}
            {((userRole !== "client" && profileStep === 6) || (userRole === "client" && profileStep === 4)) && (
              <div className="flex flex-col gap-6 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-850">Contact & Account Verification</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Verify your registered email address and mobile phone number with 6-digit OTP codes.</p>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${emailVerified && phoneVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {emailVerified && phoneVerified ? "100% Verified" : "Pending Verification"}
                  </span>
                </div>

                {/* Global Feedback Banner */}
                {otpSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-extrabold flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{otpSuccess}</span>
                  </div>
                )}
                {otpError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-extrabold flex items-center gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Verification Box */}
                  <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <FiMail className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-extrabold text-slate-800">Email Address</span>
                      </div>
                      {emailVerified ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <FiCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={userEmail}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-bold opacity-80 cursor-not-allowed"
                      />
                      {!emailVerified && (
                        <div>
                          {!emailOtpSent ? (
                            <button
                              type="button"
                              disabled={sendingEmailOtp}
                              onClick={handleSendEmailOtp}
                              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {sendingEmailOtp ? (
                                <>
                                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending Email OTP...</span>
                                </>
                              ) : (
                                <>
                                  <FiSend className="w-3.5 h-3.5 text-white" />
                                  <span className="text-white">Send Email OTP</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="Enter 6-digit OTP"
                                  value={emailOtp}
                                  onChange={(e) => setEmailOtp(e.target.value)}
                                  className="flex-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center tracking-widest"
                                />
                                <button
                                  type="button"
                                  disabled={verifyingEmailOtp || !emailOtp.trim()}
                                  onClick={handleVerifyEmailOtp}
                                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {verifyingEmailOtp ? (
                                    <>
                                      <FiLoader className="w-3 h-3 animate-spin text-white" />
                                      <span className="text-white">Verifying...</span>
                                    </>
                                  ) : (
                                    <span className="text-white">Verify</span>
                                  )}
                                </button>
                              </div>
                              <button
                                type="button"
                                disabled={sendingEmailOtp}
                                onClick={handleSendEmailOtp}
                                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 text-left border-none bg-transparent cursor-pointer disabled:opacity-50"
                              >
                                {sendingEmailOtp ? "Resending Email OTP..." : "Resend OTP"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Verification Box */}
                  <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <FiPhone className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-extrabold text-slate-800">Mobile Phone Number</span>
                      </div>
                      {phoneVerified ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <FiCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="tel"
                        placeholder="+1 (555) 123-4567 or +91 9876543210"
                        value={userPhone}
                        disabled={phoneVerified}
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/[^0-9\s\-\+\(\)]/g, "");
                          setUserPhone(cleanVal);
                        }}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-850 font-bold transition-all ${otpError ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-250 focus:border-primary/50"}`}
                      />
                      {userPhone && !phoneVerified && (() => {
                        const feedback = getPhoneValidationFeedback(userPhone);
                        if (!feedback) return null;
                        return (
                          <p className={`text-[10px] font-bold mt-1 ${feedback.isValid ? "text-emerald-600" : "text-amber-600"}`}>
                            {feedback.isValid ? "✓" : "⚠"} {feedback.message}
                          </p>
                        );
                      })()}
                      {otpError && (
                        <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mt-1 select-none flex items-center gap-1">
                          ⚠️ {otpError}
                        </p>
                      )}
                      {!phoneVerified && (
                        <div>
                          {!phoneOtpSent ? (
                            <button
                              type="button"
                              disabled={sendingPhoneOtp || !getPhoneValidationFeedback(userPhone)?.isValid}
                              onClick={handleSendPhoneOtp}
                              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {sendingPhoneOtp ? (
                                <>
                                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending Mobile OTP...</span>
                                </>
                              ) : (
                                <>
                                  <FiSend className="w-3.5 h-3.5 text-white" />
                                  <span className="text-white">Send Mobile OTP</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="Enter 6-digit OTP"
                                  value={phoneOtp}
                                  onChange={(e) => setPhoneOtp(e.target.value)}
                                  className="flex-1 bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center tracking-widest"
                                />
                                <button
                                  type="button"
                                  disabled={verifyingPhoneOtp || !phoneOtp.trim()}
                                  onClick={handleVerifyPhoneOtp}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {verifyingPhoneOtp ? (
                                    <>
                                      <FiLoader className="w-3 h-3 animate-spin text-white" />
                                      <span className="text-white">Verifying...</span>
                                    </>
                                  ) : (
                                    <span className="text-white">Verify</span>
                                  )}
                                </button>
                              </div>
                              <button
                                type="button"
                                disabled={sendingPhoneOtp}
                                onClick={handleSendPhoneOtp}
                                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 text-left border-none bg-transparent cursor-pointer disabled:opacity-50"
                              >
                                {sendingPhoneOtp ? "Resending Mobile OTP..." : "Resend OTP"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={() => setProfileStep(userRole === "client" ? 3 : 5)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-bold"
                  >
                    ← Previous Step
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (userRole === "client") {
                        await handleSaveClientStepSettings(3);
                      } else {
                        await handleSaveStep(5);
                      }
                      localStorage.setItem("onboarding_completed", "true");
                      triggerToast("success", "Profile setup & verification completed!");
                      setTimeout(() => {
                        setActiveTab("workspace");
                        if (typeof window !== "undefined") {
                          window.location.reload();
                        }
                      }, 1000);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4 shrink-0 text-white" />
                    <span className="text-white">Complete Profile Setup</span>
                  </button>
                </div>
              </div>
            )}

            {/* CLIENT STEP 1: COMPANY BASICS */}
            {userRole === "client" && profileStep === 1 && (
              <div className="flex flex-col gap-5 text-left">
                {/* Modern Circular Profile Image Uploader */}
                <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl flex flex-col sm:flex-row items-center gap-6 shadow-sm mb-4">
                  <div className="relative w-24 h-24 select-none shrink-0">
                    <div className="w-full h-full rounded-full flex items-center justify-center font-black text-2xl text-white shadow-md overflow-hidden border-4 border-white ring-4 ring-slate-100 bg-gradient-to-tr from-primary to-cyan-500 relative">
                      <span className="text-2xl font-black text-white">
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
                    
                    {handleProfileImageUpload && (
                      <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-105 active:scale-95 group" title="Change company logo">
                        <i className="fa-solid fa-camera text-[10px] transition-transform group-hover:scale-110"></i>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              await handleProfileImageUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-base font-black text-slate-850 leading-tight">Company Logo or Avatar</h4>
                    <p className="text-xs text-slate-550 mt-1 leading-relaxed">Upload a recognizable company brand logo or a representative photo. Click the camera icon on the circle to choose a photo.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corporation"
                      value={clientBasics.company_name}
                      onChange={(e) => setClientBasics({ ...clientBasics, company_name: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Industry *</label>
                    <CustomSelect
                      value={clientBasics.industry}
                      onChange={(val) => setClientBasics({ ...clientBasics, industry: val })}
                      options={[
                        { value: "Technology", label: "Technology & Software" },
                        { value: "Finance", label: "Finance & Banking" },
                        { value: "Healthcare", label: "Healthcare & Medicine" },
                        { value: "Education", label: "Education & EdTech" },
                        { value: "Marketing", label: "Marketing & Advertising" },
                        { value: "Retail", label: "Retail & E-commerce" },
                        { value: "Other", label: "Other Industry" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Size *</label>
                    <CustomSelect
                      value={clientBasics.company_size}
                      onChange={(val) => setClientBasics({ ...clientBasics, company_size: val })}
                      options={[
                        { value: "1-10", label: "1-10 employees" },
                        { value: "11-50", label: "11-55 employees" },
                        { value: "51-200", label: "51-200 employees" },
                        { value: "201-500", label: "201-500 employees" },
                        { value: "500+", label: "500+ employees" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Established Year</label>
                    <input
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      placeholder="e.g. 2020"
                      value={clientBasics.company_established_year || ""}
                      onChange={(e) => setClientBasics({ ...clientBasics, company_established_year: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={async () => {
                      await handleSaveClientStepSettings(1);
                      setProfileStep(2);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* CLIENT STEP 2: COMPANY PRESENCE & DETAILS */}
            {userRole === "client" && profileStep === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Website URL</label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={clientBasics.company_website}
                    onChange={(e) => setClientBasics({ ...clientBasics, company_website: e.target.value })}
                    className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Description</label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe what your organization does..."
                    value={clientBasics.company_description}
                    onChange={(e) => setClientBasics({ ...clientBasics, company_description: e.target.value })}
                    className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                  />
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5">
                  <button
                    onClick={() => setProfileStep(1)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-extrabold"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveClientStepSettings(2);
                      setProfileStep(3);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* CLIENT STEP 3: HIRING CONTACT */}
            {userRole === "client" && profileStep === 3 && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={clientBasics.hiring_contact_name}
                      onChange={(e) => setClientBasics({ ...clientBasics, hiring_contact_name: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Contact Person Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Head of Engineering"
                      value={clientBasics.hiring_contact_designation}
                      onChange={(e) => setClientBasics({ ...clientBasics, hiring_contact_designation: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5">
                  <button
                    onClick={() => setProfileStep(2)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-extrabold"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveClientStepSettings(3);
                      setProfileStep(4);
                    }}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Save & Continue</span>
                    <span className="text-xxs text-white">→</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER 2: PREMIUM TABBED DIRECT SETTINGS PANEL (once onboarded)
  return (
    <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full animate-fadeIn select-none">
      {/* LEFT NAVIGATION SUBTABS (4 cols) */}
      <div className="xl:col-span-4 bg-white border border-slate-200/85 rounded-xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 select-none">
            <FiSettings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Account Settings</h2>
            <p className="text-slate-400 text-xs mt-0.5">Manage details and sync to SQL.</p>
          </div>
        </div>

        {/* Dynamic subtabs menu */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveSettingsSubTab("account")}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-3 ${
              activeSettingsSubTab === "account"
                ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                : "bg-slate-50/50 border-slate-200/80 text-slate-650 hover:bg-white hover:border-slate-350"
            }`}
          >
            <FiUser className="w-4 h-4" /> Account Details
          </button>

          <button
            onClick={() => setActiveSettingsSubTab("profile")}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-3 ${
              activeSettingsSubTab === "profile"
                ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                : "bg-slate-50/50 border-slate-200/80 text-slate-650 hover:bg-white hover:border-slate-350"
            }`}
          >
            <FiBriefcase className="w-4 h-4" /> {userRole === "client" ? "Company Profile" : "Professional Profile"}
          </button>

          <button
            onClick={() => setActiveSettingsSubTab("subscription")}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-3 ${
              activeSettingsSubTab === "subscription"
                ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                : "bg-slate-50/50 border-slate-200/80 text-slate-650 hover:bg-white hover:border-slate-350"
            }`}
          >
            <FiCheckCircle className="w-4 h-4" /> Membership Plan
          </button>
        </div>

        <button
          onClick={() => setSettingsTabMode("hub")}
          className="w-full text-center py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer font-sans"
        >
          ← Back to Settings Hub
        </button>
        <button
          onClick={() => setActiveTab("workspace")}
          className="w-full text-center py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer font-sans"
        >
          ← Back to Workspace Hub
        </button>
      </div>

      {/* RIGHT DISPLAY PANEL (8 cols) */}
      <div className="xl:col-span-8 flex flex-col gap-6 w-full">
        <div className="bg-white border border-slate-200/85 rounded-xl p-6 sm:p-8 shadow-sm text-slate-800 animate-fadeIn min-h-[400px]">
          
          {/* TAB 1: ACCOUNT DETAILS */}
          {activeSettingsSubTab === "account" && (
            <div className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Account Identity</h3>
                  <p className="text-xs text-slate-400">View and reset platform properties.</p>
                </div>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  System Settings
                </span>
              </div>

              {/* Profile Card Summary */}
              <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                <div className="relative w-24 h-24 select-none shrink-0">
                  <div className="w-full h-full rounded-full flex items-center justify-center font-black text-2xl text-white shadow-md overflow-hidden border-4 border-white ring-4 ring-slate-100 bg-gradient-to-tr from-primary to-cyan-500 relative">
                    <span className="text-2xl font-black text-white">
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
                  
                  {handleProfileImageUpload && (
                    <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-105 active:scale-95 group" title="Change profile photo">
                      <i className="fa-solid fa-camera text-[10px] transition-transform group-hover:scale-110"></i>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            await handleProfileImageUpload(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-lg font-black text-slate-850 leading-tight">{userName}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1 capitalize">Role: {userRole || "Freelancer"}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                    <span className="text-[10px] text-primary bg-primary/5 border border-primary/10 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                      SQL Verified Account <FiCheck className="w-3.5 h-3.5" />
                    </span>
                    
                    {setSelectedFreelancerProfile && userRole !== "client" && (
                      <button
                        type="button"
                        onClick={() => setSelectedFreelancerProfile({
                          user_id: 0,
                          name: userName,
                          role: profileBasics.professional_title || "Elite Specialist",
                          email: userEmail || "developer@lancerflow.net",
                          skills: selectedSkills || [],
                          hourlyRate: parseFloat(profileBasics.hourly_rate) || 45,
                          rating: 5.0,
                          completedJobs: 0,
                          bio: profileBasics.bio || "No professional overview bio provided yet by this freelancer partner.",
                          profile_image: profileImage || null,
                          description: profileBasics.bio || "No professional overview bio provided yet by this freelancer partner."
                        })}
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xxs px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                      >
                        <i className="fa-solid fa-eye text-xxs"></i>
                        <span>Preview Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="flex flex-col gap-4 mt-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Developer & Reset Options</h4>
                
                <div className="bg-amber-50/50 border border-amber-200/80 p-4.5 rounded-xl text-xs flex gap-3.5 items-start">
                  <FiAlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-extrabold text-amber-900">Reset Profile Onboarding Status</h5>
                    <p className="text-amber-700/80 mt-1 leading-relaxed">
                      This will reset your completion progress and take you back to the initial step-by-step setup wizard layout. Use this if you need to run onboarding testing.
                    </p>
                    <button
                      onClick={handleResetProfileStatus}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xxs font-black px-4 py-2 rounded-xl mt-3 shadow-sm transition-all cursor-pointer"
                    >
                      Reset Onboarding Flow
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-xl flex items-center justify-between gap-4 mt-2">
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-800">Sign out of Platform</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Securely clear token cache and return to login.</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all"
                  >
                    Logout Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERSHIP & SUBSCRIPTION */}
          {activeSettingsSubTab === "subscription" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Membership & Subscription</h3>
                  <p className="text-xs text-slate-400">Manage your active subscription plan and benefits.</p>
                </div>
                <span className="bg-teal-50 text-teal-800 border border-teal-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Active Tier
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4.5 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Plan:</span>
                    <span className="text-xs bg-teal-50 border border-teal-100 text-teal-850 px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase">
                      {userSubscription?.plan_name || "Starter"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-1 leading-normal max-w-md">
                    {userSubscription?.description || "Basic membership tier with standard platform limits."}
                  </p>
                </div>

                <div className="text-right sm:text-left shrink-0">
                  <span className="text-lg font-black text-slate-900 leading-tight font-sans">
                    {!userSubscription?.price || parseFloat(String(userSubscription.price).replace(/[^0-9.]/g, "")) === 0 || String(userSubscription.price).trim() === "0.00" || String(userSubscription.price).trim() === "0"
                      ? "Free"
                      : userSubscription.price}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mt-0.5">
                    {userSubscription?.period || ""}
                  </span>
                </div>
              </div>

              {/* Next Upgrade Tier */}
              {(!userSubscription || (userSubscription.active_plan_id !== 3 && userSubscription.active_plan_id !== 7)) && (
                <div className="bg-[#063c38]/5 border border-teal-700/10 p-5 rounded-xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4.5 mt-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#063c38] text-white flex items-center justify-center font-black shrink-0 shadow-sm text-sm">
                      🚀
                    </div>
                    <div>
                      <h5 className="font-black text-slate-850 text-xs">
                        Next Level Upgrade: {(userSubscription?.active_plan_id === 2 || userSubscription?.active_plan_id === 6) ? "Enterprise Plan" : "Professional Plan"}
                      </h5>
                      <p className="text-slate-500 font-semibold mt-1 max-w-sm leading-normal">
                        {(userSubscription?.active_plan_id === 2 || userSubscription?.active_plan_id === 6) 
                          ? "Gain unlimited active job posts, unlimited bid proposals, and custom enterprise support options."
                          : "Unlock advanced matching algorithms, priority support channels, and reduced transaction fees."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const currentId = userSubscription?.active_plan_id;
                      const nextPlanId = (currentId === 1 || currentId === 5)
                        ? currentId + 1
                        : (currentId === 2 || currentId === 6)
                          ? currentId + 1
                          : 2;
                      window.location.href = `/pricing/${nextPlanId}`;
                    }}
                    className="w-full sm:w-auto bg-[#063c38] hover:bg-[#084843] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer text-center shrink-0"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE SETTINGS (STEP BY STEP VIA TOP HORIZONTAL STEPPER) */}
          {activeSettingsSubTab === "profile" && (
            <div className="flex flex-col gap-6">
              
              {userRole === "client" ? (
                /* CLIENT PROFILE STEP BY STEP FORMS WITH 3-STEP TOP STEPPER */
                <div className="flex flex-col gap-6">
                  {/* Top Steps Horizontal Tracker */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-3">
                    {[
                      { step: 1, label: "Company Basics" },
                      { step: 2, label: "Company Presence" },
                      { step: 3, label: "Representative" },
                    ].map((s) => {
                      const isActive = clientSettingsStep === s.step;
                      const isCompleted = clientSettingsStep > s.step;
                      return (
                        <button
                          key={s.step}
                          onClick={() => setClientSettingsStep(s.step)}
                          className="flex-1 flex flex-col gap-2 items-center cursor-pointer group"
                        >
                          <div className="flex items-center w-full">
                            <div className={`flex-1 h-0.5 ${s.step === 1 ? "invisible" : isCompleted || isActive ? "bg-primary" : "bg-slate-200"}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              isActive
                                ? "bg-primary text-white ring-4 ring-primary/20 shadow-md scale-110"
                                : isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                            }`}>
                              {isCompleted ? <FiCheck className="w-4 h-4" /> : s.step}
                            </div>
                            <div className={`flex-1 h-0.5 ${s.step === 3 ? "invisible" : isCompleted ? "bg-primary" : "bg-slate-200"}`} />
                          </div>
                          <span className={`text-[10px] font-extrabold tracking-wide ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}>
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* CLIENT STEP 1 */}
                  {clientSettingsStep === 1 && (
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Name *</label>
                          <input
                            type="text"
                            value={clientBasics.company_name || ""}
                            onChange={(e) => setClientBasics({ ...clientBasics, company_name: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Industry *</label>
                          <CustomSelect
                            value={clientBasics.industry || "Technology"}
                            onChange={(val) => setClientBasics({ ...clientBasics, industry: val })}
                            options={[
                              { value: "Technology", label: "Technology & Software" },
                              { value: "Finance", label: "Finance & Banking" },
                              { value: "Healthcare", label: "Healthcare & Medicine" },
                              { value: "Education", label: "Education & EdTech" },
                              { value: "Marketing", label: "Marketing & Advertising" },
                              { value: "Retail", label: "Retail & E-commerce" },
                              { value: "Other", label: "Other Industry" },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Size *</label>
                          <CustomSelect
                            value={clientBasics.company_size || "1-10"}
                            onChange={(val) => setClientBasics({ ...clientBasics, company_size: val })}
                            options={[
                              { value: "1-10", label: "1-10 employees" },
                              { value: "11-50", label: "11-50 employees" },
                              { value: "51-200", label: "51-200 employees" },
                              { value: "201-500", label: "201-500 employees" },
                              { value: "500+", label: "500+ employees" },
                            ]}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Established Year</label>
                          <input
                            type="number"
                            value={clientBasics.company_established_year || ""}
                            onChange={(e) => setClientBasics({ ...clientBasics, company_established_year: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          await handleSaveClientStepSettings(1);
                          setClientSettingsStep(2);
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all self-end cursor-pointer mt-2"
                      >
                        Save & Continue →
                      </button>
                    </div>
                  )}

                  {/* CLIENT STEP 2 */}
                  {clientSettingsStep === 2 && (
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Website URL</label>
                        <input
                          type="url"
                          value={clientBasics.company_website || ""}
                          onChange={(e) => setClientBasics({ ...clientBasics, company_website: e.target.value })}
                          className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Company Description</label>
                        <textarea
                          rows={4}
                          value={clientBasics.company_description || ""}
                          onChange={(e) => setClientBasics({ ...clientBasics, company_description: e.target.value })}
                          className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                        />
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => setClientSettingsStep(1)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          ← Previous Step
                        </button>
                        <button
                          onClick={async () => {
                            await handleSaveClientStepSettings(2);
                            setClientSettingsStep(3);
                          }}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Save & Continue →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CLIENT STEP 3 */}
                  {clientSettingsStep === 3 && (
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Hiring Contact Representative</label>
                          <input
                            type="text"
                            value={clientBasics.hiring_contact_name || ""}
                            onChange={(e) => setClientBasics({ ...clientBasics, hiring_contact_name: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Representative Designation</label>
                          <input
                            type="text"
                            value={clientBasics.hiring_contact_designation || ""}
                            onChange={(e) => setClientBasics({ ...clientBasics, hiring_contact_designation: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-2 flex-wrap sm:flex-nowrap gap-3">
                        <button
                          onClick={() => setClientSettingsStep(2)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold whitespace-nowrap shrink-0"
                        >
                          ← Previous Step
                        </button>
                        <button
                          onClick={async () => {
                            await handleSaveClientStepSettings(3);
                            triggerToast("success", "Client Company Profile saved successfully to DB!");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span className="flex items-center gap-1.5 justify-center">
                            <FiCheck className="w-4 h-4 shrink-0" /> Complete Client Setup
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* FREELANCER STEP BY STEP FORMS WITH 5-STEP TOP STEPPER */
                <div className="flex flex-col gap-6">
                  {/* Top Steps Horizontal Tracker */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-3">
                    {[
                      { step: 1, label: "Basics" },
                      { step: 2, label: "Experience" },
                      { step: 3, label: "Education" },
                      { step: 4, label: "Certifications" },
                      { step: 5, label: "Skills" },
                    ].map((s) => {
                      const isActive = freelancerSettingsStep === s.step;
                      const isCompleted = freelancerSettingsStep > s.step;
                      return (
                        <button
                          key={s.step}
                          onClick={() => setFreelancerSettingsStep(s.step)}
                          className="flex-1 flex flex-col gap-2 items-center cursor-pointer group"
                        >
                          <div className="flex items-center w-full">
                            <div className={`flex-1 h-0.5 ${s.step === 1 ? "invisible" : isCompleted || isActive ? "bg-primary" : "bg-slate-200"}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              isActive
                                ? "bg-primary text-white ring-4 ring-primary/20 shadow-md scale-110"
                                : isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                            }`}>
                              {isCompleted ? <FiCheck className="w-4 h-4" /> : s.step}
                            </div>
                            <div className={`flex-1 h-0.5 ${s.step === 5 ? "invisible" : isCompleted ? "bg-primary" : "bg-slate-200"}`} />
                          </div>
                          <span className={`text-[10px] font-extrabold tracking-wide ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}>
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* FREELANCER STEP 1: BASICS */}
                  {freelancerSettingsStep === 1 && (
                    <div className="flex flex-col gap-5">


                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Display Name</label>
                          <input
                            type="text"
                            value={profileBasics.display_name || ""}
                            onChange={(e) => handleDisplayFreelancerNameChange(e.target.value)}
                            placeholder="e.g. Alex Rivera"
                            className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Profile URL Slug</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xxs font-bold select-none">
                              lancerflow.net/freelancer/
                            </span>
                            <input
                              type="text"
                              value={profileBasics.slug || ""}
                              onChange={(e) => handleFreelancerSlugChange(e.target.value)}
                              placeholder="url-slug"
                              className="w-full bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl pl-[142px] pr-10 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-semibold font-mono"
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                              {slugValidating && (
                                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                              )}
                              {!slugValidating && slugAvailable === true && (
                                <span className="text-emerald-600 text-xs font-black" title="Slug is available">✓</span>
                              )}
                              {!slugValidating && slugAvailable === false && (
                                <span className="text-rose-500 text-xs font-black" title="Slug is already taken">✗</span>
                              )}
                            </div>
                          </div>
                          {slugAvailable === true && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ URL slug is available!</p>
                          )}
                          {slugAvailable === false && (
                            <p className="text-[10px] text-rose-500 font-bold mt-1">✗ Slug is already taken by another freelancer.</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Professional Title</label>
                          <input
                            type="text"
                            value={profileBasics.professional_title || ""}
                            onChange={(e) => setProfileBasics({ ...profileBasics, professional_title: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Experience Level</label>
                          <CustomSelect
                            value={profileBasics.experience_level || "Expert"}
                            onChange={(val) => setProfileBasics({ ...profileBasics, experience_level: val })}
                            options={[
                              { value: "Beginner", label: "Entry (Beginner)" },
                              { value: "Intermediate", label: "Intermediate (Mid-level)" },
                              { value: "Expert", label: "Expert (Senior)" },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Hourly Rate ($ USD / hr)</label>
                          <input
                            type="number"
                            min="5"
                            max="500"
                            value={profileBasics.hourly_rate || 50}
                            onChange={(e) => setProfileBasics({ ...profileBasics, hourly_rate: Number(e.target.value) })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Availability Status</label>
                          <CustomSelect
                            value={profileBasics.availability_status || "Available"}
                            onChange={(val) => setProfileBasics({ ...profileBasics, availability_status: val })}
                            options={[
                              { value: "Available", label: "Available Full-time" },
                              { value: "Part-time", label: "Available Part-time" },
                              { value: "Busy", label: "Busy / In Contract" },
                              { value: "Not Available", label: "Not Available" },
                            ]}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Total Experience Years</label>
                          <input
                            type="number"
                            min="0"
                            value={profileBasics.total_experience_years || 5}
                            onChange={(e) => setProfileBasics({ ...profileBasics, total_experience_years: Number(e.target.value) })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">LinkedIn URL</label>
                          <input
                            type="url"
                            placeholder="https://linkedin.com/..."
                            value={profileBasics.linkedin_url || ""}
                            onChange={(e) => setProfileBasics({ ...profileBasics, linkedin_url: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Portfolio Website</label>
                          <input
                            type="url"
                            placeholder="https://website.dev"
                            value={profileBasics.portfolio_website || ""}
                            onChange={(e) => setProfileBasics({ ...profileBasics, portfolio_website: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left col-span-1 md:col-span-2">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Resume (PDF / TXT)</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="url"
                              placeholder="https://drive.google.com/..."
                              value={profileBasics.resume_url || ""}
                              onChange={(e) => setProfileBasics({ ...profileBasics, resume_url: e.target.value })}
                              className="flex-1 bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                            />
                            <label className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-250 hover:border-slate-300 text-slate-650 rounded-xl cursor-pointer text-xs font-bold transition-all whitespace-nowrap shadow-sm">
                              <FiUpload className="w-4 h-4" />
                              <span>{uploadingResume ? "Uploading..." : "Upload File"}</span>
                              <input
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleResumeUpload}
                                className="hidden"
                                disabled={uploadingResume}
                              />
                            </label>
                          </div>
                          {resumeUploadError && (
                            <p className="text-[10px] text-rose-500 font-bold select-none mt-1">⚠️ {resumeUploadError}</p>
                          )}
                        </div>
                      </div>

                      {/* SEO Configuration Section */}
                      <div className="border-t border-slate-100 pt-5 mt-3 flex flex-col gap-4 text-left">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">SEO Search Metadata</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Meta Title</label>
                            <input
                              type="text"
                              placeholder="e.g. John Doe - Expert React Developer"
                              value={profileBasics.seo?.meta_title || ""}
                              onChange={(e) => setProfileBasics({
                                ...profileBasics,
                                seo: { ...(profileBasics.seo || {}), meta_title: e.target.value }
                              })}
                              className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Keywords</label>
                            <input
                              type="text"
                              placeholder="e.g. react, nodejs, developer"
                              value={profileBasics.seo?.meta_keywords || ""}
                              onChange={(e) => setProfileBasics({
                                ...profileBasics,
                                seo: { ...(profileBasics.seo || {}), meta_keywords: e.target.value }
                              })}
                              className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Meta Description</label>
                            <textarea
                              placeholder="e.g. Hire John Doe for premium React and web development services. Experienced, certified developer..."
                              value={profileBasics.seo?.meta_description || ""}
                              onChange={(e) => setProfileBasics({
                                ...profileBasics,
                                seo: { ...(profileBasics.seo || {}), meta_description: e.target.value }
                              })}
                              className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium h-20 resize-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">SEO Social Preview Image</label>
                            <div className="flex items-center gap-3">
                              {profileBasics.seo?.image && (
                                <img src={profileBasics.seo.image} alt="SEO Preview" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" />
                              )}
                              <div className="flex-1 flex flex-col gap-1">
                                <label className="cursor-pointer">
                                  <div className="bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all flex items-center justify-between gap-2">
                                    <span className={uploadingSeoImage ? "text-slate-400" : "text-slate-700"}>
                                      {uploadingSeoImage ? "Uploading..." : profileBasics.seo?.image ? "Change Image" : "Upload Image"}
                                    </span>
                                    {uploadingSeoImage && <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />}
                                  </div>
                                  <input type="file" accept="image/*" className="hidden" disabled={uploadingSeoImage}
                                    onChange={(e) => { if (e.target.files?.[0]) handleSeoImageUpload(e.target.files[0]); }} />
                                </label>
                                <span className="text-[10px] text-slate-400 font-medium">Min 300×200px • Max auto-resized to 1200×630px</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          await handleSaveStep(1);
                          setFreelancerSettingsStep(2);
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all self-end cursor-pointer mt-2"
                      >
                        Save & Continue →
                      </button>
                    </div>
                  )}

                  {/* FREELANCER STEP 2: EXPERIENCE LIST & FORM */}
                  {freelancerSettingsStep === 2 && (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Employment History</h3>
                        {experiences.length > 0 ? (
                          <div className="flex flex-col gap-2.5">
                            {experiences.map((exp, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wide">{exp.job_title}</h4>
                                  <p className="text-xs font-bold text-slate-500 mt-0.5">{exp.company_name} • {exp.employment_type}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                    {formatExpDate(exp.start_date) || "N/A"} to {exp.currently_working ? "Present" : (formatExpDate(exp.end_date) || "N/A")}
                                  </p>
                                  {exp.description && <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">{exp.description}</p>}
                                </div>
                                <button
                                  onClick={() => directDeleteExperience(idx)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No professional experiences added yet.</p>
                        )}
                      </div>

                      {/* Add Experience form */}
                      <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-xl flex flex-col gap-4">
                        <h4 className="text-xs font-black text-slate-800">Add Professional Role</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Job Title (e.g. Lead Engineer)"
                            value={tempExp.job_title}
                            onChange={(e) => setTempExp({ ...tempExp, job_title: e.target.value })}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={tempExp.company_name}
                            onChange={(e) => setTempExp({ ...tempExp, company_name: e.target.value })}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CustomSelect
                            value={tempExp.employment_type}
                            onChange={(val) => setTempExp({ ...tempExp, employment_type: val })}
                            options={[
                              { value: "Full-time", label: "Full-time" },
                              { value: "Part-time", label: "Part-time" },
                              { value: "Contract", label: "Contract" },
                              { value: "Freelance", label: "Freelance" },
                            ]}
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">Start Date</span>
                            <input
                              type="date"
                              value={tempExp.start_date}
                              onChange={(e) => setTempExp({ ...tempExp, start_date: e.target.value })}
                              className="bg-white border border-slate-255 rounded-xl px-3 py-1.5 text-xs text-slate-855 font-bold"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">End Date</span>
                            <input
                              type="date"
                              disabled={tempExp.currently_working}
                              value={tempExp.currently_working ? "" : tempExp.end_date}
                              onChange={(e) => setTempExp({ ...tempExp, end_date: e.target.value })}
                              className="bg-white border border-slate-255 rounded-xl px-3 py-1.5 text-xs text-slate-855 font-bold disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xxs font-black text-slate-500 text-left">
                          <input
                            type="checkbox"
                            id="currently_working_direct"
                            checked={tempExp.currently_working}
                            onChange={(e) => setTempExp({ ...tempExp, currently_working: e.target.checked })}
                            className="w-4 h-4 text-primary border-slate-300 rounded cursor-pointer"
                          />
                          <label htmlFor="currently_working_direct" className="cursor-pointer">Currently working in this role</label>
                        </div>

                        <textarea
                          rows={2}
                          placeholder="Short description of role achievements..."
                          value={tempExp.description}
                          onChange={(e) => setTempExp({ ...tempExp, description: e.target.value })}
                          className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-850 font-medium"
                        />

                        <button
                          onClick={directAddExperience}
                          style={{ fontSize: "11px" }}
                          className="bg-[#0a5a54]/10 text-primary border border-primary/20 hover:bg-[#0a5a54]/25 px-3 py-1.5 rounded-lg font-bold self-start cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Add Experience
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => setFreelancerSettingsStep(1)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          ← Previous Step
                        </button>
                        <button
                          onClick={() => setFreelancerSettingsStep(3)}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FREELANCER STEP 3: EDUCATION HISTORY */}
                  {freelancerSettingsStep === 3 && (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Academic History</h3>
                        {education.length > 0 ? (
                          <div className="flex flex-col gap-2.5">
                            {education.map((edu, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="text-xs font-black text-slate-800 G uppercase tracking-wide">{edu.degree} in {edu.field_of_study}</h4>
                                  <p className="text-xs font-bold text-slate-505 mt-0.5">{edu.institution_name}</p>
                                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Graduation: {edu.start_year} - {edu.end_year}</p>
                                </div>
                                <button
                                  onClick={() => directDeleteEducation(idx)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No academic history added yet.</p>
                        )}
                      </div>

                      {/* Add Education form */}
                      <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-xl flex flex-col gap-4">
                        <h4 className="text-xs font-black text-slate-800">Add Academic Credential</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Institution Name (e.g. MIT)"
                            value={tempEdu.institution_name}
                            onChange={(e) => setTempEdu({ ...tempEdu, institution_name: e.target.value })}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Degree (e.g. Master of Science)"
                            value={tempEdu.degree}
                            onChange={(e) => setTempEdu({ ...tempEdu, degree: e.target.value })}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            placeholder="Field of Study"
                            value={tempEdu.field_of_study}
                            onChange={(e) => setTempEdu({ ...tempEdu, field_of_study: e.target.value })}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">Start Year</span>
                            <input
                              type="number"
                              value={tempEdu.start_year}
                              onChange={(e) => setTempEdu({ ...tempEdu, start_year: Number(e.target.value) })}
                              className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-850 font-bold"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">End Year</span>
                            <input
                              type="number"
                              value={tempEdu.end_year}
                              onChange={(e) => setTempEdu({ ...tempEdu, end_year: Number(e.target.value) })}
                              className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-850 font-bold"
                            />
                          </div>
                        </div>

                        <button
                          onClick={directAddEducation}
                          style={{ fontSize: "11px" }}
                          className="bg-[#0a5a54]/10 text-primary border border-primary/20 hover:bg-[#0a5a54]/25 px-3 py-1.5 rounded-lg font-bold self-start cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Add Education
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => setFreelancerSettingsStep(2)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          ← Previous Step
                        </button>
                        <button
                          onClick={() => setFreelancerSettingsStep(4)}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FREELANCER STEP 4: CERTIFICATIONS LIST & FORM */}
                  {freelancerSettingsStep === 4 && (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Professional Certifications</h3>
                        {certifications.length > 0 ? (
                          <div className="flex flex-col gap-2.5">
                            {certifications.map((cert, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="text-xs font-black text-slate-805 uppercase tracking-wide">{cert.certificate_name}</h4>
                                  <p className="text-xs font-bold text-slate-500 mt-0.5">{cert.issuing_organization} • Issued: {cert.issue_date}</p>
                                  {cert.credential_url && (
                                    <a href={cert.credential_url} target="_blank" rel="noreferrer" className="text-xxs text-primary font-bold hover:underline block mt-1">
                                      Verification Link ↗
                                    </a>
                                  )}
                                </div>
                                <button
                                  onClick={() => directDeleteCertification(idx)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No certifications added yet.</p>
                        )}
                      </div>

                      {/* Add Cert Form */}
                      <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-xl flex flex-col gap-4">
                        <h4 className="text-xs font-black text-slate-800">Add Professional Certification</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Certificate Name"
                            value={tempCert.certificate_name}
                            onChange={(e) => setTempCert({ ...tempCert, certificate_name: e.target.value })}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Issuing Organization"
                            value={tempCert.issuing_organization}
                            onChange={(e) => setTempCert({ ...tempCert, issuing_organization: e.target.value })}
                            className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">Issue Date</span>
                            <input
                              type="date"
                              value={tempCert.issue_date}
                              onChange={(e) => setTempCert({ ...tempCert, issue_date: e.target.value })}
                              className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-bold"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">Verification Link (URL)</span>
                            <input
                              type="url"
                              placeholder="https://credly.com/..."
                              value={tempCert.credential_url}
                              onChange={(e) => setTempCert({ ...tempCert, credential_url: e.target.value })}
                              className="bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs text-slate-850 font-medium"
                            />
                          </div>
                        </div>

                        <button
                          onClick={directAddCertification}
                          style={{ fontSize: "11px" }}
                          className="bg-[#0a5a54]/10 text-primary border border-primary/20 hover:bg-[#0a5a54]/25 px-3 py-1.5 rounded-lg font-bold self-start cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Add Certification
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => setFreelancerSettingsStep(3)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          ← Previous Step
                        </button>
                        <button
                          onClick={() => setFreelancerSettingsStep(5)}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FREELANCER STEP 5: SKILLS INVENTORY */}
                  {freelancerSettingsStep === 5 && (
                    <div className="flex flex-col gap-6">
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <p className="text-xs text-slate-400">Toggle tags and click Save to write to SQL database.</p>
                        <span className="bg-slate-100 text-slate-655 px-3 py-1 rounded-full text-[10px] font-bold">
                          {selectedSkills.length} Selected
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {availableSkillsList.map((skill) => {
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              onClick={() => {
                                setSelectedSkills((prev) =>
                                  prev.includes(skill)
                                    ? prev.filter((s) => s !== skill)
                                    : [...prev, skill]
                                );
                              }}
                              style={{ fontSize: "11.5px", lineHeight: "16px" }}
                              className={`px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer select-none ${
                                isSelected
                                  ? "bg-primary border-primary text-white shadow-sm font-bold"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => setFreelancerSettingsStep(4)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          ← Previous Step
                        </button>
                        <button
                          onClick={async () => {
                            await handleSaveStep(5);
                            triggerToast("success", "Skills saved successfully to DB!");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 justify-center">
                            Save Profile Skills <FiCheck className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
