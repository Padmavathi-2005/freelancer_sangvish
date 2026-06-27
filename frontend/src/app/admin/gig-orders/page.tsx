"use client";

import React from "react";
import GigOrdersTab from "@/components/admin/GigOrdersTab";
import { useAdmin } from "../AdminContext";

export default function GigOrdersPage() {
  const {
    gigOrdersSearch,
    setGigOrdersSearch,
    paginatedGigOrders,
    gigOrdersPage,
    totalGigOrdersPages,
    setGigOrdersPage,
    filteredGigOrders,
    itemsPerPage,
    handleUpdateGigOrderStatus
  } = useAdmin();

  return (
    <GigOrdersTab
      gigOrdersSearch={gigOrdersSearch}
      setGigOrdersSearch={setGigOrdersSearch}
      paginatedGigOrders={paginatedGigOrders}
      gigOrdersPage={gigOrdersPage}
      totalGigOrdersPages={totalGigOrdersPages}
      setGigOrdersPage={setGigOrdersPage}
      filteredGigOrders={filteredGigOrders}
      itemsPerPage={itemsPerPage}
      handleUpdateGigOrderStatus={handleUpdateGigOrderStatus}
    />
  );
}
