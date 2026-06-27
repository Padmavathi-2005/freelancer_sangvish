"use client";

import React from "react";
import NotificationsTab from "@/components/dashboard/NotificationsTab";
import { useDashboard } from "../DashboardContext";

export default function NotificationsPage() {
  const {
    notifications,
    unreadNotificationsCount,
    handleMarkAllRead,
    handleMarkSingleRead
  } = useDashboard();

  return (
    <NotificationsTab
      notifications={notifications}
      unreadNotificationsCount={unreadNotificationsCount}
      handleMarkAllRead={handleMarkAllRead}
      handleMarkSingleRead={handleMarkSingleRead}
    />
  );
}
