"use client";
import { API_URL } from "@/config/api";
import { useLanguage } from "@/context/LanguageContext";

import React, { useState, useEffect } from "react";
import { FiCopy, FiCheck, FiUsers, FiDollarSign, FiAward, FiInfo, FiGift, FiZap, FiShare2, FiCheckCircle } from "react-icons/fi";
import { FaWhatsapp, FaXTwitter, FaLinkedinIn, FaFacebookF, FaEnvelope } from "react-icons/fa6";

interface ReferredUser {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
  is_active: boolean;
  is_onboarded: boolean;
  has_purchased: boolean;
  days_elapsed?: number;
  status: "pending" | "onboarding_completed" | "purchased" | "completed" | "approved" | "rejected" | "expired";
}

interface ReferralData {
  referral_code: string;
  referred_users: ReferredUser[];
  total_earned: number;
  signup_bonus?: number;
  enable_signup_bonus?: boolean;
  completion_window_days?: number;
  banner_headline?: string;
  banner_subline?: string;
  max_referrer_reward?: number;
}

export default function ReferralsPage() {
  const { t, direction } = useLanguage();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Drag to scroll table state
  const tableRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeft(tableRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableRef.current.scrollLeft = scrollLeft - walk;
  };

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

  const referralLink = data?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.referral_code}`
    : "";

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (!data?.referral_code) return;
    navigator.clipboard.writeText(data.referral_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareSubject = "Join me on Buy2Lancer!";
  const shareText = `Join me on Buy2Lancer! Register using my referral link and get a sign-up bonus:\n${referralLink}`;
  
  const publicShareUrl = referralLink.includes("localhost") || referralLink.includes("127.0.0.1")
    ? referralLink.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "https://freelancer.sangvish.com")
    : referralLink;

  const handleShareWhatsApp = () => {
    if (typeof window === "undefined") return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareTwitter = () => {
    if (typeof window === "undefined") return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    if (typeof window === "undefined") return;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicShareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareFacebook = () => {
    if (typeof window === "undefined") return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicShareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareEmail = () => {
    if (typeof window === "undefined") return;
    const subject = encodeURIComponent(shareSubject);
    const body = encodeURIComponent(`Hi,\n\nJoin me on Buy2Lancer! Register using my referral link and get a sign-up bonus:\n${referralLink}\n\nBest regards!`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
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

  const pendingCount = data?.referred_users.filter((u) => u.status !== "approved" && u.status !== "expired").length || 0;
  const activeCount = data?.referred_users.filter((u) => u.status === "approved" || u.status === "completed" || u.status === "purchased" || u.has_purchased).length || 0;
  const expiredCount = data?.referred_users.filter((u) => u.status === "expired").length || 0;
  const referralCount = activeCount; // ONLY count successful completed purchase referrals for level progress
  const progressPercent = Math.min(100, Math.max(0, (referralCount / 5) * 100));
  const hasSignupBonus = data?.enable_signup_bonus !== false && (data?.signup_bonus ?? 0) > 0;

  return (
    <div className="flex-1 w-full flex flex-col gap-4 sm:gap-6 animate-fadeIn">
      
      {/* Title */}
      <div className="select-none font-sans text-left rtl:text-right">
        <h1 className="text-xl sm:text-2xl font-black text-slate-805 tracking-tight">{t("refer_and_earn_header", "Refer & Earn")}</h1>
        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">{t("refer_and_earn_desc", "Invite friends and earn wallet credits")}</p>
      </div>

      {/* Hero promo block (Native Card & Copy Box) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch font-sans">
        {/* Referral Program Native Primary Color Design Promo Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#054638] via-[#0b6354] to-[#042f2e] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-teal-700/50 flex flex-col justify-between relative overflow-hidden group">
          {/* Ambient background glows */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-300/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

          {/* Floating graphic coins decor - High Contrast White Dollar Symbols */}
          <div className={`absolute ${direction.toLowerCase() === "rtl" ? "left-6" : "right-6"} top-6 hidden sm:flex items-center gap-2 pointer-events-none z-20`}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white font-black text-2xl shadow-xl shadow-amber-500/40 flex items-center justify-center border-2 border-white/80 transform -rotate-12">
              $
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 text-white font-black text-xl shadow-xl shadow-emerald-400/40 flex items-center justify-center border-2 border-white/80 transform rotate-12 -ml-3 mt-4">
              $
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-col gap-2 max-w-lg text-left rtl:text-right">
              {/* High Contrast Badge & Icon */}
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-100 border border-emerald-300/40 w-fit shadow-md backdrop-blur-sm">
                <FiAward className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t("referral_program_badge", "Referral Program")}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-0.5 drop-shadow-xs">
                {t(data?.banner_headline || "Invite Friends & Earn", data?.banner_headline || "Invite Friends & Earn")}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-teal-50/90 leading-relaxed">
                {t(data?.banner_subline || "Share your referral link with friends. They get a bonus on sign-up, and you get paid when they complete transactions!", data?.banner_subline || "Share your referral link with friends. They get a bonus on sign-up, and you get paid when they complete transactions!")}
              </p>
            </div>

            {/* Horizontal Line Divider */}
            <div className="border-t border-teal-600/40 my-1" />

            {/* Stat Metrics Row - Clean Line Divider Structure (No Inner Boxes) */}
            <div className={`grid grid-cols-1 ${hasSignupBonus ? "sm:grid-cols-3" : "sm:grid-cols-2"} divide-y sm:divide-y-0 sm:divide-x divide-teal-600/40 py-1`}>
              {/* SIGN-UP BONUS (Only rendered if signup_bonus > 0 and enabled) */}
              {hasSignupBonus && (
                <div className="pr-4 flex flex-col gap-1 text-left rtl:text-right">
                  <div className="flex items-center gap-1.5">
                    <FiGift className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {t("signup_bonus_reward_label", "SIGN-UP BONUS")}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    ${(data?.signup_bonus ?? 5.00).toFixed(2)}
                  </span>
                </div>
              )}

              {/* REFERRAL REWARD */}
              <div className="px-4 flex flex-col gap-1 text-left rtl:text-right">
                <div className="flex items-center gap-1.5">
                  <FiDollarSign className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {t("referral_reward_label", "REFERRAL REWARD")}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
                  {t("up_to_reward", "Up to {amount}").replace("{amount}", "$" + (data?.max_referrer_reward ?? 10.00).toFixed(2))}
                </span>
              </div>

              {/* REWARD METHOD */}
              <div className="pl-4 flex flex-col gap-1 text-left rtl:text-right">
                <div className="flex items-center gap-1.5">
                  <FiAward className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-200">
                    {t("reward_method_label", "REWARD METHOD")}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-teal-100 mt-0.5">
                  {t("wallet_credits_label", "Wallet Credits")}
                </span>
              </div>
            </div>

            {/* Horizontal Line Divider */}
            <div className="border-t border-teal-600/40 my-1" />

            {/* Visual Milestone Level Progress Line (Clean Line Section - No Box Container) */}
            <div className="flex flex-col gap-2 text-left rtl:text-right">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t("promoter_status_level_1", "PROMOTER STATUS: LEVEL 1")}
                </span>
                <span className="text-amber-300">{t("successful_referrals_count", "{count} / 5 SUCCESSFUL REFERRALS").replace("{count}", String(referralCount))}</span>
              </div>
              <div className="w-full bg-teal-950/80 rounded-full h-1.5 overflow-hidden border border-teal-600/40">
                <div 
                  className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[9.5px] font-semibold text-teal-200/80">
                {t("promoter_instruction_note", "Invite friends to start earning instant promoter bonus payouts directly to your wallet!")}
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-5 pt-3 border-t border-teal-600/40 flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
            <span className="text-teal-200">{t("powered_by_site", "POWERED BY {{siteName}}").replace("{{siteName}}", ("BUY2LANCER").toUpperCase())}</span>
            <span className="text-amber-300 font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              {t("active_rewards_label", "ACTIVE REWARDS")}
            </span>
          </div>
        </div>

        {/* Copy Link & Invite Hub Card - Clean Line Dividers */}
        <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between text-left rtl:text-right relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[12rem] h-[12rem] bg-teal-500/10 rounded-full filter blur-[50px] pointer-events-none" />
          
          {/* Header */}
          <div className="relative z-10 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">{t("start_inviting_badge", "Start Inviting")}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("active_link_status", "Active Link")}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight leading-tight text-slate-900">{t("your_referral_hub_title", "Your Referral Hub")}</h3>
            <p className="text-[11px] font-semibold text-slate-500 leading-normal">
              {t("your_referral_hub_desc", "Copy your referral code, share your direct link, or send quick invites to start earning.")}
            </p>
          </div>

          {/* Line Divider */}
          <div className="border-t border-slate-150 my-3" />

          {/* Row 1: Referral Code */}
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("your_referral_code_label", "Your Referral Code")}</span>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5 pt-0.5">
              <code className="text-sm font-black text-teal-800 tracking-wider">
                {data?.referral_code || "---"}
              </code>
              <button
                onClick={handleCopyCode}
                className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shrink-0"
              >
                {codeCopied ? <FiCheck className="w-3 h-3 text-emerald-600" /> : <FiCopy className="w-3 h-3 text-slate-600" />}
                <span>{codeCopied ? t("copied_btn_state", "Copied") : t("copy_code_btn", "Copy Code")}</span>
              </button>
            </div>
          </div>

          {/* Line Divider */}
          <div className="border-t border-slate-150 my-3" />

          {/* Row 2: Direct Referral Link */}
          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("direct_referral_link_label", "Direct Referral Link")}</span>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5 pt-0.5">
              <span dir="ltr" className="flex-1 text-[11px] font-extrabold text-slate-800 truncate select-all text-left">
                {referralLink}
              </span>
              <button
                onClick={handleCopyLink}
                className="bg-teal-700 hover:bg-teal-800 active:scale-95 transition-all text-white px-3 py-1.5 rounded-lg cursor-pointer flex items-center justify-center shrink-0 shadow-sm text-xs font-extrabold gap-1"
                title={t("copy_link_title", "Copy link")}
              >
                {copied ? <FiCheck className="w-3.5 h-3.5 text-white stroke-[3]" /> : <FiCopy className="w-3.5 h-3.5 text-white" />}
                <span>{copied ? t("copied_btn_state", "Copied!") : t("copy_btn", "Copy")}</span>
              </button>
            </div>
          </div>

          {/* Line Divider */}
          <div className="border-t border-slate-150 my-3" />

          {/* Row 3: Official Social Share Buttons */}
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("quick_share_label", "Quick Share")}</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="w-10 h-10 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-md shadow-[#25D366]/30 transition-all cursor-pointer border-none"
                title={t("share_whatsapp_title", "Share via WhatsApp")}
              >
                <FaWhatsapp className="w-5 h-5 text-white" />
              </button>

              {/* X / Twitter */}
              <button
                onClick={handleShareTwitter}
                className="w-10 h-10 rounded-xl bg-black hover:bg-slate-900 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-md shadow-black/30 transition-all cursor-pointer border-none"
                title={t("share_x_title", "Share via X / Twitter")}
              >
                <FaXTwitter className="w-4.5 h-4.5 text-white" />
              </button>

              {/* LinkedIn */}
              <button
                onClick={handleShareLinkedIn}
                className="w-10 h-10 rounded-xl bg-[#0A66C2] hover:bg-[#08529c] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-md shadow-[#0A66C2]/30 transition-all cursor-pointer border-none"
                title={t("share_linkedin_title", "Share via LinkedIn")}
              >
                <FaLinkedinIn className="w-5 h-5 text-white" />
              </button>

              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="w-10 h-10 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-md shadow-[#1877F2]/30 transition-all cursor-pointer border-none"
                title={t("share_facebook_title", "Share via Facebook")}
              >
                <FaFacebookF className="w-4.5 h-4.5 text-white" />
              </button>

              {/* Email */}
              <button
                onClick={handleShareEmail}
                className="w-10 h-10 rounded-xl bg-[#EA4335] hover:bg-[#d3382b] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-md shadow-[#EA4335]/30 transition-all cursor-pointer border-none"
                title={t("share_email_title", "Share via Email")}
              >
                <FaEnvelope className="w-4.5 h-4.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Referral Activity Notification Tracker Box */}
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm text-left rtl:text-right select-none font-sans">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-sm shadow-emerald-600/25">
          <FiZap />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-2">
              <span>{t("referral_tracker_title", "Referral Tracker & Status Activity")}</span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {t("registered_waiting_setup", "{count} Registered (Waiting for Setup)").replace("{count}", String(pendingCount))}
                </span>
              )}
            </h4>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {t("payouts_unlocked_label", "{count} Payouts Unlocked").replace("{count}", String(activeCount))}
            </span>
          </div>

          {data?.referred_users && data.referred_users.length > 0 ? (
            <p className="text-xs font-semibold text-emerald-900 leading-relaxed">
              {t("invited_friends_count_msg", "You have {count} friend(s) registered using your referral link!").replace("{count}", String(data.referred_users.length))}{" "}
              {pendingCount > 0 ? (
                <span>
                  {t("invited_friends_pending_msg", "{count} friend(s) signed in and waiting to complete their first project milestone or gig purchase to clear your {reward} wallet reward.").replace("{count}", String(pendingCount)).replace("{reward}", "$" + (data?.max_referrer_reward ?? 10.00).toFixed(2))}
                </span>
              ) : (
                <span>{t("all_friends_completed_msg", "All registered friends have completed setup & unlocked wallet payouts!")}</span>
              )}
            </p>
          ) : (
            <p className="text-xs font-semibold text-emerald-900 leading-relaxed">
              {t("how_tracking_works_msg", "When a friend registers with your link, they immediately appear in your Invited Friends list as 'Signed Up (Pending Setup)'. Once they complete their first transaction, your {reward} payout is automatically sent to your wallet!").replace("{reward}", "$" + (data?.max_referrer_reward ?? 10.00).toFixed(2))}
            </p>
          )}
        </div>
      </div>

      {/* Metrics Row - Continuous Unified Bar Divided by Clean Vertical Lines */}
      <div className="bg-white border border-slate-200 rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 grid grid-cols-1 sm:grid-cols-3 shadow-xs font-sans">
        {/* Total Invited */}
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-teal-600/20 shrink-0 font-bold">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t("total_invited_label", "Total Invited")}</span>
            <span className="text-2xl font-black text-slate-900 leading-none mt-1 block">
              {data?.referred_users.length || 0}
            </span>
          </div>
        </div>

        {/* Active Referrals */}
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-600/20 shrink-0 font-bold">
            <FiAward className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t("active_referrals_label", "Active Referrals")}</span>
            <span className="text-2xl font-black text-slate-900 leading-none mt-1 block">
              {activeCount}
            </span>
            <span className="text-[9px] font-bold text-slate-400 block mt-0.5">{t("pending_transaction_count", "{count} pending first transaction").replace("{count}", String(pendingCount))}</span>
          </div>
        </div>

        {/* Total Earned */}
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20 shrink-0 font-bold">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t("total_earned_label", "Total Earned")}</span>
            <span className="text-2xl font-black text-slate-900 leading-none mt-1 block">
              ${data?.total_earned.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      </div>

      {/* Program details / How it works - Sleek Accent Line Section */}
      <div className="bg-white border-l-4 border-l-teal-600 border border-slate-200/80 p-6 rounded-2xl flex gap-4 shadow-xs font-sans">
        <FiInfo className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-left rtl:text-right flex flex-col gap-2">
          <h4 className="text-sm font-extrabold text-slate-900">{t("how_referral_program_works_title", "How the referral program works")}</h4>
          <ol className="list-decimal pl-4 text-xs font-semibold text-slate-600 leading-relaxed space-y-2">
            <li>{t("referral_step_1", "Copy your referral link above and share it with your professional network.")}</li>
            <li>{t("referral_step_2", "Your friends use the link to register a new account on our platform.")}</li>
            {hasSignupBonus ? (
              <li>{t("referral_step_3_bonus", "Upon registering, they receive a {bonus} signup bonus (pending admin verification & approval) directly into their wallet.").replace("{bonus}", "$" + (data?.signup_bonus ?? 5.00).toFixed(2))}</li>
            ) : (
              <li>{t("referral_step_3_no_bonus", "Upon registering, their account is instantly activated and linked to your referral promoter account.")}</li>
            )}
            <li>{t("referral_step_4", "When they fund their first job milestone, pay for a gig, or clear a contract, you instantly receive a promoter payout reward in your wallet.")}</li>
          </ol>
        </div>
      </div>

      {/* Referred Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm font-sans">
        <div className="px-6 py-4 border-b border-slate-150/70 text-left rtl:text-right bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-855 leading-none">{t("invited_friends_title", "Invited Friends")}</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">{t("invited_friends_desc", "Track registration and transaction status")}</span>
        </div>

        {data?.referred_users && data.referred_users.length > 0 ? (
          <div 
            ref={tableRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`overflow-x-auto w-full select-none cursor-grab active:cursor-grabbing transition-colors ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-100/10 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                  <th className="px-6 py-3.5">{t("table_header_name", "Name")}</th>
                  <th className="px-6 py-3.5">{t("table_header_date", "Registration Date")}</th>
                  <th className="px-6 py-3.5 text-center">{t("table_header_status", "Status")}</th>
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
                      {(() => {
                        const isFullyCompleted = ref.has_purchased || ref.status === "approved" || ref.status === "completed" || ref.status === "purchased";
                        const isOnboarded = ref.is_onboarded || isFullyCompleted;
                        const isExpired = ref.status === "expired";

                        return (
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 select-none">
                            {/* Step 1: Signed Up (Always completed upon registration) */}
                            <div 
                              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-sm shrink-0"
                              title={t("account_registered_tooltip", "Account Registered")}
                            >
                              <FiCheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                              <span>{t("status_signed_up", "Signed Up")}</span>
                            </div>

                            <span className="text-slate-300 font-bold text-xs shrink-0">→</span>

                            {/* Step 2: Onboarded (Solid green background with white text & white checkmark if complete, Muted grey if not) */}
                            <div 
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all shrink-0 ${
                                isOnboarded
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-slate-50 text-slate-400 border border-slate-200"
                              }`}
                              title={isOnboarded ? t("profile_onboarding_completed_tooltip", "Profile Onboarding Completed") : t("pending_profile_onboarding_tooltip", "Pending Profile Onboarding")}
                            >
                              {isOnboarded ? (
                                <FiCheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                              )}
                              <span>{t("status_onboarded", "Onboarded")}</span>
                            </div>

                            <span className="text-slate-300 font-bold text-xs shrink-0">→</span>

                            {/* Step 3: Purchased (Solid green background with white text & white checkmark if complete, Muted grey if not, Rose if expired) */}
                            <div 
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all shrink-0 ${
                                isFullyCompleted
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : isExpired
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-slate-50 text-slate-400 border border-slate-200"
                              }`}
                              title={
                                isFullyCompleted
                                  ? t("purchase_complete_tooltip", "First purchase completed! Bonus paid.")
                                  : isExpired
                                  ? t("purchase_expired_tooltip", "Purchase window expired ({days} days passed)").replace("{days}", String(data?.completion_window_days || 30))
                                  : t("waiting_first_purchase_tooltip", "Waiting for first purchase")
                              }
                            >
                              {isFullyCompleted ? (
                                <>
                                  <FiCheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                                  <span>{t("status_purchased", "Purchased")}</span>
                                </>
                              ) : isExpired ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                  <span>{t("status_expired", "Expired")}</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                  <span>{t("status_purchased", "Purchased")}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
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
              <h4 className="text-sm font-extrabold text-slate-700">{t("no_referrals_title", "No Referrals Yet")}</h4>
              <p className="text-xs text-slate-404 max-w-xs mt-1 leading-relaxed font-semibold">
                {t("no_referrals_desc", "You haven't referred anyone yet. Copy your unique link above and share it with your network to start earning!")}
              </p>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
