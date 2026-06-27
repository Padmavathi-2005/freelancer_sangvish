import React, { useState } from "react";
import CustomSelect from "../CustomSelect";
import { FiSettings, FiUser, FiBriefcase, FiAlertTriangle, FiCheckCircle, FiCheck, FiTrash2, FiPlus, FiCircle } from "react-icons/fi";

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
}: SettingsTabProps) {
  // Local state for settings subtabs
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<"account" | "profile">("account");

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
      const res = await fetch("http://localhost:5000/api/freelancer/experiences", {
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
      const res = await fetch("http://localhost:5000/api/freelancer/experiences", {
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
      const res = await fetch("http://localhost:5000/api/freelancer/education", {
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
      const res = await fetch("http://localhost:5000/api/freelancer/education", {
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
      const res = await fetch("http://localhost:5000/api/freelancer/certifications", {
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
      const res = await fetch("http://localhost:5000/api/freelancer/certifications", {
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

  // RENDER 1: STEP-BY-STEP CHECKLIST ONBOARDING (if profile not 100% complete)
  if (!isOnboardingComplete) {
    return (
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full animate-fadeIn">
        {/* LEFT CHECKLIST SIDEBAR */}
        <div className="xl:col-span-4 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Profile Setup Checklist</h2>
            <p className="text-slate-400 text-xs mt-1">Complete each section to activate your profile on the SQL DB.</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 rounded-xl p-4.5">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" className="stroke-slate-200" strokeWidth="4" fill="transparent" />
                <circle cx="24" cy="24" r="20" className="stroke-primary transition-all duration-300" strokeWidth="4" fill="transparent"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - profileCompletionProgress / 100)} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] leading-none font-black text-slate-800">
                {profileCompletionProgress}%
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</span>
              <span className="text-sm font-extrabold text-slate-850">
                {profileCompletionProgress === 100 ? "Ready to Publish! 🎉" : "In Progress"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {stepsStatus.map((step) => {
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
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                      : "bg-slate-50/50 border-slate-200/80 text-slate-650 hover:bg-white hover:border-slate-355"
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
          </div>

          <button
            onClick={() => setActiveTab("workspace")}
            className="w-full text-center py-3 text-xs font-bold text-slate-500 hover:text-slate-885 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer font-sans"
          >
            ← Back to Workspace Hub
          </button>
        </div>

        {/* RIGHT WIZARD FLOW CONTENT */}
        <div className="xl:col-span-8 flex flex-col gap-6 w-full">
          <div className="bg-white border border-slate-200/85 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 text-slate-800">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-wider block">
                  Step {profileStep} of {userRole === "client" ? "3" : "5"}
                </span>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  {userRole === "client" ? (
                    <>
                      {profileStep === 1 && "Company Basics"}
                      {profileStep === 2 && "Company Presence & Details"}
                      {profileStep === 3 && "Hiring Contact Info"}
                    </>
                  ) : (
                    <>
                      {profileStep === 1 && "Core Professional Profile"}
                      {profileStep === 2 && "Work Experience History"}
                      {profileStep === 3 && "Education History"}
                      {profileStep === 4 && "Professional Certifications"}
                      {profileStep === 5 && "Skills Selector"}
                    </>
                  )}
                </h1>
              </div>
            </div>

            {/* FREELANCER STEP 1: BASICS */}
            {userRole !== "client" && profileStep === 1 && (
              <div className="flex flex-col gap-5">
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
                        { value: "Entry", label: "Entry (Beginner)" },
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
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Resume Link (PDF URL)</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={profileBasics.resume_url}
                      onChange={(e) => setProfileBasics({ ...profileBasics, resume_url: e.target.value })}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={async () => {
                      await handleSaveStep(1);
                      setProfileStep(2);
                    }}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
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
                              {exp.start_date} to {exp.currently_working ? "Present" : exp.end_date}
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

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5">
                  <button
                    onClick={() => setProfileStep(1)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-extrabold"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveStep(2);
                      setProfileStep(3);
                    }}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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

                <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-5">
                  <button
                    onClick={() => setProfileStep(2)}
                    className="text-slate-500 hover:text-slate-800 text-xs font-extrabold"
                  >
                    ← Previous Step
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveStep(3);
                      setProfileStep(4);
                    }}
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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
                <p className="text-xs text-slate-505 font-semibold leading-relaxed text-left">
                  Select tags representing your expert programming languages, frameworks, or design systems. These will map to the `user_skills` database table.
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
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-primary border-primary text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-white hover:border-slate-355"
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
                      localStorage.setItem("onboarding_completed", "true");
                      triggerToast("success", "Freelancer Profile Completed successfully! Published to SQL schema.");
                      setTimeout(() => {
                        setActiveTab("workspace");
                        if (typeof window !== "undefined") {
                          window.location.reload();
                        }
                      }, 1000);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4 shrink-0" />
                    <span>Complete Profile Setup</span>
                  </button>
                </div>
              </div>
            )}

            {/* CLIENT STEP 1: COMPANY BASICS */}
            {userRole === "client" && profileStep === 1 && (
              <div className="flex flex-col gap-5">
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
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
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
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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
                      localStorage.setItem("onboarding_completed", "true");
                      triggerToast("success", "Client Profile Completed successfully!");
                      setTimeout(() => {
                        setActiveTab("workspace");
                        if (typeof window !== "undefined") {
                          window.location.reload();
                        }
                      }, 1000);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4 shrink-0" />
                    <span>Complete Client Setup</span>
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
      <div className="xl:col-span-4 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
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
        </div>

        <button
          onClick={() => setActiveTab("workspace")}
          className="w-full text-center py-3 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer font-sans"
        >
          ← Back to Workspace Hub
        </button>
      </div>

      {/* RIGHT DISPLAY PANEL (8 cols) */}
      <div className="xl:col-span-8 flex flex-col gap-6 w-full">
        <div className="bg-white border border-slate-200/85 rounded-2xl p-6 sm:p-8 shadow-sm text-slate-800 animate-fadeIn min-h-[400px]">
          
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
              <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex items-center gap-4.5 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center font-black text-xl text-white shadow-sm shrink-0">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-850 leading-tight">{userName}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1 capitalize">Role: {userRole || "Freelancer"}</p>
                  <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                    SQL Verified Account <FiCheck className="w-3.5 h-3.5" />
                  </p>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="flex flex-col gap-4 mt-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Developer & Reset Options</h4>
                
                <div className="bg-amber-50/50 border border-amber-200/80 p-4.5 rounded-2xl text-xs flex gap-3.5 items-start">
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

                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => setClientSettingsStep(2)}
                          className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                        >
                          ← Previous Step
                        </button>
                        <button
                          onClick={async () => {
                            await handleSaveClientStepSettings(3);
                            triggerToast("success", "Client Company Profile saved successfully to DB!");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 justify-center">
                            Save Company Profile <FiCheck className="w-3.5 h-3.5" />
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
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Professional Title</label>
                          <input
                            type="text"
                            value={profileBasics.professional_title || ""}
                            onChange={(e) => setProfileBasics({ ...profileBasics, professional_title: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Experience Level</label>
                          <CustomSelect
                            value={profileBasics.experience_level || "Expert"}
                            onChange={(val) => setProfileBasics({ ...profileBasics, experience_level: val })}
                            options={[
                              { value: "Entry", label: "Entry (Beginner)" },
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
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Resume Link (PDF)</label>
                          <input
                            type="url"
                            placeholder="https://drive.google.com/..."
                            value={profileBasics.resume_url || ""}
                            onChange={(e) => setProfileBasics({ ...profileBasics, resume_url: e.target.value })}
                            className="bg-slate-50 border border-slate-250 hover:border-slate-355 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium"
                          />
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
                                    {exp.start_date} to {exp.currently_working ? "Present" : exp.end_date}
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
                      <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-4">
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
                          className="bg-[#0a5a54]/10 text-primary border border-primary/20 hover:bg-[#0a5a54]/25 px-4 py-2 rounded-xl text-xxs font-black self-start cursor-pointer transition-all flex items-center gap-1"
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
                      <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-4">
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
                          className="bg-[#0a5a54]/10 text-primary border border-primary/20 hover:bg-[#0a5a54]/25 px-4 py-2 rounded-xl text-xxs font-black self-start cursor-pointer transition-all flex items-center gap-1"
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
                      <div className="bg-slate-50/50 border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-4">
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
                          className="bg-[#0a5a54]/10 text-primary border border-primary/20 hover:bg-[#0a5a54]/25 px-4 py-2 rounded-xl text-xxs font-black self-start cursor-pointer transition-all flex items-center gap-1"
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
                              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                                isSelected
                                  ? "bg-primary border-primary text-white shadow-sm"
                                  : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-white hover:border-slate-355"
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
