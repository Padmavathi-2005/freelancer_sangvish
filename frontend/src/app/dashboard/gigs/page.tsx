"use client";

import React from "react";
import GigsTab from "@/components/dashboard/GigsTab";
import { useDashboard } from "../DashboardContext";

export default function GigsPage() {
  const { triggerToast } = useDashboard();

  return <GigsTab triggerToast={triggerToast} />;
}
