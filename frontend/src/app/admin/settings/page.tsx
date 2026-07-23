"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdmin } from "../AdminContext";
import { 
  FiSliders, 
  FiLayers, 
  FiMail, 
  FiLink, 
  FiLock, 
  FiCreditCard, 
  FiAlertTriangle, 
  FiSearch,
  FiSettings,
  FiUsers,
  FiFileText
} from "react-icons/fi";

import GeneralSettingsTab from "@/components/admin/GeneralSettingsTab";
import SiteSettingsTab from "@/components/admin/SiteSettingsTab";
import EmailSettingsTab from "@/components/admin/EmailSettingsTab";
import FrontendContentTab from "@/components/admin/FrontendContentTab";
import FooterLinksTab from "@/components/admin/FooterLinksTab";
import SocialLoginTab from "@/components/admin/SocialLoginTab";
import PaymentSettingsTab from "@/components/admin/PaymentSettingsTab";
import DisputeReasonsTab from "@/components/admin/DisputeReasonsTab";
import SEOPreviewTab from "@/components/admin/SEOPreviewTab";
import ReferralSettingsTab from "@/components/admin/ReferralSettingsTab";
import DocumentVettingTab from "@/components/admin/DocumentVettingTab";

function SettingsPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabQuery = searchParams.get("tab") || "general";

  const {
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
    handleSaveSetting,
    frontendHeroContent,
    setFrontendHeroContent,
    clientDisputeReasons,
    setClientDisputeReasons,
    freelancerDisputeReasons,
    setFreelancerDisputeReasons,
  } = useAdmin();

  const tabs = [
    { key: "general", label: "General Settings", icon: FiSliders },
    { key: "site", label: "Site Settings", icon: FiSettings },
    { key: "email", label: "Email Settings", icon: FiMail },
    { key: "frontend", label: "Frontend Content", icon: FiLayers },
    { key: "footer", label: "Footer & App Links", icon: FiLink },
    { key: "social", label: "Social Login", icon: FiLock },
    { key: "payment", label: "Payment Settings", icon: FiCreditCard },
    { key: "disputes", label: "Dispute Reasons", icon: FiAlertTriangle },
    { key: "seo", label: "SEO & Meta Preview", icon: FiSearch },
    { key: "referral", label: "Referral & Earn", icon: FiUsers },
    { key: "documents", label: "Document Verification", icon: FiFileText },
  ];

  const handleTabChange = (key: string) => {
    router.push(`/admin/settings?tab=${key}`);
  };

  return (
    <div className="flex-grow select-none animate-fadeIn">
      {/* Clean text-based header */}
      <div className="flex flex-col gap-1.5 mb-8 text-left">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">System Settings Portal</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
          Manage all core platform credentials, email templates, landing page designs, and system parameters.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sub-Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-1.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left backdrop-blur-md">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5 px-2 select-none">
            Settings Categories
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTabQuery === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-3 cursor-pointer border-none relative overflow-hidden isolate group transition-all duration-500 bg-transparent ${
                  isTabActive
                    ? "text-white translate-x-0.5"
                    : "text-slate-500 hover:text-teal-900 hover:translate-x-0.5"
                }`}
              >
                {/* Active Background Pill with smooth slow horizontal slide-reveal */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-teal-700 to-teal-800 rounded-xl transition-all duration-500 ease-out origin-left -z-10 ${
                    isTabActive ? "scale-x-100 opacity-100 shadow-md shadow-teal-700/20" : "scale-x-0 opacity-0"
                  }`}
                />

                {/* Hover background pill that slides in from left slowly (only if not active) */}
                {!isTabActive && (
                  <div className="absolute inset-0 bg-slate-100/80 rounded-xl transition-transform duration-500 ease-out origin-left scale-x-0 group-hover:scale-x-100 -z-10" />
                )}

                {/* Active Indicator Left Glow Line */}
                <div className={`absolute left-0 top-2.5 bottom-2.5 w-1 bg-teal-400 rounded-r-md transition-all duration-500 ${
                  isTabActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
                }`}></div>

                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  isTabActive ? "text-white" : "text-slate-400 group-hover:text-teal-700"
                }`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Section */}
        <div className="flex-grow w-full min-w-0">
          {activeTabQuery === "general" && (
            <GeneralSettingsTab
              platformFee={platformFee}
              setPlatformFee={setPlatformFee}
              autoVetting={autoVetting}
              setAutoVetting={setAutoVetting}
              maintenanceMode={maintenanceMode}
              setMaintenanceMode={setMaintenanceMode}
              siteTheme={siteTheme}
              setSiteTheme={setSiteTheme}
              primaryColor={primaryColor}
              setPrimaryColor={setPrimaryColor}
              secondaryColor={secondaryColor}
              setSecondaryColor={setSecondaryColor}
              defaultCurrency={defaultCurrency}
              setDefaultCurrency={setDefaultCurrency}
              defaultLanguage={defaultLanguage}
              setDefaultLanguage={setDefaultLanguage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              enableProposalVetting={enableProposalVetting}
              setEnableProposalVetting={setEnableProposalVetting}
              enableClientVetting={enableClientVetting}
              setEnableClientVetting={setEnableClientVetting}
              enableProjectVetting={enableProjectVetting}
              setEnableProjectVetting={setEnableProjectVetting}
              handleSaveSetting={handleSaveSetting}
            />
          )}

          {activeTabQuery === "site" && (
            <SiteSettingsTab
              handleSaveSetting={handleSaveSetting}
            />
          )}

          {activeTabQuery === "email" && (
            <EmailSettingsTab
              handleSaveSetting={handleSaveSetting}
            />
          )}

          {activeTabQuery === "frontend" && (
            <FrontendContentTab
              frontendHeroContent={frontendHeroContent}
              setFrontendHeroContent={setFrontendHeroContent}
              handleSaveSetting={handleSaveSetting}
            />
          )}

          {activeTabQuery === "footer" && (
            <FooterLinksTab />
          )}

          {activeTabQuery === "social" && (
            <SocialLoginTab />
          )}

          {activeTabQuery === "payment" && (
            <PaymentSettingsTab />
          )}

          {activeTabQuery === "disputes" && (
            <DisputeReasonsTab
              clientDisputeReasons={clientDisputeReasons}
              setClientDisputeReasons={setClientDisputeReasons}
              freelancerDisputeReasons={freelancerDisputeReasons}
              setFreelancerDisputeReasons={setFreelancerDisputeReasons}
              handleSaveSetting={handleSaveSetting}
            />
          )}

          {activeTabQuery === "seo" && (
            <SEOPreviewTab />
          )}

          {activeTabQuery === "referral" && (
            <ReferralSettingsTab
              handleSaveSetting={handleSaveSetting}
            />
          )}

          {activeTabQuery === "documents" && (
            <DocumentVettingTab />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow p-6 sm:p-10 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-700"></div>
      </div>
    }>
      <SettingsPortalContent />
    </Suspense>
  );
}
