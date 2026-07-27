"use client";

import React from "react";
import TaxonomiesTab from "@/components/admin/TaxonomiesTab";
import { useAdmin } from "../AdminContext";

export default function LanguagesPage() {
  const adminState = useAdmin();

  // On the /admin/languages page, only languages or currencies subTab is allowed.
  // Default to languages if categoriesSubTab is not currencies.
  const currentTab = adminState.categoriesSubTab === "currencies" ? "currencies" : "languages";

  return (
    <TaxonomiesTab
      categoriesSubTab={currentTab}
      setCategoriesSubTab={adminState.setCategoriesSubTab}
      categoriesSearch={adminState.categoriesSearch}
      setCategoriesSearch={adminState.setCategoriesSearch}
      paginatedCategories={adminState.paginatedCategories}
      categoriesPage={adminState.categoriesPage}
      totalCategoriesPages={adminState.totalCategoriesPages}
      setCategoriesPage={adminState.setCategoriesPage}
      filteredCategories={adminState.filteredCategories}
      itemsPerPage={adminState.itemsPerPage}

      paginatedSubcategories={adminState.paginatedSubcategories}
      subcategoriesPage={adminState.subcategoriesPage}
      totalSubcategoriesPages={adminState.totalSubcategoriesPages}
      setSubcategoriesPage={adminState.setSubcategoriesPage}
      filteredSubcategories={adminState.filteredSubcategories}

      paginatedSkills={adminState.paginatedSkills}
      skillsPage={adminState.skillsPage}
      totalSkillsPages={adminState.totalSkillsPages}
      setSkillsPage={adminState.setSkillsPage}
      filteredSkills={adminState.filteredSkills}

      categoriesList={adminState.categoriesList}
      isCategoryModalOpen={adminState.isCategoryModalOpen}
      setIsCategoryModalOpen={adminState.setIsCategoryModalOpen}
      categoryModalMode={adminState.categoryModalMode}
      categoryFormName={adminState.categoryFormName}
      setCategoryFormName={adminState.setCategoryFormName}
      categoryFormSlug={adminState.categoryFormSlug}
      setCategoryFormSlug={adminState.setCategoryFormSlug}
      categoryFormDescription={adminState.categoryFormDescription}
      setCategoryFormDescription={adminState.setCategoryFormDescription}
      categoryFormImage={adminState.categoryFormImage}
      setCategoryFormImage={adminState.setCategoryFormImage}
      categoryFormVideo={adminState.categoryFormVideo}
      setCategoryFormVideo={adminState.setCategoryFormVideo}
      categoryFormStatus={adminState.categoryFormStatus}
      setCategoryFormStatus={adminState.setCategoryFormStatus}
      categoryFormError={adminState.categoryFormError}
      categoryFormLoading={adminState.categoryFormLoading}
      handleCategorySubmit={adminState.handleCategorySubmit}
      handleDeleteCategory={adminState.handleDeleteCategory}
      handleEditCategoryClick={adminState.handleEditCategoryClick}
      handleAddCategoryClick={adminState.handleAddCategoryClick}

      subcategoriesList={adminState.subcategoriesList}
      isSubcategoryModalOpen={adminState.isSubcategoryModalOpen}
      setIsSubcategoryModalOpen={adminState.setIsSubcategoryModalOpen}
      subcategoryModalMode={adminState.subcategoryModalMode}
      subcategoryFormName={adminState.subcategoryFormName}
      setSubcategoryFormName={adminState.setSubcategoryFormName}
      subcategoryFormCategoryId={adminState.subcategoryFormCategoryId}
      setSubcategoryFormCategoryId={adminState.setSubcategoryFormCategoryId}
      subcategoryFormStatus={adminState.subcategoryFormStatus}
      setSubcategoryFormStatus={adminState.setSubcategoryFormStatus}
      subcategoryFormError={adminState.subcategoryFormError}
      subcategoryFormLoading={adminState.subcategoryFormLoading}
      handleSubcategorySubmit={adminState.handleSubcategorySubmit}
      handleDeleteSubcategory={adminState.handleDeleteSubcategory}
      handleEditSubcategoryClick={adminState.handleEditSubcategoryClick}
      handleAddSubcategoryClick={adminState.handleAddSubcategoryClick}

      selectedCategoryIds={adminState.selectedCategoryIds}
      setSelectedCategoryIds={adminState.setSelectedCategoryIds}
      selectedSubcategoryIds={adminState.selectedSubcategoryIds}
      setSelectedSubcategoryIds={adminState.setSelectedSubcategoryIds}
      selectedSkillIds={adminState.selectedSkillIds}
      setSelectedSkillIds={adminState.setSelectedSkillIds}
      handleBulkDeleteCategories={adminState.handleBulkDeleteCategories}
      handleBulkDeleteSubcategories={adminState.handleBulkDeleteSubcategories}
      handleBulkDeleteSkills={adminState.handleBulkDeleteSkills}

      skillsList={adminState.skillsList}
      isSkillModalOpen={adminState.isSkillModalOpen}
      setIsSkillModalOpen={adminState.setIsSkillModalOpen}
      skillModalMode={adminState.skillModalMode}
      skillFormName={adminState.skillFormName}
      setSkillFormName={adminState.setSkillFormName}
      skillFormSubcategoryId={adminState.skillFormSubcategoryId}
      setSkillFormSubcategoryId={adminState.setSkillFormSubcategoryId}
      skillFormStatus={adminState.skillFormStatus}
      setSkillFormStatus={adminState.setSkillFormStatus}
      skillFormError={adminState.skillFormError}
      skillFormLoading={adminState.skillFormLoading}
      handleSkillSubmit={adminState.handleSkillSubmit}
      handleDeleteSkill={adminState.handleDeleteSkill}
      handleEditSkillClick={adminState.handleEditSkillClick}
      handleAddSkillClick={adminState.handleAddSkillClick}
    />
  );
}
