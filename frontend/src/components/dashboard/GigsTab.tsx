import { API_URL } from "@/config/api";
import React, { useState, useEffect } from "react";
import CustomSelect from "../CustomSelect";
import { useLanguage } from "@/context/LanguageContext";
import CanvasEditor from "../CanvasEditor";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { 
  FiAlertTriangle, FiCheckCircle, FiCheck, FiImage, FiVideo, FiFileText, 
  FiBold, FiItalic, FiList, FiType, FiEye, FiDollarSign, FiClock, FiPlus, 
  FiArrowLeft, FiArrowRight, FiX, FiExternalLink, FiUpload, FiGlobe, FiDownload, FiTrash2
} from "react-icons/fi";
import { createPortal } from "react-dom";

interface GigsTabProps {
  triggerToast: any;
}

export interface FeatureRow {
  name: string;
  type: "checkbox" | "text";
}

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const resolveMediaUrl = (url: string) => {
  if (!url || !url.trim()) return "";
  const trimmed = url.split(",")[0].trim();
  if (trimmed.startsWith("data:")) return trimmed;
  let cleaned = trimmed;
  const base = API_URL.replace(/\/api\/?$/, "");
  if (cleaned.includes("localhost:5000")) {
    cleaned = cleaned.replace(/https?:\/\/localhost:5000/, base);
  }
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }
  return `${base}${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
};

const handleDownloadVideo = async (rawUrl: string, filename = "showcase-video.mp4") => {
  if (!rawUrl || !rawUrl.trim()) return;

  // Clean up URL string (e.g. if multiple URLs are passed as comma separated)
  const cleanUrlStr = rawUrl.split(",")[0].trim();
  if (!cleanUrlStr) return;

  // Resolve relative backend URLs to absolute URLs
  let downloadUrl = cleanUrlStr;
  if (!downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://")) {
    const base = API_URL.replace(/\/api\/?$/, "");
    downloadUrl = `${base}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`;
  }

  const cleanFilename = filename || downloadUrl.split("/").pop()?.split("?")[0] || "showcase-video.mp4";

  try {
    const response = await fetch(downloadUrl, { mode: "cors" });
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.warn("Blob download failed, triggering fallback download/open link:", err);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = cleanFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const GigsTab: React.FC<GigsTabProps> = ({ triggerToast }) => {
  const { formatPrice } = useLanguage();
  const { 
    isCreatingGig, 
    setIsCreatingGig,
    gigs,
    currencies,
    loadingGigs,
    fetchGigs,
    gigCategories,
    gigSubCategories,
    gigAvailableSkills,
    fetchGigSubCategories,
    fetchGigSkills,
    fetchGigCategories,
    fetchCurrencies,
    setGigSubCategories,
    setGigAvailableSkills,
    setActiveTab
  } = useDashboard();

  const [onboardingCheckLoading, setOnboardingCheckLoading] = useState(false);

  const handleCreateGigClick = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      triggerToast("error", "You must be logged in to create a gig.");
      return;
    }

    try {
      setOnboardingCheckLoading(true);
      const res = await fetch(`${API_URL}/users/onboarding-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.hasFreelancerProfile) {
          triggerToast("error", "You have not completed your freelancer profile onboarding. Redirecting...");
          localStorage.setItem("user_role", "freelancer");
          localStorage.setItem("onboarding_role", "freelancer");
          setTimeout(() => {
            setActiveTab("settings");
          }, 2000);
          return;
        }
        if (data.freelancerVettingStatus !== "Approved") {
          triggerToast("error", "Your freelancer profile is pending administrator approval.");
          return;
        }
        
        setIsCreatingGig(true);
      } else {
        triggerToast("error", "Failed to check profile status.");
      }
    } catch (err) {
      triggerToast("error", "Error checking profile status.");
    } finally {
      setOnboardingCheckLoading(false);
    }
  };

  // Gig Form Fields
  const [gigTitle, setGigTitle] = useState("");
  const [gigPaymentType, setGigPaymentType] = useState<"fixed" | "milestone">("fixed");
  const [priceType, setPriceType] = useState<"single" | "range">("single");
  const [gigMinPrice, setGigMinPrice] = useState("");
  const [gigMaxPrice, setGigMaxPrice] = useState("");
  const [gigMilestones, setGigMilestones] = useState<Array<{ title: string; amount: string; description: string }>>([
    { title: "Milestone 1", amount: "", description: "" }
  ]);
  const [gigDescription, setGigDescription] = useState("");
  const [gigPrice, setGigPrice] = useState("");
  const [gigCurrencyId, setGigCurrencyId] = useState("");
  const [gigDeliveryDays, setGigDeliveryDays] = useState("3");
  const [gigRevisions, setGigRevisions] = useState("3");
  const [gigImages, setGigImages] = useState("");
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);

  const handleCanvasSave = async (dataUrl: string) => {
    try {
      const blobRes = await fetch(dataUrl);
      const blob = await blobRes.blob();
      const file = new File([blob], `gig_cover_${Date.now()}.png`, { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      const existing = gigImages ? gigImages.split(",").map((u) => u.trim()).filter(Boolean) : [];
      setGigImages([...existing, data.url].join(", "));
      
      setShowCanvasEditor(false);
      triggerToast("success", "Custom showcase image designed and added successfully!");
    } catch (err: any) {
      console.error("Canvas upload error:", err);
      triggerToast("error", err.message || "Failed to upload designed cover image.");
      setShowCanvasEditor(false);
    }
  };

  const [gigVideoUrl, setGigVideoUrl] = useState("");
  const [gigDocuments, setGigDocuments] = useState("");
  const [gigCategoryId, setGigCategoryId] = useState("");
  const [gigSubCategoryId, setGigSubCategoryId] = useState("");
  const [gigSelectedSkills, setGigSelectedSkills] = useState<number[]>([]);
  const [gigError, setGigError] = useState("");
  const [gigSuccess, setGigSuccess] = useState(false);
  const [gigNegotiation, setGigNegotiation] = useState(false);
  const [gigDiscountPercent, setGigDiscountPercent] = useState("0");
  const [gigPublishing, setGigPublishing] = useState(false);
  const [activeFormStep, setActiveFormStep] = useState(1);
  const [previewHtml, setPreviewHtml] = useState(false);

  // Gig details & edit states
  const [selectedGigForDetails, setSelectedGigForDetails] = useState<any | null>(null);
  const [editingGig, setEditingGig] = useState<any | null>(null);

  const [gigSlug, setGigSlug] = useState("");
  const [isSlugValidating, setIsSlugValidating] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // FAQ & SEO states
  const [gigFaqs, setGigFaqs] = useState<Array<{ q: string; a: string }>>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoImage, setSeoImage] = useState("");
  const [gigAddons, setGigAddons] = useState<Array<{ id: string; title: string; price: string }>>([]);

  // AI Gig Description Generator State
  const [generatingGigDesc, setGeneratingGigDesc] = useState(false);

  const handleGenerateGigDescription = async () => {
    if (!gigTitle.trim()) {
      triggerToast("error", "Please provide a Gig Title first so AI can write a tailored description.");
      return;
    }
    if (!gigCategoryId) {
      triggerToast("error", "Please select a Category first so AI can generate a description.");
      return;
    }
    if (!gigSubCategoryId) {
      triggerToast("error", "Please select a Sub-category first so AI can generate a description.");
      return;
    }
    if (gigSelectedSkills.length === 0) {
      triggerToast("error", "Please select at least one Associated Skill first so AI can generate a description.");
      return;
    }

    setGeneratingGigDesc(true);
    try {
      const token = localStorage.getItem("token");
      const categoryObj = gigCategories.find((c: any) => String(c.category_id) === String(gigCategoryId));
      const subCategoryObj = gigSubCategories.find((s: any) => String(s.sub_category_id) === String(gigSubCategoryId));
      
      const skillsList = gigSelectedSkills.map((id: number) => {
        const skill = gigAvailableSkills.find((s: any) => s.skill_id === id);
        return skill ? skill.skill_name : "";
      }).filter(Boolean);

      const res = await fetch(`${API_URL}/ai/generate-gig-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gigTitle,
          categoryName: categoryObj ? categoryObj.category_name : "",
          subCategoryName: subCategoryObj ? subCategoryObj.sub_category_name : "",
          skills: skillsList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        triggerToast("error", data.error || "Failed to generate gig description.");
        return;
      }

      setGigDescription(data.description || "");
      triggerToast("success", "Gig description generated successfully!");
    } catch (err) {
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setGeneratingGigDesc(false);
    }
  };


  // Custom packages/plans states
  const [usePlans, setUsePlans] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState<"Basic" | "Standard" | "Premium">("Basic");
  const [enabledPlans, setEnabledPlans] = useState<{ Standard: boolean; Premium: boolean }>({ Standard: true, Premium: true });
  const [gigPlans, setGigPlans] = useState<Array<{
    name: string;
    title: string;
    description: string;
    delivery_days: string;
    revisions: string;
    price: string;
    features: Record<string, boolean | string>;
  }>>([
    {
      name: "Basic",
      title: "",
      description: "",
      delivery_days: "3",
      revisions: "3",
      price: "",
      features: {}
    },
    {
      name: "Standard",
      title: "",
      description: "",
      delivery_days: "5",
      revisions: "5",
      price: "",
      features: {}
    },
    {
      name: "Premium",
      title: "",
      description: "",
      delivery_days: "7",
      revisions: "7",
      price: "",
      features: {}
    }
  ]);


  const [featureRows, setFeatureRows] = useState<FeatureRow[]>([
    { name: "Functional website", type: "checkbox" },
    { name: "Responsive design", type: "checkbox" },
    { name: "Content upload", type: "checkbox" }
  ]);

  const updatePlanField = (planName: "Basic" | "Standard" | "Premium", field: string, value: any) => {
    setGigPlans(prev => prev.map(p => {
      if (p.name === planName) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const updatePlanFeature = (planName: string, featureName: string, value: boolean | string) => {
    setGigPlans(prev => prev.map(p => {
      if (p.name === planName) {
        return {
          ...p,
          features: {
            ...p.features,
            [featureName]: value
          }
        };
      }
      return p;
    }));
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

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingGig && gigTitle) {
      setGigSlug(slugifyText(gigTitle));
    }
  }, [gigTitle, editingGig]);

  // Live validation of slug
  useEffect(() => {
    if (!gigSlug.trim()) {
      setSlugAvailable(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        setIsSlugValidating(true);
        const res = await fetch(`${API_URL}/freelancer/client/gigs/validate-slug?slug=${encodeURIComponent(gigSlug)}&excludeGigId=${editingGig?.gig_id || ""}`);
        if (res.ok) {
          const data = await res.json();
          setSlugAvailable(data.available);
        }
      } catch (err) {
        console.error("Error validating slug", err);
      } finally {
        setIsSlugValidating(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [gigSlug, editingGig]);

  // Gig creation upload states
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadingSeoImage, setUploadingSeoImage] = useState(false);

  // Upload API query helper
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingImages(true);
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (!file.type.startsWith("image/")) {
          triggerToast("error", `Only image files are allowed for showcase images. Blocked file: ${file.name}`);
          setUploadingImages(false);
          return;
        }
        const url = await uploadFile(file);
        urls.push(url);
      }
      const existing = gigImages ? gigImages.split(",").map((u) => u.trim()).filter(Boolean) : [];
      setGigImages([...existing, ...urls].join(", "));
      triggerToast("success", "Images uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingVideo(true);
      const file = e.target.files[0];
      if (!file.type.startsWith("video/")) {
        triggerToast("error", `Only video files are allowed for showcase video. Blocked file: ${file.name}`);
        setUploadingVideo(false);
        return;
      }
      const url = await uploadFile(file);
      setGigVideoUrl(url);
      triggerToast("success", "Video uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSeoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingSeoImage(true);
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        triggerToast("error", `Only image files are allowed for SEO social preview. Blocked file: ${file.name}`);
        setUploadingSeoImage(false);
        return;
      }
      const url = await uploadFile(file);
      setSeoImage(url);
      triggerToast("success", "SEO social preview image uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload SEO image");
    } finally {
      setUploadingSeoImage(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingDocs(true);
      const allowedExtensions = /(\.pdf|\.doc|\.docx|\.txt|\.zip)$/i;
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (!allowedExtensions.exec(file.name)) {
          triggerToast("error", `Only PDF, Word, Text, and Zip files are allowed for documents. Blocked file: ${file.name}`);
          setUploadingDocs(false);
          return;
        }
        const url = await uploadFile(file);
        urls.push(url);
      }
      const existing = gigDocuments ? gigDocuments.split(",").map((u) => u.trim()).filter(Boolean) : [];
      setGigDocuments([...existing, ...urls].join(", "));
      triggerToast("success", "Documents uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  };

  // Form Field Change Handlers
  const handleGigCategoryChange = (catId: string) => {
    if (catId === gigCategoryId) return;
    setGigCategoryId(catId);
    setGigSubCategoryId("");
    setGigSelectedSkills([]);
    setGigAvailableSkills([]);
    if (catId) {
      fetchGigSubCategories(catId);
    }
  };

  const handleGigSubCategoryChange = (subCatId: string) => {
    if (subCatId === gigSubCategoryId) return;
    setGigSubCategoryId(subCatId);
    setGigSelectedSkills([]);
    if (subCatId) {
      fetchGigSkills(subCatId);
    } else {
      setGigAvailableSkills([]);
    }
  };

  const handleGigToggleSkill = (skillId: number) => {
    setGigSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const insertFormat = (tag: string) => {
    const textarea = document.getElementById("gig-description-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    let replacement = "";
    if (tag === "bold") replacement = `<strong>${selected || "bold text"}</strong>`;
    else if (tag === "italic") replacement = `<em>${selected || "italic text"}</em>`;
    else if (tag === "bullet") replacement = `\n<ul>\n  <li>${selected || "bullet item"}</li>\n</ul>\n`;
    else if (tag === "number") replacement = `\n<ol>\n  <li>${selected || "numbered item"}</li>\n</ol>\n`;
    else if (tag === "heading") replacement = `<h3>${selected || "Heading"}</h3>`;
    
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setGigDescription(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const scrollToAndFocus = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }, 100);
  };

  const validateStep1 = () => {
    if (!gigTitle.trim()) {
      setGigError("Gig Title is required.");
      scrollToAndFocus("gig-title-input");
      return false;
    }
    if (!gigSlug.trim()) {
      setGigError("Custom URL Slug is required.");
      scrollToAndFocus("gig-slug-input");
      return false;
    }
    if (!gigCategoryId) {
      setGigError("Please select a Category.");
      scrollToAndFocus("gig-category-select");
      return false;
    }
    if (!gigSubCategoryId) {
      setGigError("Please select a Sub-category.");
      scrollToAndFocus("gig-subcategory-select");
      return false;
    }
    if (gigSelectedSkills.length === 0) {
      setGigError("Please select at least one associated skill.");
      scrollToAndFocus("gig-skills-container");
      return false;
    }
    setGigError("");
    return true;
  };

  const validateStep2 = () => {
    if (!gigCurrencyId) {
      if (currencies && currencies.length > 0) {
        const defaultCurr = currencies.find((c: any) => c.code === "USD") || currencies[0];
        if (defaultCurr) {
          setGigCurrencyId(defaultCurr.currency_id.toString());
        }
      } else {
        setGigCurrencyId("1");
      }
    }
    if (gigPaymentType === "fixed") {
      if (usePlans) {
        for (let i = 0; i < gigPlans.length; i++) {
          const p = gigPlans[i];
          const isPlanEnabled = p.name === "Basic" || (p.name === "Standard" ? enabledPlans.Standard : enabledPlans.Premium);
          if (isPlanEnabled) {
            if (!p.title.trim()) {
              setGigError(`Please enter a Custom Title for the ${p.name} package.`);
              setActivePlanTab(p.name as "Basic" | "Standard" | "Premium");
              scrollToAndFocus(`plan-title-${p.name}`);
              return false;
            }
            if (!p.description.trim()) {
              setGigError(`Please enter a Tagline/Description for the ${p.name} package.`);
              setActivePlanTab(p.name as "Basic" | "Standard" | "Premium");
              scrollToAndFocus(`plan-desc-${p.name}`);
              return false;
            }
            if (!p.price || parseFloat(p.price) <= 0) {
              setGigError(`Please enter a valid price greater than 0 for the ${p.name} package.`);
              setActivePlanTab(p.name as "Basic" | "Standard" | "Premium");
              scrollToAndFocus(`plan-price-${p.name}`);
              return false;
            }
            if (!p.delivery_days || parseInt(p.delivery_days) <= 0) {
              setGigError(`Please enter valid delivery days greater than 0 for the ${p.name} package.`);
              setActivePlanTab(p.name as "Basic" | "Standard" | "Premium");
              scrollToAndFocus(`plan-days-${p.name}`);
              return false;
            }
            if (!p.revisions || parseInt(p.revisions) < 1) {
              setGigError(`Please enter revisions greater than or equal to 1 for the ${p.name} package.`);
              setActivePlanTab(p.name as "Basic" | "Standard" | "Premium");
              scrollToAndFocus(`plan-revisions-${p.name}`);
              return false;
            }
          }
        }
      } else {
        if (priceType === "single") {
          if (!gigPrice || parseFloat(gigPrice) <= 0) {
            setGigError("Please enter a valid price greater than 0.");
            scrollToAndFocus("gig-price-input");
            return false;
          }
        } else {
          if (!gigMinPrice || parseFloat(gigMinPrice) <= 0) {
            setGigError("Please enter a valid minimum price greater than 0.");
            scrollToAndFocus("gig-minprice-input");
            return false;
          }
          if (!gigMaxPrice || parseFloat(gigMaxPrice) <= 0) {
            setGigError("Please enter a valid maximum price greater than 0.");
            scrollToAndFocus("gig-maxprice-input");
            return false;
          }
          if (parseFloat(gigMaxPrice) < parseFloat(gigMinPrice)) {
            setGigError("Maximum price cannot be less than minimum price.");
            scrollToAndFocus("gig-maxprice-input");
            return false;
          }
        }
      }
    } else {
      if (gigMilestones.length === 0) {
        setGigError("Please add at least one milestone.");
        scrollToAndFocus("gig-add-milestone-btn");
        return false;
      }
      for (let i = 0; i < gigMilestones.length; i++) {
        const m = gigMilestones[i];
        if (!m.title.trim()) {
          setGigError(`Please enter a title for Milestone #${i + 1}.`);
          scrollToAndFocus(`milestone-title-${i}`);
          return false;
        }
        if (!m.amount || parseFloat(m.amount) <= 0) {
          setGigError(`Please enter a valid amount greater than 0 for Milestone #${i + 1}.`);
          scrollToAndFocus(`milestone-amount-${i}`);
          return false;
        }
      }
    }
    if (!usePlans) {
      if (!gigDeliveryDays || parseInt(gigDeliveryDays) <= 0) {
        setGigError("Please enter valid delivery days greater than 0.");
        scrollToAndFocus("gig-delivery-days-input");
        return false;
      }
      if (!gigRevisions || parseInt(gigRevisions) < 1) {
        setGigError("Revisions must be greater than or equal to 1.");
        scrollToAndFocus("gig-revisions-input");
        return false;
      }
    }
    setGigError("");
    return true;
  };

  const handleCreateGigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGigError("");
    setGigSuccess(false);

    if (!validateStep1()) {
      setActiveFormStep(1);
      return;
    }

    if (!validateStep2()) {
      setActiveFormStep(2);
      return;
    }

    if (!gigImages.trim()) {
      setGigError("Please upload or paste at least one Showcase Image.");
      scrollToAndFocus("gig-images-input");
      return;
    }

    if (!gigDescription.trim()) {
      setGigError("Gig Description is required.");
      scrollToAndFocus("gig-description-textarea");
      return;
    }

    const activePlans = [
      gigPlans[0],
      ...(enabledPlans.Standard ? [gigPlans[1]] : []),
      ...(enabledPlans.Premium ? [gigPlans[2]] : [])
    ];

    try {
      setGigPublishing(true);
      const token = localStorage.getItem("token");
      const url = editingGig 
        ? `${API_URL}/freelancer/gigs/${editingGig.gig_id}`
        : `${API_URL}/freelancer/gigs`;
      const method = editingGig ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_id: gigCategoryId ? parseInt(gigCategoryId) : null,
          sub_category_id: gigSubCategoryId ? parseInt(gigSubCategoryId) : null,
          title: gigTitle.trim(),
          description: gigDescription.trim(),
          price: usePlans ? parseFloat(gigPlans[0].price) || 0 : parseFloat(gigPrice) || 0,
          currency_id: parseInt(gigCurrencyId),
          delivery_days: usePlans ? parseInt(gigPlans[0].delivery_days) || 3 : parseInt(gigDeliveryDays),
          revisions: usePlans ? parseInt(gigPlans[0].revisions) || 3 : (gigRevisions ? parseInt(gigRevisions) : null),
          images: gigImages ? gigImages.split(",").map((url) => url.trim()) : [],
          video_url: gigVideoUrl.trim() || null,
          documents: gigDocuments ? gigDocuments.split(",").map((url) => url.trim()) : [],
          skills: gigSelectedSkills,
          negotiation: gigNegotiation,
          discount_percent: parseFloat(gigDiscountPercent) || 0,
          payment_type: gigPaymentType,
          min_price: gigPaymentType === "fixed" && priceType === "range" ? parseFloat(gigMinPrice) : null,
          max_price: gigPaymentType === "fixed" && priceType === "range" ? parseFloat(gigMaxPrice) : null,
          milestones: gigPaymentType === "milestone" ? gigMilestones : null,
          slug: gigSlug,
          plans: usePlans ? activePlans : null,
          faqs: gigFaqs,
          addons: gigAddons,
          seo: {
            title: seoTitle.trim(),
            description: seoDescription.trim(),
            image: seoImage.trim()
          }
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGigSuccess(true);
        // Reset form
        setGigTitle("");
        setGigSlug("");
        setGigDescription("");
        setGigPrice("");
        setGigDeliveryDays("3");
        setGigRevisions("3");
        setGigImages("");
        setGigVideoUrl("");
        setGigDocuments("");
        setGigCategoryId("");
        setGigSubCategoryId("");
        setGigSelectedSkills([]);
        setGigNegotiation(false);
        setGigDiscountPercent("0");
        setGigPaymentType("fixed");
        setPriceType("single");
        setGigMinPrice("");
        setGigFaqs([]);
        setGigAddons([]);
        setSeoTitle("");
        setSeoDescription("");
        setSeoImage("");
        setGigMaxPrice("");
        setGigMilestones([{ title: "Milestone 1", amount: "", description: "" }]);
        setUsePlans(false);
        setEnabledPlans({ Standard: true, Premium: true });
        setActivePlanTab("Basic");
        setGigPlans([
          {
            name: "Basic",
            title: "",
            description: "",
            delivery_days: "3",
            revisions: "3",
            price: "",
            features: {}
          },
          {
            name: "Standard",
            title: "",
            description: "",
            delivery_days: "5",
            revisions: "5",
            price: "",
            features: {}
          },
          {
            name: "Premium",
            title: "",
            description: "",
            delivery_days: "7",
            revisions: "7",
            price: "",
            features: {}
          }
        ]);
        setFeatureRows([
          { name: "Functional website", type: "checkbox" },
          { name: "Responsive design", type: "checkbox" },
          { name: "Content upload", type: "checkbox" }
        ]);
        setEditingGig(null);
        
        // Return to listing
        setTimeout(() => {
          setIsCreatingGig(false);
          setGigSuccess(false);
          setActiveFormStep(1);
          fetchGigs();
        }, 1500);
      } else {
        setGigError(data.message || "Failed to publish service gig.");
      }
    } catch (err: any) {
      setGigError("Network error. Please try again.");
    } finally {
      setGigPublishing(false);
    }
  };

  useEffect(() => {
    fetchGigs();
    fetchCurrencies();
    fetchGigCategories();
  }, []);

  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState("USD");
  const [defaultCurrencyId, setDefaultCurrencyId] = useState("1");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const defSetting = data.find((s: any) => s.setting_key === "default_currency");
          if (defSetting) {
            let val = defSetting.setting_value;
            if (typeof val === "string") {
              try { val = JSON.parse(val); } catch {}
            }
            if (val?.code) {
              setDefaultCurrencyCode(val.code);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load settings in GigsTab:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (currencies && currencies.length > 0) {
      const match = currencies.find((c: any) => c.code === defaultCurrencyCode);
      if (match) {
        setDefaultCurrencyId(match.currency_id.toString());
        if (!gigCurrencyId) {
          setGigCurrencyId(match.currency_id.toString());
        }
      } else if (!gigCurrencyId) {
        const defaultCurr = currencies.find((c: any) => c.code === "USD") || currencies[0];
        if (defaultCurr) {
          setGigCurrencyId(defaultCurr.currency_id.toString());
        }
      }
    }
  }, [currencies, defaultCurrencyCode, gigCurrencyId]);

  const isStep1Valid = () => {
    return !!gigTitle.trim() && 
           !!gigSlug.trim() && 
           !!gigCategoryId && 
           !!gigSubCategoryId && 
           gigSelectedSkills.length > 0;
  };

  const isStep2Valid = () => {
    if (gigPaymentType === "fixed") {
      if (usePlans) {
        for (let i = 0; i < gigPlans.length; i++) {
          const p = gigPlans[i];
          const isPlanEnabled = p.name === "Basic" || (p.name === "Standard" ? enabledPlans.Standard : enabledPlans.Premium);
          if (isPlanEnabled) {
            if (!p.title.trim() || 
                !p.description.trim() || 
                !p.price || 
                parseFloat(p.price) <= 0 || 
                !p.delivery_days || 
                parseInt(p.delivery_days) <= 0 || 
                !p.revisions || 
                parseInt(p.revisions) < 1) {
              return false;
            }
          }
        }
      } else {
        if (priceType === "single") {
          if (!gigPrice || parseFloat(gigPrice) <= 0) return false;
        } else {
          if (!gigMinPrice || parseFloat(gigMinPrice) <= 0) return false;
          if (!gigMaxPrice || parseFloat(gigMaxPrice) <= 0) return false;
          if (parseFloat(gigMaxPrice) < parseFloat(gigMinPrice)) return false;
        }
      }
    } else {
      if (gigMilestones.length === 0) return false;
      for (const m of gigMilestones) {
        if (!m.title.trim() || !m.amount || parseFloat(m.amount) <= 0) return false;
      }
    }
    if (!usePlans) {
      if (!gigDeliveryDays || parseInt(gigDeliveryDays) <= 0) return false;
      if (!gigRevisions || parseInt(gigRevisions) < 1) return false;
    }
    return true;
  };

  const isStep3Valid = () => {
    return !!gigDescription.trim() && !!gigImages.trim();
  };

  const isStepCompleted = (num: number) => {
    if (num === 1) return isStep1Valid();
    if (num === 2) return isStep2Valid();
    if (num === 3) return isStep3Valid();
    return false;
  };

  const activeCurrencySymbol = "$";

  return (
    <>
      {isCreatingGig ? (
      <div className="relative z-10 max-w-3xl mx-auto w-full animate-fadeIn text-left">
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 text-slate-800">
          
          {/* Form Header */}
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm shrink-0">
                <i className="fa-solid fa-briefcase"></i>
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  {editingGig ? `Edit Gig Settings` : `Create a Service Gig`}
                </h2>
                <p className="text-slate-404 text-xs mt-0.5">
                  {editingGig ? `Update your service pricing, showcases, or descriptions.` : `Package your expert skills into a purchaseable service.`}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsCreatingGig(false);
                setEditingGig(null);
                setGigError("");
                setActiveFormStep(1);
                setGigAddons([]);
              }}
              className="text-xs font-bold text-slate-505 hover:text-slate-855 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-200 hover:bg-slate-200/60 whitespace-nowrap shrink-0"
              style={{ whiteSpace: 'nowrap' }}
            >
              ← Back to Gigs
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleCreateGigSubmit} className="flex flex-col gap-4">
            
            {gigError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-650 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <FiAlertTriangle className="w-4 h-4 shrink-0" />
                <span>{gigError}</span>
              </div>
            )}
            {gigSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-650 text-xs font-bold rounded-xl animate-pulse flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  {editingGig ? "Service Gig updated successfully! Redirecting..." : "Service Gig published successfully! Redirecting..."}
                </span>
              </div>
            )}


            {/* Step progress bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-4 w-full gap-2 sm:gap-4">
              {[
                { num: 1, label: "Overview", desc: "Basic details & skills" },
                { num: 2, label: "Pricing & Logistics", desc: "Rates & delivery days" },
                { num: 3, label: "Media & Description", desc: "Showcases & service info" }
              ].map((s, idx, arr) => {
                const completed = isStepCompleted(s.num);
                const isActive = activeFormStep === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <button
                      type="button"
                      onClick={() => setActiveFormStep(s.num)}
                      className="flex items-center gap-2.5 shrink-0 cursor-pointer bg-transparent border-0 outline-none p-0 text-slate-800 transition-opacity hover:opacity-85 select-none"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isActive
                          ? "bg-primary text-white ring-4 ring-primary/20 font-black"
                          : completed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-150 text-slate-400"
                      }`}>
                        {completed && !isActive ? "✓" : s.num}
                      </div>
                      <div className="hidden md:flex flex-col text-left">
                        <span className={`text-xs font-extrabold leading-none ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                          {s.label}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{s.desc}</span>
                      </div>
                    </button>
                    {idx < arr.length - 1 && (
                      <div className={`flex-1 h-0.5 min-w-[20px] transition-all duration-300 ${
                        activeFormStep > s.num ? "bg-primary" : "bg-slate-200"
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* STEP 1: GIG OVERVIEW */}
            {activeFormStep === 1 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                {/* Gig Title */}
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-655">Gig Title *</label>
                  <input
                    id="gig-title-input"
                    type="text"
                    placeholder="e.g. I will build a premium responsive Next.js landing page"
                    value={gigTitle}
                    onChange={(e) => setGigTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Gig Slug (Custom URL identifier) */}
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-655">Custom URL Slug *</label>
                  <div className="flex items-center bg-slate-50/50 border border-slate-250 hover:border-slate-350 focus-within:border-primary/50 focus-within:bg-white rounded-xl overflow-hidden transition-all relative">
                    <span className="bg-slate-100 text-slate-450 border-r border-slate-250 px-3.5 py-3 text-xxs font-extrabold select-none shrink-0">
                      {typeof window !== "undefined"
                        ? (process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin)
                            .replace(/^(https?:\/\/)?(www\.)?/, "") + "/gigs/"
                        : "lancerflow.net/gigs/"}
                    </span>
                    <div className="relative flex-grow">
                      <input
                        id="gig-slug-input"
                        type="text"
                        placeholder="custom-url-identifier"
                        value={gigSlug}
                        onChange={(e) => setGigSlug(slugifyText(e.target.value))}
                        className="w-full bg-transparent px-4 py-3 text-xs focus:outline-none font-bold border-none outline-none pr-10"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                        {isSlugValidating && (
                          <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        )}
                        {!isSlugValidating && slugAvailable === true && (
                          <span className="text-emerald-600 text-xs font-black" title="Slug is available">✓</span>
                        )}
                        {!isSlugValidating && slugAvailable === false && (
                          <span className="text-rose-500 text-xs font-black" title="Slug is already taken">✗</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {slugAvailable === true && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ URL slug is available!</p>
                  )}
                  {slugAvailable === false && (
                    <p className="text-[10px] text-rose-500 font-bold mt-1">✗ Slug is already taken by another service.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-650">Category *</label>
                    <div id="gig-category-select">
                      <CustomSelect
                        options={gigCategories.map((c) => ({ value: c.category_id.toString(), label: c.category_name }))}
                        value={gigCategoryId}
                        onChange={handleGigCategoryChange}
                        placeholder="Select Category"
                      />
                    </div>
                  </div>

                  {/* Subcategory Selection */}
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-650">Sub-category *</label>
                    <div id="gig-subcategory-select">
                      <CustomSelect
                        options={gigSubCategories.map((sc) => ({ value: sc.sub_category_id.toString(), label: sc.sub_category_name }))}
                        value={gigSubCategoryId}
                        onChange={handleGigSubCategoryChange}
                        placeholder="Select Subcategory"
                        disabled={!gigCategoryId}
                      />
                    </div>
                  </div>
                </div>

                {/* Skills tags selection */}
                <div>
                  <label className="text-xs font-bold block mb-2 text-slate-655">Associated Skills *</label>
                  {gigAvailableSkills.length > 0 ? (
                    <div id="gig-skills-container" className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3.5 bg-slate-50 border border-slate-200 rounded-xl no-scrollbar">
                      {gigAvailableSkills.map((skill) => {
                        const isChecked = gigSelectedSkills.includes(skill.skill_id);
                        return (
                          <button
                            type="button"
                            key={skill.skill_id}
                            onClick={() => handleGigToggleSkill(skill.skill_id)}
                            className={`px-3 py-1.5 rounded-lg text-xxs font-extrabold transition-all border cursor-pointer select-none ${
                              isChecked
                                ? "bg-primary border-primary text-white"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-350"
                            }`}
                          >
                            {skill.skill_name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium bg-slate-50/50">
                      Select category and sub-category to load matching skill tags.
                    </div>
                  )}
                </div>

                {/* Step 1 Footer */}
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) {
                      setActiveFormStep(2);
                    }
                  }}
                  className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 self-end hover:scale-[1.02] active:scale-95 mt-2 whitespace-nowrap"
                >
                  <span>Continue to Pricing</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STEP 2: PRICING & LOGISTICS */}
            {activeFormStep === 2 && (
              <div className="flex flex-col gap-4 animate-fadeIn text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Type Selection */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold block mb-2 text-slate-655">Payment Structure *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGigPaymentType("fixed")}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          gigPaymentType === "fixed"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-350 text-slate-500"
                        }`}
                      >
                        <FiDollarSign className="w-5 h-5" />
                        <span className="text-xs font-black">Fixed Amount</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Single price or budget range</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGigPaymentType("milestone")}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          gigPaymentType === "milestone"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-350 text-slate-500"
                        }`}
                      >
                        <FiCheckCircle className="w-5 h-5" />
                        <span className="text-xs font-black">Milestone-based</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Multiple payment checkpoints</span>
                      </button>
                    </div>
                  </div>

                  {/* Pricing Options */}
                  {gigPaymentType === "fixed" && (
                    <div className="sm:col-span-2 flex flex-col gap-4 bg-slate-50/50 border border-slate-200/60 rounded-xl p-5">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div>
                          <label className="text-xs font-black block text-slate-800">Tiered Pricing Packages</label>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Enable Fiverr-style packages or offer a single fixed price.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(usePlans)}
                            onChange={(e) => {
                              setUsePlans(e.target.checked);
                              if (e.target.checked) {
                                // Default first plan price to the single price if it's set
                                if (gigPrice) {
                                  setGigPlans(prev => prev.map((p, idx) => idx === 0 ? { ...p, price: gigPrice } : p));
                                }
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="relative w-9 h-5 bg-slate-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          <span className="ml-2 text-xs font-bold text-slate-700">Tiered Packages</span>
                        </label>
                      </div>

                      {!usePlans ? (
                        /* SINGLE PACKAGES & RANGES (DEFAULT FLOW) */
                        <div className="flex flex-col gap-4">
                          <div>
                            <label className="text-xs font-bold block mb-2 text-slate-655">Pricing Mode</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                onClick={() => setPriceType("single")}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                                  priceType === "single"
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-350"
                                }`}
                              >
                                Single Fixed Price
                              </button>
                              <button
                                type="button"
                                onClick={() => setPriceType("range")}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                                  priceType === "range"
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-350"
                                }`}
                              >
                                Budget Range (Min/Max)
                              </button>
                            </div>
                          </div>

                          {priceType === "single" ? (
                            <div>
                              <label className="text-xs font-bold block mb-1 text-slate-655">Fixed Price *</label>
                              <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-primary transition duration-150 overflow-hidden">
                                <span className="bg-slate-50 border-r border-slate-200 px-3.5 py-2.5 text-xs text-slate-450 font-bold select-none">{activeCurrencySymbol}</span>
                                <input
                                  id="gig-price-input"
                                  type="number"
                                  placeholder="e.g. 150"
                                  value={gigPrice}
                                  onChange={(e) => setGigPrice(e.target.value)}
                                  className="w-full bg-transparent border-none px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-0"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-bold block mb-1 text-slate-655">Minimum Price *</label>
                                <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-primary transition duration-150 overflow-hidden">
                                  <span className="bg-slate-50 border-r border-slate-200 px-3.5 py-2.5 text-xs text-slate-450 font-bold select-none">{activeCurrencySymbol}</span>
                                  <input
                                    id="gig-minprice-input"
                                    type="number"
                                    placeholder="e.g. 100"
                                    value={gigMinPrice}
                                    onChange={(e) => {
                                      setGigMinPrice(e.target.value);
                                      setGigPrice(e.target.value);
                                    }}
                                    className="w-full bg-transparent border-none px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-0"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold block mb-1 text-slate-655">Maximum Price *</label>
                                <div className="flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-primary transition duration-150 overflow-hidden">
                                  <span className="bg-slate-50 border-r border-slate-200 px-3.5 py-2.5 text-xs text-slate-450 font-bold select-none">{activeCurrencySymbol}</span>
                                  <input
                                    id="gig-maxprice-input"
                                    type="number"
                                    placeholder="e.g. 500"
                                    value={gigMaxPrice}
                                    onChange={(e) => setGigMaxPrice(e.target.value)}
                                    className="w-full bg-transparent border-none px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-0"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* TIERED PLANS / PACKAGES CONFLICT (FIVERR FLOW) */
                        <div className="flex flex-col gap-4 animate-fadeIn">
                          {/* Plan Toggles / Packages Selectors */}
                          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white border border-slate-200 p-4 rounded-xl">
                            <div className="flex flex-wrap gap-2">
                              {(["Basic", "Standard", "Premium"] as const).map((tab) => {
                                const isTabEnabled = tab === "Basic" || (tab === "Standard" ? enabledPlans.Standard : enabledPlans.Premium);
                                const pIdx = tab === "Basic" ? 0 : tab === "Standard" ? 1 : 2;
                                const plan = gigPlans[pIdx];
                                const label = plan?.title?.trim() ? plan.title : `${tab} Package`;
                                return (
                                  <button
                                    type="button"
                                    key={tab}
                                    onClick={() => isTabEnabled && setActivePlanTab(tab)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer select-none border ${
                                      !isTabEnabled
                                        ? "bg-slate-100 border-slate-100 text-slate-350 cursor-not-allowed opacity-50"
                                        : activePlanTab === tab
                                          ? "bg-primary border-primary text-white shadow-sm"
                                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={enabledPlans.Standard}
                                  onChange={(e) => {
                                    setEnabledPlans(prev => ({ ...prev, Standard: e.target.checked }));
                                    if (!e.target.checked && activePlanTab === "Standard") {
                                      setActivePlanTab("Basic");
                                    }
                                  }}
                                  className="rounded border-slate-300 text-primary w-4 h-4 cursor-pointer"
                                />
                                <span>Standard</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={enabledPlans.Premium}
                                  onChange={(e) => {
                                    setEnabledPlans(prev => ({ ...prev, Premium: e.target.checked }));
                                    if (!e.target.checked && activePlanTab === "Premium") {
                                      setActivePlanTab("Basic");
                                    }
                                  }}
                                  className="rounded border-slate-300 text-primary w-4 h-4 cursor-pointer"
                                />
                                <span>Premium</span>
                              </label>
                            </div>
                          </div>

                          {/* Selected Plan Details Form */}
                          {(() => {
                            const pIndex = activePlanTab === "Basic" ? 0 : activePlanTab === "Standard" ? 1 : 2;
                            const p = gigPlans[pIndex];
                            return (
                              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Configure {activePlanTab} Package
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {/* Package custom title */}
                                  <div className="sm:col-span-2">
                                    <label className="text-xs font-bold block mb-1 text-slate-655">Package Title / Custom Name *</label>
                                    <input
                                      id={`plan-title-${activePlanTab}`}
                                      type="text"
                                      placeholder={`e.g. ${activePlanTab} Package`}
                                      value={p.title}
                                      onChange={(e) => updatePlanField(activePlanTab, "title", e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                                    />
                                  </div>

                                  {/* Package description/tagline */}
                                  <div className="sm:col-span-2">
                                    <label className="text-xs font-bold block mb-1 text-slate-655">Package Tagline / Description *</label>
                                    <input
                                      id={`plan-desc-${activePlanTab}`}
                                      type="text"
                                      placeholder="e.g. Starter Store Setup with homepage & shop"
                                      value={p.description}
                                      onChange={(e) => updatePlanField(activePlanTab, "description", e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                                    />
                                  </div>

                                  {/* Price */}
                                  <div>
                                    <label className="text-xs font-bold block mb-1 text-slate-655">Package Price *</label>
                                    <div className="flex items-center bg-slate-5 border border-slate-200 rounded-xl focus-within:border-primary transition duration-150 overflow-hidden">
                                      <span className="bg-slate-100/80 border-r border-slate-200 px-3.5 py-2.5 text-xs text-slate-450 font-bold select-none">{activeCurrencySymbol}</span>
                                      <input
                                        id={`plan-price-${activePlanTab}`}
                                        type="number"
                                        placeholder="e.g. 95"
                                        value={p.price}
                                        onChange={(e) => {
                                          updatePlanField(activePlanTab, "price", e.target.value);
                                          // Keep main price sync to Basic plan price for database backward compatibility
                                          if (activePlanTab === "Basic") {
                                            setGigPrice(e.target.value);
                                          }
                                        }}
                                        className="w-full bg-transparent border-none px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-0 font-bold"
                                      />
                                    </div>
                                  </div>

                                  {/* Delivery Days */}
                                  <div>
                                    <label className="text-xs font-bold block mb-1 text-slate-655">Delivery Time (Days) *</label>
                                    <input
                                      id={`plan-days-${activePlanTab}`}
                                      type="number"
                                      min="1"
                                      placeholder="e.g. 3"
                                      value={p.delivery_days}
                                      onChange={(e) => {
                                        updatePlanField(activePlanTab, "delivery_days", e.target.value);
                                        if (activePlanTab === "Basic") {
                                          setGigDeliveryDays(e.target.value);
                                        }
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                                    />
                                  </div>

                                  {/* Revisions */}
                                  <div>
                                    <label className="text-xs font-bold block mb-1 text-slate-655">Revisions *</label>
                                    <input
                                      id={`plan-revisions-${activePlanTab}`}
                                      type="number"
                                      min="1"
                                      placeholder="e.g. 3"
                                      value={p.revisions}
                                      onChange={(e) => {
                                        updatePlanField(activePlanTab, "revisions", e.target.value);
                                        if (activePlanTab === "Basic") {
                                          setGigRevisions(e.target.value);
                                        }
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Custom Features Matrix */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 mt-2">
                            <div>
                              <span className="text-xs font-black text-slate-800">Customize Included Features Matrix</span>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Add features and choose whether they are included (checkmark) or set a specific text value for each plan.</p>
                            </div>

                            <div className="overflow-x-auto -mx-1 px-1 pb-2">
                              <table className="w-full min-w-[520px] text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                                    <th className="pb-2 pr-4 min-w-[150px]">Feature Name</th>
                                    <th className="pb-2 pr-4 w-[110px] min-w-[110px]">Type</th>
                                    <th className="pb-2 pr-4 text-center w-[75px] min-w-[75px]">Basic</th>
                                    {enabledPlans.Standard && <th className="pb-2 pr-4 text-center w-[75px] min-w-[75px]">Standard</th>}
                                    {enabledPlans.Premium && <th className="pb-2 pr-4 text-center w-[75px] min-w-[75px]">Premium</th>}
                                    <th className="pb-2 w-[40px]"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {featureRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 pr-4 min-w-[150px]">
                                        <input
                                          type="text"
                                          placeholder="e.g. Speed Optimization"
                                          value={row.name}
                                          onChange={(e) => {
                                            const oldName = row.name;
                                            const newName = e.target.value;
                                            setFeatureRows(prev => prev.map((r, i) => i === idx ? { ...r, name: newName } : r));
                                            
                                            // Rename keys in gigPlans features map
                                            setGigPlans(prev => prev.map(p => {
                                              const newFeatures = { ...p.features };
                                              if (oldName in newFeatures) {
                                                const val = newFeatures[oldName];
                                                delete newFeatures[oldName];
                                                newFeatures[newName] = val;
                                              } else {
                                                newFeatures[newName] = row.type === "checkbox" ? false : "";
                                              }
                                              return { ...p, features: newFeatures };
                                            }));
                                          }}
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none"
                                        />
                                      </td>
                                      <td className="py-2.5 pr-4 min-w-[110px]">
                                        <select
                                          value={row.type}
                                          onChange={(e) => {
                                            const newType = e.target.value as "checkbox" | "text";
                                            setFeatureRows(prev => prev.map((r, i) => i === idx ? { ...r, type: newType } : r));
                                            
                                            // Reset values in gigPlans
                                            setGigPlans(prev => prev.map(p => ({
                                              ...p,
                                              features: {
                                                ...p.features,
                                                [row.name]: newType === "checkbox" ? false : ""
                                              }
                                            })));
                                          }}
                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xxs font-bold text-slate-600 focus:outline-none cursor-pointer"
                                        >
                                          <option value="checkbox">Yes / No</option>
                                          <option value="text">Custom Text</option>
                                        </select>
                                      </td>
                                      
                                      {/* Basic Input */}
                                      <td className="py-2.5 pr-4 text-center">
                                        {row.type === "checkbox" ? (
                                          <input
                                            type="checkbox"
                                            checked={!!gigPlans[0].features[row.name]}
                                            onChange={(e) => updatePlanFeature("Basic", row.name, e.target.checked)}
                                            className="rounded border-slate-300 text-primary w-4.5 h-4.5 cursor-pointer mx-auto"
                                          />
                                        ) : (
                                          <input
                                            type="text"
                                            placeholder="e.g. 5 products"
                                            value={(gigPlans[0].features[row.name] as string) || ""}
                                            onChange={(e) => updatePlanFeature("Basic", row.name, e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xxs focus:outline-none text-center"
                                          />
                                        )}
                                      </td>

                                      {/* Standard Input */}
                                      {enabledPlans.Standard && (
                                        <td className="py-2.5 pr-4 text-center">
                                          {row.type === "checkbox" ? (
                                            <input
                                              type="checkbox"
                                              checked={!!gigPlans[1].features[row.name]}
                                              onChange={(e) => updatePlanFeature("Standard", row.name, e.target.checked)}
                                              className="rounded border-slate-300 text-primary w-4.5 h-4.5 cursor-pointer mx-auto"
                                            />
                                          ) : (
                                            <input
                                              type="text"
                                              placeholder="e.g. 15 products"
                                              value={(gigPlans[1].features[row.name] as string) || ""}
                                              onChange={(e) => updatePlanFeature("Standard", row.name, e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xxs focus:outline-none text-center"
                                            />
                                          )}
                                        </td>
                                      )}

                                      {/* Premium Input */}
                                      {enabledPlans.Premium && (
                                        <td className="py-2.5 pr-4 text-center">
                                          {row.type === "checkbox" ? (
                                            <input
                                              type="checkbox"
                                              checked={!!gigPlans[2].features[row.name]}
                                              onChange={(e) => updatePlanFeature("Premium", row.name, e.target.checked)}
                                              className="rounded border-slate-300 text-primary w-4.5 h-4.5 cursor-pointer mx-auto"
                                            />
                                          ) : (
                                            <input
                                              type="text"
                                              placeholder="e.g. 50 products"
                                              value={(gigPlans[2].features[row.name] as string) || ""}
                                              onChange={(e) => updatePlanFeature("Premium", row.name, e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xxs focus:outline-none text-center"
                                            />
                                          )}
                                        </td>
                                      )}

                                      {/* Remove Row Button */}
                                      <td className="py-2.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nameToRemove = row.name;
                                            setFeatureRows(prev => prev.filter((_, i) => i !== idx));
                                            setGigPlans(prev => prev.map(p => {
                                              const newFeatures = { ...p.features };
                                              delete newFeatures[nameToRemove];
                                              return { ...p, features: newFeatures };
                                            }));
                                          }}
                                          className="text-rose-500 hover:text-rose-750 text-xs font-black cursor-pointer border-0 bg-transparent"
                                        >
                                          ×
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setFeatureRows(prev => [...prev, { name: "", type: "checkbox" }]);
                              }}
                              className="text-xxs font-black text-primary hover:text-primary-hover flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-xl py-2 w-full cursor-pointer hover:bg-slate-100/50 mt-1 transition-all"
                            >
                              + Add Feature Matrix Row
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Milestone Builder */}
                  {gigPaymentType === "milestone" && (
                    <div className="sm:col-span-2 flex flex-col gap-4 bg-slate-50/50 border border-slate-200/60 rounded-xl p-5">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">Define Service Milestones</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Specify tasks and deliverables. The total price of the Gig will be the sum of these milestones.</p>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {gigMilestones.map((m, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 relative">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Milestone #{idx + 1}</span>
                              {gigMilestones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = gigMilestones.filter((_, i) => i !== idx);
                                    setGigMilestones(updated);
                                    const total = updated.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                                    setGigPrice(total.toString());
                                  }}
                                  className="text-rose-550 hover:text-rose-750 text-[10px] font-bold cursor-pointer"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide block mb-1">Title *</label>
                                <input
                                  id={`milestone-title-${idx}`}
                                  type="text"
                                  placeholder="e.g. Initial Wireframes & UX design"
                                  value={m.title}
                                  onChange={(e) => {
                                    const updated = [...gigMilestones];
                                    updated[idx].title = e.target.value;
                                    setGigMilestones(updated);
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-extrabold text-slate-455 uppercase block mb-1">Amount *</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:border-primary transition duration-150 overflow-hidden">
                                  <span className="bg-slate-100 border-r border-slate-200 px-2.5 py-2 text-[10px] text-slate-450 font-bold select-none">{activeCurrencySymbol}</span>
                                  <input
                                    id={`milestone-amount-${idx}`}
                                    type="number"
                                    placeholder="e.g. 100"
                                    value={m.amount}
                                    onChange={(e) => {
                                      const updated = [...gigMilestones];
                                      updated[idx].amount = e.target.value;
                                      setGigMilestones(updated);
                                      const total = updated.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                                      setGigPrice(total.toString());
                                    }}
                                    className="w-full bg-transparent border-none px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-0 font-bold"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide block mb-1">Description (Optional)</label>
                              <textarea
                                rows={2}
                                placeholder="Describe deliverables for this milestone..."
                                value={m.description}
                                onChange={(e) => {
                                  const updated = [...gigMilestones];
                                  updated[idx].description = e.target.value;
                                  setGigMilestones(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-855 focus:border-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        id="gig-add-milestone-btn"
                        type="button"
                        onClick={() => setGigMilestones([...gigMilestones, { title: "", amount: "", description: "" }])}
                        className="text-xs font-bold text-primary hover:text-primary-hover flex items-center justify-center gap-1 bg-white border border-dashed border-primary/30 rounded-xl py-3 w-full cursor-pointer hover:bg-slate-50"
                      >
                        + Add Milestone
                      </button>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-slate-200 pt-3 mt-1 bg-white/60 p-3 rounded-xl border">
                        <span className="text-xs font-bold text-slate-650 leading-snug">Total Gig Price (Milestones Sum):</span>
                        <span className="text-xs sm:text-sm font-black text-teal-800 bg-teal-50/80 border border-teal-200/80 px-3 py-1.5 rounded-xl font-sans max-w-full truncate [word-break:break-all]">
                          {currencies.find(c => c.currency_id.toString() === gigCurrencyId)?.symbol || "$"}{parseFloat(gigPrice || "0").toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}



                  {/* Delivery Days */}
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-655">Delivery Days *</label>
                    <input
                      id="gig-delivery-days-input"
                      type="number"
                      min="1"
                      placeholder="e.g. 3"
                      value={gigDeliveryDays}
                      onChange={(e) => setGigDeliveryDays(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Revisions */}
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-655">Revisions</label>
                    <input
                      id="gig-revisions-input"
                      type="number"
                      min="1"
                      placeholder="e.g. 3"
                      value={gigRevisions}
                      onChange={(e) => setGigRevisions(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Discount Percentage */}
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-655">Discount Percentage (0-99%)</label>
                    <input
                      id="gig-discount-percent-input"
                      type="number"
                      min="0"
                      max="99"
                      placeholder="e.g. 15 (optional)"
                      value={gigDiscountPercent}
                      onChange={(e) => setGigDiscountPercent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Negotiation Toggle */}
                  <div className="flex items-center gap-3 py-2 sm:col-span-2">
                    <input
                      type="checkbox"
                      id="negotiation-checkbox"
                      checked={gigNegotiation}
                      onChange={(e) => setGigNegotiation(e.target.checked)}
                      className="w-4.5 h-4.5 text-primary border-slate-300 rounded focus:ring-primary focus:ring-opacity-40 cursor-pointer"
                    />
                    <label htmlFor="negotiation-checkbox" className="text-xs font-bold text-slate-705 cursor-pointer select-none">
                      Enable price negotiation (allow clients to propose custom budgets)
                    </label>
                  </div>

                  {/* Gig Add-ons Section */}
                  <div className="sm:col-span-2 flex flex-col gap-4 bg-slate-50/50 border border-slate-200/60 rounded-xl p-5 mt-2 text-left">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Gig Add-ons (Upsells)</h4>
                      <p className="text-[10px] text-slate-405 mt-0.5 font-semibold">Offer optional extras that clients can purchase with this service (e.g. source files, fast delivery).</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {gigAddons.map((addon, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 relative shadow-sm hover:shadow transition-shadow">
                          <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 text-left">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Add-on Title *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Provide editable vector source files"
                                value={addon.title}
                                onChange={(e) => {
                                  const updated = [...gigAddons];
                                  updated[idx].title = e.target.value;
                                  setGigAddons(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-850 focus:outline-none focus:bg-white transition"
                              />
                            </div>
                            <div className="text-left">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Extra Price ($) *</label>
                              <input
                                type="number"
                                required
                                min="1"
                                placeholder="e.g. 25"
                                value={addon.price}
                                onChange={(e) => {
                                  const updated = [...gigAddons];
                                  updated[idx].price = e.target.value;
                                  setGigAddons(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white font-bold transition"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = gigAddons.filter((_, i) => i !== idx);
                              setGigAddons(updated);
                            }}
                            className="text-rose-500 hover:text-rose-700 hover:scale-105 transition-all text-xs font-black cursor-pointer border-none bg-transparent self-end pb-2"
                            title="Remove Add-on"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setGigAddons([...gigAddons, { id: Date.now().toString(), title: "", price: "" }]);
                      }}
                      className="text-xxs font-black text-primary hover:text-primary-hover flex items-center justify-center gap-1.5 bg-white border border-dashed border-primary/30 rounded-xl py-3 w-full cursor-pointer hover:bg-slate-50/50 transition-all"
                    >
                      <span>+ Add Custom Extra Add-on</span>
                    </button>
                  </div>
                </div>

                {/* Step 2 Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveFormStep(1)}
                    className="w-full sm:w-auto bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 border border-slate-200 font-extrabold text-xs px-5 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 order-last sm:order-first whitespace-nowrap"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) {
                        setActiveFormStep(3);
                      }
                    }}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <span>Continue to Media</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: MEDIA & DESCRIPTION */}
            {activeFormStep === 3 && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                
                {/* Showcase Image URL & Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold block text-slate-655">Showcase Images *</label>
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Image preview cards */}
                    {gigImages.split(",").map(u => u.trim()).filter(Boolean).map((imgUrl, index) => (
                      <div key={index} className="relative w-20 h-20 border border-slate-200 rounded-xl overflow-hidden group/thumb">
                        <img src={imgUrl} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const list = gigImages.split(",").map(u => u.trim()).filter(Boolean);
                            list.splice(index, 1);
                            setGigImages(list.join(", "));
                          }}
                          className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center opacity-0 group/thumb:opacity-100 transition-opacity font-bold text-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    
                    {/* Upload Card */}
                    <label className="w-20 h-20 border-2 border-dashed border-slate-250 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1 select-none text-slate-400 group">
                      {uploadingImages ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FiImage className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                          <span className="text-[9px] font-black uppercase text-slate-500">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingImages}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Design Card */}
                    <button
                      type="button"
                      onClick={() => setShowCanvasEditor(true)}
                      className="w-20 h-20 border-2 border-dashed border-slate-250 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1 select-none text-slate-400 bg-transparent group"
                    >
                      <FiType className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="text-[9px] font-black uppercase text-slate-500">Design</span>
                    </button>
                  </div>
                   <input
                    id="gig-images-input"
                    type="text"
                    placeholder="Paste image URLs here (comma-separated) or click above to upload"
                    value={gigImages}
                    onChange={(e) => setGigImages(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Showcase Video URL & Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold block text-slate-655">Showcase Video</label>
                    <div className="flex flex-wrap gap-3 items-center min-h-[5rem]">
                      {gigVideoUrl ? (
                        <div className="relative w-28 h-20 border border-slate-200 rounded-xl overflow-hidden group/vid bg-slate-950 flex items-center justify-center shadow-xs">
                          <video src={resolveMediaUrl(gigVideoUrl)} controls className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                            <button
                              type="button"
                              title="Download Video"
                              onClick={() => handleDownloadVideo(gigVideoUrl, "gig-showcase-video.mp4")}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <FiDownload className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Video"
                              onClick={() => setGigVideoUrl("")}
                              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="w-20 h-20 border-2 border-dashed border-slate-250 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1 select-none text-slate-400 group">
                          {uploadingVideo ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <FiVideo className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                              <span className="text-[9px] font-black uppercase text-slate-500">Upload</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="video/*"
                            disabled={uploadingVideo}
                            onChange={handleVideoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Paste video URL here or click above to upload"
                        value={gigVideoUrl}
                        onChange={(e) => setGigVideoUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                      />
                      {gigVideoUrl && (
                        <button
                          type="button"
                          onClick={() => handleDownloadVideo(gigVideoUrl, "gig-showcase-video.mp4")}
                          className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                        >
                          <FiDownload className="w-3.5 h-3.5 shrink-0" />
                          <span>Download Video</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Documents / PDF Link & Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold block text-slate-655">Showcase Documents</label>
                    <div className="flex flex-wrap gap-3 items-center min-h-[5rem]">
                      {gigDocuments.split(",").map(u => u.trim()).filter(Boolean).map((docUrl, index) => {
                        const name = docUrl.split("/").pop() || "Document";
                        return (
                          <div key={index} className="relative w-20 h-20 border border-slate-200 rounded-xl overflow-hidden group/doc bg-slate-50 flex flex-col items-center justify-center p-1.5 shadow-inner">
                            <FiFileText className="w-6 h-6 text-teal-700 mb-1 shrink-0" />
                            <span className="text-[8px] font-bold text-slate-600 max-w-full truncate text-center px-1" title={name}>
                              {name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = gigDocuments.split(",").map(u => u.trim()).filter(Boolean);
                                list.splice(index, 1);
                                setGigDocuments(list.join(", "));
                              }}
                              className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center opacity-0 group-hover/doc:opacity-100 transition-opacity font-bold text-xs cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                      
                      <label className="w-20 h-20 border-2 border-dashed border-slate-250 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-1 select-none text-slate-400 group">
                        {uploadingDocs ? (
                          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <FiFileText className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                            <span className="text-[9px] font-black uppercase text-slate-500">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.zip"
                          multiple
                          disabled={uploadingDocs}
                          onChange={handleDocUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Paste document URLs (comma-separated) or click above to upload"
                      value={gigDocuments}
                      onChange={(e) => setGigDocuments(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-655">Gig Description *</label>
                  
                  {/* Rich Text Format Toolbar */}
                  <div className="flex items-center gap-1 border border-b-0 border-slate-200 bg-slate-50 p-1.5 rounded-t-xl select-none">
                    <button
                      type="button"
                      onClick={() => insertFormat("bold")}
                      title="Bold <strong>"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <FiBold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat("italic")}
                      title="Italic <em>"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <FiItalic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat("heading")}
                      title="Heading <h3>"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <FiType className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat("bullet")}
                      title="Bullet List <ul><li>"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <FiList className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => setPreviewHtml(!previewHtml)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black rounded-lg cursor-pointer transition-all border ${
                        previewHtml
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <FiEye className="w-3 h-3" />
                      <span>{previewHtml ? "Edit Mode" : "Preview Description"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateGigDescription}
                      disabled={generatingGigDesc}
                      title="Generate a professional description using AI"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black rounded-lg cursor-pointer transition-all border bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-750 hover:to-purple-750 border-none disabled:opacity-60"
                    >
                      {generatingGigDesc ? (
                        <>
                          <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          <span>AI Write</span>
                        </>
                      )}
                    </button>
                  </div>

                  {previewHtml ? (
                    <div 
                      className="w-full bg-slate-50 border border-slate-200 rounded-b-xl px-3.5 py-2.5 text-xs text-slate-850 h-32 overflow-y-auto prose prose-emerald prose-xs max-w-none text-left"
                      dangerouslySetInnerHTML={{ __html: gigDescription.trim() || "<p class='text-slate-400 italic font-medium'>No description text provided yet. Use the formatting bar above to design your description.</p>" }}
                    />
                  ) : (
                    <textarea
                      id="gig-description-textarea"
                      placeholder="Provide a detailed description of your service, deliverables, and scope of work... (HTML formatting allowed)"
                      value={gigDescription}
                      onChange={(e) => setGigDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-b-xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none h-32 resize-none"
                    />
                  )}
                </div>

                {/* Custom FAQs Section */}
                <div className="border-t border-slate-100 pt-5 mt-3 flex flex-col gap-4 text-left">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Custom FAQs (Optional)</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Add frequently asked questions and answers to show on your public gig page.</p>
                  </div>
                  
                  {gigFaqs.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {gigFaqs.map((faq, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-3 relative group/faq">
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...gigFaqs];
                              list.splice(idx, 1);
                              setGigFaqs(list);
                            }}
                            className="absolute top-3 right-3 text-rose-505 hover:text-rose-700 text-xs font-bold bg-white hover:bg-rose-50 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer shadow-sm opacity-100 transition-opacity"
                          >
                            Remove FAQ
                          </button>
                          
                          <div className="flex flex-col gap-1 pr-24">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Question {idx + 1}</label>
                            <input
                              type="text"
                              value={faq.q}
                              placeholder="e.g. Do you provide source files?"
                              onChange={(e) => {
                                const list = [...gigFaqs];
                                list[idx].q = e.target.value;
                                setGigFaqs(list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Answer {idx + 1}</label>
                            <textarea
                              value={faq.a}
                              placeholder="e.g. Yes, I provide complete Figma source files for the basic and premium plans."
                              onChange={(e) => {
                                const list = [...gigFaqs];
                                list[idx].a = e.target.value;
                                setGigFaqs(list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:border-primary focus:outline-none h-16 resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setGigFaqs([...gigFaqs, { q: "", a: "" }]);
                    }}
                    className="self-start text-[10px] font-black text-primary hover:text-primary-hover border border-dashed border-primary/20 hover:border-primary/50 bg-primary/5 px-4.5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>+ Add FAQ Item</span>
                  </button>
                </div>

                {/* SEO & Sharing Meta Settings */}
                <div className="border-t border-slate-100 pt-5 mt-3 flex flex-col gap-4 text-left">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">SEO & Social Sharing Settings (Optional)</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Customize the preview card displayed when your gig is shared on Email, Facebook, WhatsApp, LinkedIn, or Twitter.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    
                    {/* SEO Inputs */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Meta SEO Title</label>
                          <span className="text-[9px] text-slate-400 font-semibold">{seoTitle.length}/70</span>
                        </div>
                        <input
                          type="text"
                          maxLength={70}
                          value={seoTitle}
                          placeholder={gigTitle || "Defaults to Gig Title"}
                          onChange={(e) => setSeoTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none font-semibold"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Meta SEO Description</label>
                          <span className="text-[9px] text-slate-400 font-semibold">{seoDescription.length}/160</span>
                        </div>
                        <textarea
                          maxLength={160}
                          value={seoDescription}
                          placeholder={gigDescription ? gigDescription.replace(/<[^>]*>/g, '').substring(0, 120) + "..." : "Defaults to Gig Description"}
                          onChange={(e) => setSeoDescription(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-850 focus:border-primary focus:outline-none h-20 resize-none"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Custom Sharing Image</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Paste image URL or upload ->"
                            value={seoImage}
                            onChange={(e) => setSeoImage(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:border-primary focus:outline-none"
                          />
                          <label className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm gap-1 hover:border-slate-350 select-none">
                            {uploadingSeoImage ? (
                              <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <FiUpload className="w-3.5 h-3.5 animate-bounce" />
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
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3 text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Social Share Preview Card:</span>
                      
                      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="relative aspect-[1.91/1] w-full bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                          {seoImage || (gigImages ? gigImages.split(",")[0]?.trim() : "") ? (
                            <img
                              src={seoImage || (gigImages ? gigImages.split(",")[0]?.trim() : "")}
                              className="w-full h-full object-cover"
                              alt="SEO Social Share Preview"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-slate-350">
                              <FiGlobe className="w-8 h-8" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-center">Share Image Placeholder</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex flex-col gap-1 text-left">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">lancerflow.net</span>
                          <h5 className="text-xs font-extrabold text-slate-800 line-clamp-1">
                            {seoTitle.trim() || gigTitle.trim() || "Awesome Freelancer Gig Title"}
                          </h5>
                          <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {seoDescription.trim() || (gigDescription ? gigDescription.replace(/<[^>]*>/g, '').substring(0, 110) + "..." : "Hire the best freelance professionals for your project on lancerflow.net.")}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>

                {/* Step 3 Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveFormStep(2)}
                    className="w-full sm:w-auto bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 border border-slate-200 font-extrabold text-xs px-5 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 order-last sm:order-first whitespace-nowrap"
                  >
                    <FiArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={gigPublishing}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50 border-none whitespace-nowrap"
                  >
                    {gigPublishing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin shrink-0"></div>
                        <span>{editingGig ? "Saving Changes..." : "Publishing Gig..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{editingGig ? "Save Changes" : "Publish Service Gig"}</span>
                        <FiCheck className="w-3.5 h-3.5 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    ) : (
      <div className="relative z-10 w-full animate-fadeIn flex flex-col gap-6 text-slate-800 text-left">
        
        {/* Header Info */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800">My Service Gigs</h2>
            <p className="text-slate-404 text-xs mt-0.5">List and offer pre-priced services directly to clients.</p>
          </div>
          <button
            disabled={onboardingCheckLoading}
            onClick={handleCreateGigClick}
            className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-4.5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 self-start sm:self-auto font-display disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{onboardingCheckLoading ? "Checking..." : "+ Create New Gig"}</span>
          </button>
        </div>

        {loadingGigs ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-16 flex flex-col items-center justify-center text-center gap-3.5 shadow-sm">
            <div className="w-8 h-8 border-4 border-t-primary border-slate-200 rounded-full animate-spin"></div>
            <p className="text-slate-404 text-xs font-semibold">Loading your service gigs...</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4.5 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center text-2xl font-bold animate-pulse">
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">No active service gigs</h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
                Package your core professional skills into standardized, flat-rate services (e.g. logo design, database setups) so clients can purchase them instantly.
              </p>
            </div>
            <button
              disabled={onboardingCheckLoading}
              onClick={handleCreateGigClick}
              className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer font-display disabled:opacity-50 disabled:pointer-events-none"
            >
              {onboardingCheckLoading ? "Checking..." : "Create Your First Gig"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => {
              const gigImg = gig.images && Array.isArray(gig.images) && gig.images.length > 0
                ? gig.images[0]
                : null;
              return (
                <div 
                  key={gig.gig_id} 
                  onClick={() => setSelectedGigForDetails(gig)}
                  className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-350 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between relative group cursor-pointer"
                >
                  
                  <span className={`absolute top-3.5 right-3.5 z-10 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md border ${
                    gig.status === "Active" || gig.status === "active"
                      ? "bg-emerald-700 text-white border-emerald-600 shadow-emerald-900/20"
                      : "bg-amber-600 text-white border-amber-500 shadow-amber-900/20"
                  }`}>
                    {gig.status || "Active"}
                  </span>

                  <div className="relative w-full h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {gigImg ? (
                      <img
                        src={gigImg}
                        alt={gig.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-primary/5 to-cyan-500/5 flex flex-col items-center justify-center text-slate-400 gap-1 font-mono text-[10px] select-none">
                        <span className="text-xl">🎨</span>
                        <span className="font-extrabold text-slate-500 uppercase tracking-widest text-[8px]">No Image Preview</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-grow flex flex-col gap-3 justify-between">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider">
                        {gig.sub_category_name || gig.category_name || "General Service"}
                      </span>

                      <h3 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left">
                        {gig.title}
                      </h3>

                      <p className="text-[10px] leading-relaxed text-slate-455 font-medium line-clamp-2 text-left">
                        {stripHtml(gig.description)}
                      </p>
                    </div>

                    {gig.skills && Array.isArray(gig.skills) && gig.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
                        {gig.skills.slice(0, 3).map((s: any) => (
                          <span key={s.skill_id} className="text-[8px] font-bold text-slate-650 bg-slate-100/50 border border-slate-200/50 px-2 py-0.5 rounded">
                            {s.skill_name}
                          </span>
                        ))}
                        {gig.skills.length > 3 && (
                          <span className="text-[8px] font-black text-slate-400 px-1 py-0.5">
                            +{gig.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold text-slate-450 uppercase flex items-center gap-1">
                        ⏱ {gig.delivery_days} Days
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/gigs/${gig.slug || gig.gig_id}`;
                        }}
                        className="text-[8px] font-black text-teal-700 bg-teal-50 border border-teal-150 px-2 py-0.5 rounded-lg hover:bg-teal-100 transition-all cursor-pointer"
                      >
                        View Page
                      </button>
                    </div>
                    
                    <div className="flex flex-col items-end text-right min-w-0">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Starting At</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 mt-1 block leading-none">
                        {formatPrice(parseFloat(gig.price || 0))}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {selectedGigForDetails && (
          <GigConsoleModal
            selectedGigForDetails={selectedGigForDetails}
            setSelectedGigForDetails={setSelectedGigForDetails}
            setEditingGig={setEditingGig}
            setIsCreatingGig={setIsCreatingGig}
            fetchGigs={fetchGigs}
            triggerToast={triggerToast}
            fetchGigSubCategories={fetchGigSubCategories}
            fetchGigSkills={fetchGigSkills}
            setGigTitle={setGigTitle}
            setGigDescription={setGigDescription}
            setGigPrice={setGigPrice}
            setGigCurrencyId={setGigCurrencyId}
            setGigDeliveryDays={setGigDeliveryDays}
            setGigRevisions={setGigRevisions}
            setGigImages={setGigImages}
            setGigVideoUrl={setGigVideoUrl}
            setGigDocuments={setGigDocuments}
            setGigCategoryId={setGigCategoryId}
            setGigSubCategoryId={setGigSubCategoryId}
            setGigSelectedSkills={setGigSelectedSkills}
            setGigNegotiation={setGigNegotiation}
            setGigDiscountPercent={setGigDiscountPercent}
            setGigPaymentType={setGigPaymentType}
            setPriceType={setPriceType}
            setGigMinPrice={setGigMinPrice}
            setGigMaxPrice={setGigMaxPrice}
            setGigMilestones={setGigMilestones}
            setGigSlug={setGigSlug}
            setUsePlans={setUsePlans}
            setEnabledPlans={setEnabledPlans}
            setGigPlans={setGigPlans}
            setFeatureRows={setFeatureRows}
            setGigFaqs={setGigFaqs}
            setGigAddons={setGigAddons}
            setSeoTitle={setSeoTitle}
            setSeoDescription={setSeoDescription}
            setSeoImage={setSeoImage}
            currencies={currencies}
            defaultCurrencyCode={defaultCurrencyCode}
          />
        )}

      </div>
      )}

      {showCanvasEditor && (
        <CanvasEditor
          onSave={handleCanvasSave}
          onClose={() => setShowCanvasEditor(false)}
          canvasWidth={800}
          canvasHeight={450}
        />
      )}
    </>
  );
};

export default GigsTab;

// Gig Details & Management Console Modal
export function GigConsoleModal({
  selectedGigForDetails,
  setSelectedGigForDetails,
  setEditingGig,
  setIsCreatingGig,
  fetchGigs,
  triggerToast,
  fetchGigSubCategories,
  fetchGigSkills,
  setGigTitle,
  setGigDescription,
  setGigPrice,
  setGigCurrencyId,
  setGigDeliveryDays,
  setGigRevisions,
  setGigImages,
  setGigVideoUrl,
  setGigDocuments,
  setGigCategoryId,
  setGigSubCategoryId,
  setGigSelectedSkills,
  setGigNegotiation,
  setGigDiscountPercent,
  setGigPaymentType,
  setPriceType,
  setGigMinPrice,
  setGigMaxPrice,
  setGigMilestones,
  setGigSlug,
  setUsePlans,
  setEnabledPlans,
  setGigPlans,
  setFeatureRows,
  setGigFaqs,
  setGigAddons,
  setSeoTitle,
  setSeoDescription,
  setSeoImage,
  currencies,
  defaultCurrencyCode,
}: {
  selectedGigForDetails: any;
  setSelectedGigForDetails: (g: any) => void;
  setEditingGig: (g: any) => void;
  setIsCreatingGig: (b: boolean) => void;
  fetchGigs: () => void;
  triggerToast: any;
  fetchGigSubCategories: (catId: string) => void;
  fetchGigSkills: (subCatId: string) => void;
  setGigTitle: (s: string) => void;
  setGigDescription: (s: string) => void;
  setGigPrice: (s: string) => void;
  setGigCurrencyId: (s: string) => void;
  setGigDeliveryDays: (s: string) => void;
  setGigRevisions: (s: string) => void;
  setGigImages: (s: string) => void;
  setGigVideoUrl: (s: string) => void;
  setGigDocuments: (s: string) => void;
  setGigCategoryId: (s: string) => void;
  setGigSubCategoryId: (s: string) => void;
  setGigSelectedSkills: (arr: number[]) => void;
  setGigNegotiation: (b: boolean) => void;
  setGigDiscountPercent: (s: string) => void;
  setGigPaymentType: (s: "fixed" | "milestone") => void;
  setPriceType: (s: "single" | "range") => void;
  setGigMinPrice: (s: string) => void;
  setGigMaxPrice: (s: string) => void;
  setGigMilestones: (arr: Array<{ title: string; amount: string; description: string }>) => void;
  setGigSlug: (s: string) => void;
  setUsePlans: (b: boolean) => void;
  setEnabledPlans: (o: { Standard: boolean; Premium: boolean }) => void;
  setGigPlans: (arr: any[]) => void;
  setFeatureRows: (arr: any[]) => void;
  setGigFaqs: (arr: Array<{ q: string; a: string }>) => void;
  setGigAddons: (arr: Array<{ id: string; title: string; price: string }>) => void;
  setSeoTitle: (s: string) => void;
  setSeoDescription: (s: string) => void;
  setSeoImage: (s: string) => void;
  currencies: any[];
  defaultCurrencyCode: string;
}) {
  const { formatPrice } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/35 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative max-h-[90vh] flex flex-col">
        <button
          onClick={() => setSelectedGigForDetails(null)}
          className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-855 cursor-pointer"
        >
          Close
        </button>

        <div className="border-b border-slate-100 pb-4 pr-16 shrink-0">
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1">Gig Management Console</span>
          <h2 className="text-base font-black text-slate-855 line-clamp-1">{selectedGigForDetails.title}</h2>
          <p className="text-slate-405 text-xs font-semibold mt-1">Status: <span className="text-white bg-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ml-1 shadow-sm">{selectedGigForDetails.status || "Active"}</span></p>
        </div>

        <div className="flex-grow overflow-y-auto my-6 flex flex-col gap-6 pr-1">
          {/* Media Gallery */}
          {selectedGigForDetails.images && selectedGigForDetails.images.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Showcase Images</h4>
              <div className="flex flex-wrap gap-2.5">
                {selectedGigForDetails.images.map((img: string, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => setLightboxImage(img)}
                    className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 shadow-sm shrink-0 cursor-zoom-in hover:opacity-90 active:scale-95 transition-all"
                  >
                    <img src={img} alt="Showcase" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gig Description</h4>
            <div 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-wrap font-sans"
              dangerouslySetInnerHTML={{ __html: selectedGigForDetails.description }}
            />
          </div>

          {/* Showcase Video */}
          {selectedGigForDetails.video_url && (
            <div>
              <div className="flex items-center justify-between mb-2.5 max-w-md">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showcase Video</h4>
                <button
                  type="button"
                  onClick={() => handleDownloadVideo(selectedGigForDetails.video_url, "gig-showcase-video.mp4")}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xxs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <FiDownload className="w-3 h-3" />
                  <span>Download Video</span>
                </button>
              </div>
              <div className="w-full max-w-md rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm relative aspect-video">
                <video src={resolveMediaUrl(selectedGigForDetails.video_url)} controls className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* Reference Documents */}
          {selectedGigForDetails.documents && selectedGigForDetails.documents.length > 0 && (
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Reference Documents</h4>
              <div className="flex flex-col gap-2">
                {selectedGigForDetails.documents.map((docUrl: string, idx: number) => {
                  const fileName = docUrl.split("/").pop() || `Document_${idx + 1}`;
                  return (
                    <a
                      key={idx}
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-705 hover:text-slate-900 cursor-pointer"
                    >
                      <FiFileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate flex-1 text-left">{fileName}</span>
                      <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded-md uppercase">View</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attributes & Settings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 shrink-0">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Price Package</span>
              <span className="text-xs font-black text-slate-800 mt-1 block">
                {selectedGigForDetails.payment_type === "milestone" ? (
                  <span className="text-primary font-bold">Milestone-based</span>
                ) : (
                  selectedGigForDetails.min_price || selectedGigForDetails.max_price ? (
                    <span>
                      {formatPrice(parseFloat(selectedGigForDetails.min_price || "0"))} - {formatPrice(parseFloat(selectedGigForDetails.max_price || "0"))}
                    </span>
                  ) : (
                    <span>
                      {formatPrice(parseFloat(selectedGigForDetails.price || "0"))}
                    </span>
                  )
                )}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Discount Campaign</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {selectedGigForDetails.discount_percent && parseFloat(selectedGigForDetails.discount_percent) > 0 
                  ? `${parseFloat(selectedGigForDetails.discount_percent)}% Off`
                  : "None"
                }
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Negotiations</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {selectedGigForDetails.negotiation ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Revisions / Days</span>
              <span className="text-xs font-bold text-slate-800 mt-1 block">
                {selectedGigForDetails.revisions || "Unlimited"} Revs / {selectedGigForDetails.delivery_days} days
              </span>
            </div>
          </div>

          {/* Milestones Breakdown */}
          {selectedGigForDetails.payment_type === "milestone" && selectedGigForDetails.milestones && (
            <div className="flex flex-col gap-2 shrink-0 text-left">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Milestone Breakdown</h4>
              <div className="flex flex-col gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                {(typeof selectedGigForDetails.milestones === "string" 
                  ? JSON.parse(selectedGigForDetails.milestones) 
                  : selectedGigForDetails.milestones
                ).map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{m.title}</p>
                      {m.description && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{m.description}</p>}
                    </div>
                    <span className="text-xs font-black text-slate-700">
                      {formatPrice(parseFloat(m.amount))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-black text-xs text-slate-800">
                  <span>Total Budget:</span>
                  <span>{formatPrice(parseFloat(selectedGigForDetails.price))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="border-t border-slate-100 pt-4 flex justify-between gap-3 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to delete this service gig permanently? This action cannot be undone.")) {
                  const token = localStorage.getItem("token");
                  try {
                    const res = await fetch(`${API_URL}/freelancer/gigs/${selectedGigForDetails.gig_id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                      triggerToast("success", "Service gig deleted successfully!");
                      setSelectedGigForDetails(null);
                      fetchGigs();
                    } else {
                      const data = await res.json();
                      triggerToast("error", data.message || "Failed to delete gig.");
                    }
                  } catch (e) {
                    triggerToast("error", "Network error. Failed to delete gig.");
                  }
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-605 border border-rose-200 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border-0"
            >
              <FiX className="w-4 h-4 shrink-0" />
              <span>Delete Gig</span>
            </button>
            <a
              href={`/gigs/${selectedGigForDetails.slug || selectedGigForDetails.gig_id}`}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-black text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              <FiExternalLink className="w-4 h-4 shrink-0" />
              <span>View Public Page</span>
            </a>
          </div>

          <button
            onClick={() => {
              const g = selectedGigForDetails;

              // Find gig currency and default currency rates
              const gigCurr = currencies.find((c: any) => c.currency_id === g.currency_id);
              const defaultCurr = currencies.find((c: any) => c.code === defaultCurrencyCode) || currencies[0];

              const gigRate = gigCurr?.rate !== undefined ? parseFloat(gigCurr.rate.toString()) : 1.0;
              const defRate = defaultCurr?.rate !== undefined ? parseFloat(defaultCurr.rate.toString()) : 1.0;

              // Convert price if gig currency is different from default currency
              const needsConversion = gigCurr && gigCurr.code !== defaultCurrencyCode;

              const convertVal = (val: any) => {
                if (val === undefined || val === null || isNaN(parseFloat(val))) return "";
                if (!needsConversion) return val.toString();
                // Formula: valInDefault = valInGigCurrency * (defRate / gigRate)
                const converted = parseFloat(val) * (defRate / gigRate);
                return Math.round(converted).toString();
              };

              setGigTitle(g.title);
              setGigSlug(g.slug || "");
              setGigDescription(g.description);
              setGigPrice(convertVal(g.price));
              setGigCurrencyId(defaultCurr.currency_id.toString());
              setGigDeliveryDays(g.delivery_days.toString());
              setGigRevisions((g.revisions || 0).toString());
              setGigImages(g.images ? g.images.join(",") : "");
              setGigVideoUrl(g.video_url || "");
              setGigDocuments(g.documents ? g.documents.join(",") : "");
              setGigCategoryId(g.category_id ? g.category_id.toString() : "");
              setGigSubCategoryId(g.sub_category_id ? g.sub_category_id.toString() : "");

              // Robust skill IDs extraction
              let parsedSkills: number[] = [];
              if (g.skills) {
                let raw = g.skills;
                if (typeof raw === "string") {
                  try { raw = JSON.parse(raw); } catch {}
                }
                if (Array.isArray(raw)) {
                  parsedSkills = raw.map((s: any) => {
                    if (typeof s === "number") return s;
                    if (typeof s === "string" && !isNaN(Number(s))) return Number(s);
                    if (typeof s === "object" && s !== null) return Number(s.skill_id || s.id);
                    return null;
                  }).filter((id): id is number => typeof id === "number" && !isNaN(id));
                }
              }
              setGigSelectedSkills(parsedSkills);
              setGigNegotiation(!!g.negotiation);
              setGigDiscountPercent((g.discount_percent || 0).toString());
              setGigPaymentType(g.payment_type || "fixed");
              setPriceType(g.min_price || g.max_price ? "range" : "single");
              setGigMinPrice(g.min_price ? convertVal(g.min_price) : "");
              setGigMaxPrice(g.max_price ? convertVal(g.max_price) : "");
              
              const loadedMilestones = g.milestones 
                ? (typeof g.milestones === "string" ? JSON.parse(g.milestones) : g.milestones)
                : [{ title: "Milestone 1", amount: "", description: "" }];
              setGigMilestones(loadedMilestones.map((m: any) => ({
                ...m,
                amount: convertVal(m.amount)
              })));
              
              setGigFaqs(
                g.faqs
                  ? (typeof g.faqs === "string" ? JSON.parse(g.faqs) : g.faqs)
                  : []
              );
              
              const loadedAddons = g.addons
                ? (typeof g.addons === "string" ? JSON.parse(g.addons) : g.addons)
                : [];
              setGigAddons(loadedAddons.map((a: any) => ({
                ...a,
                price: convertVal(a.price)
              })));

              const loadedSeo = g.seo 
                ? (typeof g.seo === "string" ? JSON.parse(g.seo) : g.seo)
                : null;
              setSeoTitle(loadedSeo?.title || "");
              setSeoDescription(loadedSeo?.description || "");
              setSeoImage(loadedSeo?.image || "");

              if (g.category_id) {
                fetchGigSubCategories(g.category_id.toString());
              }
              if (g.sub_category_id) {
                fetchGigSkills(g.sub_category_id.toString());
              }

              setEditingGig(g);
              
              const hasPlans = g.plans && Array.isArray(g.plans) && g.plans.length > 0;
              setUsePlans(hasPlans);
              if (hasPlans) {
                const parsedPlans = typeof g.plans === "string" ? JSON.parse(g.plans) : g.plans;
                const convertedPlans = parsedPlans.map((p: any) => ({
                  ...p,
                  price: convertVal(p.price)
                }));
                const loadedBasic = convertedPlans.find((p: any) => p.name === "Basic") || convertedPlans[0];
                const loadedStandard = convertedPlans.find((p: any) => p.name === "Standard");
                const loadedPremium = convertedPlans.find((p: any) => p.name === "Premium");

                setEnabledPlans({
                  Standard: !!loadedStandard,
                  Premium: !!loadedPremium
                });

                setGigPlans([
                  {
                    name: "Basic",
                    title: loadedBasic?.title || "",
                    description: loadedBasic?.description || "",
                    delivery_days: (loadedBasic?.delivery_days || 3).toString(),
                    revisions: (loadedBasic?.revisions || 3).toString(),
                    price: (loadedBasic?.price || "").toString(),
                    features: loadedBasic?.features || {}
                  },
                  {
                    name: "Standard",
                    title: loadedStandard?.title || "",
                    description: loadedStandard?.description || "",
                    delivery_days: (loadedStandard?.delivery_days || 5).toString(),
                    revisions: (loadedStandard?.revisions || 5).toString(),
                    price: (loadedStandard?.price || "").toString(),
                    features: loadedStandard?.features || {}
                  },
                  {
                    name: "Premium",
                    title: loadedPremium?.title || "",
                    description: loadedPremium?.description || "",
                    delivery_days: (loadedPremium?.delivery_days || 7).toString(),
                    revisions: (loadedPremium?.revisions || 7).toString(),
                    price: (loadedPremium?.price || "").toString(),
                    features: loadedPremium?.features || {}
                  }
                ]);

                // Extract unique feature names
                const loadedRows: FeatureRow[] = [];
                if (loadedBasic && loadedBasic.features) {
                  Object.keys(loadedBasic.features).forEach(key => {
                    const val = loadedBasic.features[key];
                    loadedRows.push({
                      name: key,
                      type: typeof val === "boolean" ? "checkbox" : "text"
                    });
                  });
                }
                setFeatureRows(loadedRows.length > 0 ? loadedRows : [
                  { name: "Functional website", type: "checkbox" },
                  { name: "Responsive design", type: "checkbox" },
                  { name: "Content upload", type: "checkbox" }
                ]);
              } else {
                setEnabledPlans({ Standard: true, Premium: true });
                setGigPlans([
                  {
                    name: "Basic",
                    title: "",
                    description: "",
                    delivery_days: "3",
                    revisions: "3",
                    price: "",
                    features: {}
                  },
                  {
                    name: "Standard",
                    title: "",
                    description: "",
                    delivery_days: "5",
                    revisions: "5",
                    price: "",
                    features: {}
                  },
                  {
                    name: "Premium",
                    title: "",
                    description: "",
                    delivery_days: "7",
                    revisions: "7",
                    price: "",
                    features: {}
                  }
                ]);
                setFeatureRows([
                  { name: "Functional website", type: "checkbox" },
                  { name: "Responsive design", type: "checkbox" },
                  { name: "Content upload", type: "checkbox" }
                ]);
              }

              setIsCreatingGig(true);
              setSelectedGigForDetails(null);
            }}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 border-0"
          >
            <i className="fa-solid fa-pen-to-square text-[10px]"></i>
            <span>Edit Gig Settings</span>
          </button>
        </div>
      </div>

      {/* Showcase Image Lightbox Overlay */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[100000] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-200 text-xs font-black bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              Close ×
            </button>
            <img 
              src={lightboxImage} 
              alt="Enlarged Showcase" 
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
