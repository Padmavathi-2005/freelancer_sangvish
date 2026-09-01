"use client";

import React, { useEffect } from "react";
import FreelancerProjectsTab from "@/components/dashboard/FreelancerProjectsTab";
import { useDashboard } from "../DashboardContext";
import { API_URL } from "@/config/api";

export default function FreelancerProjectsPage() {
  const { triggerToast, fetchFreelancerContracts, fetchClientJobs } = useDashboard();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      // 1. Timecard payment confirmation
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
              fetchFreelancerContracts();
              fetchClientJobs();
              
              // Remove query params cleanly, keeping contract_id in url!
              const cleanParams = new URLSearchParams(window.location.search);
              cleanParams.delete("stripe_timecard_success");
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

      // 2. Milestone payment confirmation
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
              fetchFreelancerContracts();
              fetchClientJobs();
              
              // Remove query params cleanly, keeping contract_id in url!
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

  return <FreelancerProjectsTab />;
}
