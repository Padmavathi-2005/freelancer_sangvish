import { API_URL } from "@/config/api";
import React, { useState, useMemo, useEffect } from "react";
import { FiCheck, FiStar } from "react-icons/fi";
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
  postJobMinHours: number;
  setPostJobMinHours: (val: number) => void;
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
  postJobMinHours,
  setPostJobMinHours,
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
  const [clientSubscription, setClientSubscription] = useState<any>(null);
  const [siteShortName, setSiteShortName] = useState("Lancer");
  const [durations, setDurations] = useState<string[]>([
    "Less than 1 month",
    "1-3 months",
    "3-6 months",
    "More than 6 months"
  ]);
  const [locations, setLocations] = useState<string[]>([
    "Remote",
    "Onsite",
    "Partially Remote"
  ]);
  const [paymentModes, setPaymentModes] = useState<string[]>([
    "Daily",
    "Weekly",
    "Monthly"
  ]);
  const [togglingFeatureId, setTogglingFeatureId] = useState<number | null>(null);
  const [relistingJobId, setRelistingJobId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/users/me/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setClientSubscription(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch client subscription:", err);
      }
    };
    if (userRole === "client") {
      fetchSubscription();
    }
  }, [userRole]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const siteRaw = data.find((s: any) => s.setting_key === "site_settings")?.setting_value;
          if (siteRaw) {
            let parsed = siteRaw;
            if (typeof parsed === "string") {
              try { parsed = JSON.parse(parsed); } catch {}
            }
            if (parsed.site_short_name) {
              setSiteShortName(parsed.site_short_name);
            } else if (parsed.site_name) {
              setSiteShortName(parsed.site_name);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load settings in ProposalsTab:", e);
      }

      try {
        const resOptions = await fetch(`${API_URL}/form-field-options`);
        if (resOptions.ok) {
          const data = await resOptions.json();
          if (data.project_durations) {
            setDurations(data.project_durations.map((d: any) => d.option_value));
          }
          if (data.location_preferences) {
            setLocations(data.location_preferences.map((l: any) => l.option_value));
          }
          if (data.payment_modes) {
            setPaymentModes(data.payment_modes.map((p: any) => p.option_value));
          }
        }
      } catch (e) {
        console.error("Failed to load settings in ProposalsTab:", e);
      }
    };
    loadSettings();
  }, []);

  const handleToggleFeatureProject = async (job: any) => {
    try {
      setTogglingFeatureId(job.job_id);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/jobs/${job.job_id}/feature`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", data.message || "Project feature status updated successfully.");
        await fetchClientJobs();
      } else {
        triggerToast("error", data.message || "Failed to update project feature status.");
      }
    } catch (err) {
      console.error("Failed to toggle project feature status:", err);
      triggerToast("error", "Network error occurred.");
    } finally {
      setTogglingFeatureId(null);
    }
  };

  const handleRelistProject = async (job: any) => {
    if (!window.confirm(`Are you sure you want to relist the project "${job.title}"? This will create a new listing with the same details so freelancers can submit fresh proposals.`)) {
      return;
    }
    try {
      setRelistingJobId(job.job_id);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/jobs/${job.job_id}/relist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", data.message || "Project relisted successfully!");
        await fetchClientJobs();
      } else {
        triggerToast("error", data.message || "Failed to relist project.");
      }
    } catch (err) {
      console.error("Failed to relist project:", err);
      triggerToast("error", "Network error occurred.");
    } finally {
      setRelistingJobId(null);
    }
  };

  const [selectedProposalDetails, setSelectedProposalDetails] = useState<any | null>(null);
  const [projectFilter, setProjectFilter] = useState<"all" | "pending" | "ongoing" | "dispute" | "completed" | "draft" | "hired" | "proposals_arrived" | "proposals_not_arrived">("all");
  const [freelancerFilter, setFreelancerFilter] = useState<"all" | "pending" | "accepted" | "declined">("all");

  const [searchProjectQuery, setSearchProjectQuery] = useState("");
  const [projectPage, setProjectPage] = useState(1);
  const projectsPerPage = 5;

  const [searchProposalQuery, setSearchProposalQuery] = useState("");
  const [proposalPage, setProposalPage] = useState(1);
  const proposalsPerPage = 5;

  const filteredFreelancerProposals = useMemo(() => {
    return freelancerProposals.filter((proposal) => {
      const contractStatus = proposal.contract_status;
      let matchStatus = true;
      if (freelancerFilter === "pending") {
        matchStatus = proposal.status === "Pending";
      } else if (freelancerFilter === "accepted") {
        matchStatus = (
          proposal.status === "Accepted" ||
          proposal.status === "Accepted_By_Freelancer" ||
          contractStatus === "Hired" ||
          contractStatus === "Work Started" ||
          contractStatus === "Completed"
        );
      } else if (freelancerFilter === "declined") {
        matchStatus = (
          proposal.status === "Declined" ||
          proposal.status === "Cancelled" ||
          contractStatus === "Cancelled"
        );
      }

      if (!matchStatus) return false;

      if (searchProposalQuery.trim()) {
        const query = searchProposalQuery.toLowerCase();
        const matchTitle = proposal.job_title?.toLowerCase().includes(query);
        const matchDesc = proposal.job_description?.toLowerCase().includes(query);
        const matchClient = proposal.client_name?.toLowerCase().includes(query) || proposal.client_company_name?.toLowerCase().includes(query);
        const matchCover = proposal.cover_letter?.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchClient || matchCover;
      }

      return true;
    });
  }, [freelancerProposals, freelancerFilter, searchProposalQuery]);

  const paginatedProposals = useMemo(() => {
    const startIndex = (proposalPage - 1) * proposalsPerPage;
    return filteredFreelancerProposals.slice(startIndex, startIndex + proposalsPerPage);
  }, [filteredFreelancerProposals, proposalPage]);

  const totalProposalPages = Math.ceil(filteredFreelancerProposals.length / proposalsPerPage);

  useEffect(() => {
    setProposalPage(1);
  }, [freelancerFilter, searchProposalQuery]);
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

  const handleSeoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingSeoImage(true);
      const processed = await processSeoImage(e.target.files[0]);
      const url = await uploadFile(processed);
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
    const filtered = clientJobs.filter((job) => {
      const cStatus = job.contract_status?.toLowerCase();
      const jStatus = job.status?.toLowerCase();
      
      let matchStatus = true;
      if (projectFilter === "draft") {
        matchStatus = jStatus === "draft";
      } else if (projectFilter === "pending") {
        matchStatus = cStatus === "pending" || cStatus === "hired" || jStatus === "pending";
      } else if (projectFilter === "ongoing") {
        matchStatus = cStatus === "in_progress" || cStatus === "in-progress" || cStatus === "active" || cStatus === "work started" || cStatus === "work_started" || cStatus === "under review" || cStatus === "under_review";
      } else if (projectFilter === "dispute") {
        matchStatus = cStatus === "disputed" || cStatus === "dispute" || jStatus === "disputed";
      } else if (projectFilter === "completed") {
        matchStatus = cStatus === "completed" || cStatus === "work completed" || cStatus === "work_completed" || jStatus === "completed";
      } else if (projectFilter === "hired") {
        matchStatus = !!job.contract_id && cStatus !== "cancelled";
      } else if (projectFilter === "proposals_arrived") {
        matchStatus = !job.contract_id && parseInt(job.proposal_count || 0) > 0 && jStatus !== "draft";
      } else if (projectFilter === "proposals_not_arrived") {
        matchStatus = !job.contract_id && parseInt(job.proposal_count || 0) === 0 && jStatus !== "draft";
      }

      if (!matchStatus) return false;

      if (searchProjectQuery.trim()) {
        const query = searchProjectQuery.toLowerCase();
        const matchTitle = job.title?.toLowerCase().includes(query);
        const matchDesc = job.description?.toLowerCase().includes(query);
        const matchCategory = job.category_name?.toLowerCase().includes(query) || job.sub_category_name?.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchCategory;
      }

      return true;
    });

    // Sort Hired/Ongoing projects (where contract_id exists) to the top of the list
    return [...filtered].sort((a, b) => {
      const aHired = !!a.contract_id;
      const bHired = !!b.contract_id;
      if (aHired && !bHired) return -1;
      if (!aHired && bHired) return 1;
      return 0;
    });
  }, [clientJobs, projectFilter, searchProjectQuery]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (projectPage - 1) * projectsPerPage;
    return filteredJobs.slice(startIndex, startIndex + projectsPerPage);
  }, [filteredJobs, projectPage]);

  const totalProjectPages = Math.ceil(filteredJobs.length / projectsPerPage);

  useEffect(() => {
    setProjectPage(1);
  }, [projectFilter, searchProjectQuery]);

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
    setPostJobMinHours(10);
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
    setPostJobMinHours(job.min_hours || 10);
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
          min_hours: postJobType === "Hourly" ? postJobMinHours : null,
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
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            
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
                  // Hourly-specific validation
                  if (postJobType === "Hourly") {
                    if (postJobMinHours <= 0) {
                      triggerToast("error", "Minimum hours must be a positive value.");
                      return;
                    }
                    if (postJobMaxHours <= 0) {
                      triggerToast("error", "Maximum hours per week must be a positive value.");
                      return;
                    }
                    if (postJobMinHours > postJobMaxHours) {
                      triggerToast("error", "Minimum hours cannot exceed maximum hours per week.");
                      return;
                    }
                    if (postJobMinHours * postJobMinBudget > postJobMaxBudget) {
                      triggerToast("error", `Invalid rate range: ${postJobMinHours} min hrs × $${postJobMinBudget}/hr = $${(postJobMinHours * postJobMinBudget).toLocaleString()}, which exceeds max budget ($${postJobMaxBudget.toLocaleString()}). Increase max rate or reduce min hours.`);
                      return;
                    }
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
                        min_hours: postJobType === "Hourly" ? postJobMinHours : null,
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
                    <div className="flex flex-col gap-5 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Minimum Hours Required *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="e.g. 10"
                            value={postJobMinHours}
                            onChange={(e) => setPostJobMinHours(Number(e.target.value))}
                            className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-bold"
                          />
                          <p className="text-[10px] text-slate-400">Minimum total hours expected from the freelancer</p>
                        </div>
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
                          <p className="text-[10px] text-slate-400">Max hours the freelancer can work per week</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Payment Mode *</label>
                        <CustomSelect
                          value={postJobPaymentMode}
                          onChange={(val) => setPostJobPaymentMode(val)}
                          options={paymentModes.map((mode) => ({ value: mode, label: mode }))}
                        />
                      </div>
                      {/* Live cost preview */}
                      {postJobMinBudget > 0 && postJobMaxBudget > 0 && postJobMinHours > 0 && (
                        <div className={`rounded-xl p-3 text-xs flex flex-col gap-1 ${
                          postJobMinHours * postJobMinBudget > postJobMaxBudget
                            ? "bg-red-50 border border-red-200 text-red-700"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        }`}>
                          <p className="font-bold">💡 Estimated Cost Preview</p>
                          <p>Min: {postJobMinHours} hrs × ${postJobMinBudget}/hr = <strong>${(postJobMinHours * postJobMinBudget).toLocaleString()}</strong></p>
                          <p>Max: {postJobMinHours} hrs × ${postJobMaxBudget}/hr = <strong>${(postJobMinHours * postJobMaxBudget).toLocaleString()}</strong></p>
                          {postJobMinHours * postJobMinBudget > postJobMaxBudget && (
                            <p className="font-semibold mt-1">⚠️ Minimum hours × min rate exceeds your max budget. Please adjust.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                        {postJobType === "Hourly" ? "Min Hourly Rate (USD/hr) *" : "Minimum Budget (USD) *"}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder={postJobType === "Hourly" ? "e.g. 25" : "e.g. 500"}
                        value={postJobMinBudget}
                        onChange={(e) => setPostJobMinBudget(Number(e.target.value))}
                        className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                        {postJobType === "Hourly" ? "Max Hourly Rate (USD/hr) *" : "Maximum Budget (USD) *"}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder={postJobType === "Hourly" ? "e.g. 75" : "e.g. 5000"}
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
                        options={durations.map((d) => ({ value: d, label: d }))}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Location preference</label>
                      <CustomSelect
                        value={postJobLocation}
                        onChange={(val) => setPostJobLocation(val)}
                        options={locations.map((l) => ({ value: l, label: l }))}
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
                        { value: "Beginner", label: "Entry (Beginner)" },
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
                              className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xxs font-extrabold select-none"
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
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-2">
                              {postJobSeoImage && (
                                <img src={postJobSeoImage} alt="SEO Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                              )}
                              <label className="flex-1 cursor-pointer">
                                <div className="bg-white border border-slate-200 hover:border-primary/60 hover:bg-primary/3 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all flex items-center justify-between gap-2">
                                  <span className={uploadingSeoImage ? "text-slate-400" : ""}>
                                    {uploadingSeoImage ? "Uploading..." : postJobSeoImage ? "Change Image" : "Upload Image"}
                                  </span>
                                  {uploadingSeoImage && (
                                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-primary rounded-full animate-spin shrink-0" />
                                  )}
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingSeoImage}
                                  onChange={handleSeoImageUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Min 300×200px &bull; Large images auto-resized to 1200×630px</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Live Preview Card */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3 text-left">
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
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
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

          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
                <span>Experience: <strong className="text-slate-700 font-bold">{selectedProjectDetails.experience_level && selectedProjectDetails.experience_level !== "null" ? selectedProjectDetails.experience_level : "Intermediate"}</strong></span>
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

          <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-visible">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
            <h3 className="text-sm font-extrabold text-slate-855 border-b border-slate-100 pb-2">
              {selectedProjectDetails.contract_id ? "Milestone & Delivery Tracker" : "Freelancer Proposals"}
            </h3>
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-folder-open text-primary"></i> My Posted Projects
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Track and manage the project proposals you posted for bidding.</p>
          </div>
          <button
            onClick={() => setIsCreatingJob(true)}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 animate-pulse"
          >
            <i className="fa-solid fa-plus"></i> Post a New Project
          </button>
        </div>

        {/* Project Filters Tab Bar & Search */}
        {!loadingClientJobs && clientJobs.length > 0 && (
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-xs flex-1">
              {[
                { id: "all", label: "All Projects", icon: "fa-solid fa-list-check" },
                { id: "pending", label: "Pending", icon: "fa-solid fa-clock text-amber-500" },
                { id: "hired", label: "Hired Projects", icon: "fa-solid fa-user-check text-teal-650" },
                { id: "proposals_arrived", label: "Proposals Arrived", icon: "fa-solid fa-envelope-open text-primary" },
                { id: "proposals_not_arrived", label: "Proposals Not Arrived", icon: "fa-solid fa-envelope text-slate-400" },
                { id: "ongoing", label: "Ongoing", icon: "fa-solid fa-spinner text-emerald-600 animate-spin-slow" },
                { id: "dispute", label: "Disputed", icon: "fa-solid fa-triangle-exclamation text-rose-500" },
                { id: "completed", label: "Completed", icon: "fa-solid fa-circle-check text-teal-600" },
                { id: "draft", label: "Drafts", icon: "fa-solid fa-file-signature text-slate-555" }
              ].map((tab) => {
                const count = clientJobs.filter(j => {
                  const cStatus = j.contract_status?.toLowerCase();
                  const jStatus = j.status?.toLowerCase();
                  if (tab.id === "draft") return jStatus === "draft";
                  if (tab.id === "pending") return cStatus === "pending" || cStatus === "hired" || jStatus === "pending";
                  if (tab.id === "ongoing") return cStatus === "in_progress" || cStatus === "in-progress" || cStatus === "active" || cStatus === "work started" || cStatus === "work_started" || cStatus === "under review" || cStatus === "under_review";
                  if (tab.id === "dispute") return cStatus === "disputed" || cStatus === "dispute" || jStatus === "disputed";
                  if (tab.id === "completed") return cStatus === "completed" || cStatus === "work completed" || cStatus === "work_completed" || jStatus === "completed";
                  if (tab.id === "hired") return !!j.contract_id && cStatus !== "cancelled";
                  if (tab.id === "proposals_arrived") return !j.contract_id && parseInt(j.proposal_count || 0) > 0 && jStatus !== "draft";
                  if (tab.id === "proposals_not_arrived") return !j.contract_id && parseInt(j.proposal_count || 0) === 0 && jStatus !== "draft";
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
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full xl:w-72 shrink-0">
              <input
                type="text"
                value={searchProjectQuery}
                onChange={(e) => setSearchProjectQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-805 focus:outline-none focus:border-teal-700 focus:bg-white transition-all shadow-xs"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            </div>
          </div>
        )}

        {/* Listings */}
        {loadingClientJobs ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
            <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-xs font-semibold">Loading your projects...</p>
          </div>
        ) : clientJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-xl p-8 shadow-inner gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-105 flex items-center justify-center text-slate-400 text-xl">
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <button
              onClick={() => setIsCreatingJob(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer mt-2"
            >
              <i className="fa-solid fa-plus mr-1"></i> Post Your First Project
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-200 rounded-xl p-8 shadow-sm gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 text-xl">
              <i className="fa-solid fa-filter"></i>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-805 mb-1">No projects found</h3>
              <p className="text-slate-400 text-xs max-w-sm font-semibold">Try switching filter tabs or check your search keyword.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paginatedProjects.map((job) => (
              <div key={job.job_id} className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden ${
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-slate-850 hover:text-primary transition-colors">{job.title}</h3>
                        {job.is_featured && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0 flex items-center gap-1">
                            <FiStar className="w-2.5 h-2.5 fill-white text-white shrink-0" />
                            <span>{siteShortName}'s Choice</span>
                          </span>
                        )}
                      </div>
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
                      <span>Experience: <strong className="text-slate-700 font-bold">{job.experience_level && job.experience_level !== "null" ? job.experience_level : "Intermediate"}</strong></span>
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
                          {(() => {
                            const status = job.contract_status?.toLowerCase();
                            if (status === "in_progress" || status === "in-progress" || status === "active" || status === "work started" || status === "work_started") {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Ongoing
                                </span>
                              );
                            }
                            if (status === "under review" || status === "under_review") {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                  Under Review
                                </span>
                              );
                            }
                            if (status === "disputed" || status === "dispute") {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <i className="fa-solid fa-triangle-exclamation text-rose-500 animate-bounce"></i>
                                  Disputed
                                </span>
                              );
                            }
                            if (status === "pending" || status === "hired") {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Hired
                                </span>
                              );
                            }
                            if (status === "cancelled") {
                              return (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-slate-50 text-slate-700 border border-slate-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <i className="fa-solid fa-ban text-slate-500"></i>
                                  Cancelled
                                </span>
                              );
                            }
                            // Default / Completed
                            return (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-teal-50 text-teal-700 border border-teal-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <i className="fa-solid fa-circle-check text-teal-600"></i>
                                Completed
                              </span>
                            );
                          })()}
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
                      {/* Feature Project Action Button */}
                      {clientSubscription && clientSubscription.featured_project_limit > 0 && (
                        <button
                          type="button"
                          disabled={togglingFeatureId !== null}
                          onClick={() => handleToggleFeatureProject(job)}
                          className={`w-full font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border border-transparent ${
                            job.is_featured
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <i className="fa-solid fa-star"></i>
                          <span>
                            {job.is_featured 
                              ? "Featured (Choice Active)" 
                              : `Feature Project (${clientJobs.filter((j: any) => j.is_featured).length}/${clientSubscription.featured_project_limit})`}
                          </span>
                        </button>
                      )}

                      {/* Relist Project Action Button */}
                      {(job.status === "Cancelled" || job.status === "Completed" || 
                        job.contract_status === "Cancelled" || job.contract_status === "Disputed" || job.contract_status === "Completed") && (
                        <button
                          type="button"
                          disabled={relistingJobId !== null}
                          onClick={() => handleRelistProject(job)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 mt-2"
                        >
                          <i className="fa-solid fa-arrows-rotate"></i>
                          <span>{relistingJobId === job.job_id ? "Relisting..." : "Relist Project"}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className={`border rounded-xl p-3.5 text-center ${
                        parseInt(job.proposal_count || 0) > 0 
                          ? "bg-teal-50/40 border-teal-100" 
                          : "bg-slate-50 border-slate-200"
                      }`}>
                        <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${
                          parseInt(job.proposal_count || 0) > 0 ? "text-teal-700" : "text-slate-500"
                        }`}>
                          {parseInt(job.proposal_count || 0) > 0 ? `Proposals Received (${job.proposal_count})` : "Awaiting Bids"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                          {parseInt(job.proposal_count || 0) > 0 
                            ? `You have received ${job.proposal_count} proposal bid${parseInt(job.proposal_count || 0) === 1 ? "" : "s"}. Review and select a freelancer to hire.`
                            : "Waiting for freelancers to submit proposal bids. You will be notified when proposals arrive."
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedProjectDetails(job)}
                        className={`w-full text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border-0 ${
                          parseInt(job.proposal_count || 0) > 0 ? "bg-primary hover:bg-primary-hover" : "bg-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        <i className={parseInt(job.proposal_count || 0) > 0 ? "fa-solid fa-users-viewfinder" : "fa-solid fa-folder-open"}></i>
                        <span>{parseInt(job.proposal_count || 0) > 0 ? "Review Proposals" : "View Project Details"}</span>
                      </button>
                      {/* Feature Project Action Button */}
                      {clientSubscription && clientSubscription.featured_project_limit > 0 && (
                        <button
                          type="button"
                          disabled={togglingFeatureId !== null}
                          onClick={() => handleToggleFeatureProject(job)}
                          className={`w-full font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border border-transparent ${
                            job.is_featured
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          <i className="fa-solid fa-star"></i>
                          <span>
                            {job.is_featured 
                              ? "Featured (Choice Active)" 
                              : `Feature Project (${clientJobs.filter((j: any) => j.is_featured).length}/${clientSubscription.featured_project_limit})`}
                          </span>
                        </button>
                      )}

                      {/* Relist Project Action Button */}
                      {(job.status === "Cancelled" || job.status === "Completed") && (
                        <button
                          type="button"
                          disabled={relistingJobId !== null}
                          onClick={() => handleRelistProject(job)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 mt-2"
                        >
                          <i className="fa-solid fa-arrows-rotate"></i>
                          <span>{relistingJobId === job.job_id ? "Relisting..." : "Relist Project"}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalProjectPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 text-xs font-bold select-none">
            <span className="text-slate-400">
              Showing {(projectPage - 1) * projectsPerPage + 1} - {Math.min(projectPage * projectsPerPage, filteredJobs.length)} of {filteredJobs.length} projects
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setProjectPage(p => Math.max(1, p - 1))}
                disabled={projectPage === 1}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setProjectPage(p => Math.min(totalProjectPages, p + 1))}
                disabled={projectPage === totalProjectPages}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next
              </button>
            </div>
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
              <span>Experience: <strong className="text-slate-700">{proposal.job_experience_level && proposal.job_experience_level !== "null" ? proposal.job_experience_level : "Intermediate"}</strong></span>
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
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
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
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
          <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between gap-4">
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

      {/* Filter Tabs & Search */}
      {!loadingFreelancerProposals && freelancerProposals.length > 0 && (
        <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
          <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 self-start select-none gap-1 flex-1">
            <button
              onClick={() => setFreelancerFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                freelancerFilter === "all" 
                  ? "bg-white text-slate-805 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              All Proposals ({freelancerProposals.length})
            </button>
            <button
              onClick={() => setFreelancerFilter("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                freelancerFilter === "pending" 
                  ? "bg-white text-slate-805 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Pending Review ({freelancerProposals.filter((p) => p.status === "Pending").length})
            </button>
            <button
              onClick={() => setFreelancerFilter("accepted")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                freelancerFilter === "accepted" 
                  ? "bg-white text-slate-805 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Accepted & Hired ({freelancerProposals.filter((p) => p.status === "Accepted" || p.status === "Accepted_By_Freelancer" || p.contract_status === "Hired" || p.contract_status === "Work Started" || p.contract_status === "Completed").length})
            </button>
            <button
              onClick={() => setFreelancerFilter("declined")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                freelancerFilter === "declined" 
                  ? "bg-white text-slate-805 shadow-sm border border-slate-200/50" 
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Declined & Cancelled ({freelancerProposals.filter((p) => p.status === "Declined" || p.status === "Cancelled" || p.contract_status === "Cancelled").length})
            </button>
          </div>

          <div className="relative w-full xl:w-72 shrink-0">
            <input
              type="text"
              value={searchProposalQuery}
              onChange={(e) => setSearchProposalQuery(e.target.value)}
              placeholder="Search proposals..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-805 focus:outline-none focus:border-teal-700 focus:bg-white transition-all shadow-xs"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
        </div>
      )}

      {/* Proposals list */}
      {loadingFreelancerProposals ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Loading your proposals...</p>
        </div>
      ) : freelancerProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-xl p-8 shadow-inner gap-4">
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
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-200 rounded-xl p-8 shadow-sm gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 text-xl">
            <i className="fa-solid fa-filter"></i>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">No proposals found</h3>
            <p className="text-slate-400 text-xs max-w-sm font-semibold">Try switching filter tabs or check your search keyword.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginatedProposals.map((proposal) => {
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
              <div key={proposal.proposal_id} className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 relative overflow-hidden">
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

      {totalProposalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 text-xs font-bold select-none">
          <span className="text-slate-400">
            Showing {(proposalPage - 1) * proposalsPerPage + 1} - {Math.min(proposalPage * proposalsPerPage, filteredFreelancerProposals.length)} of {filteredFreelancerProposals.length} proposals
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setProposalPage(p => Math.max(1, p - 1))}
              disabled={proposalPage === 1}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setProposalPage(p => Math.min(totalProposalPages, p + 1))}
              disabled={proposalPage === totalProposalPages}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
