import express from "express";
import {
  getPublicBlogs,
  getBlogBySlug,
  adminGetBlogs,
  adminGetBlogById,
  adminCreateBlog,
  adminUpdateBlog,
  adminDeleteBlog
} from "../controllers/blogController.js";
import { adminAuth } from "../admin/middleware/adminAuth.js";

const router = express.Router();

// Public routes (unprotected)
router.get("/blogs", getPublicBlogs);
router.get("/blogs/:slug", getBlogBySlug);

// Admin routes (protected)
router.get("/admin/blogs", adminAuth, adminGetBlogs);
router.get("/admin/blogs/:id", adminAuth, adminGetBlogById);
router.post("/admin/blogs", adminAuth, adminCreateBlog);
router.put("/admin/blogs/:id", adminAuth, adminUpdateBlog);
router.delete("/admin/blogs/:id", adminAuth, adminDeleteBlog);

export default router;
