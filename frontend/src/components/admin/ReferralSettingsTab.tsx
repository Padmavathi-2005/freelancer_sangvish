"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect, useCallback } from "react";
import { FiPlus, FiTrash2, FiSave, FiAlertCircle, FiImage, FiSettings, FiPenTool, FiUpload } from "react-icons/fi";
import { useAdmin } from "@/app/admin/AdminContext";
import CanvasEditor from "@/components/CanvasEditor";

interface ReferralTier {
  min_referrals: number;
  reward: number;
}

interface ReferralSettingsTabProps {
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function ReferralSettingsTab({ handleSaveSetting }: ReferralSettingsTabProps) {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  const [signupBonus, setSignupBonus] = useState<number>(5.00);
  const [enableSignupBonus, setEnableSignupBonus] = useState<boolean>(true);
  const [tiers, setTiers] = useState<ReferralTier[]>([]);
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
              setTiers(Array.isArray(val.tiers) ? val.tiers : []);
              
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



  // Text items editor helpers removed — handled by CanvasEditor component

  // Save Configs
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      // Validate tiers
      for (const tier of tiers) {
        if (isNaN(tier.min_referrals) || tier.min_referrals < 1) {
          setError("Minimum referrals must be a positive integer.");
          setSaving(false);
          return;
        }
        if (isNaN(tier.reward) || tier.reward < 0) {
          setError("Reward amount must be a positive number.");
          setSaving(false);
          return;
        }
      }

      const sortedTiers = [...tiers].sort((a, b) => a.min_referrals - b.min_referrals);

      const payload = {
        signup_bonus: signupBonus,
        enable_signup_bonus: enableSignupBonus,
        tiers: sortedTiers,
        banner_headline: bannerHeadline,
        banner_subline: bannerSubline,
        banner_bg_color: bannerBgColor,
        banner_accent_color: bannerAccentColor,
        banner_image_url: bannerImageUrl, // Custom designed PNG (if any). Else backend serves SVG.
      };

      await handleSaveSetting("referral_settings", payload, "referral");
      triggerToast("Settings Saved", "Referral configurations saved successfully.");
      setTiers(sortedTiers);
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


  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 min-h-[250px]">
        <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSave} className={`rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col gap-6 text-left relative border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-xl shadow-2xl flex flex-col gap-1 z-50 animate-slideIn">
          <span className="text-xs font-black text-teal-400">{toastTitle}</span>
          <span className="text-[11px] font-semibold text-slate-300">{toastText}</span>
        </div>
      )}

      <div className={`border-b pb-4 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-base font-black ${isDark ? "text-slate-100" : "text-slate-800"}`}>Refer & Earn Configuration</h3>
        <p className={`text-[11px] font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Configure sign-up rewards and tiered promoter bonuses based on referral volumes</p>
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
          Sign-up Bonus settings
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
            Enable Referred Sign-up Bonus
          </label>
        </div>

        {enableSignupBonus && (
          <div className="flex flex-col gap-1.5 animate-fadeIn mt-2">
            <label className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Referred User Sign-up Bonus ($)</label>
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
            <span className={`text-[9px] font-semibold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Amount credited to referred user's wallet after admin review and approval</span>
          </div>
        )}
      </div>

      {/* Row 2: Referrer Tiers Grid (Boxed) */}
      <div className={`p-5 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/50 border-slate-200/80"} flex flex-col gap-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150/20 pb-3.5">
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}>Promoter Payout Tiers</h4>
            <p className={`text-[10px] font-bold mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Determine how much referrers earn based on successful referral counts</p>
          </div>
          <button
            type="button"
            onClick={handleAddTier}
            className="flex items-center gap-1.5 px-3 py-2 border border-teal-200 bg-teal-50 text-teal-750 text-[10px] font-black uppercase rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-all cursor-pointer border-none"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Add Payout Rule
          </button>
        </div>

        {tiers.length > 0 ? (
          <div className={`border rounded-xl overflow-hidden ${isDark ? "border-slate-800" : "border-slate-150/80"}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[9px] font-black uppercase tracking-widest select-none ${isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-150/70 text-slate-400"}`}>
                  <th className="px-5 py-3">Min Successful Referrals</th>
                  <th className="px-5 py-3">Referrer Payout Amount ($)</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, idx) => (
                  <tr key={idx} className={`border-b last:border-0 transition ${isDark ? "border-slate-800 hover:bg-slate-950/40 text-slate-300" : "border-slate-100 hover:bg-slate-50/50 text-slate-750"}`}>
                    <td className="px-5 py-3.5">
                      <input
                        type="number"
                        min="1"
                        required
                        value={tier.min_referrals}
                        onChange={(e) => handleUpdateTierField(idx, "min_referrals", parseInt(e.target.value) || 0)}
                        className={`border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-700 w-32 ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                        }`}
                        placeholder="e.g. 1"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={tier.reward}
                        onChange={(e) => handleUpdateTierField(idx, "reward", parseFloat(e.target.value) || 0)}
                        className={`border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-700 w-32 ${
                          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                        }`}
                        placeholder="e.g. 10.00"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right">
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
            No referral payout tiers configured. Promoters will fall back to a default payout of $10.00.
          </div>
        )}
      </div>

      {/* Row 3: Promo Banner Customizer Mode Selector */}
      <div className={`flex flex-col gap-4 border-t pt-6 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <div>
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-extrabold">Promo Banner Customizer</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Use the Dynamic SVG Template below for quick edits, or open the Canvas Designer to create a fully custom banner image.</p>
        </div>

        {/* Form Section: SVG Template settings */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/30 border-slate-150"
        }`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Banner Headline</label>
              <input
                type="text"
                required
                value={bannerHeadline}
                onChange={(e) => setBannerHeadline(e.target.value)}
                className={`border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-700 transition ${
                  isDark ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                }`}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Banner Subline</label>
              <textarea
                rows={3}
                required
                value={bannerSubline}
                onChange={(e) => setBannerSubline(e.target.value)}
                className={`border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-teal-700 transition resize-none ${
                  isDark ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bannerBgColor}
                    onChange={(e) => setBannerBgColor(e.target.value)}
                    className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bannerBgColor}
                    onChange={(e) => setBannerBgColor(e.target.value)}
                    className={`border rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none w-full ${
                      isDark ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                    }`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Accent Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bannerAccentColor}
                    onChange={(e) => setBannerAccentColor(e.target.value)}
                    className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bannerAccentColor}
                    onChange={(e) => setBannerAccentColor(e.target.value)}
                    className={`border rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none w-full ${
                      isDark ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Real-time Banner Preview</span>
            <div className={`border rounded-xl overflow-hidden shadow-inner p-2 flex items-center justify-center min-h-[220px] ${
              isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-100"
            }`}>
              <img
                src={`${API_URL.replace("/api", "")}/api/users/referral/banner.svg?t=${previewToken}`}
                alt="Referral Dynamic Banner Preview"
                className="w-full h-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold text-right">Preview updates automatically when you save changes.</span>
          </div>
        </div>
      </div>

      {/* ── Canvas Designer Section ──────────────────────────────────────── */}
      <div className={`flex flex-col gap-4 border-t pt-6 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
        <div>
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <FiPenTool className="w-3.5 h-3.5" /> Custom Banner Designer
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">
            Design a fully custom promo banner — drag text, images, shapes, set fonts &amp; colors — then export as PNG.
          </p>
        </div>

        <div className="flex items-start gap-3 flex-wrap">
          {/* Open editor button */}
          <button
            type="button"
            onClick={() => setShowCanvasEditor(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-teal-700/20 transition-all cursor-pointer border-0"
          >
            <FiPenTool className="w-3.5 h-3.5" />
            Open Canvas Designer
          </button>

          {/* Direct image upload button */}
          <label className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-xl border transition-all cursor-pointer select-none ${
            isDark
              ? "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80"
          }`}>
            {uploadingDirect ? (
              <div className="w-3.5 h-3.5 border-2 border-t-transparent border-teal-750 rounded-full animate-spin" />
            ) : (
              <FiUpload className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Upload Image Directly</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingDirect}
              onChange={handleDirectBannerUpload}
            />
          </label>
        </div>

          {/* Preview of existing custom banner */}
          {bannerImageUrl && (
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Current Custom Banner</span>
              <div className="flex items-start gap-3">
                <img
                  src={bannerImageUrl}
                  alt="Custom Banner"
                  className={`h-16 w-auto rounded-lg border shadow-sm object-cover ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setBannerImageUrl("")}
                  className="text-[9px] font-black text-rose-500 hover:underline mt-1"
                >
                  Remove custom banner
                </button>
              </div>
              <span className="text-[9px] text-teal-600 font-semibold">✓ This PNG will be served as the promo banner on user dashboards.</span>
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
          {saving ? "Saving Changes..." : "Save Referral Configurations"}
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
