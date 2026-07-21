import express from "express";
import { auth } from "../middleware/auth.js";
import { adminAuth } from "../admin/middleware/adminAuth.js";
import {
    getDocumentFields,
    getMyDocuments,
    uploadFreelancerDocument,
    getAdminDocumentFields,
    createAdminDocumentField,
    updateAdminDocumentField,
    deleteAdminDocumentField,
    getUserDocumentsForAdmin,
    updateDocumentStatus
} from "../controllers/documentController.js";

const router = express.Router();

// Freelancer/User endpoints
router.get("/fields", getDocumentFields);
router.get("/my-docs", auth, getMyDocuments);
router.post("/upload", auth, uploadFreelancerDocument);

// Admin endpoints (all protected by adminAuth)
router.get("/admin/fields", adminAuth, getAdminDocumentFields);
router.post("/admin/fields", adminAuth, createAdminDocumentField);
router.put("/admin/fields/:id", adminAuth, updateAdminDocumentField);
router.delete("/admin/fields/:id", adminAuth, deleteAdminDocumentField);
router.get("/admin/user/:userId", adminAuth, getUserDocumentsForAdmin);
router.put("/admin/:documentId/status", adminAuth, updateDocumentStatus);

export default router;
