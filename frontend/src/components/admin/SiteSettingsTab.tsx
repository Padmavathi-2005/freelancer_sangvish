"use client";
import { API_URL } from "@/config/api";


import React, { useState, useEffect } from "react";
import CustomSelect from "@/components/CustomSelect";

interface SiteSettingsTabProps {
  platformFee: number;
  setPlatformFee: (v: number) => void;
  autoVetting: boolean;
  setAutoVetting: (v: boolean) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (v: boolean) => void;
  siteTheme: string;
  setSiteTheme: (v: string) => void;
  primaryColor: string;
  setPrimaryColor: (v: string) => void;
  secondaryColor: string;
  setSecondaryColor: (v: string) => void;
  defaultCurrency: string;
  setDefaultCurrency: (v: string) => void;
  defaultLanguage: string;
  setDefaultLanguage: (v: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (v: number) => void;
  enableProposalVetting: boolean;
  setEnableProposalVetting: (v: boolean) => void;
  enableClientVetting: boolean;
  setEnableClientVetting: (v: boolean) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function SiteSettingsTab({
  platformFee,
  setPlatformFee,
  autoVetting,
  setAutoVetting,
  maintenanceMode,
  setMaintenanceMode,
  siteTheme,
  setSiteTheme,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  defaultCurrency,
  setDefaultCurrency,
  defaultLanguage,
  setDefaultLanguage,
  itemsPerPage,
  setItemsPerPage,
  enableProposalVetting,
  setEnableProposalVetting,
  enableClientVetting,
  setEnableClientVetting,
  handleSaveSetting
}: SiteSettingsTabProps) {

  // Local state copies to hold modifications before manual saving
  const [fee, setLocalFee] = useState(platformFee);
  const [theme, setLocalTheme] = useState(siteTheme);
  const [pColor, setLocalPrimaryColor] = useState(primaryColor);
  const [sColor, setLocalSecondaryColor] = useState(secondaryColor);
  const [vetting, setLocalAutoVetting] = useState(autoVetting);
  const [maintenance, setLocalMaintenanceMode] = useState(maintenanceMode);
  const [localCurrency, setLocalCurrency] = useState(defaultCurrency);
  const [localLanguage, setLocalLanguage] = useState(defaultLanguage);
  const [localLimit, setLocalLimit] = useState(itemsPerPage);
  const [proposalVetting, setLocalProposalVetting] = useState(enableProposalVetting);
  const [clientVetting, setLocalClientVetting] = useState(enableClientVetting);

  const [availLanguages, setAvailLanguages] = useState<{ name: string; code: string }[]>([]);
  const [availCurrencies, setAvailCurrencies] = useState<{ name: string; code: string; symbol: string }[]>([]);

  // Site name/logo states
  const [siteName, setSiteName] = useState("Buy2Lancer");
  const [siteLogo, setSiteLogo] = useState("/public/logo.png");
  const [appStoreUrl, setAppStoreUrl] = useState("https://apps.apple.com");
  const [googlePlayUrl, setGooglePlayUrl] = useState("https://play.google.com");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com");

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [toastTitle, setToastTitle] = useState("Settings Saved");
  const [toastText, setToastText] = useState("Platform configuration updated successfully.");

  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploading(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }
      
      const data = await res.json();
      setSiteLogo(data.url);
      triggerToast("Upload Success", "Site logo image uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      triggerToast("Upload Failed", err.message || "Could not upload logo.");
    } finally {
      setUploading(false);
    }
  };

  const triggerToast = (title: string, text: string) => {
    setToastTitle(title);
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Sync state if props change when fetched initially
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const langRes = await fetch(`${API_URL}/languages/active`);
        if (langRes.ok) setAvailLanguages(await langRes.json());
        
        const currRes = await fetch(`${API_URL}/admin/currencies`);
        if (currRes.ok) setAvailCurrencies(await currRes.json());

        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
            const data = await settingsRes.json();
            const rawSite = data.find((s: any) => s.setting_key === "site_settings")?.setting_value;

            const parseVal = (val: any) => {
              if (typeof val === "string") {
                try {
                  return JSON.parse(val);
                } catch (e) {
                  console.error("Failed to parse settings value:", e);
                }
              }
              return val || {};
            };

            const site = parseVal(rawSite);

            if (site.site_name) setSiteName(site.site_name);
            if (site.site_logo) setSiteLogo(site.site_logo);

            const rawAppStore = data.find((s: any) => s.setting_key === "app_store_url")?.setting_value;
            const rawGooglePlay = data.find((s: any) => s.setting_key === "google_play_url")?.setting_value;
            const rawInstagram = data.find((s: any) => s.setting_key === "instagram_url")?.setting_value;
            const rawLinkedin = data.find((s: any) => s.setting_key === "linkedin_url")?.setting_value;

            if (rawAppStore) setAppStoreUrl(rawAppStore);
            if (rawGooglePlay) setGooglePlayUrl(rawGooglePlay);
            if (rawInstagram) setInstagramUrl(rawInstagram);
            if (rawLinkedin) setLinkedinUrl(rawLinkedin);
          }
      } catch (e) {
        console.error("Failed to load settings options", e);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    setLocalFee(platformFee);
  }, [platformFee]);

  useEffect(() => {
    setLocalTheme(siteTheme);
  }, [siteTheme]);

  useEffect(() => {
    setLocalPrimaryColor(primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    setLocalSecondaryColor(secondaryColor);
  }, [secondaryColor]);

  useEffect(() => {
    setLocalAutoVetting(autoVetting);
  }, [autoVetting]);

  useEffect(() => {
    setLocalMaintenanceMode(maintenanceMode);
  }, [maintenanceMode]);

  useEffect(() => {
    setLocalCurrency(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    setLocalLanguage(defaultLanguage);
  }, [defaultLanguage]);

  useEffect(() => {
    setLocalLimit(itemsPerPage);
  }, [itemsPerPage]);

  useEffect(() => {
    setLocalProposalVetting(enableProposalVetting);
  }, [enableProposalVetting]);

  useEffect(() => {
    setLocalClientVetting(enableClientVetting);
  }, [enableClientVetting]);

  // Bulk manual save action for Site Settings
  const handleBulkSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setShowToast(false);

    try {
      // 1. Save settings to DB
      await handleSaveSetting("platform_fee", { fee }, "site_settings");
      await handleSaveSetting("theme", { theme }, "site_settings");
      await handleSaveSetting("primary_color", { color: pColor }, "site_settings");
      await handleSaveSetting("secondary_color", { color: sColor }, "site_settings");
      await handleSaveSetting("auto_vetting", { enabled: vetting }, "site_settings");
      await handleSaveSetting("enable_proposal_vetting", { enabled: proposalVetting }, "site_settings");
      await handleSaveSetting("enable_client_vetting", clientVetting, "site_settings");
      await handleSaveSetting("maintenance_mode", { enabled: maintenance }, "site_settings");
      await handleSaveSetting("default_currency", { code: localCurrency }, "site_settings");
      await handleSaveSetting("default_language", { code: localLanguage }, "site_settings");
      await handleSaveSetting("pagination_limit", { limit: localLimit }, "site_settings");
      await handleSaveSetting("site_settings", { site_name: siteName, site_logo: siteLogo }, "site_settings");
      await handleSaveSetting("app_store_url", appStoreUrl, "site_settings");
      await handleSaveSetting("google_play_url", googlePlayUrl, "site_settings");
      await handleSaveSetting("instagram_url", instagramUrl, "site_settings");
      await handleSaveSetting("linkedin_url", linkedinUrl, "site_settings");

      // 2. Propagate settings to AdminContext global state instantly
      setPlatformFee(fee);
      setSiteTheme(theme);
      setPrimaryColor(pColor);
      setSecondaryColor(sColor);
      setAutoVetting(vetting);
      setMaintenanceMode(maintenance);
      setEnableProposalVetting(proposalVetting);
      setEnableClientVetting(clientVetting);
      setDefaultCurrency(localCurrency);
      setDefaultLanguage(localLanguage);
      setItemsPerPage(localLimit);

      triggerToast("Settings Saved", "Site settings saved successfully!");
      setSaveStatus({ type: "success", text: "✓ Site settings saved successfully!" });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-8 shadow-sm animate-fadeIn text-left">
      
      {/* HEADER SECTION with Save Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-805">Site Visual & System Settings</h3>
          <p className="text-slate-505 text-xs mt-0.5">Control platform fees, themes, custom colors, vetting automations, and system access.</p>
        </div>
        <button
          onClick={handleBulkSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-6 py-3 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Save Success/Error Alert banner */}
      {saveStatus && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition animate-fadeIn ${
          saveStatus.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
            : "bg-rose-50 text-rose-700 border-rose-100"
        }`}>
          {saveStatus.text}
        </div>
      )}

      {/* Service Fee slider */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Platform Escrow Service Fee (%)</h4>
          <p className="text-xs text-slate-505 mt-1">Configure service charge percentages extracted on final payout milestones releases.</p>
        </div>
        
        <div className="w-full md:w-64 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500">Percentage</span>
            <span className="text-teal-700 font-bold">{fee}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={fee}
            onChange={(e) => setLocalFee(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
          />
        </div>
      </div>

      {/* Site Theme configuration */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Site Visual Theme</h4>
          <p className="text-xs text-slate-505 mt-1">Toggle between a premium Light (White) theme and the default dark mode.</p>
        </div>
        
        <CustomSelect
          options={[
            { value: "light", label: "White (Light) Theme" },
            { value: "dark", label: "Vibrant Dark Theme" }
          ]}
          value={theme}
          onChange={(val) => setLocalTheme(val as string)}
          className="w-64"
        />
      </div>

      {/* Site Brand Colors configuration */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Visual Brand Colors</h4>
          <p className="text-xs text-slate-505 mt-1">Customize the primary (base accent) and secondary (complementary accent) brand colors used in the layout.</p>
        </div>
        
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 sm:items-center shrink-0">
          <div className="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[220px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primary Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={pColor}
                onChange={(e) => setLocalPrimaryColor(e.target.value)}
                className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0 overflow-hidden shrink-0"
              />
              <input
                type="text"
                value={pColor}
                onChange={(e) => setLocalPrimaryColor(e.target.value)}
                placeholder="#10b981"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 uppercase focus:outline-none focus:border-teal-700 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[220px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Secondary Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sColor}
                onChange={(e) => setLocalSecondaryColor(e.target.value)}
                className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent p-0 overflow-hidden shrink-0"
              />
              <input
                type="text"
                value={sColor}
                onChange={(e) => setLocalSecondaryColor(e.target.value)}
                placeholder="#06b6d4"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 uppercase focus:outline-none focus:border-teal-700 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Site settings: Name & Logo */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800 font-sans">Site Identity</h4>
          <p className="text-xs text-slate-505 mt-1">Configure the platform name and logo path used across messages, notifications, and emails.</p>
        </div>
        
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 sm:items-center shrink-0">
          <div className="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[220px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Site Name</span>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Buy2Lancer"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-700 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[220px]">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Site Logo</span>
            <div className="flex items-center gap-3">
              {siteLogo && (
                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                  <img src={siteLogo.startsWith("/") && !siteLogo.startsWith("/public") ? `https://freelancer.sangvish.com${siteLogo}` : siteLogo} className="w-full h-full object-contain" alt="Logo Preview" />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-1">
                <label className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-4 py-2 text-center rounded-xl text-[10px] font-black uppercase text-slate-700 cursor-pointer transition flex items-center justify-center gap-2">
                  {uploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-teal-700 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Upload Logo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={siteLogo}
                  onChange={(e) => setSiteLogo(e.target.value)}
                  placeholder="/public/logo.png"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-[9px] font-mono text-slate-500 focus:outline-none focus:border-teal-700 transition mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto vetting toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800 font-sans">Auto-Approve Freelancer Profiles</h4>
          <p className="text-xs text-slate-505 mt-1">When enabled, new freelancer accounts are automatically approved upon completing onboarding, bypassing the admin review queue.</p>
        </div>
        
        <button
          onClick={() => setLocalAutoVetting(!vetting)}
          className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
            vetting ? "bg-teal-700" : "bg-slate-200"
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            vetting ? "translate-x-5.5" : "translate-x-0"
          }`} />
        </button>
      </div>

      {/* Proposal vetting toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800 font-sans">Review Freelancer Proposals</h4>
          <p className="text-xs text-slate-505 mt-1">When enabled, all proposals submitted by freelancers must be reviewed and approved by an administrator before they are visible to clients.</p>
        </div>
        
        <button
          onClick={() => setLocalProposalVetting(!proposalVetting)}
          className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
            proposalVetting ? "bg-teal-700" : "bg-slate-200"
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            proposalVetting ? "translate-x-5.5" : "translate-x-0"
          }`} />
        </button>
      </div>

      {/* Client vetting toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800 font-sans">Review Client Profiles</h4>
          <p className="text-xs text-slate-505 mt-1">When enabled, new client profiles must be reviewed and approved by an administrator before they are permitted to post jobs.</p>
        </div>
        
        <button
          onClick={() => setLocalClientVetting(!clientVetting)}
          className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
            clientVetting ? "bg-teal-700" : "bg-slate-200"
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            clientVetting ? "translate-x-5.5" : "translate-x-0"
          }`} />
        </button>
      </div>

      {/* Default Currency configuration */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Default Platform Currency</h4>
          <p className="text-xs text-slate-505 mt-1">Select the primary system currency used across dashboards, wallets, and invoices by default.</p>
        </div>
        
        <select
          value={localCurrency}
          onChange={(e) => setLocalCurrency(e.target.value)}
          className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
        >
          {availCurrencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
          {availCurrencies.length === 0 && (
            <option value="USD">US Dollar (USD)</option>
          )}
        </select>
      </div>

      {/* Default Language configuration */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Default Site Language</h4>
          <p className="text-xs text-slate-505 mt-1">Select the primary display translation dictionary loaded for anonymous guests and new signups.</p>
        </div>
        
        <select
          value={localLanguage}
          onChange={(e) => setLocalLanguage(e.target.value)}
          className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition"
        >
          {availLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name} ({l.code})
            </option>
          ))}
          {availLanguages.length === 0 && (
            <option value="EN">English (EN)</option>
          )}
        </select>
      </div>

      {/* Pagination Settings configuration */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Default Pagination Limit</h4>
          <p className="text-xs text-slate-505 mt-1">Configure the global number of records loaded per page across all directory and table listings.</p>
        </div>
        
        <select
          value={localLimit}
          onChange={(e) => setLocalLimit(Number(e.target.value))}
          className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700 transition font-black"
        >
          <option value={3}>3 rows per page</option>
          <option value={5}>5 rows per page</option>
          <option value={10}>10 rows per page</option>
          <option value={20}>20 rows per page</option>
          <option value={50}>50 rows per page</option>
          <option value={100}>100 rows per page</option>
        </select>
      </div>
      
      <div className="border-t border-slate-100 pt-6 mt-2"></div>

      {/* Maintenance mode toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 text-slate-800">
        <div className="max-w-md">
          <h4 className="text-sm font-extrabold text-slate-800">Platform System Maintenance Mode</h4>
          <p className="text-xs text-slate-505 mt-1">Restricts client registrations and contractor job bidding temporarily for structural updates.</p>
        </div>
        
        <button
          onClick={() => setLocalMaintenanceMode(!maintenance)}
          className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
            maintenance ? "bg-rose-500" : "bg-slate-200"
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            maintenance ? "translate-x-5.5" : "translate-x-0"
          }`} />
        </button>
      </div>

      {/* FLOATING SUCCESS TOAST */}
      {showToast && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 animate-slideIn"
          style={{ backgroundColor: "var(--color-primary, #0f766e)", color: "#ffffff" }}
        >
          <span className="text-white font-bold text-base" style={{ color: "#ffffff" }}>✓</span>
          <div className="flex flex-col">
            <span className="text-xs font-black" style={{ color: "#ffffff" }}>{toastTitle}</span>
            <span className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255, 255, 255, 0.9)" }}>{toastText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
