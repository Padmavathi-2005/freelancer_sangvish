import React, { useState, useEffect } from "react";
import { FiBriefcase, FiAlertTriangle, FiCheckCircle, FiCheck } from "react-icons/fi";

interface ExploreGigsTabProps {
  triggerToast: any;
  fetchClientApplications: () => Promise<void>;
}

const ExploreGigsTab: React.FC<ExploreGigsTabProps> = ({ triggerToast, fetchClientApplications }) => {
  const [clientGigs, setClientGigs] = useState<any[]>([]);
  const [loadingClientGigs, setLoadingClientGigs] = useState(false);

  // Ordering flow states
  const [isApplying, setIsApplying] = useState(false);
  const [applyingGig, setApplyingGig] = useState<any | null>(null);
  const [orderRequirements, setOrderRequirements] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");

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
  }, []);

  return (
    <div className="relative z-10 flex flex-col gap-8 w-full animate-fadeIn text-left">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiBriefcase className="w-5 h-5 text-primary shrink-0" />
            <span>Explore Services</span>
          </h2>
          <p className="text-slate-404 text-xs mt-1 font-semibold">Browse packaged services and gigs published by elite freelancers.</p>
        </div>
      </div>

      {/* Grid */}
      {loadingClientGigs ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
          <div className="w-8 h-8 border-4 border-t-emerald-500 border-slate-200 rounded-full animate-spin"></div>
          <p className="text-slate-404 text-xs font-semibold">Loading available services...</p>
        </div>
      ) : clientGigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-slate-350 rounded-2xl p-8 shadow-inner">
          <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
          </svg>
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">No services active</h3>
          <p className="text-slate-404 text-xs max-w-sm font-semibold">No freelancer gigs are currently published on the platform.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clientGigs.map((g) => (
            <div key={g.gig_id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-80" />
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded uppercase tracking-wider">
                    {g.category_name || "Service"}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2 py-1 rounded-lg">
                    {g.currency_symbol || "$"}{parseFloat(g.price).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-855 mt-3 line-clamp-2">{g.title}</h3>
                <p className="text-slate-404 text-[10px] font-bold block mt-1 uppercase truncate">By {g.freelancer_name}</p>
                <p className="text-slate-500 text-xs mt-3.5 leading-relaxed font-medium line-clamp-3">{g.description}</p>
                
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
                  onClick={() => {
                    setApplyingGig(g);
                    setIsApplying(true);
                  }}
                  className="text-[10px] font-bold text-white bg-primary hover:bg-primary-hover py-1.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Order Service →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Gig Application Modal */}
      {isApplying && applyingGig && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative">
            <button
              onClick={() => {
                setIsApplying(false);
                setApplyingGig(null);
                setOrderError("");
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

            <form onSubmit={handleApplyGigSubmit} className="flex flex-col gap-5 mt-6">
              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-650 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <FiAlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
              {orderSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-650 text-xs font-bold rounded-xl animate-pulse flex items-center gap-1.5">
                  <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Order request submitted successfully!</span>
                </div>
              )}

              {/* Price Details banner */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Fixed Package Price</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block">
                    {applyingGig.currency_symbol || "$"}{parseFloat(applyingGig.price).toLocaleString()} {applyingGig.currency_code}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Delivery Timeline</span>
                  <span className="text-slate-800 font-extrabold mt-0.5 block">{applyingGig.delivery_days} days (with {applyingGig.revisions || "unlimited"} revisions)</span>
                </div>
              </div>

              {/* Requirements text box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Project Requirements *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Outline your detailed instructions, links to reference assets, preferred branding guidelines, or technical requirements..."
                  value={orderRequirements}
                  onChange={(e) => setOrderRequirements(e.target.value)}
                  className="bg-slate-50/50 border border-slate-250 hover:border-slate-350 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 focus:bg-white transition-all text-slate-850 font-medium resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsApplying(false);
                    setApplyingGig(null);
                    setOrderError("");
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
        </div>
      )}
    </div>
  );
};

export default ExploreGigsTab;
