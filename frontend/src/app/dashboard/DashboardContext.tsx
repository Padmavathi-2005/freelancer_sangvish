"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { initSocket, disconnectSocket } from "@/utils/socket";

import { API_URL } from "@/config/api";

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
  forceShowOnboarding: boolean;
  setForceShowOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
  showOnboardingModal: boolean;
  setShowOnboardingModal: React.Dispatch<React.SetStateAction<boolean>>;
  vettingStatus: string;
  setVettingStatus: React.Dispatch<React.SetStateAction<string>>;
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
  clientFieldErrors: Record<string, string>; setClientFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  wizardStep: number; setWizardStep: React.Dispatch<React.SetStateAction<number>>;
  onboardingStepsStatus: { profile: boolean; career: boolean; verification: boolean; portfolio: boolean };
  setOnboardingStepsStatus: React.Dispatch<React.SetStateAction<{ profile: boolean; career: boolean; verification: boolean; portfolio: boolean }>>;

  enabledDocFields: any[];
  userUploadedDocs: any[];
  loadingDocFields: boolean;
  fetchEnabledDocFields: (role?: string) => Promise<void>;
  fetchUserUploadedDocs: () => Promise<void>;
  handleUploadDocument: (fieldId: number, file: File, expiryDate?: string) => Promise<any>;
  isFieldEnabled: (key: string) => boolean;
  isFieldRequired: (key: string) => boolean;
  totalClientSteps: number;
  totalFreelancerSteps: number;

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
  selectedLanguages: Array<{ language_id: number; proficiency: string }>;
  setSelectedLanguages: React.Dispatch<React.SetStateAction<Array<{ language_id: number; proficiency: string }>>>;
  handleUpdateLanguageProficiency: (langId: number, proficiency: string) => void;
  step1Error: string; setStep1Error: (v: string) => void;
  step1Success: boolean; setStep1Success: (v: boolean) => void;
  step1FieldErrors: Record<string, string>; setStep1FieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

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
  sendingEmailOtp: boolean; setSendingEmailOtp: (v: boolean) => void;
  sendingPhoneOtp: boolean; setSendingPhoneOtp: (v: boolean) => void;
  verifyingEmailOtp: boolean; setVerifyingEmailOtp: (v: boolean) => void;
  verifyingPhoneOtp: boolean; setVerifyingPhoneOtp: (v: boolean) => void;
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
  siteName: string; setSiteName: (v: string) => void;
  siteLogo: string; setSiteLogo: (v: string) => void;
  siteLogoDark: string; setSiteLogoDark: (v: string) => void;

  // Core Dashboard State (merged from Dashboard.tsx)
  userName: string; setUserName: React.Dispatch<React.SetStateAction<string>>;
  profileImage: string | null; setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  handleProfileImageUpload: (file: File) => Promise<void>;
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
  orderMilestones: any[]; setOrderMilestones: React.Dispatch<React.SetStateAction<any[]>>;
  orderPaymentMethod: string; setOrderPaymentMethod: (v: string) => void;
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
  postJobMinHours: number; setPostJobMinHours: React.Dispatch<React.SetStateAction<number>>;
  postJobPaymentMode: string; setPostJobPaymentMode: (v: string) => void;

  // Client Job Posts listing states
  clientJobs: any[]; setClientJobs: React.Dispatch<React.SetStateAction<any[]>>;
  loadingClientJobs: boolean; setLoadingClientJobs: React.Dispatch<React.SetStateAction<boolean>>;
  isCreatingJob: boolean; setIsCreatingJob: React.Dispatch<React.SetStateAction<boolean>>;
  editingDraftJobId: number | null; setEditingDraftJobId: React.Dispatch<React.SetStateAction<number | null>>;
  pendingInviteFreelancer: any | null; setPendingInviteFreelancer: React.Dispatch<React.SetStateAction<any | null>>;
  
  // Custom dashboard detail states
  selectedProjectDetails: any | null; setSelectedProjectDetails: React.Dispatch<React.SetStateAction<any | null>>;
  selectedGigOrderDetails: any | null; setSelectedGigOrderDetails: React.Dispatch<React.SetStateAction<any | null>>;
  selectedFreelancerProfile: any | null; setSelectedFreelancerProfile: React.Dispatch<React.SetStateAction<any | null>>;
  selectedFreelancerFullProfile: any | null;
  loadingFullProfile: boolean;
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
  proposalLimitReached: boolean;
  proposalLimitMsg: string;
  fetchProposalLimitStatus: () => Promise<void>;

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
  freelancerContracts: any[];
  recommendedClients: any[];
  fetchFreelancerContracts: () => Promise<void>;
  fetchRecommendedClients: () => Promise<void>;
  requestContractPayment: (contractId: number) => Promise<void>;
  approveContractPayment: (contractId: number) => Promise<void>;
  startWorkContract: (contractId: number) => Promise<void>;
  requestMilestoneFunding: (milestoneId: number) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Authentication & Onboarding States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [forceShowOnboarding, setForceShowOnboarding] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [hasFreelancerProfile, setHasFreelancerProfile] = useState<boolean>(false);
  const [hasClientProfile, setHasClientProfile] = useState<boolean>(false);
  const [vettingStatus, setVettingStatus] = useState<string>("Approved"); // default Approved unless backend says otherwise
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
  const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});

  // Freelancer Wizard steps
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [enabledDocFields, setEnabledDocFields] = useState<any[]>([]);
  const [userUploadedDocs, setUserUploadedDocs] = useState<any[]>([]);
  const [loadingDocFields, setLoadingDocFields] = useState(false);
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
  const [selectedLanguages, setSelectedLanguages] = useState<Array<{ language_id: number; proficiency: string }>>([]);

  useEffect(() => {
    setSelectedLanguages(prev => {
      const currentIds = prev.map(l => l.language_id);
      const hasChanged = selectedLanguageIds.length !== currentIds.length || !selectedLanguageIds.every(id => currentIds.includes(id));
      if (!hasChanged) return prev;
      return selectedLanguageIds.map(id => {
        const existing = prev.find(p => p.language_id === id);
        return {
          language_id: id,
          proficiency: existing ? existing.proficiency : 'Basic'
        };
      });
    });
  }, [selectedLanguageIds]);

  const handleUpdateLanguageProficiency = (langId: number, proficiency: string) => {
    setSelectedLanguages(prev => prev.map(l => l.language_id === langId ? { ...l, proficiency } : l));
  };
  const [step1Error, setStep1Error] = useState<string>("");
  const [step1Success, setStep1Success] = useState<boolean>(false);
  const [step1FieldErrors, setStep1FieldErrors] = useState<Record<string, string>>({});

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
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");

  // Step 4 Form States (Portfolio Project)
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectImages, setProjectImages] = useState("");
  const [projectVideo, setProjectVideo] = useState("");
  const [projectDocs, setProjectDocs] = useState("");
  const [portfolioSuccess, setPortfolioSuccess] = useState(false);

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("primaryColor") || "#0f766e";
    }
    return "#0f766e";
  });
  const [secondaryColor, setSecondaryColor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("secondaryColor") || "#06b6d4";
    }
    return "#06b6d4";
  });
  const [siteTheme, setSiteThemeState] = useState("light");
  const [siteName, setSiteName] = useState("Buy2Lancer");
  const [siteLogo, setSiteLogo] = useState("/public/logo.png");
  const [siteLogoDark, setSiteLogoDark] = useState("/public/logo.png");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("siteTheme");
      if (saved === "light" || saved === "dark") {
        setSiteThemeState(saved);
      }
    }
  }, []);

  const setSiteTheme = (theme: string) => {
    setSiteThemeState(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("siteTheme", theme);
    }
  };

  // Core Dashboard State
  const [userName, setUserName] = useState("Liam");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [gigs, setGigs] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [freelancerContracts, setFreelancerContracts] = useState<any[]>([]);
  const [recommendedClients, setRecommendedClients] = useState<any[]>([]);
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
  const [orderMilestones, setOrderMilestones] = useState<any[]>([]);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState("wallet");
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
  const [postJobMinHours, setPostJobMinHours] = useState(10);
  const [postJobPaymentMode, setPostJobPaymentMode] = useState("Weekly");

  // Client Job Posts listing states
  const [clientJobs, setClientJobs] = useState<any[]>([]);
  const [loadingClientJobs, setLoadingClientJobs] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [editingDraftJobId, setEditingDraftJobId] = useState<number | null>(null);
  const [pendingInviteFreelancer, setPendingInviteFreelancer] = useState<any | null>(null);
  
  // Custom dashboard detail states
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<any | null>(null);
  const [selectedGigOrderDetails, setSelectedGigOrderDetails] = useState<any | null>(null);
  const [selectedFreelancerProfile, setSelectedFreelancerProfile] = useState<any | null>(null);
  const [selectedFreelancerFullProfile, setSelectedFreelancerFullProfile] = useState<any | null>(null);
  const [loadingFullProfile, setLoadingFullProfile] = useState(false);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);
  const [projectProposals, setProjectProposals] = useState<any[]>([]);
  const [loadingProjectProposals, setLoadingProjectProposals] = useState(false);

  useEffect(() => {
    if (!selectedFreelancerProfile || !selectedFreelancerProfile.user_id) {
      setSelectedFreelancerFullProfile(null);
      return;
    }
    const fetchFullProfile = async () => {
      setLoadingFullProfile(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/freelancer/profile/${selectedFreelancerProfile.user_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedFreelancerFullProfile(data);
        } else {
          setSelectedFreelancerFullProfile(null);
        }
      } catch (err) {
        console.error("Failed to fetch freelancer full profile:", err);
        setSelectedFreelancerFullProfile(null);
      } finally {
        setLoadingFullProfile(false);
      }
    };
    fetchFullProfile();
  }, [selectedFreelancerProfile]);

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
  const [proposalLimitReached, setProposalLimitReached] = useState(false);
  const [proposalLimitMsg, setProposalLimitMsg] = useState("");

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
    slug: "",
    display_name: "",
    seo: {
      meta_title: "",
      meta_description: "",
      meta_keywords: ""
    }
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
      "/dashboard/my-projects": "my_projects",
      "/dashboard/wishlist": "wishlist",
      "/dashboard/reports": "reports",
      "/dashboard/subscription": "subscription",
      "/dashboard/referrals": "referrals",
      "/dashboard/affiliate": "affiliate",
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
      my_projects: "/dashboard/my-projects",
      wishlist: "/dashboard/wishlist",
      reports: "/dashboard/reports",
      subscription: "/dashboard/subscription",
      referrals: "/dashboard/referrals",
      affiliate: "/dashboard/affiliate",
    };
    const path = routeMap[tab];
    if (path) {
      router.push(path);
    }
  };

  const [freelancersList, setFreelancersList] = useState<Freelancer[]>([]);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const res = await fetch(`${API_URL}/freelancers/public/list`);
        if (res.ok) {
          const data = await res.json();
          const mapped: Freelancer[] = data.map((f: any, index: number) => {
            const colors = [
              "from-violet-500 to-indigo-500",
              "from-cyan-500 to-blue-500",
              "from-emerald-500 to-teal-500",
              "from-rose-500 to-pink-500",
              "from-amber-500 to-orange-500",
              "from-purple-500 to-fuchsia-500"
            ];
            const avatarColor = colors[index % colors.length];

            let category: "development" | "design" | "marketing" | "ai" = "development";
            const catName = (f.category_name || "").toLowerCase();
            if (catName.includes("dev") || catName.includes("software") || catName.includes("program")) {
              category = "development";
            } else if (catName.includes("design") || catName.includes("creative") || catName.includes("ux") || catName.includes("ui")) {
              category = "design";
            } else if (catName.includes("market") || catName.includes("sale") || catName.includes("growth")) {
              category = "marketing";
            } else if (catName.includes("ai") || catName.includes("intelligence") || catName.includes("machine") || catName.includes("ml")) {
              category = "ai";
            }

            return {
              id: f.user_id.toString(),
              name: f.name || "Freelancer Partner",
              avatarColor,
              role: f.professional_title || "Freelancer Expert",
              rating: typeof f.rating !== "undefined" && f.rating !== null ? parseFloat(f.rating) : 5.0,
              completedJobs: typeof f.completed_jobs !== "undefined" && f.completed_jobs !== null ? parseInt(f.completed_jobs) : 0,
              hourlyRate: parseFloat(f.hourly_rate) || 50,
              skills: Array.isArray(f.skills) ? f.skills : [],
              bio: f.bio || "No professional overview bio provided yet by this freelancer partner.",
              verified: f.vetting_status === "Approved",
              category
            };
          });
          setFreelancersList(mapped);
        }
      } catch (err) {
        console.error("Error fetching public freelancers in DashboardContext:", err);
      }
    };
    fetchFreelancers();
  }, []);

  // Filter freelancers
  const filteredFreelancers = useMemo(() => {
    const list = freelancersList.length > 0 ? freelancersList : freelancersData;
    return list.filter((freelancer) => {
      const matchesCategory = selectedCategory === "all" || freelancer.category === selectedCategory;
      const matchesSearch =
        freelancer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        freelancer.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, freelancersList]);

  const triggerToast = (type: "success" | "warning" | "error", message: string, details?: string) => {
    setApiAlert({ show: true, type, message, details });
    setTimeout(() => {
      setApiAlert((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Dynamic values
  const stepsStatus = useMemo(() => {
    if (userRole === "client") {
      return [
        { number: 1, label: "Company Basics", done: Boolean(companyName?.trim()) },
        { number: 2, label: "Company Details", done: Boolean(companyWebsite?.trim() || companyDescription?.trim()) },
        { number: 3, label: "Hiring Contact", done: Boolean(hiringContactName?.trim() && hiringContactDesignation?.trim()) }
      ];
    } else {
      return [
        { number: 1, label: "Basics", done: Boolean(profileBasics?.professional_title) },
        { number: 2, label: "Career", done: experiences.length > 0 || educations.length > 0 },
        { number: 3, label: "Verification", done: emailVerified || phoneVerified },
        { number: 4, label: "Portfolio", done: certifications.length > 0 || selectedSkills.length > 0 }
      ];
    }
  }, [userRole, companyName, companyWebsite, companyDescription, hiringContactName, hiringContactDesignation, profileBasics, experiences, educations, emailVerified, phoneVerified, certifications, selectedSkills]);

  const profileCompletionProgress = useMemo(() => {
    if (stepsStatus.length === 0) return 0;
    const doneCount = stepsStatus.filter(s => s.done).length;
    return Math.round((doneCount / stepsStatus.length) * 100);
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

            socketInstance.on("vetting_status_updated", (payload: any) => {
              console.log("⚡ Real-time vetting status update:", payload);
              if (payload.vetting_status) {
                setVettingStatus(payload.vetting_status);
                localStorage.setItem("vetting_status", payload.vetting_status);
              }
            });

            socketInstance.on("new_message", (chatMessage: any) => {
              console.log("⚡ Real-time message:", chatMessage);
              if (selectedConvIdRef.current === chatMessage.conversation_id) {
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
              socketInstance.off("vetting_status_updated");
              socketInstance.off("new_message");
              disconnectSocket();
            };
          }
        } catch (err) {
          console.error("Failed to parse user for Socket.io initialization", err);
        }
      }
    }
  }, [isAuthenticated]);

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

      // Load vetting status from localStorage
      const savedVettingStatus = localStorage.getItem("vetting_status");
      if (savedVettingStatus) {
        setVettingStatus(savedVettingStatus);
      }
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

  // Load actual profile details on authenticated mount or role switch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
      fetchConversations();

      if (userRole === "client") {
        fetchClientProfile();
        fetchClientJobs();
      } else if (userRole === "freelancer") {
        fetchOnboardingDetails();
        fetchFreelancerApplications();
        fetchFreelancerContracts();
        fetchFreelancerProposals();
        fetchProposalLimitStatus();
      }
    }
  }, [userRole, isAuthenticated]);

  // Synchronize proposal limit check from server when proposals or authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchProposalLimitStatus();
    }
  }, [freelancerProposals, isAuthenticated]);

  // Fetch settings dynamically
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            let val = setting.setting_value;
            if (typeof val === "string") {
              try {
                const trimmed = val.trim();
                if (trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed === "true" || trimmed === "false" || (!isNaN(Number(trimmed)) && trimmed !== "")) {
                  val = JSON.parse(val);
                }
              } catch (e) {
                // Keep raw string silently
              }
            }

            const formatHex = (colorStr: string, fallback: string) => {
              if (!colorStr) return fallback;
              const trimmed = colorStr.trim();
              if (trimmed.startsWith("#")) return trimmed;
              if (/^[0-9A-Fa-f]{3,8}$/.test(trimmed)) return "#" + trimmed;
              return trimmed;
            };

            if (setting.setting_key === "primary_color") {
              const rawColor = typeof val === "string" ? val : (val?.color || val?.primary_color);
              if (rawColor) {
                const formatted = formatHex(rawColor, "#0f766e");
                setPrimaryColor(formatted);
                if (typeof window !== "undefined") localStorage.setItem("primaryColor", formatted);
              }
            } else if (setting.setting_key === "secondary_color") {
              const rawColor = typeof val === "string" ? val : (val?.color || val?.secondary_color);
              if (rawColor) {
                const formatted = formatHex(rawColor, "#06b6d4");
                setSecondaryColor(formatted);
                if (typeof window !== "undefined") localStorage.setItem("secondaryColor", formatted);
              }
            } else if (setting.setting_key === "theme") {
              const localChoice = typeof window !== "undefined" ? localStorage.getItem("siteTheme") : null;
              setSiteThemeState(localChoice || val?.theme || "light");
            } else if (setting.setting_key === "site_settings") {
              if (val?.site_name) setSiteName(val.site_name);
              if (val?.site_logo) setSiteLogo(val.site_logo);
              if (val?.site_logo_dark) setSiteLogoDark(val.site_logo_dark);
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
      if (typeof window !== "undefined") {
        localStorage.setItem("siteTheme", siteTheme);
        localStorage.setItem("primaryColor", primaryColor);
        localStorage.setItem("secondaryColor", secondaryColor);
      }
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
      fetchAllSkillsOnboard();
    }
  }, [onboardingStep, isAuthenticated]);

  useEffect(() => {
    if (subCategoryId) {
      fetchSkillsBySubcategoryOnboard(subCategoryId);
    } else {
      fetchAllSkillsOnboard();
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

  const fetchAllSkillsOnboard = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/skills`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSkills(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("All skills fetch failed", e);
    }
  };

  const fetchSkillsBySubcategoryOnboard = async (subCatId: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/skills/subcategory/${subCatId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAvailableSkills(data);
        } else {
          fetchAllSkillsOnboard();
        }
      } else {
        fetchAllSkillsOnboard();
      }
    } catch (e) {
      console.error("Skills fetch failed", e);
      fetchAllSkillsOnboard();
    }
  };

  const runOnboardingCheck = async (token: string) => {
    try {
      const checkRes = await fetch(`${API_URL}/users/onboarding-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        
        setHasFreelancerProfile(!!data.hasFreelancerProfile);
        setHasClientProfile(!!data.hasClientProfile);

        let savedRole = localStorage.getItem("onboarding_role");
        if (!savedRole) {
          if (data.hasFreelancerProfile && !data.hasClientProfile) {
            savedRole = "freelancer";
            localStorage.setItem("onboarding_role", "freelancer");
          } else if (data.hasClientProfile && !data.hasFreelancerProfile) {
            savedRole = "client";
            localStorage.setItem("onboarding_role", "client");
          } else if (data.hasFreelancerProfile && data.hasClientProfile) {
            savedRole = "freelancer";
            localStorage.setItem("onboarding_role", "freelancer");
          }
        }

        if (!savedRole) {
          setOnboardingCompleted(false);
          setShowOnboardingModal(true);
          setOnboardingStep("role_selection");
          return;
        }

        const activeRole = savedRole;
        setUserRole(activeRole);

        const currentVetting = activeRole === "client" ? data.clientVettingStatus : data.freelancerVettingStatus;
        const fallbackVetting = currentVetting || "Approved";
        setVettingStatus(fallbackVetting);
        localStorage.setItem("vetting_status", fallbackVetting);

        const profileExists = activeRole === "client" ? !!data.hasClientProfile : !!data.hasFreelancerProfile;
        const isApproved = profileExists && fallbackVetting === "Approved";

        setOnboardingCompleted(isApproved);
        setShowOnboardingModal(!isApproved);
        localStorage.setItem("onboarding_completed", isApproved ? "true" : "false");

        if (!data.hasFreelancerProfile && !data.hasClientProfile) {
          setOnboardingStep("role_selection");
        } else {
          setOnboardingStep(activeRole === "client" ? "client_flow" : "freelancer_flow");
        }
      } else {
        setOnboardingCompleted(false);
        setShowOnboardingModal(true);
        setOnboardingStep("role_selection");
        if (checkRes.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    } catch (e) {
      console.error(e);
      setOnboardingCompleted(false);
      setShowOnboardingModal(true);
      setOnboardingStep("role_selection");
    }
  };

  const fetchOnboardingStatus = async (shouldUpdateStep = true) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOnboardingStepsStatus(data.steps);
        if (shouldUpdateStep) {
          setWizardStep(data.currentStep);
        }
        if (data.onboardingCompleted) {
          setOnboardingCompleted(true);
          localStorage.setItem("onboarding_completed", "true");
          setHasFreelancerProfile(true);
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
          const fullName = [data.user.first_name, data.user.last_name].filter(Boolean).join(" ");
          if (fullName) {
            setUserName(fullName);
          }
          if (data.user.profile_image) {
            setProfileImage(data.user.profile_image);
          }
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

          let parsedSeo = { meta_title: "", meta_description: "", meta_keywords: "" };
          if (data.profile.seo) {
            try {
              parsedSeo = typeof data.profile.seo === "string" ? JSON.parse(data.profile.seo) : data.profile.seo;
            } catch (e) {
              console.error("Error parsing profile seo data:", e);
            }
          }
          const loadedBasics = {
            professional_title: data.profile.professional_title || "",
            experience_level: data.profile.experience_level || "Intermediate",
            hourly_rate: parseFloat(data.profile.hourly_rate) || 45,
            availability_status: data.profile.availability_status || "Available",
            total_experience_years: parseInt(data.profile.total_experience_years) || 3,
            linkedin_url: data.profile.linkedin_url || "",
            portfolio_website: data.profile.portfolio_website || "",
            resume_url: data.profile.resume_url || "",
            slug: data.user.slug || "",
            display_name: data.user.display_name || data.user.name || "",
            seo: parsedSeo
          };
          setProfileBasics(loadedBasics);
          localStorage.setItem("profile_basics", JSON.stringify(loadedBasics));
        }
        if (data.skills) {
          setSelectedSkillIds(data.skills.map((s: any) => s.skill_id));
        }
        if (data.languages) {
          const loadedLangs = data.languages.map((l: any) => ({
            language_id: l.language_id,
            proficiency: l.proficiency || 'Basic'
          }));
          setSelectedLanguages(loadedLangs);
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
    setSelectedSkillIds([]);
    fetchSubcategoriesForCategory(catId);
    fetchAllSkillsOnboard();
  };

  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error("");
    setStep1Success(false);

    const errors: Record<string, string> = {};
    const requiredFields = [];

    if (isFieldRequired("category")) {
      if (!categoryId) {
        errors.category = "Category is required.";
        requiredFields.push("Category");
      }
      if (!subCategoryId) {
        errors.subcategory = "Subcategory is required.";
        requiredFields.push("Subcategory");
      }
    }
    if (isFieldRequired("title") && !professionalTitle.trim()) {
      errors.title = "Professional Title is required.";
      requiredFields.push("Professional Title");
    }
    if (isFieldRequired("experience_level")) {
      if (!experienceLevel) {
        errors.experience_level = "Experience Level is required.";
        requiredFields.push("Experience Level");
      }
      if (!totalExperienceYears || totalExperienceYears.trim() === "" || parseInt(totalExperienceYears) < 0) {
        errors.total_experience_years = "Years of Experience is required.";
        requiredFields.push("Years of Experience");
      }
    }
    if (isFieldRequired("hourly_rate") && (!hourlyRate || hourlyRate.trim() === "")) {
      errors.hourly_rate = "Hourly Rate is required.";
      requiredFields.push("Hourly Rate");
    }
    if (isFieldRequired("availability_status") && !availabilityStatus) {
      errors.availability_status = "Availability Status is required.";
      requiredFields.push("Availability Status");
    }
    if (isFieldRequired("linkedin") && !linkedinUrl.trim()) {
      errors.linkedin = "LinkedIn Profile Link is required.";
      requiredFields.push("LinkedIn Link");
    }
    if (isFieldRequired("website") && !portfolioWebsite.trim()) {
      errors.website = "Portfolio Website URL is required.";
      requiredFields.push("Website URL");
    }
    if (isFieldRequired("github") && !resumeUrl.trim()) {
      errors.github = "Resume Document URL is required.";
      requiredFields.push("Resume URL");
    }
    if (isFieldRequired("skills") && selectedSkillIds.length === 0) {
      errors.skills = "At least 1 skill must be selected.";
      requiredFields.push("Skills");
    }
    if (isFieldRequired("languages") && selectedLanguageIds.length === 0) {
      errors.languages = "At least 1 language must be selected.";
      requiredFields.push("Languages");
    }

    setStep1FieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStep1Error(`Please fill out all required fields: ${requiredFields.join(", ")}`);
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
        body: JSON.stringify({ languages: selectedLanguages })
      });

      if (!langRes.ok) {
        const err = await langRes.json();
        setStep1Error(err.message || "Failed to save languages.");
        return;
      }

      setStep1Success(true);
      setTimeout(() => {
        setWizardStep(2);
        fetchOnboardingStatus(false);
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
    if (sendingEmailOtp) return;
    try {
      setSendingEmailOtp(true);
      setOtpError("");
      setOtpSuccess("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/send-email-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEmailOtpSent(true);
        setOtpSuccess("Verification OTP sent to your email address. Please check your inbox.");
        triggerToast("success", "OTP sent to your email address.");
      } else {
        const d = await res.json();
        const msg = d.message || "Failed to send email OTP.";
        setOtpError(msg);
        triggerToast("error", msg);
      }
    } catch (e) {
      setOtpError("Network error.");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp.trim() || verifyingEmailOtp) return;
    try {
      setVerifyingEmailOtp(true);
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
        setOtpSuccess("Email address verified successfully!");
        triggerToast("success", "Email address verified!");
      } else {
        const d = await res.json();
        const msg = d.message || "Invalid OTP code.";
        setOtpError(msg);
        triggerToast("error", msg);
      }
    } catch (e) {
      setOtpError("Network error.");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (sendingPhoneOtp) return;
    const rawPhone = userPhone.trim();
    const cleanedPhone = rawPhone.replace(/[\s\-\(\)]/g, "");
    
    if (!cleanedPhone || cleanedPhone.length < 7 || !/^\+?[1-9]\d{6,14}$/.test(cleanedPhone)) {
      const errMsg = "Mobile number does not exist or is invalid. Please enter a valid phone number with country code.";
      setOtpError(errMsg);
      triggerToast("error", errMsg);
      return;
    }

    try {
      setSendingPhoneOtp(true);
      setOtpError("");
      setOtpSuccess("");
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/users/send-phone-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: rawPhone })
      });
      
      const d = await res.json();

      if (res.ok) {
        setPhoneOtpSent(true);
        setPhoneOtp(""); // Empty field so user enters their real SMS code
        setOtpSuccess(`Verification code sent via SMS to ${rawPhone}. Please enter the 6-digit code below.`);
        triggerToast("success", `Verification code sent to ${rawPhone}`);
      } else {
        const errMsg = d.message || "Mobile number does not exist or is invalid.";
        setOtpError(errMsg);
        triggerToast("error", errMsg);
      }
    } catch (e) {
      const errMsg = "Network error. Failed to send SMS OTP.";
      setOtpError(errMsg);
      triggerToast("error", errMsg);
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp.trim() || verifyingPhoneOtp) return;
    try {
      setVerifyingPhoneOtp(true);
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
        triggerToast("success", "Mobile phone verified!");
      } else {
        const d = await res.json();
        const msg = d.message || "Invalid SMS OTP code.";
        setOtpError(msg);
        triggerToast("error", msg);
      }
    } catch (e) {
      setOtpError("Network error.");
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() && !projectDesc.trim()) {
      // Both are empty: treat as skipping the optional project and transition to Step 5 (Document Verification)
      setWizardStep(5);
      await updateOnboardingStep(5);
      return;
    }
    if (!projectTitle.trim() || !projectDesc.trim()) {
      triggerToast("error", "Please provide both project title and description to save your project, or click 'Skip Project'.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      // Save portfolio project
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
          setPortfolioSuccess(false);
          setWizardStep(5);
          await updateOnboardingStep(5);
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
        setTimeout(async () => {
          setOnboardingCompleted(true);
          localStorage.setItem("onboarding_completed", "true");
          if (token) {
            await runOnboardingCheck(token);
          }
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
    setUserRole("freelancer");
    setOnboardingStep("freelancer_flow");
    localStorage.setItem("onboarding_role", "freelancer");
  };

  const handleSelectClient = () => {
    setSelectedRole("client");
    setUserRole("client");
    setClientNotice(true);
    localStorage.setItem("onboarding_role", "client");
    setTimeout(() => {
      setClientNotice(false);
      setOnboardingStep("client_flow");
      setClientWizardStep(1);
    }, 1500);
  };

  const handleSkip = () => {
    setShowOnboardingModal(false);
    setForceShowOnboarding(false);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/notifications`, {
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
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
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
      const res = await fetch(`${API_URL}/notifications/read-all`, {
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
      const res = await fetch(`${API_URL}/notifications/${notifId}/read`, {
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

      const notif = notifications.find((n) => n.notification_id === notifId);
      const title = (notif?.title || "").toLowerCase();
      const message = (notif?.message || "").toLowerCase();
      const type = (notifType || notif?.type || "").toLowerCase();
      const ref = refId || notif?.reference_id;

      // 1. Direct Chat / Message notifications
      if (type === "message" || title.includes("message") || title.includes("chat") || title.includes("new message")) {
        setActiveTab("inbox");
        if (ref) setSelectedConvId(parseInt(ref));
        router.push("/dashboard/inbox");
      } 
      // 2. Proposal & Bid notifications
      else if (type === "proposal" || title.includes("proposal") || title.includes("bid")) {
        const isAccepted = title.includes("accepted") || message.includes("accepted");
        if (userRole === "client") {
          setActiveTab("proposals");
          if (ref) {
            const foundJob = clientJobs.find((j: any) => j.contract_id === parseInt(ref) || j.job_id === parseInt(ref));
            const jobId = foundJob ? foundJob.job_id : ref;
            router.push(`/dashboard/proposals?project_id=${jobId}`);
          } else {
            router.push("/dashboard/proposals");
          }
        } else {
          if (isAccepted) {
            setActiveTab("my_projects");
            if (ref) {
              router.push(`/dashboard/my-projects?contract_id=${ref}`);
            } else {
              router.push("/dashboard/my-projects");
            }
          } else {
            setActiveTab("proposals");
            router.push("/dashboard/proposals");
          }
        }
      } 
      // 3. Gig & Service Order notifications
      else if (type === "gig" || title.includes("gig") || message.includes("gig order")) {
        if (userRole === "client") {
          setActiveTab("client_orders");
          if (ref) {
            router.push(`/dashboard/client-orders?application_id=${ref}`);
          } else {
            router.push("/dashboard/client-orders");
          }
        } else {
          setActiveTab("gig_applications");
          if (ref) {
            router.push(`/dashboard/gig-applications?application_id=${ref}`);
          } else {
            router.push("/dashboard/gig-applications");
          }
        }
      } 
      // 4. Wallet & Payout notifications
      else if (type === "wallet" || title.includes("wallet") || title.includes("payout") || title.includes("withdrawal")) {
        setActiveTab("wallet");
        router.push("/dashboard/wallet");
      }
      // 5. Contract, Milestone, Dispute, Payment Released, Work Started, Review notifications
      else if (
        type === "contract" ||
        type === "dispute" ||
        type === "work_started" ||
        type === "completion" ||
        type === "milestone" ||
        type === "payment" ||
        title.includes("contract") ||
        title.includes("milestone") ||
        title.includes("payment") ||
        title.includes("released") ||
        title.includes("funded") ||
        title.includes("dispute") ||
        title.includes("work started") ||
        title.includes("completion") ||
        title.includes("review") ||
        message.includes("contract") ||
        message.includes("milestone") ||
        message.includes("dispute") ||
        message.includes("working")
      ) {
        if (userRole === "client") {
          setActiveTab("proposals");
          if (ref) {
            const foundJob = clientJobs.find((j: any) => j.contract_id === parseInt(ref) || j.job_id === parseInt(ref));
            const jobId = foundJob ? foundJob.job_id : ref;
            router.push(`/dashboard/proposals?project_id=${jobId}`);
          } else {
            router.push("/dashboard/proposals");
          }
        } else {
          setActiveTab("my_projects");
          if (ref) {
            router.push(`/dashboard/my-projects?contract_id=${ref}`);
          } else {
            router.push("/dashboard/my-projects");
          }
        }
      } 
      // 6. Fallback redirection
      else {
        if (userRole === "client") {
          setActiveTab("proposals");
          router.push("/dashboard/proposals");
        } else {
          setActiveTab("my_projects");
          router.push("/dashboard/my-projects");
        }
      }
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const fetchClientJobs = async () => {
    try {
      setLoadingClientJobs(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/jobs/client`, {
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
      const res = await fetch(`${API_URL}/jobs`, {
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
      const res = await fetch(`${API_URL}/proposals/my-proposals`, {
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

  const fetchProposalLimitStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/proposals/limit-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProposalLimitReached(data.limitReached);
        if (data.limitReached) {
          setProposalLimitMsg(`Your monthly proposal limit of ${data.limit} has been reached for this billing cycle. Your limit resets on ${data.resetDate}.`);
        } else {
          setProposalLimitMsg("");
        }
      }
    } catch (e) {
      console.error("Failed to check proposal limit status:", e);
    }
  };

  const fetchActiveJobProposals = async (jobId: number) => {
    try {
      setLoadingActiveJobProposals(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/proposals/job/${jobId}`, {
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
      const res = await fetch(`${API_URL}/proposals/${proposalId}/status`, {
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

    // Hourly: bid amount is the hourly rate — validate it doesn't exceed max hourly rate
    if (applyingJob.project_type === "Hourly") {
      const maxRate = parseFloat(applyingJob.max_budget || applyingJob.budget || 0);
      const minRate = parseFloat(applyingJob.min_budget || 0);
      if (maxRate > 0 && proposalBidAmount > maxRate) {
        setProposalError(`Your hourly rate ($${proposalBidAmount}/hr) cannot exceed the client's maximum rate ($${maxRate.toLocaleString()}/hr).`);
        return;
      }
      if (minRate > 0 && proposalBidAmount < minRate) {
        setProposalError(`Your hourly rate ($${proposalBidAmount}/hr) is below the client's minimum rate ($${minRate.toLocaleString()}/hr).`);
        return;
      }
    }

    // Fixed: validate bid amount doesn't exceed max budget
    if (applyingJob.project_type === "Fixed") {
      const maxBudget = parseFloat(applyingJob.max_budget || applyingJob.budget || 0);
      if (maxBudget > 0 && proposalBidAmount > maxBudget) {
        setProposalError(`Your bid ($${proposalBidAmount.toLocaleString()}) cannot exceed the project's maximum budget ($${maxBudget.toLocaleString()}).`);
        return;
      }
    }

    const requiresMilestones = applyingJob.project_type === "Fixed" && applyingJob.milestone_type === "Milestone";
    const useMilestones = proposalUseMilestones || requiresMilestones;

    if (useMilestones) {
      if (proposalMilestones.length === 0) {
        setProposalError("This project requires defining milestones. Please add at least one milestone.");
        return;
      }
      const totalMilestones = proposalMilestones.reduce((sum, m) => sum + m.amount, 0);
      if (Math.abs(totalMilestones - proposalBidAmount) > 0.01) {
        setProposalError(`Total milestone amounts ($${totalMilestones.toFixed(2)}) must exactly equal your total bid ($${proposalBidAmount.toFixed(2)}). Please adjust milestones to match.`);
        return;
      }
    }

    try {
      setProposalSubmitting(true);
      setProposalError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/proposals`, {
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
        fetchProposalLimitStatus();
      } else if (res.status === 403) {
        setProposalError(data.message || "Your monthly proposal limit has been reached.");
        triggerToast("error", "Proposal Limit Exceeded", data.message || "Please upgrade your subscription plan.");
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "/pricing";
          }, 4500);
        }
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
      setProposalError("Milestone description is required.");
      triggerToast("error", "Milestone description is required.");
      return;
    }
    if (!newMilestoneAmount || Number(newMilestoneAmount) <= 0) {
      setProposalError("Milestone amount must be a positive number.");
      triggerToast("error", "Milestone amount must be a positive number.");
      return;
    }
    const amount = Number(newMilestoneAmount);
    
    const currentTotal = proposalMilestones.reduce((sum, m) => sum + m.amount, 0);
    if (currentTotal + amount > proposalBidAmount) {
      const errMsg = `Total milestone amount ($${(currentTotal + amount).toLocaleString()}) cannot exceed the offered total bid amount ($${proposalBidAmount.toLocaleString()}).`;
      setProposalError(errMsg);
      triggerToast("error", errMsg);
      return;
    }

    setProposalError("");
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
      const res = await fetch(`${API_URL}/messages/conversations`, {
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
      const res = await fetch(`${API_URL}/messages/conversation/${convId}`, {
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

  useEffect(() => {
    if (selectedConvId) {
      fetchChatMessages(selectedConvId);
    } else {
      setChatMessages([]);
    }
  }, [selectedConvId]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !newMessageText.trim()) return;

    try {
      setSendingChatMessage(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/messages/send`, {
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
        const res = await fetch(`${API_URL}/admin/sub-categories`);
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
        const res = await fetch(`${API_URL}/admin/skills/subcategory/${subCatId}`);
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/languages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const res = await fetch(`${API_URL}/freelancer/gigs`, {
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
      const res = await fetch(`${API_URL}/freelancer/client/gigs`, {
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
      const res = await fetch(`${API_URL}/freelancer/gigs/applications`, {
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
      const res = await fetch(`${API_URL}/freelancer/client/gigs/applications`, {
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
      const res = await fetch(`${API_URL}/users/client/hired-freelancers`, {
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

      // Stripe / PayPal auto-deposit integration
      const priceVal = parseFloat(applyingGig.price);
      const upfrontAmount = priceVal;

      if (orderPaymentMethod === "stripe" || orderPaymentMethod === "paypal") {
        const walletRes = await fetch(`${API_URL}/wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (walletRes.ok) {
          const walletInfo = await walletRes.json();
          const currentBalance = parseFloat(walletInfo.balance);
          const needed = upfrontAmount - currentBalance;
          if (needed > 0) {
            // Auto fund wallet via simulated deposit
            await fetch(`${API_URL}/wallet/deposit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ amount: needed })
            });
          }
        }
      }

      const res = await fetch(`${API_URL}/freelancer/client/gigs/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gig_id: applyingGig.gig_id,
          requirements: orderRequirements.trim(),
          price: parseFloat(applyingGig.price),
          currency_id: applyingGig.currency_id,
          milestones: orderMilestones
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(true);
        setOrderRequirements("");
        setOrderMilestones([]);
        setOrderPaymentMethod("wallet");
        setTimeout(() => {
          setIsApplying(false);
          setApplyingGig(null);
          setOrderSuccess(false);
          fetchFreelancerApplications();
          fetchClientApplications();
          fetchWalletInfo();
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
      const res = await fetch(`${API_URL}/freelancer/gigs/applications/${applicationId}`, {
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
      const res = await fetch(`${API_URL}/freelancer/currencies`, {
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
      const res = await fetch(`${API_URL}/admin/categories`);
      if (res.ok) {
        setGigCategories(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    }
  };

  const fetchGigSubCategories = async (catId?: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/sub-categories`);
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
      const res = await fetch(`${API_URL}/admin/skills/subcategory/${subCatId}`);
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

  const fetchClientProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/users/client-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.profile) {
            setClientBasics({
              company_name: data.profile.company_name || "",
              company_size: data.profile.company_size || "1-10",
              industry: data.profile.industry || "Technology",
              company_website: data.profile.company_website || "",
              company_description: data.profile.company_description || "",
              company_established_year: data.profile.company_established_year || "",
              hiring_contact_name: data.profile.hiring_contact_name || "",
              hiring_contact_designation: data.profile.hiring_contact_designation || "",
            });
          }
          if (data.user) {
            const fullName = [data.user.first_name, data.user.last_name].filter(Boolean).join(" ");
            if (fullName) {
              setUserName(fullName);
            }
            if (data.user.profile_image) {
              setProfileImage(data.user.profile_image);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch client profile:", err);
    }
  };

  const handleProfileImageUpload = async (file: File) => {
    try {
      console.log("📁 Starting profile image upload for file:", file.name, file.size, file.type);
      const url = await uploadFile(file);
      console.log("🌐 File uploaded successfully. Server URL returned:", url);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ profile_image: url })
      });
      if (res.ok) {
        setProfileImage(url);
        triggerToast("success", "Profile picture updated successfully!");
        console.log("✅ Profile image saved in DB and state updated:", url);
      } else {
        const errText = await res.text();
        console.error("❌ Failed to update profile picture in DB. Status:", res.status, errText);
        triggerToast("error", "Failed to update profile picture.");
      }
    } catch (err: any) {
      console.error("❌ Error in handleProfileImageUpload:", err);
      triggerToast("error", err.message || "Failed to upload image");
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
      const res = await fetch(`${API_URL}/freelancer/gigs`, {
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

  const deleteExperience = async (index: number) => {
    const target = experiences[index];
    const updated = experiences.filter((_, idx) => idx !== index);
    setExperiences(updated);
    localStorage.setItem("profile_experiences", JSON.stringify(updated));
    triggerToast("success", "Experience removed.");

    if (target && target.experience_id) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/freelancer/onboarding/experience/${target.experience_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to delete experience on backend:", err);
      }
    }
  };

  const deleteEducation = async (index: number) => {
    const target = educations[index];
    const updated = educations.filter((_, idx) => idx !== index);
    setEducations(updated);
    localStorage.setItem("profile_education", JSON.stringify(updated));
    triggerToast("success", "Education removed.");

    if (target && target.education_id) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/freelancer/onboarding/education/${target.education_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to delete education on backend:", err);
      }
    }
  };

  const deleteCertification = async (index: number) => {
    const target = certifications[index];
    const updated = certifications.filter((_, idx) => idx !== index);
    setCertifications(updated);
    localStorage.setItem("profile_certifications", JSON.stringify(updated));
    triggerToast("success", "Certification removed.");

    if (target && target.certification_id) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/freelancer/onboarding/certification/${target.certification_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to delete certification on backend:", err);
      }
    }
  };

  const handleSaveStep = async (stepNum: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (stepNum === 1) {
        if (!profileBasics.professional_title.trim() || !profileBasics.experience_level) {
          triggerToast("error", "Title and experience level are required.");
          return;
        }
        
        const res = await fetch(`${API_URL}/freelancer/onboarding/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            category_id: parseInt(categoryId) || 1,
            sub_category_id: parseInt(subCategoryId) || 1,
            professional_title: profileBasics.professional_title,
            experience_level: profileBasics.experience_level,
            availability_status: profileBasics.availability_status || "Available",
            total_experience_years: profileBasics.total_experience_years ? parseInt(String(profileBasics.total_experience_years)) : 0,
            hourly_rate: profileBasics.hourly_rate ? parseFloat(String(profileBasics.hourly_rate)) : 0,
            linkedin_url: profileBasics.linkedin_url || null,
            portfolio_website: profileBasics.portfolio_website || null,
            resume_url: profileBasics.resume_url || null,
            slug: profileBasics.slug || null,
            display_name: profileBasics.display_name || null,
            seo: profileBasics.seo || null
          })
        });

        if (res.ok) {
          triggerToast("success", "Profile basics saved successfully!");
          localStorage.setItem("profile_basics", JSON.stringify(profileBasics));
        } else {
          const data = await res.json();
          triggerToast("error", data.message || "Failed to save profile basics.");
        }
      } else if (stepNum === 2) {
        // Save unsaved experiences to database
        const unsaved = experiences.filter(exp => !exp.experience_id);
        const savedList = [...experiences.filter(exp => exp.experience_id)];
        
        for (const exp of unsaved) {
          const res = await fetch(`${API_URL}/freelancer/onboarding/experience`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              company_name: exp.company_name,
              job_title: exp.job_title,
              employment_type: exp.employment_type || "Full-time",
              start_date: exp.start_date || null,
              end_date: exp.end_date || null,
              currently_working: exp.currently_working ?? false,
              description: exp.description || null
            })
          });
          if (res.ok) {
            const data = await res.json();
            savedList.push(data.experience);
          }
        }
        setExperiences(savedList);
        localStorage.setItem("profile_experiences", JSON.stringify(savedList));
        triggerToast("success", "Work experience saved successfully!");
      } else if (stepNum === 3) {
        // Save unsaved education to database
        const unsaved = educations.filter(edu => !edu.education_id);
        const savedList = [...educations.filter(edu => edu.education_id)];

        for (const edu of unsaved) {
          const res = await fetch(`${API_URL}/freelancer/onboarding/education`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              institution_name: edu.institution_name,
              degree: edu.degree,
              field_of_study: edu.field_of_study || null,
              start_year: edu.start_year ? parseInt(String(edu.start_year)) : null,
              end_year: edu.end_year ? parseInt(String(edu.end_year)) : null
            })
          });
          if (res.ok) {
            const data = await res.json();
            savedList.push(data.education);
          }
        }
        setEducations(savedList);
        localStorage.setItem("profile_education", JSON.stringify(savedList));
        triggerToast("success", "Education history saved successfully!");
      } else if (stepNum === 4) {
        // Save unsaved certifications to database
        const unsaved = certifications.filter(cert => !cert.certification_id);
        const savedList = [...certifications.filter(cert => cert.certification_id)];

        for (const cert of unsaved) {
          const res = await fetch(`${API_URL}/freelancer/onboarding/certification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              certificate_name: cert.certificate_name,
              issuing_organization: cert.issuing_organization,
              issue_date: cert.issue_date || null,
              credential_url: cert.credential_url || null
            })
          });
          if (res.ok) {
            const data = await res.json();
            savedList.push(data.certification);
          }
        }
        setCertifications(savedList);
        localStorage.setItem("profile_certifications", JSON.stringify(savedList));
        triggerToast("success", "Certifications saved successfully!");
      } else if (stepNum === 5) {
        // Save skills selector
        const res = await fetch(`${API_URL}/freelancer/onboarding/skills`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            skill_ids: selectedSkillIds
          })
        });

        if (res.ok) {
          triggerToast("success", "Skills saved successfully!");
          localStorage.setItem("profile_skills", JSON.stringify(selectedSkills));

          // Also trigger final complete onboarding so backend updates status to true in database
          try {
            const completeRes = await fetch(`${API_URL}/freelancer/onboarding/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            });
            if (completeRes.ok) {
              const completeData = await completeRes.json();
              const status = completeData.vettingStatus || "Approved";
              setVettingStatus(status);
              localStorage.setItem("vetting_status", status);
              setHasFreelancerProfile(true);
              setOnboardingCompleted(true);
              localStorage.setItem("onboarding_completed", "true");
            }
          } catch (e) {
            console.error("Failed to call complete onboarding on step 5 finish:", e);
          }
        } else {
          const data = await res.json();
          triggerToast("error", data.message || "Failed to save skills.");
        }
      }
    } catch (e) {
      console.error(e);
      triggerToast("error", "Failed to update profile step.");
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
      const res = await fetch(`${API_URL}/users/client-profile`, {
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
      const res = await fetch(`${API_URL}/messages/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: numericId })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchConversations();
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

  const handleRoleSwitch = async (role: string) => {
    setUserRole(role);
    localStorage.setItem("onboarding_role", role);

    const isClient = role === "client";
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const checkRes = await fetch(`${API_URL}/users/onboarding-check`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (checkRes.ok) {
          const data = await checkRes.json();
          setHasFreelancerProfile(!!data.hasFreelancerProfile);
          setHasClientProfile(!!data.hasClientProfile);

          const currentProfileExists = isClient ? !!data.hasClientProfile : !!data.hasFreelancerProfile;
          const currentVetting = isClient ? data.clientVettingStatus : data.freelancerVettingStatus;
          const activeVettingStatus = currentVetting || "Approved";

          setVettingStatus(activeVettingStatus);
          localStorage.setItem("vetting_status", activeVettingStatus);

          const isApproved = currentProfileExists && activeVettingStatus === "Approved";

          setOnboardingCompleted(isApproved);
          localStorage.setItem("onboarding_completed", isApproved ? "true" : "false");
          setShowOnboardingModal(!isApproved);

          if (!isApproved) {
            setOnboardingStep(isClient ? "client_flow" : "freelancer_flow");
            if (isClient) {
              setClientWizardStep(1);
            } else {
              setWizardStep(1);
            }
          }
        } else {
          runOnboardingCheck(token);
        }
      } catch (err) {
        console.error("Error during role switch check:", err);
        runOnboardingCheck(token);
      }
    }

    triggerToast("success", "Active workspace switched", `Switched to ${isClient ? "Client" : "Freelancer"} mode.`);
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ step: stepNum })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEnabledDocFields = async (role?: string) => {
    try {
      setLoadingDocFields(true);
      const roleParam = role ? `?role=${role}` : "";
      const res = await fetch(`${API_URL}/documents/fields${roleParam}`);
      if (res.ok) {
        const data = await res.json();
        setEnabledDocFields(data);
      }
    } catch (e) {
      console.error("Failed to fetch enabled document fields:", e);
    } finally {
      setLoadingDocFields(false);
    }
  };

  const isFieldEnabled = (key: string) => {
    const field = enabledDocFields.find(f => f.field_key === key);
    return field ? field.is_enabled : true;
  };

  const isFieldRequired = (key: string) => {
    const field = enabledDocFields.find(f => f.field_key === key);
    return field ? field.is_required : false;
  };

  const clientFields = useMemo(() => {
    return enabledDocFields.filter(f => f.applicable_to === 'client' || f.applicable_to === 'both');
  }, [enabledDocFields]);

  const totalClientSteps = useMemo(() => {
    return clientFields.length > 0
      ? Math.max(4, ...clientFields.map(f => f.step_number || 4))
      : 4;
  }, [clientFields]);

  const freelancerFields = useMemo(() => {
    return enabledDocFields.filter(f => f.applicable_to === 'freelancer' || f.applicable_to === 'both');
  }, [enabledDocFields]);

  const totalFreelancerSteps = useMemo(() => {
    return freelancerFields.length > 0
      ? Math.max(5, ...freelancerFields.map(f => f.step_number || 5))
      : 5;
  }, [freelancerFields]);

  const fetchUserUploadedDocs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/documents/my-docs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserUploadedDocs(data);
      }
    } catch (e) {
      console.error("Failed to fetch user uploaded documents:", e);
    }
  };

  const handleUploadDocument = async (fieldId: number, file: File, expiryDate?: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authorization token found.");

    // 1. Upload file to /upload
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.message || "Failed to upload document file.");
    }

    const uploadData = await uploadRes.json();
    const fileUrl = uploadData.url;

    // 2. Save document record
    const saveRes = await fetch(`${API_URL}/documents/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        field_id: fieldId,
        file_url: fileUrl,
        expiry_date: expiryDate || null
      })
    });

    if (!saveRes.ok) {
      const err = await saveRes.json();
      throw new Error(err.message || "Failed to save document details.");
    }

    // 3. Refresh user uploaded documents list
    await fetchUserUploadedDocs();
    return await saveRes.json();
  };

  // Load enabled doc fields config at the very beginning of the dashboard mount
  useEffect(() => {
    fetchEnabledDocFields();
  }, []);

  useEffect(() => {
    if (wizardStep >= 5) {
      fetchUserUploadedDocs();
    }
  }, [wizardStep]);

  useEffect(() => {
    if (clientWizardStep >= 4) {
      fetchUserUploadedDocs();
    }
  }, [clientWizardStep]);

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

  const handleFinishOnboarding = async () => {
    // Called when user skips the portfolio step
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/onboarding/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const status = data.vettingStatus || "Approved";
        setVettingStatus(status);
        localStorage.setItem("vetting_status", status);
        setHasFreelancerProfile(true);
      }
    } catch (e) {
      console.error("Failed to call complete onboarding:", e);
    }
    setOnboardingCompleted(true);
    setShowOnboardingModal(false);
    localStorage.setItem("onboarding_completed", "true");
    setForceShowOnboarding(false);
  };

  const handleSaveClientStep = async (stepNum: number) => {
    setClientError("");
    const errors: Record<string, string> = {};

    if (stepNum === 1) {
      if (isFieldRequired("company_name") && !companyName.trim()) errors.company_name = "Company Name is required.";
      if (isFieldRequired("industry") && !industry.trim()) errors.industry = "Industry is required.";
      if (isFieldRequired("company_size") && !companySize.trim()) errors.company_size = "Company Size is required.";
      if (isFieldRequired("established_year") && (!companyEstablishedYear.trim() || parseInt(companyEstablishedYear) <= 1900)) errors.established_year = "Valid Established Year is required.";

      setClientFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        triggerToast("error", "Please fill in all required company details.");
        return;
      }
      setClientWizardStep(2);
    } else if (stepNum === 2) {
      if (isFieldRequired("company_website") && !companyWebsite.trim()) errors.company_website = "Company Website URL is required.";
      if (isFieldRequired("company_description") && !companyDescription.trim()) errors.company_description = "Company Description is required.";

      setClientFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        triggerToast("error", "Please fill in all required website & description details.");
        return;
      }
      setClientWizardStep(3);
    } else if (stepNum === 3) {
      if (isFieldRequired("hiring_contact_name") && !hiringContactName.trim()) errors.hiring_contact_name = "Hiring Contact Name is required.";
      if (isFieldRequired("hiring_contact_designation") && !hiringContactDesignation.trim()) errors.hiring_contact_designation = "Hiring Contact Designation is required.";

      setClientFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        triggerToast("error", "Please fill in all required contact representative details.");
        return;
      }
      
      if (totalClientSteps > 3) {
        setClientWizardStep(4);
      } else {
        await publishClientProfile();
      }
    } else {
      // Step 4+: Document validation
      const stepFields = clientFields.filter(f => f.step_number === stepNum && f.is_required && f.is_enabled);
      const incomplete = stepFields.filter(f => !userUploadedDocs.some(d => d.field_id === f.field_id));
      if (incomplete.length > 0) {
        triggerToast("error", `Please complete all required fields for this step: ${incomplete.map(f => f.field_name).join(", ")}`);
        return;
      }
      
      if (stepNum < totalClientSteps) {
        setClientWizardStep(stepNum + 1);
      } else {
        await publishClientProfile();
      }
    }
  };

  const publishClientProfile = async () => {
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
          company_name: companyName.trim() || null,
          company_size: companySize || null,
          industry: industry || null,
          company_website: companyWebsite.trim() || null,
          company_description: companyDescription.trim() || null,
          company_established_year: companyEstablishedYear ? parseInt(companyEstablishedYear) : null,
          hiring_contact_name: hiringContactName.trim() || null,
          hiring_contact_designation: hiringContactDesignation.trim() || null,
          onboarding_completed: true
        })
      });

      if (res.ok) {
        setClientSuccess(true);
        triggerToast("success", "Client profile published successfully!");
        setHasClientProfile(true);
        setTimeout(async () => {
          setOnboardingCompleted(true);
          setShowOnboardingModal(false);
          localStorage.setItem("onboarding_completed", "true");
          setForceShowOnboarding(false);
          if (token) {
            await runOnboardingCheck(token);
          }
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
  };

  const fetchWalletInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      setLoadingWallet(true);
      const res = await fetch(`${API_URL}/wallet`, {
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
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
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
      const res = await fetch(`${API_URL}/wallet/deposit`, {
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

  const fetchFreelancerContracts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const raw = await res.json();
        const sorted = [...raw].sort((a: any, b: any) => {
          const aStatus = (a.status || "").toLowerCase();
          const bStatus = (b.status || "").toLowerCase();
          const aIsCompleted = aStatus === "completed" || aStatus === "cancelled" || aStatus === "closed";
          const bIsCompleted = bStatus === "completed" || bStatus === "cancelled" || bStatus === "closed";
          if (!aIsCompleted && bIsCompleted) return -1;
          if (aIsCompleted && !bIsCompleted) return 1;

          const aTime = a.created_at ? new Date(a.created_at).getTime() : (Number(a.contract_id || a.id) || 0);
          const bTime = b.created_at ? new Date(b.created_at).getTime() : (Number(b.contract_id || b.id) || 0);
          return bTime - aTime;
        });
        setFreelancerContracts(sorted);
      }
    } catch (e) {
      console.error("Failed to fetch freelancer contracts:", e);
    }
  };

  const fetchRecommendedClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/recommended-clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRecommendedClients(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch recommended clients:", e);
    }
  };

  const requestContractPayment = async (contractId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/freelancer/contracts/${contractId}/request-payment`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Payment request submitted to client!");
        fetchFreelancerContracts();
      } else {
        triggerToast("error", data.message || "Failed to request payment.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to request payment.");
    }
  };

  const startWorkContract = async (contractId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/${contractId}/start-work`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Work started!", "Contract status updated to Work Started.");
        fetchFreelancerContracts();
      } else {
        triggerToast("error", data.message || "Failed to update contract status.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to update contract status.");
    }
  };

  const requestMilestoneFunding = async (milestoneId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/payments/contract/milestone/${milestoneId}/request-funding`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Funding request sent to client successfully!");
      } else {
        triggerToast("error", data.message || "Failed to request funding.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to request funding.");
    }
  };

  const approveContractPayment = async (contractId: number, paymentMethod: string = "wallet") => {
    try {
      const token = localStorage.getItem("token");

      // Auto fund wallet via simulated deposit if paying with Stripe/PayPal
      if (paymentMethod === "stripe" || paymentMethod === "paypal") {
        const contract = freelancerContracts.find((c: any) => c.contract_id === contractId);
        if (contract) {
          const budget = parseFloat(contract.budget);
          const hasMilestones = contract.milestones && contract.milestones.length > 0 && !(contract.milestones.length === 1 && contract.milestones[0].title === "Entire Project Scope");
          const balanceAmount = hasMilestones ? (budget * 0.50) : 0;

          if (balanceAmount > 0) {
            const walletRes = await fetch(`${API_URL}/wallet`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (walletRes.ok) {
              const walletInfo = await walletRes.json();
              const currentBalance = parseFloat(walletInfo.balance);
              const needed = balanceAmount - currentBalance;
              if (needed > 0) {
                await fetch(`${API_URL}/wallet/deposit`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({ amount: needed })
                });
              }
            }
          }
        }
      }

      const res = await fetch(`${API_URL}/freelancer/contracts/${contractId}/approve-payment`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Escrow payment released to freelancer successfully!");
        fetchFreelancerContracts();
        fetchWalletInfo();
      } else {
        triggerToast("error", data.message || "Failed to release payment.");
      }
    } catch (err) {
      triggerToast("error", "Network error. Failed to release payment.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletInfo();
      fetchFreelancerContracts();
      fetchRecommendedClients();
      fetchGigs();
      fetchCurrencies();
      fetchGigCategories();
      fetchPostJobLanguages();
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
    showOnboardingModal, setShowOnboardingModal,
    vettingStatus, setVettingStatus,
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
    clientFieldErrors, setClientFieldErrors,
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
    selectedLanguages, setSelectedLanguages,
    handleUpdateLanguageProficiency,
    step1Error, setStep1Error,
    step1Success, setStep1Success,
    step1FieldErrors, setStep1FieldErrors,
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
    sendingEmailOtp, setSendingEmailOtp,
    sendingPhoneOtp, setSendingPhoneOtp,
    verifyingEmailOtp, setVerifyingEmailOtp,
    verifyingPhoneOtp, setVerifyingPhoneOtp,
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
    profileImage, setProfileImage,
    handleProfileImageUpload,
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
    orderMilestones, setOrderMilestones,
    orderPaymentMethod, setOrderPaymentMethod,
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
    postJobMinHours, setPostJobMinHours,
    postJobPaymentMode, setPostJobPaymentMode,
    clientJobs, setClientJobs,
    loadingClientJobs, setLoadingClientJobs,
    isCreatingJob, setIsCreatingJob,
    editingDraftJobId, setEditingDraftJobId,
    selectedProjectDetails, setSelectedProjectDetails,
    selectedGigOrderDetails, setSelectedGigOrderDetails,
    selectedFreelancerProfile, setSelectedFreelancerProfile,
    selectedFreelancerFullProfile, loadingFullProfile,
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
    fetchProposalLimitStatus, proposalLimitReached, proposalLimitMsg,
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
    siteName, setSiteName, siteLogo, setSiteLogo, siteLogoDark, setSiteLogoDark,
    handleRoleSwitch, handleToggleSkill, handleSkipStep2, updateOnboardingStep,
    handleSkipStep3, handleSaveStep3, handleAddProject, handleFinishOnboarding,
    handleSaveClientStep, enabledDocFields, userUploadedDocs, loadingDocFields,
    fetchEnabledDocFields, fetchUserUploadedDocs, handleUploadDocument,
    forceShowOnboarding, setForceShowOnboarding,
    isFieldEnabled, isFieldRequired, totalClientSteps, totalFreelancerSteps,
    walletInfo, loadingWallet,
    withdrawAmount, setWithdrawAmount,
    withdrawMethod, setWithdrawMethod,
    withdrawAccount, setWithdrawAccount,
    depositAmount, setDepositAmount,
    fetchWalletInfo, handleWithdrawSubmit, handleDepositSubmit,
    freelancerContracts, recommendedClients,
    fetchFreelancerContracts, fetchRecommendedClients,
    requestContractPayment, approveContractPayment, startWorkContract, requestMilestoneFunding,
    pendingInviteFreelancer, setPendingInviteFreelancer
  }), [
    isAuthenticated, onboardingCompleted, showOnboardingModal, forceShowOnboarding, onboardingStep, selectedRole, activeView,
    clientNotice, isSidebarOpen, categories, subCategories, availableSkills, languages,
    companyName, companySize, industry, companyWebsite, companyDescription,
    companyEstablishedYear, hiringContactName, hiringContactDesignation, clientWizardStep,
    clientError, clientSuccess, clientFieldErrors, wizardStep, onboardingStepsStatus, categoryId,
    subCategoryId, professionalTitle, experienceLevel, totalExperienceYears, hourlyRate,
    availabilityStatus, linkedinUrl, portfolioWebsite, resumeUrl, selectedSkillIds,
    selectedLanguageIds, step1Error, step1Success, step1FieldErrors, experiences, educations, certifications,
    expCompany, expTitle, expEmpType, expStart, expEnd, expCurrent, expDesc, eduInst,
    eduDegree, eduField, eduStart, eduEnd, certName, certOrg, certDate, certCredUrl,
    userEmail, userPhone, emailVerified, phoneVerified, emailOtp, phoneOtp, emailOtpSent,
    phoneOtpSent, otpError, otpSuccess, projectTitle, projectDesc, projectImages,
    projectVideo, projectDocs, portfolioSuccess, primaryColor, secondaryColor, siteTheme,
    userName, profileImage, handleProfileImageUpload, gigs, currencies, loadingGigs, isCreatingGig, gigTitle, gigDescription,
    gigPrice, gigCurrencyId, gigDeliveryDays, gigRevisions, gigImages, gigVideoUrl,
    gigDocuments, gigCategoryId, gigSubCategoryId, gigSelectedSkills, gigError,
    gigSuccess, gigPublishing, gigCategories, gigSubCategories, gigAvailableSkills,
    userRole, clientGigs, loadingClientGigs, gigApplications, loadingApplications,
    clientApplications, loadingClientApplications, hiredFreelancers, loadingHiredFreelancers,
    isApplying, applyingGig, orderRequirements, orderSubmitting, orderSuccess, orderError,
    orderMilestones, setOrderMilestones, orderPaymentMethod, setOrderPaymentMethod,
    uploadingImages, uploadingVideo, uploadingDocs, searchQuery, selectedCategory,
    postJobTitle, postJobBudget, postJobCategoryId, postJobSubCategoryId, postJobSubCategories,
    postJobDescription, postJobExpLevel, postJobStep, postJobType, postJobMilestoneType,
    postJobMinBudget, postJobMaxBudget, postJobDuration, postJobLocation, postJobNumFreelancers,
    postJobAvailableSkills, postJobSelectedSkills, postJobAvailableLanguages,
    postJobSelectedLanguages, postJobMaxHours, postJobMinHours, setPostJobMinHours, postJobPaymentMode, clientJobs,
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
    activeTab, siteName, siteLogo, siteLogoDark, setSiteLogoDark,
    handleRoleSwitch, handleToggleSkill, handleSkipStep2, updateOnboardingStep,
    handleSkipStep3, handleSaveStep3, handleAddProject, handleFinishOnboarding,
    handleSaveClientStep, enabledDocFields, userUploadedDocs, loadingDocFields,
    walletInfo, loadingWallet, withdrawAmount, withdrawMethod, withdrawAccount, depositAmount,
    freelancerContracts, recommendedClients,
    requestContractPayment, approveContractPayment, startWorkContract, requestMilestoneFunding,
    selectedFreelancerFullProfile, loadingFullProfile,
    pendingInviteFreelancer,
    isFieldEnabled, isFieldRequired, totalClientSteps, totalFreelancerSteps
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
