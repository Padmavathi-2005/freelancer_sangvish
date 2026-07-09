import { API_URL } from "@/config/api";
import React, { useState, useMemo, useEffect } from "react";
import { FiCheck } from "react-icons/fi";
import CustomSelect from "../CustomSelect";
import ProjectMilestoneTracker from "./ProjectMilestoneTracker";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { initSocket } from "@/utils/socket";

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
  const { pendingInviteFreelancer, setPendingInviteFreelancer } = useDashboard();
  const [selectedProposalDetails, setSelectedProposalDetails] = useState<any | null>(null);
  const [projectFilter, setProjectFilter] = useState<"all" | "pending" | "ongoing" | "dispute" | "completed" | "draft">("all");
  const [freelancerFilter, setFreelancerFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");

  const filteredFreelancerProposals = useMemo(() => {
    return freelancerProposals.filter((proposal) => {
      const contractStatus = proposal.contract_status;
      if (freelancerFilter === "pending") {
        return proposal.status === "Pending";
      }
      if (freelancerFilter === "accepted") {
        return (
          proposal.status === "Accepted" ||
          proposal.status === "Accepted_By_Freelancer" ||
          contractStatus === "Hired" ||
          contractStatus === "Work Started" ||
          contractStatus === "Completed"
        );
      }
      if (freelancerFilter === "declined") {
        return (
          proposal.status === "Declined" ||
          proposal.status === "Cancelled" ||
          contractStatus === "Cancelled"
        );
      }
      return true;
    });
  }, [freelancerProposals, freelancerFilter]);
  const [postJobSlug, setPostJobSlug] = useState("");
  const [postJobSeoTitle, setPostJobSeoTitle] = useState("");
  const [postJobSeoDescription, setPostJobSeoDescription] = useState("");
  const [postJobSeoImage, setPostJobSeoImage] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugValidating, setSlugValidating] = useState(false);
  const [uploadingSeoImage, setUploadingSeoImage] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const slugifyText = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Upload failed");
    }
    const data = await res.json();
    return data.url;
  };

  const handleSeoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingSeoImage(true);
      const url = await uploadFile(e.target.files[0]);
      setPostJobSeoImage(url);
      triggerToast("success", "SEO social preview image uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload SEO image");
    } finally {
      setUploadingSeoImage(false);
    }
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingDraftJobId && !isSlugManuallyEdited) {
      setPostJobSlug(slugifyText(postJobTitle));
    }
  }, [postJobTitle, isSlugManuallyEdited, editingDraftJobId]);

  // Validate project slug availability (with debouncing)
  useEffect(() => {
    if (!postJobSlug.trim()) {
      setSlugAvailable(null);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setSlugValidating(true);
        const res = await fetch(`${API_URL}/jobs/validate-slug?slug=${encodeURIComponent(postJobSlug)}&excludeJobId=${editingDraftJobId || ""}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSlugAvailable(data.available);
        }
      } catch (err) {
        console.error("Error validating project slug", err);
      } finally {
        setSlugValidating(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [postJobSlug, editingDraftJobId]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      if (user && user.user_id) {
        const socket = initSocket(user.user_id);
        
        const handleStatusUpdate = (payload: any) => {
          console.log("⚡ Real-time proposal status update:", payload);
          if (userRole === "client") {
            fetchClientJobs();
          } else {
            fetchFreelancerProposals();
          }
        };

        socket.on("proposal_status_updated", handleStatusUpdate);
        
        return () => {
          socket.off("proposal_status_updated", handleStatusUpdate);
        };
      }
    } catch (e) {
      console.error("Socket listener init in ProposalsTab failed:", e);
    }
  }, [userRole]);

  const filteredJobs = useMemo(() => {
    return clientJobs.filter((job) => {
      const cStatus = job.contract_status?.toLowerCase();
      const jStatus = job.status?.toLowerCase();
      
      if (projectFilter === "draft") {
        return jStatus === "draft";
      }
      if (projectFilter === "pending") {
        return cStatus === "pending" || jStatus === "pending";
      }
      if (projectFilter === "ongoing") {
        return cStatus === "in_progress" || cStatus === "in-progress" || cStatus === "active";
      }
      if (projectFilter === "dispute") {
        return cStatus === "disputed" || cStatus === "dispute" || jStatus === "disputed";
      }
      if (projectFilter === "completed") {
        return cStatus === "completed" || jStatus === "completed";
      }
      return true; // "all"
    });
  }, [clientJobs, projectFilter]);

  const resetWizardState = () => {
    setPostJobTitle("");
    setPostJobBudget(2500);
    setPostJobCategoryId("");
    setPostJobSubCategoryId("");
    setPostJobStep(1);
    setPostJobType("Fixed");
    setPostJobMilestoneType("Milestone");
    setPostJobMinBudget(100);
    setPostJobMaxBudget(1000);
    setPostJobDuration("1-3 months");
    setPostJobLocation("Remote");
    setPostJobNumFreelancers("1 freelancer");
    setPostJobSelectedSkills([]);
    setPostJobSelectedLanguages([]);
    setPostJobMaxHours(40);
    setPostJobPaymentMode("Weekly");
    setPostJobSlug("");
    setPostJobSeoTitle("");
    setPostJobSeoDescription("");
    setPostJobSeoImage("");
    setEditingDraftJobId(null);
    setIsCreatingJob(false);
    setIsSlugManuallyEdited(false);
  };

  const handleRespondDirectHire = async (proposalId: number, action: "Accept" | "Decline") => {
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase()} this direct hire offer?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/proposals/${proposalId}/respond-direct-hire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `Direct hire offer ${action.toLowerCase()}ed successfully!`);
        if (fetchFreelancerProposals) fetchFreelancerProposals();
      } else {
        triggerToast("error", data.message || "Failed to respond to direct hire offer.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to respond.");
    }
  };

  const handleResumeDraft = async (job: any) => {
    setIsCreatingJob(true);
    setEditingDraftJobId(job.job_id);
    setPostJobStep(1);

    // Fill simple fields
    setPostJobTitle(job.title || "");
    setPostJobDescription(job.description || "");
    setPostJobType(job.project_type || "Fixed");
    setPostJobMilestoneType(job.milestone_type || "Milestone");
    setPostJobMinBudget(job.min_budget ? parseFloat(job.min_budget) : 100);
    setPostJobMaxBudget(job.max_budget ? parseFloat(job.max_budget) : 1000);
    setPostJobDuration(job.duration || "1-3 months");
    setPostJobLocation(job.location || "Remote");
    setPostJobNumFreelancers(job.num_freelancers || "1 freelancer");
    setPostJobExpLevel(job.experience_level || "Intermediate");
    setPostJobMaxHours(job.max_hours || 40);
    setPostJobPaymentMode(job.payment_mode || "Weekly");
    setPostJobSlug(job.slug || "");
    setIsSlugManuallyEdited(true);
    const jobSeo = typeof job.seo === "string" ? JSON.parse(job.seo) : job.seo;
    setPostJobSeoTitle(jobSeo?.title || "");
    setPostJobSeoDescription(jobSeo?.description || "");
    setPostJobSeoImage(jobSeo?.image || "");

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
        ? `${API_URL}/jobs/${editingDraftJobId}`
        : `${API_URL}/jobs`;
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
          slug: postJobSlug.trim(),
          seo: {
            title: postJobSeoTitle.trim(),
            description: postJobSeoDescription.trim(),
            image: postJobSeoImage.trim()
          },
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
               <button
                 type="button"
                 onClick={() => setPostJobStep(1)}
                 className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition bg-transparent border-0 p-0 outline-none"
               >
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                   postJobStep === 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                 }`}>
                   1
                 </div>
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${postJobStep === 1 ? "text-slate-800 font-extrabold" : "text-slate-400 font-semibold"}`}>
                   Tell us about your project
                 </span>
               </button>
               
               <div className="flex-grow h-0.5 bg-slate-200 mx-3 max-w-[40px]" />
               
               <button
                 type="button"
                 onClick={() => setPostJobStep(2)}
                 className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition bg-transparent border-0 p-0 outline-none"
               >
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                   postJobStep === 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                 }`}>
                   2
                 </div>
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${postJobStep === 2 ? "text-slate-800 font-extrabold" : "text-slate-400 font-semibold"}`}>
                   Skills & Preferences
                 </span>
               </button>

               <div className="flex-grow h-0.5 bg-slate-200 mx-3 max-w-[40px]" />
               
               <button
                 type="button"
                 onClick={() => setPostJobStep(3)}
                 className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition bg-transparent border-0 p-0 outline-none"
               >
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                   postJobStep === 3 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                 }`}>
                   3
                 </div>
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${postJobStep === 3 ? "text-slate-800 font-extrabold" : "text-slate-400 font-semibold"}`}>
                   URL Slug & SEO
                 </span>
               </button>
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
                } else if (postJobStep === 2) {
                  setPostJobStep(3);
                } else {
                  // Submit Step 3 (Publish)
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
                      ? `${API_URL}/jobs/${editingDraftJobId}`
                      : `${API_URL}/jobs`;
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
                        slug: postJobSlug.trim(),
                        seo: {
                          title: postJobSeoTitle.trim(),
                          description: postJobSeoDescription.trim(),
                          image: postJobSeoImage.trim()
                        },
                        status: "Open"
                      })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      const messageVerb = editingDraftJobId ? "published" : "posted";
                      triggerToast("success", `Project "${postJobTitle}" ${messageVerb} to LancerFlow Network!`, `Budget: $${postJobMinBudget} - $${postJobMaxBudget} | ${postJobLocation}`);
                      
                      const postedJobId = data.job?.job_id || data.job_id;
                      if (pendingInviteFreelancer && postedJobId) {
                        try {
                          const directHireRes = await fetch(`${API_URL}/proposals/direct-hire`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              freelancer_id: parseInt(pendingInviteFreelancer.id),
                              job_id: parseInt(postedJobId),
                              bid_amount: postJobMaxBudget,
                              delivery_days: 14,
                              cover_letter: `Invitation request for project: ${postJobTitle}`,
                              milestones: []
                            })
                          });
                          if (directHireRes.ok) {
                            triggerToast("success", `Invite request sent to ${pendingInviteFreelancer.name}!`, `Project: ${postJobTitle}`);
                          }
                        } catch (inviteErr) {
                          console.error("Failed to auto invite freelancer:", inviteErr);
                        }
                        setPendingInviteFreelancer(null);
                        setActiveTab("client_hired_freelancers");
                      }

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
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project URL Slug *</label>
                    <div className="flex items-center bg-slate-50/50 border border-slate-250 hover:border-slate-350 focus-within:border-primary/50 focus-within:bg-white rounded-xl overflow-hidden transition-all relative">
                      <span className="bg-slate-100 text-slate-450 border-r border-slate-255 px-3.5 py-3 text-xxs font-extrabold select-none shrink-0">
                        {typeof window !== "undefined"
                          ? (process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin)
                              .replace(/^(https?:\/\/)?(www\.)?/, "") + "/projects/"
                          : "lancerflow.net/projects/"}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="project-slug-url"
                        value={postJobSlug}
                        onChange={(e) => {
                          setIsSlugManuallyEdited(true);
                          setPostJobSlug(slugifyText(e.target.value));
                        }}
                        className="flex-1 bg-transparent px-4 py-3 text-xs focus:outline-none transition-all text-slate-850 font-bold border-none outline-none pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {slugValidating && (
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
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
                      <p className="text-[9px] text-emerald-600 font-bold">✓ Project URL slug is available!</p>
                    )}
                    {slugAvailable === false && (
                      <p className="text-[9px] text-rose-500 font-bold">✗ Slug is already taken by another project.</p>
                    )}
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
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "Fixed", label: "Fixed budget", desc: "Pay all at once" },
                          { value: "Milestone", label: "Milestone wise", desc: "Pay in segments" },
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
                    <CustomSelect
                      value=""
                      onChange={(val) => {
                        const id = Number(val);
                        if (id && !postJobSelectedLanguages.includes(id)) {
                          setPostJobSelectedLanguages([...postJobSelectedLanguages, id]);
                        }
                      }}
                      placeholder="Add language..."
                      options={postJobAvailableLanguages.map((l) => ({
                        value: l.language_id.toString(),
                        label: l.language_name,
                      }))}
                    />

                    {postJobSelectedLanguages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {postJobSelectedLanguages.map((langId) => {
                          const lang = postJobAvailableLanguages.find((l) => l.language_id === langId);
                          if (!lang) return null;
                          return (
                            <div
                              key={langId}
                              className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-3xl text-xxs font-extrabold select-none"
                            >
                              <span>{lang.language_name}</span>
                              <button
                                type="button"
                                onClick={() => setPostJobSelectedLanguages(postJobSelectedLanguages.filter((id) => id !== langId))}
                                className="hover:text-rose-600 transition border-0 bg-transparent p-0 cursor-pointer font-black text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
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
                        <span>Save & Continue</span>
                        <span className="text-xxs">→</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {postJobStep === 3 && (
                <>
                  {/* SEO & Sharing Meta Settings */}
                  <div className="flex flex-col gap-4 text-left">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">SEO & Social Sharing Settings (Optional)</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Customize the preview card displayed when your project is shared on social platforms like Facebook, WhatsApp, or LinkedIn.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                      
                      {/* SEO Inputs */}
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Meta SEO Title</label>
                            <span className="text-[9px] text-slate-400 font-semibold">{postJobSeoTitle.length}/70</span>
                          </div>
                          <input
                            type="text"
                            maxLength={70}
                            value={postJobSeoTitle}
                            placeholder={postJobTitle || "Defaults to Project Title"}
                            onChange={(e) => setPostJobSeoTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Meta SEO Description</label>
                            <span className="text-[9px] text-slate-400 font-semibold">{postJobSeoDescription.length}/160</span>
                          </div>
                          <textarea
                            maxLength={160}
                            value={postJobSeoDescription}
                            placeholder={postJobDescription ? postJobDescription.replace(/<[^>]*>/g, '').substring(0, 120) + "..." : "Defaults to Project Description"}
                            onChange={(e) => setPostJobSeoDescription(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-855 focus:border-primary focus:outline-none h-20 resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold text-slate-505 uppercase block mb-1">Custom Sharing Image</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Paste image URL or upload ->"
                              value={postJobSeoImage}
                              onChange={(e) => setPostJobSeoImage(e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                            />
                            <label className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm gap-1 hover:border-slate-350 select-none">
                              {uploadingSeoImage ? (
                                <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                                  <span>Upload</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingSeoImage}
                                onChange={handleSeoImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Live Preview Card */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 text-left">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Social Share Preview Card:</span>
                        
                        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
                          <div className="relative aspect-[1.91/1] w-full bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                            {postJobSeoImage ? (
                              <img
                                src={postJobSeoImage}
                                className="w-full h-full object-cover"
                                alt="SEO Social Share Preview"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-slate-355">
                                <i className="fa-solid fa-earth-americas text-xl text-slate-300"></i>
                                <span className="text-[9px] font-black uppercase tracking-widest text-center text-slate-400">Share Image Placeholder</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3 flex flex-col gap-1 text-left">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">lancerflow.net</span>
                            <h5 className="text-xs font-extrabold text-slate-800 line-clamp-1">
                              {postJobSeoTitle.trim() || postJobTitle.trim() || "Awesome Freelancer Project Title"}
                            </h5>
                            <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                              {postJobSeoDescription.trim() || (postJobDescription ? postJobDescription.replace(/<[^>]*>/g, '').substring(0, 110) + "..." : "Hire the best freelance professionals for your project on lancerflow.net.")}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setPostJobStep(2)}
                      className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="text-xxs">←</span>
                      <span>Back to Step 2</span>
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
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 mt-2 text-slate-500 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-wallet text-slate-400 text-sm"></i>
                <span>Budget: <strong className="text-slate-700 font-bold">
                  {selectedProjectDetails.min_budget && selectedProjectDetails.max_budget 
                    ? `$${parseFloat(selectedProjectDetails.min_budget).toLocaleString()} - $${parseFloat(selectedProjectDetails.max_budget).toLocaleString()}`
                    : `$${parseFloat(selectedProjectDetails.budget).toLocaleString()}`}
                  {selectedProjectDetails.project_type === "Hourly" ? " / hr" : ""}
                </strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-graduation-cap text-slate-400 text-sm"></i>
                <span>Experience: <strong className="text-slate-700 font-bold">{selectedProjectDetails.experience_level}</strong></span>
              </div>
              {selectedProjectDetails.duration && (
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-calendar text-slate-400 text-sm"></i>
                  <span>Duration: <strong className="text-slate-700 font-bold">{selectedProjectDetails.duration}</strong></span>
                </div>
              )}
              {selectedProjectDetails.location && (
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-slate-400 text-sm"></i>
                  <span>Location: <strong className="text-slate-700 font-bold">{selectedProjectDetails.location}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-visible">
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

        {/* Project Filters Tab Bar */}
        {!loadingClientJobs && clientJobs.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-xs">
            {[
              { id: "all", label: "All Projects", icon: "fa-solid fa-list-check" },
              { id: "pending", label: "Pending", icon: "fa-solid fa-clock text-amber-500" },
              { id: "ongoing", label: "Ongoing", icon: "fa-solid fa-spinner text-emerald-600 animate-spin-slow" },
              { id: "dispute", label: "Disputed", icon: "fa-solid fa-triangle-exclamation text-rose-500" },
              { id: "completed", label: "Completed", icon: "fa-solid fa-circle-check text-teal-600" },
              { id: "draft", label: "Drafts", icon: "fa-solid fa-file-signature text-slate-555" }
            ].map((tab) => {
              const count = clientJobs.filter(j => {
                const cStatus = j.contract_status?.toLowerCase();
                const jStatus = j.status?.toLowerCase();
                if (tab.id === "draft") return jStatus === "draft";
                if (tab.id === "pending") return cStatus === "pending" || jStatus === "pending";
                if (tab.id === "ongoing") return cStatus === "in_progress" || cStatus === "in-progress" || cStatus === "active";
                if (tab.id === "dispute") return cStatus === "disputed" || cStatus === "dispute" || jStatus === "disputed";
                if (tab.id === "completed") return cStatus === "completed" || jStatus === "completed";
                return true;
              }).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setProjectFilter(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border-0 cursor-pointer ${
                    projectFilter === tab.id
                      ? "bg-white text-slate-800 shadow-sm border border-slate-200/60 font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                  }`}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    projectFilter === tab.id ? "bg-slate-100 text-slate-700" : "bg-slate-200/50 text-slate-550"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Listings */}
        {loadingClientJobs ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
            <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-semibold">Loading your projects...</p>
          </div>
        ) : clientJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-2xl p-8 shadow-inner gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-105 flex items-center justify-center text-slate-400 text-xl">
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
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl p-8 shadow-sm gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 text-xl">
              <i className="fa-solid fa-filter"></i>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-805 mb-1">No projects in this category</h3>
              <p className="text-slate-400 text-xs max-w-sm font-semibold">Try switching filter tabs or post a new project.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <div key={job.job_id} className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden ${
                job.status === "Draft"
                  ? "border-amber-200/70 hover:border-amber-300"
                  : "border-slate-200/80 hover:border-slate-300"
              }`}>
                <div className={`absolute top-0 left-0 w-full h-1 opacity-80 ${
                  job.status === "Draft"
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-primary to-cyan-500"
                }`} />

                {/* Left side details */}
                <div className="flex-grow flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 cursor-pointer" onClick={() => job.status === "Draft" ? handleResumeDraft(job) : setSelectedProjectDetails(job)}>
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

                  <div className="flex flex-wrap items-center gap-6 text-slate-500 text-xs font-semibold pt-4 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-wallet text-slate-400 text-sm"></i>
                      <span>Budget: <strong className="text-slate-700 font-bold">
                        {job.min_budget && job.max_budget 
                          ? `$${parseFloat(job.min_budget).toLocaleString()} - $${parseFloat(job.max_budget).toLocaleString()}`
                          : `$${parseFloat(job.budget).toLocaleString()}`}
                        {job.project_type === "Hourly" ? " / hr" : ""}
                      </strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-graduation-cap text-slate-400 text-sm"></i>
                      <span>Experience: <strong className="text-slate-700 font-bold">{job.experience_level}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right side status/action panel */}
                <div className="w-full md:w-64 md:border-l border-slate-100 md:pl-6 flex flex-col justify-center items-stretch shrink-0 gap-3 text-left">
                  {job.status === "Draft" ? (
                    <>
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-center">
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-1">
                          Draft Project
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          This project is currently in draft mode and is not visible to freelancers.
                        </span>
                      </div>
                      <button
                        onClick={() => handleResumeDraft(job)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border-0"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span>Resume Project Draft</span>
                      </button>
                    </>
                  ) : job.contract_id ? (
                    <>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Project Status
                          </span>
                          {/* Beautiful status badges */}
                          {job.contract_status === "In_Progress" || job.contract_status === "Active" ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Ongoing
                            </span>
                          ) : job.contract_status === "Disputed" ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <i className="fa-solid fa-triangle-exclamation text-rose-500 animate-bounce"></i>
                              Disputed
                            </span>
                          ) : job.contract_status === "Pending" ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-teal-50 text-teal-700 border border-teal-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              <i className="fa-solid fa-circle-check text-teal-600"></i>
                              Completed
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-extrabold text-slate-500 uppercase">
                            <span>Contract Progress</span>
                            <span>{job.contract_progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                job.contract_status === "Disputed" 
                                  ? "bg-rose-500" 
                                  : "bg-gradient-to-r from-primary to-teal-500"
                              }`}
                              style={{ width: `${job.contract_progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProjectDetails(job)}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border-0"
                      >
                        <i className="fa-solid fa-bars-progress"></i>
                        <span>Milestones & Payments</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-cyan-50/30 border border-cyan-100 rounded-xl p-3.5 text-center">
                        <span className="text-[9px] font-black text-cyan-700 uppercase tracking-widest block mb-1">
                          Bidding Active
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          This project is open. Review proposal bids submitted by freelancers.
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedProjectDetails(job)}
                        className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border-0"
                      >
                        <i className="fa-solid fa-users-viewfinder"></i>
                        <span>Review Proposals</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (userRole !== "client" && selectedProposalDetails) {
    const proposal = selectedProposalDetails;
    const displayBudget = proposal.job_min_budget && proposal.job_max_budget
      ? `$${parseFloat(proposal.job_min_budget).toLocaleString()} - $${parseFloat(proposal.job_max_budget).toLocaleString()}`
      : `$${parseFloat(proposal.job_budget || 0).toLocaleString()}`;

    // Determine display status and color classes based on contract_status and proposal.status
    const contractStatus = proposal.contract_status;
    let detailDisplayStatus = proposal.status;
    let detailStatusColorClass = "bg-amber-50 text-amber-700 border-amber-150";
    let detailTopBarColorClass = "bg-amber-500";

    if (contractStatus === "Cancelled") {
      detailDisplayStatus = "Cancelled";
      detailStatusColorClass = "bg-rose-50 text-rose-700 border-rose-150";
      detailTopBarColorClass = "bg-rose-500";
    } else if (contractStatus === "Disputed" || proposal.contract_disputed_at) {
      detailDisplayStatus = "Disputed";
      detailStatusColorClass = "bg-rose-50 text-rose-700 border-rose-150";
      detailTopBarColorClass = "bg-rose-500";
    } else if (contractStatus === "Completed") {
      detailDisplayStatus = "Completed";
      detailStatusColorClass = "bg-teal-50 text-teal-700 border-teal-150";
      detailTopBarColorClass = "bg-teal-500";
    } else if (proposal.status === "Accepted" || contractStatus === "Hired" || contractStatus === "Work Started") {
      detailDisplayStatus = "Hired";
      detailStatusColorClass = "bg-emerald-50 text-emerald-700 border-emerald-150";
      detailTopBarColorClass = "bg-emerald-500";
    } else if (proposal.status === "Accepted_By_Freelancer") {
      detailDisplayStatus = "Awaiting Payment";
      detailStatusColorClass = "bg-indigo-50 text-indigo-700 border-indigo-150";
      detailTopBarColorClass = "bg-indigo-500";
    } else if (proposal.status === "Declined" || proposal.status === "Cancelled") {
      detailDisplayStatus = proposal.status;
      detailStatusColorClass = "bg-rose-50 text-rose-700 border-rose-150";
      detailTopBarColorClass = "bg-rose-500";
    }

    // Safely parse job skills and languages
    let jobSkills: any[] = [];
    try {
      if (Array.isArray(proposal.job_skills)) {
        jobSkills = proposal.job_skills;
      } else if (typeof proposal.job_skills === "string") {
        jobSkills = JSON.parse(proposal.job_skills);
      }
    } catch (e) {}

    let jobLanguages: any[] = [];
    try {
      if (Array.isArray(proposal.job_languages)) {
        jobLanguages = proposal.job_languages;
      } else if (typeof proposal.job_languages === "string") {
        jobLanguages = JSON.parse(proposal.job_languages);
      }
    } catch (e) {}

    return (
      <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-800">
        {/* Back header */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <button
              onClick={() => setSelectedProposalDetails(null)}
              className="text-slate-550 hover:text-slate-800 text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60 mb-2.5 inline-flex items-center gap-1.5"
            >
              ← Back to Proposals
            </button>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              📁 {proposal.job_title}
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold font-display">
              Project requirements and your submitted proposal info.
            </p>
          </div>
        </div>

        {/* Project Details Panel */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
          <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-briefcase text-primary"></i>
            Project Requirements
          </h3>
          <p className="text-slate-600 text-xs font-medium leading-relaxed whitespace-pre-line">
            {proposal.job_description || <span className="italic text-slate-400">No project description available.</span>}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 mt-2 text-slate-500 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-wallet text-slate-400"></i>
              <span>Budget: <strong className="text-slate-700">{displayBudget} {proposal.job_project_type === "Hourly" ? "/ hr" : ""}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <i className="fa-solid fa-graduation-cap text-slate-400"></i>
              <span>Experience: <strong className="text-slate-700">{proposal.job_experience_level}</strong></span>
            </div>
            {proposal.sub_category_name && (
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-tags text-slate-400"></i>
                <span>Subcategory: <strong className="text-slate-700">{proposal.sub_category_name}</strong></span>
              </div>
            )}
            {proposal.job_duration && (
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-calendar text-slate-400"></i>
                <span>Duration: <strong className="text-slate-700">{proposal.job_duration}</strong></span>
              </div>
            )}
            {proposal.job_location && (
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-location-dot text-slate-400"></i>
                <span>Location: <strong className="text-slate-700">{proposal.job_location}</strong></span>
              </div>
            )}
            {proposal.job_num_freelancers && (
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-users text-slate-400"></i>
                <span>Freelancers: <strong className="text-slate-700">{proposal.job_num_freelancers}</strong></span>
              </div>
            )}
          </div>

          {(jobSkills.length > 0 || jobLanguages.length > 0) && (
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
              {jobSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center justify-start">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Required Skills:</span>
                  {jobSkills.map((skill: any, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[10px] font-bold">
                      {skill.skill_name || skill}
                    </span>
                  ))}
                </div>
              )}
              {jobLanguages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center justify-start mt-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Languages:</span>
                  {jobLanguages.map((lang: any, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[10px] font-bold">
                      {lang.language_name || lang}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Submitted Proposal Details */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${detailTopBarColorClass} opacity-80`} />
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <i className="fa-solid fa-paper-plane text-primary"></i>
              My Proposal Details
            </h3>
            <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase tracking-wider ${detailStatusColorClass}`}>
              {detailDisplayStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 border border-slate-200/50 rounded-xl p-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Your Bid Amount</span>
              <strong className="text-slate-800 text-sm font-black">${parseFloat(proposal.bid_amount).toLocaleString()}</strong>
              <span className="text-xxs text-slate-400">(Job Budget: {displayBudget})</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Delivery Days</span>
              <strong className="text-slate-800 text-sm font-black">{proposal.delivery_days} Days</strong>
              <span className="text-xxs text-slate-400">(Requested timeline)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Cover Letter / Pitch</span>
            <p className="text-slate-605 text-xs font-medium leading-relaxed whitespace-pre-line bg-slate-50/30 border border-slate-100 p-4 rounded-xl">
              {proposal.cover_letter}
            </p>
          </div>

          {proposal.milestones && Array.isArray(proposal.milestones) && proposal.milestones.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Proposed Milestone Structure</span>
              <div className="flex flex-col gap-2">
                {proposal.milestones.map((m: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/50 px-4 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
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
          {proposal.status === "Accepted" && (
            <div className="border-t border-slate-100 pt-4 mt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProposalDetails(null);
                  setActiveTab("my_projects");
                }}
                className="bg-teal-700 hover:bg-teal-850 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 border-0"
              >
                <i className="fa-solid fa-rocket animate-bounce"></i> Go to Projects Tab & Start Work
              </button>
            </div>
          )}
        </div>
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
            value: freelancerProposals.filter((p) => p.status === "Declined" || p.status === "Cancelled").length,
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

      {/* Filter Tabs */}
      {!loadingFreelancerProposals && freelancerProposals.length > 0 && (
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 self-start select-none gap-1">
          <button
            onClick={() => setFreelancerFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              freelancerFilter === "all" 
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Proposals ({freelancerProposals.length})
          </button>
          <button
            onClick={() => setFreelancerFilter("pending")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              freelancerFilter === "pending" 
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Review ({freelancerProposals.filter((p) => p.status === "Pending").length})
          </button>
          <button
            onClick={() => setFreelancerFilter("accepted")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              freelancerFilter === "accepted" 
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Accepted & Hired ({freelancerProposals.filter((p) => p.status === "Accepted" || p.status === "Accepted_By_Freelancer" || p.contract_status === "Hired" || p.contract_status === "Work Started" || p.contract_status === "Completed").length})
          </button>
          <button
            onClick={() => setFreelancerFilter("declined")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              freelancerFilter === "declined" 
                ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Declined & Cancelled ({freelancerProposals.filter((p) => p.status === "Declined" || p.status === "Cancelled" || p.contract_status === "Cancelled").length})
          </button>
        </div>
      )}

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
      ) : filteredFreelancerProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-2xl p-8 shadow-inner gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl">
            <i className="fa-solid fa-filter"></i>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">No proposals match this filter</h3>
            <p className="text-slate-400 text-xs max-w-sm font-semibold">Try changing your active status filter to view other proposals.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredFreelancerProposals.map((proposal) => {
            const contractStatus = proposal.contract_status;
            let displayStatus = proposal.status;
            let statusColorClass = "bg-amber-50 text-amber-700 border-amber-150";
            let topBarColorClass = "bg-amber-500";

            if (contractStatus === "Cancelled") {
              displayStatus = "Cancelled";
              statusColorClass = "bg-rose-50 text-rose-700 border-rose-150";
              topBarColorClass = "bg-rose-500";
            } else if (contractStatus === "Disputed" || proposal.contract_disputed_at) {
              displayStatus = "Disputed";
              statusColorClass = "bg-rose-50 text-rose-700 border-rose-150";
              topBarColorClass = "bg-rose-500";
            } else if (contractStatus === "Completed") {
              displayStatus = "Completed";
              statusColorClass = "bg-teal-50 text-teal-700 border-teal-150";
              topBarColorClass = "bg-teal-500";
            } else if (proposal.status === "Accepted" || contractStatus === "Hired" || contractStatus === "Work Started") {
              displayStatus = "Hired";
              statusColorClass = "bg-emerald-50 text-emerald-700 border-emerald-150";
              topBarColorClass = "bg-emerald-500";
            } else if (proposal.status === "Accepted_By_Freelancer") {
              displayStatus = "Awaiting Payment";
              statusColorClass = "bg-indigo-50 text-indigo-700 border-indigo-150";
              topBarColorClass = "bg-indigo-500";
            } else if (proposal.status === "Declined" || proposal.status === "Cancelled") {
              displayStatus = proposal.status;
              statusColorClass = "bg-rose-50 text-rose-700 border-rose-150";
              topBarColorClass = "bg-rose-500";
            }

            return (
              <div key={proposal.proposal_id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${topBarColorClass}`} />
                
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 
                      onClick={() => setSelectedProposalDetails(proposal)}
                      className="text-sm font-extrabold text-slate-850 hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span>{proposal.job_title}</span>
                      {proposal.initiated_by === "client" && (
                        <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Direct Hire Offer</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-400 text-[10px] font-bold">
                        Client: <strong>{proposal.client_company_name || proposal.client_name}</strong> ({proposal.client_email})
                      </span>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-slate-400 text-[10px] font-bold">
                        Offer Date: {new Date(proposal.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-black border px-2 py-0.5 rounded uppercase tracking-wider ${statusColorClass}`}>
                      {displayStatus}
                    </span>
                  </div>
                </div>

              <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  {proposal.initiated_by === "client" ? "Offer Invitation Message" : "Cover Letter"}
                </span>
                <p className="text-slate-600 text-xs font-medium leading-relaxed whitespace-pre-line line-clamp-3">{proposal.cover_letter}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-slate-500 text-xs font-semibold">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-wallet text-slate-400"></i>
                    <span>Offer Budget: <strong className="text-slate-700 font-extrabold">${parseFloat(proposal.bid_amount).toLocaleString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-clock text-slate-400"></i>
                    <span>Delivery Time: <strong className="text-slate-700 font-extrabold">{proposal.delivery_days} days</strong></span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {proposal.initiated_by === "client" && proposal.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespondDirectHire(proposal.proposal_id, "Accept");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] px-3.5 py-2 rounded-xl cursor-pointer shadow-sm uppercase tracking-wider border-0"
                      >
                        Accept Offer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRespondDirectHire(proposal.proposal_id, "Decline");
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-[9px] px-3.5 py-2 rounded-xl cursor-pointer uppercase tracking-wider"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedProposalDetails(proposal)}
                    className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary px-3.5 py-2 rounded-xl text-xxs font-black transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
