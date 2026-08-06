"use client";

import React from "react";
import CareerApplicationsTab from "@/components/admin/CareerApplicationsTab";
import { useAdmin } from "@/app/admin/AdminContext";

export default function AdminCareersPage() {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";
  return <CareerApplicationsTab isDark={isDark} />;
}
