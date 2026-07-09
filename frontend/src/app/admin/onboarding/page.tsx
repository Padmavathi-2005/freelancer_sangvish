"use client";

import React from "react";
import OnboardingTab from "@/components/admin/OnboardingTab";
import { useAdmin } from "../AdminContext";

export default function OnboardingPage() {
  const {
    onboardedSearch,
    setOnboardedSearch,
    onboardedFilterRole,
    setOnboardedFilterRole,
    paginatedOnboardedUsers,
    onboardedPage,
    totalOnboardedPages,
    setOnboardedPage,
    filteredOnboardedUsers,
    userCounts,
    itemsPerPage,
    handleToggleUserActive,
    fetchUsers
  } = useAdmin();

  return (
    <OnboardingTab
      onboardedSearch={onboardedSearch}
      setOnboardedSearch={setOnboardedSearch}
      onboardedFilterRole={onboardedFilterRole}
      setOnboardedFilterRole={setOnboardedFilterRole}
      paginatedOnboardedUsers={paginatedOnboardedUsers}
      onboardedPage={onboardedPage}
      totalOnboardedPages={totalOnboardedPages}
      setOnboardedPage={setOnboardedPage}
      filteredOnboardedUsers={filteredOnboardedUsers}
      userCounts={userCounts}
      itemsPerPage={itemsPerPage}
      handleToggleUserActive={handleToggleUserActive}
      onVettingUpdate={fetchUsers}
    />
  );
}
