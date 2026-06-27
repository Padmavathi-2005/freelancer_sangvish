"use client";

import React from "react";
import InboxTab from "@/components/dashboard/InboxTab";
import { useDashboard } from "../DashboardContext";

export default function InboxPage() {
  const {
    conversations,
    selectedConvId,
    setSelectedConvId,
    chatMessages,
    newMessageText,
    setNewMessageText,
    loadingConversations,
    loadingChatMessages,
    sendingChatMessage,
    handleSendChatMessage
  } = useDashboard();

  return (
    <InboxTab
      conversations={conversations}
      selectedConvId={selectedConvId}
      setSelectedConvId={setSelectedConvId}
      chatMessages={chatMessages}
      newMessageText={newMessageText}
      setNewMessageText={setNewMessageText}
      loadingConversations={loadingConversations}
      loadingChatMessages={loadingChatMessages}
      sendingChatMessage={sendingChatMessage}
      handleSendChatMessage={handleSendChatMessage}
    />
  );
}
