"use client";

import React from "react";
import TransactionsTab from "@/components/admin/TransactionsTab";
import { useAdmin } from "../AdminContext";

export default function TransactionsPage() {
  const {
    transactionsSubTab,
    setTransactionsSubTab,
    transactionsSearch,
    setTransactionsSearch,
    paginatedTransactions,
    transactionsPage,
    totalTransactionsPages,
    setTransactionsPage,
    filteredTransactions,
    itemsPerPage,
    disputes,
    resolveDispute
  } = useAdmin();

  return (
    <TransactionsTab
      transactionsSubTab={transactionsSubTab}
      setTransactionsSubTab={setTransactionsSubTab}
      transactionsSearch={transactionsSearch}
      setTransactionsSearch={setTransactionsSearch}
      paginatedTransactions={paginatedTransactions}
      transactionsPage={transactionsPage}
      totalTransactionsPages={totalTransactionsPages}
      setTransactionsPage={setTransactionsPage}
      filteredTransactions={filteredTransactions}
      itemsPerPage={itemsPerPage}
      disputes={disputes}
      resolveDispute={resolveDispute}
    />
  );
}
