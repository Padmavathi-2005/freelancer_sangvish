"use client";

import React, { useState } from "react";
import Table from "@/components/Table";
import { DisputeCase, useAdmin } from "@/app/admin/AdminContext";
import { API_URL } from "@/config/api";
import { FiMessageSquare, FiCheckCircle, FiRefreshCw } from "react-icons/fi";

interface TransactionsTabProps {
  transactionsSubTab: "transactions" | "disputes";
  setTransactionsSubTab: (tab: "transactions" | "disputes") => void;
  transactionsSearch: string;
  setTransactionsSearch: (v: string) => void;
  paginatedTransactions: any[];
  transactionsPage: number;
  totalTransactionsPages: number;
  setTransactionsPage: (page: number) => void;
  filteredTransactions: any[];
  itemsPerPage: number;

  disputes: DisputeCase[];
  resolveDispute: (id: string, resolution: DisputeCase["status"], customPercent?: number) => void;
}

export default function TransactionsTab({
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
}: TransactionsTabProps) {
  const { highlightedDisputeId, setHighlightedDisputeId } = useAdmin();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);

  // New states for disputes pagination, filter, and search
  const [disputesSearch, setDisputesSearch] = useState("");
  const [disputeFilter, setDisputeFilter] = useState<"pending" | "resolved" | "all">("pending");
  const [disputesPage, setDisputesPage] = useState(1);
  const disputesItemsPerPage = 5;

  React.useEffect(() => {
    setDisputesPage(1);
  }, [disputesSearch, disputeFilter]);

  const filteredDisputes = React.useMemo(() => {
    return disputes.filter((disp) => {
      const query = disputesSearch.toLowerCase().trim();
      const matchesSearch = !query || 
        disp.project?.toLowerCase().includes(query) ||
        disp.client?.toLowerCase().includes(query) ||
        disp.freelancer?.toLowerCase().includes(query) ||
        disp.reason?.toLowerCase().includes(query) ||
        disp.clientStatement?.toLowerCase().includes(query) ||
        disp.freelancerStatement?.toLowerCase().includes(query) ||
        disp.id?.toString().includes(query);

      const isResolved = disp.status.startsWith("Resolved") || disp.status === "Closed" || disp.status === "Resolved";
      const matchesFilter = 
        disputeFilter === "all" ||
        (disputeFilter === "resolved" && isResolved) ||
        (disputeFilter === "pending" && !isResolved);

      return matchesSearch && matchesFilter;
    });
  }, [disputes, disputesSearch, disputeFilter]);

  const totalDisputesPages = Math.ceil(filteredDisputes.length / disputesItemsPerPage) || 1;
  const paginatedDisputes = React.useMemo(() => {
    const startIndex = (disputesPage - 1) * disputesItemsPerPage;
    return filteredDisputes.slice(startIndex, startIndex + disputesItemsPerPage);
  }, [filteredDisputes, disputesPage, disputesItemsPerPage]);

  const renderMessageText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      const parts = [];
      let lastIndex = 0;
      let match;
      urlRegex.lastIndex = 0;
      while ((match = urlRegex.exec(line)) !== null) {
        const url = match[0];
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          parts.push(line.substring(lastIndex, matchIndex));
        }
        const isImage = /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url);
        if (isImage) {
          parts.push(
            <span key={matchIndex} className="block mt-1">
              <a href={url} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline font-extrabold block mb-1">
                {url}
              </a>
              <img 
                src={url} 
                alt="Uploaded preview" 
                className="max-h-24 max-w-full rounded-lg border border-slate-200 shadow-sm object-contain" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </span>
          );
        } else {
          parts.push(
            <a key={matchIndex} href={url} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline font-extrabold break-all">
              {url}
            </a>
          );
        }
        lastIndex = urlRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      return (
        <span key={lIdx} className="block min-h-[1em]">
          {parts.length > 0 ? parts : line}
        </span>
      );
    });
  };

  const handleToggleChat = async (disputeId: string) => {
    if (activeChatId === disputeId) {
      setActiveChatId(null);
      setChatMessages([]);
      return;
    }

    try {
      setLoadingChatId(disputeId);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/admin/disputes/${disputeId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
        setActiveChatId(disputeId);
      }
    } catch (err) {
      console.error("Error fetching dispute messages:", err);
    } finally {
      setLoadingChatId(null);
    }
  };
  
  const transactionColumns = [
    {
      header: "S.No",
      accessor: (row: any, idx: number) => ((transactionsPage - 1) * itemsPerPage) + idx + 1
    },
    {
      header: "Contract Title",
      accessor: (row: any) => <div className="font-bold text-slate-800">{row.title}</div>
    },
    {
      header: "Job",
      accessor: (row: any) => row.job_title || "Direct Gig Order"
    },
    {
      header: "Client",
      accessor: (row: any) => row.client_name
    },
    {
      header: "Freelancer",
      accessor: (row: any) => row.freelancer_name
    },
    {
      header: "Budget",
      accessor: (row: any) => `$${Number(row.budget).toLocaleString()}`
    },
    {
      header: "Progress",
      accessor: (row: any) => `${row.progress || 0}%`
    },
    {
      header: "Status",
      accessor: (row: any) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
          row.status === "Completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
          row.status === "In Progress" ? "bg-teal-50 text-teal-700 border border-teal-200/60" :
          "bg-rose-50 text-rose-700 border border-rose-250"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Transactions Sub-tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start select-none">
        <button
          onClick={() => setTransactionsSubTab("transactions")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            transactionsSubTab === "transactions" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Escrow Contracts
        </button>
        <button
          onClick={() => setTransactionsSubTab("disputes")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            transactionsSubTab === "disputes" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Arbitration disputes
        </button>
      </div>

      {transactionsSubTab === "transactions" ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Transaction & contract escrows</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Track secure escrow deposits, progress percentages, and active milestones payout releases.</p>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search contracts..."
                value={transactionsSearch}
                onChange={(e) => setTransactionsSearch(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <Table
            columns={transactionColumns}
            data={paginatedTransactions}
            currentPage={transactionsPage}
            totalPages={totalTransactionsPages}
            onPageChange={setTransactionsPage}
            totalItems={filteredTransactions.length}
            itemsPerPage={itemsPerPage}
            emptyMessage="No contract records found."
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-6 shadow-sm animate-fadeIn text-left">
          <div>
            <h3 className="text-lg font-bold text-slate-805">Disputes & Arbitration Hub</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Review client complaints, freelancer counters, and execute escrow payouts or refunds.</p>
          </div>

          {/* Sub-tabs and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setDisputeFilter("pending")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  disputeFilter === "pending"
                    ? "bg-white text-teal-850 shadow-sm"
                    : "text-slate-500 hover:text-slate-805"
                }`}
              >
                Pending ({disputes.filter(d => !d.status.startsWith("Resolved") && d.status !== "Closed").length})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter("resolved")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  disputeFilter === "resolved"
                    ? "bg-white text-teal-850 shadow-sm"
                    : "text-slate-500 hover:text-slate-805"
                }`}
              >
                Resolved ({disputes.filter(d => d.status.startsWith("Resolved") || d.status === "Closed").length})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter("all")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  disputeFilter === "all"
                    ? "bg-white text-teal-850 shadow-sm"
                    : "text-slate-500 hover:text-slate-805"
                }`}
              >
                All ({disputes.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search disputes..."
                value={disputesSearch}
                onChange={(e) => setDisputesSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-850 focus:outline-none focus:border-teal-700/50 focus:bg-white transition-all duration-200 font-medium"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {filteredDisputes.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-505 text-sm font-semibold">No disputes found matching the selected filter or search query.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {paginatedDisputes.map((disp) => (
                <div 
                  key={disp.id} 
                  onMouseEnter={() => {
                    if (disp.id === highlightedDisputeId) {
                      setHighlightedDisputeId(null);
                    }
                  }}
                  className={`p-6 bg-white border rounded-xl flex flex-col gap-5 shadow-sm transition-all duration-300 ${
                    disp.id === highlightedDisputeId
                      ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/[0.02] scale-[1.01] shadow-md shadow-rose-500/5 animate-pulse"
                      : "border-slate-200"
                  } ${
                    disp.status.startsWith("Resolved") ? "opacity-60 border-slate-100" : ""
                  }`}
                >
                  {/* Dispute Summary Block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded">
                        Dispute #{disp.id}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-855 mt-2">{disp.project}</h4>
                      <div className="text-xs text-slate-500 font-semibold mt-1">
                        Client: <span className="text-slate-700">{disp.client}</span> &nbsp;|&nbsp; Freelancer: <span className="text-slate-700">{disp.freelancer}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xxs uppercase tracking-wider text-slate-400 font-semibold block">Escrow held</span>
                      <span className="text-xl font-black text-rose-600">${disp.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dispute Reason */}
                  <div className="text-xs p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-semibold">
                    <span className="font-extrabold">Reason filed: </span>
                    {disp.reason}
                  </div>

                  {/* Statements Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800">
                      <h5 className="font-bold text-slate-800 mb-2 border-b border-slate-200/80 pb-1">Client Statement</h5>
                      <blockquote className="italic text-slate-500 leading-relaxed">&ldquo;{disp.clientStatement}&rdquo;</blockquote>
                    </div>
                    <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800">
                      <h5 className="font-bold text-slate-800 mb-2 border-b border-slate-200/80 pb-1">Freelancer Statement</h5>
                      <blockquote className="italic text-slate-500 leading-relaxed">&ldquo;{disp.freelancerStatement}&rdquo;</blockquote>
                    </div>
                  </div>

                  {/* Arbitration controls */}
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Mediation Status: </span>
                      <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                        !disp.status.startsWith("Resolved") && disp.status !== "Closed"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs"
                      }`}>
                        {disp.status.startsWith("Resolved") || disp.status === "Closed" ? (
                          <>
                            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {disp.status.includes("Refunded")
                                ? "Closed & Resolved (Refunded Client)"
                                : disp.status.includes("Released")
                                ? "Closed & Resolved (Released to Freelancer)"
                                : disp.status.includes("Split")
                                ? "Closed & Resolved (Partial Split)"
                                : "Closed & Resolved"}
                            </span>
                          </>
                        ) : (
                          <span>{disp.status}</span>
                        )}
                      </span>
                    </div>

                    {!disp.status.startsWith("Resolved") && disp.status !== "Closed" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => resolveDispute(disp.id, "Resolved (Refunded Client)")}
                          className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-500 active:bg-cyan-600 focus:bg-cyan-500 focus:text-white active:text-white border border-cyan-200 text-cyan-700 hover:text-white transition-all text-xs font-bold rounded-lg cursor-pointer focus:outline-none"
                        >
                          Refund Client (100%)
                        </button>
                        <button
                          onClick={() => resolveDispute(disp.id, "Resolved (Released to Freelancer)")}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-500 active:bg-emerald-600 focus:bg-emerald-500 focus:text-white active:text-white border border-emerald-200 text-emerald-700 hover:text-white transition-all text-xs font-bold rounded-lg cursor-pointer focus:outline-none"
                        >
                          Payout Freelancer (100%)
                        </button>
                        <button
                          onClick={() => {
                            const val = window.prompt(
                              `Enter the Client Refund percentage (0 to 100%):\n(For example: 50 for a 50/50 split, or type a dollar amount like $150 to refund that exact amount of $${disp.amount})`,
                              "50"
                            );
                            if (val === null) return;
                            
                            let percent = parseFloat(val.replace(/[%$]/g, "").trim());
                            if (isNaN(percent) || percent < 0) {
                              alert("Please enter a valid number.");
                              return;
                            }
                            
                            if (val.includes("$")) {
                              percent = (percent / disp.amount) * 100;
                            }
                            
                            if (percent < 0 || percent > 100) {
                              alert(`Refund must be between 0% and 100% (or $0 and $${disp.amount}).`);
                              return;
                            }
                            
                            const clientRefund = disp.amount * (percent / 100);
                            const freelancerPayout = disp.amount - clientRefund;
                            
                            if (window.confirm(
                              `Confirm Split Decision:\n\n` +
                              `• Client Refund: ${percent.toFixed(1)}% ($${clientRefund.toFixed(2)})\n` +
                              `• Freelancer Payout: ${(100 - percent).toFixed(1)}% ($${freelancerPayout.toFixed(2)})\n\n` +
                              `Proceed with resolution?`
                            )) {
                              resolveDispute(disp.id, "Resolved (Split)", percent);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 transition-all text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Split / Custom
                        </button>
                        <button
                          onClick={() => handleToggleChat(disp.id)}
                          className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <FiMessageSquare className="w-3.5 h-3.5" />
                          {loadingChatId === disp.id ? "Loading..." : activeChatId === disp.id ? "Hide Chat" : "View Chat"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => handleToggleChat(disp.id)}
                          className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <FiMessageSquare className="w-3.5 h-3.5" />
                          {loadingChatId === disp.id ? "Loading..." : activeChatId === disp.id ? "Hide Chat" : "View Chat"}
                        </button>
                        <button
                          onClick={() => resolveDispute(disp.id, "Under Mediation")}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold transition-all text-xs rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <FiRefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          Reopen Case
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Chat interface */}
                  {activeChatId === disp.id && (
                    <div className="mt-5 border-t border-slate-100 pt-5 flex flex-col gap-4 animate-fadeIn">
                      <h5 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        <FiMessageSquare className="w-3.5 h-3.5 text-teal-600" /> Dispute Mediation Dialogue
                      </h5>
                      {chatMessages.length === 0 ? (
                        <p className="text-slate-400 text-xxs italic bg-slate-50 border border-slate-150 rounded-xl p-3 text-center">No discussion logged for this dispute folder.</p>
                      ) : (
                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto bg-slate-50/50 border border-slate-200 p-4 rounded-xl">
                          {chatMessages.map((msg, index) => {
                            let textContent = msg.message_text;
                            let isSystem = false;
                            
                            const trimmedText = textContent.trim();
                            const isPlatform = trimmedText.startsWith("[") && trimmedText.includes("Platform Message]");
                            if (trimmedText.startsWith("System:") || isPlatform) {
                              isSystem = true;
                              if (trimmedText.startsWith("System:")) {
                                textContent = trimmedText.substring(7).trim();
                              } else {
                                textContent = trimmedText.replace(/(?:Site Logo|Logo):\s*(?:https?:\/\/\S+|\/\S+)/gi, "");
                                textContent = textContent.replace(/^\[[^\]]+Platform Message\]\s*/i, "").trim();
                              }
                            } else {
                              try {
                                if (trimmedText.startsWith("{")) {
                                  const parsed = JSON.parse(trimmedText);
                                  isSystem = true;
                                  if (parsed.isDispute) {
                                    if (parsed.type === "dispute_opened") {
                                      textContent = `Dispute Raised. Reason: ${parsed.reason}. Description: "${parsed.description}". Escrow Held: $${parsed.budget}.`;
                                    } else if (parsed.type === "dispute_resolved") {
                                      textContent = `Dispute Resolved. Verdict: ${parsed.verdict}. Details: ${parsed.details}`;
                                    } else if (parsed.type === "dispute_contested") {
                                      textContent = `Dispute Contested. Explanation: "${parsed.explanation}"`;
                                    } else if (parsed.type === "settlement_proposed") {
                                      textContent = `Settlement Proposed. Split: Client ${parsed.client_refund_percent}%, Freelancer ${parsed.freelancer_pay_percent}%`;
                                    } else if (parsed.type === "dispute_escalated") {
                                      textContent = `Dispute Escalated. Case escalated to an admin mediator.`;
                                    } else if (parsed.type === "dispute_revision_required") {
                                      textContent = `Revision Required. Admin requested the freelancer to submit revisions.`;
                                    } else {
                                      textContent = parsed.message || parsed.details || textContent;
                                    }
                                  } else {
                                    textContent = parsed.message || parsed.details || textContent;
                                  }
                                }
                              } catch (e) {}
                            }

                            const isClientSender = parseInt(String(msg.sender_id || '0')) === parseInt(String(disp.client_id || '0'));

                            return (
                              <div
                                key={msg.message_id || index}
                                className={`flex flex-col text-xs p-2.5 rounded-xl max-w-[80%] ${
                                  isSystem
                                    ? "bg-amber-50 border border-amber-100 text-amber-900 mx-auto text-center"
                                    : isClientSender
                                    ? "bg-white border border-slate-200 text-slate-800 self-start"
                                    : "bg-teal-50 border border-teal-100 text-teal-900 self-end text-right"
                                }`}
                              >
                                <span className="text-[10px] font-black text-slate-400 mb-0.5 uppercase">
                                  {isSystem
                                    ? "SYSTEM"
                                    : isClientSender
                                    ? "CLIENT"
                                    : "FREELANCER"}
                                </span>
                                <div className={`font-medium whitespace-pre-wrap leading-relaxed ${isSystem ? "text-center" : "text-left"}`}>{renderMessageText(textContent)}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination controls */}
              {totalDisputesPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Showing {(disputesPage - 1) * disputesItemsPerPage + 1} - {Math.min(disputesPage * disputesItemsPerPage, filteredDisputes.length)} of {filteredDisputes.length} disputes
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={disputesPage === 1}
                      onClick={() => setDisputesPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed bg-white transition-all cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={disputesPage === totalDisputesPages}
                      onClick={() => setDisputesPage(p => Math.min(totalDisputesPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed bg-white transition-all cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
