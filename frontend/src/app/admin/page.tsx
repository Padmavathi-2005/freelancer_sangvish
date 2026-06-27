"use client";

import React from "react";
import OverviewTab from "@/components/admin/OverviewTab";
import { useAdmin } from "./AdminContext";

export default function AdminOverviewPage() {
  const { adminUser } = useAdmin();

  return <OverviewTab adminUser={adminUser} />;
}
