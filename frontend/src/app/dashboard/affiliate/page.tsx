"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { FiCopy, FiCheck, FiUsers, FiDollarSign, FiAward, FiInfo, FiActivity } from "react-icons/fi";

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

  const affiliateLink = data?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.referral_code}`
    : "";

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-805 tracking-tight">Affiliate Portal</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Earn recurring commissions on platform fees</p>
      </div>

      {/* Hero Promo Box */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-teal-950 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-[-20%] left-[-10%] w-[24rem] h-[24rem] bg-teal-500/5 rounded-full filter blur-[80px] pointer-events-none" />
        
        <div className="flex-1 flex flex-col gap-3 relative z-10 text-center md:text-left">
          <span className="bg-emerald-500/25 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
            Recurring Payouts
          </span>
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            Earn 10% of Platform Fees on Referred Users
          </h2>
          <p className="text-slate-300 text-xs font-semibold leading-relaxed max-w-md">
            Invite contractors or hiring managers to the platform. Unlike one-off refer rewards, you earn a <strong className="text-emerald-400">recurring 10% commission</strong> on every single service fee the platform collects from their contracts and projects!
          </p>
        </div>

        {/* Copy affiliate link box */}
        <div className="w-full md:max-w-md bg-white/5 border border-white/10 p-5 rounded-xl flex flex-col gap-3 backdrop-blur-md relative z-10">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Affiliate Referral Link</label>
          <div className="flex items-center gap-2 bg-slate-950/45 border border-white/10 rounded-lg p-2.5">
            <input
              type="text"
              readOnly
              value={affiliateLink}
              className="flex-1 bg-transparent text-xs font-bold text-slate-100 outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white p-2 rounded-lg cursor-pointer flex items-center justify-center shrink-0"
              title="Copy link"
            >
              {copied ? <FiCheck className="w-4 h-4 text-emerald-400" /> : <FiCopy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <span className="text-[10px] font-bold text-emerald-400 text-right animate-fade-in select-none">
              Link copied to clipboard!
            </span>
          )}
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
            <li>You receive **10%** of that service fee as a commission.</li>
            <li>Commissions are recorded instantly in your ledger as **Pending**. Once approved by the administrator, they are moved to **Approved** and paid directly to your wallet balance.</li>
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
