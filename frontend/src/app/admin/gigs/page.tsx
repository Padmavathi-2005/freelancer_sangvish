"use client";

import React from "react";
import GigsTab from "@/components/admin/GigsTab";
import { useAdmin } from "../AdminContext";

export default function GigsPage() {
  const {
    gigsSearch,
    setGigsSearch,
    paginatedGigs,
    gigsPage,
    totalGigsPages,
    setGigsPage,
    filteredGigs,
    itemsPerPage,
    handleUpdateGigStatus,
    handleUpdateGigByAdmin,
    handleDeleteGig,
    categoriesList
  } = useAdmin();

  return (
    <GigsTab
      gigsSearch={gigsSearch}
      setGigsSearch={setGigsSearch}
      paginatedGigs={paginatedGigs}
      gigsPage={gigsPage}
      totalGigsPages={totalGigsPages}
      setGigsPage={setGigsPage}
      filteredGigs={filteredGigs}
      itemsPerPage={itemsPerPage}
      handleUpdateGigStatus={handleUpdateGigStatus}
      handleUpdateGigByAdmin={handleUpdateGigByAdmin}
      handleDeleteGig={handleDeleteGig}
      categoriesList={categoriesList}
    />
  );
}
