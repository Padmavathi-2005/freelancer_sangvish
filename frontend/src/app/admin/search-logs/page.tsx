"use client";

import React from "react";
import SearchLogsTab from "@/components/admin/SearchLogsTab";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminSearchLogsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex-grow select-none text-left rtl:text-right">
      <div className="flex flex-col gap-1.5 mb-8 text-left rtl:text-right">
        <h1 className="text-2xl font-black text-slate-800 leading-tight">
          {t("admin_search_logs_title", "Search Logs & demand")}
        </h1>
        <p className="text-slate-500 text-xs font-semibold">
          {t("admin_search_logs_desc", "Monitor popular client searches, unsatisfied keyword gaps, and service supply matrices.")}
        </p>
      </div>
      <SearchLogsTab />
    </div>
  );
}
