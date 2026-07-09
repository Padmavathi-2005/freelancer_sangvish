"use client";

import React from "react";
import DatabaseBackupTab from "@/components/admin/DatabaseBackupTab";
import { useAdmin } from "../AdminContext";

export default function BackupsPage() {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  return <DatabaseBackupTab isDark={isDark} />;
}
