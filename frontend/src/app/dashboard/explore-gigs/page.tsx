"use client";

import React from "react";
import ExploreGigsTab from "@/components/dashboard/ExploreGigsTab";
import { useDashboard } from "../DashboardContext";

export default function ExploreGigsPage() {
  const { triggerToast, fetchClientApplications } = useDashboard();

  return <ExploreGigsTab triggerToast={triggerToast} fetchClientApplications={fetchClientApplications} />;
}
