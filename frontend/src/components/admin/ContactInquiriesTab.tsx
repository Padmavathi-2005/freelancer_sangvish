"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  FiMail, 
  FiClock, 
  FiTrash2, 
  FiCheckCircle, 
  FiMessageSquare, 
  FiSearch, 
  FiExternalLink, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiInbox,
  FiX,
  FiSend,
  FiLoader
} from "react-icons/fi";
import { API_URL } from "@/config/api";

interface Inquiry {
  id: number;
  name: string | null;
  email: string;
  subject: string;
  message: string;
  status: "Pending" | "Responded" | "Archived";
  created_at: string;
}

interface ContactInquiriesTabProps {
  isDark?: boolean;
}

export default function ContactInquiriesTab({ isDark = false }: ContactInquiriesTabProps) {
  const [mounted, setMounted] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Responded" | "Archived">("All");
  
  // Modals
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyingInquiry, setReplyingInquiry] = useState<Inquiry | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getToken = () => localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/contact-inquiries`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data);
      } else {
        setError("Failed to fetch contact inquiries.");
      }
    } catch {
      setError("Network error while connecting to server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleUpdateStatus = async (id: number, status: "Pending" | "Responded" | "Archived") => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/contact-inquiries/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
        if (selectedInquiry?.id === id) {
          setSelectedInquiry((prev) => (prev ? { ...prev, status } : null));
        }
        showToast(`Status updated to ${status}`);
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch {
      showToast("Network error during status update.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contact inquiry record permanently?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_URL}/admin/contact-inquiries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((item) => item.id !== id));
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
        if (replyingInquiry?.id === id) setReplyingInquiry(null);
        showToast("Inquiry deleted successfully!");
      } else {
        showToast("Failed to delete inquiry.", "error");
      }
    } catch {
      showToast("Network error during deletion.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReplyModal = (item: Inquiry) => {
    setReplyingInquiry(item);
    setReplySubject(`Re: ${item.subject || "Your inquiry"}`);
    setReplyMessage(
      `Hello ${item.name || "Customer"},\n\nThank you for reaching out to us regarding "${item.subject}".\n\nBest regards,\nSupport Team`
    );
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingInquiry) return;
    if (!replyMessage.trim()) {
      showToast("Please enter a reply message.", "error");
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`${API_URL}/admin/contact-inquiries/${replyingInquiry.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          replySubject,
          replyMessage,
        }),
      });

      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === replyingInquiry.id ? { ...item, status: "Responded" } : item))
        );
        if (selectedInquiry?.id === replyingInquiry.id) {
          setSelectedInquiry((prev) => (prev ? { ...prev, status: "Responded" } : null));
        }
        showToast("Reply sent successfully & inquiry marked as Responded!");
        setReplyingInquiry(null);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to send reply.", "error");
      }
    } catch {
      showToast("Network error while sending reply.", "error");
    } finally {
      setSendingReply(false);
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      (inquiry.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "All" || inquiry.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalCount = inquiries.length;
  const pendingCount = inquiries.filter((i) => i.status === "Pending").length;
  const respondedCount = inquiries.filter((i) => i.status === "Responded").length;

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">Public Contact Form Inquiries</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Audit and respond to inquiries submitted via the platform public contact page (/contact).
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          disabled={loading}
          className={`px-4 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            isDark
              ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black shrink-0">
            <FiInbox className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Submitted</span>
            <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">{totalCount}</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pending Response</span>
            <span className="text-xl font-black text-amber-600 leading-tight">{pendingCount}</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex items-center gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Resolved / Responded</span>
            <span className="text-xl font-black text-emerald-600 leading-tight">{respondedCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(["All", "Pending", "Responded", "Archived"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab
                  ? "bg-teal-700 text-white shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-bold border focus:outline-none transition ${
              isDark
                ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-teal-500"
                : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white"
            }`}
          />
        </div>
      </div>

      {/* INQUIRIES LIST TABLE */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${isDark ? "bg-slate-950 border-slate-850" : "bg-white border-slate-200/80"}`}>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3">
            <FiRefreshCw className="w-6 h-6 animate-spin text-teal-600" />
            <span>Loading public contact form inquiries...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 text-xs font-bold flex flex-col items-center justify-center gap-2">
            <FiAlertCircle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
              <FiMessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-200">No contact inquiries found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">When users submit messages via /contact form, they will appear here automatically.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? "border-slate-850 text-slate-400 bg-slate-900/50" : "border-slate-150 text-slate-500 bg-slate-50"}`}>
                  <th className="py-3.5 px-4">Sender</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status Selector</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {filteredInquiries.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-slate-50/50 dark:hover:bg-slate-900/40 ${
                      item.status === "Pending" ? "font-bold" : ""
                    }`}
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-black text-xs flex items-center justify-center shrink-0">
                          {(item.name || item.email || "U").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-slate-800 dark:text-slate-100 truncate">{item.name || "Anonymous Sender"}</span>
                          <span className="text-[11px] font-semibold text-slate-400 truncate">{item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{item.subject}</span>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-[220px]">
                        {item.message}
                      </p>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 text-[11px] font-semibold">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* INTERACTIVE STATUS SELECTOR */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <select
                        value={item.status}
                        disabled={actionLoading === item.id}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as "Pending" | "Responded" | "Archived")}
                        className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border cursor-pointer focus:outline-none transition ${
                          item.status === "Pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200 focus:ring-2 focus:ring-amber-300"
                            : item.status === "Responded"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-2 focus:ring-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-200 focus:ring-2 focus:ring-slate-300"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Responded">Responded</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInquiry(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          View Message
                        </button>

                        <button
                          onClick={() => handleOpenReplyModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <FiMail className="w-3 h-3 text-white" /> Reply
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete inquiry"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MESSAGE MODAL (PORTAL TO BODY SO IT COMPLETELY OVERLAYS SIDEBAR WITH REDUCED SOFT BLUR) */}
      {mounted && selectedInquiry && createPortal(
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[99999] flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 flex flex-col gap-4 animate-scaleUp text-left relative ${
            isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
          }`}>
            <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">Public Contact Form Inquiry</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">{selectedInquiry.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Sender Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedInquiry.name || "Anonymous Sender"}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Email Address</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 break-all">{selectedInquiry.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Submitted At</span>
                <span className="font-semibold text-slate-500">{new Date(selectedInquiry.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Current Status</span>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => handleUpdateStatus(selectedInquiry.id, e.target.value as "Pending" | "Responded" | "Archived")}
                  className="text-xs font-bold text-teal-700 bg-transparent border-b border-teal-400 cursor-pointer focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Responded">Responded</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Inquiry Message Body</span>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedInquiry.message}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-4 border-slate-100 dark:border-slate-850 mt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "Responded")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition cursor-pointer"
                >
                  Mark Responded
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "Archived")}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Archive
                </button>
              </div>

              <button
                onClick={() => {
                  const inq = selectedInquiry;
                  setSelectedInquiry(null);
                  handleOpenReplyModal(inq);
                }}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FiMail className="w-3.5 h-3.5" /> Reply to Inquiry
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SEND REPLY MODAL (PORTAL TO BODY SO IT COMPLETELY OVERLAYS SIDEBAR WITH REDUCED SOFT BLUR) */}
      {mounted && replyingInquiry && createPortal(
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[99999] flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleSendReply}
            className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 flex flex-col gap-4 animate-scaleUp text-left relative ${
              isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">Send Response to Customer</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  Reply to {replyingInquiry.name || replyingInquiry.email}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplyingInquiry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">To Email Address</label>
                <input
                  type="text"
                  disabled
                  value={replyingInquiry.email}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 opacity-80 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-bold transition focus:outline-none ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-white focus:border-teal-500"
                      : "bg-white border-slate-250 text-slate-850 focus:border-teal-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Message Body</label>
                <textarea
                  rows={6}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className={`w-full border rounded-xl p-3.5 text-xs font-medium transition focus:outline-none leading-relaxed ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-white focus:border-teal-500"
                      : "bg-white border-slate-250 text-slate-850 focus:border-teal-500"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-4 border-slate-100 dark:border-slate-850 mt-2">
              <a
                href={`mailto:${replyingInquiry.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyMessage)}`}
                rel="noreferrer"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5"
              >
                <FiExternalLink className="w-3.5 h-3.5" /> Open in Desktop Email App
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingInquiry(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="px-6 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {sendingReply ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Reply...</span>
                    </>
                  ) : (
                    <>
                      <FiSend className="w-3.5 h-3.5 text-white" />
                      <span>Send Email Reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3.5 animate-fadeIn max-w-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
            {toast.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-white leading-tight">Notification</span>
            <span className="text-[11px] font-semibold text-slate-300 mt-0.5 leading-snug">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
