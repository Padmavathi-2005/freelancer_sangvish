"use client";

import React from "react";
import DisputeReasonsTab from "@/components/admin/DisputeReasonsTab";
import { useAdmin } from "../AdminContext";

export default function DisputeReasonsPage() {
  const {
    disputeReasons,
    setDisputeReasons,
    handleSaveSetting
  } = useAdmin();

  return (
    <DisputeReasonsTab
      disputeReasons={disputeReasons}
      setDisputeReasons={setDisputeReasons}
      handleSaveSetting={handleSaveSetting}
    />
  );
}
