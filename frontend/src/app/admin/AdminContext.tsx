"use client";

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
}

export interface Category {
  id?: string;
  category_id?: string | number;
  category_name?: string;
  name?: string;
  slug?: string;
  description?: string;
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
  categoriesSubTab: "categories" | "subcategories" | "skills";
  setCategoriesSubTab: React.Dispatch<React.SetStateAction<"categories" | "subcategories" | "skills" >>;
  projectsSubTab: "projects" | "vetting";
  setProjectsSubTab: React.Dispatch<React.SetStateAction<"projects" | "vetting">>;
  transactionsSubTab: "transactions" | "disputes";
  setTransactionsSubTab: React.Dispatch<React.SetStateAction<"transactions" | "disputes">>;
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

  // Vetting Applications & Disputes states
  vettingApps: VettingApplication[];
  updateVettingStatus: (id: string, newStatus: VettingApplication["status"]) => void;
  disputes: DisputeCase[];
  resolveDispute: (id: string, resolution: DisputeCase["status"]) => void;
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
  adminWalletStats: any | null;
  loadingAdminWallet: boolean;
  fetchAdminWalletStats: () => Promise<void>;
  withdrawalRequests: any[];
  loadingWithdrawals: boolean;
  fetchWithdrawalRequests: () => Promise<void>;
  handleApproveWithdrawal: (id: number) => Promise<void>;
  handleRejectWithdrawal: (id: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);
const itemsPerPage = 5;

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const [categoriesSubTab, setCategoriesSubTab] = useState<"categories" | "subcategories" | "skills">("categories");
  const [projectsSubTab, setProjectsSubTab] = useState<"projects" | "vetting">("projects");
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

  // Vetting Applications state
  const [vettingApps, setVettingApps] = useState<VettingApplication[]>([
    { id: "v1", name: "Marcus Chen", role: "Rust Systems Engineer", rate: "$110/hr", experience: "8 years", skills: ["Rust", "WebAssembly", "Go"], status: "Pending" },
    { id: "v2", name: "Sophia Martinez", role: "Senior UX Designer", rate: "$90/hr", experience: "6 years", skills: ["Figma", "Design Systems", "Prototyping"], status: "Pending" },
    { id: "v3", name: "Vikram Nair", role: "AI Automation Architect", rate: "$130/hr", experience: "5 years", skills: ["Python", "PyTorch", "LangChain"], status: "Pending" },
    { id: "v4", name: "Claire Dupont", role: "SEO Growth Hacker", rate: "$65/hr", experience: "4 years", skills: ["SEO", "Content Marketing", "Analytics"], status: "Pending" },
  ]);

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

  // System Settings state
  const [platformFee, setPlatformFee] = useState(5);
  const [autoVetting, setAutoVetting] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [secondaryColor, setSecondaryColor] = useState("#06b6d4");
  const [siteTheme, setSiteTheme] = useState("light");

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setUsersLoading(true);
      const res = await fetch("http://localhost:5000/api/admin/users", {
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
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/toggle-active`, {
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
      const res = await fetch("http://localhost:5000/api/admin/projects", {
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
      const res = await fetch(`http://localhost:5000/api/admin/projects/${projectId}/status`, {
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
      const res = await fetch(`http://localhost:5000/api/admin/projects/${projectId}`, {
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
      const res = await fetch("http://localhost:5000/api/admin/gigs", {
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
      const res = await fetch(`http://localhost:5000/api/admin/gigs/${gigId}/status`, {
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
      const res = await fetch(`http://localhost:5000/api/admin/gigs/${gigId}`, {
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
      const res = await fetch("http://localhost:5000/api/admin/gig-orders", {
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
      const res = await fetch(`http://localhost:5000/api/admin/gig-orders/${orderId}/status`, {
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
      const res = await fetch("http://localhost:5000/api/admin/transactions", {
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
        const res = await fetch("http://localhost:5000/api/settings");
        if (res.ok) {
          const data = await res.json();
          data.forEach((setting: any) => {
            if (setting.setting_key === "primary_color") {
              setPrimaryColor(setting.setting_value?.color || "#10b981");
            } else if (setting.setting_key === "secondary_color") {
              setSecondaryColor(setting.setting_value?.color || "#06b6d4");
            } else if (setting.setting_key === "theme") {
              setSiteTheme(setting.setting_value?.theme || "light");
            } else if (setting.setting_key === "platform_fee") {
              setPlatformFee(setting.setting_value?.fee ?? 5);
            } else if (setting.setting_key === "auto_vetting") {
              setAutoVetting(setting.setting_value?.enabled ?? false);
            } else if (setting.setting_key === "maintenance_mode") {
              setMaintenanceMode(setting.setting_value?.enabled ?? false);
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
      const { applyTheme } = await import("@/utils/theme");
      applyTheme(siteTheme, primaryColor, secondaryColor);
    };
    apply();
  }, [siteTheme, primaryColor, secondaryColor]);

  const handleSaveSetting = async (key: string, value: any, category: string = "general") => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      await fetch("http://localhost:5000/api/admin/settings", {
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
          const res = await fetch("http://localhost:5000/api/admin/all", {
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
      const res = await fetch("http://localhost:5000/api/admin/create", {
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
      
      const refreshRes = await fetch("http://localhost:5000/api/admin/all", {
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
      const res = await fetch(`http://localhost:5000/api/admin/delete/${id}`, {
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
      const res = await fetch("http://localhost:5000/api/admin/categories", {
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
      category_image: null,
      status: categoryFormStatus === "Active"
    };

    try {
      let url = "http://localhost:5000/api/admin/categories";
      let method = "POST";

      if (categoryModalMode === "edit" && editingCategory) {
        const catId = editingCategory.id || editingCategory.category_id || "";
        url = `http://localhost:5000/api/admin/categories/${catId}`;
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
      const res = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
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
    setCategoryFormStatus("Active");
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  // Subcategories CRUD
  const fetchSubcategories = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/admin/sub-categories", {
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
      let url = "http://localhost:5000/api/admin/sub-categories";
      let method = "POST";

      if (subcategoryModalMode === "edit" && editingSubcategory) {
        const subId = editingSubcategory.sub_category_id || editingSubcategory.id || "";
        url = `http://localhost:5000/api/admin/sub-categories/${subId}`;
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
      const res = await fetch(`http://localhost:5000/api/admin/sub-categories/${id}`, {
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
        fetch(`http://localhost:5000/api/admin/categories/${id}`, {
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
        fetch(`http://localhost:5000/api/admin/sub-categories/${id}`, {
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
      const res = await fetch("http://localhost:5000/api/admin/skills", {
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
      let url = "http://localhost:5000/api/admin/skills";
      let method = "POST";

      if (skillModalMode === "edit" && editingSkill) {
        const skId = editingSkill.skill_id || editingSkill.id || "";
        url = `http://localhost:5000/api/admin/skills/${skId}`;
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
      const res = await fetch(`http://localhost:5000/api/admin/skills/${id}`, {
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
        fetch(`http://localhost:5000/api/admin/skills/${id}`, {
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

  // Vetting Applications & Disputes logic
  const updateVettingStatus = (id: string, newStatus: VettingApplication["status"]) => {
    setVettingApps((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const resolveDispute = (id: string, resolution: DisputeCase["status"]) => {
    setDisputes((prev) =>
      prev.map((disp) => (disp.id === id ? { ...disp, status: resolution } : disp))
    );
  };

  const fetchAdminWalletStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      setLoadingAdminWallet(true);
      const res = await fetch("http://localhost:5000/api/admin/wallet/stats", {
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
      const res = await fetch("http://localhost:5000/api/admin/wallet/withdrawals", {
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
      const res = await fetch(`http://localhost:5000/api/admin/wallet/withdrawals/${requestId}/approve`, {
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
      const res = await fetch(`http://localhost:5000/api/admin/wallet/withdrawals/${requestId}/reject`, {
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

  const pendingVettingCount = useMemo(() => vettingApps.filter((a) => a.status === "Pending").length, [vettingApps]);
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
      }, 0);
    }
  }, [isAuthenticated]);

  // Map pathname to activeTab
  const activeTab = useMemo(() => {
    const routeMap: Record<string, string> = {
      "/admin": "overview",
      "/admin/taxonomies": "taxonomies",
      "/admin/site-management": "site_management",
      "/admin/transactions": "transactions",
      "/admin/projects": "projects",
      "/admin/project-orders": "project_orders",
      "/admin/gigs": "gigs_list",
      "/admin/gig-orders": "gig_orders",
      "/admin/users": "users",
      "/admin/onboarding": "onboarding",
      "/admin/wallet-management": "wallet_management",
      "/admin/payment-settings": "payment_settings",
    };
    return routeMap[pathname] || "overview";
  }, [pathname]);

  const setActiveTab = (tab: string) => {
    const routeMap: Record<string, string> = {
      overview: "/admin",
      profile: "/admin",
      taxonomies: "/admin/taxonomies",
      categories: "/admin/taxonomies",
      site_management: "/admin/site-management",
      settings: "/admin/site-management",
      transactions: "/admin/transactions",
      disputes: "/admin/transactions",
      projects: "/admin/projects",
      project_orders: "/admin/project-orders",
      gigs_list: "/admin/gigs",
      gig_orders: "/admin/gig-orders",
      users: "/admin/users",
      onboarding: "/admin/onboarding",
      wallet_management: "/admin/wallet-management",
      payment_settings: "/admin/payment-settings",
    };
    const path = routeMap[tab];
    if (path) {
      router.push(path);
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
  }, [filteredUsers, usersPage]);

  const totalUsersPages = useMemo(() => Math.ceil(filteredUsers.length / itemsPerPage), [filteredUsers]);

  const filteredOnboardedUsers = useMemo(() => {
    return usersList.filter(u => {
      const isOnboarded = u.freelancer_onboarding || u.client_onboarding;
      if (!isOnboarded) return false;

      if (onboardedFilterRole === "freelancer" && !u.freelancer_onboarding) return false;
      if (onboardedFilterRole === "client" && !u.client_onboarding) return false;

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
  }, [filteredOnboardedUsers, onboardedPage]);

  const totalOnboardedPages = useMemo(() => Math.ceil(filteredOnboardedUsers.length / itemsPerPage), [filteredOnboardedUsers]);

  const filteredProjects = useMemo(() => {
    return projectsList.filter(p => 
      (p.title || "").toLowerCase().includes(projectsSearch.toLowerCase()) ||
      (p.client_name || "").toLowerCase().includes(projectsSearch.toLowerCase())
    );
  }, [projectsSearch, projectsList]);

  const paginatedProjects = useMemo(() => {
    const start = (projectsPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, projectsPage]);

  const totalProjectsPages = useMemo(() => Math.ceil(filteredProjects.length / itemsPerPage), [filteredProjects]);

  const filteredGigs = useMemo(() => {
    return gigsList.filter(g => 
      (g.title || "").toLowerCase().includes(gigsSearch.toLowerCase()) ||
      (g.freelancer_name || "").toLowerCase().includes(gigsSearch.toLowerCase())
    );
  }, [gigsSearch, gigsList]);

  const paginatedGigs = useMemo(() => {
    const start = (gigsPage - 1) * itemsPerPage;
    return filteredGigs.slice(start, start + itemsPerPage);
  }, [filteredGigs, gigsPage]);

  const totalGigsPages = useMemo(() => Math.ceil(filteredGigs.length / itemsPerPage), [filteredGigs]);

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
  }, [filteredGigOrders, gigOrdersPage]);

  const totalGigOrdersPages = useMemo(() => Math.ceil(filteredGigOrders.length / itemsPerPage), [filteredGigOrders]);

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
  }, [filteredTransactions, transactionsPage]);

  const totalTransactionsPages = useMemo(() => Math.ceil(filteredTransactions.length / itemsPerPage), [filteredTransactions]);

  const filteredCategories = useMemo(() => {
    return categoriesList.filter(cat =>
      (cat.category_name || cat.name || "").toLowerCase().includes(categoriesSearch.toLowerCase())
    );
  }, [categoriesSearch, categoriesList]);

  const paginatedCategories = useMemo(() => {
    const start = (categoriesPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, categoriesPage]);

  const totalCategoriesPages = useMemo(() => Math.ceil(filteredCategories.length / itemsPerPage), [filteredCategories]);

  const filteredSubcategories = useMemo(() => {
    return subcategoriesList.filter(sub =>
      (sub.sub_category_name || sub.name || "").toLowerCase().includes(categoriesSearch.toLowerCase()) ||
      (sub.category_name || sub.categoryName || "").toLowerCase().includes(categoriesSearch.toLowerCase())
    );
  }, [categoriesSearch, subcategoriesList]);

  const paginatedSubcategories = useMemo(() => {
    const start = (subcategoriesPage - 1) * itemsPerPage;
    return filteredSubcategories.slice(start, start + itemsPerPage);
  }, [filteredSubcategories, subcategoriesPage]);

  const totalSubcategoriesPages = useMemo(() => Math.ceil(filteredSubcategories.length / itemsPerPage), [filteredSubcategories]);

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
  }, [filteredSkills, skillsPage]);

  const totalSkillsPages = useMemo(() => Math.ceil(filteredSkills.length / itemsPerPage), [filteredSkills]);

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
      siteTheme, setSiteTheme, handleSaveSetting, adminsList, adminUser, newAdminName, setNewAdminName, newAdminEmail, setNewAdminEmail,
      newAdminPassword, setNewAdminPassword, newAdminRole, setNewAdminRole, adminError, adminSuccess, adminLoading, handleCreateAdmin,
      handleDeleteAdmin, vettingApps, updateVettingStatus, disputes, resolveDispute, pendingVettingCount, activeDisputesCount,
      userCounts, filteredUsers, paginatedUsers, totalUsersPages, filteredOnboardedUsers, paginatedOnboardedUsers, totalOnboardedPages,
      fetchError,
      filteredProjects, paginatedProjects, totalProjectsPages, filteredGigs, paginatedGigs, totalGigsPages, filteredGigOrders,
      paginatedGigOrders, totalGigOrdersPages, filteredTransactions, paginatedTransactions, totalTransactionsPages,
      filteredCategories, paginatedCategories, totalCategoriesPages, filteredSubcategories, paginatedSubcategories,
      totalSubcategoriesPages, filteredSkills, paginatedSkills, totalSkillsPages, itemsPerPage,
      adminWalletStats, loadingAdminWallet, fetchAdminWalletStats,
      withdrawalRequests, loadingWithdrawals, fetchWithdrawalRequests,
      handleApproveWithdrawal, handleRejectWithdrawal
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
