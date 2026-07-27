"use client";

import React from "react";
import NewsletterSubscribersTab from "@/components/admin/NewsletterSubscribersTab";
import { useAdmin } from "../AdminContext";

export default function AdminNewsletterPage() {
  const { adminTheme } = useAdmin();
  const isDark = adminTheme === "dark";

  return <NewsletterSubscribersTab isDark={isDark} />;
}
