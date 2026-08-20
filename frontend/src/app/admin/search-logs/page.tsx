"use client";

import React from "react";
import SearchLogsTab from "@/components/admin/SearchLogsTab";

export default function AdminSearchLogsPage() {
  return (
    <div className="flex-grow select-none">
      <div className="flex flex-col gap-1.5 mb-8 text-left">
        <h1 className="text-2xl font-black text-slate-800 leading-tight">Search Logs & demand</h1>
        <p className="text-slate-500 text-xs font-semibold">Monitor popular client searches, unsatisfied keyword gaps, and service supply matrices.</p>
      </div>
      <SearchLogsTab />
    </div>
  );
}
