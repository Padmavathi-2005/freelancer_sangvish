"use client";

import { redirect } from "next/navigation";

export default function SiteSettingsPageRedirect() {
  redirect("/admin/settings?tab=site");
}
