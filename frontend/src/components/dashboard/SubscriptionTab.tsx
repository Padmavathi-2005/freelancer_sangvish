import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiCheck, FiInfo, FiLayers, FiCalendar, FiCreditCard } from "react-icons/fi";
import { API_URL } from "@/config/api";

interface SubscriptionInfo {
  active_plan_id: number | null;
  plan_name: string | null;
  description: string | null;
  price: string | number;
  period: string | null;
  gig_discount_percent: number;
  features: string[] | string;
  credits: number;
  plan_duration: number;
  plan_role: string;
  user_created_at: string;
}

interface LimitInfo {
  limitReached: boolean;
  submittedCount: number;
  limit: number;
  resetDate: string | null;
  isPaidOption: boolean;
}

export default function SubscriptionTab() {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Session expired. Please log in.");
          setLoading(false);
          return;
        }

        const [subRes, limitRes] = await Promise.all([
          fetch(`${API_URL}/users/me/subscription`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/proposals/limit-check`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!subRes.ok) {
          throw new Error("Failed to load subscription details.");
        }

        const subData = await subRes.json();
        let limitData = null;
        if (limitRes.ok) {
          limitData = await limitRes.json();
        }

        setSubInfo(subData);
        setLimitInfo(limitData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      fetchSubData();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-700/30 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading plan subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subInfo) {
    return (
      <div className="flex-1 p-6 bg-slate-50/50 flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm max-w-lg mx-auto mt-10">
          <h2 className="text-base font-extrabold text-slate-800">Subscription Unavailable</h2>
          <p className="text-xs text-slate-500 font-semibold mt-2">{error || "Could not retrieve your current plan information."}</p>
          <Link href="/pricing" className="mt-4 inline-block bg-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-teal-800 transition">
            Browse Membership Plans
          </Link>
        </div>
      </div>
    );
  }

  // Parse features list
  let parsedFeatures: string[] = [];
  if (subInfo.features) {
    try {
      parsedFeatures = typeof subInfo.features === "string"
        ? JSON.parse(subInfo.features)
        : subInfo.features;
    } catch (e) {
      console.error(e);
    }
  }

  const planName = subInfo.plan_name || "Free Tier";
  const duration = subInfo.plan_duration || 30;
  const planPrice = parseFloat(subInfo.price as any || 0);

  // Proposal limits
  const totalBids = limitInfo ? limitInfo.limit : (subInfo.credits || 10);
  const usedBids = limitInfo ? limitInfo.submittedCount : 0;
  const remainingBids = Math.max(0, totalBids - usedBids);
  const progressPercent = Math.min(100, (usedBids / totalBids) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 scrollbar-thin">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <FiLayers className="text-teal-700" /> My Subscription Plan
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          Monitor your active membership tier, monthly proposal limits, and premium features.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MEMBERSHIP STATUS CARD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 p-6 text-white shadow-xl shadow-teal-900/10 min-h-[220px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl -ml-8 -mb-8"></div>

            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-teal-200">
                  Current Membership
                </p>
                <h3 className="text-2xl font-black tracking-tight text-white/95 mt-1">
                  {planName}
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="z-10 mt-6">
              <p className="text-3xl font-black tracking-tight">
                {planPrice === 0 ? "Free" : `$${planPrice.toFixed(2)}`}
              </p>
              <p className="text-[10px] text-teal-100 font-semibold uppercase tracking-wider mt-1">
                Billed every {duration} Days
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-teal-200/90 font-bold z-10 mt-4 border-t border-white/10 pt-3">
              <span className="flex items-center gap-1"><FiCalendar /> Cycle Limit: {duration} Days</span>
              <span className="uppercase">Role: {subInfo.plan_role || "Seller"}</span>
            </div>
          </div>

          {/* Quick Upgrade/Change plan link */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <FiCreditCard className="text-teal-650" /> Change Subscription
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Scale your membership tier to get additional credits instantly.
              </p>
            </div>
            <Link 
              href="/pricing"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-md shadow-teal-750/15 block text-center cursor-pointer"
            >
              Explore Tiers & Pricing
            </Link>
          </div>
        </div>

        {/* CREDITS / BIDS TRACKER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                🪙 Bidding Credits & Usage details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Credits</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">{totalBids}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Credits Used</span>
                  <p className="text-2xl font-black text-teal-700 mt-1">{usedBids}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Remaining Balance</span>
                  <p className="text-2xl font-black text-teal-800 mt-1">{remainingBids}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Cycle Proposal Quota Progress</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-gradient-to-r from-teal-650 to-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Reset info box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 mt-6">
              <FiInfo className="text-teal-700 w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Next Reset Date</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
                  {limitInfo?.resetDate 
                    ? `Your limit of ${totalBids} credits will refresh automatically on ${limitInfo.resetDate} (calculated from your registration date and plan duration).`
                    : `Your limit of ${totalBids} credits will refresh automatically after ${duration} days.`}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PLAN DETAILS & PRIVILEGES */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          ✨ Active Plan Features & Benefits
        </h2>
        {parsedFeatures.length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold py-4 text-center">
            No specific features detailed in plan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 text-xs font-black shrink-0">
                  <FiCheck />
                </div>
                <span className="text-xs font-extrabold text-slate-700">{feat}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
