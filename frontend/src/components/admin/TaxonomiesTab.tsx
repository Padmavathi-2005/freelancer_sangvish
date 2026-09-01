"use client";
import { API_URL } from "@/config/api";
import { FiUpload } from "react-icons/fi";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Table from "@/components/Table";
import CustomSelect from "@/components/CustomSelect";
import { Category, Subcategory, Skill } from "@/app/admin/AdminContext";
import LanguagesCurrenciesTab from "@/components/admin/LanguagesCurrenciesTab";
import { useLanguage } from "@/context/LanguageContext";

interface TaxonomiesTabProps {
  categoriesSubTab: "categories" | "subcategories" | "skills" | "languages" | "currencies" | "cleanup";
  setCategoriesSubTab: (tab: "categories" | "subcategories" | "skills" | "languages" | "currencies" | "cleanup") => void;
  categoriesSearch: string;
  setCategoriesSearch: (v: string) => void;
  paginatedCategories: Category[];
  categoriesPage: number;
  totalCategoriesPages: number;
  setCategoriesPage: (page: number) => void;
  filteredCategories: Category[];
  itemsPerPage: number;

  paginatedSubcategories: Subcategory[];
  subcategoriesPage: number;
  totalSubcategoriesPages: number;
  setSubcategoriesPage: (page: number) => void;
  filteredSubcategories: Subcategory[];

  paginatedSkills: Skill[];
  skillsPage: number;
  totalSkillsPages: number;
  setSkillsPage: (page: number) => void;
  filteredSkills: Skill[];

  categoriesList: Category[];
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (v: boolean) => void;
  categoryModalMode: "create" | "edit";
  categoryFormName: string;
  setCategoryFormName: (v: string) => void;
  categoryFormSlug: string;
  setCategoryFormSlug: (v: string) => void;
  categoryFormDescription: string;
  setCategoryFormDescription: (v: string) => void;
  categoryFormImage?: string;
  setCategoryFormImage?: (v: string) => void;
  categoryFormVideo?: string;
  setCategoryFormVideo?: (v: string) => void;
  categoryFormStatus: "Active" | "Inactive";
  setCategoryFormStatus: (v: "Active" | "Inactive") => void;
  categoryFormError: string | null;
  categoryFormLoading: boolean;
  handleCategorySubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (id: string | number) => Promise<void>;
  handleEditCategoryClick: (category: Category) => void;
  handleAddCategoryClick: () => void;

  subcategoriesList: Subcategory[];
  isSubcategoryModalOpen: boolean;
  setIsSubcategoryModalOpen: (v: boolean) => void;
  subcategoryModalMode: "create" | "edit";
  subcategoryFormName: string;
  setSubcategoryFormName: (v: string) => void;
  subcategoryFormCategoryId: string;
  setSubcategoryFormCategoryId: (v: string) => void;
  subcategoryFormStatus: "Active" | "Inactive";
  setSubcategoryFormStatus: (v: "Active" | "Inactive") => void;
  subcategoryFormError: string | null;
  subcategoryFormLoading: boolean;
  handleSubcategorySubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteSubcategory: (id: string | number) => Promise<void>;
  handleEditSubcategoryClick: (sub: Subcategory) => void;
  handleAddSubcategoryClick: () => void;

  selectedCategoryIds: (string | number)[];
  setSelectedCategoryIds: (ids: (string | number)[]) => void;
  selectedSubcategoryIds: (string | number)[];
  setSelectedSubcategoryIds: (ids: (string | number)[]) => void;
  selectedSkillIds: (string | number)[];
  setSelectedSkillIds: (ids: (string | number)[]) => void;
  handleBulkDeleteCategories: () => Promise<void>;
  handleBulkDeleteSubcategories: () => Promise<void>;
  handleBulkDeleteSkills: () => Promise<void>;

  skillsList: Skill[];
  isSkillModalOpen: boolean;
  setIsSkillModalOpen: (v: boolean) => void;
  skillModalMode: "create" | "edit";
  skillFormName: string;
  setSkillFormName: (v: string) => void;
  skillFormSubcategoryId: string;
  setSkillFormSubcategoryId: (v: string) => void;
  skillFormStatus: "Active" | "Inactive";
  setSkillFormStatus: (v: "Active" | "Inactive") => void;
  skillFormError: string | null;
  skillFormLoading: boolean;
  handleSkillSubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteSkill: (id: string | number) => Promise<void>;
  handleEditSkillClick: (sk: Skill) => void;
  handleAddSkillClick: () => void;
}

export default function TaxonomiesTab({
  categoriesSubTab,
  setCategoriesSubTab,
  categoriesSearch,
  setCategoriesSearch,
  paginatedCategories,
  categoriesPage,
  totalCategoriesPages,
  setCategoriesPage,
  filteredCategories,
  itemsPerPage,
  paginatedSubcategories,
  subcategoriesPage,
  totalSubcategoriesPages,
  setSubcategoriesPage,
  filteredSubcategories,
  paginatedSkills,
  skillsPage,
  totalSkillsPages,
  setSkillsPage,
  filteredSkills,
  categoriesList,
  isCategoryModalOpen,
  setIsCategoryModalOpen,
  categoryModalMode,
  categoryFormName,
  setCategoryFormName,
  categoryFormSlug,
  setCategoryFormSlug,
  categoryFormDescription,
  setCategoryFormDescription,
  categoryFormImage = "",
  setCategoryFormImage = () => {},
  categoryFormVideo = "",
  setCategoryFormVideo = () => {},
  categoryFormStatus,
  setCategoryFormStatus,
  categoryFormError,
  categoryFormLoading,
  handleCategorySubmit,
  handleDeleteCategory,
  handleEditCategoryClick,
  handleAddCategoryClick,
  subcategoriesList,
  isSubcategoryModalOpen,
  setIsSubcategoryModalOpen,
  subcategoryModalMode,
  subcategoryFormName,
  setSubcategoryFormName,
  subcategoryFormCategoryId,
  setSubcategoryFormCategoryId,
  subcategoryFormStatus,
  setSubcategoryFormStatus,
  subcategoryFormError,
  subcategoryFormLoading,
  handleSubcategorySubmit,
  handleDeleteSubcategory,
  handleEditSubcategoryClick,
  handleAddSubcategoryClick,
  selectedCategoryIds,
  setSelectedCategoryIds,
  selectedSubcategoryIds,
  setSelectedSubcategoryIds,
  selectedSkillIds,
  setSelectedSkillIds,
  handleBulkDeleteCategories,
  handleBulkDeleteSubcategories,
  handleBulkDeleteSkills,
  skillsList,
  isSkillModalOpen,
  setIsSkillModalOpen,
  skillModalMode,
  skillFormName,
  setSkillFormName,
  skillFormSubcategoryId,
  setSkillFormSubcategoryId,
  skillFormStatus,
  setSkillFormStatus,
  skillFormError,
  skillFormLoading,
  handleSkillSubmit,
  handleDeleteSkill,
  handleEditSkillClick,
  handleAddSkillClick
}: TaxonomiesTabProps) {
  const { t } = useLanguage();
  const [cleaning, setCleaning] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [uploadingVideo, setUploadingVideo] = React.useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Instant local image preview
    try {
      const localUrl = URL.createObjectURL(file);
      setCategoryFormImage(localUrl);
    } catch (e) {}

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
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
      setCategoryFormImage(data.url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingVideo(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
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
      setCategoryFormVideo(data.url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not upload video.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCleanDb = async () => {
    if (!window.confirm(t("admin_cleanup_confirm_msg", "WARNING: This will permanently delete all Gig Orders, Contracts, and Wallet Transactions, and reset all wallet balances to $0.00. Are you sure you want to proceed?"))) {
      return;
    }
    setCleaning(true);
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/clean-data`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        alert(t("admin_cleanup_success_msg", "Database cleaned successfully and all wallet balances reset to $0.00!"));
      } else {
        const err = await res.json();
        alert(err.message || t("admin_cleanup_fail_msg", "Failed to clean database."));
      }
    } catch (e) {
      console.error(e);
      alert(t("admin_cleanup_network_error_msg", "Network error cleaning database."));
    } finally {
      setCleaning(false);
    }
  };

  const resolveCategoryImageUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const baseUrl = API_URL.replace(/\/api$/, "");
    return `${baseUrl}/${url.replace(/^\/?/, "")}`;
  };

  const categoryColumns = [
    {
      header: t("s_no", "S.No"),
      accessor: (row: Category, idx: number) => ((categoriesPage - 1) * itemsPerPage) + idx + 1
    },
    { 
      header: t("category", "Category"), 
      accessor: (row: Category) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            {row.category_image ? (
              <img src={resolveCategoryImageUrl(row.category_image)} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="text-[9px] font-black text-slate-400">{t("no_image", "No Image")}</div>
            )}
          </div>
          <span className="font-bold text-slate-800 text-xs">{row.category_name || row.name || ""}</span>
        </div>
      )
    },
    {
      header: t("description", "Description"),
      accessor: (row: Category) => (
        <span className="text-[11px] text-slate-500 line-clamp-2 max-w-xs block leading-relaxed py-1">
          {row.description || "-"}
        </span>
      )
    },
    { 
      header: t("status_label", "Status"), 
      accessor: (row: Category) => {
        const isActive = row.status === true || row.status === 1 || String(row.status).toLowerCase() === "active" || String(row.status).toLowerCase() === "true";
        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            isActive 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}>
            {isActive ? t("status_active", "Active") : t("status_inactive", "Inactive")}
          </span>
        );
      }
    },
    { 
      header: t("created_date", "Created Date"), 
      accessor: (row: Category) => {
        const val = row.createdAt || row.created_at || "";
        return val ? new Date(val).toLocaleDateString() : "-";
      }
    },
    {
      header: t("actions", "Actions"),
      accessor: (row: Category) => (
        <div className="flex items-center justify-center gap-2 select-none">
          <button
            onClick={() => handleEditCategoryClick(row)}
            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200/60 rounded-lg cursor-pointer transition-colors bg-white"
          >
            {t("edit", "Edit")}
          </button>
          <button
            onClick={() => handleDeleteCategory(row.id || row.category_id || "")}
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg cursor-pointer transition-colors bg-white"
          >
            {t("delete", "Delete")}
          </button>
        </div>
      )
    }
  ];

  const subcategoryColumns = [
    {
      header: t("s_no", "S.No"),
      accessor: (row: Subcategory, idx: number) => ((subcategoriesPage - 1) * itemsPerPage) + idx + 1
    },
    { 
      header: t("subcategory_name_label", "Subcategory Name"), 
      accessor: (row: Subcategory) => row.sub_category_name || row.name || ""
    },
    { 
      header: t("parent_category", "Parent Category"), 
      accessor: (row: Subcategory) => row.category_name || row.categoryName || ""
    },
    { 
      header: t("status_label", "Status"), 
      accessor: (row: Subcategory) => {
        const isActive = row.status === true || row.status === 1 || String(row.status).toLowerCase() === "active" || String(row.status).toLowerCase() === "true";
        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            isActive 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}>
            {isActive ? t("status_active", "Active") : t("status_inactive", "Inactive")}
          </span>
        );
      }
    },
    { 
      header: t("created_date", "Created Date"), 
      accessor: (row: Subcategory) => {
        const val = row.createdAt || row.created_at || "";
        return val ? new Date(val).toLocaleDateString() : "-";
      }
    },
    {
      header: t("actions", "Actions"),
      accessor: (row: Subcategory) => (
        <div className="flex items-center justify-center gap-2 select-none">
          <button
            onClick={() => handleEditSubcategoryClick(row)}
            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200/60 rounded-lg cursor-pointer transition-colors bg-white"
          >
            {t("edit", "Edit")}
          </button>
          <button
            onClick={() => handleDeleteSubcategory(row.sub_category_id || row.id || "")}
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg cursor-pointer transition-colors bg-white"
          >
            {t("delete", "Delete")}
          </button>
        </div>
      )
    }
  ];

  const skillColumns = [
    {
      header: t("s_no", "S.No"),
      accessor: (row: Skill, idx: number) => ((skillsPage - 1) * itemsPerPage) + idx + 1
    },
    { 
      header: t("skill_name_label", "Skill Name"), 
      accessor: (row: Skill) => row.skill_name || row.name || ""
    },
    { 
      header: t("parent_subcategory", "Parent Subcategory"), 
      accessor: (row: Skill) => row.sub_category_name || row.subcategoryName || ""
    },
    { 
      header: t("status_label", "Status"), 
      accessor: (row: Skill) => {
        const isActive = row.status === true || row.status === 1 || String(row.status).toLowerCase() === "active" || String(row.status).toLowerCase() === "true";
        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            isActive 
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" 
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}>
            {isActive ? t("status_active", "Active") : t("status_inactive", "Inactive")}
          </span>
        );
      }
    },
    { 
      header: t("created_date", "Created Date"), 
      accessor: (row: Skill) => {
        const val = row.createdAt || row.created_at || "";
        return val ? new Date(val).toLocaleDateString() : "-";
      }
    },
    {
      header: t("actions", "Actions"),
      accessor: (row: Skill) => (
        <div className="flex items-center justify-center gap-2 select-none">
          <button
            onClick={() => handleEditSkillClick(row)}
            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200/60 rounded-lg cursor-pointer transition-colors bg-white"
          >
            {t("edit", "Edit")}
          </button>
          <button
            onClick={() => handleDeleteSkill(row.skill_id || row.id || "")}
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg cursor-pointer transition-colors bg-white"
          >
            {t("delete", "Delete")}
          </button>
        </div>
      )
    }
  ];

  const tabName = categoriesSubTab as string;
  const isLangOrCurr = tabName === "languages" || tabName === "currencies";

  if (tabName === "cleanup") {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm flex flex-col gap-6 animate-fadeIn text-left rtl:text-right">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">{t("admin_cleanup_title", "Database Cleanup & Reset")}</h3>
          <p className="text-slate-505 dark:text-slate-300 text-xs sm:text-sm mt-0.5">
            {t("admin_cleanup_subtitle", "Reset transaction and order data. The following database table records will be permanently deleted:")}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-4">
          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{t("admin_cleanup_affected_tables", "Affected Tables")}</h4>
          <ul className="list-disc pl-5 rtl:pl-0 rtl:pr-5 text-xs text-slate-700 dark:text-white font-medium space-y-2.5 leading-relaxed">
            <li>
              <strong className="text-slate-900 dark:text-white">{t("admin_cleanup_gigs_skills", "Gigs & Skills")} (<code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">gigs</code>, <code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">gig_skills</code>)</strong>:
              <span className="dark:text-white"> {t("admin_cleanup_gigs_skills_desc", "Deletes all listed freelancer services and skill associations.")}</span>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">{t("admin_cleanup_jobs_proposals", "Jobs & Bid Proposals")} (<code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">jobs</code>, <code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">proposals</code>)</strong>:
              <span className="dark:text-white"> {t("admin_cleanup_jobs_proposals_desc", "Deletes all client-posted custom jobs and developer bid proposals.")}</span>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">{t("admin_cleanup_gig_apps_orders", "Gig Applications & Orders")} (<code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">gig_applications</code>)</strong>:
              <span className="dark:text-white"> {t("admin_cleanup_gig_apps_orders_desc", "Deletes all client applications and active/completed gig orders.")}</span>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">{t("admin_cleanup_contracts", "Contracts")} (<code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">contracts</code>)</strong>:
              <span className="dark:text-white"> {t("admin_cleanup_contracts_desc", "Deletes all escrow contracts, milestones progress, and project history.")}</span>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">{t("admin_cleanup_wallets_tx", "Wallet Transactions & Withdrawals")} (<code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">wallet_transactions</code>, <code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">withdrawal_requests</code>)</strong>:
              <span className="dark:text-slate-200"> {t("admin_cleanup_wallets_tx_desc", "Deletes all transfer logs, deposit records, and withdrawal requests.")}</span>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">{t("admin_cleanup_wallets", "User & Escrow Wallets")} (<code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">wallets</code>)</strong>:
              <span className="dark:text-white"> {t("admin_cleanup_wallets_desc", "Resets all client, freelancer, and system wallets back to an initial balance of ")}</span><code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">$0.00</code>.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">{t("admin_cleanup_messages", "Messages & Conversations")} (<code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">messages</code>, <code className="bg-slate-200/70 dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300/40 dark:border-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">conversations</code>)</strong>:
              <span className="dark:text-white"> {t("admin_cleanup_messages_desc", "Deletes all chat messages and workspace communication channels.")}</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <button
            onClick={handleCleanDb}
            disabled={cleaning}
            className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-rose-600/10 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            {cleaning ? t("admin_cleanup_cleaning", "Cleaning Database...") : t("admin_cleanup_delete_btn", "Delete All Orders & Transactions Data ✓")}
          </button>
        </div>
      </div>
    );
  }  return (
    <div className={`flex flex-col gap-6 animate-fadeIn text-left rtl:text-right ${
      isLangOrCurr
        ? ""
        : "bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
    }`}>
      
      {/* Main Tab Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {isLangOrCurr ? t("admin_taxonomies_languages_currencies", "Taxonomies, Languages & Currencies") : t("admin_categories_skills_management", "Categories & Skills Management")}
          </h3>
          <p className="text-slate-505 text-xs sm:text-sm mt-0.5">
            {isLangOrCurr 
              ? t("admin_taxonomies_languages_currencies_desc", "Configure supported site languages, dictionary translation keys, and platform currencies.") 
              : t("admin_categories_skills_management_desc", "Configure developer categories, nested subcategories, and searchable technical skills.")}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 select-none justify-center">
          {categoriesSubTab === "categories" && selectedCategoryIds.length > 0 && (
            <button
              onClick={handleBulkDeleteCategories}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 border border-rose-200/60 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-rose-600/10 flex items-center gap-2 animate-fadeIn"
            >
              {t("delete_selected", "Delete Selected")} ({selectedCategoryIds.length})
            </button>
          )}
          {categoriesSubTab === "subcategories" && selectedSubcategoryIds.length > 0 && (
            <button
              onClick={handleBulkDeleteSubcategories}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 border border-rose-200/60 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-rose-600/10 flex items-center gap-2 animate-fadeIn"
            >
              {t("delete_selected", "Delete Selected")} ({selectedSubcategoryIds.length})
            </button>
          )}
          {categoriesSubTab === "skills" && selectedSkillIds.length > 0 && (
            <button
              onClick={handleBulkDeleteSkills}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 border border-rose-200/60 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-rose-600/10 flex items-center gap-2 animate-fadeIn"
            >
              {t("delete_selected", "Delete Selected")} ({selectedSkillIds.length})
            </button>
          )}
          {(categoriesSubTab === "categories" || categoriesSubTab === "subcategories" || categoriesSubTab === "skills") && (
            <button
              onClick={() => {
                if (categoriesSubTab === "categories") {
                  handleAddCategoryClick();
                } else if (categoriesSubTab === "subcategories") {
                  handleAddSubcategoryClick();
                } else {
                  handleAddSkillClick();
                }
              }}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 border border-teal-700/20 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md shadow-teal-700/10 flex items-center gap-2"
            >
              {categoriesSubTab === "categories" ? t("add_category", "Add Category") : categoriesSubTab === "subcategories" ? t("add_subcategory", "Add Subcategory") : t("add_skill", "Add Skill")}
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs switch and Search bar row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-2">
        
        {/* Sub-tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 select-none flex-wrap gap-1">
          {!isLangOrCurr ? (
            <>
              <button
                onClick={() => setCategoriesSubTab("categories")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoriesSubTab === "categories" 
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-850"
                }`}
              >
                {t("categories", "Categories")}
              </button>
              <button
                onClick={() => setCategoriesSubTab("subcategories")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoriesSubTab === "subcategories" 
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
                    : "text-slate-505 hover:text-slate-850"
                }`}
              >
                {t("subcategories", "Subcategories")}
              </button>
              <button
                onClick={() => setCategoriesSubTab("skills")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoriesSubTab === "skills" 
                    ? "bg-white text-slate-850 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-805"
                }`}
              >
                {t("skills", "Skills")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCategoriesSubTab("languages")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoriesSubTab === "languages" 
                    ? "bg-white text-slate-850 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-805"
                }`}
              >
                {t("language", "Language")}
              </button>
              <button
                onClick={() => setCategoriesSubTab("currencies")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  categoriesSubTab === "currencies" 
                    ? "bg-white text-slate-850 shadow-sm border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-805"
                }`}
              >
                {t("currency", "Currency")}
              </button>
            </>
          )}
        </div>

        {/* Search Bar */}
        {(categoriesSubTab === "categories" || categoriesSubTab === "subcategories" || categoriesSubTab === "skills") && (
          <div className="w-full md:w-64 relative">
            <input
              type="text"
              placeholder={
                categoriesSubTab === "categories" ? t("search_categories_placeholder", "Search categories...") :
                categoriesSubTab === "subcategories" ? t("search_subcategories_placeholder", "Search subcategories...") :
                t("search_skills_placeholder", "Search skills...")
              }
              value={categoriesSearch}
              onChange={(e) => setCategoriesSearch(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Paginated Table render */}
      {categoriesSubTab === "categories" && (
        <Table
          columns={categoryColumns}
          data={paginatedCategories}
          currentPage={categoriesPage}
          totalPages={totalCategoriesPages}
          onPageChange={setCategoriesPage}
          totalItems={filteredCategories.length}
          itemsPerPage={itemsPerPage}
          emptyMessage="No matching categories found."
          selectedIds={selectedCategoryIds}
          onSelectionChange={setSelectedCategoryIds}
          getRowId={(row) => row.id || row.category_id || ""}
        />
      )}

      {categoriesSubTab === "subcategories" && (
        <Table
          columns={subcategoryColumns}
          data={paginatedSubcategories}
          currentPage={subcategoriesPage}
          totalPages={totalSubcategoriesPages}
          onPageChange={setSubcategoriesPage}
          totalItems={filteredSubcategories.length}
          itemsPerPage={itemsPerPage}
          emptyMessage="No matching subcategories found."
          selectedIds={selectedSubcategoryIds}
          onSelectionChange={setSelectedSubcategoryIds}
          getRowId={(row) => row.sub_category_id || row.id || ""}
        />
      )}

      {categoriesSubTab === "skills" && (
        <Table
          columns={skillColumns}
          data={paginatedSkills}
          currentPage={skillsPage}
          totalPages={totalSkillsPages}
          onPageChange={setSkillsPage}
          totalItems={filteredSkills.length}
          itemsPerPage={itemsPerPage}
          emptyMessage="No matching skills found."
          selectedIds={selectedSkillIds}
          onSelectionChange={setSelectedSkillIds}
          getRowId={(row) => row.skill_id || row.id || ""}
        />
      )}

      {categoriesSubTab === "languages" && (
        <LanguagesCurrenciesTab forceTab="languages" />
      )}

      {categoriesSubTab === "currencies" && (
        <LanguagesCurrenciesTab forceTab="currencies" />
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/25 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col p-6 sm:p-8 animate-fadeIn text-slate-800">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-6 right-6 z-20 text-slate-500 hover:text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200/80 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border-0"
            >
              Cancel
            </button>
            <div className="relative z-10 flex-grow flex flex-col justify-center py-4">
              <h3 className="text-xl font-black text-slate-850 leading-tight">
                {categoryModalMode === "create" ? "Create Category" : "Edit Category"}
              </h3>
              <p className="text-slate-450 text-xs mt-1">Configure name and active toggle state.</p>

              <form onSubmit={handleCategorySubmit} className="flex flex-col gap-4 mt-6">
                {categoryFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl">
                    ❌ {categoryFormError}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category Name</label>
                  <input
                    type="text"
                    required
                    value={categoryFormName}
                    onChange={(e) => setCategoryFormName(e.target.value)}
                    placeholder="e.g. Graphic Designing"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={2}
                    value={categoryFormDescription}
                    onChange={(e) => setCategoryFormDescription(e.target.value)}
                    placeholder="Brief description of services in this category..."
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category Cover Image</label>
                  {!categoryFormImage ? (
                    <div className="flex items-center gap-3">
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-350 hover:border-slate-450 text-slate-650 rounded-xl text-xs font-bold cursor-pointer transition-all">
                        <FiUpload className="w-4 h-4 text-slate-450" />
                        <span>{uploadingImage ? "Uploading Image..." : "Select Cover Image to Upload"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative p-2 flex flex-col gap-1.5 animate-fadeIn">
                      <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                        <img 
                          src={
                            categoryFormImage.startsWith("http://") || 
                            categoryFormImage.startsWith("https://") || 
                            categoryFormImage.startsWith("blob:") || 
                            categoryFormImage.startsWith("data:")
                              ? categoryFormImage 
                              : `${API_URL.replace("/api", "")}${categoryFormImage.startsWith("/") ? categoryFormImage : `/${categoryFormImage}`}`
                          } 
                          className="w-full h-full object-cover" 
                          alt="Category Cover Preview" 
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setCategoryFormImage("")}
                          className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all shadow-md flex items-center gap-1 border-0"
                        >
                          <span>✕ Remove Image</span>
                        </button>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 truncate px-1">
                        Preview URL: {categoryFormImage}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Status</label>
                  <CustomSelect
                    options={[
                      { value: "Active", label: "Active catalog item" },
                      { value: "Inactive", label: "Hidden / Inactive" }
                    ]}
                    value={categoryFormStatus}
                    onChange={(val) => setCategoryFormStatus(val as "Active" | "Inactive")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={categoryFormLoading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-705/10 border-0"
                >
                  {categoryFormLoading ? "Saving..." : "Save Category"}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Subcategory Modal */}
      {isSubcategoryModalOpen && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/25 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col p-6 sm:p-8 animate-fadeIn text-slate-800">
            <button
              onClick={() => setIsSubcategoryModalOpen(false)}
              className="absolute top-6 right-6 z-20 text-slate-500 hover:text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200/80 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border-0"
            >
              Cancel
            </button>
            <div className="relative z-10 flex-grow flex flex-col justify-center py-4">
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                {subcategoryModalMode === "create" ? "Create Subcategory" : "Edit Subcategory"}
              </h3>
              <p className="text-slate-500 text-xs mt-1">Configure parent categories and nested names.</p>

              <form onSubmit={handleSubcategorySubmit} className="flex flex-col gap-4 mt-6">
                {subcategoryFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl">
                    ❌ {subcategoryFormError}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parent Category</label>
                  <CustomSelect
                    options={categoriesList.map((cat) => ({
                      value: String(cat.id || cat.category_id || ""),
                      label: cat.category_name || cat.name || ""
                    }))}
                    value={subcategoryFormCategoryId}
                    onChange={(val) => setSubcategoryFormCategoryId(val as string)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subcategory Name</label>
                  <input
                    type="text"
                    required
                    value={subcategoryFormName}
                    onChange={(e) => setSubcategoryFormName(e.target.value)}
                    placeholder="e.g. Logos & Branding"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Status</label>
                  <CustomSelect
                    options={[
                      { value: "Active", label: "Active catalog item" },
                      { value: "Inactive", label: "Hidden / Inactive" }
                    ]}
                    value={subcategoryFormStatus}
                    onChange={(val) => setSubcategoryFormStatus(val as "Active" | "Inactive")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={subcategoryFormLoading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-xl transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-700/10 border-0"
                >
                  {subcategoryFormLoading ? "Saving..." : "Save Subcategory"}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Skill Modal */}
      {isSkillModalOpen && mounted && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/25 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col p-6 sm:p-8 animate-fadeIn text-slate-800">
            <button
              onClick={() => setIsSkillModalOpen(false)}
              className="absolute top-6 right-6 z-20 text-slate-500 hover:text-slate-700 font-bold text-xs bg-slate-100 hover:bg-slate-200/80 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border-0"
            >
              Cancel
            </button>
            <div className="relative z-10 flex-grow flex flex-col justify-center py-4">
              <h3 className="text-xl font-black text-slate-800 leading-tight">
                {skillModalMode === "create" ? "Create Skill Tag" : "Edit Skill Tag"}
              </h3>
              <p className="text-slate-500 text-xs mt-1">Configure parent subcategories and skill terms.</p>

              <form onSubmit={handleSkillSubmit} className="flex flex-col gap-4 mt-6">
                {skillFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl">
                    ❌ {skillFormError}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parent Subcategory</label>
                  <CustomSelect
                    options={subcategoriesList.map((sub) => ({
                      value: String(sub.sub_category_id || sub.id || ""),
                      label: `${sub.sub_category_name || sub.name || ""} (${sub.category_name || sub.categoryName || ""})`
                    }))}
                    value={skillFormSubcategoryId}
                    onChange={(val) => setSkillFormSubcategoryId(val as string)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skill Name</label>
                  <input
                    type="text"
                    required
                    value={skillFormName}
                    onChange={(e) => setSkillFormName(e.target.value.replace(/\d{3,}/g, ""))}
                    placeholder="e.g. Adobe Illustrator"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Status</label>
                  <CustomSelect
                    options={[
                      { value: "Active", label: "Active catalog item" },
                      { value: "Inactive", label: "Hidden / Inactive" }
                    ]}
                    value={skillFormStatus}
                    onChange={(val) => setSkillFormStatus(val as "Active" | "Inactive")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={skillFormLoading}
                  className="w-full bg-teal-700 hover:bg-teal-850 text-white font-bold py-3 rounded-xl transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-700/10 border-0"
                >
                  {skillFormLoading ? "Saving..." : "Save Skill"}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
