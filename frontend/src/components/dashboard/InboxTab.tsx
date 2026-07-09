import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiMessageSquare } from "react-icons/fi";
import { useDashboard } from "../../app/dashboard/DashboardContext";

interface InboxTabProps {
  conversations: any[];
  selectedConvId: number | null;
  setSelectedConvId: (id: number | null) => void;
  chatMessages: any[];
  newMessageText: string;
  setNewMessageText: (text: string) => void;
  loadingConversations: boolean;
  loadingChatMessages: boolean;
  sendingChatMessage: boolean;
  handleSendChatMessage: (e: React.FormEvent) => void;
}

const getAvatarSrc = (imagePath: string | null) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/")) {
    if (imagePath.startsWith("/public")) return imagePath;
    return `https://freelancer.sangvish.com${imagePath}`;
  }
  return `https://freelancer.sangvish.com/${imagePath}`;
};

const getInitials = (name: string) => {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

export default function InboxTab({
  conversations,
  selectedConvId,
  setSelectedConvId,
  chatMessages,
  newMessageText,
  setNewMessageText,
  loadingConversations,
  loadingChatMessages,
  sendingChatMessage,
  handleSendChatMessage,
}: InboxTabProps) {
  const { userRole, gigs, triggerToast, fetchChatMessages, siteName, siteLogo } = useDashboard();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    scrollToBottom();
    const t1 = setTimeout(scrollToBottom, 50);
    const t2 = setTimeout(scrollToBottom, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [chatMessages, loadingChatMessages]);
  const [isCustomOfferModalOpen, setIsCustomOfferModalOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerGigId, setOfferGigId] = useState("");

  // Dispute Resolution custom modal state
  const [showDisputeResponseModal, setShowDisputeResponseModal] = useState(false);
  const [disputeResponseTargetId, setDisputeResponseTargetId] = useState<number | null>(null);
  const [disputeResponseRefundType, setDisputeResponseRefundType] = useState<"Full" | "Partial" | "None">("None");
  const [disputeResponseRefundPercent, setDisputeResponseRefundPercent] = useState<number>(0);
  const [disputeResponseEscalate, setDisputeResponseEscalate] = useState(false);
  const [disputeResponseExplanation, setDisputeResponseExplanation] = useState("");

  const [currentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("user");
      return uStr ? JSON.parse(uStr) : null;
    }
    return null;
  });

  const isAdminSession = typeof window !== "undefined" && !!localStorage.getItem("adminToken");
  const activeConv = conversations.find(c => c.conversation_id === selectedConvId);
  const isMediationActive = isAdminSession && activeConv && activeConv.admin_id !== null;

  // 1. Respond to dispute (Freelancer)
  const handleRespondToDispute = async (disputeId: number, action: 'Accept' | 'Contest', explanation?: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://freelancer.sangvish.com/api/payments/dispute/${disputeId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, explanation })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `Dispute ${action === 'Accept' ? 'Refund Processed' : 'Contested'} successfully!`);
        if (selectedConvId) fetchChatMessages(selectedConvId);
      } else {
        triggerToast("error", data.message || "Failed to respond to dispute.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error.");
    }
  };

  // 2. Propose split settlement
  const handleProposeSettlement = async (disputeId: number, clientRefundPercent: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://freelancer.sangvish.com/api/payments/dispute/${disputeId}/settle/propose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ client_refund_percent: clientRefundPercent })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Settlement proposal posted in chat!");
        if (selectedConvId) fetchChatMessages(selectedConvId);
      } else {
        triggerToast("error", data.message || "Failed to propose settlement.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error.");
    }
  };

  // 3. Accept split settlement
  const handleAcceptSettlement = async (disputeId: number, clientRefundPercent: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://freelancer.sangvish.com/api/payments/dispute/${disputeId}/settle/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ client_refund_percent: clientRefundPercent })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Settlement split accepted and funds released!");
        if (selectedConvId) fetchChatMessages(selectedConvId);
      } else {
        triggerToast("error", data.message || "Failed to accept settlement.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error.");
    }
  };

  // 4. Escalate dispute to admin mediator
  const handleEscalateDispute = async (disputeId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://freelancer.sangvish.com/api/payments/dispute/${disputeId}/escalate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Dispute escalated to admin mediator!", "An administrator will join this chat session shortly.");
        if (selectedConvId) fetchChatMessages(selectedConvId);
      } else {
        triggerToast("error", data.message || "Failed to escalate dispute.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error.");
    }
  };

  const handleSubmitDisputeResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeResponseTargetId) return;

    const explanation = disputeResponseExplanation.trim();
    if (!explanation || explanation === "<br>" || explanation === "<div><br></div>") {
      alert("Please provide an explanation/counter-statement.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (userRole === "freelancer") {
        if (disputeResponseRefundType === "Full") {
          // Accept refund request (100% refund)
          await handleRespondToDispute(disputeResponseTargetId, "Accept");
        } else {
          // Contest dispute
          await handleRespondToDispute(disputeResponseTargetId, "Contest", explanation);

          // Propose split (0 for None, custom % for Partial)
          const clientRefundPercent = disputeResponseRefundType === "None" ? 0 : disputeResponseRefundPercent;
          await handleProposeSettlement(disputeResponseTargetId, clientRefundPercent);
        }
      } else {
        // Client responding
        const clientRefundPercent = disputeResponseRefundType === "Full" ? 100 : (disputeResponseRefundType === "None" ? 0 : disputeResponseRefundPercent);
        await handleProposeSettlement(disputeResponseTargetId, clientRefundPercent);
      }

      // Always send the explanation as a chat message (both freelancer and client)
      await fetch(`https://freelancer.sangvish.com/api/messages/${selectedConvId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message_text: explanation })
      });

      if (disputeResponseEscalate) {
        await handleEscalateDispute(disputeResponseTargetId);
      }

      if (selectedConvId) fetchChatMessages(selectedConvId);
      setShowDisputeResponseModal(false);
    } catch (err) {
      console.error(err);
      triggerToast("error", "Failed to process dispute response.");
    }
  };

  // 5. Admin resolve dispute
  const handleAdminResolveDispute = async (disputeId: number, verdict: string, clientRefundPercent?: number) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch(`https://freelancer.sangvish.com/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ verdict, client_refund_percent: clientRefundPercent })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `Verdict "${verdict}" submitted successfully!`);
        if (selectedConvId) fetchChatMessages(selectedConvId);
      } else {
        triggerToast("error", data.message || "Failed to resolve dispute.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("error", "Network error.");
    }
  };

  return (
    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch w-full animate-fadeIn min-h-[480px]">
      {/* CONVERSATION LIST (4 cols) */}
      <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col gap-4 overflow-hidden max-h-[580px]">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">Conversations</h3>
        </div>

        <div className="flex-grow overflow-y-auto flex flex-col gap-1.5 pr-1">
          {loadingConversations ? (
            <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
              <div className="w-5 h-5 border-2 border-t-primary border-slate-200 rounded-full animate-spin"></div>
              <span className="text-slate-400 text-xxs font-bold">Syncing chats...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400 gap-2 select-none">
              <FiMessageSquare className="w-6 h-6 text-slate-350" />
              <h4 className="text-xs font-black text-slate-700 leading-none">No active chats</h4>
              <p className="text-xxs leading-normal font-semibold max-w-[180px]">Your conversations start automatically when a proposal is accepted!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConvId === conv.conversation_id;
              return (
                <div
                  key={conv.conversation_id}
                  onClick={() => setSelectedConvId(conv.conversation_id)}
                  className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50/70 transition-all ${
                    isSelected ? "bg-slate-50 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    {conv.is_group && conv.group_participants && Array.isArray(conv.group_participants) ? (
                      <div className="flex -space-x-2.5 overflow-hidden">
                        {conv.group_participants.slice(0, 3).map((p: any, idx: number) => {
                          const pAvatar = getAvatarSrc(p.profile_image);
                          return (
                            <div
                              key={p.user_id}
                              style={{ zIndex: 10 - idx }}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[8px] uppercase overflow-hidden shrink-0"
                            >
                              {pAvatar ? (
                                <img src={pAvatar} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                getInitials(p.name)
                              )}
                            </div>
                          );
                        })}
                        {conv.group_participants.length > 3 && (
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 border border-slate-350 text-slate-650 flex items-center justify-center font-black text-[8px] uppercase shrink-0">
                            +{conv.group_participants.length - 3}
                          </div>
                        )}
                      </div>
                    ) : conv.is_group ? (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200/50 flex items-center justify-center font-black text-slate-700 uppercase shadow-sm">
                        <i className="fa-solid fa-users text-slate-600 text-sm"></i>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200/50 flex items-center justify-center font-black text-slate-700 uppercase shadow-sm relative overflow-hidden shrink-0">
                        <span>{conv.recipient_name ? conv.recipient_name.substring(0, 2) : "UN"}</span>
                        {conv.recipient_image && (
                          <img
                            src={getAvatarSrc(conv.recipient_image)}
                            alt={conv.recipient_name}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-black text-slate-800 truncate capitalize">{conv.recipient_name || "Unknown Candidate"}</h4>
                    </div>
                    {conv.is_group && conv.group_participants ? (
                      <p className="text-[9px] text-slate-450 font-extrabold truncate mt-0.5 leading-none">
                        {conv.group_participants.map((p: any) => p.user_id === currentUser?.user_id ? "You" : p.name.split(" ")[0]).join(", ")}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-bold capitalize mt-0.5">{conv.recipient_role || "User"}</p>
                    )}
                    <p className="text-xxs text-slate-500 font-semibold truncate mt-1 leading-normal">
                      {conv.last_message_text && conv.last_message_text.startsWith("{") && conv.last_message_text.includes('"isDispute":true')
                        ? "⚠️ Dispute System Update"
                        : conv.last_message_text && conv.last_message_text.startsWith("{") && conv.last_message_text.includes("isCustomOffer")
                          ? "📩 Custom Payment Offer Received"
                          : conv.last_message_text || "No messages yet. Say hello!"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT ROOM (8 cols) */}
      <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[580px]">
        {selectedConvId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-sm shrink-0 overflow-hidden relative">
                  {activeConv?.is_group ? (
                    <i className="fa-solid fa-users text-white text-sm"></i>
                  ) : (
                    <>
                      <span>{getInitials(activeConv?.recipient_name || "UN")}</span>
                      {activeConv?.recipient_profile_image && (
                        <img
                          src={getAvatarSrc(activeConv.recipient_profile_image)}
                          alt={activeConv.recipient_name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {activeConv?.recipient_name || "Chat Room"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold capitalize mt-0.5">
                    {activeConv?.is_group ? "Project Group Chat" : (activeConv?.recipient_role || "User")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Connection</span>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px]"
              style={{
                backgroundColor: "#f8f9fa",
                backgroundImage: "linear-gradient(rgba(248, 249, 250, 0.93), rgba(248, 249, 250, 0.93)), url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                backgroundRepeat: "repeat"
              }}
            >
              {loadingChatMessages ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-6 h-6 border-2 border-t-primary border-slate-200 rounded-full animate-spin"></div>
                  <span className="text-slate-400 text-xxs font-bold">Retrieving messages...</span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 select-none py-12">
                  <FiMessageSquare className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-700">No messages in room yet</p>
                  <p className="text-xxs max-w-[200px] text-center mt-1 leading-normal font-semibold">Start the discussion! Type a message below to coordinate project deliverables.</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isPlatformMsg = msg.message_text.startsWith("[") && msg.message_text.includes("Platform Message]");
                  const isOwn = !isPlatformMsg && msg.sender_id === currentUser?.user_id;
                  let offerData: any = null;
                  try {
                    if (msg.message_text.trim().startsWith("{") && msg.message_text.includes('"isCustomOffer":true')) {
                      offerData = JSON.parse(msg.message_text);
                    }
                  } catch (e) {}

                  let disputeData: any = null;
                  try {
                    if (msg.message_text.trim().startsWith("{") && msg.message_text.includes('"isDispute":true')) {
                      disputeData = JSON.parse(msg.message_text);
                    }
                  } catch (e) {}

                  if (disputeData) {
                    let cleanDetails = disputeData.details;
                    if (disputeData.type === "dispute_resolved" && cleanDetails && cleanDetails.includes("minus fees")) {
                      cleanDetails = cleanDetails.replace("($500.00 minus fees)", "($500.00) and received a net amount of $500.00");
                      cleanDetails = cleanDetails.replace("minus fees", "and received a net amount of the full split payout");
                    }

                    return (
                      <div
                        key={idx}
                        className="flex justify-center my-3 w-full select-none"
                      >
                        <div className={`border rounded-2xl p-4 shadow-sm text-left max-w-md w-full bg-slate-50/50 ${
                          disputeData.type === "dispute_resolved"
                            ? "bg-emerald-50 border-emerald-250"
                            : disputeData.type === "dispute_escalated"
                            ? "bg-rose-50 border-rose-250"
                            : "bg-amber-50 border-amber-250"
                        }`}>
                          <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-200/60">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                              disputeData.type === "dispute_resolved"
                                ? "bg-emerald-100 text-emerald-700"
                                : disputeData.type === "dispute_escalated"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {disputeData.type === "dispute_opened" ? "Dispute Opened" :
                               disputeData.type === "dispute_contested" ? "Dispute Contested" :
                               disputeData.type === "settlement_proposed" 
                                 ? (disputeData.client_refund_percent === 0 ? "No Refund Proposed" : disputeData.client_refund_percent === 100 ? "Full Refund Proposed" : "Settlement Split Proposed") :
                               disputeData.type === "dispute_escalated" ? "Escalated to Admin" :
                               disputeData.type === "dispute_revision_required" ? "Revision Required" : "Dispute Resolved"}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400">Escrow on Hold</span>
                          </div>

                          {disputeData.type === "dispute_opened" && (
                            <div>
                              <p className="text-xs font-black text-slate-800">Reason: {disputeData.reason}</p>
                              <p className="text-xxs font-medium text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{disputeData.description}</p>
                              
                              {/* Freelancer actions */}
                              {userRole === "freelancer" && !isOwn && (
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => {
                                      setDisputeResponseTargetId(disputeData.dispute_id);
                                      setDisputeResponseRefundType("Full");
                                      setDisputeResponseRefundPercent(100);
                                      setDisputeResponseExplanation("");
                                      setDisputeResponseEscalate(false);
                                      setShowDisputeResponseModal(true);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] py-1.5 px-3 rounded-lg border-0 cursor-pointer shadow-sm uppercase tracking-wider animate-pulse"
                                  >
                                    Accept Refund Request
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDisputeResponseTargetId(disputeData.dispute_id);
                                      setDisputeResponseRefundType("None");
                                      setDisputeResponseRefundPercent(0);
                                      setDisputeResponseExplanation("");
                                      setDisputeResponseEscalate(false);
                                      setShowDisputeResponseModal(true);
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] py-1.5 px-3 rounded-lg border-0 cursor-pointer shadow-sm uppercase tracking-wider"
                                  >
                                    Contest Dispute
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {disputeData.type === "dispute_contested" && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-700">Freelancer has contested the dispute.</p>
                              <p className="text-xxs font-medium text-slate-600 bg-slate-50 p-2 border border-slate-100 rounded-lg mt-1 whitespace-pre-wrap">
                                {disputeData.explanation}
                              </p>

                              {/* Client actions */}
                              {userRole === "client" && (
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => {
                                      setDisputeResponseTargetId(disputeData.dispute_id);
                                      setDisputeResponseRefundType("Partial");
                                      setDisputeResponseRefundPercent(50);
                                      setDisputeResponseExplanation("");
                                      setDisputeResponseEscalate(false);
                                      setShowDisputeResponseModal(true);
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] py-1.5 px-3 rounded-lg border-0 cursor-pointer shadow-sm uppercase tracking-wider animate-pulse"
                                  >
                                    Propose Split Settlement
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDisputeResponseTargetId(disputeData.dispute_id);
                                      setDisputeResponseRefundType("None");
                                      setDisputeResponseRefundPercent(0);
                                      setDisputeResponseExplanation("");
                                      setDisputeResponseEscalate(true);
                                      setShowDisputeResponseModal(true);
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] py-1.5 px-3 rounded-lg border-0 cursor-pointer shadow-sm uppercase tracking-wider"
                                  >
                                    Escalate to Admin
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {disputeData.type === "settlement_proposed" && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-700">
                                {disputeData.client_refund_percent === 0
                                  ? <>
                                      <span className="text-rose-600">❌ No Refund</span>
                                      {" — "}
                                      {disputeData.proposer_id === currentUser?.user_id
                                        ? "You rejected the client's refund request. Full payment should go to the freelancer."
                                        : "The freelancer rejected the refund request. Full payment claimed by freelancer."}
                                    </>
                                  : disputeData.client_refund_percent === 100
                                    ? <>
                                        <span className="text-emerald-600">✓ Full Refund</span>
                                        {" — "}
                                        {disputeData.proposer_id === currentUser?.user_id
                                          ? "You agreed to refund the client in full."
                                          : "The other party proposed a full refund to the client."}
                                      </>
                                    : <>
                                        {disputeData.proposer_id === currentUser?.user_id ? "You" : "The other party"} proposed a partial split:
                                      </>
                                }
                              </p>
                              <div className="bg-white p-2 border border-slate-100 rounded-lg mt-1.5 flex justify-around text-center">
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 block uppercase">Client Refund</span>
                                  <span className="text-xs font-black text-slate-800">{disputeData.client_refund_percent}%</span>
                                </div>
                                <div className="border-r border-slate-200"></div>
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 block uppercase">Freelancer Pay</span>
                                  <span className="text-xs font-black text-slate-800">{disputeData.freelancer_pay_percent}%</span>
                                </div>
                              </div>

                              {disputeData.proposer_id !== currentUser?.user_id && (
                                <div className="mt-3 flex gap-2">
                                  <button
                                    onClick={() => handleAcceptSettlement(disputeData.dispute_id, disputeData.client_refund_percent)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] py-2 px-3 rounded-lg border-0 cursor-pointer shadow-sm uppercase tracking-wider animate-pulse"
                                  >
                                    {disputeData.client_refund_percent === 0
                                      ? "Accept — No Refund"
                                      : disputeData.client_refund_percent === 100
                                        ? "Accept — Full Refund"
                                        : `Accept — ${disputeData.client_refund_percent}% / ${disputeData.freelancer_pay_percent}% Split`}
                                  </button>
                                  <button
                                    onClick={() => handleEscalateDispute(disputeData.dispute_id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] py-2 px-3 rounded-lg border-0 cursor-pointer shadow-sm uppercase tracking-wider"
                                  >
                                    Let Admin Decide
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {disputeData.type === "dispute_escalated" && (
                            <div>
                              <p className="text-xxs font-bold text-rose-750 leading-relaxed">
                                ⚖ This dispute has been escalated. A LancerFlow administrator has joined this thread as a mediator to review terms, requirements, and logs.
                              </p>
                            </div>
                          )}

                          {disputeData.type === "dispute_revision_required" && (
                            <div>
                              <p className="text-xxs font-bold text-slate-700 leading-relaxed">
                                🛠 Admin Review Complete: Revision Required. Freelancer has been requested to submit revised deliverables in accordance with original contract specifications.
                              </p>
                            </div>
                          )}

                          {disputeData.type === "dispute_resolved" && (
                            <div>
                              <p className="text-xs font-black text-emerald-800">Verdict: {disputeData.verdict}</p>
                              <p className="text-xxs font-semibold text-slate-650 mt-1">{cleanDetails}</p>
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 select-none">
                          {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

                  if (offerData) {
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${
                          isOwn ? "self-end items-end" : "self-start items-start"
                        } mb-3`}
                      >
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-200/80 rounded-2xl p-4 shadow-sm text-left max-w-md">
                          <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-2">
                            <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">
                              Custom Payment Offer
                            </span>
                            <span className="text-sm font-black text-slate-800">
                              ${parseFloat(offerData.price).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 mb-1">{offerData.title}</h4>
                          <p className="text-slate-600 text-xxs font-medium leading-relaxed whitespace-pre-wrap">{offerData.description}</p>
                          
                          {/* Action Buttons for Client */}
                          {offerData.status === "Pending" ? (
                            userRole === "client" ? (
                              <button
                                onClick={async () => {
                                  // Accept & create order
                                  const token = localStorage.getItem("token");
                                  try {
                                    const res = await fetch("https://freelancer.sangvish.com/api/freelancer/client/gigs/apply", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`
                                      },
                                      body: JSON.stringify({
                                        gig_id: offerData.gig_id || 1,
                                        requirements: `Custom Offer: ${offerData.title}\n\n${offerData.description}`,
                                        price: parseFloat(offerData.price),
                                        message_id: msg.message_id
                                      })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                      triggerToast("success", "Custom offer accepted and order placed!");
                                      setSelectedConvId(selectedConvId); 
                                    } else {
                                      triggerToast("error", data.message || "Failed to accept custom offer.");
                                    }
                                  } catch (err) {
                                    triggerToast("error", "Failed to accept offer.");
                                  }
                                }}
                                className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] py-2 px-3 rounded-xl shadow-md transition-all uppercase tracking-wider text-center cursor-pointer border-0"
                              >
                                Accept Offer & Fund Escrow
                              </button>
                            ) : (
                              <div className="mt-3 text-xxs font-bold text-amber-600 bg-amber-100/50 border border-amber-200/50 px-2 py-1 rounded text-center">
                                Sent & Waiting for Client approval
                              </div>
                            )
                          ) : (
                            <div className="mt-3 text-xxs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-center flex items-center justify-center gap-1">
                              <i className="fa-solid fa-check-circle"></i> Offer Accepted & Order Active!
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 select-none">
                          {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  }

                  const isSystemMsg = msg.message_text.startsWith("System:") || isPlatformMsg;

                  if (isSystemMsg) {
                    let cleanText = msg.message_text;
                    if (cleanText.startsWith("System:")) {
                      cleanText = cleanText.substring(7).trim();
                    } else if (isPlatformMsg) {
                      cleanText = cleanText.replace(/(?:Site Logo|Logo):\s*[^\s\r\n]+/gi, "");
                      cleanText = cleanText.replace(/^\[[^\]]+Platform Message\]\s*/i, "").trim();
                    }

                    return (
                      <div key={idx} className="flex justify-center my-3.5 w-full select-none">
                        <div className="bg-gradient-to-r from-teal-50/70 to-emerald-50/70 border border-emerald-200 rounded-2xl px-5 py-3 text-xxs font-bold text-teal-950 max-w-[85%] text-left shadow-sm leading-relaxed whitespace-pre-wrap">
                          <span className="font-black text-teal-800 uppercase tracking-widest text-[9px] block mb-1.5 flex items-center gap-1.5">
                            <i className="fa-solid fa-circle-info text-teal-700"></i> {isPlatformMsg ? "Platform Notification" : "System Notification"}
                          </span>
                          {cleanText}
                          <span className="block text-[8px] font-bold text-slate-400 mt-2 text-right">
                            {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  let displayMsgText = msg.message_text;
                  let parsedLogoUrl = "";

                  if (isPlatformMsg) {
                    const match = displayMsgText.match(/(?:Site Logo|Logo):\s*([^\s\r\n]+)/i);
                    if (match) {
                      parsedLogoUrl = match[1];
                      displayMsgText = displayMsgText.replace(/(?:Site Logo|Logo):\s*[^\s\r\n]+/gi, "");
                    }
                    displayMsgText = displayMsgText.replace(/^\[[^\]]+Platform Message\]\s*/i, "").trim();
                  }

                  const activeLogo = parsedLogoUrl || siteLogo;
                  const showLogo = activeLogo && activeLogo !== "/public/logo.png" && activeLogo !== "logo.png";
                  const cleanLogoSrc = showLogo ? getAvatarSrc(activeLogo) : "";
                  const initials = isPlatformMsg ? getInitials(siteName || "Buy2Lancer") : getInitials(msg.sender_name || "User");
                  const displayName = isPlatformMsg ? (siteName || "Buy2Lancer") : (isOwn ? "You" : msg.sender_name || "User");
                  const avatarSrc = isPlatformMsg ? cleanLogoSrc : getAvatarSrc(msg.sender_profile_image);

                  const getNameColor = (senderId: number) => {
                    const colors = [
                      "text-emerald-600",
                      "text-pink-600",
                      "text-blue-600",
                      "text-violet-600",
                      "text-orange-600",
                      "text-teal-600",
                      "text-indigo-600",
                      "text-amber-600"
                    ];
                    return colors[senderId % colors.length] || "text-slate-500";
                  };

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 items-start max-w-[85%] ${
                        isOwn ? "self-end flex-row-reverse" : "self-start flex-row"
                      } mb-3`}
                    >
                      {/* Avatar - Hidden for own user like WhatsApp */}
                      {!isOwn && (
                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center font-bold text-slate-700 text-[10px] uppercase overflow-hidden shadow-sm relative">
                          <span>{initials}</span>
                          {avatarSrc && (
                            <img 
                              src={avatarSrc} 
                              alt="Avatar" 
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* Message Content Container */}
                      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        {/* Sender Name - Colorized for others like WhatsApp */}
                        <span className={`text-[9px] font-black uppercase tracking-wider mb-1 ${isOwn ? "text-slate-400" : (isPlatformMsg ? "text-teal-700" : getNameColor(msg.sender_id))}`}>
                          {displayName}
                        </span>

                        {/* Bubble - Styled like WhatsApp */}
                        <div
                          className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm text-left whitespace-pre-line ${
                            isOwn
                              ? "bg-[#d9fdd3] text-slate-850 rounded-tr-none border border-[#e1f3d4]"
                              : isPlatformMsg
                              ? "bg-gradient-to-br from-teal-50 to-emerald-50 text-emerald-900 border border-emerald-200/60 rounded-tl-none font-semibold"
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-200/50"
                          }`}
                        >
                          {displayMsgText.startsWith("<") || displayMsgText.includes("<div") || displayMsgText.includes("<p") || displayMsgText.includes("<b") || displayMsgText.includes("<i") || displayMsgText.includes("<ul>") ? (
                            <div dangerouslySetInnerHTML={{ __html: displayMsgText }} />
                          ) : (
                            displayMsgText
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[8px] font-bold text-slate-400 mt-1 select-none">
                          {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Mediator Sticky Panel */}
            {isMediationActive && (
              <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    ⚖ Admin Mediation Console
                  </span>
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    Escalated Room
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      const disp = chatMessages.find(m => {
                        try {
                          const parsed = JSON.parse(m.message_text);
                          return parsed.isDispute && parsed.dispute_id;
                        } catch (e) { return false; }
                      });
                      const dispId = disp ? JSON.parse(disp.message_text).dispute_id : null;
                      if (dispId) {
                        if (confirm("Are you sure you want to award a 100% refund to the client and close the contract?")) {
                          handleAdminResolveDispute(dispId, "Buyer Wins");
                        }
                      } else {
                        alert("Active dispute record ID not found in messages.");
                      }
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] py-2 px-3.5 rounded-xl border border-rose-200 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Award 100% Client Refund
                  </button>
                  <button
                    onClick={() => {
                      const disp = chatMessages.find(m => {
                        try {
                          const parsed = JSON.parse(m.message_text);
                          return parsed.isDispute && parsed.dispute_id;
                        } catch (e) { return false; }
                      });
                      const dispId = disp ? JSON.parse(disp.message_text).dispute_id : null;
                      if (dispId) {
                        if (confirm("Are you sure you want to release 100% of the funds to the freelancer and mark the contract as completed?")) {
                          handleAdminResolveDispute(dispId, "Freelancer Wins");
                        }
                      } else {
                        alert("Active dispute record ID not found in messages.");
                      }
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] py-2 px-3.5 rounded-xl border border-emerald-200 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Release 100% Freelancer Payout
                  </button>
                  <button
                    onClick={() => {
                      const disp = chatMessages.find(m => {
                        try {
                          const parsed = JSON.parse(m.message_text);
                          return parsed.isDispute && parsed.dispute_id;
                        } catch (e) { return false; }
                      });
                      const dispId = disp ? JSON.parse(disp.message_text).dispute_id : null;
                      if (dispId) {
                        const pct = prompt("Enter client refund percentage split (e.g. 40 for 40% client, 60% freelancer):", "50");
                        if (pct) {
                          handleAdminResolveDispute(dispId, "Partial Split", parseFloat(pct));
                        }
                      } else {
                        alert("Active dispute record ID not found in messages.");
                      }
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[10px] py-2 px-3.5 rounded-xl border border-amber-200 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Execute Custom Split
                  </button>
                  <button
                    onClick={() => {
                      const disp = chatMessages.find(m => {
                        try {
                          const parsed = JSON.parse(m.message_text);
                          return parsed.isDispute && parsed.dispute_id;
                        } catch (e) { return false; }
                      });
                      const dispId = disp ? JSON.parse(disp.message_text).dispute_id : null;
                      if (dispId) {
                        if (confirm("Submit request to freelancer for revised work submissions?")) {
                          handleAdminResolveDispute(dispId, "Revision Required");
                        }
                      } else {
                        alert("Active dispute record ID not found in messages.");
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-2 px-3.5 rounded-xl border border-slate-300 transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Force Freelancer Revision
                  </button>
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 flex gap-2">
              {userRole === "freelancer" && (
                <button
                  type="button"
                  onClick={() => setIsCustomOfferModalOpen(true)}
                  title="Create Custom Offer"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-3 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center shrink-0 border-0"
                >
                  <i className="fa-solid fa-tags"></i>
                </button>
              )}
              <input
                type="text"
                placeholder="Type your project coordination message..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-grow bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-primary/50 focus:bg-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all text-slate-850 font-bold"
              />
              <button
                type="submit"
                disabled={sendingChatMessage || !newMessageText.trim()}
                className="bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0 border-0"
              >
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-12 text-slate-400 gap-3 select-none">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-md">
              <FiMessageSquare className="w-6 h-6 text-slate-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-700">Select a Chat Room</h3>
              <p className="text-xxs leading-normal font-semibold max-w-xs mt-1">Select a candidate conversation from the list to view deliverables and discuss project details.</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Offer Modal */}
      {isCustomOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative">
            <button
              onClick={() => {
                setIsCustomOfferModalOpen(false);
                setOfferTitle("");
                setOfferPrice("");
                setOfferDesc("");
                setOfferGigId("");
              }}
              className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-850 cursor-pointer"
            >
              Cancel
            </button>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800">Create Custom Payment Offer</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Discussed custom parameters or extra features. Fix the payment amount here.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold block mb-1 text-slate-600">Offer Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Gig with Extra Feature & Fast Delivery"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1 text-slate-600">Total Price ($) *</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1 text-slate-600">Select Associated Gig *</label>
                <select
                  value={offerGigId}
                  onChange={(e) => setOfferGigId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none font-bold"
                >
                  <option value="">-- Choose Gig --</option>
                  {gigs.map((g: any) => (
                    <option key={g.gig_id} value={g.gig_id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1 text-slate-600">Deliverables Description *</label>
                <textarea
                  rows={4}
                  placeholder="Outline the extra revisions, deliverables, or specifications agreed upon in messages..."
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-primary focus:outline-none"
                />
              </div>

              <button
                onClick={async () => {
                  if (!offerTitle.trim() || !offerPrice || !offerDesc.trim() || !offerGigId) {
                    triggerToast("error", "Please fill out all required fields.");
                    return;
                  }
                  
                  const offerPayload = {
                    isCustomOffer: true,
                    title: offerTitle.trim(),
                    price: parseFloat(offerPrice),
                    description: offerDesc.trim(),
                    gig_id: parseInt(offerGigId),
                    status: "Pending"
                  };

                  // Send payload as message
                  const token = localStorage.getItem("token");
                  try {
                    const res = await fetch(`https://freelancer.sangvish.com/api/messages/${selectedConvId}`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ message_text: JSON.stringify(offerPayload) })
                    });
                    if (res.ok) {
                      triggerToast("success", "Custom offer dispatched to client!");
                      setIsCustomOfferModalOpen(false);
                      setOfferTitle("");
                      setOfferPrice("");
                      setOfferDesc("");
                      setOfferGigId("");
                      // Refresh message feed
                      setSelectedConvId(selectedConvId);
                    }
                  } catch (e) {
                    triggerToast("error", "Failed to send custom offer.");
                  }
                }}
                className="w-full mt-2 bg-primary hover:bg-primary-hover text-white font-black text-xs py-2.5 rounded-xl shadow-md transition-all uppercase tracking-wider text-center cursor-pointer border-0"
              >
                Send Offer to Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Response custom modal */}
      {showDisputeResponseModal && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden p-6 sm:p-8 animate-fadeIn text-left relative text-slate-805">
            <button
              onClick={() => {
                setShowDisputeResponseModal(false);
                setDisputeResponseTargetId(null);
              }}
              className="absolute top-6 right-6 font-bold text-xs px-3 py-1.5 rounded-xl transition-all bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-850 cursor-pointer"
            >
              Cancel
            </button>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800">⚠️ Respond to Dispute</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Configure your dispute response and proposal splits below.</p>
            </div>
            
            <form onSubmit={handleSubmitDisputeResponse} className="flex flex-col gap-4">
              {/* Refund Type Selection */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Proposed Refund Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeResponseRefundType("Full");
                      setDisputeResponseRefundPercent(100);
                    }}
                    className={`py-2 px-3 text-xxs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      disputeResponseRefundType === "Full"
                        ? "bg-teal-50 border-teal-500 text-teal-700 font-black shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Full Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeResponseRefundType("Partial");
                      setDisputeResponseRefundPercent(50);
                    }}
                    className={`py-2 px-3 text-xxs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      disputeResponseRefundType === "Partial"
                        ? "bg-teal-50 border-teal-500 text-teal-700 font-black shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Partial Split
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeResponseRefundType("None");
                      setDisputeResponseRefundPercent(0);
                    }}
                    className={`py-2 px-3 text-xxs font-extrabold rounded-xl border transition-all cursor-pointer ${
                      disputeResponseRefundType === "None"
                        ? "bg-teal-50 border-teal-500 text-teal-700 font-black shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    No Refund
                  </button>
                </div>
              </div>

              {/* Partial Refund Amount/Percentage Slider */}
              {disputeResponseRefundType === "Partial" && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    Client Refund Percentage: {disputeResponseRefundPercent}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={disputeResponseRefundPercent}
                    onChange={(e) => setDisputeResponseRefundPercent(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1 uppercase">
                    <span>Client: {disputeResponseRefundPercent}%</span>
                    <span>Freelancer: {100 - disputeResponseRefundPercent}%</span>
                  </div>
                </div>
              )}

              {/* Rich Text Editor Explanation */}
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Explanation & Counter Statement</label>
                
                {/* Toolbar */}
                <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-t-xl border-x border-t border-slate-200 select-none">
                  <button
                    type="button"
                    onClick={() => document.execCommand("bold", false)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-50 rounded text-[10px] font-bold border border-slate-200 cursor-pointer text-slate-700"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand("italic", false)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-50 rounded text-[10px] italic border border-slate-200 cursor-pointer text-slate-700"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand("insertUnorderedList", false)}
                    className="px-2 py-0.5 bg-white hover:bg-slate-50 rounded text-[10px] font-bold border border-slate-200 cursor-pointer text-slate-700"
                  >
                    • List
                  </button>
                </div>

                {/* Content Editable Area */}
                <div
                  contentEditable
                  onInput={(e) => setDisputeResponseExplanation(e.currentTarget.innerHTML)}
                  className="w-full min-h-[120px] bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-3 text-xs font-bold text-slate-750 focus:outline-none focus:bg-white transition-all overflow-y-auto leading-relaxed"
                  style={{ outline: 'none' }}
                />
              </div>

              {/* Escalate to Admin Option */}
              <div className="flex items-center gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-rose-800">
                <input
                  type="checkbox"
                  id="escalateToAdmin"
                  checked={disputeResponseEscalate}
                  onChange={(e) => setDisputeResponseEscalate(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
                />
                <label htmlFor="escalateToAdmin" className="text-xxs font-black uppercase cursor-pointer select-none leading-none mt-0.5">
                  Escalate directly to admin mediator
                </label>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="w-full mt-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs py-3 rounded-xl shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-center cursor-pointer border-0"
              >
                Submit Response
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
