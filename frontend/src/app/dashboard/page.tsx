"use client";

import React from "react";
import WorkspaceTab from "@/components/dashboard/WorkspaceTab";
import Marketplace from "@/components/Marketplace";
import { useDashboard } from "./DashboardContext";

export default function DashboardPage() {
  const {
    userRole,
    userName,
    profileCompletionProgress,
    clientJobs,
    allJobs,
    freelancerProposals,
    gigs,
    clientGigs,
    gigApplications,
    clientApplications,
    hiredFreelancers,
    selectedProjectDetails,
    setSelectedProjectDetails,
    selectedGigOrderDetails,
    setSelectedGigOrderDetails,
    setSelectedFreelancerProfile,
    triggerToast,
    fetchClientJobs,
    fetchAllJobs,
    fetchFreelancerProposals,
    fetchGigs,
    fetchClientGigs,
    fetchFreelancerApplications,
    fetchClientApplications,
    fetchHiredFreelancers,
    activeView,
    setActiveView,
    setActiveTab,
    onboardingStep,
    stepsStatus
  } = useDashboard();

  const isProfileIncomplete = userRole === "freelancer" && profileCompletionProgress < 100;

  // Render Marketplace if the user switched view to marketplace
  if (activeView === "marketplace") {
    return <Marketplace onToggleView={(view) => setActiveView(view)} />;
  }

  return (
    <WorkspaceTab
      userRole={userRole}
      userName={userName}
      isProfileIncomplete={isProfileIncomplete}
      stepsStatus={stepsStatus}
      profileCompletionProgress={profileCompletionProgress}
      onOpenProfileWizard={() => {}}
      setActiveTab={setActiveTab}
      setProfileStep={() => {}}
      clientJobs={clientJobs}
      allJobs={allJobs}
      freelancerProposals={freelancerProposals}
      gigs={gigs}
      clientGigs={clientGigs}
      gigApplications={gigApplications}
      clientApplications={clientApplications}
      hiredFreelancers={hiredFreelancers}
      selectedProjectDetails={selectedProjectDetails}
      setSelectedProjectDetails={setSelectedProjectDetails}
      selectedGigOrderDetails={selectedGigOrderDetails}
      setSelectedGigOrderDetails={setSelectedGigOrderDetails}
      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
      triggerToast={triggerToast}
      fetchClientJobs={fetchClientJobs}
      fetchAllJobs={fetchAllJobs}
      fetchFreelancerProposals={fetchFreelancerProposals}
      fetchGigs={fetchGigs}
      fetchClientGigs={fetchClientGigs}
      fetchFreelancerApplications={fetchFreelancerApplications}
      fetchClientApplications={fetchClientApplications}
      fetchHiredFreelancers={fetchHiredFreelancers}
    />
  );
}
