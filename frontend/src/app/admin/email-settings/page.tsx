"use client";

import React from "react";
import EmailSettingsTab from "@/components/admin/EmailSettingsTab";
import { useAdmin } from "../AdminContext";

export default function EmailSettingsPage() {
  const { handleSaveSetting } = useAdmin();

  return <EmailSettingsTab handleSaveSetting={handleSaveSetting} />;
}
