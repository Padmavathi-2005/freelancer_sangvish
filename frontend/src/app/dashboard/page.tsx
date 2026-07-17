"use client";
import { API_URL } from "@/config/api";


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
    loadingClientJobs,
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
            const res = await fetch(`${API_URL}/payments/proposal/confirm`, {
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
              // Remove query params cleanly, keeping project_id in url!
              const cleanParams = new URLSearchParams(window.location.search);
              cleanParams.delete("stripe_proposal_success");
              cleanParams.delete("proposal_id");
              cleanParams.delete("amount");
              window.history.replaceState({}, document.title, `${window.location.pathname}?${cleanParams.toString()}`);
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

      const tcSuccess = params.get("stripe_timecard_success");
      const contractId = params.get("contract_id");
      const timecardId = params.get("timecard_id");
      const tcAmount = params.get("amount");

      if (tcSuccess === "1" && contractId && timecardId && tcAmount) {
        const confirmTimecardPayment = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/payments/timecard/confirm`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                contract_id: parseInt(contractId),
                timecard_id: parseInt(timecardId),
                amount: parseFloat(tcAmount)
              })
            });
            const data = await res.json();
            if (res.ok) {
              triggerToast("success", `Timecard paid! $${parseFloat(tcAmount).toFixed(2)} extra payment confirmed.`, "Escrow has been released.");
              fetchClientJobs();
              // Remove query params cleanly, keeping project_id in url!
              const cleanParams = new URLSearchParams(window.location.search);
              cleanParams.delete("stripe_timecard_success");
              cleanParams.delete("contract_id");
              cleanParams.delete("timecard_id");
              cleanParams.delete("amount");
              window.history.replaceState({}, document.title, `${window.location.pathname}?${cleanParams.toString()}`);
              window.dispatchEvent(new Event("refresh-milestones"));
            } else {
              triggerToast("error", data.message || "Failed to confirm timecard payment.");
            }
          } catch (e) {
            console.error("Error confirming Stripe timecard payment:", e);
            triggerToast("error", "Network error. Failed to confirm payment.");
          }
        };
        confirmTimecardPayment();
      }

      const milestoneSuccess = params.get("stripe_milestone_success");
      const milestoneId = params.get("milestone_id");
      const milestoneType = params.get("type");
      const milestoneAmount = params.get("amount");

      if (milestoneSuccess === "1" && milestoneId && milestoneType && milestoneAmount) {
        const confirmMilestonePayment = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/payments/contract/milestone/stripe/confirm`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                milestone_id: parseInt(milestoneId),
                type: milestoneType,
                amount_usd: parseFloat(milestoneAmount)
              })
            });
            const data = await res.json();
            if (res.ok) {
              triggerToast(
                "success", 
                milestoneType === "milestone" ? "Milestone funded successfully!" : "Extra revision funded successfully!",
                `$${parseFloat(milestoneAmount).toFixed(2)} escrow payment confirmed.`
              );
              fetchClientJobs();
              // Remove query params cleanly, keeping project_id in url!
              const cleanParams = new URLSearchParams(window.location.search);
              cleanParams.delete("stripe_milestone_success");
              cleanParams.delete("milestone_id");
              cleanParams.delete("type");
              cleanParams.delete("amount");
              window.history.replaceState({}, document.title, `${window.location.pathname}?${cleanParams.toString()}`);
              window.dispatchEvent(new Event("refresh-milestones"));
            } else {
              triggerToast("error", data.message || "Failed to confirm milestone payment.");
            }
          } catch (e) {
            console.error("Error confirming Stripe milestone payment:", e);
            triggerToast("error", "Network error. Failed to confirm milestone payment.");
          }
        };
        confirmMilestonePayment();
      }
    }
  }, []);

  // Synchronize URL search params with selectedProjectDetails state
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const projectIdParam = params.get("project_id");
      if (projectIdParam) {
        const projId = parseInt(projectIdParam);
        const foundJob = clientJobs.find((j: any) => j.job_id === projId);
        if (foundJob) {
          setSelectedProjectDetails(foundJob);
        } else if (!loadingClientJobs) {
          setSelectedProjectDetails(null);
        }
      } else {
        setSelectedProjectDetails(null);
      }
    };

    // Run on initial load and when clientJobs finishes loading
    syncFromUrl();

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [clientJobs, loadingClientJobs]);

  // Synchronize state changes back to URL query parameters
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (loadingClientJobs) return; // Prevent clearing URL parameter during loading phase
    const params = new URLSearchParams(window.location.search);
    const currentParam = params.get("project_id");

    if (selectedProjectDetails) {
      if (currentParam !== selectedProjectDetails.job_id.toString()) {
        params.set("project_id", selectedProjectDetails.job_id.toString());
        window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
      }
    } else {
      if (currentParam) {
        params.delete("project_id");
        const searchStr = params.toString();
        const newUrl = searchStr ? `${window.location.pathname}?${searchStr}` : window.location.pathname;
        window.history.pushState({}, "", newUrl);
      }
    }
  }, [selectedProjectDetails, loadingClientJobs]);

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
