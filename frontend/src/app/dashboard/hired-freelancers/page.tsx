"use client";

// Force recompile to clear Turbopack stale cache
import React, { useEffect } from "react";
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
    setSelectedFreelancerProfile,
    fetchHiredFreelancers
  } = useDashboard();

  useEffect(() => {
    fetchHiredFreelancers();
  }, []);

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
