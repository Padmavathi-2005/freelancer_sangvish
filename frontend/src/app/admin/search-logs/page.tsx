"use client";

import React from "react";
import SearchLogsTab from "@/components/admin/SearchLogsTab";

export default function AdminSearchLogsPage() {
  return (
    <div className="flex-grow p-6 sm:p-10 select-none">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-2xl font-black text-slate-800 leading-tight">Search Logs & demand</h1>
        <p className="text-slate-500 text-xs font-semibold">Monitor popular client searches, unsatisfied keyword gaps, and service supply matrices.</p>
      </div>
      <SearchLogsTab />
    </div>
  );
}
