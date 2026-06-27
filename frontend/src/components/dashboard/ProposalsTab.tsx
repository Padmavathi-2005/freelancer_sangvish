import React from "react";
import { FiCheck } from "react-icons/fi";
import CustomSelect from "../CustomSelect";
import ProjectMilestoneTracker from "./ProjectMilestoneTracker";

interface ProposalsTabProps {
  userRole: string | null;
  isCreatingJob: boolean;
  setIsCreatingJob: (val: boolean) => void;
  postJobTitle: string;
  setPostJobTitle: (val: string) => void;
  postJobBudget: number;
  setPostJobBudget: (val: number) => void;
  postJobCategoryId: string;
  setPostJobCategoryId: (val: string) => void;
  handlePostJobCategoryChange: (val: string) => Promise<void>;
  postJobSubCategoryId: string;
  setPostJobSubCategoryId: (val: string) => void;
  handlePostJobSubCategoryChange: (val: string) => Promise<void>;
  postJobSubCategories: any[];
  postJobDescription: string;
  setPostJobDescription: (val: string) => void;
  postJobExpLevel: string;
  setPostJobExpLevel: (val: string) => void;
  postJobStep: number;
  setPostJobStep: (val: number) => void;
  postJobType: string;
  setPostJobType: (val: string) => void;
  postJobMilestoneType: string;
  setPostJobMilestoneType: (val: string) => void;
  postJobMinBudget: number;
  setPostJobMinBudget: (val: number) => void;
  postJobMaxBudget: number;
  setPostJobMaxBudget: (val: number) => void;
  postJobDuration: string;
  setPostJobDuration: (val: string) => void;
  postJobLocation: string;
  setPostJobLocation: (val: string) => void;
  postJobNumFreelancers: string;
  setPostJobNumFreelancers: (val: string) => void;
  postJobAvailableSkills: any[];
  postJobSelectedSkills: number[];
  setPostJobSelectedSkills: (val: number[]) => void;
  handlePostJobToggleSkill: (id: number) => void;
  postJobAvailableLanguages: any[];
  postJobSelectedLanguages: number[];
  setPostJobSelectedLanguages: (val: number[]) => void;
  handlePostJobToggleLanguage: (id: number) => void;
  postJobMaxHours: number;
  setPostJobMaxHours: (val: number) => void;
  postJobPaymentMode: string;
  setPostJobPaymentMode: (val: string) => void;
  clientJobs: any[];
  loadingClientJobs: boolean;
  fetchClientJobs: () => Promise<void>;
  selectedProjectDetails: any | null;
  setSelectedProjectDetails: (details: any) => void;
  projectProposals: any[];
  loadingProjectProposals: boolean;
  handleUpdateProposalStatus: (proposalId: number, status: "Accepted" | "Declined", jobId: number) => Promise<void>;
  setSelectedFreelancerProfile: (profile: any) => void;
  freelancerProposals: any[];
  loadingFreelancerProposals: boolean;
  fetchFreelancerProposals: () => Promise<void>;
  gigCategories: any[];
  triggerToast: any;
  setActiveTab: (tab: any) => void;
  editingDraftJobId: number | null;
  setEditingDraftJobId: (val: number | null) => void;
}

export default function ProposalsTab({
  userRole,
  isCreatingJob,
  setIsCreatingJob,
  postJobTitle,
  setPostJobTitle,
  postJobBudget,
  setPostJobBudget,
  postJobCategoryId,
  setPostJobCategoryId,
  handlePostJobCategoryChange,
  postJobSubCategoryId,
  setPostJobSubCategoryId,
  handlePostJobSubCategoryChange,
  postJobSubCategories,
  postJobDescription,
  setPostJobDescription,
  postJobExpLevel,
  setPostJobExpLevel,
  postJobStep,
  setPostJobStep,
  postJobType,
  setPostJobType,
  postJobMilestoneType,
  setPostJobMilestoneType,
  postJobMinBudget,
  setPostJobMinBudget,
  postJobMaxBudget,
  setPostJobMaxBudget,
  postJobDuration,
  setPostJobDuration,
  postJobLocation,
  setPostJobLocation,
  postJobNumFreelancers,
  setPostJobNumFreelancers,
  postJobAvailableSkills,
  postJobSelectedSkills,
  handlePostJobToggleSkill,
  postJobAvailableLanguages,
  postJobSelectedLanguages,
  handlePostJobToggleLanguage,
  postJobMaxHours,
  setPostJobMaxHours,
  postJobPaymentMode,
  setPostJobPaymentMode,
  clientJobs,
  loadingClientJobs,
  fetchClientJobs,
  selectedProjectDetails,
  setSelectedProjectDetails,
  projectProposals,
  loadingProjectProposals,
  handleUpdateProposalStatus,
  setSelectedFreelancerProfile,
  freelancerProposals,
  loadingFreelancerProposals,
  fetchFreelancerProposals,
  gigCategories,
  triggerToast,
  setActiveTab,
  editingDraftJobId,
  setEditingDraftJobId,
  setPostJobSelectedSkills,
  setPostJobSelectedLanguages,
}: ProposalsTabProps) {
  const resetWizardState = () => {
    setPostJobTitle("");
    setPostJobBudget(2500);
    setPostJobCategoryId("");
    setPostJobSubCategoryId("");
    setPostJobStep(1);
    setPostJobType("Fixed");
    setPostJobMilestoneType("Both");
    setPostJobMinBudget(100);
    setPostJobMaxBudget(1000);
    setPostJobDuration("1-3 months");
    setPostJobLocation("Remote");
    setPostJobNumFreelancers("1 freelancer");
    setPostJobSelectedSkills([]);
    setPostJobSelectedLanguages([]);
    setPostJobExpLevel("Intermediate");
    setPostJobMaxHours(40);
    setPostJobPaymentMode("Weekly");
    setEditingDraftJobId(null);
    setIsCreatingJob(false);
  };

  const handleResumeDraft = async (job: any) => {
    setIsCreatingJob(true);
    setEditingDraftJobId(job.job_id);
    setPostJobStep(1);

    // Fill simple fields
    setPostJobTitle(job.title || "");
    setPostJobDescription(job.description || "");
    setPostJobType(job.project_type || "Fixed");
    setPostJobMilestoneType(job.milestone_type || "Both");
    setPostJobMinBudget(job.min_budget ? parseFloat(job.min_budget) : 100);
    setPostJobMaxBudget(job.max_budget ? parseFloat(job.max_budget) : 1000);
    setPostJobDuration(job.duration || "1-3 months");
    setPostJobLocation(job.location || "Remote");
    setPostJobNumFreelancers(job.num_freelancers || "1 freelancer");
    setPostJobExpLevel(job.experience_level || "Intermediate");
    setPostJobMaxHours(job.max_hours || 40);
    setPostJobPaymentMode(job.payment_mode || "Weekly");

    // Load category and subcategories
    if (job.category_id) {
      const catIdStr = job.category_id.toString();
      await handlePostJobCategoryChange(catIdStr);
      
      if (job.sub_category_id) {
        const subCatIdStr = job.sub_category_id.toString();
        await handlePostJobSubCategoryChange(subCatIdStr);
        setPostJobSubCategoryId(subCatIdStr);
      }
    } else {
      setPostJobCategoryId("");
      setPostJobSubCategoryId("");
    }

    // Load skills and languages
    if (job.skills && Array.isArray(job.skills)) {
      const skillIds = job.skills.map((s: any) => typeof s === "object" ? s.skill_id : s).filter(Boolean);
      setPostJobSelectedSkills(skillIds);
    } else {
      setPostJobSelectedSkills([]);
    }

    if (job.languages && Array.isArray(job.languages)) {
      const langIds = job.languages.map((l: any) => typeof l === "object" ? l.language_id : l).filter(Boolean);
      setPostJobSelectedLanguages(langIds);
    } else {
      setPostJobSelectedLanguages([]);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Map skills and languages to self-contained objects for storage
      const payloadSkills = postJobSelectedSkills.map(id => {
        const s = postJobAvailableSkills.find(x => x.skill_id === id);
        return s ? { skill_id: s.skill_id, skill_name: s.skill_name } : null;
      }).filter(Boolean);

      const payloadLanguages = postJobSelectedLanguages.map(id => {
        const l = postJobAvailableLanguages.find(x => x.language_id === id);
        return l ? { language_id: l.language_id, language_name: l.language_name } : null;
      }).filter(Boolean);

      const url = editingDraftJobId
        ? `http://localhost:5000/api/jobs/${editingDraftJobId}`
        : "http://localhost:5000/api/jobs";
      const method = editingDraftJobId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: postJobTitle || "Untitled Project Draft",
          description: postJobDescription || "",
          budget: postJobMaxBudget,
          experience_level: postJobExpLevel,
          category_id: postJobCategoryId ? parseInt(postJobCategoryId) : null,
          sub_category_id: postJobSubCategoryId ? parseInt(postJobSubCategoryId) : null,
          project_type: postJobType,
          milestone_type: postJobMilestoneType,
          min_budget: postJobMinBudget,
          max_budget: postJobMaxBudget,
          duration: postJobDuration,
          location: postJobLocation,
          num_freelancers: postJobNumFreelancers,
          skills: payloadSkills,
          languages: payloadLanguages,
          max_hours: postJobType === "Hourly" ? postJobMaxHours : null,
          payment_mode: postJobType === "Hourly" ? postJobPaymentMode : null,
          status: "Draft"
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Project draft saved successfully!", `Title: ${postJobTitle || "Untitled Project Draft"}`);
        resetWizardState();
        fetchClientJobs();
      } else {
        triggerToast("error", data.message || "Failed to save draft.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "An error occurred while saving draft.");
    }
  };

  if (userRole === "client") {
    if (isCreatingJob) {
      return (
        <div className="relative z-10 max-w-2xl mx-auto w-full animate-fadeIn text-slate-800 text-left">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            
            {/* Form Header */}
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base shrink-0">
                  <i className="fa-solid fa-file-signature text-primary"></i>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Post a New Project</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Describe your requirements to receive bids from elite freelancers.</p>
                </div>
              </div>
              <button
                onClick={resetWizardState}
                className="text-slate-550 hover:text-slate-750 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  postJobStep === 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  1
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${postJobStep === 1 ? "text-slate-800 font-extrabold" : "text-slate-400 font-semibold"}`}>
                  Tell us about your project
                </span>
              </div>
              <div className="flex-grow h-0.5 bg-slate-200 mx-4 max-w-[60px]" />
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  postJobStep === 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  2
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${postJobStep === 2 ? "text-slate-800 font-extrabold" : "text-slate-400 font-semibold"}`}>
                  Skills & Preferences
                </span>
              </div>
            </div>

            {/* Form fields */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (postJobStep === 1) {
                  if (!postJobTitle.trim() || !postJobDescription.trim()) {
                    triggerToast("error", "Title and description are required.");
                    return;
                  }
                  if (!postJobCategoryId) {
                    triggerToast("error", "Category is required.");
                    return;
                  }
                  if (postJobMaxBudget <= 0 || postJobMinBudget <= 0) {
                    triggerToast("error", "Budgets must be positive values.");
                    return;
                  }
                  if (postJobMaxBudget < postJobMinBudget) {
                    triggerToast("error", "Maximum budget must be greater than or equal to minimum budget.");
                    return;
                  }
                  setPostJobStep(2);
                } else {
                  // Submit Step 2 (Publish)
                  try {
                    const token = localStorage.getItem("token");
                    // Map skills and languages to self-contained name objects for display
                    const payloadSkills = postJobSelectedSkills.map(id => {
                      const s = postJobAvailableSkills.find(x => x.skill_id === id);
                      return s ? { skill_id: s.skill_id, skill_name: s.skill_name } : null;
                    }).filter(Boolean);

                    const payloadLanguages = postJobSelectedLanguages.map(id => {
                      const l = postJobAvailableLanguages.find(x => x.language_id === id);
                      return l ? { language_id: l.language_id, language_name: l.language_name } : null;
                    }).filter(Boolean);

                    const url = editingDraftJobId
                      ? `http://localhost:5000/api/jobs/${editingDraftJobId}`
                      : "http://localhost:5000/api/jobs";
                    const method = editingDraftJobId ? "PUT" : "POST";

                    const res = await fetch(url, {
                      method: method,
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        title: postJobTitle,
                        description: postJobDescription,
                        budget: postJobMaxBudget,
                        experience_level: postJobExpLevel,
                        category_id: postJobCategoryId ? parseInt(postJobCategoryId) : null,
                        sub_category_id: postJobSubCategoryId ? parseInt(postJobSubCategoryId) : null,
                        project_type: postJobType,
                        milestone_type: postJobMilestoneType,
                        min_budget: postJobMinBudget,
                        max_budget: postJobMaxBudget,
                        duration: postJobDuration,
                        location: postJobLocation,
                        num_freelancers: postJobNumFreelancers,
                        skills: payloadSkills,
                        languages: payloadLanguages,
                        max_hours: postJobType === "Hourly" ? postJobMaxHours : null,
                        payment_mode: postJobType === "Hourly" ? postJobPaymentMode : null,
                        status: "Open"
                      })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      const messageVerb = editingDraftJobId ? "published" : "posted";
                      triggerToast("success", `Project "${postJobTitle}" ${messageVerb} to LancerFlow Network!`, `Budget: $${postJobMinBudget} - $${postJobMaxBudget} | ${postJobLocation}`);
                      resetWizardState();
                      fetchClientJobs();
                    } else {
                      triggerToast("error", data.message || "Failed to publish project.");
                    }
                  } catch (err) {
                    console.error(err);
                    triggerToast("error", "An error occurred while publishing project.");
                  }
                }
              }}
              className="flex flex-col gap-5"
            >
              {postJobStep === 1 && (
                <>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Next.js SaaS Platform Development"
                      value={postJobTitle}
                      onChange={(e) => setPostJobTitle(e.target.value)}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Type *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPostJobType("Fixed")}
                        className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                          postJobType === "Fixed"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-slate-200 hover:border-slate-350 bg-white"
                        }`}
                      >
                        <i className={`fa-solid fa-lock text-base ${postJobType === "Fixed" ? "text-primary" : "text-slate-400"}`}></i>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Fixed Budget</p>
                          <p className="text-[10px] text-slate-400">Pay a fixed price for agreed deliverables.</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostJobType("Hourly")}
                        className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                          postJobType === "Hourly"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-slate-200 hover:border-slate-355 bg-white"
                        }`}
                      >
                        <i className={`fa-solid fa-clock text-base ${postJobType === "Hourly" ? "text-primary" : "text-slate-400"}`}></i>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Hourly Rate</p>
                          <p className="text-[10px] text-slate-400">Pay for hours logged on a periodic basis.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {postJobType === "Fixed" && (
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Which milestones structure you want to select? *</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "Fixed", label: "Fixed budget", desc: "Pay all at once" },
                          { value: "Milestone", label: "Milestone wise", desc: "Pay in segments" },
                          { value: "Both", label: "Both options", desc: "Decide later" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPostJobMilestoneType(opt.value)}
                            className={`p-3 rounded-xl border text-center flex flex-col gap-0.5 transition-all cursor-pointer ${
                              postJobMilestoneType === opt.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-slate-200 hover:border-slate-350 bg-white"
                            }`}
                          >
                            <span className="text-[11px] font-bold text-slate-800">{opt.label}</span>
                            <span className="text-[9px] text-slate-400">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {postJobType === "Hourly" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Maximum Hours Per Week *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 40"
                          value={postJobMaxHours}
                          onChange={(e) => setPostJobMaxHours(Number(e.target.value))}
                          className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Payment Mode *</label>
                        <CustomSelect
                          value={postJobPaymentMode}
                          onChange={(val) => setPostJobPaymentMode(val)}
                          options={[
                            { value: "Daily", label: "Daily" },
                            { value: "Weekly", label: "Weekly" },
                            { value: "Monthly", label: "Monthly" },
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Minimum Budget (USD) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 500"
                        value={postJobMinBudget}
                        onChange={(e) => setPostJobMinBudget(Number(e.target.value))}
                        className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Maximum Budget (USD) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 5000"
                        value={postJobMaxBudget}
                        onChange={(e) => setPostJobMaxBudget(Number(e.target.value))}
                        className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Category *</label>
                      <CustomSelect
                        value={postJobCategoryId}
                        onChange={(val) => handlePostJobCategoryChange(val)}
                        placeholder="Select Category"
                        options={gigCategories.map((c) => ({ value: c.category_id.toString(), label: c.category_name }))}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Sub-category</label>
                      <CustomSelect
                        value={postJobSubCategoryId}
                        onChange={(val) => handlePostJobSubCategoryChange(val)}
                        placeholder="Select Sub-category"
                        options={postJobSubCategories.map((sc) => ({ value: sc.sub_category_id.toString(), label: sc.sub_category_name }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Duration</label>
                      <CustomSelect
                        value={postJobDuration}
                        onChange={(val) => setPostJobDuration(val)}
                        options={[
                          { value: "Less than 1 month", label: "Less than 1 month" },
                          { value: "1-3 months", label: "1-3 months" },
                          { value: "3-6 months", label: "3-6 months" },
                          { value: "More than 6 months", label: "More than 6 months" },
                        ]}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Location preference</label>
                      <CustomSelect
                        value={postJobLocation}
                        onChange={(val) => setPostJobLocation(val)}
                        options={[
                          { value: "Remote", label: "Remote" },
                          { value: "Onsite", label: "Onsite" },
                          { value: "Partially Remote", label: "Partially Remote" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Description *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Outline clear deliverables, timeline, required technologies, and scope of work..."
                      value={postJobDescription}
                      onChange={(e) => setPostJobDescription(e.target.value)}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-medium resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={resetWizardState}
                      className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAsDraft}
                      className="px-5 py-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/60 text-amber-700 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-floppy-disk text-[10px]"></i>
                      <span>Save as Draft</span>
                    </button>
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Save & continue</span>
                      <span className="text-xxs">→</span>
                    </button>
                  </div>
                </>
              )}

              {postJobStep === 2 && (
                <>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">How many freelancers do you need for this job?</label>
                    <CustomSelect
                      value={postJobNumFreelancers}
                      onChange={(val) => setPostJobNumFreelancers(val)}
                      options={[
                        { value: "1 freelancer", label: "1 freelancer" },
                        { value: "2-3 freelancers", label: "2-3 freelancers" },
                        { value: "4+ freelancers", label: "4+ freelancers" },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Expertise Level Required</label>
                    <CustomSelect
                      value={postJobExpLevel}
                      onChange={(val) => setPostJobExpLevel(val)}
                      options={[
                        { value: "Entry", label: "Entry (Beginner)" },
                        { value: "Intermediate", label: "Intermediate (Mid-level)" },
                        { value: "Expert", label: "Expert (Senior)" },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Required Skills</label>
                    {postJobAvailableSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        {postJobAvailableSkills.map((skill) => {
                          const isChecked = postJobSelectedSkills.includes(skill.skill_id);
                          return (
                            <button
                              type="button"
                              key={skill.skill_id}
                              onClick={() => handlePostJobToggleSkill(skill.skill_id)}
                              className={`px-3 py-1.5 rounded-lg text-xxs font-extrabold transition-all border cursor-pointer select-none ${
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "bg-white border-slate-205 text-slate-600 hover:border-slate-350"
                              }`}
                            >
                              {skill.skill_name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        No skills available for the selected subcategory. Go back and select a category/subcategory if needed.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Required Languages</label>
                    {postJobAvailableLanguages.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        {postJobAvailableLanguages.map((lang) => {
                          const isChecked = postJobSelectedLanguages.includes(lang.language_id);
                          return (
                            <button
                              type="button"
                              key={lang.language_id}
                              onClick={() => handlePostJobToggleLanguage(lang.language_id)}
                              className={`px-3 py-1.5 rounded-lg text-xxs font-extrabold transition-all border cursor-pointer select-none ${
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "bg-white border-slate-205 text-slate-600 hover:border-slate-350"
                              }`}
                            >
                              {lang.language_name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                        Loading available languages...
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setPostJobStep(1)}
                      className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="text-xxs">←</span>
                      <span>Back to Step 1</span>
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={resetWizardState}
                        className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAsDraft}
                        className="px-5 py-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/60 text-amber-700 font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <i className="fa-solid fa-floppy-disk text-[10px]"></i>
                        <span>Save as Draft</span>
                      </button>
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>{editingDraftJobId ? "Publish Project" : "Post Project to Network"}</span>
                        <FiCheck className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      );
    }

    if (selectedProjectDetails) {
      return (
        <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-800">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <button
                onClick={() => setSelectedProjectDetails(null)}
                className="text-slate-550 hover:text-slate-800 text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60 mb-2.5 inline-flex items-center gap-1.5"
              >
                ← Back to Projects
              </button>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                📁 {selectedProjectDetails.title}
              </h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold">Project overview, milestones tracking, and candidate bids.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
            <h3 className="text-sm font-extrabold text-slate-855 border-b border-slate-100 pb-2">Project Overview</h3>
            <p className="text-slate-600 text-xs font-medium leading-relaxed">{selectedProjectDetails.description}</p>
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 mt-2 text-slate-500 text-xxs font-bold uppercase tracking-wide">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-wallet text-slate-400"></i>
                <span>Budget: <strong className="text-slate-700">
                  {selectedProjectDetails.min_budget && selectedProjectDetails.max_budget 
                    ? `$${parseFloat(selectedProjectDetails.min_budget).toLocaleString()} - $${parseFloat(selectedProjectDetails.max_budget).toLocaleString()}`
                    : `$${parseFloat(selectedProjectDetails.budget).toLocaleString()}`}
                  {selectedProjectDetails.project_type === "Hourly" ? " / hr" : ""}
                </strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-graduation-cap text-slate-400"></i>
                <span>Experience Required: <strong className="text-slate-700">{selectedProjectDetails.experience_level}</strong></span>
              </div>
              {selectedProjectDetails.duration && (
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-calendar text-slate-400"></i>
                  <span>Duration: <strong className="text-slate-700">{selectedProjectDetails.duration}</strong></span>
                </div>
              )}
              {selectedProjectDetails.location && (
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-slate-400"></i>
                  <span>Location: <strong className="text-slate-700">{selectedProjectDetails.location}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
            <h3 className="text-sm font-extrabold text-slate-855 border-b border-slate-100 pb-2">Milestone & Delivery Tracker</h3>
            <ProjectMilestoneTracker
              job={selectedProjectDetails}
              onUpdateJob={(updatedJob) => {
                setSelectedProjectDetails(updatedJob);
              }}
              triggerToast={triggerToast}
              setSelectedFreelancerProfile={setSelectedFreelancerProfile}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-850">
        {/* Header with Post button */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-folder-open text-primary"></i> My Posted Projects
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Track and manage the project proposals you posted for bidding.</p>
          </div>
          <button
            onClick={() => setIsCreatingJob(true)}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Post a New Project
          </button>
        </div>

        {/* Listings */}
        {loadingClientJobs ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
            <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-semibold">Loading your projects...</p>
          </div>
        ) : clientJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-2xl p-8 shadow-inner gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-1">No projects posted yet</h3>
              <p className="text-slate-400 text-xs max-w-sm font-semibold">Post a project to describe your requirements and hire elite freelancers.</p>
            </div>
            <button
              onClick={() => setIsCreatingJob(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer mt-2"
            >
              <i className="fa-solid fa-plus mr-1"></i> Post Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {clientJobs.map((job) => (
              <div key={job.job_id} className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden ${
                job.status === "Draft"
                  ? "border-amber-200/70 hover:border-amber-300"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}>
                <div className={`absolute top-0 left-0 w-full h-1 opacity-80 ${
                  job.status === "Draft"
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-primary to-cyan-500"
                }`} />
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1 cursor-pointer text-left" onClick={() => job.status === "Draft" ? handleResumeDraft(job) : setSelectedProjectDetails(job)}>
                    <h3 className="text-sm font-extrabold text-slate-850 hover:text-primary transition-colors">{job.title}</h3>
                    <span className="text-slate-400 text-[10px] font-bold">
                      Posted on {new Date(job.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black bg-cyan-50 text-cyan-700 border border-cyan-150 px-2 py-0.5 rounded uppercase tracking-wider">
                      {job.category_name || "Project"}
                    </span>
                    {job.project_type && (
                      <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded uppercase tracking-wider">
                        {job.project_type}
                      </span>
                    )}
                    {job.location && (
                      <span className="text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-150 px-2 py-0.5 rounded uppercase tracking-wider">
                        {job.location}
                      </span>
                    )}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      job.status === "Draft"
                        ? "bg-amber-50 text-amber-700 border border-amber-205"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-150"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">{job.description || <span className="italic text-slate-400">No description provided yet.</span>}</p>
                {(job.skills || job.languages) && (
                  <div className="flex flex-col gap-2 pt-2 mt-1">
                    {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center justify-start">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Skills:</span>
                        {job.skills.map((skill: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[10px] font-bold"
                          >
                            {skill.skill_name || skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-2">
                  <div className="flex flex-wrap items-center gap-6 text-slate-555 text-xxs font-bold uppercase tracking-wide">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-wallet text-slate-400"></i>
                      <span>Budget: <strong className="text-slate-700">
                        {job.min_budget && job.max_budget 
                          ? `$${parseFloat(job.min_budget).toLocaleString()} - $${parseFloat(job.max_budget).toLocaleString()}`
                          : `$${parseFloat(job.budget).toLocaleString()}`}
                        {job.project_type === "Hourly" ? " / hr" : ""}
                      </strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-graduation-cap text-slate-400"></i>
                      <span>Experience Required: <strong className="text-slate-700">{job.experience_level}</strong></span>
                    </div>
                  </div>
                  {job.status === "Draft" && (
                    <button
                      onClick={() => handleResumeDraft(job)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Resume Draft</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-paper-plane text-primary"></i> My Submitted Proposals
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Track and manage the status of your bids on active client projects.</p>
        </div>
        <button
          onClick={() => setActiveTab("find_work")}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
        >
          <i className="fa-solid fa-magnifying-glass"></i> Find Projects
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Submitted",
            value: freelancerProposals.length,
            color: "from-blue-500 to-indigo-500",
            icon: "fa-paper-plane"
          },
          {
            label: "Accepted Offers",
            value: freelancerProposals.filter((p) => p.status === "Accepted").length,
            color: "from-emerald-500 to-teal-500",
            icon: "fa-circle-check"
          },
          {
            label: "Pending Review",
            value: freelancerProposals.filter((p) => p.status === "Pending").length,
            color: "from-amber-500 to-orange-500",
            icon: "fa-clock"
          },
          {
            label: "Declined",
            value: freelancerProposals.filter((p) => p.status === "Declined").length,
            color: "from-rose-500 to-pink-500",
            icon: "fa-circle-xmark"
          }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{stat.label}</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center text-sm shadow-sm`}>
              <i className={`fa-solid ${stat.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Proposals list */}
      {loadingFreelancerProposals ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Loading your proposals...</p>
        </div>
      ) : freelancerProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-2xl p-8 shadow-inner gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
            <i className="fa-solid fa-paper-plane"></i>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">No proposals submitted yet</h3>
            <p className="text-slate-400 text-xs max-w-sm font-semibold">Submit proposals to active client projects to kickstart your freelance projects.</p>
          </div>
          <button
            onClick={() => setActiveTab("find_work")}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer mt-2"
          >
            Find Work Now
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {freelancerProposals.map((proposal) => (
            <div key={proposal.proposal_id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${
                proposal.status === "Accepted"
                  ? "bg-emerald-500"
                  : proposal.status === "Declined"
                    ? "bg-rose-500"
                    : "bg-amber-500"
              }`} />
              
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850">{proposal.job_title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-[10px] font-bold">
                      Client: <strong>{proposal.client_company_name || proposal.client_name}</strong> ({proposal.client_email})
                    </span>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="text-slate-400 text-[10px] font-bold">
                      Submitted on {new Date(proposal.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div>
                  <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase tracking-wider ${
                    proposal.status === "Accepted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                      : proposal.status === "Declined"
                        ? "bg-rose-50 text-rose-700 border-rose-150"
                        : "bg-amber-50 text-amber-700 border-amber-150"
                  }`}>
                    {proposal.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Cover Letter</span>
                <p className="text-slate-600 text-xs font-medium leading-relaxed whitespace-pre-line">{proposal.cover_letter}</p>
              </div>

              {proposal.milestones && Array.isArray(proposal.milestones) && proposal.milestones.length > 0 && (
                <div className="bg-slate-100/50 border border-slate-200/50 rounded-xl p-4 flex flex-col gap-2.5">
                  <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Your Proposed Milestones ({proposal.milestones.length})</span>
                  <div className="flex flex-col gap-2">
                    {proposal.milestones.map((m: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xxs font-bold text-slate-700 bg-white border border-slate-150 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-extrabold text-slate-500 shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate text-slate-800 font-medium">{m.title}</span>
                        </div>
                        <span className="font-extrabold text-primary shrink-0">${parseFloat(m.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-slate-505 text-xxs font-bold uppercase tracking-wide">
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-wallet text-slate-400"></i>
                  <span>Your Bid: <strong className="text-slate-700">${parseFloat(proposal.bid_amount).toLocaleString()}</strong></span>
                  <span className="text-slate-400">(Job Budget: ${parseFloat(proposal.job_budget).toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-clock text-slate-400"></i>
                  <span>Timeline: <strong className="text-slate-700">{proposal.delivery_days} days</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
