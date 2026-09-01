"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdmin } from "../AdminContext";
import { useLanguage } from "@/context/LanguageContext";
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
  FiFileText,
  FiZap
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
import ApiIntegrationsTab from "@/components/admin/ApiIntegrationsTab";

function SettingsPortalContent() {
  const { t } = useLanguage();
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
    { key: "general", label: t("admin_tab_general", "General Settings"), icon: FiSliders },
    { key: "site", label: t("admin_tab_site", "Site Settings"), icon: FiSettings },
    { key: "email", label: t("admin_tab_email", "Email Settings"), icon: FiMail },
    { key: "frontend", label: t("admin_tab_frontend", "Frontend Content"), icon: FiLayers },
    { key: "footer", label: t("admin_tab_footer", "Footer & App Links"), icon: FiLink },
    { key: "social", label: t("admin_tab_social", "Social Login"), icon: FiLock },
    { key: "payment", label: t("admin_tab_payment", "Payment Settings"), icon: FiCreditCard },
    { key: "disputes", label: t("admin_tab_disputes", "Dispute Reasons"), icon: FiAlertTriangle },
    { key: "seo", label: t("admin_tab_seo", "SEO & Meta Preview"), icon: FiSearch },
    { key: "referral", label: t("admin_tab_referral", "Referral & Earn"), icon: FiUsers },
    { key: "documents", label: t("admin_tab_documents", "Document Verification"), icon: FiFileText },
    { key: "api_integrations", label: t("admin_tab_api_integrations", "API Integrations"), icon: FiZap },
  ];

  const handleTabChange = (key: string) => {
    router.push(`/admin/settings?tab=${key}`);
  };

  return (
    <div className="flex-grow select-none animate-fadeIn text-left rtl:text-right">
      {/* Clean text-based header */}
      <div className="flex flex-col gap-1.5 mb-8 text-left rtl:text-right">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
          {t("admin_settings_portal_title", "System Settings Portal")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
          {t("admin_settings_portal_desc", "Manage all core platform credentials, email templates, landing page designs, and system parameters.")}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start min-w-0 max-w-full w-full">
        {/* Sub-Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 lg:gap-1.5 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 lg:p-4 shadow-sm text-left rtl:text-right backdrop-blur-md scrollbar-none whitespace-nowrap min-w-0 max-w-full">
          <div className="hidden lg:block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5 px-2 select-none text-left rtl:text-right">
            {t("admin_settings_categories", "Settings Categories")}
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTabQuery === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`w-auto lg:w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer border-none transition-all duration-200 bg-transparent shrink-0 group ${
                  isTabActive
                    ? "text-primary"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                  isTabActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                }`} />
                <span>{tab.label}</span>
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

          {activeTabQuery === "api_integrations" && (
            <ApiIntegrationsTab
              handleSaveSetting={handleSaveSetting}
            />
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
