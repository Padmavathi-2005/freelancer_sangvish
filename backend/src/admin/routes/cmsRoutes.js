import express from "express";
import {
  getAllPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getPageBySlug,
  getPublicPages
} from "../controllers/cmsController.js";
import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// Admin routes (protected)
router.get("/admin/cms/pages", adminAuth, getAllPages);
router.get("/admin/cms/pages/:id", adminAuth, getPageById);
router.post("/admin/cms/pages", adminAuth, createPage);
router.put("/admin/cms/pages/:id", adminAuth, updatePage);
router.delete("/admin/cms/pages/:id", adminAuth, deletePage);

// Public routes (unprotected)
router.get("/pages", getPublicPages);
router.get("/pages/:slug", getPageBySlug);

export default router;
