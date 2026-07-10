"use client";

import { redirect } from "next/navigation";

export default function FrontendContentPageRedirect() {
  redirect("/admin/settings?tab=frontend");
}
