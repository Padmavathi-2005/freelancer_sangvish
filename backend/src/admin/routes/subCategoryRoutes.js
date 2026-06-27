import express from "express";

import {
    getSubCategories,
    getSubCategory,
    addSubCategory,
    editSubCategory,
    removeSubCategory
} from "../controllers/subCategoryController.js";

const router = express.Router();

router.get("/", getSubCategories);

router.get("/:id", getSubCategory);

router.post("/", addSubCategory);

router.put("/:id", editSubCategory);

router.delete("/:id", removeSubCategory);

export default router;