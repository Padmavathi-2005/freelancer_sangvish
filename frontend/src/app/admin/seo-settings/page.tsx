"use client";

import { redirect } from "next/navigation";

export default function SeoSettingsPageRedirect() {
  redirect("/admin/settings?tab=seo");
}
