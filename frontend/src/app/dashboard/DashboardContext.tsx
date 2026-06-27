"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { initSocket, disconnectSocket } from "@/utils/socket";

const API_URL = "http://localhost:5000/api";

// Types
interface Category {
  category_id: number;
  category_name: string;
}

interface SubCategory {
  sub_category_id: number;
  category_id: number;
  sub_category_name: string;
}

interface Skill {
  skill_id: number;
  sub_category_id: number;
  skill_name: string;
}

interface Language {
  language_id: number;
  language_name: string;
}

interface ExperienceItem {
  experience_id?: number;
  company_name: string;
  job_title: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  currently_working: boolean;
  description: string;
}

interface EducationItem {
  education_id?: number;
  institution_name: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
}

interface CertificationItem {
  certification_id?: number;
  certificate_name: string;
  issuing_organization: string;
  issue_date: string;
  credential_url: string;
}

interface Freelancer {
  id: string;
  name: string;
  avatarColor: string;
  role: string;
  rating: number;
  completedJobs: number;
  hourlyRate: number;
  skills: string[];
  bio: string;
  verified: boolean;
  category: "development" | "design" | "marketing" | "ai";
}

const freelancersData: Freelancer[] = [
  {
    id: "1",
    name: "Alex Rivera",
    avatarColor: "from-violet-500 to-indigo-500",
    role: "Senior Full-Stack Developer",
    rating: 4.9,
    completedJobs: 142,
    hourlyRate: 95,
    skills: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL"],
    bio: "Ex-Stripe engineer specializing in high-performance web applications and financial integrations.",
    verified: true,
    category: "development",
  },
  {
    id: "2",
    name: "Sophia Chen",
    avatarColor: "from-cyan-500 to-blue-500",
    role: "Product & UI/UX Designer",
    rating: 5.0,
    completedJobs: 89,
    hourlyRate: 85,
    skills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    bio: "Creating beautiful, conversion-focused digital products for series A startups and enterprises.",
    verified: true,
    category: "design",
  },
  {
    id: "3",
    name: "Marcus Vance",
    avatarColor: "from-emerald-500 to-teal-500",
    role: "Growth & Acquisition Marketer",
    rating: 4.8,
    completedJobs: 115,
    hourlyRate: 75,
    skills: ["SEO", "Google Ads", "Conversion Rate Optimization", "Copywriting"],
    bio: "Helping SaaS companies scale from $10k to $100k MRR through data-driven performance marketing.",
    verified: false,
    category: "marketing",
  },
  {
    id: "4",
    name: "Elena Rostova",
    avatarColor: "from-rose-500 to-pink-500",
    role: "AI Integration & ML Engineer",
    rating: 4.9,
    completedJobs: 54,
    hourlyRate: 120,
    skills: ["Python", "PyTorch", "LLM Fine-tuning", "FastAPI", "OpenAI API"],
    bio: "Building smart conversational agents and recommendation engines integrated directly into production apps.",
    verified: true,
    category: "ai",
  },
  {
    id: "5",
    name: "Liam O'Connor",
    avatarColor: "from-amber-500 to-orange-500",
    role: "Next.js Core Developer",
    rating: 4.7,
    completedJobs: 73,
    hourlyRate: 90,
    skills: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
    bio: "Specialist in server components, performance optimization, and custom Next.js deployment solutions.",
    verified: true,
    category: "development",
  },
  {
    id: "6",
    name: "Amina Al-Jamil",
    avatarColor: "from-purple-500 to-fuchsia-500",
    role: "Brand Identity Designer",
    rating: 5.0,
    completedJobs: 104,
    hourlyRate: 80,
    skills: ["Illustrator", "Brand Strategy", "Typography", "Packaging Design"],
    bio: "Developing memorable visual identities and design languages for modern eco-friendly brands.",
    verified: true,
    category: "design",
  },
];

interface DashboardContextType {
  // Global Auth/Onboarding States
  isAuthenticated: boolean | null;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
  onboardingCompleted: boolean;
  setOnboardingCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  onboardingStep: "role_selection" | "freelancer_flow" | "client_flow" | "loading";
  setOnboardingStep: React.Dispatch<React.SetStateAction<"role_selection" | "freelancer_flow" | "client_flow" | "loading">>;
  selectedRole: "freelancer" | "client" | null;
  setSelectedRole: React.Dispatch<React.SetStateAction<"freelancer" | "client" | null>>;
  activeView: "dashboard" | "marketplace";
  setActiveView: React.Dispatch<React.SetStateAction<"dashboard" | "marketplace">>;
  clientNotice: boolean;
  setClientNotice: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // DB Seed Lists
  categories: Category[];
  subCategories: SubCategory[];
  availableSkills: Skill[];
  languages: Language[];

  // Onboarding Wizard Form States
  companyName: string; setCompanyName: (v: string) => void;
  companySize: string; setCompanySize: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  companyWebsite: string; setCompanyWebsite: (v: string) => void;
  companyDescription: string; setCompanyDescription: (v: string) => void;
  companyEstablishedYear: string; setCompanyEstablishedYear: (v: string) => void;
  hiringContactName: string; setHiringContactName: (v: string) => void;
  hiringContactDesignation: string; setHiringContactDesignation: (v: string) => void;
  clientWizardStep: number; setClientWizardStep: React.Dispatch<React.SetStateAction<number>>;
  clientError: string; setClientError: (v: string) => void;
  clientSuccess: boolean; setClientSuccess: (v: boolean) => void;

  wizardStep: number; setWizardStep: React.Dispatch<React.SetStateAction<number>>;
  onboardingStepsStatus: { profile: boolean; career: boolean; verification: boolean; portfolio: boolean };
  setOnboardingStepsStatus: React.Dispatch<React.SetStateAction<{ profile: boolean; career: boolean; verification: boolean; portfolio: boolean }>>;

  // Step 1 Form States
  categoryId: string; setCategoryId: (v: string) => void;
  subCategoryId: string; setSubCategoryId: (v: string) => void;
  professionalTitle: string; setProfessionalTitle: (v: string) => void;
  experienceLevel: string; setExperienceLevel: (v: string) => void;
  totalExperienceYears: string; setTotalExperienceYears: (v: string) => void;
  hourlyRate: string; setHourlyRate: (v: string) => void;
  availabilityStatus: string; setAvailabilityStatus: (v: string) => void;
  linkedinUrl: string; setLinkedinUrl: (v: string) => void;
  portfolioWebsite: string; setPortfolioWebsite: (v: string) => void;
  resumeUrl: string; setResumeUrl: (v: string) => void;
  selectedSkillIds: number[]; setSelectedSkillIds: React.Dispatch<React.SetStateAction<number[]>>;
  selectedLanguageIds: number[]; setSelectedLanguageIds: React.Dispatch<React.SetStateAction<number[]>>;
  step1Error: string; setStep1Error: (v: string) => void;
  step1Success: boolean; setStep1Success: (v: boolean) => void;

  // Step 2 Form States
  experiences: ExperienceItem[]; setExperiences: React.Dispatch<React.SetStateAction<ExperienceItem[]>>;
  educations: EducationItem[]; setEducations: React.Dispatch<React.SetStateAction<EducationItem[]>>;
  certifications: CertificationItem[]; setCertifications: React.Dispatch<React.SetStateAction<CertificationItem[]>>;
  
  // Step 2 Temp Input States
  expCompany: string; setExpCompany: (v: string) => void;
  expTitle: string; setExpTitle: (v: string) => void;
  expEmpType: string; setExpEmpType: (v: string) => void;
  expStart: string; setExpStart: (v: string) => void;
  expEnd: string; setExpEnd: (v: string) => void;
  expCurrent: boolean; setExpCurrent: (v: boolean) => void;
  expDesc: string; setExpDesc: (v: string) => void;
  eduInst: string; setEduInst: (v: string) => void;
  eduDegree: string; setEduDegree: (v: string) => void;
  eduField: string; setEduField: (v: string) => void;
  eduStart: string; setEduStart: (v: string) => void;
  eduEnd: string; setEduEnd: (v: string) => void;
  certName: string; setCertName: (v: string) => void;
  certOrg: string; setCertOrg: (v: string) => void;
  certDate: string; setCertDate: (v: string) => void;
  certCredUrl: string; setCertCredUrl: (v: string) => void;

  // Step 3 Form States (Verification)
  userEmail: string; setUserEmail: (v: string) => void;
  userPhone: string; setUserPhone: (v: string) => void;
  emailVerified: boolean; setEmailVerified: (v: boolean) => void;
  phoneVerified: boolean; setPhoneVerified: (v: boolean) => void;
  emailOtp: string; setEmailOtp: (v: string) => void;
  phoneOtp: string; setPhoneOtp: (v: string) => void;
  emailOtpSent: boolean; setEmailOtpSent: (v: boolean) => void;
  phoneOtpSent: boolean; setPhoneOtpSent: (v: boolean) => void;
  otpError: string; setOtpError: (v: string) => void;
  otpSuccess: string; setOtpSuccess: (v: string) => void;

  // Step 4 Form States (Portfolio Project)
  projectTitle: string; setProjectTitle: (v: string) => void;
  projectDesc: string; setProjectDesc: (v: string) => void;
  projectImages: string; setProjectImages: (v: string) => void;
  projectVideo: string; setProjectVideo: (v: string) => void;
  projectDocs: string; setProjectDocs: (v: string) => void;
  portfolioSuccess: boolean; setPortfolioSuccess: (v: boolean) => void;

  // Styling Settings State
  primaryColor: string; setPrimaryColor: (v: string) => void;
  secondaryColor: string; setSecondaryColor: (v: string) => void;
  siteTheme: string; setSiteTheme: (v: string) => void;

  // Core Dashboard State (merged from Dashboard.tsx)
  userName: string; setUserName: React.Dispatch<React.SetStateAction<string>>;
  gigs: any[]; setGigs: React.Dispatch<React.SetStateAction<any[]>>;
  currencies: any[]; setCurrencies: React.Dispatch<React.SetStateAction<any[]>>;
  loadingGigs: boolean; setLoadingGigs: React.Dispatch<React.SetStateAction<boolean>>;
  isCreatingGig: boolean; setIsCreatingGig: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Gig Form Fields
  gigTitle: string; setGigTitle: (v: string) => void;
  gigDescription: string; setGigDescription: (v: string) => void;
  gigPrice: string; setGigPrice: (v: string) => void;
  gigCurrencyId: string; setGigCurrencyId: (v: string) => void;
  gigDeliveryDays: string; setGigDeliveryDays: (v: string) => void;
  gigRevisions: string; setGigRevisions: (v: string) => void;
  gigImages: string; setGigImages: (v: string) => void;
  gigVideoUrl: string; setGigVideoUrl: (v: string) => void;
  gigDocuments: string; setGigDocuments: (v: string) => void;
  gigCategoryId: string; setGigCategoryId: (v: string) => void;
  gigSubCategoryId: string; setGigSubCategoryId: (v: string) => void;
  gigSelectedSkills: number[]; setGigSelectedSkills: React.Dispatch<React.SetStateAction<number[]>>;
  gigError: string; setGigError: (v: string) => void;
  gigSuccess: boolean; setGigSuccess: (v: boolean) => void;
  gigPublishing: boolean; setGigPublishing: React.Dispatch<React.SetStateAction<boolean>>;

  // Lists for Gig Selectors
  gigCategories: any[]; setGigCategories: React.Dispatch<React.SetStateAction<any[]>>;
  gigSubCategories: any[]; setGigSubCategories: React.Dispatch<React.SetStateAction<any[]>>;
  gigAvailableSkills: any[]; setGigAvailableSkills: React.Dispatch<React.SetStateAction<any[]>>;
  userRole: string | null; setUserRole: React.Dispatch<React.SetStateAction<string | null>>;

  // Gig Ordering / Collaboration flow states
  clientGigs: any[]; setClientGigs: React.Dispatch<React.SetStateAction<any[]>>;
  loadingClientGigs: boolean; setLoadingClientGigs: React.Dispatch<React.SetStateAction<boolean>>;
  gigApplications: any[]; setGigApplications: React.Dispatch<React.SetStateAction<any[]>>;
  loadingApplications: boolean; setLoadingApplications: React.Dispatch<React.SetStateAction<boolean>>;
  clientApplications: any[]; setClientApplications: React.Dispatch<React.SetStateAction<any[]>>;
  loadingClientApplications: boolean; setLoadingClientApplications: React.Dispatch<React.SetStateAction<boolean>>;
  hiredFreelancers: any[]; setHiredFreelancers: React.Dispatch<React.SetStateAction<any[]>>;
  loadingHiredFreelancers: boolean; setLoadingHiredFreelancers: React.Dispatch<React.SetStateAction<boolean>>;
  isApplying: boolean; setIsApplying: React.Dispatch<React.SetStateAction<boolean>>;
  applyingGig: any | null; setApplyingGig: React.Dispatch<React.SetStateAction<any | null>>;
  orderRequirements: string; setOrderRequirements: (v: string) => void;
  orderSubmitting: boolean; setOrderSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  orderSuccess: boolean; setOrderSuccess: (v: boolean) => void;
  orderError: string; setOrderError: (v: string) => void;

  // Gig creation upload states
  uploadingImages: boolean; setUploadingImages: React.Dispatch<React.SetStateAction<boolean>>;
  uploadingVideo: boolean; setUploadingVideo: React.Dispatch<React.SetStateAction<boolean>>;
  uploadingDocs: boolean; setUploadingDocs: React.Dispatch<React.SetStateAction<boolean>>;

  // Client Browse Talent State
  searchQuery: string; setSearchQuery: (v: string) => void;
  selectedCategory: "all" | "development" | "design" | "marketing" | "ai";
  setSelectedCategory: React.Dispatch<React.SetStateAction<"all" | "development" | "design" | "marketing" | "ai">>;

  // Client Post a Job Form State
  postJobTitle: string; setPostJobTitle: (v: string) => void;
  postJobBudget: number; setPostJobBudget: React.Dispatch<React.SetStateAction<number>>;
  postJobCategoryId: string; setPostJobCategoryId: (v: string) => void;
  postJobSubCategoryId: string; setPostJobSubCategoryId: (v: string) => void;
  postJobSubCategories: any[]; setPostJobSubCategories: React.Dispatch<React.SetStateAction<any[]>>;
  postJobDescription: string; setPostJobDescription: (v: string) => void;
  postJobExpLevel: string; setPostJobExpLevel: (v: string) => void;

  // Post Job Wizard states
  postJobStep: number; setPostJobStep: React.Dispatch<React.SetStateAction<number>>;
  postJobType: string; setPostJobType: (v: string) => void;
  postJobMilestoneType: string; setPostJobMilestoneType: (v: string) => void;
  postJobMinBudget: number; setPostJobMinBudget: React.Dispatch<React.SetStateAction<number>>;
  postJobMaxBudget: number; setPostJobMaxBudget: React.Dispatch<React.SetStateAction<number>>;
  postJobDuration: string; setPostJobDuration: (v: string) => void;
  postJobLocation: string; setPostJobLocation: (v: string) => void;
  postJobNumFreelancers: string; setPostJobNumFreelancers: (v: string) => void;
  postJobAvailableSkills: any[]; setPostJobAvailableSkills: React.Dispatch<React.SetStateAction<any[]>>;
  postJobSelectedSkills: number[]; setPostJobSelectedSkills: React.Dispatch<React.SetStateAction<number[]>>;
  postJobAvailableLanguages: any[]; setPostJobAvailableLanguages: React.Dispatch<React.SetStateAction<any[]>>;
  postJobSelectedLanguages: number[]; setPostJobSelectedLanguages: React.Dispatch<React.SetStateAction<number[]>>;
  postJobMaxHours: number; setPostJobMaxHours: React.Dispatch<React.SetStateAction<number>>;
  postJobPaymentMode: string; setPostJobPaymentMode: (v: string) => void;

  // Client Job Posts listing states
  clientJobs: any[]; setClientJobs: React.Dispatch<React.SetStateAction<any[]>>;
  loadingClientJobs: boolean; setLoadingClientJobs: React.Dispatch<React.SetStateAction<boolean>>;
  isCreatingJob: boolean; setIsCreatingJob: React.Dispatch<React.SetStateAction<boolean>>;
  editingDraftJobId: number | null; setEditingDraftJobId: React.Dispatch<React.SetStateAction<number | null>>;
  
  // Custom dashboard detail states
  selectedProjectDetails: any | null; setSelectedProjectDetails: React.Dispatch<React.SetStateAction<any | null>>;
  selectedGigOrderDetails: any | null; setSelectedGigOrderDetails: React.Dispatch<React.SetStateAction<any | null>>;
  selectedFreelancerProfile: any | null; setSelectedFreelancerProfile: React.Dispatch<React.SetStateAction<any | null>>;
  loadingProfileDetails: boolean; setLoadingProfileDetails: React.Dispatch<React.SetStateAction<boolean>>;
  projectProposals: any[]; setProjectProposals: React.Dispatch<React.SetStateAction<any[]>>;
  loadingProjectProposals: boolean; setLoadingProjectProposals: React.Dispatch<React.SetStateAction<boolean>>;

  // Freelancer Browse Jobs states
  allJobs: any[]; setAllJobs: React.Dispatch<React.SetStateAction<any[]>>;
  loadingAllJobs: boolean; setLoadingAllJobs: React.Dispatch<React.SetStateAction<boolean>>;
  jobSearchQuery: string; setJobSearchQuery: (v: string) => void;
  jobSelectedCategory: string; setJobSelectedCategory: (v: string) => void;

  // Proposal Flow States
  showProposalModal: boolean; setShowProposalModal: React.Dispatch<React.SetStateAction<boolean>>;
  applyingJob: any | null; setApplyingJob: React.Dispatch<React.SetStateAction<any | null>>;
  proposalCoverLetter: string; setProposalCoverLetter: (v: string) => void;
  proposalBidAmount: number; setProposalBidAmount: React.Dispatch<React.SetStateAction<number>>;
  proposalDeliveryDays: number; setProposalDeliveryDays: React.Dispatch<React.SetStateAction<number>>;
  proposalSubmitting: boolean; setProposalSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  proposalError: string; setProposalError: (v: string) => void;
  proposalMilestones: { title: string; amount: number }[]; setProposalMilestones: React.Dispatch<React.SetStateAction<{ title: string; amount: number }[]>>;
  newMilestoneTitle: string; setNewMilestoneTitle: (v: string) => void;
  newMilestoneAmount: number | ""; setNewMilestoneAmount: (v: number | "") => void;
  proposalUseMilestones: boolean; setProposalUseMilestones: React.Dispatch<React.SetStateAction<boolean>>;
  
  freelancerProposals: any[]; setFreelancerProposals: React.Dispatch<React.SetStateAction<any[]>>;
  loadingFreelancerProposals: boolean; setLoadingFreelancerProposals: React.Dispatch<React.SetStateAction<boolean>>;
  expandedJobId: number | null; setExpandedJobId: React.Dispatch<React.SetStateAction<number | null>>;
  activeJobProposals: any[]; setActiveJobProposals: React.Dispatch<React.SetStateAction<any[]>>;
  loadingActiveJobProposals: boolean; setLoadingActiveJobProposals: React.Dispatch<React.SetStateAction<boolean>>;
  appliedJobIds: Set<number>;

  // Messaging & Chat States
  conversations: any[]; setConversations: React.Dispatch<React.SetStateAction<any[]>>;
  selectedConvId: number | null; setSelectedConvId: React.Dispatch<React.SetStateAction<number | null>>;
  chatMessages: any[]; setChatMessages: React.Dispatch<React.SetStateAction<any[]>>;
  newMessageText: string; setNewMessageText: (v: string) => void;
  loadingConversations: boolean; setLoadingConversations: React.Dispatch<React.SetStateAction<boolean>>;
  loadingChatMessages: boolean; setLoadingChatMessages: React.Dispatch<React.SetStateAction<boolean>>;
  sendingChatMessage: boolean; setSendingChatMessage: React.Dispatch<React.SetStateAction<boolean>>;

  // Notifications States
  notifications: any[]; setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  unreadNotificationsCount: number; setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  isNotificationsOpen: boolean; setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Filtered lists
  filteredFreelancers: Freelancer[];

  // Profile setup states
  profileStep: number; setProfileStep: React.Dispatch<React.SetStateAction<number>>;
  isEditingProfile: boolean; setIsEditingProfile: React.Dispatch<React.SetStateAction<boolean>>;
  showPublishConfirmModal: boolean; setShowPublishConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  clientBasics: any; setClientBasics: React.Dispatch<React.SetStateAction<any>>;
  profileBasics: any; setProfileBasics: React.Dispatch<React.SetStateAction<any>>;
  selectedSkills: string[]; setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;
  availableSkillsList: string[];
  apiAlert: { show: boolean; type: "success" | "warning" | "error"; message: string; details?: string };
  setApiAlert: React.Dispatch<React.SetStateAction<{ show: boolean; type: "success" | "warning" | "error"; message: string; details?: string }>>;
  stepsStatus: any[];
  profileCompletionProgress: number;

  // Onboarding actions (dashboard page.tsx)
  handleSelectFreelancer: () => void;
  handleSelectClient: () => void;
  handleCategoryChange: (catId: string) => void;
  handleSaveStep1: (e: React.FormEvent) => Promise<void>;
  handleAddExperience: () => Promise<void>;
  handleAddEducation: () => Promise<void>;
  handleAddCertification: () => Promise<void>;
  handleSendEmailOtp: () => Promise<void>;
  handleVerifyEmailOtp: () => Promise<void>;
  handleSendPhoneOtp: () => Promise<void>;
  handleVerifyPhoneOtp: () => Promise<void>;
  handlePortfolioSubmit: (e: React.FormEvent) => Promise<void>;
  handleClientSubmit: (e: React.FormEvent) => Promise<void>;
  handleSkip: () => void;
  handleRemoveExperience: (expId: number, index: number) => Promise<void>;
  handleRemoveEducation: (eduId: number, index: number) => Promise<void>;
  handleRemoveCertification: (certId: number, index: number) => Promise<void>;

  // Dashboard actions (Dashboard.tsx)
  triggerToast: (type: "success" | "warning" | "error", message: string, details?: string) => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  handleMarkAllRead: () => Promise<void>;
  handleMarkSingleRead: (notifId: number, notifType: string, refId: string | null) => Promise<void>;
  fetchClientProfile: () => Promise<void>;
  fetchClientJobs: () => Promise<void>;
  fetchAllJobs: () => Promise<void>;
  fetchFreelancerProposals: () => Promise<void>;
  fetchActiveJobProposals: (jobId: number) => Promise<void>;
  handleUpdateProposalStatus: (proposalId: number, status: "Accepted" | "Declined", jobId: number) => Promise<void>;
  handleSubmitProposal: (e: React.FormEvent) => Promise<void>;
  handleAddProposalMilestone: () => void;
  handleRemoveProposalMilestone: (index: number) => void;
  fetchConversations: () => Promise<void>;
  fetchChatMessages: (convId: number) => Promise<void>;
  handleSendChatMessage: (e: React.FormEvent) => Promise<void>;
  handlePostJobCategoryChange: (catId: string) => Promise<void>;
  handlePostJobSubCategoryChange: (subCatId: string) => Promise<void>;
  fetchPostJobLanguages: () => Promise<void>;
  handlePostJobToggleSkill: (skillId: number) => void;
  handlePostJobToggleLanguage: (langId: number) => void;
  fetchGigs: () => Promise<void>;
  fetchClientGigs: () => Promise<void>;
  fetchFreelancerApplications: () => Promise<void>;
  fetchClientApplications: () => Promise<void>;
  fetchHiredFreelancers: () => Promise<void>;
  handleApplyGigSubmit: (e: React.FormEvent) => Promise<void>;
  handleUpdateApplicationStatus: (applicationId: number, status: "Accepted" | "Rejected") => Promise<void>;
  fetchCurrencies: () => Promise<void>;
  fetchGigCategories: () => Promise<void>;
  fetchGigSubCategories: (catId?: string) => Promise<void>;
  fetchGigSkills: (subCatId: string) => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDocUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleGigCategoryChange: (catId: string) => void;
  handleGigSubCategoryChange: (subCatId: string) => void;
  handleGigToggleSkill: (skillId: number) => void;
  handleCreateGigSubmit: (e: React.FormEvent) => Promise<void>;
  deleteExperience: (index: number) => void;
  deleteEducation: (index: number) => void;
  deleteCertification: (index: number) => void;
  handleSaveStep: (stepNum: number) => Promise<void>;
  handleSaveClientStepSettings: (stepNum: number) => Promise<void>;
  handleStartConversation: (recipientId: number | string) => Promise<void>;
  handleUpdateGigApplication: (updatedApp: any) => void;
  setActiveTab: (tab: string) => void;
  activeTab: string;
  handleRoleSwitch: (role: string) => void;
  handleToggleSkill: (skillId: number) => void;
  handleSkipStep2: () => Promise<void>;
  updateOnboardingStep: (stepNum: number) => Promise<void>;
  handleSkipStep3: () => Promise<void>;
  handleSaveStep3: () => Promise<void>;
  handleAddProject: (e: React.FormEvent) => Promise<void>;
  handleFinishOnboarding: () => void;
  handleSaveClientStep: (stepNum: number) => Promise<void>;
  walletInfo: any | null;
  loadingWallet: boolean;
  withdrawAmount: string; setWithdrawAmount: (v: string) => void;
  withdrawMethod: string; setWithdrawMethod: (v: string) => void;
  withdrawAccount: string; setWithdrawAccount: (v: string) => void;
  depositAmount: string; setDepositAmount: (v: string) => void;
  fetchWalletInfo: () => Promise<void>;
  handleWithdrawSubmit: (e: React.FormEvent) => Promise<void>;
  handleDepositSubmit: (e: React.FormEvent) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Authentication & Onboarding States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<"role_selection" | "freelancer_flow" | "client_flow" | "loading">("loading");
  const [selectedRole, setSelectedRole] = useState<"freelancer" | "client" | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "marketplace">("dashboard");
  const [clientNotice, setClientNotice] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Client Wizard Form States
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("1-10");
  const [industry, setIndustry] = useState("Technology");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyEstablishedYear, setCompanyEstablishedYear] = useState("");
  const [hiringContactName, setHiringContactName] = useState("");
  const [hiringContactDesignation, setHiringContactDesignation] = useState("");
  const [clientWizardStep, setClientWizardStep] = useState<number>(1);
  const [clientError, setClientError] = useState("");
  const [clientSuccess, setClientSuccess] = useState(false);

  // Freelancer Wizard steps
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [onboardingStepsStatus, setOnboardingStepsStatus] = useState({
    profile: false,
    career: false,
    verification: false,
    portfolio: false
  });

  // DB Seed Lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  // Step 1 Form States
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [professionalTitle, setProfessionalTitle] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("Beginner");
  const [totalExperienceYears, setTotalExperienceYears] = useState<string>("0");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("Available");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [portfolioWebsite, setPortfolioWebsite] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([]);
  const [step1Error, setStep1Error] = useState<string>("");
  const [step1Success, setStep1Success] = useState<boolean>(false);

  // Step 2 Form States
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  
  // Step 2 Temp Input States
  const [expCompany, setExpCompany] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expEmpType, setExpEmpType] = useState("Full-time");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDesc, setExpDesc] = useState("");

  const [eduInst, setEduInst] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduStart, setEduStart] = useState("");
  const [eduEnd, setEduEnd] = useState("");

  const [certName, setCertName] = useState("");
  const [certOrg, setCertOrg] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certCredUrl, setCertCredUrl] = useState("");

  // Step 3 Form States (Verification)
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");

  // Step 4 Form States (Portfolio Project)
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectImages, setProjectImages] = useState("");
  const [projectVideo, setProjectVideo] = useState("");
  const [projectDocs, setProjectDocs] = useState("");
  const [portfolioSuccess, setPortfolioSuccess] = useState(false);

  // Styling Settings State
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [secondaryColor, setSecondaryColor] = useState("#06b6d4");
  const [siteTheme, setSiteTheme] = useState("light");

  // Core Dashboard State
  const [userName, setUserName] = useState("Liam");
  const [gigs, setGigs] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [isCreatingGig, setIsCreatingGig] = useState(false);
  
  // Gig Form Fields
  const [gigTitle, setGigTitle] = useState("");
  const [gigDescription, setGigDescription] = useState("");
  const [gigPrice, setGigPrice] = useState("");
  const [gigCurrencyId, setGigCurrencyId] = useState("");
  const [gigDeliveryDays, setGigDeliveryDays] = useState("3");
  const [gigRevisions, setGigRevisions] = useState("3");
  const [gigImages, setGigImages] = useState("");
  const [gigVideoUrl, setGigVideoUrl] = useState("");
  const [gigDocuments, setGigDocuments] = useState("");
  const [gigCategoryId, setGigCategoryId] = useState("");
  const [gigSubCategoryId, setGigSubCategoryId] = useState("");
  const [gigSelectedSkills, setGigSelectedSkills] = useState<number[]>([]);
  const [gigError, setGigError] = useState("");
  const [gigSuccess, setGigSuccess] = useState(false);
  const [gigPublishing, setGigPublishing] = useState(false);

  // Lists for Gig Selectors
  const [gigCategories, setGigCategories] = useState<any[]>([]);
  const [gigSubCategories, setGigSubCategories] = useState<any[]>([]);
  const [gigAvailableSkills, setGigAvailableSkills] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Gig Ordering / Collaboration flow states
  const [clientGigs, setClientGigs] = useState<any[]>([]);
  const [loadingClientGigs, setLoadingClientGigs] = useState(false);
  const [gigApplications, setGigApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [clientApplications, setClientApplications] = useState<any[]>([]);
  const [loadingClientApplications, setLoadingClientApplications] = useState(false);
  const [hiredFreelancers, setHiredFreelancers] = useState<any[]>([]);
  const [loadingHiredFreelancers, setLoadingHiredFreelancers] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyingGig, setApplyingGig] = useState<any | null>(null);
  const [orderRequirements, setOrderRequirements] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Gig creation upload states
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Client Browse Talent State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "development" | "design" | "marketing" | "ai">("all");

  // Client Post a Job Form State
  const [postJobTitle, setPostJobTitle] = useState("");
  const [postJobBudget, setPostJobBudget] = useState(2500);
  const [postJobCategoryId, setPostJobCategoryId] = useState("");
  const [postJobSubCategoryId, setPostJobSubCategoryId] = useState("");
  const [postJobSubCategories, setPostJobSubCategories] = useState<any[]>([]);
  const [postJobDescription, setPostJobDescription] = useState("");
  const [postJobExpLevel, setPostJobExpLevel] = useState("Intermediate");

  // Post Job Wizard states
  const [postJobStep, setPostJobStep] = useState(1);
  const [postJobType, setPostJobType] = useState("Fixed");
  const [postJobMilestoneType, setPostJobMilestoneType] = useState("Both");
  const [postJobMinBudget, setPostJobMinBudget] = useState(100);
  const [postJobMaxBudget, setPostJobMaxBudget] = useState(1000);
  const [postJobDuration, setPostJobDuration] = useState("1-3 months");
  const [postJobLocation, setPostJobLocation] = useState("Remote");
  const [postJobNumFreelancers, setPostJobNumFreelancers] = useState("1 freelancer");
  const [postJobAvailableSkills, setPostJobAvailableSkills] = useState<any[]>([]);
  const [postJobSelectedSkills, setPostJobSelectedSkills] = useState<number[]>([]);
  const [postJobAvailableLanguages, setPostJobAvailableLanguages] = useState<any[]>([]);
  const [postJobSelectedLanguages, setPostJobSelectedLanguages] = useState<number[]>([]);
  const [postJobMaxHours, setPostJobMaxHours] = useState(40);
  const [postJobPaymentMode, setPostJobPaymentMode] = useState("Weekly");

  // Client Job Posts listing states
  const [clientJobs, setClientJobs] = useState<any[]>([]);
  const [loadingClientJobs, setLoadingClientJobs] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [editingDraftJobId, setEditingDraftJobId] = useState<number | null>(null);
  
  // Custom dashboard detail states
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<any | null>(null);
  const [selectedGigOrderDetails, setSelectedGigOrderDetails] = useState<any | null>(null);
  const [selectedFreelancerProfile, setSelectedFreelancerProfile] = useState<any | null>(null);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);
  const [projectProposals, setProjectProposals] = useState<any[]>([]);
  const [loadingProjectProposals, setLoadingProjectProposals] = useState(false);

  // Freelancer Browse Jobs states
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loadingAllJobs, setLoadingAllJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobSelectedCategory, setJobSelectedCategory] = useState("all");

  // Proposal Flow States
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [applyingJob, setApplyingJob] = useState<any | null>(null);
  const [proposalCoverLetter, setProposalCoverLetter] = useState("");
  const [proposalBidAmount, setProposalBidAmount] = useState(0);
  const [proposalDeliveryDays, setProposalDeliveryDays] = useState(7);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const [proposalMilestones, setProposalMilestones] = useState<{ title: string; amount: number }[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneAmount, setNewMilestoneAmount] = useState<number | "">("");
  const [proposalUseMilestones, setProposalUseMilestones] = useState(false);
  
  const [freelancerProposals, setFreelancerProposals] = useState<any[]>([]);
  const [loadingFreelancerProposals, setLoadingFreelancerProposals] = useState(false);

  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [activeJobProposals, setActiveJobProposals] = useState<any[]>([]);
  const [loadingActiveJobProposals, setLoadingActiveJobProposals] = useState(false);

  const appliedJobIds = useMemo(() => {
    return new Set<number>(freelancerProposals.map((p) => p.job_id));
  }, [freelancerProposals]);

  // Messaging & Chat States
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingChatMessages, setLoadingChatMessages] = useState(false);
  const [sendingChatMessage, setSendingChatMessage] = useState(false);

  // Notifications States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Profile Wizard Step State
  const [profileStep, setProfileStep] = useState<number>(1);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState<boolean>(false);

  // Wallet & Payout States
  const [walletInfo, setWalletInfo] = useState<any | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("PayPal");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // Client Basics State (client_profiles)
  const [clientBasics, setClientBasics] = useState({
    company_name: "",
    company_size: "1-10",
    industry: "Technology",
    company_website: "",
    company_description: "",
    company_established_year: "",
    hiring_contact_name: "",
    hiring_contact_designation: "",
  });

  // Profile Basics State (freelancer_profiles)
  const [profileBasics, setProfileBasics] = useState({
    professional_title: "",
    experience_level: "Intermediate",
    hourly_rate: 45,
    availability_status: "Available",
    total_experience_years: 3,
    linkedin_url: "",
    portfolio_website: "",
    resume_url: "",
  });

  // Skills State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const availableSkillsList = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", 
    "PostgreSQL", "Python", "TailwindCSS", "REST APIs", "GraphQL", 
    "AWS", "Docker", "Git", "Figma", "UI/UX Design", "Rust", "Go", "Prisma"
  ];

  // API Integration Alerts
  const [apiAlert, setApiAlert] = useState<{
    show: boolean;
    type: "success" | "warning" | "error";
    message: string;
    details?: string;
  }>({ show: false, type: "success", message: "" });

  // Map pathname to activeTab
  const activeTab = useMemo(() => {
    const routeMap: Record<string, string> = {
      "/dashboard": "workspace",
      "/dashboard/find-work": "find_work",
      "/dashboard/proposals": "proposals",
      "/dashboard/inbox": "inbox",
      "/dashboard/settings": "settings",
      "/dashboard/gigs": "gigs",
      "/dashboard/explore-gigs": "explore_gigs",
      "/dashboard/applications": "gig_applications",
      "/dashboard/orders": "client_orders",
      "/dashboard/hired-freelancers": "client_hired_freelancers",
      "/dashboard/recommended-freelancers": "client_recommended_freelancers",
      "/dashboard/notifications": "notifications",
      "/dashboard/wallet": "wallet",
    };
    return routeMap[pathname] || "workspace";
  }, [pathname]);

  const setActiveTab = (tab: string) => {
    const routeMap: Record<string, string> = {
      workspace: "/dashboard",
      find_work: "/dashboard/find-work",
      proposals: "/dashboard/proposals",
      inbox: "/dashboard/inbox",
      settings: "/dashboard/settings",
      gigs: "/dashboard/gigs",
      explore_gigs: "/dashboard/explore-gigs",
      gig_applications: "/dashboard/applications",
      client_orders: "/dashboard/orders",
      client_hired_freelancers: "/dashboard/hired-freelancers",
      client_recommended_freelancers: "/dashboard/recommended-freelancers",
      notifications: "/dashboard/notifications",
      wallet: "/dashboard/wallet",
    };
    const path = routeMap[tab];
    if (path) {
      router.push(path);
    }
  };

  // Filter freelancers
  const filteredFreelancers = useMemo(() => {
    return freelancersData.filter((freelancer) => {
      const matchesCategory = selectedCategory === "all" || freelancer.category === selectedCategory;
      const matchesSearch =
        freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const triggerToast = (type: "success" | "warning" | "error", message: string, details?: string) => {
    setApiAlert({ show: true, type, message, details });
    setTimeout(() => {
      setApiAlert((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Dynamic values
  const stepsStatus = useMemo(() => {
    return [
      { number: 1, label: "Basics", done: Boolean(profileBasics.professional_title) },
      { number: 2, label: "Career", done: experiences.length > 0 || educations.length > 0 },
      { number: 3, label: "Verification", done: emailVerified || phoneVerified },
      { number: 4, label: "Portfolio", done: certifications.length > 0 || selectedSkills.length > 0 }
    ];
  }, [profileBasics, experiences, educations, emailVerified, phoneVerified, certifications, selectedSkills]);

  const profileCompletionProgress = useMemo(() => {
    let score = 0;
    if (stepsStatus[0].done) score += 25;
    if (stepsStatus[1].done) score += 25;
    if (stepsStatus[2].done) score += 25;
    if (stepsStatus[3].done) score += 25;
    return score;
  }, [stepsStatus]);

  // Connect to Socket.io and bind events
  const selectedConvIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  const activeTabRef = useRef<string>("workspace");
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.user_id) {
            const socketInstance = initSocket(user.user_id);

            socketInstance.on("new_notification", (notif: any) => {
              console.log("⚡ Real-time notification:", notif);
              setNotifications((prev) => [notif, ...prev]);
              setUnreadNotificationsCount((prev) => prev + 1);
              triggerToast("success", notif.title, notif.message);
            });

            socketInstance.on("new_message", (chatMessage: any) => {
              console.log("⚡ Real-time message:", chatMessage);
              if (selectedConvIdRef.current === chatMessage.conversation_id && activeTabRef.current === "inbox") {
                setChatMessages((prev) => {
                  if (prev.some(m => m.message_id === chatMessage.message_id)) return prev;
                  return [...prev, chatMessage];
                });
              } else {
                triggerToast("success", "New Message Received", `You received a message: "${chatMessage.message_text.substring(0, 40)}"`);
              }
              fetchConversations();
            });

            return () => {
              socketInstance.off("new_notification");
              socketInstance.off("new_message");
              disconnectSocket();
            };
          }
        } catch (err) {
          console.error("Failed to parse user for Socket.io initialization", err);
        }
      }
    }
  }, []);

  // Sync basic profile data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("onboarding_role");
      setUserRole(role);

      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.first_name) {
            setTimeout(() => {
              setUserName(user.first_name);
            }, 0);
          }
        } catch (e) {
          console.error("Failed to parse user details:", e);
        }
      }

      // Load profile info from localStorage
      const savedBasics = localStorage.getItem("profile_basics");
      const savedExp = localStorage.getItem("profile_experiences");
      const savedEdu = localStorage.getItem("profile_education");
      const savedCert = localStorage.getItem("profile_certifications");
      const savedSkills = localStorage.getItem("profile_skills");

      if (savedBasics) setProfileBasics(JSON.parse(savedBasics));
      if (savedExp) setExperiences(JSON.parse(savedExp));
      if (savedEdu) setEducations(JSON.parse(savedEdu));
      if (savedCert) setCertifications(JSON.parse(savedCert));
      if (savedSkills) setSelectedSkills(JSON.parse(savedSkills));
    }
  }, []);

  // Onboarding checks
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      } else {
        setIsAuthenticated(true);
        runOnboardingCheck(token);
      }
    }
  }, []);

  // Fetch settings dynamically
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            if (setting.setting_key === "primary_color") {
              setPrimaryColor(setting.setting_value?.color || "#10b981");
            } else if (setting.setting_key === "secondary_color") {
              setSecondaryColor(setting.setting_value?.color || "#06b6d4");
            } else if (setting.setting_key === "theme") {
              setSiteTheme(setting.setting_value?.theme || "light");
            }
          });
        }
      } catch (err) {
        console.error("Failed to load brand settings", err);
      }
    };
    fetchSettings();
  }, []);

  // Apply theme dynamically
  useEffect(() => {
    const apply = async () => {
      const { applyTheme } = await import("@/utils/theme");
      applyTheme(siteTheme, primaryColor, secondaryColor);
    };
    apply();
  }, [siteTheme, primaryColor, secondaryColor]);

  // Load wizard data for onboarding freelancer
  useEffect(() => {
    if (onboardingStep === "freelancer_flow" && isAuthenticated) {
      fetchCategoriesOnboard();
      fetchLanguagesOnboard();
      fetchOnboardingStatus();
      fetchOnboardingDetails();
    }
  }, [onboardingStep, isAuthenticated]);

  useEffect(() => {
    if (subCategoryId) {
      fetchSkillsBySubcategoryOnboard(subCategoryId);
    } else {
      setAvailableSkills([]);
    }
  }, [subCategoryId]);

  const fetchCategoriesOnboard = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error("Categories fetch failed", e);
    }
  };

  const fetchLanguagesOnboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/languages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setLanguages(await res.json());
    } catch (e) {
      console.error("Languages fetch failed", e);
    }
  };

  const fetchSkillsBySubcategoryOnboard = async (subCatId: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/skills/subcategory/${subCatId}`);
      if (res.ok) setAvailableSkills(await res.json());
    } catch (e) {
      console.error("Skills fetch failed", e);
    }
  };

  const runOnboardingCheck = async (token: string) => {
    try {
      const checkRes = await fetch(`${API_URL}/users/onboarding-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        
        if (data.hasFreelancerProfile && !data.hasClientProfile) {
          setSelectedRole("freelancer");
          setOnboardingCompleted(true);
          localStorage.setItem("onboarding_role", "freelancer");
          localStorage.setItem("onboarding_completed", "true");
          setOnboardingStep("role_selection");
        } else if (data.hasClientProfile && !data.hasFreelancerProfile) {
          setSelectedRole("client");
          setOnboardingCompleted(true);
          localStorage.setItem("onboarding_role", "client");
          localStorage.setItem("onboarding_completed", "true");
          setOnboardingStep("role_selection");
        } else {
          setOnboardingStep("role_selection");
        }
      } else {
        setOnboardingStep("role_selection");
      }
    } catch (e) {
      console.error(e);
      setOnboardingStep("role_selection");
    }
  };

  const fetchOnboardingStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOnboardingStepsStatus(data.steps);
        setWizardStep(data.currentStep);
        if (data.onboardingCompleted) {
          setOnboardingCompleted(true);
          localStorage.setItem("onboarding_completed", "true");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOnboardingDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserEmail(data.user.email || "");
          setUserPhone(data.user.phone || "");
          setEmailVerified(data.user.email_verified || false);
          setPhoneVerified(data.user.phone_verified || false);
        }
        if (data.profile) {
          setCategoryId(data.profile.category_id?.toString() || "");
          fetchSubcategoriesForCategory(data.profile.category_id?.toString() || "");
          setSubCategoryId(data.profile.sub_category_id?.toString() || "");
          setProfessionalTitle(data.profile.professional_title || "");
          setExperienceLevel(data.profile.experience_level || "Beginner");
          setTotalExperienceYears(data.profile.total_experience_years?.toString() || "0");
          setHourlyRate(data.profile.hourly_rate || "");
          setAvailabilityStatus(data.profile.availability_status || "Available");
          setLinkedinUrl(data.profile.linkedin_url || "");
          setPortfolioWebsite(data.profile.portfolio_website || "");
          setResumeUrl(data.profile.resume_url || "");
        }
        if (data.skills) {
          setSelectedSkillIds(data.skills.map((s: any) => s.skill_id));
        }
        if (data.languages) {
          setSelectedLanguageIds(data.languages.map((l: any) => l.language_id));
        }
        if (data.experiences) setExperiences(data.experiences);
        if (data.educations) setEducations(data.educations);
        if (data.certifications) setCertifications(data.certifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubcategoriesForCategory = async (catId: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/sub-categories`);
      if (res.ok) {
        const allSubs: SubCategory[] = await res.json();
        setSubCategories(allSubs.filter(sub => sub.category_id.toString() === catId));
      }
    } catch (e) {
      console.error("Subcategories fetch failed", e);
    }
  };

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    setSubCategoryId("");
    setAvailableSkills([]);
    setSelectedSkillIds([]);
    fetchSubcategoriesForCategory(catId);
  };

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error("");
    setStep1Success(false);

    if (!categoryId || !subCategoryId || !professionalTitle || !experienceLevel || !totalExperienceYears) {
      setStep1Error("Please fill out all required fields marked with *");
      return;
    }
    if (selectedSkillIds.length === 0) {
      setStep1Error("Please select at least 1 skill.");
      return;
    }
    if (selectedLanguageIds.length === 0) {
      setStep1Error("Please select at least 1 language.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const profileRes = await fetch(`${API_URL}/freelancer/onboarding/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category_id: parseInt(categoryId),
          sub_category_id: parseInt(subCategoryId),
          professional_title: professionalTitle,
          experience_level: experienceLevel,
          total_experience_years: parseInt(totalExperienceYears),
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          availability_status: availabilityStatus,
          linkedin_url: linkedinUrl || null,
          portfolio_website: portfolioWebsite || null,
          resume_url: resumeUrl || null
        })
      });

      if (!profileRes.ok) {
        const err = await profileRes.json();
        setStep1Error(err.message || "Failed to save profile.");
        return;
      }

      const skillsRes = await fetch(`${API_URL}/freelancer/onboarding/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skill_ids: selectedSkillIds })
      });

      if (!skillsRes.ok) {
        const err = await skillsRes.json();
        setStep1Error(err.message || "Failed to save skills.");
        return;
      }

      const langRes = await fetch(`${API_URL}/freelancer/onboarding/languages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ language_ids: selectedLanguageIds })
      });

      if (!langRes.ok) {
        const err = await langRes.json();
        setStep1Error(err.message || "Failed to save languages.");
        return;
      }

      setStep1Success(true);
      setTimeout(() => {
        setWizardStep(2);
        fetchOnboardingStatus();
      }, 1000);
    } catch (e: any) {
      setStep1Error(e.message || "An error occurred while saving profile.");
    }
  };

  const handleAddExperience = async () => {
    if (!expCompany || !expTitle) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/experience`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: expCompany,
          job_title: expTitle,
          employment_type: expEmpType,
          start_date: expStart || null,
          end_date: expEnd || null,
          currently_working: expCurrent,
          description: expDesc
        })
      });
      if (res.ok) {
        const data = await res.json();
        setExperiences([...experiences, data.experience]);
        setExpCompany("");
        setExpTitle("");
        setExpStart("");
        setExpEnd("");
        setExpCurrent(false);
        setExpDesc("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveExperience = async (expId: number, index: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/experience/${expId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setExperiences(experiences.filter((_, idx) => idx !== index));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEducation = async () => {
    if (!eduInst || !eduDegree) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/education`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_name: eduInst,
          degree: eduDegree,
          field_of_study: eduField,
          start_year: eduStart ? parseInt(eduStart) : null,
          end_year: eduEnd ? parseInt(eduEnd) : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEducations([...educations, data.education]);
        setEduInst("");
        setEduDegree("");
        setEduField("");
        setEduStart("");
        setEduEnd("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveEducation = async (eduId: number, index: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/education/${eduId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEducations(educations.filter((_, idx) => idx !== index));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCertification = async () => {
    if (!certName || !certOrg) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/certification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          certificate_name: certName,
          issuing_organization: certOrg,
          issue_date: certDate || null,
          credential_url: certCredUrl || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCertifications([...certifications, data.certification]);
        setCertName("");
        setCertOrg("");
        setCertDate("");
        setCertCredUrl("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveCertification = async (certId: number, index: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/certification/${certId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCertifications(certifications.filter((_, idx) => idx !== index));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendEmailOtp = async () => {
    try {
      setOtpError("");
      setOtpSuccess("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/send-email-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEmailOtpSent(true);
        setOtpSuccess("OTP sent to your email address.");
      } else {
        const d = await res.json();
        setOtpError(d.message || "Failed to send email OTP.");
      }
    } catch (e) {
      setOtpError("Network error.");
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp.trim()) return;
    try {
      setOtpError("");
      setOtpSuccess("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/verify-email-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: emailOtp.trim() })
      });
      if (res.ok) {
        setEmailVerified(true);
        setOtpSuccess("Email verified successfully!");
      } else {
        const d = await res.json();
        setOtpError(d.message || "Invalid OTP code.");
      }
    } catch (e) {
      setOtpError("Network error.");
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!userPhone.trim()) {
      setOtpError("Please provide a phone number first.");
      return;
    }
    try {
      setOtpError("");
      setOtpSuccess("");
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/users/profile-details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: userPhone.trim() })
      });

      const res = await fetch(`${API_URL}/users/send-phone-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPhoneOtpSent(true);
        setOtpSuccess("SMS verification code sent.");
      } else {
        const d = await res.json();
        setOtpError(d.message || "Failed to send SMS OTP.");
      }
    } catch (e) {
      setOtpError("Network error.");
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp.trim()) return;
    try {
      setOtpError("");
      setOtpSuccess("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/verify-phone-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: phoneOtp.trim() })
      });
      if (res.ok) {
        setPhoneVerified(true);
        setOtpSuccess("Phone verified successfully!");
      } else {
        const d = await res.json();
        setOtpError(d.message || "Invalid SMS OTP code.");
      }
    } catch (e) {
      setOtpError("Network error.");
    }
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() || !projectDesc.trim()) {
      triggerToast("error", "Portfolio project title and description are required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: projectTitle.trim(),
          description: projectDesc.trim(),
          images: projectImages ? projectImages.split(",").map(u => u.trim()) : [],
          video_url: projectVideo.trim() || null,
          documents: projectDocs ? projectDocs.split(",").map(u => u.trim()) : []
        })
      });
      if (res.ok) {
        setPortfolioSuccess(true);
        setTimeout(async () => {
          setOnboardingCompleted(true);
          localStorage.setItem("onboarding_completed", "true");
        }, 1500);
      } else {
        const d = await res.json();
        triggerToast("error", d.message || "Failed to save portfolio project.");
      }
    } catch (err) {
      triggerToast("error", "Network error.");
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !industry || !hiringContactName.trim() || !hiringContactDesignation.trim()) {
      setClientError("Please fill out all required fields.");
      return;
    }

    try {
      setClientError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/client-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          company_size: companySize,
          industry,
          company_website: companyWebsite.trim() || null,
          company_description: companyDescription.trim() || null,
          company_established_year: companyEstablishedYear ? parseInt(companyEstablishedYear) : null,
          hiring_contact_name: hiringContactName.trim(),
          hiring_contact_designation: hiringContactDesignation.trim(),
          onboarding_completed: true
        })
      });

      if (res.ok) {
        setClientSuccess(true);
        setTimeout(() => {
          setOnboardingCompleted(true);
          localStorage.setItem("onboarding_completed", "true");
        }, 1000);
      } else {
        const data = await res.json();
        setClientError(data.message || "Failed to complete onboarding.");
      }
    } catch (err) {
      setClientError("Network error.");
    }
  };

  const handleSelectFreelancer = () => {
    setSelectedRole("freelancer");
    setOnboardingStep("freelancer_flow");
    localStorage.setItem("onboarding_role", "freelancer");
  };

  const handleSelectClient = () => {
    setSelectedRole("client");
    setClientNotice(true);
    localStorage.setItem("onboarding_role", "client");
    setTimeout(() => {
      setClientNotice(false);
      setOnboardingStep("client_flow");
      setClientWizardStep(1);
    }, 1500);
  };

  const handleSkip = () => {
    setOnboardingCompleted(true);
    localStorage.setItem("onboarding_completed", "true");
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotificationsCount(data.unreadCount);
      }
    } catch (e) {
      console.error("Failed to fetch unread notifications count:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUnreadNotificationsCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        triggerToast("success", "Notifications updated", "All notifications marked as read.");
      }
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const handleMarkSingleRead = async (notifId: number, notifType: string, refId: string | null) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.notification_id === notifId ? { ...n, is_read: true } : n))
        );
      }

      setIsNotificationsOpen(false);

      if (notifType === "message" && refId) {
        setActiveTab("inbox");
        setSelectedConvId(parseInt(refId));
      } else if (notifType === "proposal") {
        setActiveTab("proposals");
      } else if (notifType === "gig") {
        setActiveTab(userRole === "client" ? "client_orders" : "gig_applications");
      }
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const fetchClientJobs = async () => {
    try {
      setLoadingClientJobs(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/jobs/client", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setClientJobs(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch client jobs:", e);
    } finally {
      setLoadingClientJobs(false);
    }
  };

  const fetchAllJobs = async () => {
    try {
      setLoadingAllJobs(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/jobs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAllJobs(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch all jobs:", e);
    } finally {
      setLoadingAllJobs(false);
    }
  };

  const fetchFreelancerProposals = async () => {
    try {
      setLoadingFreelancerProposals(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/proposals/my-proposals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFreelancerProposals(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch freelancer proposals:", e);
    } finally {
      setLoadingFreelancerProposals(false);
    }
  };

  const fetchActiveJobProposals = async (jobId: number) => {
    try {
      setLoadingActiveJobProposals(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/proposals/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveJobProposals(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch job proposals:", e);
    } finally {
      setLoadingActiveJobProposals(false);
    }
  };

  const handleUpdateProposalStatus = async (proposalId: number, status: "Accepted" | "Declined", jobId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/proposals/${proposalId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `Proposal status updated to ${status}!`);
        fetchActiveJobProposals(jobId);
        fetchClientJobs();
      } else {
        triggerToast("error", data.message || "Failed to update proposal status.");
      }
    } catch (e) {
      console.error("Failed to update proposal status:", e);
      triggerToast("error", "Network error. Please try again.");
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    if (!proposalCoverLetter.trim()) {
      setProposalError("Please enter a cover letter.");
      return;
    }
    if (proposalBidAmount <= 0) {
      setProposalError("Please enter a valid bid amount.");
      return;
    }
    if (proposalDeliveryDays <= 0) {
      setProposalError("Please enter a valid number of days.");
      return;
    }

    const requiresMilestones = applyingJob.project_type === "Fixed" && applyingJob.milestone_type === "Milestone";
    const useMilestones = proposalUseMilestones || requiresMilestones;

    if (useMilestones) {
      if (proposalMilestones.length === 0) {
        setProposalError("This project requires defining milestones. Please add at least one milestone.");
        return;
      }
      const totalMilestones = proposalMilestones.reduce((sum, m) => sum + m.amount, 0);
      if (totalMilestones > proposalBidAmount) {
        setProposalError(`Total milestone amount ($${totalMilestones.toLocaleString()}) cannot exceed the offered total bid amount ($${proposalBidAmount.toLocaleString()}).`);
        return;
      }
    }

    try {
      setProposalSubmitting(true);
      setProposalError("");
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: applyingJob.job_id,
          cover_letter: proposalCoverLetter.trim(),
          bid_amount: proposalBidAmount,
          delivery_days: proposalDeliveryDays,
          milestones: useMilestones ? proposalMilestones : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Proposal submitted successfully!", `Project: ${applyingJob.title}`);
        setShowProposalModal(false);
        setApplyingJob(null);
        setProposalCoverLetter("");
        setProposalBidAmount(0);
        setProposalDeliveryDays(7);
        setProposalMilestones([]);
        setNewMilestoneTitle("");
        setNewMilestoneAmount("");
        setProposalUseMilestones(false);
        fetchFreelancerProposals();
      } else {
        setProposalError(data.message || "Failed to submit proposal.");
      }
    } catch (err) {
      setProposalError("Network error. Please try again.");
    } finally {
      setProposalSubmitting(false);
    }
  };

  const handleAddProposalMilestone = () => {
    if (!newMilestoneTitle.trim()) {
      triggerToast("error", "Milestone description is required.");
      return;
    }
    if (!newMilestoneAmount || Number(newMilestoneAmount) <= 0) {
      triggerToast("error", "Milestone amount must be a positive number.");
      return;
    }
    const amount = Number(newMilestoneAmount);
    
    const currentTotal = proposalMilestones.reduce((sum, m) => sum + m.amount, 0);
    if (currentTotal + amount > proposalBidAmount) {
      triggerToast("error", `Total milestone amount ($${(currentTotal + amount).toLocaleString()}) cannot exceed the offered total bid amount ($${proposalBidAmount.toLocaleString()}).`);
      return;
    }

    setProposalMilestones((prev) => [...prev, { title: newMilestoneTitle.trim(), amount }]);
    setNewMilestoneTitle("");
    setNewMilestoneAmount("");
  };

  const handleRemoveProposalMilestone = (index: number) => {
    setProposalMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchChatMessages = async (convId: number) => {
    try {
      setLoadingChatMessages(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/messages/conversation/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChatMessages(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch chat messages:", e);
    } finally {
      setLoadingChatMessages(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !newMessageText.trim()) return;

    try {
      setSendingChatMessage(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: selectedConvId,
          message_text: newMessageText.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNewMessageText("");
        setChatMessages((prev) => [...prev, data.chatMessage]);
        fetchConversations();
      } else {
        triggerToast("error", data.message || "Failed to send message.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Please try again.");
    } finally {
      setSendingChatMessage(false);
    }
  };

  const handlePostJobCategoryChange = async (catId: string) => {
    setPostJobCategoryId(catId);
    setPostJobSubCategoryId("");
    if (catId) {
      try {
        const res = await fetch("http://localhost:5000/api/admin/sub-categories");
        if (res.ok) {
          const data = await res.json();
          setPostJobSubCategories(data.filter((sub: any) => sub.category_id.toString() === catId));
        }
      } catch (e) {
        console.error("Failed to fetch sub-categories:", e);
      }
    } else {
      setPostJobSubCategories([]);
    }
  };

  const handlePostJobSubCategoryChange = async (subCatId: string) => {
    setPostJobSubCategoryId(subCatId);
    setPostJobSelectedSkills([]);
    if (subCatId) {
      try {
        const res = await fetch(`http://localhost:5000/api/admin/skills/subcategory/${subCatId}`);
        if (res.ok) {
          setPostJobAvailableSkills(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch skills:", e);
      }
    } else {
      setPostJobAvailableSkills([]);
    }
  };

  const fetchPostJobLanguages = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/freelancer/languages");
      if (res.ok) {
        setPostJobAvailableLanguages(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch languages for post job:", e);
    }
  };

  const handlePostJobToggleSkill = (skillId: number) => {
    setPostJobSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handlePostJobToggleLanguage = (langId: number) => {
    setPostJobSelectedLanguages((prev) =>
      prev.includes(langId) ? prev.filter((id) => id !== langId) : [...prev, langId]
    );
  };

  const fetchGigs = async () => {
    try {
      setLoadingGigs(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/gigs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setGigs(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch gigs:", e);
    } finally {
      setLoadingGigs(false);
    }
  };

  const fetchClientGigs = async () => {
    try {
      setLoadingClientGigs(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/client/gigs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setClientGigs(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch client gigs:", e);
    } finally {
      setLoadingClientGigs(false);
    }
  };

  const fetchFreelancerApplications = async () => {
    try {
      setLoadingApplications(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/gigs/applications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setGigApplications(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch gig applications:", e);
    } finally {
      setLoadingApplications(false);
    }
  };

  const fetchClientApplications = async () => {
    try {
      setLoadingClientApplications(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/client/gigs/applications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setClientApplications(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch client applications:", e);
    } finally {
      setLoadingClientApplications(false);
    }
  };

  const fetchHiredFreelancers = async () => {
    try {
      setLoadingHiredFreelancers(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/client/hired-freelancers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHiredFreelancers(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch hired freelancers:", e);
    } finally {
      setLoadingHiredFreelancers(false);
    }
  };

  const handleApplyGigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingGig) return;
    if (!orderRequirements.trim()) {
      setOrderError("Please describe your project requirements.");
      return;
    }

    try {
      setOrderSubmitting(true);
      setOrderError("");
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/client/gigs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gig_id: applyingGig.gig_id,
          requirements: orderRequirements.trim(),
          price: parseFloat(applyingGig.price),
          currency_id: applyingGig.currency_id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(true);
        setOrderRequirements("");
        setTimeout(() => {
          setIsApplying(false);
          setApplyingGig(null);
          setOrderSuccess(false);
          fetchFreelancerApplications();
          fetchClientApplications();
        }, 1500);
      } else {
        setOrderError(data.message || "Failed to submit application.");
      }
    } catch (err) {
      setOrderError("Network error. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: number, status: "Accepted" | "Rejected") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/freelancer/gigs/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerToast("success", `Order request ${status.toLowerCase()}!`);
        fetchFreelancerApplications();
      } else {
        const data = await res.json();
        triggerToast("error", data.message || "Failed to update order request status.");
      }
    } catch (e) {
      triggerToast("error", "Network error updating request status.");
    }
  };

  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/currencies", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data);
        if (data.length > 0) {
          const usd = data.find((c: any) => c.code === "USD");
          setGigCurrencyId(usd ? usd.currency_id.toString() : data[0].currency_id.toString());
        }
      }
    } catch (e) {
      console.error("Failed to fetch currencies:", e);
    }
  };

  const fetchGigCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/categories");
      if (res.ok) {
        setGigCategories(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    }
  };

  const fetchGigSubCategories = async (catId?: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/sub-categories");
      if (res.ok) {
        const data = await res.json();
        if (catId) {
          setGigSubCategories(data.filter((sub: any) => sub.category_id.toString() === catId));
        } else {
          setGigSubCategories(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sub-categories:", e);
    }
  };

  const fetchGigSkills = async (subCatId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/skills/subcategory/${subCatId}`);
      if (res.ok) {
        setGigAvailableSkills(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch skills:", e);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/upload", {
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

  const fetchClientProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/users/client-profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setClientBasics({
            company_name: data.company_name || "",
            company_size: data.company_size || "1-10",
            industry: data.industry || "Technology",
            company_website: data.company_website || "",
            company_description: data.company_description || "",
            company_established_year: data.company_established_year || "",
            hiring_contact_name: data.hiring_contact_name || "",
            hiring_contact_designation: data.hiring_contact_designation || "",
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch client profile:", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingImages(true);
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const url = await uploadFile(file);
        urls.push(url);
      }
      const existing = gigImages ? gigImages.split(",").map(u => u.trim()).filter(Boolean) : [];
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
      const url = await uploadFile(e.target.files[0]);
      setGigVideoUrl(url);
      triggerToast("success", "Video uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingDocs(true);
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const url = await uploadFile(file);
        urls.push(url);
      }
      const existing = gigDocuments ? gigDocuments.split(",").map(u => u.trim()).filter(Boolean) : [];
      setGigDocuments([...existing, ...urls].join(", "));
      triggerToast("success", "Documents uploaded successfully!");
    } catch (err: any) {
      triggerToast("error", err.message || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleGigCategoryChange = (catId: string) => {
    setGigCategoryId(catId);
    setGigSubCategoryId("");
    setGigSelectedSkills([]);
    setGigAvailableSkills([]);
    fetchGigSubCategories(catId);
  };

  const handleGigSubCategoryChange = (subCatId: string) => {
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

  const handleCreateGigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGigError("");
    setGigSuccess(false);

    if (!gigTitle.trim() || !gigDescription.trim() || !gigPrice || !gigCurrencyId || !gigDeliveryDays) {
      setGigError("Please fill out all required fields marked with *");
      return;
    }

    try {
      setGigPublishing(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/freelancer/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category_id: gigCategoryId ? parseInt(gigCategoryId) : null,
          sub_category_id: gigSubCategoryId ? parseInt(gigSubCategoryId) : null,
          title: gigTitle.trim(),
          description: gigDescription.trim(),
          price: parseFloat(gigPrice),
          currency_id: parseInt(gigCurrencyId),
          delivery_days: parseInt(gigDeliveryDays),
          revisions: gigRevisions ? parseInt(gigRevisions) : null,
          images: gigImages ? gigImages.split(",").map((url) => url.trim()) : [],
          video_url: gigVideoUrl.trim() || null,
          documents: gigDocuments ? gigDocuments.split(",").map((url) => url.trim()) : [],
          skills: gigSelectedSkills
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGigSuccess(true);
        setGigTitle("");
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
        
        setTimeout(() => {
          setIsCreatingGig(false);
          setGigSuccess(false);
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

  const deleteExperience = (index: number) => {
    const updated = experiences.filter((_, idx) => idx !== index);
    setExperiences(updated);
    localStorage.setItem("profile_experiences", JSON.stringify(updated));
    triggerToast("success", "Experience removed.");
  };

  const deleteEducation = (index: number) => {
    const updated = educations.filter((_, idx) => idx !== index);
    setEducations(updated);
    localStorage.setItem("profile_education", JSON.stringify(updated));
    triggerToast("success", "Education removed.");
  };

  const deleteCertification = (index: number) => {
    const updated = certifications.filter((_, idx) => idx !== index);
    setCertifications(updated);
    localStorage.setItem("profile_certifications", JSON.stringify(updated));
    triggerToast("success", "Certification removed.");
  };

  const handleSaveStep = async (stepNum: number) => {
    let bodyData: any = {};
    if (stepNum === 1) {
      if (!profileBasics.professional_title.trim() || !profileBasics.experience_level) {
        triggerToast("error", "Title and experience level are required.");
        return;
      }
      bodyData = {
        professional_title: profileBasics.professional_title,
        experience_level: profileBasics.experience_level,
        availability_status: profileBasics.availability_status,
        total_experience_years: profileBasics.total_experience_years ? parseInt(String(profileBasics.total_experience_years)) : 0,
        hourly_rate: profileBasics.hourly_rate ? parseFloat(String(profileBasics.hourly_rate)) : 0
      };
    } else if (stepNum === 2) {
      bodyData = {
        linkedin_url: profileBasics.linkedin_url || null,
        portfolio_website: profileBasics.portfolio_website || null,
        resume_url: profileBasics.resume_url || null
      };
    } else if (stepNum === 3) {
      bodyData = {
        experiences,
        educations
      };
    } else if (stepNum === 4) {
      bodyData = {
        certifications
      };
    } else if (stepNum === 5) {
      bodyData = {
        skills: selectedSkills
      };
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/profile-details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        triggerToast("success", `Step ${stepNum} Saved successfully!`);
        localStorage.setItem("profile_basics", JSON.stringify(profileBasics));
        localStorage.setItem("profile_experiences", JSON.stringify(experiences));
        localStorage.setItem("profile_education", JSON.stringify(educations));
        localStorage.setItem("profile_certifications", JSON.stringify(certifications));
        localStorage.setItem("profile_skills", JSON.stringify(selectedSkills));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveClientStepSettings = async (stepNum: number) => {
    let bodyData: any = {};
    if (stepNum === 1) {
      if (!clientBasics.company_name.trim() || !clientBasics.industry || !clientBasics.company_size) {
        triggerToast("error", "Company name, size, and industry are required.");
        return;
      }
      bodyData = {
        company_name: clientBasics.company_name,
        industry: clientBasics.industry,
        company_size: clientBasics.company_size,
        company_established_year: clientBasics.company_established_year ? parseInt(String(clientBasics.company_established_year)) : null
      };
    } else if (stepNum === 2) {
      bodyData = {
        company_website: clientBasics.company_website,
        company_description: clientBasics.company_description
      };
    } else if (stepNum === 3) {
      if (!clientBasics.hiring_contact_name.trim() || !clientBasics.hiring_contact_designation.trim()) {
        triggerToast("error", "Contact name and designation are required.");
        return;
      }
      bodyData = {
        hiring_contact_name: clientBasics.hiring_contact_name,
        hiring_contact_designation: clientBasics.hiring_contact_designation,
        onboarding_completed: true
      };
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/client-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        triggerToast("success", `Step ${stepNum} Saved successfully!`);
        fetchClientProfile();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartConversation = async (recipientId: number | string) => {
    const numericId = parseInt(String(recipientId));
    if (isNaN(numericId) || numericId < 1) {
      triggerToast("success", "Demo Mode Chat Opened", "Redirecting to Inbox room...");
      setActiveTab("inbox");
      setSelectedFreelancerProfile(null);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/messages/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: numericId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTab("inbox");
        setSelectedConvId(data.conversationId);
        setSelectedFreelancerProfile(null);
      } else {
        const errData = await res.json();
        triggerToast("error", errData.message || "Failed to start chat session.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("error", "Network error. Please try again.");
    }
  };

  const handleUpdateGigApplication = (updatedApp: any) => {
    setSelectedGigOrderDetails(updatedApp);
    setClientApplications(prev => prev.map(a => a.application_id === updatedApp.application_id ? { ...a, ...updatedApp } : a));
  };

  const handleRoleSwitch = (role: string) => {
    setUserRole(role);
    localStorage.setItem("onboarding_role", role);
    triggerToast("success", "Active workspace switched", `Switched to ${role === "client" ? "Client" : "Freelancer"} mode.`);
  };

  const handleToggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) => {
      if (prev.includes(skillId)) {
        return prev.filter((id) => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
  };

  const updateOnboardingStep = async (stepNum: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/freelancer/onboarding/step`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentStep: stepNum })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkipStep2 = async () => {
    setWizardStep(3);
    await updateOnboardingStep(3);
  };

  const handleSkipStep3 = async () => {
    setWizardStep(4);
    await updateOnboardingStep(4);
  };

  const handleSaveStep3 = async () => {
    setWizardStep(4);
    await updateOnboardingStep(4);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    await handlePortfolioSubmit(e);
  };

  const handleFinishOnboarding = () => {
    setOnboardingCompleted(true);
    localStorage.setItem("onboarding_completed", "true");
  };

  const handleSaveClientStep = async (stepNum: number) => {
    if (stepNum === 1) {
      if (!companyName.trim() || !industry || !companySize) {
        triggerToast("error", "Company name, size, and industry are required.");
        return;
      }
      setClientWizardStep(2);
    } else if (stepNum === 2) {
      setClientWizardStep(3);
    } else if (stepNum === 3) {
      if (!hiringContactName.trim() || !hiringContactDesignation.trim()) {
        triggerToast("error", "Hiring contact details are required.");
        return;
      }
      try {
        setClientError("");
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/users/client-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            company_name: companyName.trim(),
            company_size: companySize,
            industry,
            company_website: companyWebsite.trim() || null,
            company_description: companyDescription.trim() || null,
            company_established_year: companyEstablishedYear ? parseInt(companyEstablishedYear) : null,
            hiring_contact_name: hiringContactName.trim(),
            hiring_contact_designation: hiringContactDesignation.trim(),
            onboarding_completed: true
          })
        });

        if (res.ok) {
          setClientSuccess(true);
          triggerToast("success", "Client profile published successfully!");
          setTimeout(() => {
            setOnboardingCompleted(true);
            localStorage.setItem("onboarding_completed", "true");
          }, 1000);
        } else {
          const data = await res.json();
          setClientError(data.message || "Failed to complete onboarding.");
          triggerToast("error", data.message || "Failed to complete onboarding.");
        }
      } catch (err) {
        setClientError("Network error.");
        triggerToast("error", "Network error.");
      }
    }
  };

  const fetchWalletInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoadingWallet(true);
      const res = await fetch("http://localhost:5000/api/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setWalletInfo(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch wallet info:", e);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      triggerToast("error", "Please provide a valid withdrawal amount.");
      return;
    }
    if (!withdrawAccount.trim()) {
      triggerToast("error", "Payout account details are required.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          paymentMethod: withdrawMethod,
          accountDetails: withdrawAccount
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Payout requested!", "Admin will review and process manually.");
        setWithdrawAmount("");
        setWithdrawAccount("");
        fetchWalletInfo();
      } else {
        triggerToast("error", data.message || "Failed to request withdrawal.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to request withdrawal.");
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      triggerToast("error", "Please provide a valid deposit amount.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Funds added successfully (Test Simulation)!");
        setDepositAmount("");
        fetchWalletInfo();
      } else {
        triggerToast("error", data.message || "Failed to deposit funds.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to deposit funds.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletInfo();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "wallet") {
      fetchWalletInfo();
    }
  }, [isAuthenticated, activeTab]);

  // Combined value object
  const value = useMemo(() => ({
    isAuthenticated, setIsAuthenticated,
    onboardingCompleted, setOnboardingCompleted,
    onboardingStep, setOnboardingStep,
    selectedRole, setSelectedRole,
    activeView, setActiveView,
    clientNotice, setClientNotice,
    isSidebarOpen, setIsSidebarOpen,
    categories, subCategories, availableSkills, languages,
    companyName, setCompanyName,
    companySize, setCompanySize,
    industry, setIndustry,
    companyWebsite, setCompanyWebsite,
    companyDescription, setCompanyDescription,
    companyEstablishedYear, setCompanyEstablishedYear,
    hiringContactName, setHiringContactName,
    hiringContactDesignation, setHiringContactDesignation,
    clientWizardStep, setClientWizardStep,
    clientError, setClientError,
    clientSuccess, setClientSuccess,
    wizardStep, setWizardStep,
    onboardingStepsStatus, setOnboardingStepsStatus,
    categoryId, setCategoryId,
    subCategoryId, setSubCategoryId,
    professionalTitle, setProfessionalTitle,
    experienceLevel, setExperienceLevel,
    totalExperienceYears, setTotalExperienceYears,
    hourlyRate, setHourlyRate,
    availabilityStatus, setAvailabilityStatus,
    linkedinUrl, setLinkedinUrl,
    portfolioWebsite, setPortfolioWebsite,
    resumeUrl, setResumeUrl,
    selectedSkillIds, setSelectedSkillIds,
    selectedLanguageIds, setSelectedLanguageIds,
    step1Error, setStep1Error,
    step1Success, setStep1Success,
    experiences, setExperiences,
    educations, setEducations,
    certifications, setCertifications,
    expCompany, setExpCompany,
    expTitle, setExpTitle,
    expEmpType, setExpEmpType,
    expStart, setExpStart,
    expEnd, setExpEnd,
    expCurrent, setExpCurrent,
    expDesc, setExpDesc,
    eduInst, setEduInst,
    eduDegree, setEduDegree,
    eduField, setEduField,
    eduStart, setEduStart,
    eduEnd, setEduEnd,
    certName, setCertName,
    certOrg, setCertOrg,
    certDate, setCertDate,
    certCredUrl, setCertCredUrl,
    userEmail, setUserEmail,
    userPhone, setUserPhone,
    emailVerified, setEmailVerified,
    phoneVerified, setPhoneVerified,
    emailOtp, setEmailOtp,
    phoneOtp, setPhoneOtp,
    emailOtpSent, setEmailOtpSent,
    phoneOtpSent, setPhoneOtpSent,
    otpError, setOtpError,
    otpSuccess, setOtpSuccess,
    projectTitle, setProjectTitle,
    projectDesc, setProjectDesc,
    projectImages, setProjectImages,
    projectVideo, setProjectVideo,
    projectDocs, setProjectDocs,
    portfolioSuccess, setPortfolioSuccess,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    siteTheme, setSiteTheme,
    userName, setUserName,
    gigs, setGigs,
    currencies, setCurrencies,
    loadingGigs, setLoadingGigs,
    isCreatingGig, setIsCreatingGig,
    gigTitle, setGigTitle,
    gigDescription, setGigDescription,
    gigPrice, setGigPrice,
    gigCurrencyId, setGigCurrencyId,
    gigDeliveryDays, setGigDeliveryDays,
    gigRevisions, setGigRevisions,
    gigImages, setGigImages,
    gigVideoUrl, setGigVideoUrl,
    gigDocuments, setGigDocuments,
    gigCategoryId, setGigCategoryId,
    gigSubCategoryId, setGigSubCategoryId,
    gigSelectedSkills, setGigSelectedSkills,
    gigError, setGigError,
    gigSuccess, setGigSuccess,
    gigPublishing, setGigPublishing,
    gigCategories, setGigCategories,
    gigSubCategories, setGigSubCategories,
    gigAvailableSkills, setGigAvailableSkills,
    userRole, setUserRole,
    clientGigs, setClientGigs,
    loadingClientGigs, setLoadingClientGigs,
    gigApplications, setGigApplications,
    loadingApplications, setLoadingApplications,
    clientApplications, setClientApplications,
    loadingClientApplications, setLoadingClientApplications,
    hiredFreelancers, setHiredFreelancers,
    loadingHiredFreelancers, setLoadingHiredFreelancers,
    isApplying, setIsApplying,
    applyingGig, setApplyingGig,
    orderRequirements, setOrderRequirements,
    orderSubmitting, setOrderSubmitting,
    orderSuccess, setOrderSuccess,
    orderError, setOrderError,
    uploadingImages, setUploadingImages,
    uploadingVideo, setUploadingVideo,
    uploadingDocs, setUploadingDocs,
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    postJobTitle, setPostJobTitle,
    postJobBudget, setPostJobBudget,
    postJobCategoryId, setPostJobCategoryId,
    postJobSubCategoryId, setPostJobSubCategoryId,
    postJobSubCategories, setPostJobSubCategories,
    postJobDescription, setPostJobDescription,
    postJobExpLevel, setPostJobExpLevel,
    postJobStep, setPostJobStep,
    postJobType, setPostJobType,
    postJobMilestoneType, setPostJobMilestoneType,
    postJobMinBudget, setPostJobMinBudget,
    postJobMaxBudget, setPostJobMaxBudget,
    postJobDuration, setPostJobDuration,
    postJobLocation, setPostJobLocation,
    postJobNumFreelancers, setPostJobNumFreelancers,
    postJobAvailableSkills, setPostJobAvailableSkills,
    postJobSelectedSkills, setPostJobSelectedSkills,
    postJobAvailableLanguages, setPostJobAvailableLanguages,
    postJobSelectedLanguages, setPostJobSelectedLanguages,
    postJobMaxHours, setPostJobMaxHours,
    postJobPaymentMode, setPostJobPaymentMode,
    clientJobs, setClientJobs,
    loadingClientJobs, setLoadingClientJobs,
    isCreatingJob, setIsCreatingJob,
    editingDraftJobId, setEditingDraftJobId,
    selectedProjectDetails, setSelectedProjectDetails,
    selectedGigOrderDetails, setSelectedGigOrderDetails,
    selectedFreelancerProfile, setSelectedFreelancerProfile,
    loadingProfileDetails, setLoadingProfileDetails,
    projectProposals, setProjectProposals,
    loadingProjectProposals, setLoadingProjectProposals,
    allJobs, setAllJobs,
    loadingAllJobs, setLoadingAllJobs,
    jobSearchQuery, setJobSearchQuery,
    jobSelectedCategory, setJobSelectedCategory,
    showProposalModal, setShowProposalModal,
    applyingJob, setApplyingJob,
    proposalCoverLetter, setProposalCoverLetter,
    proposalBidAmount, setProposalBidAmount,
    proposalDeliveryDays, setProposalDeliveryDays,
    proposalSubmitting, setProposalSubmitting,
    proposalError, setProposalError,
    proposalMilestones, setProposalMilestones,
    newMilestoneTitle, setNewMilestoneTitle,
    newMilestoneAmount, setNewMilestoneAmount,
    proposalUseMilestones, setProposalUseMilestones,
    freelancerProposals, setFreelancerProposals,
    loadingFreelancerProposals, setLoadingFreelancerProposals,
    expandedJobId, setExpandedJobId,
    activeJobProposals, setActiveJobProposals,
    loadingActiveJobProposals, setLoadingActiveJobProposals,
    appliedJobIds,
    conversations, setConversations,
    selectedConvId, setSelectedConvId,
    chatMessages, setChatMessages,
    newMessageText, setNewMessageText,
    loadingConversations, setLoadingConversations,
    loadingChatMessages, setLoadingChatMessages,
    sendingChatMessage, setSendingChatMessage,
    notifications, setNotifications,
    unreadNotificationsCount, setUnreadNotificationsCount,
    isNotificationsOpen, setIsNotificationsOpen,
    filteredFreelancers,
    profileStep, setProfileStep,
    isEditingProfile, setIsEditingProfile,
    showPublishConfirmModal, setShowPublishConfirmModal,
    clientBasics, setClientBasics,
    profileBasics, setProfileBasics,
    selectedSkills, setSelectedSkills,
    availableSkillsList,
    apiAlert, setApiAlert,
    stepsStatus, profileCompletionProgress,
    handleSelectFreelancer, handleSelectClient, handleCategoryChange,
    handleSaveStep1, handleAddExperience, handleAddEducation, handleAddCertification,
    handleSendEmailOtp, handleVerifyEmailOtp, handleSendPhoneOtp, handleVerifyPhoneOtp,
    handlePortfolioSubmit, handleClientSubmit, handleSkip,
    handleRemoveExperience, handleRemoveEducation, handleRemoveCertification,
    triggerToast, fetchNotifications, fetchUnreadCount, handleMarkAllRead, handleMarkSingleRead,
    fetchClientProfile, fetchClientJobs, fetchAllJobs, fetchFreelancerProposals,
    fetchActiveJobProposals, handleUpdateProposalStatus, handleSubmitProposal,
    handleAddProposalMilestone, handleRemoveProposalMilestone, fetchConversations,
    fetchChatMessages, handleSendChatMessage, handlePostJobCategoryChange,
    handlePostJobSubCategoryChange, fetchPostJobLanguages, handlePostJobToggleSkill,
    handlePostJobToggleLanguage, fetchGigs, fetchClientGigs, fetchFreelancerApplications,
    fetchClientApplications, fetchHiredFreelancers, handleApplyGigSubmit,
    handleUpdateApplicationStatus, fetchCurrencies, fetchGigCategories,
    fetchGigSubCategories, fetchGigSkills, handleImageUpload, handleVideoUpload,
    handleDocUpload, handleGigCategoryChange, handleGigSubCategoryChange,
    handleGigToggleSkill, handleCreateGigSubmit, deleteExperience, deleteEducation,
    deleteCertification, handleSaveStep, handleSaveClientStepSettings,
    handleStartConversation, handleUpdateGigApplication, setActiveTab, activeTab,
    handleRoleSwitch, handleToggleSkill, handleSkipStep2, updateOnboardingStep,
    handleSkipStep3, handleSaveStep3, handleAddProject, handleFinishOnboarding,
    handleSaveClientStep,
    walletInfo, loadingWallet,
    withdrawAmount, setWithdrawAmount,
    withdrawMethod, setWithdrawMethod,
    withdrawAccount, setWithdrawAccount,
    depositAmount, setDepositAmount,
    fetchWalletInfo, handleWithdrawSubmit, handleDepositSubmit
  }), [
    isAuthenticated, onboardingCompleted, onboardingStep, selectedRole, activeView,
    clientNotice, isSidebarOpen, categories, subCategories, availableSkills, languages,
    companyName, companySize, industry, companyWebsite, companyDescription,
    companyEstablishedYear, hiringContactName, hiringContactDesignation, clientWizardStep,
    clientError, clientSuccess, wizardStep, onboardingStepsStatus, categoryId,
    subCategoryId, professionalTitle, experienceLevel, totalExperienceYears, hourlyRate,
    availabilityStatus, linkedinUrl, portfolioWebsite, resumeUrl, selectedSkillIds,
    selectedLanguageIds, step1Error, step1Success, experiences, educations, certifications,
    expCompany, expTitle, expEmpType, expStart, expEnd, expCurrent, expDesc, eduInst,
    eduDegree, eduField, eduStart, eduEnd, certName, certOrg, certDate, certCredUrl,
    userEmail, userPhone, emailVerified, phoneVerified, emailOtp, phoneOtp, emailOtpSent,
    phoneOtpSent, otpError, otpSuccess, projectTitle, projectDesc, projectImages,
    projectVideo, projectDocs, portfolioSuccess, primaryColor, secondaryColor, siteTheme,
    userName, gigs, currencies, loadingGigs, isCreatingGig, gigTitle, gigDescription,
    gigPrice, gigCurrencyId, gigDeliveryDays, gigRevisions, gigImages, gigVideoUrl,
    gigDocuments, gigCategoryId, gigSubCategoryId, gigSelectedSkills, gigError,
    gigSuccess, gigPublishing, gigCategories, gigSubCategories, gigAvailableSkills,
    userRole, clientGigs, loadingClientGigs, gigApplications, loadingApplications,
    clientApplications, loadingClientApplications, hiredFreelancers, loadingHiredFreelancers,
    isApplying, applyingGig, orderRequirements, orderSubmitting, orderSuccess, orderError,
    uploadingImages, uploadingVideo, uploadingDocs, searchQuery, selectedCategory,
    postJobTitle, postJobBudget, postJobCategoryId, postJobSubCategoryId, postJobSubCategories,
    postJobDescription, postJobExpLevel, postJobStep, postJobType, postJobMilestoneType,
    postJobMinBudget, postJobMaxBudget, postJobDuration, postJobLocation, postJobNumFreelancers,
    postJobAvailableSkills, postJobSelectedSkills, postJobAvailableLanguages,
    postJobSelectedLanguages, postJobMaxHours, postJobPaymentMode, clientJobs,
    loadingClientJobs, isCreatingJob, editingDraftJobId, selectedProjectDetails,
    selectedGigOrderDetails, selectedFreelancerProfile, loadingProfileDetails,
    projectProposals, loadingProjectProposals, allJobs, loadingAllJobs, jobSearchQuery,
    jobSelectedCategory, showProposalModal, applyingJob, proposalCoverLetter,
    proposalBidAmount, proposalDeliveryDays, proposalSubmitting, proposalError,
    proposalMilestones, newMilestoneTitle, newMilestoneAmount, proposalUseMilestones,
    freelancerProposals, loadingFreelancerProposals, expandedJobId, activeJobProposals,
    loadingActiveJobProposals, appliedJobIds, conversations, selectedConvId, chatMessages,
    newMessageText, loadingConversations, loadingChatMessages, sendingChatMessage,
    notifications, unreadNotificationsCount, isNotificationsOpen, filteredFreelancers,
    profileStep, isEditingProfile, showPublishConfirmModal, clientBasics, profileBasics,
    selectedSkills, availableSkillsList, apiAlert, stepsStatus, profileCompletionProgress,
    activeTab,
    handleRoleSwitch, handleToggleSkill, handleSkipStep2, updateOnboardingStep,
    handleSkipStep3, handleSaveStep3, handleAddProject, handleFinishOnboarding,
    handleSaveClientStep,
    walletInfo, loadingWallet, withdrawAmount, withdrawMethod, withdrawAccount, depositAmount
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
