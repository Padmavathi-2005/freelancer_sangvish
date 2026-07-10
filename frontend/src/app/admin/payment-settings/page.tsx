"use client";

import { redirect } from "next/navigation";

export default function PaymentSettingsPageRedirect() {
  redirect("/admin/settings?tab=payment");
}
