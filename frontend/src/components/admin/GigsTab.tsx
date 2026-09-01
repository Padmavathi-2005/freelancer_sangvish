"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Table from "@/components/Table";
import { FiEye, FiEdit, FiTrash2, FiX, FiCheck, FiImage, FiPlus, FiExternalLink, FiUser, FiClock, FiRefreshCw, FiDollarSign } from "react-icons/fi";
import { API_BASE_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";

interface GigsTabProps {
  gigsSearch: string;
  setGigsSearch: (v: string) => void;
  paginatedGigs: any[];
  gigsPage: number;
  totalGigsPages: number;
  setGigsPage: (page: number) => void;
  filteredGigs: any[];
  itemsPerPage: number;
  handleUpdateGigStatus: (gigId: number, status: string) => Promise<void>;
  handleUpdateGigByAdmin?: (gigId: number, updatedData: any) => Promise<boolean>;
  handleDeleteGig: (gigId: number) => Promise<void>;
  categoriesList?: any[];
}

export default function GigsTab({
  gigsSearch,
  setGigsSearch,
  paginatedGigs,
  gigsPage,
  totalGigsPages,
  setGigsPage,
  filteredGigs,
  itemsPerPage,
  handleUpdateGigStatus,
  handleUpdateGigByAdmin,
  handleDeleteGig,
  categoriesList = []
}: GigsTabProps) {
  const { t } = useLanguage();
  // Modal states
  const [selectedViewGig, setSelectedViewGig] = useState<any | null>(null);
  const [selectedEditGig, setSelectedEditGig] = useState<any | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState("");

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    delivery_days: "",
    revisions: "",
    category_id: "",
    status: "Active",
    cover_image: "",
    images: [] as string[],
    description: ""
  });
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Helper to parse images array/json
  const parseImages = (imagesVal: any): string[] => {
    if (!imagesVal) return [];
    if (Array.isArray(imagesVal)) return imagesVal.filter(Boolean);
    if (typeof imagesVal === "string") {
      try {
        const parsed = JSON.parse(imagesVal);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
        if (imagesVal.startsWith("http") || imagesVal.startsWith("/")) {
          return [imagesVal];
        }
      }
    }
    return [];
  };

  // Helper to resolve full image URL
  const resolveImgUrl = (url: string) => {
    if (!url) return "/placeholder-gig.jpg";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const cleanPath = url.startsWith("/") ? url : "/" + url;
    return `${API_BASE_URL.replace(/\/api\/?$/, "")}${cleanPath}`;
  };

  // Helper to parse plans JSON
  const parsePlans = (plansVal: any): any => {
    if (!plansVal) return null;
    if (typeof plansVal === "object") return plansVal;
    if (typeof plansVal === "string") {
      try {
        return JSON.parse(plansVal);
      } catch (e) {
        return null;
      }
    }
    return null;
  };
  const getGigCover = (row: any) => {
    const parsed = parseImages(row.images);
    if (row.cover_image && typeof row.cover_image === "string" && row.cover_image.trim()) {
      return resolveImgUrl(row.cover_image);
    }
    if (parsed.length > 0 && parsed[0]) {
      return resolveImgUrl(parsed[0]);
    }
    const titleLower = (row.title || "").toLowerCase();
    if (titleLower.includes("ai") || titleLower.includes("bot") || titleLower.includes("chat")) {
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
    }
    if (titleLower.includes("brand") || titleLower.includes("logo") || titleLower.includes("identity")) {
      return "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&auto=format&fit=crop&q=80";
    }
    if (titleLower.includes("figma") || titleLower.includes("ui") || titleLower.includes("ux")) {
      return "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80";
    }
    if (titleLower.includes("full stack") || titleLower.includes("next") || titleLower.includes("code") || titleLower.includes("dev")) {
      return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80";
    }
    const fallbacks = [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80"
    ];
    return fallbacks[(row.gig_id || 0) % fallbacks.length];
  };

  // Open Edit Modal
  const openEditModal = (gig: any) => {
    setSelectedViewGig(null);
    setSelectedEditGig(gig);
    setEditSuccessMsg("");
    setEditForm({
      title: gig.title || "",
      price: gig.price ? String(gig.price) : "",
      delivery_days: gig.delivery_days ? String(gig.delivery_days) : "",
      revisions: gig.revisions ? String(gig.revisions) : "",
      category_id: gig.category_id ? String(gig.category_id) : "",
      status: gig.status || "Active",
      cover_image: gig.cover_image || "",
      images: parseImages(gig.images),
      description: gig.description || ""
    });
  };

  // Handle Edit Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditGig || !handleUpdateGigByAdmin) return;

    setSavingEdit(true);
    setEditSuccessMsg("");

    const success = await handleUpdateGigByAdmin(selectedEditGig.gig_id, editForm);
    setSavingEdit(false);

    if (success) {
      setEditSuccessMsg("Gig details updated successfully!");
      setTimeout(() => {
        setSelectedEditGig(null);
        setEditSuccessMsg("");
      }, 1200);
    }
  };

  // Cover image file upload handler
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setEditForm(prev => ({ ...prev, cover_image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Add gallery URL
  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setEditForm(prev => ({
      ...prev,
      images: [...prev.images, newGalleryUrl.trim()]
    }));
    setNewGalleryUrl("");
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const gigColumns = [
    {
      header: t("s_no", "S.No"),
      accessor: (row: any, idx: number) => ((gigsPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: t("admin_gig_listing_header", "Gig Listing"),
      accessor: (row: any) => {
        const coverSrc = getGigCover(row);
        return (
          <div className="flex items-center gap-3 py-1 text-left rtl:text-right">
            <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0 border border-slate-200 dark:border-zinc-700 shadow-xs">
              <img
                src={coverSrc}
                alt={row.title}
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&q=80";
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs truncate max-w-[220px]" title={row.title}>
                {row.title}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium truncate">
                ID: #{row.gig_id} {row.slug ? `• /${row.slug}` : ""}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: t("freelancer", "Freelancer"),
      accessor: (row: any) => (
        <div className="flex items-center gap-2 text-left rtl:text-right">
          {row.freelancer_image ? (
            <img src={resolveImgUrl(row.freelancer_image)} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold shrink-0">
              {row.freelancer_name?.charAt(0) || "F"}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">
            {row.freelancer_name || t("unknown", "Unknown")}
          </span>
        </div>
      )
    },
    {
      header: t("category", "Category"),
      accessor: (row: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
          {row.category_name || row.sub_category_name || t("uncategorized", "Uncategorized")}
        </span>
      )
    },
    {
      header: t("price", "Price"),
      accessor: (row: any) => (
        <span className="font-extrabold text-teal-700 dark:text-teal-400 text-xs">
          ${Number(row.price).toLocaleString()}
        </span>
      )
    },
    {
      header: t("status_label", "Status"),
      accessor: (row: any) => {
        const isAct = row.status?.toLowerCase() === "active";
        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            isAct ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {isAct ? t("status_active", "Active") : t("status_inactive", "Inactive")}
          </span>
        );
      }
    },
    {
      header: t("actions", "Actions"),
      accessor: (row: any) => (
        <div className="flex items-center justify-center gap-1.5 select-none">
          {/* View Details */}
          <button
            onClick={() => { setSelectedViewGig(row); setActiveGalleryIndex(0); }}
            title={t("view_details", "View Details")}
            className="p-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg cursor-pointer transition-colors bg-white dark:bg-zinc-900"
          >
            <FiEye className="w-3.5 h-3.5 text-teal-600" />
          </button>

          {/* Edit Gig */}
          <button
            onClick={() => openEditModal(row)}
            title={t("edit_gig_details", "Edit Gig Details")}
            className="p-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg cursor-pointer transition-colors bg-white dark:bg-zinc-900"
          >
            <FiEdit className="w-3.5 h-3.5 text-indigo-600" />
          </button>

          {/* Toggle Status */}
          <button
            onClick={() => handleUpdateGigStatus(row.gig_id, row.status?.toLowerCase() === "active" ? "Inactive" : "Active")}
            className="px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg cursor-pointer transition-colors bg-white dark:bg-zinc-900"
          >
            {row.status?.toLowerCase() === "active" ? t("deactivate", "Deactivate") : t("activate", "Activate")}
          </button>

          {/* Delete */}
          <button
            onClick={() => handleDeleteGig(row.gig_id)}
            title={t("delete", "Delete")}
            className="p-1.5 text-xs font-bold text-rose-605 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-colors bg-white dark:bg-zinc-900"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xs animate-fadeIn text-left rtl:text-right">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">{t("admin_gig_listings_management", "Gig Listings Management")}</h3>
        <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
          {t("admin_gig_listings_management_desc", "View full details, gallery images, edit gig parameters, and manage active service offerings.")}
        </p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={t("admin_search_gigs_placeholder", "Search by gig title, freelancer, category...")}
            value={gigsSearch}
            onChange={(e) => setGigsSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600 transition-all duration-200"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <Table
        columns={gigColumns}
        data={paginatedGigs}
        currentPage={gigsPage}
        totalPages={totalGigsPages}
        onPageChange={setGigsPage}
        totalItems={filteredGigs.length}
        itemsPerPage={itemsPerPage}
        emptyMessage={t("admin_no_gigs_found", "No service gig listings found.")}
      />

      {/* ========================================================================= */}
      {/* 1. VIEW GIG DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedViewGig && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between gap-4 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-900/50">
                    {selectedViewGig.category_name || "Service Gig"}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedViewGig.status?.toLowerCase() === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {selectedViewGig.status || "Active"}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">ID: #{selectedViewGig.gig_id}</span>
                </div>
                <h2 className="text-lg font-black text-slate-850 dark:text-zinc-100 leading-snug">
                  {selectedViewGig.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedViewGig(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-6">

              {/* Freelancer & Quick Info Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60">
                <div className="flex items-center gap-3">
                  {selectedViewGig.freelancer_image ? (
                    <img src={resolveImgUrl(selectedViewGig.freelancer_image)} alt="" className="w-10 h-10 rounded-full object-cover border border-teal-500" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedViewGig.freelancer_name?.charAt(0) || "F"}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {selectedViewGig.freelancer_name || "Unknown Seller"}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {selectedViewGig.freelancer_email || "Freelancer Account"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <FiDollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Price: <strong className="text-slate-900 dark:text-white font-extrabold">${selectedViewGig.price}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <FiClock className="w-4 h-4 text-amber-500" />
                    <span>Delivery: <strong className="text-slate-900 dark:text-white font-extrabold">{selectedViewGig.delivery_days || 3} Days</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <FiRefreshCw className="w-4 h-4 text-indigo-500" />
                    <span>Revisions: <strong className="text-slate-900 dark:text-white font-extrabold">{selectedViewGig.revisions || "Unlimited"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Gallery Images Showcase */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                  <FiImage className="w-4 h-4 text-teal-600" />
                  <span>Gig Cover & Portfolio Gallery Images</span>
                </h4>

                {(() => {
                  const allImages = [
                    ...(selectedViewGig.cover_image ? [selectedViewGig.cover_image] : []),
                    ...parseImages(selectedViewGig.images)
                  ];
                  let uniqueImgs = Array.from(new Set(allImages)).filter(Boolean);
                  if (uniqueImgs.length === 0) {
                    uniqueImgs = [getGigCover(selectedViewGig)];
                  }

                  if (uniqueImgs.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 text-xs text-slate-400">
                        No portfolio gallery images uploaded for this gig.
                      </div>
                    );
                  }

                  const activeImg = uniqueImgs[activeGalleryIndex] || uniqueImgs[0];

                  return (
                    <div className="space-y-3">
                      {/* Main Active Image Display */}
                      <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-900 relative border border-slate-200 dark:border-zinc-800 shadow-md group">
                        <img
                          src={resolveImgUrl(activeImg)}
                          alt="Main Preview"
                          className="w-full h-full object-contain bg-slate-950/80"
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80";
                          }}
                        />
                        <a
                          href={resolveImgUrl(activeImg)}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute top-3 right-3 p-2 bg-slate-900/80 text-white rounded-xl hover:bg-teal-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Open Full Image"
                        >
                          <FiExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Thumbnails Row */}
                      {uniqueImgs.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                          {uniqueImgs.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveGalleryIndex(idx)}
                              className={`w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                activeGalleryIndex === idx
                                  ? "border-teal-600 ring-2 ring-teal-500/30 scale-105"
                                  : "border-slate-200 dark:border-zinc-700 opacity-60 hover:opacity-100"
                              }`}
                            >
                              <img src={resolveImgUrl(img)} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                  Gig Overview & Description
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-700/60 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {selectedViewGig.description || "No description specified for this gig listing."}
                </div>
              </div>

              {/* Pricing Packages (If plans JSON exists) */}
              {(() => {
                const plans = parsePlans(selectedViewGig.plans);
                if (!plans) return null;

                return (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                      Tiered Pricing Packages (Basic / Standard / Premium)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["basic", "standard", "premium"].map((tierKey) => {
                        const tier = plans[tierKey];
                        if (!tier) return null;
                        return (
                          <div key={tierKey} className="p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-xs flex flex-col justify-between space-y-3">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                                {tierKey} Tier
                              </span>
                              <h5 className="font-bold text-xs text-slate-800 dark:text-zinc-100">{tier.name || tier.title || tierKey}</h5>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">{tier.description || "Service package tier"}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-zinc-100">
                              <span className="text-teal-600 dark:text-teal-400">${tier.price || selectedViewGig.price}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{tier.delivery_days || selectedViewGig.delivery_days || 3} Days Delivery</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
              <button
                onClick={() => setSelectedViewGig(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => openEditModal(selectedViewGig)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FiEdit className="w-3.5 h-3.5" />
                <span>Edit This Gig</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT GIG DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedEditGig && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">
                  Edit Gig Listings • #{selectedEditGig.gig_id}
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-400">
                  Modify gig title, category, pricing, delivery options, and gallery photo URLs.
                </p>
              </div>
              <button
                onClick={() => setSelectedEditGig(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              
              {editSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <FiCheck className="w-4 h-4 text-emerald-600" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Gig Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-semibold"
                />
              </div>

              {/* Price, Delivery Days, Revisions, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Base Price ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Delivery (Days)
                  </label>
                  <input
                    type="number"
                    value={editForm.delivery_days}
                    onChange={(e) => setEditForm({ ...editForm, delivery_days: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Revisions Count
                  </label>
                  <input
                    type="number"
                    value={editForm.revisions}
                    onChange={(e) => setEditForm({ ...editForm, revisions: e.target.value })}
                    placeholder="Unlimited (0)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600 font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Category Selection */}
              {categoriesList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    Category Assignment
                  </label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                  >
                    <option value="">Select Category...</option>
                    {categoriesList.map((cat: any) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cover Image Upload & URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Cover Image URL / File Upload
                </label>
                <div className="flex items-center gap-3">
                  {editForm.cover_image && (
                    <img
                      src={resolveImgUrl(editForm.cover_image)}
                      alt="Cover Preview"
                      className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="https://... or /public/..."
                    value={editForm.cover_image}
                    onChange={(e) => setEditForm({ ...editForm, cover_image: e.target.value })}
                    className="flex-grow bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                  />
                  <label className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer shrink-0">
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Gallery Images List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Portfolio Gallery Images ({editForm.images.length})
                </label>

                {/* Existing Gallery Thumbnails */}
                {editForm.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {editForm.images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 h-20 bg-slate-100 dark:bg-zinc-800">
                        <img src={resolveImgUrl(img)} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Remove Image"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new image URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter additional image URL..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    className="flex-grow bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="px-3 py-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Gig Overview Description
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3.5 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-600 leading-relaxed"
                />
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEditGig(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  {savingEdit ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
