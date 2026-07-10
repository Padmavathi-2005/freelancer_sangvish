"use client";

import { redirect } from "next/navigation";

export default function EmailSettingsPageRedirect() {
  redirect("/admin/settings?tab=email");
}
