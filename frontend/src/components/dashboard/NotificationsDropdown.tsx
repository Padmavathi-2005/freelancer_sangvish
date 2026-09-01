import React from "react";
import { FiBell, FiMessageSquare, FiFileText, FiBriefcase } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";

interface NotificationsDropdownProps {
  notifications: any[];
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  handleMarkAllRead: () => Promise<void>;
  handleMarkSingleRead: (notifId: number, notifType: string, refId: string | null) => Promise<void>;
  setActiveTab: (tab: string) => void;
}

const formatNotificationMessage = (msg: string, t?: (key: string, fallback: string) => string) => {
  if (!msg) return "";
  let text = msg;
  if (typeof msg === "string" && (msg.trim().startsWith("{") || msg.trim().startsWith("["))) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.isCustomOffer || parsed.type === "offer") {
        text = `Custom Offer: "${parsed.title || 'Project Offer'}" for $${parseFloat(parsed.price || parsed.amount || 0).toLocaleString()}`;
      } else if (parsed.text || parsed.message) {
        text = parsed.text || parsed.message;
      }
    } catch (e) {
      // ignore
    }
  }
  if (t) {
    const key = text.replace(/[^\w\s]/g, "").trim().toLowerCase().replace(/\s+/g, "_");
    return t(key, text);
  }
  return text;
};

export default function NotificationsDropdown({
  notifications,
  unreadNotificationsCount,
  isNotificationsOpen,
  setIsNotificationsOpen,
  handleMarkAllRead,
  handleMarkSingleRead,
  setActiveTab,
}: NotificationsDropdownProps) {
  const { t } = useLanguage();
  const lastFiveNotifications = notifications.slice(0, 5);
  const [isRtl, setIsRtl] = React.useState(false);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setIsRtl(document.documentElement.dir === "rtl");
      
      const observer = new MutationObserver(() => {
        setIsRtl(document.documentElement.dir === "rtl");
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsNotificationsOpen(true)}
      onMouseLeave={() => setIsNotificationsOpen(false)}
    >
      <button
        onClick={() => {
          setActiveTab("notifications");
          setIsNotificationsOpen(false);
        }}
        className="relative p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-200 bg-white cursor-pointer shadow-sm shrink-0 flex items-center justify-center w-9 h-9"
      >
        <FiBell className="w-5 h-5" />
        
        {/* Red pulsing badge */}
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white transform translate-x-1 -translate-y-1 bg-rose-600 rounded-full animate-pulse">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {isNotificationsOpen && (
        <>
          {/* Backdrop overlay to click outside and close */}
          <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsNotificationsOpen(false)}></div>
          
          {/* Dropdown panel */}
          <div 
            className="absolute mt-2 w-80 bg-white rounded-xl border border-slate-200/80 shadow-lg py-2 z-50 animate-fadeIn text-slate-800"
            style={{
              left: isRtl ? "0" : "auto",
              right: isRtl ? "auto" : "0",
              textAlign: isRtl ? "right" : "left"
            }}
          >
            <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <span className="text-xs font-black text-slate-800">{t("recent_notifications_header", "Recent Notifications")}</span>
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  {t("mark_all_as_read_btn", "Mark all as read")}
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
              {lastFiveNotifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 select-none">
                  <p className="text-[11px] font-semibold">{t("no_notifications_msg", "No notifications yet")}</p>
                  <p className="text-[9px] mt-0.5 font-medium leading-normal">{t("no_notifications_desc", "Updates on projects, orders and inbox will appear here.")}</p>
                </div>
              ) : (
                lastFiveNotifications.map((n, idx) => {
                  const cleanedTitleKey = n.title.replace(/[^\w\s]/g, "").trim().toLowerCase().replace(/\s+/g, "_");
                  const displayTitle = t(cleanedTitleKey, n.title);
                  return (
                    <div
                       key={n.notification_id || `notif-dropdown-${idx}`}
                       onClick={() => handleMarkSingleRead(n.notification_id, n.type, n.reference_id)}
                       className={`p-3.5 flex gap-3 hover:bg-slate-50/50 transition-all cursor-pointer ${
                         !n.is_read ? "bg-primary/5" : ""
                       }`}
                    >
                      {/* Type Icon */}
                      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs select-none">
                        {n.type === "message" ? (
                          <span className="bg-sky-50 text-sky-600 p-1.5 rounded-lg flex items-center justify-center">
                            <FiMessageSquare className="w-4 h-4" />
                          </span>
                        ) : n.type === "proposal" ? (
                          <span className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg flex items-center justify-center">
                            <FiFileText className="w-4 h-4" />
                          </span>
                        ) : n.type === "gig" ? (
                          <span className="bg-violet-50 text-violet-600 p-1.5 rounded-lg flex items-center justify-center">
                            <FiBriefcase className="w-4 h-4" />
                          </span>
                        ) : (n.type === "referral" || n.type === "signup_bonus" || n.type === "referral_signup_bonus") ? (
                          <span className="bg-purple-50 text-purple-600 p-1 rounded-lg flex items-center justify-center text-sm">
                            🎁
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-600 p-1.5 rounded-lg flex items-center justify-center">
                            <FiBell className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="min-w-0 flex-1 text-left" style={{ textAlign: isRtl ? "right" : "left" }}>
                        <div className="flex justify-between items-baseline gap-1">
                          <h4 className={`text-xs truncate ${!n.is_read ? "font-extrabold text-slate-900" : "font-semibold text-slate-700"}`}>
                            {displayTitle}
                          </h4>
                          <span className="text-[8px] text-slate-404 font-bold shrink-0">
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5 break-words">
                          {formatNotificationMessage(n.message, t)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* View All Footer */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl text-center">
              <button
                onClick={() => {
                  setActiveTab("notifications");
                  setIsNotificationsOpen(false);
                }}
                className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                {t("view_all_notifications_btn", "View all notifications")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
