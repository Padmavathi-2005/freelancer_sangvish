"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect, useCallback } from "react";
import { FiPlus, FiTrash2, FiSave, FiAlertCircle, FiImage, FiSettings, FiPenTool, FiUpload, FiCheckCircle } from "react-icons/fi";
import { useAdmin } from "@/app/admin/AdminContext";
import { useLanguage } from "@/context/LanguageContext";
import CanvasEditor from "@/components/CanvasEditor";

interface ReferralTier {
  min_referrals: number;
  reward: number;
}

interface ReferralSettingsTabProps {
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function ReferralSettingsTab({ handleSaveSetting }: ReferralSettingsTabProps) {
  const { t, direction } = useLanguage();
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  const [signupBonus, setSignupBonus] = useState<number>(5.00);
  const [enableSignupBonus, setEnableSignupBonus] = useState<boolean>(true);
  const [completionWindowDays, setCompletionWindowDays] = useState<number>(30);

  // Approval requirement toggles (Auto-credit vs Manual Admin Approval)
  const [requireSignupBonusApproval, setRequireSignupBonusApproval] = useState<boolean>(true);
  const [requireReferralRewardApproval, setRequireReferralRewardApproval] = useState<boolean>(true);
  const [requireAffiliateApproval, setRequireAffiliateApproval] = useState<boolean>(true);

  const [tiers, setTiers] = useState<ReferralTier[]>([]);
  const [affiliateTiers, setAffiliateTiers] = useState<ReferralTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Dynamic SVG banner details
  const [bannerHeadline, setBannerHeadline] = useState<string>("Invite Friends & Earn");
  const [bannerSubline, setBannerSubline] = useState<string>("Share your referral link. They get a bonus on sign-up, you get paid when they complete transactions!");
  const [bannerBgColor, setBannerBgColor] = useState<string>("#0f172a");
  const [bannerAccentColor, setBannerAccentColor] = useState<string>("#0d9488");
  const [previewToken, setPreviewToken] = useState<number>(Date.now());

  // Canvas editor
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState<string>("");
  const [uploadingDirect, setUploadingDirect] = useState(false);

  const handleDirectBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDirect(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setBannerImageUrl(data.url);
      triggerToast("Banner Uploaded!", "Your banner image has been uploaded successfully.");
    } catch (err: any) {
      console.error("Direct banner upload error:", err);
      setError(err.message || "Failed to upload banner image.");
    } finally {
      setUploadingDirect(false);
    }
  };

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState("Settings Saved");
  const [toastText, setToastText] = useState("Referral program settings updated successfully.");

  const triggerToast = (title: string, text: string) => {
    setToastTitle(title);
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Fetch settings from server
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const data = await res.json();
          const referralSet = data.find((s: any) => s.setting_key === "referral_settings");
          if (referralSet) {
            let val = referralSet.setting_value;
            if (typeof val === "string") {
              val = JSON.parse(val);
            }
            if (val) {
              setSignupBonus(val.signup_bonus !== undefined ? parseFloat(val.signup_bonus) : 5.00);
              setEnableSignupBonus(val.enable_signup_bonus !== undefined ? val.enable_signup_bonus === true || val.enable_signup_bonus === "true" : true);
              setCompletionWindowDays(val.completion_window_days !== undefined ? parseInt(val.completion_window_days) || 30 : 30);
              
              setRequireSignupBonusApproval(val.require_signup_bonus_approval !== undefined ? val.require_signup_bonus_approval === true || val.require_signup_bonus_approval === "true" : true);
              setRequireReferralRewardApproval(val.require_referral_reward_approval !== undefined ? val.require_referral_reward_approval === true || val.require_referral_reward_approval === "true" : true);
              setRequireAffiliateApproval(val.require_affiliate_approval !== undefined ? val.require_affiliate_approval === true || val.require_affiliate_approval === "true" : true);

              setTiers(Array.isArray(val.tiers) ? val.tiers : []);
              setAffiliateTiers(Array.isArray(val.affiliate_tiers) ? val.affiliate_tiers : []);
              
              setBannerHeadline(val.banner_headline || "Invite Friends & Earn");
              setBannerSubline(val.banner_subline || "Share your referral link with friends...");
              setBannerBgColor(val.banner_bg_color || "#0f172a");
              setBannerAccentColor(val.banner_accent_color || "#0d9488");
              setBannerImageUrl(val.banner_image_url || "");
            }
          }
        } else {
          setError("Failed to fetch settings from server.");
        }
      } catch (err) {
        console.error("Error fetching referral settings:", err);
        setError("Network error. Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Canvas editor save: receives base64 PNG dataUrl, uploads it, stores URL
  const handleCanvasSave = useCallback(async (dataUrl: string) => {
    try {
      const blobRes = await fetch(dataUrl);
      const blob = await blobRes.blob();
      const file = new File([blob], "referral_banner.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setBannerImageUrl(data.url);
      setShowCanvasEditor(false);
      triggerToast("Banner Created!", "Your custom design was exported and saved successfully.");
    } catch (err: any) {
      console.error("Canvas upload error:", err);
      setError(err.message || "Failed to upload banner image.");
      setShowCanvasEditor(false);
    }
  }, []);

  // Save Configs
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      // Validate referral tiers
      for (const tier of tiers) {
        if (isNaN(tier.min_referrals) || tier.min_referrals < 1) {
          setError("Minimum referrals in Referral Payout Tiers must be a positive integer.");
          setSaving(false);
          return;
        }
        if (isNaN(tier.reward) || tier.reward < 0) {
          setError("Reward amount in Referral Payout Tiers must be a positive number.");
          setSaving(false);
          return;
        }
      }

      // Validate affiliate tiers
      for (const tier of affiliateTiers) {
        if (isNaN(tier.min_referrals) || tier.min_referrals < 1) {
          setError("Minimum conversions in Affiliate Payout Tiers must be a positive integer.");
          setSaving(false);
          return;
        }
        if (isNaN(tier.reward) || tier.reward < 0) {
          setError("Reward amount in Affiliate Payout Tiers must be a positive number.");
          setSaving(false);
          return;
        }
      }

      const sortedTiers = [...tiers].sort((a, b) => a.min_referrals - b.min_referrals);
      const sortedAffiliateTiers = [...affiliateTiers].sort((a, b) => a.min_referrals - b.min_referrals);

      const payload = {
        signup_bonus: signupBonus,
        enable_signup_bonus: enableSignupBonus,
        completion_window_days: completionWindowDays,
        require_signup_bonus_approval: requireSignupBonusApproval,
        require_referral_reward_approval: requireReferralRewardApproval,
        require_affiliate_approval: requireAffiliateApproval,
        tiers: sortedTiers,
        affiliate_tiers: sortedAffiliateTiers,
        banner_headline: bannerHeadline,
        banner_subline: bannerSubline,
        banner_bg_color: bannerBgColor,
        banner_accent_color: bannerAccentColor,
        banner_image_url: bannerImageUrl,
      };

      await handleSaveSetting("referral_settings", payload, "referral");
      triggerToast("Settings Saved", "Referral & Affiliate configurations saved successfully.");
      setTiers(sortedTiers);
      setAffiliateTiers(sortedAffiliateTiers);
      setPreviewToken(Date.now());
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save configuration settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTier = () => {
    setTiers([...tiers, { min_referrals: 1, reward: 10.00 }]);
  };

  const handleRemoveTier = (idx: number) => {
    const nextTiers = [...tiers];
    nextTiers.splice(idx, 1);
    setTiers(nextTiers);
  };

  const handleUpdateTierField = (idx: number, field: keyof ReferralTier, value: number) => {
    const nextTiers = [...tiers];
    nextTiers[idx] = { ...nextTiers[idx], [field]: value };
    setTiers(nextTiers);
  };

  const handleAddAffiliateTier = () => {
    setAffiliateTiers([...affiliateTiers, { min_referrals: 1, reward: 10.00 }]);
  };

  const handleRemoveAffiliateTier = (idx: number) => {
    const nextTiers = [...affiliateTiers];
    nextTiers.splice(idx, 1);
    setAffiliateTiers(nextTiers);
  };

  const handleUpdateAffiliateTierField = (idx: number, field: keyof ReferralTier, value: number) => {
    const nextTiers = [...affiliateTiers];
    nextTiers[idx] = { ...nextTiers[idx], [field]: value };
    setAffiliateTiers(nextTiers);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 min-h-[250px]">
        <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSave} className={`rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col gap-6 text-left rtl:text-right relative border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`} dir={direction?.toLowerCase()}>
      
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 z-50 animate-slideIn border ${
          isDark 
            ? "bg-slate-900 border-teal-500/40 text-white shadow-teal-950/40" 
            : "bg-teal-900 border-teal-700/80 text-white shadow-teal-900/30"
        }`}>
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
            <FiCheckCircle className="w-4 h-4 text-teal-300" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-teal-200 tracking-wide">{toastTitle}</span>
            <span className="text-[11px] font-semibold text-slate-100">{toastText}</span>
          </div>
        </div>
      )}

      <div className={`border-b pb-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-black ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t("admin_ref_title", "Refer & Earn Configuration")}</h3>
        <p className={`text-[11px] font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("admin_ref_subtitle", "Configure sign-up rewards and tiered promoter bonuses based on referral volumes")}</p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-800 border border-rose-100 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Referred Sign-up reward configuration (Boxed) */}
      <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/80"} flex flex-col gap-4 max-w-2xl`}>
        <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          {t("admin_ref_signup_title", "Sign-up Bonus settings")}
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enableSignupBonus"
            checked={enableSignupBonus}
            onChange={(e) => setEnableSignupBonus(e.target.checked)}
            className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
          />
          <label htmlFor="enableSignupBonus" className={`text-xs font-extrabold cursor-pointer ${isDark ? "text-slate-200" : "text-slate-800"}`}>
            {t("admin_ref_enable_signup", "Enable Referred Sign-up Bonus")}
          </label>
        </div>

        {enableSignupBonus && (
          <div className="flex flex-col gap-1.5 animate-fadeIn mt-2">
            <label className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("admin_ref_referred_user_bonus", "Referred User Sign-up Bonus ($)")}</label>
            <input
              type="number"
              step="0.01"
              required
              value={signupBonus}
              onChange={(e) => setSignupBonus(parseFloat(e.target.value) || 0)}
              className={`border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-700 transition max-w-xs ${
                isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
              }`}
            />
            <span className={`text-[9px] font-semibold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("admin_ref_referred_user_bonus_desc", "Amount credited to referred user's wallet after admin review and approval")}</span>
          </div>
        )}

        {/* Referral Purchase Completion Window (Days) */}
        <div className="flex flex-col gap-1.5 border-t pt-3.5 mt-1">
          <label className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {t("admin_ref_purchase_window", "Referral Purchase Window (Days)")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              required
              value={completionWindowDays}
              onChange={(e) => setCompletionWindowDays(parseInt(e.target.value) || 1)}
              className={`border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-teal-700 transition w-32 ${
                isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
              }`}
            />
            <span className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>{t("admin_ref_days_from_reg", "Days from Registration")}</span>
          </div>
          <span className={`text-[9px] font-semibold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {t("admin_ref_purchase_window_desc", "Referred friends must complete their first project milestone or gig purchase within this number of days. If exceeded, the referral is marked unsuccessful and reward payout is forfeited.")}
          </span>
        </div>

      </div>

      {/* Row 2: Approval Requirement Toggles (Auto-Credit vs Manual Admin Approval) */}
      <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/80"} flex flex-col gap-4 max-w-2xl`}>
        <div className="flex items-center gap-2">
          <FiSettings className="w-4 h-4 text-teal-600" />
          <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {t("admin_ref_payout_requirements", "Payout Approval Requirements & Auto-Credit Workflow")}
          </h4>
        </div>
        <p className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {t("admin_ref_payout_requirements_desc", "Choose whether payouts require manual admin approval or get automatically credited into active wallet balances instantly.")}
        </p>

        <div className="flex flex-col gap-3.5 mt-1">
          
          {/* Toggle 1: Sign-Up Bonus Approval */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{t("admin_ref_require_signup_approval", "🎁 Require Admin Approval for Sign-Up Bonus")}</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {requireSignupBonusApproval
                  ? t("admin_ref_require_signup_approval_enabled", "ENABLED: Sign-up bonuses ($2.00) are logged as Pending Admin Approval.")
                  : t("admin_ref_require_signup_approval_disabled", "DISABLED (AUTO-CREDIT): Sign-up bonuses ($2.00) are credited automatically to user active wallet balance immediately upon onboarding setup.")}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={requireSignupBonusApproval}
                onChange={(e) => setRequireSignupBonusApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Toggle 2: Referral Promoter Reward Approval */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{t("admin_ref_require_rewards_approval", "💰 Require Admin Approval for Referral Rewards")}</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {requireReferralRewardApproval
                  ? t("admin_ref_require_rewards_approval_enabled", "ENABLED: Referral promoter rewards require admin approval before wallet release.")
                  : t("admin_ref_require_rewards_approval_disabled", "DISABLED (AUTO-CREDIT): Referral promoter rewards are credited automatically to referrer active wallet balance upon first completed order.")}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={requireReferralRewardApproval}
                onChange={(e) => setRequireReferralRewardApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {/* Toggle 3: Affiliate Commission Approval */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{t("admin_ref_require_aff_approval", "⚡ Require Admin Approval for Affiliate Commissions")}</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {requireAffiliateApproval
                  ? t("admin_ref_require_aff_approval_enabled", "ENABLED: Affiliate commissions require admin approval before wallet release.")
                  : t("admin_ref_require_aff_approval_disabled", "DISABLED (AUTO-CREDIT): Affiliate commissions are credited automatically to affiliate active wallet balance immediately upon earning.")}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={requireAffiliateApproval}
                onChange={(e) => setRequireAffiliateApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

        </div>
      </div>

      {/* Row 2: Referrer Tiers Grid (Boxed) */}
      <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/80"} flex flex-col gap-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150/20 pb-3.5">
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t("admin_ref_promoter_payout_tiers", "Referral Promoter Payout Tiers")}</h4>
            <p className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("admin_ref_promoter_payout_tiers_desc", "Determine how much referrers earn based on successful referral counts")}</p>
          </div>
          <button
            type="button"
            onClick={handleAddTier}
            className="flex items-center gap-1.5 px-3 py-2 border border-teal-200 bg-teal-50 text-teal-750 text-[10px] font-black uppercase rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-all cursor-pointer border-none"
          >
            <FiPlus className="w-3.5 h-3.5" />
            {t("admin_ref_add_rule_btn", "Add Referral Payout Rule")}
          </button>
        </div>

        {tiers.length > 0 ? (
          <div className={`border rounded-xl overflow-x-auto min-w-0 max-w-full ${isDark ? "border-slate-800" : "border-slate-150/80"}`}>
            <table className="w-full text-left border-collapse min-w-[450px]">
              <thead>
                <tr className={`border-b text-[9px] font-black uppercase tracking-widest select-none ${isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-150/70 text-slate-400"}`}>
                  <th className="px-4 sm:px-5 py-3 whitespace-nowrap">{t("admin_ref_th_min_referrals", "Min Successful Referrals")}</th>
                  <th className="px-4 sm:px-5 py-3 whitespace-nowrap">{t("admin_ref_th_payout_amount", "Referrer Payout Amount ($)")}</th>
                  <th className="px-4 sm:px-5 py-3 text-right whitespace-nowrap">{t("admin_ref_actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, idx) => (
                  <tr key={idx} className={`border-b last:border-0 transition ${isDark ? "border-slate-800 hover:bg-slate-950/40 text-slate-300" : "border-slate-100 hover:bg-slate-50/50 text-slate-750"}`}>
                    <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                      <input
                        type="number"
                        min="1"
                        required
                        value={tier.min_referrals}
                        onChange={(e) => handleUpdateTierField(idx, "min_referrals", parseInt(e.target.value) || 0)}
                        className={`border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-700 w-28 sm:w-32 ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                        }`}
                        placeholder="e.g. 1"
                      />
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={tier.reward}
                        onChange={(e) => handleUpdateTierField(idx, "reward", parseFloat(e.target.value) || 0)}
                        className={`border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-700 w-28 sm:w-32 ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                        }`}
                        placeholder="e.g. 10.00"
                      />
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer border-none bg-transparent ${isDark ? "text-rose-400 hover:bg-rose-950/20" : "text-rose-500 hover:bg-rose-50"}`}
                        title="Delete tier"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`border border-dashed rounded-xl p-8 text-center text-xs font-semibold ${isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
            {t("admin_ref_no_tiers", "No referral payout tiers configured. Promoters will fall back to a default payout of $10.00.")}
          </div>
        )}
      </div>

      {/* Row 3: Affiliate Tiers Grid (Boxed) */}
      <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/80"} flex flex-col gap-4 min-w-0 max-w-full`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150/20 pb-3.5">
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t("admin_ref_aff_payout_tiers", "Affiliate Promoter Payout Tiers")}</h4>
            <p className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("admin_ref_aff_payout_tiers_desc", "Determine the percentage (%) affiliates earn from the product / order price based on successful conversions")}</p>
          </div>
          <button
            type="button"
            onClick={handleAddAffiliateTier}
            className="flex items-center gap-1.5 px-3 py-2 border border-teal-200 bg-teal-50 text-teal-750 text-[10px] font-black uppercase rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-all cursor-pointer border-none"
          >
            <FiPlus className="w-3.5 h-3.5" />
            {t("admin_ref_add_aff_rule_btn", "Add Affiliate Payout Rule")}
          </button>
        </div>

        {affiliateTiers.length > 0 ? (
          <>
            <div className={`border rounded-xl overflow-x-auto min-w-0 max-w-full ${isDark ? "border-slate-800" : "border-slate-150/80"}`}>
              <table className="w-full text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className={`border-b text-[9px] font-black uppercase tracking-widest select-none ${isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-150/70 text-slate-400"}`}>
                    <th className="px-4 sm:px-5 py-3 whitespace-nowrap">{t("admin_ref_th_min_conversions", "Min Successful Conversions")}</th>
                    <th className="px-4 sm:px-5 py-3 whitespace-nowrap">{t("admin_ref_th_commission_rate", "Affiliate Commission Rate (%)")}</th>
                    <th className="px-4 sm:px-5 py-3 text-right whitespace-nowrap">{t("admin_ref_actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliateTiers.map((tier, idx) => (
                    <tr key={idx} className={`border-b last:border-0 transition ${isDark ? "border-slate-800 hover:bg-slate-950/40 text-slate-300" : "border-slate-100 hover:bg-slate-50/50 text-slate-750"}`}>
                      <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          required
                          value={tier.min_referrals}
                          onChange={(e) => handleUpdateAffiliateTierField(idx, "min_referrals", parseInt(e.target.value) || 0)}
                          className={`border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-700 w-28 sm:w-32 ${
                            isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                          }`}
                          placeholder="e.g. 1"
                        />
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            required
                            value={tier.reward}
                            onChange={(e) => handleUpdateAffiliateTierField(idx, "reward", parseFloat(e.target.value) || 0)}
                            className={`border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-700 w-28 sm:w-32 ${
                              isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                            }`}
                            placeholder="e.g. 10.0"
                          />
                          <span className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>%</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveAffiliateTier(idx)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer border-none bg-transparent ${isDark ? "text-rose-400 hover:bg-rose-950/20" : "text-rose-500 hover:bg-rose-50"}`}
                          title="Delete affiliate tier"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dynamic Product Price Calculation Breakdown Preview */}
            <div className={`p-4 rounded-xl border text-xs font-semibold flex flex-col gap-2 ${isDark ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-teal-50/60 border-teal-100/80 text-slate-700"}`}>
              <span className="font-black text-teal-700 dark:text-teal-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <span>{t("admin_ref_preview_title", "💡 Dynamic Product Price & Payout Preview")}</span>
              </span>
              <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
                {affiliateTiers.map((tierItem, idx) => {
                  const samplePrice = 100;
                  const earnedAmount = (samplePrice * (tierItem.reward || 0)) / 100;
                  return (
                    <div key={idx} className="flex flex-wrap items-center gap-1.5">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {t("admin_ref_preview_tier", "Tier")} {idx + 1} ({tierItem.min_referrals}+ {t("admin_ref_preview_sales", "sales @")} {tierItem.reward}%):
                      </span>
                      <span>
                        {t("admin_ref_preview_for_product", "For a product/order price of")} <strong className="text-teal-700 dark:text-teal-300">$100.00</strong>{t("admin_ref_preview_receives", ", affiliate receives")} <strong className="text-emerald-600 dark:text-emerald-400">${earnedAmount.toFixed(2)}</strong> {t("admin_ref_preview_payout", "payout.")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className={`border border-dashed rounded-xl p-8 text-center text-xs font-semibold ${isDark ? "border-slate-800 text-slate-500" : "border-slate-200 text-slate-400"}`}>
            {t("admin_ref_no_aff_tiers", "No affiliate payout tiers configured. Affiliates will fall back to default payout percentage.")}
          </div>
        )}
      </div>

      {/* Form Action row */}
      <div className={`border-t pt-6 flex justify-end gap-3 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 text-white text-xs font-black uppercase rounded-xl hover:bg-teal-650 hover:shadow-lg hover:shadow-teal-700/15 disabled:opacity-50 transition-all cursor-pointer border-none"
        >
          <FiSave className="w-4 h-4" />
          {saving ? t("admin_ref_saving", "Saving Changes...") : t("admin_ref_save_btn", "Save Referral Configurations")}
        </button>
      </div>

    </form>

    {/* ── Full-screen Canvas Editor overlay ────────────────────────────────── */}
    {showCanvasEditor && (
      <CanvasEditor
        onSave={handleCanvasSave}
        onClose={() => setShowCanvasEditor(false)}
        canvasWidth={800}
        canvasHeight={400}
      />
    )}
    </>
  );
}
