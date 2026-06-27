"use client";

import React from "react";
import ProjectOrdersTab from "@/components/admin/ProjectOrdersTab";
import { useAdmin } from "../AdminContext";

export default function ProjectOrdersPage() {
  const {
    transactionsSearch,
    setTransactionsSearch,
    paginatedTransactions,
    transactionsPage,
    totalTransactionsPages,
    setTransactionsPage,
    filteredTransactions,
    itemsPerPage
  } = useAdmin();

  return (
    <ProjectOrdersTab
      transactionsSearch={transactionsSearch}
      setTransactionsSearch={setTransactionsSearch}
      paginatedTransactions={paginatedTransactions}
      transactionsPage={transactionsPage}
      totalTransactionsPages={totalTransactionsPages}
      setTransactionsPage={setTransactionsPage}
      filteredTransactions={filteredTransactions}
      itemsPerPage={itemsPerPage}
    />
  );
}
