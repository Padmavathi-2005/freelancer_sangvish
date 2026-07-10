"use client";

import { redirect } from "next/navigation";

export default function SocialLoginPageRedirect() {
  redirect("/admin/settings?tab=social");
}
