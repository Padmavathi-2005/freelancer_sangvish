"use client";

import React from "react";
import SiteSettingsTab from "@/components/admin/SiteSettingsTab";
import { useAdmin } from "../AdminContext";

export default function SiteSettingsPage() {
  const { handleSaveSetting } = useAdmin();

  return (
    <SiteSettingsTab
      handleSaveSetting={handleSaveSetting}
    />
  );
}
