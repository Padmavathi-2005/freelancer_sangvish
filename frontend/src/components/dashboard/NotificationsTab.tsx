import React from "react";
import { FiBell, FiCheck, FiMessageSquare, FiFileText, FiBriefcase } from "react-icons/fi";

interface NotificationsTabProps {
  notifications: any[];
  unreadNotificationsCount: number;
  handleMarkAllRead: () => Promise<void>;
  handleMarkSingleRead: (notifId: number, notifType: string, refId: string | null) => Promise<void>;
}

export default function NotificationsTab({
  notifications,
  unreadNotificationsCount,
  handleMarkAllRead,
  handleMarkSingleRead,
}: NotificationsTabProps) {
  return (
    <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FiBell className="w-5 h-5 text-primary shrink-0" />
            Notifications & Activity Log
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Stay updated on your proposal status, gig orders, and profile alerts.</p>
        </div>
        {unreadNotificationsCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Mark All as Read</span>
            <FiCheck className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-md text-slate-400">
              <FiBell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-1">All caught up!</h3>
              <p className="text-slate-400 text-xs font-semibold">You have no new or past notifications at the moment.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.notification_id}
                onClick={() => handleMarkSingleRead(n.notification_id, n.type, n.reference_id)}
                className={`py-4 px-4 flex gap-4 hover:bg-slate-50/50 rounded-xl transition-all cursor-pointer ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
              >
                {/* Type Icon */}
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 shadow-sm">
                  {n.type === "message" ? (
                    <FiMessageSquare className="w-4 h-4 text-sky-500" />
                  ) : n.type === "proposal" ? (
                    <FiFileText className="w-4 h-4 text-violet-500" />
                  ) : n.type === "gig" ? (
                    <FiBriefcase className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <FiBell className="w-4 h-4 text-amber-500" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className={`text-xs ${!n.is_read ? "font-black text-slate-900" : "font-extrabold text-slate-700"}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {new Date(n.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
