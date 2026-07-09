"use client";

import React from "react";
import FrontendContentTab from "@/components/admin/FrontendContentTab";
import { useAdmin } from "../AdminContext";

export default function FrontendContentPage() {
  const {
    frontendHeroContent,
    setFrontendHeroContent,
    handleSaveSetting
  } = useAdmin();

  return (
    <FrontendContentTab
      frontendHeroContent={frontendHeroContent}
      setFrontendHeroContent={setFrontendHeroContent}
      handleSaveSetting={handleSaveSetting}
    />
  );
}
