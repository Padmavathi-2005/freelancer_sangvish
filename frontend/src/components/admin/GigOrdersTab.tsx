"use client";

import React from "react";
import Table from "@/components/Table";
import { useLanguage } from "@/context/LanguageContext";

interface GigOrdersTabProps {
  gigOrdersSearch: string;
  setGigOrdersSearch: (v: string) => void;
  paginatedGigOrders: any[];
  gigOrdersPage: number;
  totalGigOrdersPages: number;
  setGigOrdersPage: (page: number) => void;
  filteredGigOrders: any[];
  itemsPerPage: number;
  handleUpdateGigOrderStatus: (orderId: number, status: string) => Promise<void>;
}

export default function GigOrdersTab({
  gigOrdersSearch,
  setGigOrdersSearch,
  paginatedGigOrders,
  gigOrdersPage,
  totalGigOrdersPages,
  setGigOrdersPage,
  filteredGigOrders,
  itemsPerPage,
  handleUpdateGigOrderStatus
}: GigOrdersTabProps) {
  const { t } = useLanguage();

  const gigOrderColumns = [
    {
      header: t("s_no", "S.No"),
      accessor: (row: any, idx: number) => ((gigOrdersPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: t("gig_title", "Gig Title"),
      accessor: (row: any) => <div className="max-w-[200px] truncate font-bold text-slate-808 text-left rtl:text-right" title={row.gig_title}>{row.gig_title}</div>
    },
    {
      header: t("client", "Client"),
      accessor: (row: any) => row.client_name
    },
    {
      header: t("freelancer", "Freelancer"),
      accessor: (row: any) => row.freelancer_name
    },
    {
      header: t("price", "Price"),
      accessor: (row: any) => `$${Number(row.price).toLocaleString()}`
    },
    {
      header: t("status_label", "Status"),
      accessor: (row: any) => {
        const displayStatus = 
          row.status === "Accepted" ? t("status_accepted", "Accepted") :
          row.status === "Completed" ? t("status_completed", "Completed") :
          row.status === "Pending" ? t("status_pending", "Pending") :
          row.status === "Rejected" ? t("status_declined", "Rejected") :
          row.status;

        return (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
            row.status === "Accepted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
            row.status === "Completed" ? "bg-blue-50 text-blue-700 border border-blue-200/60" :
            row.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200/60" :
            "bg-rose-50 text-rose-600 border border-rose-200"
          }`}>
            {displayStatus}
          </span>
        );
      }
    },
    {
      header: t("actions", "Actions"),
      accessor: (row: any) => (
        <div className="flex gap-1.5 select-none justify-center">
          {row.status === "Pending" && (
            <>
              <button
                onClick={() => handleUpdateGigOrderStatus(row.order_id, "Accepted")}
                className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-200/60 rounded-lg cursor-pointer bg-white"
              >
                {t("accept", "Accept")}
              </button>
              <button
                onClick={() => handleUpdateGigOrderStatus(row.order_id, "Rejected")}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg cursor-pointer bg-white"
              >
                {t("reject", "Reject")}
              </button>
            </>
          )}
          {row.status === "Accepted" && (
            <button
              onClick={() => handleUpdateGigOrderStatus(row.order_id, "Completed")}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 border border-blue-200/60 rounded-lg cursor-pointer bg-white"
            >
              {t("complete", "Complete")}
            </button>
          )}
          {row.status !== "Pending" && row.status !== "Accepted" && (
            <span className="text-[10px] text-slate-400 italic">{t("no_actions", "No actions")}</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left rtl:text-right">
      <div>
        <h3 className="text-lg font-bold text-slate-800">{t("admin_gig_orders_proposals", "Gig orders & proposals")}</h3>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{t("admin_gig_orders_proposals_desc", "Monitor and process client applications, orders, payments status and milestone reviews for active gigs.")}</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder={t("admin_search_orders_placeholder", "Search orders...")}
            value={gigOrdersSearch}
            onChange={(e) => setGigOrdersSearch(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <Table
        columns={gigOrderColumns}
        data={paginatedGigOrders}
        currentPage={gigOrdersPage}
        totalPages={totalGigOrdersPages}
        onPageChange={setGigOrdersPage}
        totalItems={filteredGigOrders.length}
        itemsPerPage={itemsPerPage}
        emptyMessage={t("admin_no_gig_orders_found", "No gig application orders found.")}
      />
    </div>
  );
}
