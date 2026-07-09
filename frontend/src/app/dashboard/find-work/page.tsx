"use client";

import React, { useEffect } from "react";
import FindWorkTab from "@/components/dashboard/FindWorkTab";
import { useDashboard } from "../DashboardContext";

export default function FindWorkPage() {
  const {
    userRole,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredFreelancers,
    triggerToast,
    setActiveTab,
    jobSearchQuery,
    setJobSearchQuery,
    gigCategories,
    jobSelectedCategory,
    setJobSelectedCategory,
    loadingAllJobs,
    allJobs,
    appliedJobIds,
    proposalLimitReached,
    proposalLimitMsg,
    setApplyingJob,
    setProposalBidAmount,
    setProposalDeliveryDays,
    setProposalCoverLetter,
    setProposalError,
    setShowProposalModal,
    setSelectedFreelancerProfile,
    fetchAllJobs
  } = useDashboard();

  useEffect(() => {
    fetchAllJobs();
  }, []);

  return (
    <FindWorkTab
      userRole={userRole}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      filteredFreelancers={filteredFreelancers}
      triggerToast={triggerToast}
      setActiveTab={setActiveTab}
      jobSearchQuery={jobSearchQuery}
      setJobSearchQuery={setJobSearchQuery}
      gigCategories={gigCategories}
      jobSelectedCategory={jobSelectedCategory}
      setJobSelectedCategory={setJobSelectedCategory}
      loadingAllJobs={loadingAllJobs}
      allJobs={allJobs}
      appliedJobIds={appliedJobIds}
      proposalLimitReached={proposalLimitReached}
      proposalLimitMsg={proposalLimitMsg}
      setApplyingJob={setApplyingJob}
      setProposalBidAmount={setProposalBidAmount}
      setProposalDeliveryDays={setProposalDeliveryDays}
      setProposalCoverLetter={setProposalCoverLetter}
      setProposalError={setProposalError}
      setShowProposalModal={setShowProposalModal}
      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
    />
  );
}
