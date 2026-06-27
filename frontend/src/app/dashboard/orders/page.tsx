"use client";

import React from "react";
import ClientOrdersTab from "@/components/dashboard/ClientOrdersTab";
import { useDashboard } from "../DashboardContext";

export default function ClientOrdersPage() {
  const {
    selectedGigOrderDetails,
    setSelectedGigOrderDetails,
    loadingClientApplications,
    clientApplications,
    fetchClientApplications,
    handleUpdateGigApplication,
    triggerToast,
    setSelectedFreelancerProfile,
    setActiveTab
  } = useDashboard();

  return (
    <ClientOrdersTab
      selectedGigOrderDetails={selectedGigOrderDetails}
      setSelectedGigOrderDetails={setSelectedGigOrderDetails}
      loadingClientApplications={loadingClientApplications}
      clientApplications={clientApplications}
      fetchClientApplications={fetchClientApplications}
      handleUpdateGigApplication={handleUpdateGigApplication}
      triggerToast={triggerToast}
      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
      setActiveTab={setActiveTab}
    />
  );
}
