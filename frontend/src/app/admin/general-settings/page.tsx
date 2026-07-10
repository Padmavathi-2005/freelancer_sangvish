"use client";

import { redirect } from "next/navigation";

export default function GeneralSettingsPageRedirect() {
  redirect("/admin/settings?tab=general");
}
