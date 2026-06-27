import React from "react";
import { FiMessageSquare } from "react-icons/fi";

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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200/50 flex items-center justify-center font-black text-slate-700 uppercase shadow-sm">
                    {conv.recipient_name ? conv.recipient_name.substring(0, 2) : "UN"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-black text-slate-800 truncate capitalize">{conv.recipient_name || "Unknown Candidate"}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold capitalize mt-0.5">{conv.recipient_role || "User"}</p>
                    <p className="text-xxs text-slate-500 font-semibold truncate mt-1 leading-normal">
                      {conv.last_message_text || "No messages yet. Say hello!"}
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
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Chat Session Activated</h4>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px]">
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
                  const isOwn = msg.is_own_message;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[70%] ${
                        isOwn ? "self-end items-end" : "self-start items-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                          isOwn
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/40"
                        }`}
                      >
                        {msg.message_text}
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 mt-1 select-none">
                        {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 flex gap-2">
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
                className="bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
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
    </div>
  );
}
