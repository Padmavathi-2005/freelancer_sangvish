"use client";

import React from "react";
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
    setApplyingJob,
    setProposalBidAmount,
    setProposalDeliveryDays,
    setProposalCoverLetter,
    setProposalError,
    setShowProposalModal,
    setSelectedFreelancerProfile
  } = useDashboard();

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
