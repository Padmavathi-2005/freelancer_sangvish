"use client";

import { redirect } from "next/navigation";

export default function DisputeReasonsPageRedirect() {
  redirect("/admin/settings?tab=disputes");
}
