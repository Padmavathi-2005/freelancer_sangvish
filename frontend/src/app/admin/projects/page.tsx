"use client";

import React from "react";
import ProjectsTab from "@/components/admin/ProjectsTab";
import { useAdmin } from "../AdminContext";

export default function ProjectsPage() {
  const {
    projectsSubTab,
    setProjectsSubTab,
    projectsSearch,
    setProjectsSearch,
    paginatedProjects,
    projectsPage,
    totalProjectsPages,
    setProjectsPage,
    filteredProjects,
    itemsPerPage,
    handleUpdateProjectStatus,
    handleDeleteProject,
    vettingApps,
    updateVettingStatus
  } = useAdmin();

  return (
    <ProjectsTab
      projectsSubTab={projectsSubTab}
      setProjectsSubTab={setProjectsSubTab}
      projectsSearch={projectsSearch}
      setProjectsSearch={setProjectsSearch}
      paginatedProjects={paginatedProjects}
      projectsPage={projectsPage}
      totalProjectsPages={totalProjectsPages}
      setProjectsPage={setProjectsPage}
      filteredProjects={filteredProjects}
      itemsPerPage={itemsPerPage}
      handleUpdateProjectStatus={handleUpdateProjectStatus}
      handleDeleteProject={handleDeleteProject}
      vettingApps={vettingApps}
      updateVettingStatus={updateVettingStatus}
    />
  );
}
