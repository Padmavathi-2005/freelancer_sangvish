"use client";
import { API_URL } from "@/config/api";
import { initSocket } from "@/utils/socket";


import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

// Types
export interface VettingApplication {
  id: string;
  name: string;
  role: string;
  rate: string;
  experience: string;
  skills: string[];
  status: "Pending" | "Approved" | "Info Requested" | "Declined";
}

export interface DisputeCase {
  id: string;
  project: string;
  client: string;
  freelancer: string;
  amount: number;
  reason: string;
  clientStatement: string;
  freelancerStatement: string;
  status: "Under Mediation" | "Resolved (Refunded Client)" | "Resolved (Released to Freelancer)" | "Resolved (Split)";
  client_id?: number | string;
  freelancer_id?: number | string;
  conversation_id?: number | string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  targetTab: string;
  targetSubTab: string;
  targetId: string;
  read: boolean;
  timestamp: string;
}


export interface Category {
  id?: string;
  category_id?: string | number;
  category_name?: string;
  name?: string;
  slug?: string;
  description?: string;
  category_image?: string;
  category_video?: string;
  status?: boolean | string | number;
  count?: number;
  createdAt?: string;
  created_at?: string;
}

export interface Subcategory {
  id?: string;
  sub_category_id?: string | number;
  categoryId?: string;
  category_id?: string | number;
  categoryName?: string;
  category_name?: string;
  name?: string;
  sub_category_name?: string;
  slug?: string;
  description?: string;
  status?: boolean | string | number;
  createdAt?: string;
  created_at?: string;
}

export interface Skill {
  id?: string;
  skill_id?: string | number;
  subcategoryId?: string;
  subcategory_id?: string | number;
  subcategoryName?: string;
  sub_category_name?: string;
  name?: string;
  skill_name?: string;
  slug?: string;
  status?: boolean | string | number;
  createdAt?: string;
  created_at?: string;
}

export interface AdminUser {
  admin_id: number;
  full_name: string;
  email: string;
  role: string;
  created_at?: string;
}

interface AdminContextType {
  isAuthenticated: boolean | null;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  adminTheme: "light" | "dark";
  setAdminTheme: (theme: "light" | "dark") => void;

  // User management states
  usersList: any[];
  usersSearch: string;
  setUsersSearch: (v: string) => void;
  usersPage: number;
  setUsersPage: React.Dispatch<React.SetStateAction<number>>;
  usersLoading: boolean;
  usersFilterRole: string;
  setUsersFilterRole: (v: string) => void;
  fetchUsers: () => Promise<void>;
  handleToggleUserActive: (userId: number) => Promise<void>;

  // Onboarded directory states
  onboardedSearch: string;
  setOnboardedSearch: (v: string) => void;
  onboardedFilterRole: string;
  setOnboardedFilterRole: (v: string) => void;
  onboardedPage: number;
  setOnboardedPage: React.Dispatch<React.SetStateAction<number>>;

  // Project management states
  projectsList: any[];
  projectsSearch: string;
  setProjectsSearch: (v: string) => void;
  projectsPage: number;
  setProjectsPage: React.Dispatch<React.SetStateAction<number>>;
  projectsLoading: boolean;
  fetchProjects: () => Promise<void>;
  handleUpdateProjectStatus: (projectId: number, status: string) => Promise<void>;
  handleDeleteProject: (projectId: number) => Promise<void>;

  // Gig listing states
  gigsList: any[];
  gigsSearch: string;
  setGigsSearch: (v: string) => void;
  gigsPage: number;
  setGigsPage: React.Dispatch<React.SetStateAction<number>>;
  gigsLoading: boolean;
  fetchGigs: () => Promise<void>;
  handleUpdateGigStatus: (gigId: number, status: string) => Promise<void>;
  handleDeleteGig: (gigId: number) => Promise<void>;

  // Gig orders states
  gigOrdersList: any[];
  gigOrdersSearch: string;
  setGigOrdersSearch: (v: string) => void;
  gigOrdersPage: number;
  setGigOrdersPage: React.Dispatch<React.SetStateAction<number>>;
  gigOrdersLoading: boolean;
  fetchGigOrders: () => Promise<void>;
  handleUpdateGigOrderStatus: (orderId: number, status: string) => Promise<void>;

  // Transaction states
  transactionsList: any[];
  transactionsSearch: string;
  setTransactionsSearch: (v: string) => void;
  transactionsPage: number;
  setTransactionsPage: React.Dispatch<React.SetStateAction<number>>;
  transactionsLoading: boolean;
  fetchTransactions: () => Promise<void>;

  // Collapsibles
  gigMenuOpen: boolean;
  setGigMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  projectMenuOpen: boolean;
  setProjectMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  settingsMenuOpen: boolean;
  setSettingsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Sub-tabs
  categoriesSubTab: "categories" | "subcategories" | "skills" | "languages" | "currencies" | "cleanup";
  setCategoriesSubTab: React.Dispatch<React.SetStateAction<"categories" | "subcategories" | "skills" | "languages" | "currencies" | "cleanup">>;
  projectsSubTab: "projects" | "proposals" | "maintenance";
  setProjectsSubTab: React.Dispatch<React.SetStateAction<"projects" | "proposals" | "maintenance">>;
  transactionsSubTab: "transactions" | "disputes";
  setTransactionsSubTab: React.Dispatch<React.SetStateAction<"transactions" | "disputes">>;
  adminNotifications: AdminNotification[];
  setAdminNotifications: React.Dispatch<React.SetStateAction<AdminNotification[]>>;
  highlightedDisputeId: string | null;
  setHighlightedDisputeId: React.Dispatch<React.SetStateAction<string | null>>;
  usersSubTab: "users" | "admins";
  setUsersSubTab: React.Dispatch<React.SetStateAction<"users" | "admins">>;
  categoriesSearch: string;
  setCategoriesSearch: (v: string) => void;
  categoriesPage: number;
  setCategoriesPage: React.Dispatch<React.SetStateAction<number>>;
  subcategoriesPage: number;
  setSubcategoriesPage: React.Dispatch<React.SetStateAction<number>>;
  skillsPage: number;
  setSkillsPage: React.Dispatch<React.SetStateAction<number>>;
  enableProposalVetting: boolean;
  setEnableProposalVetting: (v: boolean) => void;
  enableClientVetting: boolean;
  setEnableClientVetting: (v: boolean) => void;
  enableProjectVetting: boolean;
  setEnableProjectVetting: (v: boolean) => void;
  pendingProposals: any[];
  fetchPendingProposals: () => Promise<void>;
  handleUpdateProposalVettingStatus: (proposalId: number, status: "Approved" | "Rejected") => Promise<void>;

  // Categories CRUD
  categoriesList: Category[];
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  categoryModalMode: "create" | "edit";
  setCategoryModalMode: React.Dispatch<React.SetStateAction<"create" | "edit">>;
  editingCategory: Category | null;
  categoryFormName: string;
  setCategoryFormName: (v: string) => void;
  categoryFormSlug: string;
  setCategoryFormSlug: (v: string) => void;
  categoryFormDescription: string;
  setCategoryFormDescription: (v: string) => void;
  categoryFormImage: string;
  setSiteLogo?: any; // unused
  setCategoryFormImage: (v: string) => void;
  categoryFormVideo: string;
  setCategoryFormVideo: (v: string) => void;
  categoryFormStatus: "Active" | "Inactive";
  setCategoryFormStatus: React.Dispatch<React.SetStateAction<"Active" | "Inactive">>;
  categoryFormError: string | null;
  categoryFormLoading: boolean;
  handleCategorySubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (id: string | number) => Promise<void>;
  handleEditCategoryClick: (category: Category) => void;
  handleAddCategoryClick: () => void;

  // Subcategories CRUD
  subcategoriesList: Subcategory[];
  isSubcategoryModalOpen: boolean;
  setIsSubcategoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  subcategoryModalMode: "create" | "edit";
  setSubcategoryModalMode: React.Dispatch<React.SetStateAction<"create" | "edit">>;
  editingSubcategory: Subcategory | null;
  subcategoryFormName: string;
  setSubcategoryFormName: (v: string) => void;
  subcategoryFormCategoryId: string;
  setSubcategoryFormCategoryId: (v: string) => void;
  subcategoryFormStatus: "Active" | "Inactive";
  setSubcategoryFormStatus: React.Dispatch<React.SetStateAction<"Active" | "Inactive">>;
  subcategoryFormError: string | null;
  subcategoryFormLoading: boolean;
  handleSubcategorySubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteSubcategory: (id: string | number) => Promise<void>;
  handleEditSubcategoryClick: (sub: Subcategory) => void;
  handleAddSubcategoryClick: () => void;

  // Bulk actions selection states
  selectedCategoryIds: (string | number)[];
  setSelectedCategoryIds: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  selectedSubcategoryIds: (string | number)[];
  setSelectedSubcategoryIds: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  selectedSkillIds: (string | number)[];
  setSelectedSkillIds: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  handleBulkDeleteCategories: () => Promise<void>;
  handleBulkDeleteSubcategories: () => Promise<void>;
  handleBulkDeleteSkills: () => Promise<void>;

  // Skills CRUD
  skillsList: Skill[];
  isSkillModalOpen: boolean;
  setIsSkillModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  skillModalMode: "create" | "edit";
  setSkillModalMode: React.Dispatch<React.SetStateAction<"create" | "edit">>;
  editingSkill: Skill | null;
  skillFormName: string;
  setSkillFormName: (v: string) => void;
  skillFormSubcategoryId: string;
  setSkillFormSubcategoryId: (v: string) => void;
  skillFormStatus: "Active" | "Inactive";
  setSkillFormStatus: React.Dispatch<React.SetStateAction<"Active" | "Inactive">>;
  skillFormError: string | null;
  skillFormLoading: boolean;
  handleSkillSubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteSkill: (id: string | number) => Promise<void>;
  handleEditSkillClick: (sk: Skill) => void;
  handleAddSkillClick: () => void;

  // Platform setting states & save
  platformFee: number;
  setPlatformFee: React.Dispatch<React.SetStateAction<number>>;
  autoVetting: boolean;
  setAutoVetting: React.Dispatch<React.SetStateAction<boolean>>;
  maintenanceMode: boolean;
  setMaintenanceMode: React.Dispatch<React.SetStateAction<boolean>>;
  primaryColor: string;
  setPrimaryColor: React.Dispatch<React.SetStateAction<string>>;
  secondaryColor: string;
  setSecondaryColor: React.Dispatch<React.SetStateAction<string>>;
  siteTheme: string;
  setSiteTheme: React.Dispatch<React.SetStateAction<string>>;
  defaultCurrency: string;
  setDefaultCurrency: React.Dispatch<React.SetStateAction<string>>;
  defaultLanguage: string;
  setDefaultLanguage: React.Dispatch<React.SetStateAction<string>>;
  frontendHeroContent: {
    hero_badge: string;
    hero_title: string;
    hero_subtitle: string;
    hero_search_placeholder: string;
    hero_search_btn: string;
    hero_popular_label: string;
    search: string;
  };
  setFrontendHeroContent: React.Dispatch<React.SetStateAction<{
    hero_badge: string;
    hero_title: string;
    hero_subtitle: string;
    hero_search_placeholder: string;
    hero_search_btn: string;
    hero_popular_label: string;
    search: string;
  }>>;
  disputeReasons: string[];
  setDisputeReasons: React.Dispatch<React.SetStateAction<string[]>>;
  clientDisputeReasons: string[];
  setClientDisputeReasons: React.Dispatch<React.SetStateAction<string[]>>;
  freelancerDisputeReasons: string[];
  setFreelancerDisputeReasons: React.Dispatch<React.SetStateAction<string[]>>;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;

  // Admins List & CRUD
  adminsList: AdminUser[];
  adminUser: AdminUser | null;
  newAdminName: string;
  setNewAdminName: (v: string) => void;
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  newAdminPassword: string;
  setNewAdminPassword: (v: string) => void;
  newAdminRole: string;
  setNewAdminRole: (v: string) => void;
  adminError: string | null;
  adminSuccess: string | null;
  adminLoading: boolean;
  handleCreateAdmin: (e: React.FormEvent) => Promise<void>;
  handleDeleteAdmin: (id: number) => Promise<void>;
  fetchError: string | null;

  disputes: DisputeCase[];
  resolveDispute: (id: string, resolution: DisputeCase["status"]) => void;
  fetchDisputes: () => Promise<void>;
  pendingVettingCount: number;
  activeDisputesCount: number;
  userCounts: { total: number; freelancers: number; clients: number };

  // Filtered/Paginated Lists
  filteredUsers: any[];
  paginatedUsers: any[];
  totalUsersPages: number;
  filteredOnboardedUsers: any[];
  paginatedOnboardedUsers: any[];
  totalOnboardedPages: number;
  filteredProjects: any[];
  paginatedProjects: any[];
  totalProjectsPages: number;
  filteredGigs: any[];
  paginatedGigs: any[];
  totalGigsPages: number;
  filteredGigOrders: any[];
  paginatedGigOrders: any[];
  totalGigOrdersPages: number;
  filteredTransactions: any[];
  paginatedTransactions: any[];
  totalTransactionsPages: number;
  filteredCategories: Category[];
  paginatedCategories: Category[];
  totalCategoriesPages: number;
  filteredSubcategories: Subcategory[];
  paginatedSubcategories: Subcategory[];
  totalSubcategoriesPages: number;
  filteredSkills: Skill[];
  paginatedSkills: Skill[];
  totalSkillsPages: number;

  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  adminWalletStats: any | null;
  loadingAdminWallet: boolean;
  fetchAdminWalletStats: () => Promise<void>;
  withdrawalRequests: any[];
  loadingWithdrawals: boolean;
  fetchWithdrawalRequests: () => Promise<void>;
  handleApproveWithdrawal: (id: number) => Promise<void>;
  handleRejectWithdrawal: (id: number) => Promise<void>;
  handlePayToUser: (userId: number, amount: number, description: string) => Promise<{ success: boolean; message: string }>;
  cmsPagesList: any[];
  loadingCms: boolean;
  fetchCmsPages: () => Promise<void>;
  handleCreateCmsPage: (title: string, slug: string, status: string, contentType: string, content: string, seo?: any) => Promise<any>;
  handleUpdateCmsPage: (id: number, title: string, slug: string, status: string, contentType: string, content: string, seo?: any) => Promise<any>;
  handleDeleteCmsPage: (id: number) => Promise<void>;
  blogsList: any[];
  loadingBlogs: boolean;
  fetchBlogs: () => Promise<void>;
  handleCreateBlog: (blogData: { title: string; slug?: string; summary?: string; content: string; cover_image?: string; category?: string; is_published: boolean }) => Promise<any>;
  handleUpdateBlog: (id: number, blogData: { title: string; slug?: string; summary?: string; content: string; cover_image?: string; category?: string; is_published: boolean }) => Promise<any>;
  handleDeleteBlog: (id: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [adminTheme, setAdminThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("adminTheme") as "light" | "dark" | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setAdminThemeState(savedTheme);
      }
    }
  }, []);

  const setAdminTheme = (theme: "light" | "dark") => {
    setAdminThemeState(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem("adminTheme", theme);
    }
  };

  // User management states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFilterRole, setUsersFilterRole] = useState<string>("all");

  // Onboarded directory states
  const [onboardedSearch, setOnboardedSearch] = useState("");
  const [onboardedFilterRole, setOnboardedFilterRole] = useState<string>("all");
  const [onboardedPage, setOnboardedPage] = useState(1);

  // Project management states
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [projectsSearch, setProjectsSearch] = useState("");
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Gig listing states
  const [gigsList, setGigsList] = useState<any[]>([]);
  const [gigsSearch, setGigsSearch] = useState("");
  const [gigsPage, setGigsPage] = useState(1);
  const [gigsLoading, setGigsLoading] = useState(false);

  // Gig orders states
  const [gigOrdersList, setGigOrdersList] = useState<any[]>([]);
  const [gigOrdersSearch, setGigOrdersSearch] = useState("");
  const [gigOrdersPage, setGigOrdersPage] = useState(1);
  const [gigOrdersLoading, setGigOrdersLoading] = useState(false);

  // Transaction states
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [transactionsSearch, setTransactionsSearch] = useState("");
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Gig Collapsible Sidebar menu
  const [gigMenuOpen, setGigMenuOpen] = useState(false);

  // Project Collapsible Sidebar menu
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  // Settings Collapsible Sidebar menu
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  // Subcategories & Skills management states
  const [categoriesSubTab, setCategoriesSubTab] = useState<"categories" | "subcategories" | "skills" | "languages" | "currencies" | "cleanup">("categories");
  const [projectsSubTab, setProjectsSubTab] = useState<"projects" | "proposals" | "maintenance">("projects");
  const [transactionsSubTab, setTransactionsSubTab] = useState<"transactions" | "disputes">("transactions");
  const [usersSubTab, setUsersSubTab] = useState<"users" | "admins">("users");
  const [categoriesSearch, setCategoriesSearch] = useState("");
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [subcategoriesPage, setSubcategoriesPage] = useState(1);
  const [skillsPage, setSkillsPage] = useState(1);

  // Category API CRUD States
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryFormSlug, setCategoryFormSlug] = useState("");
  const [categoryFormDescription, setCategoryFormDescription] = useState("");
  const [categoryFormImage, setCategoryFormImage] = useState("");
  const [categoryFormVideo, setCategoryFormVideo] = useState("");
  const [categoryFormStatus, setCategoryFormStatus] = useState<"Active" | "Inactive">("Active");
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);

  // Subcategory API CRUD States
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>([]);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [subcategoryModalMode, setSubcategoryModalMode] = useState<"create" | "edit">("create");
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryFormName, setSubcategoryFormName] = useState("");
  const [subcategoryFormCategoryId, setSubcategoryFormCategoryId] = useState("");
  const [subcategoryFormStatus, setSubcategoryFormStatus] = useState<"Active" | "Inactive">("Active");
  const [subcategoryFormError, setSubcategoryFormError] = useState<string | null>(null);
  const [subcategoryFormLoading, setSubcategoryFormLoading] = useState(false);

  // Selection states for bulk actions
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<(string | number)[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<(string | number)[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<(string | number)[]>([]);

  // Skill API CRUD States
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillModalMode, setSkillModalMode] = useState<"create" | "edit">("create");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillFormName, setSkillFormName] = useState("");
  const [skillFormSubcategoryId, setSkillFormSubcategoryId] = useState("");
  const [skillFormStatus, setSkillFormStatus] = useState<"Active" | "Inactive">("Active");
  const [skillFormError, setSkillFormError] = useState<string | null>(null);
  const [skillFormLoading, setSkillFormLoading] = useState(false);

  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("SUB_ADMIN");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);



  const [adminNotifications, setAdminNotificationsState] = useState<AdminNotification[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_notifications");
      if (saved) {
        try {
          setAdminNotificationsState(JSON.parse(saved));
          return;
        } catch (e) {
          console.error(e);
        }
      }
      // Default initial list
      const defaults = [
        {
          id: "an1",
          title: "New Dispute Arbitration Case",
          message: "Client Alex Mercer opened a dispute for 'Mobile E-commerce Refactor'",
          targetTab: "transactions",
          targetSubTab: "disputes",
          targetId: "d1",
          read: false,
          timestamp: "10 mins ago"
        },
        {
          id: "an2",
          title: "New Dispute Arbitration Case",
          message: "Client Jessica Lin opened a dispute for 'Stripe API checkout setup'",
          targetTab: "transactions",
          targetSubTab: "disputes",
          targetId: "d2",
          read: false,
          timestamp: "1 hour ago"
        },
        {
          id: "an3",
          title: "New Vetting Application Submitted",
          message: "Ryan K. (Expert iOS Dev) submitted profile for admin vetting approval",
          targetTab: "onboarding",
          targetSubTab: "",
          targetId: "vetting",
          read: false,
          timestamp: "3 hours ago"
        }
      ];
      setAdminNotificationsState(defaults);
      localStorage.setItem("admin_notifications", JSON.stringify(defaults));
    }
  }, []);

  const setAdminNotifications = (val: React.SetStateAction<AdminNotification[]>) => {
    setAdminNotificationsState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      
      const token = localStorage.getItem("adminToken");
      if (token) {
        const allReadNow = next.every(n => n.read);
        const wasAllRead = prev.every(n => n.read);
        if (allReadNow && !wasAllRead) {
          fetch(`${API_URL}/notifications/read-all`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
          }).catch(e => console.error("Failed to mark all read:", e));
        } else {
          const readChanged = next.find(n => n.read && !prev.find(p => p.id === n.id)?.read);
          if (readChanged) {
            fetch(`${API_URL}/notifications/${readChanged.id}/read`, {
              method: "PUT",
              headers: { "Authorization": `Bearer ${token}` }
            }).catch(e => console.error("Failed to mark notification read:", e));
          }
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("admin_notifications", JSON.stringify(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      const initAdminSession = async () => {
        try {
          const token = localStorage.getItem("adminToken");
          if (!token) return;

          const meRes = await fetch(`${API_URL}/admin/me`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (meRes.ok) {
            const adminProfile = await meRes.json();
            setAdminUser(prev => prev ? { ...prev, user_id: adminProfile.user_id } : adminProfile);
            
            if (adminProfile.user_id) {
              const socket = initSocket(adminProfile.user_id);
              socket.on("new_notification", (notif: any) => {
                const mapped = {
                  id: notif.notification_id.toString(),
                  title: notif.title,
                  message: notif.message,
                  targetTab: notif.type === "proposal_vetting" ? "projects" : (notif.type === "vetting" ? "onboarding" : (notif.type === "dispute" ? "transactions" : "overview")),
                  targetSubTab: notif.type === "proposal_vetting" ? "proposals" : (notif.type === "dispute" ? "disputes" : ""),
                  targetId: notif.reference_id,
                  read: notif.is_read,
                  timestamp: "Just now"
                };
                setAdminNotificationsState(prev => {
                  const exists = prev.some(n => n.id === mapped.id);
                  if (exists) return prev;
                  const updatedList = [mapped, ...prev];
                  localStorage.setItem("admin_notifications", JSON.stringify(updatedList));
                  return updatedList;
                });
              });
            }
          }

          const notifRes = await fetch(`${API_URL}/notifications`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (notifRes.ok) {
            const data = await notifRes.json();
            const mappedList = data.map((notif: any) => ({
              id: notif.notification_id.toString(),
              title: notif.title,
              message: notif.message,
              targetTab: notif.type === "proposal_vetting" ? "projects" : (notif.type === "vetting" ? "onboarding" : (notif.type === "dispute" ? "transactions" : "overview")),
              targetSubTab: notif.type === "proposal_vetting" ? "proposals" : (notif.type === "dispute" ? "disputes" : ""),
              targetId: notif.reference_id,
              read: notif.is_read,
              timestamp: new Date(notif.created_at).toLocaleDateString()
            }));
            setAdminNotificationsState(mappedList);
            localStorage.setItem("admin_notifications", JSON.stringify(mappedList));
          }
        } catch (err) {
          console.error("Failed to load admin notifications/profile session:", err);
        }
      };

      initAdminSession();
    }
  }, [isAuthenticated]);

  const [highlightedDisputeId, setHighlightedDisputeId] = useState<string | null>(null);

  // Dispute Cases state
  const [disputes, setDisputes] = useState<DisputeCase[]>([
    {
      id: "d1",
      project: "Mobile E-commerce Refactor",
      client: "Alex Mercer (SaaS Ventures)",
      freelancer: "Ryan K. (iOS Expert)",
      amount: 4500,
      reason: "Missed core responsive design requirements.",
      clientStatement: "The freelancer missed the critical mobile screen layouts that were clearly stated in the Figma specification document. Half of our product pages are broken on portrait viewports.",
      freelancerStatement: "I implemented all responsive specifications provided in the initial milestone description. The client added three extra screens during development that were not in the signed scope.",
      status: "Under Mediation"
    },
    {
      id: "d2",
      project: "Stripe API checkout setup",
      client: "Jessica Lin (Bloom Tech)",
      freelancer: "Dave O. (Backend Dev)",
      amount: 2200,
      reason: "Security concerns and unoptimized integration.",
      clientStatement: "The Stripe integration has severe performance issues and uses deprecated API versions that trigger compliance warnings.",
      freelancerStatement: "I used the standard Stripe SDK. The compliance warnings are from client's older webhooks that were outside of my project scope.",
      status: "Under Mediation"
    }
  ]);

  // Admin Wallet & Payout States
  const [adminWalletStats, setAdminWalletStats] = useState<any | null>(null);
  const [loadingAdminWallet, setLoadingAdminWallet] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // CMS Pages States
  const [cmsPagesList, setCmsPagesList] = useState<any[]>([]);
  const [loadingCms, setLoadingCms] = useState(false);

  // Blogs States
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  // System Settings state
  const [platformFee, setPlatformFee] = useState(5);
  const [autoVetting, setAutoVetting] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [secondaryColor, setSecondaryColor] = useState("#06b6d4");
  const [siteTheme, setSiteTheme] = useState("light");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [defaultLanguage, setDefaultLanguage] = useState("EN");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [enableProposalVetting, setEnableProposalVetting] = useState(false);
  const [enableClientVetting, setEnableClientVetting] = useState(false);
  const [enableProjectVetting, setEnableProjectVetting] = useState(false);
  const [disputeReasons, setDisputeReasons] = useState<string[]>([
    "Work not delivered",
    "Work quality is poor",
    "Requirements not followed",
    "Freelancer is unresponsive",
    "Delivery is incomplete",
    "Suspected fraud",
    "Other"
  ]);
  const [clientDisputeReasons, setClientDisputeReasons] = useState<string[]>([
    "Work not delivered",
    "Work quality is poor",
    "Requirements not followed",
    "Freelancer is unresponsive",
    "Delivery is incomplete",
    "Suspected fraud",
    "Other"
  ]);
  const [freelancerDisputeReasons, setFreelancerDisputeReasons] = useState<string[]>([
    "Client is unresponsive",
    "Client refuses to release milestone payment",
    "Client is requesting out-of-scope work",
    "Milestone requirements met but not approved",
    "Other"
  ]);
  const [pendingProposals, setPendingProposals] = useState<any[]>([]);
  const [frontendHeroContent, setFrontendHeroContent] = useState({
    hero_badge: "The Top 3% Global Freelancers",
    hero_title: "Hire Expert Freelancers For Your Next Big Project",
    hero_subtitle: "Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.",
    hero_search_placeholder: "What skill are you looking for?",
    hero_search_btn: "Search Talent",
    hero_popular_label: "Popular: UI Design, React, AI Automation, SEO",
    search: "Search"
  });

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setUsersLoading(true);
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Toggle user status
  const handleToggleUserActive = async (userId: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/users/${userId}/toggle-active`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setProjectsLoading(true);
      const res = await fetch(`${API_URL}/admin/projects`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleUpdateProjectStatus = async (projectId: number, status: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/projects/${projectId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  // Fetch Gigs
  const fetchGigs = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setGigsLoading(true);
      const res = await fetch(`${API_URL}/admin/gigs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGigsList(data);
      }
    } catch (err) {
      console.error("Error fetching gigs:", err);
    } finally {
      setGigsLoading(false);
    }
  };

  const handleUpdateGigStatus = async (gigId: number, status: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/gigs/${gigId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchGigs();
      }
    } catch (err) {
      console.error("Error updating gig status:", err);
    }
  };

  const handleDeleteGig = async (gigId: number) => {
    if (!confirm("Are you sure you want to delete this gig?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/gigs/${gigId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchGigs();
      }
    } catch (err) {
      console.error("Error deleting gig:", err);
    }
  };

  // Fetch gig orders
  const fetchGigOrders = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setGigOrdersLoading(true);
      const res = await fetch(`${API_URL}/admin/gig-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGigOrdersList(data);
      }
    } catch (err) {
      console.error("Error fetching gig orders:", err);
    } finally {
      setGigOrdersLoading(false);
    }
  };

  const handleUpdateGigOrderStatus = async (orderId: number, status: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/gig-orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchGigOrders();
      }
    } catch (err) {
      console.error("Error updating gig order status:", err);
    }
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setTransactionsLoading(true);
      const res = await fetch(`${API_URL}/admin/transactions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactionsList(data);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Fetch platform settings
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
              setPrimaryColor(formatHex(val?.color, "#10b981"));
            } else if (setting.setting_key === "secondary_color") {
              setSecondaryColor(formatHex(val?.color, "#06b6d4"));
            } else if (setting.setting_key === "theme") {
              setSiteTheme(val?.theme || "light");
            } else if (setting.setting_key === "platform_fee") {
              setPlatformFee(val?.fee ?? 5);
            } else if (setting.setting_key === "auto_vetting") {
              setAutoVetting(val?.enabled ?? false);
            } else if (setting.setting_key === "maintenance_mode") {
              setMaintenanceMode(val?.enabled ?? false);
            } else if (setting.setting_key === "default_currency") {
              setDefaultCurrency(val?.code || "USD");
            } else if (setting.setting_key === "default_language") {
              setDefaultLanguage(val?.code || "EN");
            } else if (setting.setting_key === "pagination_limit") {
              setItemsPerPage(val?.limit ?? 10);
            } else if (setting.setting_key === "enable_proposal_vetting") {
              setEnableProposalVetting(val?.enabled ?? false);
            } else if (setting.setting_key === "enable_client_vetting") {
              const isEnabled = typeof val === "object" ? val?.enabled : val;
              setEnableClientVetting(isEnabled === true || isEnabled === "true");
            } else if (setting.setting_key === "enable_project_vetting") {
              const isEnabled = typeof val === "object" ? val?.enabled : val;
              setEnableProjectVetting(isEnabled === true || isEnabled === "true");
            } else if (setting.setting_key === "frontend_hero_content") {
              setFrontendHeroContent({
                hero_badge: val?.hero_badge || "The Top 3% Global Freelancers",
                hero_title: val?.hero_title || "Hire Expert Freelancers For Your Next Big Project",
                hero_subtitle: val?.hero_subtitle || "Connect with top-tier professionals. Execute faster with vetted talent tailored to your enterprise needs.",
                hero_search_placeholder: val?.hero_search_placeholder || "What skill are you looking for?",
                hero_search_btn: val?.hero_search_btn || "Search Talent",
                hero_popular_label: val?.hero_popular_label || "Popular: UI Design, React, AI Automation, SEO",
                search: val?.search || "Search"
              });
            } else if (setting.setting_key === "dispute_reasons") {
              setDisputeReasons(Array.isArray(val) ? val : (val?.reasons || disputeReasons));
            } else if (setting.setting_key === "client_dispute_reasons") {
              setClientDisputeReasons(Array.isArray(val) ? val : (val?.reasons || clientDisputeReasons));
            } else if (setting.setting_key === "freelancer_dispute_reasons") {
              setFreelancerDisputeReasons(Array.isArray(val) ? val : (val?.reasons || freelancerDisputeReasons));
            }
          });
        }
      } catch (err) {
        console.error("Error loading platform settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Update theme when changes occur
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

  const handleSaveSetting = async (key: string, value: any, category: string = "general") => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      await fetch(`${API_URL}/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          setting_key: key,
          setting_value: value
        })
      });
    } catch (err) {
      console.error(`Failed to save setting ${key}:`, err);
    }
  };

  // Auth/Admin state checks
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      const savedUser = localStorage.getItem("adminUser");
      
      if (!token) {
        setIsAuthenticated(false);
        if (pathname !== "/admin/login") {
          window.location.href = "/admin/login";
        }
        return;
      }

      if (token && pathname === "/admin/login") {
        window.location.href = "/admin";
        return;
      }

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setAdminUser(parsed);
        } catch (e) {
          console.error("Failed to parse admin user", e);
        }
      }

      const fetchAdmins = async () => {
        try {
          const res = await fetch(`${API_URL}/admin/all`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            setIsAuthenticated(false);
            if (pathname !== "/admin/login") {
              window.location.href = "/admin/login";
            }
            return;
          }
          const data = await res.json();
          setAdminsList(data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Error verifying admin token:", err);
          setIsAuthenticated(true);
          setFetchError("Could not connect to admin backend API.");
        }
      };

      fetchAdmins();
    }
  }, [pathname]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);
    setAdminLoading(true);

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setAdminError("Session expired. Please log in again.");
      setAdminLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword,
          role: newAdminRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create admin");
      }

      setAdminSuccess("Admin created successfully!");
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      
      const refreshRes = await fetch(`${API_URL}/admin/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAdminsList(refreshData);
      }
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm("Are you sure you want to delete this administrator?")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/admin/delete/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete admin");
        return;
      }

      setAdminsList((prev) => prev.filter((a) => a.admin_id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting admin");
    }
  };

  // Categories CRUD methods
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormError(null);
    setCategoryFormLoading(true);

    const token = localStorage.getItem("adminToken");
    const payload = {
      category_name: categoryFormName.trim(),
      category_image: categoryFormImage.trim() || null,
      status: categoryFormStatus === "Active",
      description: categoryFormDescription.trim() || null,
      category_video: categoryFormVideo.trim() || null
    };

    try {
      let url = `${API_URL}/admin/categories`;
      let method = "POST";

      if (categoryModalMode === "edit" && editingCategory) {
        const catId = editingCategory.id || editingCategory.category_id || "";
        url = `${API_URL}/admin/categories/${catId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save category");
      }

      setIsCategoryModalOpen(false);
      setCategoryFormName("");
      setCategoryFormSlug("");
      setCategoryFormDescription("");
      setCategoryFormImage("");
      setCategoryFormVideo("");
      setCategoryFormStatus("Active");
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      setCategoryFormError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete category");
      }

      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred while deleting the category.");
    }
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategory(category);
    setCategoryModalMode("edit");
    setCategoryFormName(category.category_name || category.name || "");
    setCategoryFormSlug(category.slug || "");
    setCategoryFormDescription(category.description || "");
    setCategoryFormImage(category.category_image || "");
    setCategoryFormVideo(category.category_video || "");
    const isActive = category.status === true || category.status === 1 || String(category.status).toLowerCase() === "active" || String(category.status).toLowerCase() === "true";
    setCategoryFormStatus(isActive ? "Active" : "Inactive");
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setCategoryModalMode("create");
    setCategoryFormName("");
    setCategoryFormSlug("");
    setCategoryFormDescription("");
    setCategoryFormImage("");
    setCategoryFormVideo("");
    setCategoryFormStatus("Active");
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  // Subcategories CRUD
  const fetchSubcategories = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/sub-categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubcategoriesList(data);
      }
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubcategoryFormError(null);
    setSubcategoryFormLoading(true);

    const token = localStorage.getItem("adminToken");
    const payload = {
      category_id: Number(subcategoryFormCategoryId),
      sub_category_name: subcategoryFormName.trim(),
      sub_category_image: null,
      status: subcategoryFormStatus === "Active"
    };

    try {
      let url = `${API_URL}/admin/sub-categories`;
      let method = "POST";

      if (subcategoryModalMode === "edit" && editingSubcategory) {
        const subId = editingSubcategory.sub_category_id || editingSubcategory.id || "";
        url = `${API_URL}/admin/sub-categories/${subId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save subcategory");
      }

      setIsSubcategoryModalOpen(false);
      setSubcategoryFormName("");
      setSubcategoryFormCategoryId("");
      setSubcategoryFormStatus("Active");
      setEditingSubcategory(null);
      fetchSubcategories();
    } catch (err) {
      setSubcategoryFormError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSubcategoryFormLoading(false);
    }
  };

  const handleDeleteSubcategory = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/admin/sub-categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete subcategory");
      }

      fetchSubcategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred while deleting the subcategory.");
    }
  };

  const handleEditSubcategoryClick = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setSubcategoryModalMode("edit");
    setSubcategoryFormName(sub.sub_category_name || sub.name || "");
    setSubcategoryFormCategoryId(String(sub.category_id || sub.categoryId || ""));
    const isActive = sub.status === true || sub.status === 1 || String(sub.status).toLowerCase() === "active" || String(sub.status).toLowerCase() === "true";
    setSubcategoryFormStatus(isActive ? "Active" : "Inactive");
    setSubcategoryFormError(null);
    setIsSubcategoryModalOpen(true);
  };

  const handleAddSubcategoryClick = () => {
    setEditingSubcategory(null);
    setSubcategoryModalMode("create");
    setSubcategoryFormName("");
    setSubcategoryFormCategoryId("");
    setSubcategoryFormStatus("Active");
    setSubcategoryFormError(null);
    setIsSubcategoryModalOpen(true);
  };

  // Bulk deletes
  const handleBulkDeleteCategories = async () => {
    if (selectedCategoryIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the selected ${selectedCategoryIds.length} categories?`)) return;

    const token = localStorage.getItem("adminToken");
    try {
      const deletePromises = selectedCategoryIds.map((id) =>
        fetch(`${API_URL}/admin/categories/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || `Failed to delete category ${id}`);
          }
        })
      );

      await Promise.all(deletePromises);
      setSelectedCategoryIds([]);
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred while deleting the selected categories.");
      fetchCategories();
    }
  };

  const handleBulkDeleteSubcategories = async () => {
    if (selectedSubcategoryIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the selected ${selectedSubcategoryIds.length} subcategories?`)) return;

    const token = localStorage.getItem("adminToken");
    try {
      const deletePromises = selectedSubcategoryIds.map((id) =>
        fetch(`${API_URL}/admin/sub-categories/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || `Failed to delete subcategory ${id}`);
          }
        })
      );

      await Promise.all(deletePromises);
      setSelectedSubcategoryIds([]);
      fetchSubcategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred while deleting the selected subcategories.");
      fetchSubcategories();
    }
  };

  // Skills CRUD
  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/skills`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSkillsList(data);
      }
    } catch (err) {
      console.error("Error fetching skills:", err);
    }
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSkillFormError(null);
    setSkillFormLoading(true);

    const token = localStorage.getItem("adminToken");
    const payload = {
      sub_category_id: Number(skillFormSubcategoryId),
      skill_name: skillFormName.trim(),
      status: skillFormStatus === "Active"
    };

    try {
      let url = `${API_URL}/admin/skills`;
      let method = "POST";

      if (skillModalMode === "edit" && editingSkill) {
        const skId = editingSkill.skill_id || editingSkill.id || "";
        url = `${API_URL}/admin/skills/${skId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save skill");
      }

      setIsSkillModalOpen(false);
      setSkillFormName("");
      setSkillFormSubcategoryId("");
      setSkillFormStatus("Active");
      setEditingSkill(null);
      fetchSkills();
    } catch (err) {
      setSkillFormError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSkillFormLoading(false);
    }
  };

  const handleDeleteSkill = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${API_URL}/admin/skills/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete skill");
      }

      fetchSkills();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred while deleting the skill.");
    }
  };

  const handleEditSkillClick = (sk: Skill) => {
    setEditingSkill(sk);
    setSkillModalMode("edit");
    setSkillFormName(sk.skill_name || sk.name || "");
    setSkillFormSubcategoryId(String(sk.subcategory_id || sk.subcategoryId || ""));
    const isActive = sk.status === true || sk.status === 1 || String(sk.status).toLowerCase() === "active" || String(sk.status).toLowerCase() === "true";
    setSkillFormStatus(isActive ? "Active" : "Inactive");
    setSkillFormError(null);
    setIsSkillModalOpen(true);
  };

  const handleAddSkillClick = () => {
    setEditingSkill(null);
    setSkillModalMode("create");
    setSkillFormName("");
    setSkillFormSubcategoryId("");
    setSkillFormStatus("Active");
    setSkillFormError(null);
    setIsSkillModalOpen(true);
  };

  const handleBulkDeleteSkills = async () => {
    if (selectedSkillIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the selected ${selectedSkillIds.length} skills?`)) return;

    const token = localStorage.getItem("adminToken");
    try {
      const deletePromises = selectedSkillIds.map((id) =>
        fetch(`${API_URL}/admin/skills/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || `Failed to delete skill ${id}`);
          }
        })
      );

      await Promise.all(deletePromises);
      setSelectedSkillIds([]);
      fetchSkills();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred while deleting the selected skills.");
      fetchSkills();
    }
  };



  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/disputes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map database columns to DisputeCase shape
        const mapped = data.map((d: any) => ({
          id: d.id.toString(),
          project: d.project,
          client: d.client,
          freelancer: d.freelancer,
          amount: parseFloat(d.amount),
          reason: d.reason,
          clientStatement: d.raised_by === 'client' ? d.description : 'No statement filed by client.',
          freelancerStatement: d.raised_by === 'freelancer' ? d.description : 'No statement filed by freelancer.',
          status: d.status === 'Open' ? 'Under Mediation' : d.status,
          client_id: d.client_id,
          freelancer_id: d.freelancer_id,
          conversation_id: d.conversation_id
        }));
        setDisputes(mapped);
      }
    } catch (err) {
      console.error("Error fetching disputes:", err);
    }
  };

  const resolveDispute = async (id: string, resolution: DisputeCase["status"]) => {
    let verdict = "";
    let client_refund_percent = 0;

    if (resolution.includes("Refunded Client")) {
      verdict = "Buyer Wins";
      client_refund_percent = 100;
    } else if (resolution.includes("Released to Freelancer")) {
      verdict = "Freelancer Wins";
      client_refund_percent = 0;
    } else if (resolution.includes("Split")) {
      verdict = "Partial Split";
      client_refund_percent = 50;
    }

    if (verdict) {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return;
        const res = await fetch(`${API_URL}/admin/disputes/${id}/resolve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ verdict, client_refund_percent })
        });
        if (res.ok) {
          fetchDisputes();
          fetchAdminWalletStats();
          fetchTransactions();
        }
      } catch (err) {
        console.error("Error resolving dispute:", err);
      }
    } else {
      setDisputes((prev) =>
        prev.map((disp) => (disp.id === id ? { ...disp, status: resolution } : disp))
      );
    }
  };

  const fetchAdminWalletStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setLoadingAdminWallet(true);
      const res = await fetch(`${API_URL}/admin/wallet/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminWalletStats(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch admin wallet stats:", e);
    } finally {
      setLoadingAdminWallet(false);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setLoadingWithdrawals(true);
      const res = await fetch(`${API_URL}/admin/wallet/withdrawals`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setWithdrawalRequests(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch withdrawal requests:", e);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleApproveWithdrawal = async (requestId: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/wallet/withdrawals/${requestId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Withdrawal request approved successfully.");
        fetchAdminWalletStats();
        fetchWithdrawalRequests();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to approve withdrawal.");
      }
    } catch (err) {
      console.error("Error approving withdrawal:", err);
    }
  };

  const handleRejectWithdrawal = async (requestId: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/wallet/withdrawals/${requestId}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Withdrawal request rejected successfully.");
        fetchAdminWalletStats();
        fetchWithdrawalRequests();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to reject withdrawal.");
      }
    } catch (err) {
      console.error("Error rejecting withdrawal:", err);
    }
  };

  const handlePayToUser = async (userId: number, amount: number, description: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return { success: false, message: "No token found" };
      const res = await fetch(`${API_URL}/admin/wallet/pay`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recipient_user_id: userId, amount, description })
      });
      const data = await res.json();
      if (res.ok) {
        fetchAdminWalletStats();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Failed to make transfer." };
      }
    } catch (err: any) {
      console.error("Error paying to user:", err);
      return { success: false, message: err.message || "Connection error." };
    }
  };

  const fetchCmsPages = async () => {
    try {
      setLoadingCms(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/cms/pages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setCmsPagesList(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch CMS pages:", error);
    } finally {
      setLoadingCms(false);
    }
  };

  const handleCreateCmsPage = async (title: string, slug: string, status: string, contentType: string, content: string, seo?: any) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/cms/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, slug, status, content_type: contentType, content, seo })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchCmsPages();
      }
      return data;
    } catch (error) {
      console.error("Failed to create CMS page:", error);
      return { message: "Network connection failed" };
    }
  };

  const handleUpdateCmsPage = async (id: number, title: string, slug: string, status: string, contentType: string, content: string, seo?: any) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/cms/pages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, slug, status, content_type: contentType, content, seo })
      });
      const data = await res.json();
      if (res.ok) {
        await fetchCmsPages();
      }
      return data;
    } catch (error) {
      console.error("Failed to update CMS page:", error);
      return { message: "Network connection failed" };
    }
  };

  const handleDeleteCmsPage = async (id: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/cms/pages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchCmsPages();
        alert("Page deleted successfully.");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete page.");
      }
    } catch (error) {
      console.error("Failed to delete CMS page:", error);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoadingBlogs(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/blogs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setBlogsList(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const handleCreateBlog = async (blogData: any) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(blogData)
      });
      const data = await res.json();
      if (res.ok) {
        await fetchBlogs();
      }
      return data;
    } catch (error) {
      console.error("Failed to create blog:", error);
      return { message: "Network connection failed" };
    }
  };

  const handleUpdateBlog = async (id: number, blogData: any) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/blogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(blogData)
      });
      const data = await res.json();
      if (res.ok) {
        await fetchBlogs();
      }
      return data;
    } catch (error) {
      console.error("Failed to update blog:", error);
      return { message: "Network connection failed" };
    }
  };

  const handleDeleteBlog = async (id: number) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchBlogs();
        alert("Blog post deleted successfully.");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete blog post.");
      }
    } catch (error) {
      console.error("Failed to delete blog:", error);
    }
  };

  const pendingVettingCount = useMemo(() => {
    return usersList.filter((u) => u.vetting_status === "Pending").length;
  }, [usersList]);
  const activeDisputesCount = useMemo(() => disputes.filter((d) => d.status === "Under Mediation").length, [disputes]);

  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        fetchCategories();
        fetchSubcategories();
        fetchSkills();
        fetchUsers();
        fetchProjects();
        fetchGigs();
        fetchGigOrders();
        fetchTransactions();
        fetchAdminWalletStats();
        fetchWithdrawalRequests();
        fetchCmsPages();
        fetchBlogs();
        fetchPendingProposals();
        fetchDisputes();
      }, 0);
    }
  }, [isAuthenticated]);

  // Map pathname to activeTab
  const activeTab = useMemo(() => {
    const routeMap: Record<string, string> = {
      "/admin": "overview",
      "/admin/taxonomies": "taxonomies",
      "/admin/cleanup": "cleanup",
      "/admin/languages": "languages",
      "/admin/settings": "settings",
      "/admin/site-settings": "site_settings",
      "/admin/general-settings": "general_settings",
      "/admin/email-settings": "email_settings",
      "/admin/frontend-content": "frontend_content",
      "/admin/footer-links": "footer_links",
      "/admin/social-login": "social_login",
      "/admin/transactions": "transactions",
      "/admin/projects": "projects",
      "/admin/projects/add": "add_project",
      "/admin/project-orders": "project_orders",
      "/admin/gigs": "gigs_list",
      "/admin/gig-orders": "gig_orders",
      "/admin/users": "users",
      "/admin/users/client": "admin_clients",
      "/admin/users/labour": "admin_labours",
      "/admin/users/engineer": "admin_engineers",
      "/admin/onboarding": "onboarding",
      "/admin/wallet-management": "wallet_management",
      "/admin/payment-settings": "payment_settings",
      "/admin/cms-pages": "cms_pages",
      "/admin/blogs": "blogs",
      "/admin/backups": "backups",
      "/admin/search-logs": "search_logs",
      "/admin/seo-settings": "seo_settings",
      "/admin/referrals": "referrals",
      "/admin/affiliate": "affiliate",
    };
    return routeMap[pathname] || "overview";
  }, [pathname]);

  const setActiveTab = (tab: string) => {
    if (tab === "languages" || tab === "currencies") {
      setCategoriesSubTab(tab);
      router.push("/admin/languages");
      return;
    }
    if (tab === "cleanup") {
      setCategoriesSubTab("cleanup");
      router.push("/admin/cleanup");
      return;
    }
    const routeMap: Record<string, string> = {
      overview: "/admin",
      profile: "/admin",
      taxonomies: "/admin/taxonomies",
      categories: "/admin/taxonomies",
      cleanup: "/admin/cleanup",
      languages: "/admin/languages",
      site_management: "/admin/settings?tab=site",
      site_settings: "/admin/settings?tab=site",
      general_settings: "/admin/settings?tab=general",
      email_settings: "/admin/settings?tab=email",
      frontend_content: "/admin/settings?tab=frontend",
      footer_links: "/admin/settings?tab=footer",
      social_login: "/admin/settings?tab=social",
      settings: "/admin/settings",
      transactions: "/admin/transactions",
      disputes: "/admin/transactions",
      projects: "/admin/projects",
      add_project: "/admin/projects/add",
      project_orders: "/admin/project-orders",
      gigs_list: "/admin/gigs",
      gig_orders: "/admin/gig-orders",
      users: "/admin/users",
      admin_clients: "/admin/users/client",
      admin_labours: "/admin/users/labour",
      admin_engineers: "/admin/users/engineer",
      onboarding: "/admin/onboarding",
      wallet_management: "/admin/wallet-management",
      payment_settings: "/admin/settings?tab=payment",
      dispute_reasons: "/admin/settings?tab=disputes",
      cms_pages: "/admin/cms-pages",
      blogs: "/admin/blogs",
      backups: "/admin/backups",
      search_logs: "/admin/search-logs",
      seo_settings: "/admin/settings?tab=seo",
      referral_settings: "/admin/settings?tab=referral",
      referrals: "/admin/referrals",
      affiliate: "/admin/affiliate",
    };
    const path = routeMap[tab];
    if (path) {
      router.push(path);
    }
  };

  const fetchPendingProposals = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/proposals/pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingProposals(await res.json());
      }
    } catch (err) {
      console.error("Error fetching pending proposals:", err);
    }
  };

  const handleUpdateProposalVettingStatus = async (proposalId: number, status: "Approved" | "Rejected") => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/proposals/${proposalId}/vetting`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchPendingProposals();
      }
    } catch (err) {
      console.error("Error updating proposal vetting status:", err);
    }
  };

  const userCounts = useMemo(() => {
    let total = usersList.length;
    let freelancers = usersList.filter(u => u.freelancer_onboarding).length;
    let clients = usersList.filter(u => u.client_onboarding).length;
    return { total, freelancers, clients };
  }, [usersList]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (usersFilterRole === "freelancer" && !u.freelancer_onboarding) return false;
      if (usersFilterRole === "client" && !u.client_onboarding) return false;

      const searchStr = usersSearch.toLowerCase();
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      return (
        fullName.includes(searchStr) ||
        (u.email || "").toLowerCase().includes(searchStr)
      );
    });
  }, [usersSearch, usersFilterRole, usersList]);

  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, usersPage, itemsPerPage]);

  const totalUsersPages = useMemo(() => Math.ceil(filteredUsers.length / itemsPerPage), [filteredUsers, itemsPerPage]);

  const filteredOnboardedUsers = useMemo(() => {
    return usersList.filter(u => {
      const isOnboarded = u.freelancer_onboarding || u.client_onboarding;
      if (!isOnboarded) return false;

      if (onboardedFilterRole === "freelancer" && !u.freelancer_onboarding) return false;
      if (onboardedFilterRole === "client" && !u.client_onboarding) return false;
      if (onboardedFilterRole === "pending_vetting") {
        if (!u.freelancer_onboarding) return false;
        if (u.vetting_status !== "Pending" && u.vetting_status !== null) return false;
      }

      const searchStr = onboardedSearch.toLowerCase();
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      return (
        fullName.includes(searchStr) ||
        (u.email || "").toLowerCase().includes(searchStr)
      );
    });
  }, [onboardedSearch, onboardedFilterRole, usersList]);

  const paginatedOnboardedUsers = useMemo(() => {
    const start = (onboardedPage - 1) * itemsPerPage;
    return filteredOnboardedUsers.slice(start, start + itemsPerPage);
  }, [filteredOnboardedUsers, onboardedPage, itemsPerPage]);

  const totalOnboardedPages = useMemo(() => Math.ceil(filteredOnboardedUsers.length / itemsPerPage), [filteredOnboardedUsers, itemsPerPage]);

  const filteredProjects = useMemo(() => {
    return projectsList.filter(p => 
      (p.title || "").toLowerCase().includes(projectsSearch.toLowerCase()) ||
      (p.client_name || "").toLowerCase().includes(projectsSearch.toLowerCase())
    );
  }, [projectsSearch, projectsList]);

  const paginatedProjects = useMemo(() => {
    const start = (projectsPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, projectsPage, itemsPerPage]);

  const totalProjectsPages = useMemo(() => Math.ceil(filteredProjects.length / itemsPerPage), [filteredProjects, itemsPerPage]);

  const filteredGigs = useMemo(() => {
    return gigsList.filter(g => 
      (g.title || "").toLowerCase().includes(gigsSearch.toLowerCase()) ||
      (g.freelancer_name || "").toLowerCase().includes(gigsSearch.toLowerCase())
    );
  }, [gigsSearch, gigsList]);

  const paginatedGigs = useMemo(() => {
    const start = (gigsPage - 1) * itemsPerPage;
    return filteredGigs.slice(start, start + itemsPerPage);
  }, [filteredGigs, gigsPage, itemsPerPage]);

  const totalGigsPages = useMemo(() => Math.ceil(filteredGigs.length / itemsPerPage), [filteredGigs, itemsPerPage]);

  const filteredGigOrders = useMemo(() => {
    return gigOrdersList.filter(o => 
      (o.gig_title || "").toLowerCase().includes(gigOrdersSearch.toLowerCase()) ||
      (o.client_name || "").toLowerCase().includes(gigOrdersSearch.toLowerCase()) ||
      (o.freelancer_name || "").toLowerCase().includes(gigOrdersSearch.toLowerCase())
    );
  }, [gigOrdersSearch, gigOrdersList]);

  const paginatedGigOrders = useMemo(() => {
    const start = (gigOrdersPage - 1) * itemsPerPage;
    return filteredGigOrders.slice(start, start + itemsPerPage);
  }, [filteredGigOrders, gigOrdersPage, itemsPerPage]);

  const totalGigOrdersPages = useMemo(() => Math.ceil(filteredGigOrders.length / itemsPerPage), [filteredGigOrders, itemsPerPage]);

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter(t => 
      (t.title || "").toLowerCase().includes(transactionsSearch.toLowerCase()) ||
      (t.client_name || "").toLowerCase().includes(transactionsSearch.toLowerCase()) ||
      (t.freelancer_name || "").toLowerCase().includes(transactionsSearch.toLowerCase())
    );
  }, [transactionsSearch, transactionsList]);

  const paginatedTransactions = useMemo(() => {
    const start = (transactionsPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, transactionsPage, itemsPerPage]);

  const totalTransactionsPages = useMemo(() => Math.ceil(filteredTransactions.length / itemsPerPage), [filteredTransactions, itemsPerPage]);

  const filteredCategories = useMemo(() => {
    return categoriesList.filter(cat =>
      (cat.category_name || cat.name || "").toLowerCase().includes(categoriesSearch.toLowerCase())
    );
  }, [categoriesSearch, categoriesList]);

  const paginatedCategories = useMemo(() => {
    const start = (categoriesPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, categoriesPage, itemsPerPage]);

  const totalCategoriesPages = useMemo(() => Math.ceil(filteredCategories.length / itemsPerPage), [filteredCategories, itemsPerPage]);

  const filteredSubcategories = useMemo(() => {
    return subcategoriesList.filter(sub =>
      (sub.sub_category_name || sub.name || "").toLowerCase().includes(categoriesSearch.toLowerCase()) ||
      (sub.category_name || sub.categoryName || "").toLowerCase().includes(categoriesSearch.toLowerCase())
    );
  }, [categoriesSearch, subcategoriesList]);

  const paginatedSubcategories = useMemo(() => {
    const start = (subcategoriesPage - 1) * itemsPerPage;
    return filteredSubcategories.slice(start, start + itemsPerPage);
  }, [filteredSubcategories, subcategoriesPage, itemsPerPage]);

  const totalSubcategoriesPages = useMemo(() => Math.ceil(filteredSubcategories.length / itemsPerPage), [filteredSubcategories, itemsPerPage]);

  const filteredSkills = useMemo(() => {
    return skillsList.filter(sk =>
      (sk.skill_name || sk.name || "").toLowerCase().includes(categoriesSearch.toLowerCase()) ||
      (sk.sub_category_name || sk.subcategoryName || "").toLowerCase().includes(categoriesSearch.toLowerCase()) ||
      (sk.slug || "").toLowerCase().includes(categoriesSearch.toLowerCase())
    );
  }, [categoriesSearch, skillsList]);

  const paginatedSkills = useMemo(() => {
    const start = (skillsPage - 1) * itemsPerPage;
    return filteredSkills.slice(start, start + itemsPerPage);
  }, [filteredSkills, skillsPage, itemsPerPage]);

  const totalSkillsPages = useMemo(() => Math.ceil(filteredSkills.length / itemsPerPage), [filteredSkills, itemsPerPage]);

  useEffect(() => {
    setTimeout(() => {
      setCategoriesPage(1);
      setSubcategoriesPage(1);
      setSkillsPage(1);
      setSelectedCategoryIds([]);
      setSelectedSubcategoryIds([]);
      setSelectedSkillIds([]);
    }, 0);
  }, [categoriesSearch, categoriesSubTab]);

  return (
    <AdminContext.Provider value={{
      isAuthenticated, setIsAuthenticated, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen,
      adminTheme, setAdminTheme,
      usersList, usersSearch, setUsersSearch, usersPage, setUsersPage, usersLoading, usersFilterRole, setUsersFilterRole,
      fetchUsers, handleToggleUserActive, onboardedSearch, setOnboardedSearch, onboardedFilterRole, setOnboardedFilterRole,
      onboardedPage, setOnboardedPage, projectsList, projectsSearch, setProjectsSearch, projectsPage, setProjectsPage,
      projectsLoading, fetchProjects, handleUpdateProjectStatus, handleDeleteProject, gigsList, gigsSearch, setGigsSearch,
      gigsPage, setGigsPage, gigsLoading, fetchGigs, handleUpdateGigStatus, handleDeleteGig, gigOrdersList, gigOrdersSearch,
      setGigOrdersSearch, gigOrdersPage, setGigOrdersPage, gigOrdersLoading, fetchGigOrders, handleUpdateGigOrderStatus,
      transactionsList, transactionsSearch, setTransactionsSearch, transactionsPage, setTransactionsPage, transactionsLoading,
      fetchTransactions, gigMenuOpen, setGigMenuOpen, projectMenuOpen, setProjectMenuOpen, settingsMenuOpen, setSettingsMenuOpen, categoriesSubTab, setCategoriesSubTab,
      projectsSubTab, setProjectsSubTab, transactionsSubTab, setTransactionsSubTab, usersSubTab, setUsersSubTab, categoriesSearch,
      setCategoriesSearch, categoriesPage, setCategoriesPage, subcategoriesPage, setSubcategoriesPage, skillsPage, setSkillsPage,
      categoriesList, isCategoryModalOpen, setIsCategoryModalOpen, categoryModalMode, setCategoryModalMode, editingCategory,
      categoryFormName, setCategoryFormName, categoryFormSlug, setCategoryFormSlug, categoryFormDescription, setCategoryFormDescription,
      categoryFormImage, setCategoryFormImage, categoryFormVideo, setCategoryFormVideo,
      categoryFormStatus, setCategoryFormStatus, categoryFormError, categoryFormLoading, handleCategorySubmit, handleDeleteCategory,
      handleEditCategoryClick, handleAddCategoryClick, subcategoriesList, isSubcategoryModalOpen, setIsSubcategoryModalOpen,
      subcategoryModalMode, setSubcategoryModalMode, editingSubcategory, subcategoryFormName, setSubcategoryFormName,
      subcategoryFormCategoryId, setSubcategoryFormCategoryId, subcategoryFormStatus, setSubcategoryFormStatus, subcategoryFormError,
      subcategoryFormLoading, handleSubcategorySubmit, handleDeleteSubcategory, handleEditSubcategoryClick, handleAddSubcategoryClick,
      selectedCategoryIds, setSelectedCategoryIds, selectedSubcategoryIds, setSelectedSubcategoryIds, selectedSkillIds,
      setSelectedSkillIds, handleBulkDeleteCategories, handleBulkDeleteSubcategories, handleBulkDeleteSkills, skillsList,
      isSkillModalOpen, setIsSkillModalOpen, skillModalMode, setSkillModalMode, editingSkill, skillFormName, setSkillFormName,
      skillFormSubcategoryId, setSkillFormSubcategoryId, skillFormStatus, setSkillFormStatus, skillFormError, skillFormLoading,
      handleSkillSubmit, handleDeleteSkill, handleEditSkillClick, handleAddSkillClick, platformFee, setPlatformFee, autoVetting,
      setAutoVetting, maintenanceMode, setMaintenanceMode, primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor,
      siteTheme, setSiteTheme, defaultCurrency, setDefaultCurrency, defaultLanguage, setDefaultLanguage, handleSaveSetting, frontendHeroContent, setFrontendHeroContent, disputeReasons, setDisputeReasons, clientDisputeReasons, setClientDisputeReasons, freelancerDisputeReasons, setFreelancerDisputeReasons, adminsList, adminUser, newAdminName, setNewAdminName, newAdminEmail, setNewAdminEmail,
      newAdminPassword, setNewAdminPassword, newAdminRole, setNewAdminRole, adminError, adminSuccess, adminLoading, handleCreateAdmin,
      handleDeleteAdmin, disputes, resolveDispute, fetchDisputes, pendingVettingCount, activeDisputesCount,
      adminNotifications, setAdminNotifications, highlightedDisputeId, setHighlightedDisputeId,
      userCounts, filteredUsers, paginatedUsers, totalUsersPages, filteredOnboardedUsers, paginatedOnboardedUsers, totalOnboardedPages,
      fetchError,
      filteredProjects, paginatedProjects, totalProjectsPages, filteredGigs, paginatedGigs, totalGigsPages, filteredGigOrders,
      paginatedGigOrders, totalGigOrdersPages, filteredTransactions, paginatedTransactions, totalTransactionsPages,
      filteredCategories, paginatedCategories, totalCategoriesPages, filteredSubcategories, paginatedSubcategories,
      totalSubcategoriesPages, filteredSkills, paginatedSkills, totalSkillsPages, itemsPerPage, setItemsPerPage,
      adminWalletStats, loadingAdminWallet, fetchAdminWalletStats,
      withdrawalRequests, loadingWithdrawals, fetchWithdrawalRequests,
      handleApproveWithdrawal, handleRejectWithdrawal, handlePayToUser,
      cmsPagesList, loadingCms, fetchCmsPages,
      handleCreateCmsPage, handleUpdateCmsPage, handleDeleteCmsPage,
      blogsList, loadingBlogs, fetchBlogs,
      handleCreateBlog, handleUpdateBlog, handleDeleteBlog,
      enableProposalVetting, setEnableProposalVetting, enableClientVetting, setEnableClientVetting,
      enableProjectVetting, setEnableProjectVetting, pendingProposals, fetchPendingProposals,
      handleUpdateProposalVettingStatus
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
