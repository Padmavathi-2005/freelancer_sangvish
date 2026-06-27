"use client";

import React from "react";
import GigApplicationsTab from "@/components/dashboard/GigApplicationsTab";
import { useDashboard } from "../DashboardContext";

export default function GigApplicationsPage() {
  const {
    loadingApplications,
    gigApplications,
    fetchFreelancerApplications,
    handleUpdateApplicationStatus
  } = useDashboard();

  return (
    <GigApplicationsTab
      loadingApplications={loadingApplications}
      gigApplications={gigApplications}
      fetchFreelancerApplications={fetchFreelancerApplications}
      handleUpdateApplicationStatus={handleUpdateApplicationStatus}
    />
  );
}
