"use client";

import React from "react";
import SettingsTab from "@/components/dashboard/SettingsTab";
import { useDashboard } from "../DashboardContext";

export default function SettingsPage() {
  const {
    userRole,
    clientBasics,
    setClientBasics,
    profileBasics,
    setProfileBasics,
    experiences,
    setExperiences,
    expCompany,
    setExpCompany,
    expTitle,
    setExpTitle,
    expEmpType,
    setExpEmpType,
    expStart,
    setExpStart,
    expEnd,
    setExpEnd,
    expCurrent,
    setExpCurrent,
    expDesc,
    setExpDesc,
    eduInst,
    setEduInst,
    eduDegree,
    setEduDegree,
    eduField,
    setEduField,
    eduStart,
    setEduStart,
    eduEnd,
    setEduEnd,
    certName,
    setCertName,
    certOrg,
    setCertOrg,
    certDate,
    setCertDate,
    certCredUrl,
    setCertCredUrl,
    educations,
    setEducations,
    certifications,
    setCertifications,
    selectedSkills,
    setSelectedSkills,
    availableSkillsList,
    triggerToast,
    profileStep,
    setProfileStep,
    isEditingProfile,
    setIsEditingProfile,
    showPublishConfirmModal,
    setShowPublishConfirmModal,
    stepsStatus,
    profileCompletionProgress,
    handleSaveStep,
    handleSaveClientStepSettings,
    deleteExperience,
    deleteEducation,
    deleteCertification,
    setActiveTab,
    userName
  } = useDashboard();

  // Map the newExp/newEdu/newCert to props expected by SettingsTab
  const newExp = {
    company_name: expCompany,
    job_title: expTitle,
    employment_type: expEmpType,
    start_date: expStart,
    end_date: expEnd,
    currently_working: expCurrent,
    description: expDesc
  };
  const setNewExp = (val: any) => {
    if (val.company_name !== undefined) setExpCompany(val.company_name);
    if (val.job_title !== undefined) setExpTitle(val.job_title);
    if (val.employment_type !== undefined) setExpEmpType(val.employment_type);
    if (val.start_date !== undefined) setExpStart(val.start_date);
    if (val.end_date !== undefined) setExpEnd(val.end_date);
    if (val.currently_working !== undefined) setExpCurrent(val.currently_working);
    if (val.description !== undefined) setExpDesc(val.description);
  };

  const newEdu = {
    institution_name: eduInst,
    degree: eduDegree,
    field_of_study: eduField,
    start_year: eduStart,
    end_year: eduEnd
  };
  const setNewEdu = (val: any) => {
    if (val.institution_name !== undefined) setEduInst(val.institution_name);
    if (val.degree !== undefined) setEduDegree(val.degree);
    if (val.field_of_study !== undefined) setEduField(val.field_of_study);
    if (val.start_year !== undefined) setEduStart(val.start_year);
    if (val.end_year !== undefined) setEduEnd(val.end_year);
  };

  const newCert = {
    certificate_name: certName,
    issuing_organization: certOrg,
    issue_date: certDate,
    credential_url: certCredUrl
  };
  const setNewCert = (val: any) => {
    if (val.certificate_name !== undefined) setCertName(val.certificate_name);
    if (val.issuing_organization !== undefined) setCertOrg(val.issuing_organization);
    if (val.issue_date !== undefined) setCertDate(val.issue_date);
    if (val.credential_url !== undefined) setCertCredUrl(val.credential_url);
  };

  return (
    <SettingsTab
      userRole={userRole}
      clientBasics={clientBasics}
      setClientBasics={setClientBasics}
      profileBasics={profileBasics}
      setProfileBasics={setProfileBasics}
      experiences={experiences}
      setExperiences={setExperiences}
      newExp={newExp}
      setNewExp={setNewExp}
      education={educations}
      setEducation={setEducations}
      newEdu={newEdu}
      setNewEdu={setNewEdu}
      certifications={certifications}
      setCertifications={setCertifications}
      newCert={newCert}
      setNewCert={setNewCert}
      selectedSkills={selectedSkills}
      setSelectedSkills={setSelectedSkills}
      availableSkillsList={availableSkillsList}
      triggerToast={triggerToast}
      profileStep={profileStep}
      setProfileStep={setProfileStep}
      isEditingProfile={isEditingProfile}
      setIsEditingProfile={setIsEditingProfile}
      showPublishConfirmModal={showPublishConfirmModal}
      setShowPublishConfirmModal={setShowPublishConfirmModal}
      stepsStatus={stepsStatus}
      profileCompletionProgress={profileCompletionProgress}
      handleSaveStep={handleSaveStep}
      handleSaveClientStepSettings={handleSaveClientStepSettings}
      deleteExperience={deleteExperience}
      deleteEducation={deleteEducation}
      deleteCertification={deleteCertification}
      setActiveTab={setActiveTab}
      userName={userName}
    />
  );
}
