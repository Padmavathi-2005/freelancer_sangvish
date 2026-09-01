"use client";
import { API_URL } from "@/config/api";

import React, { useState, useEffect } from "react";
import CustomSelect from "@/components/CustomSelect";
import { FiSettings } from "react-icons/fi";
import { useAdmin } from "@/app/admin/AdminContext";
import { useLanguage } from "@/context/LanguageContext";

interface GeneralSettingsTabProps {
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
  enableProjectVetting: boolean;
  setEnableProjectVetting: (v: boolean) => void;
  handleSaveSetting: (key: string, value: any, category?: string) => Promise<void>;
}

export default function GeneralSettingsTab({
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
  enableProjectVetting,
  setEnableProjectVetting,
  handleSaveSetting
}: GeneralSettingsTabProps) {
  const { t } = useLanguage();
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

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
  const [projectVetting, setLocalProjectVetting] = useState(enableProjectVetting);

  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState<number>(10.00);

  const [availLanguages, setAvailLanguages] = useState<{ name: string; code: string }[]>([]);
  const [availCurrencies, setAvailCurrencies] = useState<{ name: string; code: string; symbol: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [toastTitle, setToastTitle] = useState(t("admin_settings_saved_title", "Settings Saved"));
  const [toastText, setToastText] = useState(t("admin_settings_saved_desc", "Platform configuration updated successfully."));

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
        
        const currRes = await fetch(`${API_URL}/freelancer/currencies`);
        if (currRes.ok) setAvailCurrencies(await currRes.json());

        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const minWithdrawalSet = settingsData.find((s: any) => s.setting_key === "min_withdrawal_amount");
          if (minWithdrawalSet) {
            let val = minWithdrawalSet.setting_value;
            if (typeof val === "string") { try { val = JSON.parse(val); } catch (e) {} }
            const amount = typeof val === "object" ? parseFloat(val.amount || val.min_withdrawal_amount) : parseFloat(val);
            if (!isNaN(amount) && amount > 0) {
              setMinWithdrawalAmount(amount);
            }
          } else {
            const refSet = settingsData.find((s: any) => s.setting_key === "referral_settings");
            if (refSet) {
              let val = refSet.setting_value;
              if (typeof val === "string") { try { val = JSON.parse(val); } catch (e) {} }
              if (val && val.min_withdrawal_amount !== undefined) {
                setMinWithdrawalAmount(parseFloat(val.min_withdrawal_amount) || 10.00);
              }
            }
          }
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

  // Dynamic preview of the selected colors in real-time
  useEffect(() => {
    import("@/utils/theme").then((mod) => {
      mod.applyTheme(theme, pColor, sColor);
    });
  }, [theme, pColor, sColor]);

  // Clean up on unmount: if they didn't save, revert to actual context values
  useEffect(() => {
    return () => {
      import("@/utils/theme").then((mod) => {
        mod.applyTheme(siteTheme, primaryColor, secondaryColor);
      });
    };
  }, [siteTheme, primaryColor, secondaryColor]);

  // Bulk manual save action for General Settings
  const handleBulkSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    setShowToast(false);

    try {
      await handleSaveSetting("platform_fee", { fee }, "site_settings");
      await handleSaveSetting("theme", { theme }, "site_settings");
      await handleSaveSetting("primary_color", { color: pColor }, "site_settings");
      await handleSaveSetting("secondary_color", { color: sColor }, "site_settings");
      await handleSaveSetting("auto_vetting", { enabled: vetting }, "site_settings");
      await handleSaveSetting("enable_proposal_vetting", { enabled: proposalVetting }, "site_settings");
      await handleSaveSetting("enable_client_vetting", clientVetting, "site_settings");
      await handleSaveSetting("enable_project_vetting", { enabled: projectVetting }, "site_settings");
      await handleSaveSetting("maintenance_mode", { enabled: maintenance }, "site_settings");
      await handleSaveSetting("default_currency", { code: localCurrency }, "site_settings");
      await handleSaveSetting("default_language", { code: localLanguage }, "site_settings");
      await handleSaveSetting("pagination_limit", { limit: localLimit }, "site_settings");
      await handleSaveSetting("min_withdrawal_amount", { amount: minWithdrawalAmount }, "site_settings");

      // Propagate settings to AdminContext global state instantly
      setPlatformFee(fee);
      setSiteTheme(theme);
      setPrimaryColor(pColor);
      setSecondaryColor(sColor);
      setAutoVetting(vetting);
      setMaintenanceMode(maintenance);
      setEnableProposalVetting(proposalVetting);
      setEnableClientVetting(clientVetting);
      setEnableProjectVetting(projectVetting);
      setDefaultCurrency(localCurrency);
      setDefaultLanguage(localLanguage);
      setItemsPerPage(localLimit);

      triggerToast(t("admin_settings_saved_title", "Settings Saved"), t("admin_general_settings_saved_desc", "General settings saved successfully!"));
      setSaveStatus({ type: "success", text: "✓ " + t("admin_general_settings_saved_desc", "General settings saved successfully!") });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (e) {
      setSaveStatus({ type: "error", text: t("admin_settings_save_failed", "Failed to save settings. Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left rtl:text-right border ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
      
      {/* HEADER SECTION with Save Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-slate-805"} text-left rtl:text-right`}>
            <FiSettings className="w-5 h-5 text-slate-500" />
            <span>{t("admin_general_settings_title", "General Visual & System Settings")}</span>
          </h3>
          <p className="text-slate-555 text-xs mt-0.5 font-semibold text-left rtl:text-right">{t("admin_general_settings_desc", "Control platform fees, theme options, currencies, languages, page sizing, and maintenance mode.")}</p>
        </div>
        <button
          onClick={handleBulkSave}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs px-6 py-3 rounded-xl transition duration-150 shadow-sm shrink-0 cursor-pointer border border-teal-600 dark:border-teal-500"
        >
          {saving ? t("admin_saving_btn", "Saving...") : t("admin_save_settings_btn", "Save Settings")}
        </button>
      </div>

      {/* Save Success/Error Alert banner */}
      {saveStatus && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition animate-fadeIn text-left rtl:text-right ${
          saveStatus.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
            : "bg-rose-50 text-rose-700 border-rose-100"
        }`}>
          {saveStatus.text}
        </div>
      )}

      <div className="flex flex-col gap-6 text-left rtl:text-right">
        {/* Service Fee slider */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-850">{t("admin_platform_fee_title", "Platform Escrow Service Fee (%)")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_platform_fee_desc", "Configure service charge percentages extracted on final payout milestones releases.")}</p>
          </div>
          
          <div className="w-full md:w-64 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">{t("admin_percentage_label", "Percentage")}</span>
              <span className="text-teal-700 font-bold">{fee}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={fee}
              onChange={(e) => setLocalFee(Number(e.target.value))}
              className="w-full h-5 bg-transparent appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Minimum Withdrawal Amount configuration */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-850">{t("admin_min_withdrawal_title", "Minimum Withdrawal Amount ($)")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_min_withdrawal_desc", "Minimum wallet balance threshold required before users, freelancers, or affiliates can submit payout withdrawal requests.")}</p>
          </div>
          
          <div className="w-full sm:w-64 flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={minWithdrawalAmount}
              onChange={(e) => setMinWithdrawalAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-700 transition font-bold"
            />
          </div>
        </div>

        {/* Site Theme configuration */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855">{t("admin_site_theme_title", "Site Visual Theme")}</h4>
            <p className="text-xs text-slate-505 mt-1 font-semibold">{t("admin_site_theme_desc", "Toggle between a premium Light (White) theme and the default dark mode.")}</p>
          </div>
          
          <CustomSelect
            options={[
              { value: "light", label: t("admin_site_theme_light", "White (Light) Theme") },
              { value: "dark", label: t("admin_site_theme_dark", "Vibrant Dark Theme") }
            ]}
            value={theme}
            onChange={(val) => setLocalTheme(val as string)}
            className="w-64"
          />
        </div>

        {/* Site Brand Colors configuration */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855">{t("admin_brand_colors_title", "Visual Brand Colors")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_brand_colors_desc", "Customize the primary (base accent) and secondary (complementary accent) brand colors used in the layout.")}</p>
          </div>
          
          <div className="w-full lg:w-auto flex flex-col xl:flex-row gap-5 xl:items-center shrink-0">
            {/* Primary Color */}
            <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[220px]">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 text-left rtl:text-right">
                <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: pColor || "#0F766E" }}></span>
                {t("admin_primary_color", "Primary Color")}
              </label>
              <div className="relative flex items-center bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-1.5 transition-all duration-200 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/10 shadow-sm">
                <div className="relative w-8 h-8 rounded-full shrink-0 shadow-inner border border-black/10 overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95">
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: pColor || "#0F766E" }}></div>
                  <input
                    type="color"
                    value={pColor || "#0F766E"}
                    onChange={(e) => setLocalPrimaryColor(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-none"
                  />
                </div>
                <input
                  type="text"
                  value={pColor}
                  onChange={(e) => setLocalPrimaryColor(e.target.value)}
                  placeholder="#0F766E"
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[220px]">
              <label className="text-[11px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 text-left rtl:text-right">
                <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: sColor || "#22C55E" }}></span>
                {t("admin_secondary_color", "Secondary Color")}
              </label>
              <div className="relative flex items-center bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-1.5 transition-all duration-200 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/10 shadow-sm">
                <div className="relative w-8 h-8 rounded-full shrink-0 shadow-inner border border-black/10 overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95">
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: sColor || "#22C55E" }}></div>
                  <input
                    type="color"
                    value={sColor || "#22C55E"}
                    onChange={(e) => setLocalSecondaryColor(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer border-none"
                  />
                </div>
                <input
                  type="text"
                  value={sColor}
                  onChange={(e) => setLocalSecondaryColor(e.target.value)}
                  placeholder="#22C55E"
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-2.5 py-1 text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Auto approve profiles toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855 font-sans">{t("admin_auto_approve_freelancers_title", "Auto-Approve Freelancer Profiles")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_auto_approve_freelancers_desc", "When enabled, new freelancer accounts are automatically approved upon completing onboarding, bypassing the admin review queue.")}</p>
          </div>
          
          <button
            type="button"
            onClick={() => setLocalAutoVetting(!vetting)}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center border-none ${
              vetting ? "bg-teal-700" : "bg-slate-200"
            }`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              vetting ? "translate-x-5.5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Proposal vetting toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855 font-sans">{t("admin_review_proposals_title", "Review Freelancer Proposals")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_review_proposals_desc", "When enabled, all proposals submitted by freelancers must be reviewed and approved by an administrator before they are visible to clients.")}</p>
          </div>
          
          <button
            type="button"
            onClick={() => setLocalProposalVetting(!proposalVetting)}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center border-none ${
              proposalVetting ? "bg-teal-700" : "bg-slate-200"
            }`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              proposalVetting ? "translate-x-5.5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Client vetting toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855 font-sans">{t("admin_review_clients_title", "Review Client Profiles")}</h4>
            <p className="text-xs text-slate-555 mt-1 font-semibold">{t("admin_review_clients_desc", "When enabled, new client profiles must be reviewed and approved by an administrator before they are permitted to post jobs.")}</p>
          </div>
          
          <button
            type="button"
            onClick={() => setLocalClientVetting(!clientVetting)}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center border-none ${
              clientVetting ? "bg-teal-700" : "bg-slate-200"
            }`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              clientVetting ? "translate-x-5.5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Project/Job Posting vetting toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855 font-sans">{t("admin_review_projects_title", "Review Project Postings")}</h4>
            <p className="text-xs text-slate-555 mt-1 font-semibold">{t("admin_review_projects_desc", "When enabled, newly created or edited project postings must be reviewed and approved by an administrator before they are published and visible to freelancers.")}</p>
          </div>
          
          <button
            type="button"
            onClick={() => setLocalProjectVetting(!projectVetting)}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center border-none ${
              projectVetting ? "bg-teal-700" : "bg-slate-200"
            }`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              projectVetting ? "translate-x-5.5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {/* Default Currency configuration */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855">{t("admin_default_currency_title", "Default Platform Currency")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_default_currency_desc", "Select the primary system currency used across dashboards, wallets, and invoices by default.")}</p>
          </div>
          
          <select
            value={localCurrency}
            onChange={(e) => setLocalCurrency(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-202 rounded-xl px-3 py-2.5 text-xs text-slate-805 focus:outline-none focus:border-teal-700 transition font-bold"
          >
            {availCurrencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
            {availCurrencies.length === 0 && (
              <option value="USD">{t("currency_usd", "US Dollar (USD)")}</option>
            )}
          </select>
        </div>

        {/* Default Language configuration */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855">{t("admin_default_language_title", "Default Site Language")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_default_language_desc", "Select the primary display translation dictionary loaded for anonymous guests and new signups.")}</p>
          </div>
          
          <select
            value={localLanguage}
            onChange={(e) => setLocalLanguage(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-202 rounded-xl px-3 py-2.5 text-xs text-slate-805 focus:outline-none focus:border-teal-700 transition font-bold"
          >
            {availLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.code})
              </option>
            ))}
            {availLanguages.length === 0 && (
              <option value="EN">{t("language_en", "English (EN)")}</option>
            )}
          </select>
        </div>

        {/* Pagination Settings configuration */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6 text-slate-855 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855">{t("admin_default_pagination_title", "Default Pagination Limit")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_default_pagination_desc", "Configure the global number of records loaded per page across all directory and table listings.")}</p>
          </div>
          
          <select
            value={localLimit}
            onChange={(e) => setLocalLimit(Number(e.target.value))}
            className="w-full sm:w-64 bg-slate-50 border border-slate-202 rounded-xl px-3 py-2.5 text-xs text-slate-805 focus:outline-none focus:border-teal-700 transition font-bold"
          >
            <option value={3}>3 {t("admin_rows_per_page", "rows per page")}</option>
            <option value={5}>5 {t("admin_rows_per_page", "rows per page")}</option>
            <option value={10}>10 {t("admin_rows_per_page", "rows per page")}</option>
            <option value={20}>20 {t("admin_rows_per_page", "rows per page")}</option>
            <option value={50}>50 {t("admin_rows_per_page", "rows per page")}</option>
            <option value={100}>100 {t("admin_rows_per_page", "rows per page")}</option>
          </select>
        </div>

        {/* Maintenance mode toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 text-slate-805 text-left rtl:text-right">
          <div className="max-w-md">
            <h4 className="text-sm font-extrabold text-slate-855">{t("admin_maintenance_mode_title", "Platform System Maintenance Mode")}</h4>
            <p className="text-xs text-slate-550 mt-1 font-semibold">{t("admin_maintenance_mode_desc", "Restricts client registrations and contractor job bidding temporarily for structural updates.")}</p>
          </div>
          
          <button
            type="button"
            onClick={() => setLocalMaintenanceMode(!maintenance)}
            className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center border-none ${
              maintenance ? "bg-rose-500" : "bg-slate-200"
            }`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              maintenance ? "translate-x-5.5" : "translate-x-0"
            }`} />
          </button>
        </div>
      </div>

      {/* FLOATING SUCCESS TOAST */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-slideIn max-w-sm text-left rtl:text-right">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            ✓
          </div>
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs font-black text-white leading-tight">{toastTitle || "Notification"}</span>
            {toastText && (
              <span className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">{toastText}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
