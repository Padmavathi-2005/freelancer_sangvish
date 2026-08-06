"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import { FiCopy, FiCheck, FiUsers, FiDollarSign, FiAward, FiInfo } from "react-icons/fi";

interface ReferredUser {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  is_onboarded: boolean;
  has_purchased: boolean;
  status: "pending" | "onboarding_completed" | "purchased" | "completed" | "approved" | "rejected";
}

interface ReferralData {
  referral_code: string;
  referred_users: ReferredUser[];
  total_earned: number;
  signup_bonus?: number;
  enable_signup_bonus?: boolean;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/users/referrals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        } else {
          const errData = await res.json();
          setError(errData.message || "Failed to load referral stats.");
        }
      } catch (err) {
        console.error("Referral fetch error:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  const handleCopyLink = () => {
    if (!data?.referral_code) return;
    const link = `${window.location.origin}/register?ref=${data.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBanner = async () => {
    try {
      const res = await fetch(`${API_URL.replace("/api", "")}/api/users/referral/banner.svg`);
      if (!res.ok) throw new Error("Failed to download banner");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "referral_banner.svg";
      document.body.appendChild(a);
      a.click();
      a.removeAttribute("href");
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
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
        <h3 className="font-extrabold text-base mb-1">Error Loading Referrals</h3>
        <p className="text-xs font-semibold">{error}</p>
      </div>
    );
  }

  const referralLink = data?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.referral_code}`
    : "";

  const pendingCount = data?.referred_users.filter((u) => u.status !== "approved").length || 0;
  const activeCount = data?.referred_users.filter((u) => u.status === "approved").length || 0;

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-2 sm:py-8 flex flex-col gap-5 sm:gap-8">
      
      {/* Title */}
      <div className="select-none">
        <h1 className="text-xl sm:text-2xl font-black text-slate-805 tracking-tight">Refer & Earn</h1>
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Invite friends and earn wallet credits</p>
      </div>

      {/* Hero promo block (Dynamic Banner & Copy Box) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {/* Dynamic SVG Banner */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-900 flex items-center justify-center">
          <img
            src={`${API_URL.replace("/api", "")}/api/users/referral/banner.svg`}
            alt="Dynamic Referral Program Promo Banner"
            className="w-full h-auto object-contain block"
          />
        </div>

        {/* Copy Box & Download card */}
        <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between gap-5 text-left relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[12rem] h-[12rem] bg-teal-500/5 rounded-full filter blur-[50px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">Start Inviting</span>
            <h3 className="text-lg font-black tracking-tight leading-tight text-slate-855">Your Referral Link</h3>
            <p className="text-[11px] font-semibold text-slate-450 leading-normal">
              Copy this link and send it to your friends. You can also download the custom banner below to share on social media.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent text-[11px] font-bold text-slate-800 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="bg-teal-700 hover:bg-teal-800 active:scale-95 transition-all text-white p-2 rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                title="Copy link"
              >
                {copied ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <span className="text-[9px] font-bold text-emerald-600 text-right animate-fade-in select-none">
                Link copied to clipboard!
              </span>
            )}
          </div>
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invited</span>
            <span className="text-2xl font-black text-slate-805 leading-none mt-1 block">
              {data?.referred_users.length || 0}
            </span>
          </div>
        </div>

        {/* Successful Referrals */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 text-xl shadow-sm shrink-0">
            <FiAward />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Referrals</span>
            <span className="text-2xl font-black text-slate-805 leading-none mt-1 block">
              {activeCount}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">{pendingCount} pending first transaction</span>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50/55 border border-amber-200/50 flex items-center justify-center text-amber-600 text-xl shadow-sm shrink-0">
            <FiDollarSign />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Earned</span>
            <span className="text-2xl font-black text-slate-805 leading-none mt-1 block">
              ${data?.total_earned.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </div>

      {/* Program details / How it works */}
      <div className="bg-slate-100/45 border border-slate-200/60 p-6 rounded-xl flex gap-4">
        <FiInfo className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-left flex flex-col gap-2">
          <h4 className="text-sm font-extrabold text-slate-800">How the referral program works</h4>
          <ol className="list-decimal pl-4 text-xs font-semibold text-slate-500 leading-relaxed space-y-1">
            <li>Copy your referral link above and share it with your professional network.</li>
            <li>Your friends use the link to register a new account on our platform.</li>
            {data?.enable_signup_bonus !== false && (
              <li>Upon registering, they receive a <strong>${(data?.signup_bonus ?? 5.00).toFixed(2)} signup bonus</strong> (pending admin verification & approval) directly into their wallet.</li>
            )}
            <li>When they fund their first job milestone, pay for a gig, or clear a contract, you instantly receive a promoter payout reward in your wallet.</li>
          </ol>
        </div>
      </div>

      {/* Referred Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-150/70 text-left bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-805 leading-none">Invited Friends</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Track registration and transaction status</span>
        </div>

        {data?.referred_users && data.referred_users.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/10 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Registration Date</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.referred_users.map((ref) => (
                  <tr key={ref.user_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 leading-normal">{ref.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{ref.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-xs font-bold text-slate-500">
                      {new Date(ref.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
                        {/* Status Badge */}
                        {(() => {
                          let badgeClass = "";
                          let label = "";
                          switch (ref.status) {
                            case "approved":
                              badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                              label = "Approved & Paid";
                              break;
                            case "rejected":
                              badgeClass = "bg-rose-50 text-rose-700 border-rose-100";
                              label = "Audit Rejected";
                              break;
                            case "completed":
                              badgeClass = "bg-sky-50 text-sky-700 border-sky-100";
                              label = "Awaiting Audit";
                              break;
                            case "purchased":
                              badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
                              label = "Gig/Project Purchased";
                              break;
                            case "onboarding_completed":
                              badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
                              label = "Profile Onboarded";
                              break;
                            default:
                              badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                              label = "Registered";
                          }
                          return (
                            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${badgeClass}`}>
                              {label}
                            </span>
                          );
                        })()}

                        {/* Visual Step Tracker */}
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 select-none shrink-0">
                          {/* Step 1: Registered */}
                          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50/60 border border-emerald-200/80 px-1.5 py-0.5 rounded-md" title="Registration Complete">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Signed Up</span>
                          </div>

                          <span className="text-slate-300">→</span>

                          {/* Step 2: Onboarded */}
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                            ref.is_onboarded 
                              ? "text-emerald-600 bg-emerald-50/60 border-emerald-200/80" 
                              : "text-slate-400 bg-slate-50 border-slate-200"
                          }`} title="Profile Onboarding">
                            <span className={`w-1.5 h-1.5 rounded-full ${ref.is_onboarded ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                            <span>Onboarded</span>
                          </div>

                          <span className="text-slate-300">→</span>

                          {/* Step 3: First Purchase */}
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                            ref.has_purchased 
                              ? "text-emerald-600 bg-emerald-50/60 border-emerald-200/80" 
                              : "text-slate-400 bg-slate-50 border-slate-200"
                          }`} title="First Purchase/Order Complete">
                            <span className={`w-1.5 h-1.5 rounded-full ${ref.has_purchased ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                            <span>Purchased</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl rounded-full">
              <FiUsers />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-700">No Referrals Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed font-semibold">
                You haven't referred anyone yet. Copy your unique link above and share it with your network to start earning!
              </p>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
