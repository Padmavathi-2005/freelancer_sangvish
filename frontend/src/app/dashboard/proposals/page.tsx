"use client";

import React, { useEffect } from "react";
import ProposalsTab from "@/components/dashboard/ProposalsTab";
import { useDashboard } from "../DashboardContext";

export default function ProposalsPage() {
  const {
    userRole,
    isCreatingJob,
    setIsCreatingJob,
    postJobTitle,
    setPostJobTitle,
    postJobBudget,
    setPostJobBudget,
    postJobCategoryId,
    setPostJobCategoryId,
    handlePostJobCategoryChange,
    postJobSubCategoryId,
    setPostJobSubCategoryId,
    handlePostJobSubCategoryChange,
    postJobSubCategories,
    postJobDescription,
    setPostJobDescription,
    postJobExpLevel,
    setPostJobExpLevel,
    postJobStep,
    setPostJobStep,
    postJobType,
    setPostJobType,
    postJobMilestoneType,
    setPostJobMilestoneType,
    postJobMinBudget,
    setPostJobMinBudget,
    postJobMaxBudget,
    setPostJobMaxBudget,
    postJobDuration,
    setPostJobDuration,
    postJobLocation,
    setPostJobLocation,
    postJobNumFreelancers,
    setPostJobNumFreelancers,
    postJobAvailableSkills,
    postJobSelectedSkills,
    setPostJobSelectedSkills,
    handlePostJobToggleSkill,
    postJobAvailableLanguages,
    postJobSelectedLanguages,
    setPostJobSelectedLanguages,
    handlePostJobToggleLanguage,
    postJobMaxHours,
    setPostJobMaxHours,
    postJobPaymentMode,
    setPostJobPaymentMode,
    clientJobs,
    loadingClientJobs,
    fetchClientJobs,
    selectedProjectDetails,
    setSelectedProjectDetails,
    projectProposals,
    loadingProjectProposals,
    handleUpdateProposalStatus,
    setSelectedFreelancerProfile,
    freelancerProposals,
    loadingFreelancerProposals,
    fetchFreelancerProposals,
    gigCategories,
    triggerToast,
    setActiveTab,
    editingDraftJobId,
    setEditingDraftJobId,
    fetchPostJobLanguages
  } = useDashboard();

  useEffect(() => {
    if (isCreatingJob) {
      fetchPostJobLanguages();
    }
  }, [isCreatingJob]);

  useEffect(() => {
    if (userRole === "client") {
      fetchClientJobs();
    } else if (userRole === "freelancer") {
      fetchFreelancerProposals();
    }
  }, [userRole]);

  useEffect(() => {
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
              triggerToast("success", `Hired successfully! $${parseFloat(amount).toFixed(2)} escrow escrow payment confirmed.`, "Your project contract is now active.");
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

      const tcSuccess = params.get("stripe_timecard_success");
      const contractId = params.get("contract_id");
      const timecardId = params.get("timecard_id");
      const tcAmount = params.get("amount");

      if (tcSuccess === "1" && contractId && timecardId && tcAmount) {
        const confirmTimecardPayment = async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch("https://freelancer.sangvish.com/api/payments/timecard/confirm", {
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
              // Remove query params cleanly
              window.history.replaceState({}, document.title, window.location.pathname);
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
    }
  }, []);

  return (
    <ProposalsTab
      userRole={userRole}
      isCreatingJob={isCreatingJob}
      setIsCreatingJob={setIsCreatingJob}
      postJobTitle={postJobTitle}
      setPostJobTitle={setPostJobTitle}
      postJobBudget={postJobBudget}
      setPostJobBudget={setPostJobBudget}
      postJobCategoryId={postJobCategoryId}
      setPostJobCategoryId={setPostJobCategoryId}
      handlePostJobCategoryChange={handlePostJobCategoryChange}
      postJobSubCategoryId={postJobSubCategoryId}
      setPostJobSubCategoryId={setPostJobSubCategoryId}
      handlePostJobSubCategoryChange={handlePostJobSubCategoryChange}
      postJobSubCategories={postJobSubCategories}
      postJobDescription={postJobDescription}
      setPostJobDescription={setPostJobDescription}
      postJobExpLevel={postJobExpLevel}
      setPostJobExpLevel={setPostJobExpLevel}
      postJobStep={postJobStep}
      setPostJobStep={setPostJobStep}
      postJobType={postJobType}
      setPostJobType={setPostJobType}
      postJobMilestoneType={postJobMilestoneType}
      setPostJobMilestoneType={setPostJobMilestoneType}
      postJobMinBudget={postJobMinBudget}
      setPostJobMinBudget={setPostJobMinBudget}
      postJobMaxBudget={postJobMaxBudget}
      setPostJobMaxBudget={setPostJobMaxBudget}
      postJobDuration={postJobDuration}
      setPostJobDuration={setPostJobDuration}
      postJobLocation={postJobLocation}
      setPostJobLocation={setPostJobLocation}
      postJobNumFreelancers={postJobNumFreelancers}
      setPostJobNumFreelancers={setPostJobNumFreelancers}
      postJobAvailableSkills={postJobAvailableSkills}
      postJobSelectedSkills={postJobSelectedSkills}
      setPostJobSelectedSkills={setPostJobSelectedSkills}
      handlePostJobToggleSkill={handlePostJobToggleSkill}
      postJobAvailableLanguages={postJobAvailableLanguages}
      postJobSelectedLanguages={postJobSelectedLanguages}
      setPostJobSelectedLanguages={setPostJobSelectedLanguages}
      handlePostJobToggleLanguage={handlePostJobToggleLanguage}
      postJobMaxHours={postJobMaxHours}
      setPostJobMaxHours={setPostJobMaxHours}
      postJobPaymentMode={postJobPaymentMode}
      setPostJobPaymentMode={setPostJobPaymentMode}
      clientJobs={clientJobs}
      loadingClientJobs={loadingClientJobs}
      fetchClientJobs={fetchClientJobs}
      selectedProjectDetails={selectedProjectDetails}
      setSelectedProjectDetails={setSelectedProjectDetails}
      projectProposals={projectProposals}
      loadingProjectProposals={loadingProjectProposals}
      handleUpdateProposalStatus={handleUpdateProposalStatus}
      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
      freelancerProposals={freelancerProposals}
      loadingFreelancerProposals={loadingFreelancerProposals}
      fetchFreelancerProposals={fetchFreelancerProposals}
      gigCategories={gigCategories}
      triggerToast={triggerToast}
      setActiveTab={setActiveTab}
      editingDraftJobId={editingDraftJobId}
      setEditingDraftJobId={setEditingDraftJobId}
    />
  );
}
