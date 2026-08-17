import React from "react";
import { FiBell, FiCheck, FiMessageSquare, FiFileText, FiBriefcase } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";

interface NotificationsTabProps {
  notifications: any[];
  unreadNotificationsCount: number;
  handleMarkAllRead: () => Promise<void>;
  handleMarkSingleRead: (notifId: number, notifType: string, refId: string | null) => Promise<void>;
}

const formatNotificationMessage = (msg: string) => {
  if (!msg) return "";
  if (typeof msg === "string" && (msg.trim().startsWith("{") || msg.trim().startsWith("["))) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.isCustomOffer || parsed.type === "offer") {
        return `Custom Offer: "${parsed.title || 'Project Offer'}" for $${parseFloat(parsed.price || parsed.amount || 0).toLocaleString()}`;
      }
      if (parsed.text || parsed.message) {
        return parsed.text || parsed.message;
      }
    } catch (e) {
      // ignore
    }
  }
  return msg;
};

export default function NotificationsTab({
  notifications,
  unreadNotificationsCount,
  handleMarkAllRead,
  handleMarkSingleRead,
}: NotificationsTabProps) {
  const { t } = useLanguage();

  return (
    <div className="relative z-10 flex flex-col gap-6 w-full animate-fadeIn text-left text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FiBell className="w-5 h-5 text-primary shrink-0" />
              <span>{t("notifications_activity_log", "Notifications & Activity Log")}</span>
            </h2>
            {unreadNotificationsCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="sm:hidden bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>{t("mark_read", "Mark Read")}</span>
                <FiCheck className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">{t("notifications_subtitle", "Stay updated on your proposal status, gig orders, and profile alerts.")}</p>
          {unreadNotificationsCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="hidden sm:flex bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <span>{t("mark_all_as_read", "Mark All as Read")}</span>
              <FiCheck className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-md text-slate-400">
              <FiBell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-1">{t("notifications_all_caught_up", "All caught up!")}</h3>
              <p className="text-slate-400 text-xs font-semibold">{t("notifications_empty_desc", "You have no new or past notifications at the moment.")}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n, idx) => (
              <div
                key={n.notification_id || `notif-tab-${idx}`}
                onClick={() => handleMarkSingleRead(n.notification_id, n.type, n.reference_id)}
                className={`py-4 px-4 flex gap-4 hover:bg-slate-50/80 border rounded-xl transition-all cursor-pointer ${
                  !n.is_read 
                    ? "bg-primary/[0.04] border-primary/20 hover:border-primary/30" 
                    : "bg-slate-50/30 border-slate-200 hover:border-slate-300"
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
                  ) : (n.type === "referral" || n.type === "signup_bonus" || n.type === "referral_signup_bonus") ? (
                    <span className="text-base">🎁</span>
                  ) : (
                    <FiBell className="w-4 h-4 text-amber-500" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className={`text-xs ${!n.is_read ? "font-black text-slate-900" : "font-extrabold text-slate-700"}`}>
                      {t(n.title)}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {n.created_at && !isNaN(new Date(n.created_at).getTime())
                        ? new Date(n.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                        : new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {formatNotificationMessage(n.message)}
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
