"use client";

import React from "react";
import SiteSettingsTab from "@/components/admin/SiteSettingsTab";
import { useAdmin } from "../AdminContext";

export default function SiteSettingsPage() {
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
    handleSaveSetting
  } = useAdmin();

  return (
    <SiteSettingsTab
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
      handleSaveSetting={handleSaveSetting}
    />
  );
}
