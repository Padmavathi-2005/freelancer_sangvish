"use client";

import { redirect } from "next/navigation";

export default function FooterLinksPageRedirect() {
  redirect("/admin/settings?tab=footer");
}
