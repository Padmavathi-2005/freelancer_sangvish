import { API_URL } from "@/config/api";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiBriefcase, FiAlertTriangle, FiCheckCircle, FiCheck, FiX, FiFileText, FiHeart } from "react-icons/fi";
import { FaWallet, FaStripe, FaPaypal } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface ExploreGigsTabProps {
  triggerToast: any;
  fetchClientApplications: () => Promise<void>;
}

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const ExploreGigsTab: React.FC<ExploreGigsTabProps> = ({ triggerToast, fetchClientApplications }) => {
  const router = useRouter();
  const [clientGigs, setClientGigs] = useState<any[]>([]);
  const [loadingClientGigs, setLoadingClientGigs] = useState(false);
  const [gigSearchQuery, setGigSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [gigSearchQuery]);

  // Wishlist state and handlers
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const uStr = localStorage.getItem("user");
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u && (u.user_id || u.id)) setCurrentUserId(Number(u.user_id || u.id));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("lancerflow_wishlist");
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse wishlist in ExploreGigsTab:", e);
      }
    }
  }, []);

  const isInWishlist = (gigId: number) => {
    return wishlist.some((item: any) => item.gig_id === gigId);
  };

  const handleToggleWishlist = async (gig: any) => {
    const isSaved = isInWishlist(gig.gig_id);
    let updated;
    const token = localStorage.getItem("token");

    if (isSaved) {
      updated = wishlist.filter((item: any) => item.gig_id !== gig.gig_id);
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist", JSON.stringify(updated));
      triggerToast("success", `Removed "${gig.title.substring(0, 20)}..." from Wishlist`);

      try {
        if (token) {
          await fetch(`${API_URL}/freelancer/client/gigs/${gig.gig_id}/wishlist`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action: "remove" })
          });
        }
      } catch (err) {
        console.error("Failed to sync wishlist removal:", err);
      }
    } else {
      updated = [...wishlist, gig];
      setWishlist(updated);
      localStorage.setItem("lancerflow_wishlist", JSON.stringify(updated));
      triggerToast("success", `Added "${gig.title.substring(0, 20)}..." to Wishlist`);

      try {
        if (token) {
          await fetch(`${API_URL}/freelancer/client/gigs/${gig.gig_id}/wishlist`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action: "add" })
          });
        }
      } catch (err) {
        console.error("Failed to sync wishlist addition:", err);
      }
    }
  };

  // Ordering flow states
  const [isApplying, setIsApplying] = useState(false);
  const [applyingGig, setApplyingGig] = useState<any | null>(null);
  const [orderRequirements, setOrderRequirements] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [previewRequirements, setPreviewRequirements] = useState(false);
  const [selectedGigForDetails, setSelectedGigForDetails] = useState<any | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [customProposedPrice, setCustomProposedPrice] = useState("");
  const [orderMilestones, setOrderMilestones] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [onboardingCheckLoading, setOnboardingCheckLoading] = useState(false);

  const handleOrderClick = async (gig: any) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setOnboardingCheckLoading(true);
      const res = await fetch(`${API_URL}/users/onboarding-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.hasClientProfile) {
          triggerToast("error", "You have not completed your client profile onboarding. Redirecting...");
          localStorage.setItem("user_role", "client");
          localStorage.setItem("onboarding_role", "client");
          setTimeout(() => {
            router.push("/dashboard");
            window.location.reload();
          }, 2000);
          return;
        }
        if (data.clientVettingStatus !== "Approved") {
          triggerToast("error", "Your client profile is pending administrator approval.");
          return;
        }
        
        // Proceed with order flow
        setApplyingGig(gig);
        setIsApplying(true);
        if (gig.payment_type === "milestone" && gig.milestones) {
          const ms = typeof gig.milestones === "string" ? JSON.parse(gig.milestones) : gig.milestones;
          if (Array.isArray(ms)) {
            setOrderMilestones(ms.map((m: any) => ({
              title: m.title,
              amount: m.amount.toString(),
              description: m.description || ""
            })));
          }
        } else {
          setOrderMilestones([]);
        }
      } else {
        triggerToast("error", "Failed to check profile status.");
      }
    } catch (err) {
      triggerToast("error", "Error checking profile status.");
    } finally {
      setOnboardingCheckLoading(false);
    }
  };

  const insertRequirementFormat = (tag: string) => {
    const textarea = document.getElementById("project-requirements-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    let replacement = "";
    if (tag === "bold") replacement = `<strong>${selected || "bold text"}</strong>`;
    else if (tag === "italic") replacement = `<em>${selected || "italic text"}</em>`;
    else if (tag === "bullet") replacement = `\n<ul>\n  <li>${selected || "bullet item"}</li>\n</ul>\n`;
    else if (tag === "heading") replacement = `<h3>${selected || "Heading"}</h3>`;
    
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setOrderRequirements(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
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

  const handleApplyGigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    setOrderSuccess(false);

    if (!orderRequirements.trim() || !applyingGig) {
      setOrderError("Please fill out your project requirements.");
      return;
    }

    try {
      setOrderSubmitting(true);
      const token = localStorage.getItem("token");

      let finalPrice = parseFloat(applyingGig.price);
      if (applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0) {
        finalPrice = finalPrice * (1 - parseFloat(applyingGig.discount_percent) / 100);
      }
      if (applyingGig.negotiation && customProposedPrice.trim()) {
        finalPrice = parseFloat(customProposedPrice.trim());
      }

      if (isNaN(finalPrice) || finalPrice <= 0) {
        setOrderError("Please enter a valid price greater than 0.");
        setOrderSubmitting(false);
        return;
      }


      // Payment is processed AFTER the freelancer accepts the order.
      // The client will be prompted to pay via Stripe/PayPal/Wallet in ClientOrdersTab.


      const res = await fetch(`${API_URL}/freelancer/client/gigs/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gig_id: applyingGig.gig_id,
          requirements: orderRequirements.trim(),
          price: finalPrice,
          currency_id: applyingGig.currency_id,
          milestones: orderMilestones
        })
      });

      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(true);
        setOrderRequirements("");
        setCustomProposedPrice("");
        setOrderMilestones([]);
        setPaymentMethod("wallet");
        triggerToast("success", "Service ordered successfully!");
        setTimeout(() => {
          setIsApplying(false);
          setApplyingGig(null);
          setOrderSuccess(false);
          fetchClientApplications(); // Synchronize orders
        }, 1500);
      } else {
        setOrderError(data.message || "Failed to order service.");
      }
    } catch (err: any) {
      setOrderError("Network error. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  useEffect(() => {
    fetchClientGigs();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catName = params.get("categoryName");
      const subCatName = params.get("subCategoryName");
      if (subCatName) {
        setGigSearchQuery(subCatName);
      } else if (catName) {
        setGigSearchQuery(catName);
      }
    }
  }, []);

  const filteredGigs = clientGigs.filter((g) => {
    if (!gigSearchQuery.trim()) return true;
    const q = gigSearchQuery.toLowerCase().trim();

    // Check if query is a day pattern like "3d", "3 days", "7d"
    const dayMatch = q.match(/^(\d+)\s*d(ays?)?$/i);
    if (dayMatch) {
      const targetDays = parseInt(dayMatch[1]);
      const gigDays = parseInt(g.delivery_days || 0);
      if (gigDays > 0 && gigDays <= targetDays) {
        return true;
      }
      const hasTitleMatch = g.title && new RegExp(`\\b${q}\\b`, "i").test(g.title);
      const hasSkillMatch = Array.isArray(g.skills) && g.skills.some((s: any) => {
        const str = typeof s === "object" && s !== null ? s.skill_name || s.name || "" : `${s}`;
        return new RegExp(`\\b${q}\\b`, "i").test(str);
      });
      return hasTitleMatch || hasSkillMatch;
    }

    const matchTitle = g.title?.toLowerCase().includes(q);
    const matchDesc = g.description ? (q.length <= 3 ? new RegExp(`\\b${q}\\b`, "i").test(g.description) : g.description.toLowerCase().includes(q)) : false;
    const matchCategory = g.category_name?.toLowerCase().includes(q);
    const matchSubCat = g.sub_category_name?.toLowerCase().includes(q);
    const matchFreelancer = (g.freelancer_name || g.seller_name || g.username || "")?.toLowerCase().includes(q);
    const matchPrice = g.price ? `${g.price}` === q || `$${g.price}` === q : false;
    const matchLevel = g.experience_level?.toLowerCase().includes(q);
    const matchSkills = Array.isArray(g.skills) && g.skills.some((s: any) => {
      const str = typeof s === "object" && s !== null ? s.skill_name || s.name || "" : `${s}`;
      return str.toLowerCase().includes(q);
    });

    return matchTitle || matchDesc || matchCategory || matchSubCat || matchFreelancer || matchPrice || matchLevel || matchSkills;
  });

  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(filteredGigs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGigs = filteredGigs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="relative z-10 flex flex-col gap-8 w-full animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
            <span>Explore Services</span>
          </h2>
          <p className="text-slate-404 text-xs mt-1 font-semibold">Browse packaged services and gigs published by elite freelancers.</p>
        </div>
        {/* Search Bar */}
        <div className="relative w-full sm:w-80 shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search gigs, skills, categories..."
            value={gigSearchQuery}
            onChange={(e) => setGigSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Grid */}
      {loadingClientGigs ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-emerald-500 border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-404 text-xs font-semibold">Loading available services...</p>
        </div>
      ) : filteredGigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-xl p-8 shadow-inner">
          <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
          </svg>
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">No services matched</h3>
          <p className="text-slate-404 text-xs max-w-sm font-semibold">Try modifying your query or category filter options.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedGigs.map((g) => (
            <div 
              key={g.gig_id} 
              onClick={() => {
                router.push(`/gigs/${g.slug || g.gig_id}`);
              }}
              className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden cursor-pointer group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
              
              {/* Wishlist Heart Toggle Button */}
              {!(currentUserId && (Number(g.user_id) === currentUserId || Number(g.freelancer_id) === currentUserId || Number(g.user?.user_id) === currentUserId)) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleWishlist(g);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-50/90 hover:bg-white shadow-md flex items-center justify-center border border-slate-200/50 transition-all z-20 cursor-pointer"
                  title="Save to wishlist"
                >
                  <FiHeart className={`w-4 h-4 transition-colors ${isInWishlist(g.gig_id) ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} />
                </button>
              )}

              <div>
                <div className="flex justify-between items-start gap-2 pr-10">
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded uppercase tracking-wider">
                    {g.category_name || "Service"}
                  </span>
                  {g.discount_percent && parseFloat(g.discount_percent) > 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wider mb-1">
                        {parseFloat(g.discount_percent)}% OFF
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 line-through">
                          {g.currency_symbol || "$"}{parseFloat(g.price).toLocaleString()}
                        </span>
                        <span className="text-xs font-black text-slate-800 bg-slate-100 border border-slate-200/50 px-2 py-1 rounded-lg">
                          {g.currency_symbol || "$"}{(parseFloat(g.price) * (1 - parseFloat(g.discount_percent) / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2 py-1 rounded-lg">
                      {g.payment_type === "milestone" ? (
                        <span className="text-primary font-bold">Milestones</span>
                      ) : (
                        g.min_price || g.max_price ? (
                          <span>
                            {g.currency_symbol || "$"}{parseFloat(g.min_price || "0").toLocaleString()} - {g.currency_symbol || "$"}{parseFloat(g.max_price || "0").toLocaleString()}
                          </span>
                        ) : (
                          <span>
                            {g.currency_symbol || "$"}{parseFloat(g.price || "0").toLocaleString()}
                          </span>
                        )
                      )}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-slate-855 mt-3 line-clamp-2">{g.title}</h3>
                <p className="text-slate-404 text-[10px] font-bold block mt-1 uppercase truncate">By {g.freelancer_name}</p>
                <p className="text-slate-500 text-xs mt-3.5 leading-relaxed font-medium line-clamp-3">{stripHtml(g.description)}</p>
                
                {/* Skills */}
                {g.skills && Array.isArray(g.skills) && g.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {g.skills.map((s: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/50 text-[9px] font-bold">
                        {s.skill_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <span className="text-slate-404 text-xxs font-semibold">Delivery: {g.delivery_days} days</span>
                <button
                  disabled={onboardingCheckLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOrderClick(g);
                  }}
                  className="text-[10px] font-bold text-white bg-primary hover:bg-primary-hover py-1.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {onboardingCheckLoading ? "Checking..." : "Order Service →"}
                </button>
              </div>
            </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredGigs.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm mt-6">
              <p className="text-slate-500 text-xs font-semibold">
                Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredGigs.length)}
                </span>{" "}
                of <span className="font-bold text-slate-800">{filteredGigs.length}</span> services
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-white hover:bg-slate-50 text-slate-650 border-slate-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 text-[11px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Gig Application Modal */}
      {isApplying && applyingGig && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative max-h-[95vh] flex flex-col">
            <button
              onClick={() => {
                setIsApplying(false);
                setApplyingGig(null);
                setOrderError("");
                setCustomProposedPrice("");
              }}
              className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-850 cursor-pointer"
            >
              Close
            </button>

            <div className="border-b border-slate-100 pb-4 pr-16">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1">Place Service Order</span>
              <h2 className="text-base font-black text-slate-855 line-clamp-1">{applyingGig.title}</h2>
              <p className="text-slate-405 text-xs font-semibold mt-1">Service provider: {applyingGig.freelancer_name}</p>
            </div>

            <form onSubmit={handleApplyGigSubmit} className="flex-grow flex flex-col overflow-hidden min-h-0">
              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-650 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 mt-5">
                  <FiAlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
              {orderSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-650 text-xs font-bold rounded-xl animate-pulse flex items-center gap-1.5 shrink-0 mt-5">
                  <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Order request submitted successfully!</span>
                </div>
              )}

              <div className="flex-grow overflow-y-auto my-4 flex flex-col gap-5 pr-1.5 min-h-0">
                {/* Price Details banner */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex justify-between items-center text-xs shrink-0">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">
                    {applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0 ? "Discounted Price" : "Fixed Package Price"}
                  </span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">
                    {applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0 ? (
                      <>
                        <span className="line-through text-slate-400 font-bold mr-1.5">
                          {applyingGig.currency_symbol || "$"}{parseFloat(applyingGig.price).toLocaleString()}
                        </span>
                        <span className="text-rose-500 font-black">
                          {applyingGig.currency_symbol || "$"}{(parseFloat(applyingGig.price) * (1 - parseFloat(applyingGig.discount_percent) / 100)).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      `${applyingGig.currency_symbol || "$"}${parseFloat(applyingGig.price).toLocaleString()}`
                    )}{" "}{applyingGig.currency_code}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Delivery Timeline</span>
                  <span className="text-slate-800 font-extrabold mt-0.5 block">{applyingGig.delivery_days} days (with {applyingGig.revisions || "unlimited"} revisions)</span>
                </div>
              </div>

              {/* Price Negotiation Section */}
              {applyingGig.negotiation && (
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700 block">Propose a Negotiated Price</label>
                  <p className="text-[10px] text-slate-500 font-semibold mb-1">
                    The freelancer allows budget proposals for this gig. Enter your offer below if you wish to negotiate:
                  </p>
                  <div className="relative flex items-center max-w-xs">
                    <span className="absolute left-3 text-xs text-slate-400 font-bold">{applyingGig.currency_symbol || "$"}</span>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={customProposedPrice}
                      onChange={(e) => setCustomProposedPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>
              )}


              {/* Payment info notice */}
              <div className="flex items-start gap-3 bg-blue-50/80 border border-blue-200/80 rounded-xl p-4">
                <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
                <div>
                  <p className="text-xs font-black text-blue-800">Payment is requested after the freelancer accepts</p>
                  <p className="text-[10px] text-blue-700 font-semibold mt-0.5 leading-relaxed">
                    No charge is made when you place this order. Once the freelancer accepts, you'll be prompted to pay via <strong>Stripe</strong>, <strong>PayPal</strong>, or your <strong>Wallet</strong> from My Orders.
                  </p>
                </div>
              </div>


              {/* Extra Features / Add-ons Builder */}
              <div className="flex flex-col gap-3 bg-slate-50/50 border border-slate-200/80 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wide">Extra Features / Add-ons</label>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                      Add extra deliverables on top of the base package. Each add-on has its own price (can be $0).
                      {orderMilestones.length > 0 ? <span className="text-amber-600 font-bold"> · 100% paid upfront into Escrow.</span> : <span className="text-slate-400"> · 100% paid upfront.</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderMilestones([...orderMilestones, { title: "", amount: "", start_date: "", end_date: "", description: "" }]);
                    }}
                    className="shrink-0 text-[10px] bg-white hover:bg-slate-50 text-slate-700 font-extrabold px-3 py-1.5 rounded-lg border border-slate-200/60 transition-all cursor-pointer ml-3"
                  >
                    + Add Feature
                  </button>
                </div>

                {orderMilestones.length > 0 && (
                  <div className="flex flex-col gap-3.5 mt-1 border-t border-slate-150 pt-3">
                    {orderMilestones.map((m, idx) => (
                      <div key={idx} className="flex flex-col gap-2 bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm relative">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...orderMilestones];
                            updated.splice(idx, 1);
                            setOrderMilestones(updated);
                          }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-50 border border-rose-250 text-rose-600 flex items-center justify-center hover:bg-rose-100 cursor-pointer shadow-sm text-xs"
                        >
                          ×
                        </button>
                        <div className="grid grid-cols-3 gap-2 items-end">
                          <div className="col-span-2 flex flex-col justify-end">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block truncate mb-1" title="Feature / Milestone Title *">Feature / Milestone Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Extra Revision Round"
                              value={m.title}
                              onChange={(e) => {
                                const updated = [...orderMilestones];
                                updated[idx].title = e.target.value;
                                setOrderMilestones(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                            />
                          </div>
                          <div className="flex flex-col justify-end">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block truncate mb-1" title={`Extra Cost (${applyingGig.currency_symbol || "$"})`}>Extra Cost ({applyingGig.currency_symbol || "$"})</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={m.amount}
                              onChange={(e) => {
                                const updated = [...orderMilestones];
                                updated[idx].amount = e.target.value;
                                setOrderMilestones(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white font-bold"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 items-end">
                          <div className="flex flex-col justify-end">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block truncate mb-1">Start Date</label>
                            <input
                              type="date"
                              value={m.start_date || ""}
                              onChange={(e) => {
                                const updated = [...orderMilestones];
                                updated[idx].start_date = e.target.value;
                                setOrderMilestones(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                            />
                          </div>
                          <div className="flex flex-col justify-end">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block truncate mb-1">End Date (Deadline)</label>
                            <input
                              type="date"
                              value={m.end_date || ""}
                              onChange={(e) => {
                                const updated = [...orderMilestones];
                                updated[idx].end_date = e.target.value;
                                setOrderMilestones(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Tasks / Scope Description</label>
                          <textarea
                            rows={2}
                            placeholder="Describe specific tasks or scope (e.g. 1. Create UX wireframes, 2. Design UI mockups)"
                            value={m.description || ""}
                            onChange={(e) => {
                              const updated = [...orderMilestones];
                              updated[idx].description = e.target.value;
                              setOrderMilestones(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white resize-none font-medium"
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Cost breakdown — only shown when there are add-ons */}
                    <div className="bg-white border border-slate-150 rounded-xl p-3 mt-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                        <span>Base Package</span>
                        <span className="font-bold text-slate-700">
                          {applyingGig.currency_symbol || "$"}{(
                            parseFloat(applyingGig.price) * (
                              applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0
                                ? (1 - parseFloat(applyingGig.discount_percent) / 100)
                                : 1
                            ) * (
                              applyingGig.negotiation && customProposedPrice.trim()
                                ? parseFloat(customProposedPrice.trim()) / (parseFloat(applyingGig.price) * (applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0 ? (1 - parseFloat(applyingGig.discount_percent) / 100) : 1))
                                : 1
                            )
                          ).toLocaleString()}
                        </span>
                      </div>
                      {orderMilestones.map((m, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-1">
                          <span className="text-slate-400">+ {m.title || `Add-on #${i + 1}`}</span>
                          <span className="font-bold text-slate-600">{applyingGig.currency_symbol || "$"}{parseFloat(m.amount || 0).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between items-center">
                        <span className="text-[11px] font-black text-slate-800">Total Estimated Cost</span>
                        <span className="text-[11px] font-black text-primary">
                          {applyingGig.currency_symbol || "$"}{(
                            (
                              parseFloat(applyingGig.price) * (
                                applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0
                                  ? (1 - parseFloat(applyingGig.discount_percent) / 100)
                                  : 1
                              ) * (
                                applyingGig.negotiation && customProposedPrice.trim()
                                  ? parseFloat(customProposedPrice.trim()) / (parseFloat(applyingGig.price) * (applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0 ? (1 - parseFloat(applyingGig.discount_percent) / 100) : 1))
                                  : 1
                              )
                            ) + orderMilestones.reduce((acc, m) => acc + parseFloat(m.amount || 0), 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[9px] text-amber-600 font-semibold mt-1.5">
                        50% ({applyingGig.currency_symbol || "$"}{(
                          (
                            (
                              parseFloat(applyingGig.price) * (
                                applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0
                                  ? (1 - parseFloat(applyingGig.discount_percent) / 100)
                                  : 1
                              ) * (
                                applyingGig.negotiation && customProposedPrice.trim()
                                  ? parseFloat(customProposedPrice.trim()) / (parseFloat(applyingGig.price) * (applyingGig.discount_percent && parseFloat(applyingGig.discount_percent) > 0 ? (1 - parseFloat(applyingGig.discount_percent) / 100) : 1))
                                  : 1
                              )
                            ) + orderMilestones.reduce((acc, m) => acc + parseFloat(m.amount || 0), 0)
                          ) * 0.5
                        ).toLocaleString()}) due now · 50% on completion
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements text box */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Requirements *</label>
                  <button
                    type="button"
                    onClick={() => setPreviewRequirements(!previewRequirements)}
                    className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {previewRequirements ? "Edit Requirements" : "Preview Requirements"}
                  </button>
                </div>
                
                {previewRequirements ? (
                  <div 
                    className="bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs text-slate-800 min-h-[162px] overflow-y-auto font-medium prose prose-slate max-w-full text-left"
                    dangerouslySetInnerHTML={{ __html: orderRequirements || '<span class="italic text-slate-400">No requirements entered yet.</span>' }}
                  />
                ) : (
                  <div className="flex flex-col">
                    {/* Rich Text Format Toolbar */}
                    <div className="flex items-center gap-1 border border-b-0 border-slate-250 bg-slate-50 p-1.5 rounded-t-xl select-none">
                      <button
                        type="button"
                        onClick={() => insertRequirementFormat("bold")}
                        title="Bold <strong>"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md cursor-pointer transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12h8a4 4 0 100-8H6v8zm0 0h10a4 4 0 110 8H6v-8z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRequirementFormat("italic")}
                        title="Italic <em>"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md cursor-pointer transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRequirementFormat("heading")}
                        title="Heading <h3>"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md cursor-pointer transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRequirementFormat("bullet")}
                        title="Bullet List <ul>"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md cursor-pointer transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
                      </button>
                    </div>
                    <textarea
                      id="project-requirements-textarea"
                      required
                      rows={6}
                      placeholder="Outline your detailed instructions, links to reference assets, preferred branding guidelines, or technical requirements..."
                      value={orderRequirements}
                      onChange={(e) => setOrderRequirements(e.target.value)}
                      className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-b-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-855 font-medium resize-none font-mono"
                    />
                  </div>
                )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-2 shrink-0 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsApplying(false);
                    setApplyingGig(null);
                    setOrderError("");
                    setPreviewRequirements(false);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs border border-slate-200 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/60 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {orderSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <span>Order Service</span>
                      <FiCheck className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* GIG DETAILS MODAL */}
      {isViewingDetails && selectedGigForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[3px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-slate-100 p-6 flex justify-between items-start sticky top-0 bg-white z-10">
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded uppercase tracking-wider self-start">
                  {selectedGigForDetails.category_name || "Service"}
                </span>
                <h2 className="text-xl font-black text-slate-800 leading-tight">
                  {selectedGigForDetails.title}
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  By {selectedGigForDetails.freelancer_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewingDetails(false);
                  setSelectedGigForDetails(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 overflow-y-auto">
              
              {/* Left Column - Media & Description */}
              <div className="flex-1 flex flex-col gap-6 text-left">
                
                {/* Images Showcase */}
                {selectedGigForDetails.images && selectedGigForDetails.images.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Showcase Images</h3>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
                      <img 
                        src={selectedGigForDetails.images[0]} 
                        className="w-full h-full object-cover" 
                        alt="Showcase"
                      />
                    </div>
                    {selectedGigForDetails.images.length > 1 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedGigForDetails.images.map((img: string, idx: number) => (
                          <div key={idx} className="w-16 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                            <img src={img} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-tr from-primary/5 to-cyan-500/5 flex flex-col items-center justify-center text-slate-400 gap-1 rounded-xl border border-slate-200">
                    <span className="text-3xl">🎨</span>
                    <span className="font-extrabold text-slate-500 uppercase tracking-widest text-xs">No Image Preview</span>
                  </div>
                )}

                {/* Description */}
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Description</h3>
                  <div 
                    className="text-xs leading-relaxed text-slate-600 font-medium prose prose-slate max-w-full"
                    dangerouslySetInnerHTML={{ __html: selectedGigForDetails.description }}
                  />
                </div>

                {selectedGigForDetails.payment_type === "milestone" && selectedGigForDetails.milestones && (
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Service Milestones</h3>
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
                            {selectedGigForDetails.currency_symbol || "$"}{parseFloat(m.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video & Documents */}
                {(selectedGigForDetails.video_url || (selectedGigForDetails.documents && selectedGigForDetails.documents.length > 0)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                    {/* Video */}
                    {selectedGigForDetails.video_url && (
                      <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Showcase Video</h4>
                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-200">
                          <video src={selectedGigForDetails.video_url} controls className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {selectedGigForDetails.documents && selectedGigForDetails.documents.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Showcase Documents</h4>
                        <div className="flex flex-col gap-2">
                          {selectedGigForDetails.documents.map((doc: string, idx: number) => {
                            const name = doc.split("/").pop() || `document_${idx + 1}`;
                            return (
                              <a 
                                key={idx} 
                                href={doc} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex items-center gap-2 p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700"
                              >
                                <FiFileText className="w-4 h-4 text-teal-700" />
                                <span className="truncate flex-1 text-left">{name}</span>
                                <span className="text-[10px] text-primary">Download</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Service Summary & Call To Action */}
              <div className="w-full md:w-80 shrink-0 flex flex-col gap-6">
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-baseline border-b border-slate-200/60 pb-4">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Starting Price</span>
                    <div className="text-right">
                      {selectedGigForDetails.payment_type === "milestone" ? (
                        <span className="text-base font-black text-slate-800">
                          {selectedGigForDetails.currency_symbol || "$"}{parseFloat(selectedGigForDetails.price || "0").toLocaleString()} <span className="text-[10px] text-primary block font-bold">(Milestone-based)</span>
                        </span>
                      ) : selectedGigForDetails.min_price || selectedGigForDetails.max_price ? (
                        <span className="text-sm font-black text-slate-800">
                          {selectedGigForDetails.currency_symbol || "$"}{parseFloat(selectedGigForDetails.min_price || "0").toLocaleString()} - {selectedGigForDetails.currency_symbol || "$"}{parseFloat(selectedGigForDetails.max_price || "0").toLocaleString()} <span className="text-[10px] text-slate-400 block font-bold">(Budget Range)</span>
                        </span>
                      ) : selectedGigForDetails.discount_percent && parseFloat(selectedGigForDetails.discount_percent) > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wider mb-1">
                            {parseFloat(selectedGigForDetails.discount_percent)}% OFF
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 line-through">
                              {selectedGigForDetails.currency_symbol || "$"}{parseFloat(selectedGigForDetails.price).toLocaleString()}
                            </span>
                            <span className="text-xl font-black text-slate-900">
                              {selectedGigForDetails.currency_symbol || "$"}{(parseFloat(selectedGigForDetails.price) * (1 - parseFloat(selectedGigForDetails.discount_percent) / 100)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xl font-black text-slate-900">
                          {selectedGigForDetails.currency_symbol || "$"}{parseFloat(selectedGigForDetails.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Delivery Time:</span>
                      <span className="text-slate-800 font-bold">{selectedGigForDetails.delivery_days} Days</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Revisions Allowed:</span>
                      <span className="text-slate-800 font-bold">{selectedGigForDetails.revisions || "Unlimited"}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setApplyingGig(selectedGigForDetails);
                      setIsApplying(true);
                      setIsViewingDetails(false);
                      setSelectedGigForDetails(null);
                    }}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                  >
                    <span>Order Service Package</span>
                    <FiCheck className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreGigsTab;
