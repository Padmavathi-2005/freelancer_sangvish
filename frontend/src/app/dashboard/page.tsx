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
    setOnboardingStep,
    setForceShowOnboarding,
    setWizardStep,
    setClientWizardStep,
    stepsStatus,
    onboardingCompleted,
    vettingStatus,
  } = useDashboard();

  const isProfileIncomplete = !onboardingCompleted || vettingStatus === "Pending";

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("stripe_proposal_success");
      const proposalId = params.get("proposal_id");
      const amount = params.get("amount");

      if (success === "1" && proposalId && amount) {
        const confirmPayment = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch("https://freelancer.sangvish.com/api/payments/proposal/confirm", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                proposal_id: parseInt(proposalId),
                amount_usd: parseFloat(amount)
              })
            });
            const data = await res.json();
            if (res.ok) {
              triggerToast("success", `Hired successfully! $${parseFloat(amount).toFixed(2)} escrow payment confirmed.`, "Your project contract is now active.");
              fetchClientJobs();
              // Remove query params cleanly
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              triggerToast("error", data.message || "Failed to confirm payment.");
            }
          } catch (e) {
            console.error("Error confirming Stripe proposal payment:", e);
            triggerToast("error", "Network error. Failed to confirm payment.");
          }
        };
        confirmPayment();
      }
    }
  }, []);

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
      onOpenProfileWizard={(stepNum) => {
        if (userRole === "client") {
          setOnboardingStep("client_flow");
          if (stepNum) setClientWizardStep(stepNum);
        } else {
          setOnboardingStep("freelancer_flow");
          if (stepNum) setWizardStep(stepNum);
        }
        setForceShowOnboarding(true);
      }}
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
