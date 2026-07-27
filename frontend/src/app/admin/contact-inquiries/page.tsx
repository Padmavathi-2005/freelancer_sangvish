"use client";

import React from "react";
import ContactInquiriesTab from "@/components/admin/ContactInquiriesTab";
import { useAdmin } from "../AdminContext";

export default function AdminContactInquiriesPage() {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  return <ContactInquiriesTab isDark={isDark} />;
}
