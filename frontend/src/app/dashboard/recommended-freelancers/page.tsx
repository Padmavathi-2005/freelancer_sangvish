"use client";

import React from "react";
import ClientRecommendedFreelancersTab from "@/components/dashboard/ClientRecommendedFreelancersTab";
import { useDashboard } from "../DashboardContext";

export default function ClientRecommendedFreelancersPage() {
  const { setSelectedFreelancerProfile } = useDashboard();

  return (
    <ClientRecommendedFreelancersTab
      setSelectedFreelancerProfile={setSelectedFreelancerProfile}
    />
  );
}
