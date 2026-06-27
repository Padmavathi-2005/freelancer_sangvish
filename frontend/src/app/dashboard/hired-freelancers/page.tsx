"use client";

import React from "react";
import ClientHiredFreelancersTab from "@/components/dashboard/ClientHiredFreelancersTab";
import { useDashboard } from "../DashboardContext";

export default function ClientHiredFreelancersPage() {
  const {
    hiredFreelancers,
    loadingHiredFreelancers,
    setActiveTab,
    setIsCreatingJob,
    setSelectedProjectDetails,
    setSelectedGigOrderDetails,
    setSelectedFreelancerProfile
  } = useDashboard();

  return (
    <ClientHiredFreelancersTab
      hiredFreelancers={hiredFreelancers}
      loadingHiredFreelancers={loadingHiredFreelancers}
      setActiveTab={setActiveTab}
      setIsCreatingJob={setIsCreatingJob}
      setSelectedProjectDetails={setSelectedProjectDetails}
      setSelectedGigOrderDetails={setSelectedGigOrderDetails}
      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
    />
  );
}
