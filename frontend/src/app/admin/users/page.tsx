"use client";

import React from "react";
import UsersTab from "@/components/admin/UsersTab";
import { useAdmin } from "../AdminContext";

export default function UsersPage() {
  const {
    usersSubTab,
    setUsersSubTab,
    usersSearch,
    setUsersSearch,
    paginatedUsers,
    usersPage,
    totalUsersPages,
    setUsersPage,
    filteredUsers,
    usersFilterRole,
    setUsersFilterRole,
    userCounts,
    itemsPerPage,
    handleToggleUserActive,
    adminsList,
    adminUser,
    newAdminName,
    setNewAdminName,
    newAdminEmail,
    setNewAdminEmail,
    newAdminPassword,
    setNewAdminPassword,
    newAdminRole,
    setNewAdminRole,
    adminError,
    adminSuccess,
    adminLoading,
    handleCreateAdmin,
    handleDeleteAdmin,
    fetchError,
    handleUpdateUserByAdmin,
    handleUpdateUserVettingStatus
  } = useAdmin();

  return (
    <UsersTab
      usersSubTab={usersSubTab}
      setUsersSubTab={setUsersSubTab}
      usersSearch={usersSearch}
      setUsersSearch={setUsersSearch}
      paginatedUsers={paginatedUsers}
      usersPage={usersPage}
      totalUsersPages={totalUsersPages}
      setUsersPage={setUsersPage}
      filteredUsers={filteredUsers}
      usersFilterRole={usersFilterRole}
      setUsersFilterRole={setUsersFilterRole}
      userCounts={userCounts}
      itemsPerPage={itemsPerPage}
      handleToggleUserActive={handleToggleUserActive}
      handleUpdateUserByAdmin={handleUpdateUserByAdmin}
      handleUpdateUserVettingStatus={handleUpdateUserVettingStatus}
      adminsList={adminsList}
      adminUser={adminUser}
      newAdminName={newAdminName}
      setNewAdminName={setNewAdminName}
      newAdminEmail={newAdminEmail}
      setNewAdminEmail={setNewAdminEmail}
      newAdminPassword={newAdminPassword}
      setNewAdminPassword={setNewAdminPassword}
      newAdminRole={newAdminRole}
      setNewAdminRole={setNewAdminRole}
      adminError={adminError}
      adminSuccess={adminSuccess}
      adminLoading={adminLoading}
      handleCreateAdmin={handleCreateAdmin}
      handleDeleteAdmin={handleDeleteAdmin}
      fetchError={fetchError}
    />
  );
}
