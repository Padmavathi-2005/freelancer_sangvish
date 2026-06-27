"use client";

import React from "react";
import SiteManagementTab from "@/components/admin/SiteManagementTab";
import { useAdmin } from "../AdminContext";

export default function SiteManagementPage() {
  const {
    platformFee,
    setPlatformFee,
    autoVetting,
    setAutoVetting,
    maintenanceMode,
    setMaintenanceMode,
    siteTheme,
    setSiteTheme,
    handleSaveSetting
  } = useAdmin();

  return (
    <SiteManagementTab
      platformFee={platformFee}
      setPlatformFee={setPlatformFee}
      autoVetting={autoVetting}
      setAutoVetting={setAutoVetting}
      maintenanceMode={maintenanceMode}
      setMaintenanceMode={setMaintenanceMode}
      siteTheme={siteTheme}
      setSiteTheme={setSiteTheme}
      handleSaveSetting={handleSaveSetting}
    />
  );
}
