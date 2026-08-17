"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiCopy, FiCheck, FiUsers, FiDollarSign, FiAward, FiInfo, FiActivity, FiArrowRight } from "react-icons/fi";

interface LedgerEntry {
  commission_id: number;
  amount: string;
  platform_fee: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  referred_user_name: string;
  referred_user_email: string;
}

interface AffiliateData {
  referral_code: string;
  is_affiliate: boolean;
  total_referred: number;
  pending_commissions: number;
  approved_commissions: number;
  ledger: LedgerEntry[];
}

export default function AffiliatePortalPage() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Affiliate enrollment states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchAffiliateStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/users/affiliate/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        } else {
          const errData = await res.json();
          setError(errData.message || "Failed to load affiliate statistics.");
        }
      } catch (err) {
        console.error("Affiliate stats fetch error:", err);
        setError("Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateStats();
  }, []);

  const handleJoinAffiliate = async () => {
    setJoining(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/users/affiliate/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Update stored user object in localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.is_affiliate = true;
            localStorage.setItem("user", JSON.stringify(parsed));
          } catch (e) {}
        }
        const statsRes = await fetch(`${API_URL}/users/affiliate/stats`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setData({ ...stats, is_affiliate: true });
        } else {
          setData(prev => prev ? { ...prev, is_affiliate: true } : null);
        }
        setShowTermsModal(false);
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to join affiliate program.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error joining program.");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = () => {
    if (!data?.referral_code) return;
    const link = `${window.location.origin}/register?ref=${data.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 border border-red-100 p-6 rounded-xl text-center m-6 max-w-xl mx-auto">
        <h3 className="font-extrabold text-base mb-1">Error Loading Affiliate Stats</h3>
        <p className="text-xs font-semibold">{error}</p>
      </div>
    );
  }

  const isAffiliate = Boolean(
    data?.is_affiliate === true ||
    data?.is_affiliate === 1 ||
    data?.is_affiliate === "true" ||
    data?.is_affiliate === "t"
  );

  if (data && !isAffiliate) {
    return (
      <div className="flex-grow max-w-2xl mx-auto w-full px-3 sm:px-4 py-2 sm:py-6 flex flex-col gap-5 sm:gap-6 text-center animate-fadeIn">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-805 tracking-tight">Become an Affiliate Partner</h1>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Earn recurring commissions on platform fees</p>
        </div>
        <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-lg mx-auto">
          Unlock your affiliate referral links and start earning recurring commissions. Invite freelancers, contractors, or clients to LancerFlow and receive <span className="text-emerald-700 font-extrabold">10% of all service fees</span> collected from their transactions!
        </p>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-left flex flex-col gap-4 mt-2">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Why Join LancerFlow Affiliates?</h3>
          <ul className="space-y-3.5 text-xs font-semibold text-slate-500">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
              <span><strong>Recurring Revenue</strong>: Earn a lifetime 10% cut of our platform fees from every project or gig completed by your referrals.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
              <span><strong>Item-Level Sharing</strong>: Generate special affiliate links for specific projects or gigs. When shared, any bookings made will earn you commissions.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
              <span><strong>Real-time Ledger & Dashboard</strong>: Track referred users, review pending payout cycles, and request withdrawal to your wallet.</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setShowTermsModal(true)}
          className="mt-2 bg-teal-700 hover:bg-teal-850 text-white font-extrabold text-xs py-3.5 px-8 rounded-xl shadow-md transition cursor-pointer self-center border-none flex items-center gap-1.5"
        >
          Join Affiliate Program
        </button>

        {/* Terms & Conditions Pop-up Modal rendered at body level using createPortal */}
        {showTermsModal && mounted && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] transition-opacity"
              onClick={() => setShowTermsModal(false)}
            />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 relative z-10 flex flex-col gap-4 text-left animate-fadeIn">
              <div>
                <h3 className="text-sm font-black text-slate-805">Affiliate Program Agreement</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Please review and agree to join</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center gap-2.5">
                <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                  Before joining the program, you must read the official Affiliate Terms page:
                </p>
                <a
                  href="/affiliate-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-black text-teal-700 hover:text-teal-850 hover:underline transition-all bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs"
                >
                  📄 Read Affiliate Terms
                </a>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 border-slate-350 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-655">I review and accept the Affiliate Agreement Terms</span>
              </label>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  disabled={joining}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleJoinAffiliate}
                  disabled={joining || !agreed}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-855 text-white text-xs font-extrabold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border-none"
                >
                  {joining ? (
                    <>
                      <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    "Accept & Join"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  const affiliateLink = data?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.referral_code}`
    : "";

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-2 sm:py-8 flex flex-col gap-5 sm:gap-8">
      
      {/* Title */}
      <div className="select-none">
        <h1 className="text-xl sm:text-2xl font-black text-slate-805 tracking-tight">Affiliate Portal</h1>
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Earn recurring commissions on platform fees</p>
      </div>

      {/* Hero Promo Box */}
      <div className="bg-white border border-slate-200 text-slate-800 p-5 sm:p-8 rounded-2xl shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-[-20%] left-[-10%] w-[24rem] h-[24rem] bg-teal-500/5 rounded-full filter blur-[80px] pointer-events-none" />
        
        <div className="flex-grow flex flex-col gap-3 relative z-10 text-center md:text-left">
          <span className="bg-emerald-50/70 border border-emerald-250 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
            Recurring Payouts
          </span>
          <h2 className="text-2xl font-black tracking-tight leading-tight text-slate-855">
            Earn 10% of Platform Fees on Referred Users
          </h2>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-md">
            Invite contractors or hiring managers to the platform. Unlike one-off refer rewards, you earn a <strong className="text-emerald-700">recurring 10% commission</strong> on every single service fee the platform collects from their contracts and projects!
          </p>
        </div>

        {/* Product-Level Affiliate Links Info Box */}
        <div className="w-full md:max-w-md bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex flex-col gap-3 relative z-10 shadow-xs text-left">
          <div className="flex items-center gap-2.5 border-b border-emerald-200/60 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              🛍️
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">Product-Specific Affiliate Links</h4>
              <p className="text-[10px] font-extrabold text-emerald-700 mt-0.5">Share specific Gigs & Projects</p>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-600 leading-relaxed bg-white/90 p-3 rounded-xl border border-emerald-150/70">
            Affiliate referral links are item-specific. Browse any Gig or Project on the marketplace to find your unique <strong>"Copy Product Affiliate Link"</strong> button.
          </p>
          <a
            href="/gigs"
            className="inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer text-center no-underline border-none"
          >
            <span>Browse Marketplace Products</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Invited */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 text-xl shadow-sm shrink-0">
            <FiUsers />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Referred Users</span>
            <span className="text-2xl font-black text-slate-805 leading-none mt-1 block">
              {data?.total_referred || 0}
            </span>
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-xl shadow-sm shrink-0">
            <FiActivity />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Commissions</span>
            <span className="text-2xl font-black text-slate-805 leading-none mt-1 block">
              ${data?.pending_commissions.toFixed(2) || "0.00"}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">Awaiting admin review</span>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xl shadow-sm shrink-0">
            <FiAward />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved & Paid Out</span>
            <span className="text-2xl font-black text-slate-805 leading-none mt-1 block">
              ${data?.approved_commissions.toFixed(2) || "0.00"}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">Credited to your main wallet</span>
          </div>
        </div>
      </div>

      {/* Program Details Card */}
      <div className="bg-slate-100/45 border border-slate-200/60 p-6 rounded-xl flex gap-4">
        <FiInfo className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-left flex flex-col gap-2">
          <h4 className="text-sm font-extrabold text-slate-800">Affiliate program rules</h4>
          <ol className="list-decimal pl-4 text-xs font-semibold text-slate-500 leading-relaxed space-y-1">
            <li>Referred users must register through your unique link to bind to your affiliate account.</li>
            <li>When referred clients pay freelancers, or referred freelancers complete paid jobs, a service fee is collected by the system.</li>
            <li>You receive <strong>10%</strong> of that service fee as a commission.</li>
            <li>Commissions are recorded instantly in your ledger as <strong>Pending</strong>. Once approved by the administrator, they are moved to <strong>Approved</strong> and paid directly to your wallet balance.</li>
          </ol>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-150/70 text-left bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-805 leading-none">Commission Ledger</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Real-time log of recurring commission rewards</span>
        </div>

        {data?.ledger && data.ledger.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/10 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                  <th className="px-6 py-3.5">Referred User</th>
                  <th className="px-6 py-3.5">Platform Fee</th>
                  <th className="px-6 py-3.5">Your Commission (10%)</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((entry) => (
                  <tr key={entry.commission_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 leading-normal">{entry.referred_user_name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{entry.referred_user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-xs font-bold text-slate-500">
                      ${parseFloat(entry.platform_fee).toFixed(2)}
                    </td>
                    <td className="px-6 py-4.5 text-xs font-black text-slate-800">
                      ${parseFloat(entry.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4.5 text-xs font-bold text-slate-500">
                      {new Date(entry.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full ${
                        entry.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : entry.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {entry.status === "pending" ? "Pending Approval" : entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl rounded-full">
              <FiActivity />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-700">No Commissions Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed font-semibold">
                Share your affiliate link and start referring users. Commissions will show up here as soon as they complete transactions!
              </p>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
