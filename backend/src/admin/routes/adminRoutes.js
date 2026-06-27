import express from "express";
import {
    createAdmin,
    loginAdmin,
    getAdmins,
    deleteAdmin,
    getUsers,
    toggleUserActive,
    getProjects,
    updateProjectStatus,
    deleteProject,
    getGigs,
    updateGigStatus,
    deleteGig,
    getGigOrders,
    updateGigOrderStatus,
    getTransactions
} from "../controllers/adminController.js";
import {
    getSettings,
    updateSetting
} from "../controllers/settingsController.js";
import {
    getPlatformWalletStats,
    getWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal
} from "../controllers/adminWalletController.js";

import { adminAuth } from "../middleware/adminAuth.js";

const router = express.Router();

// login
router.post("/login", loginAdmin);

// create admin (protected)
router.post("/create", adminAuth, createAdmin);

// get all admins
router.get("/all", adminAuth, getAdmins);

// delete admin
router.delete("/delete/:id", adminAuth, deleteAdmin);

// settings
router.get("/settings", getSettings);
router.post("/settings", adminAuth, updateSetting);

// user management routes
router.get("/users", adminAuth, getUsers);
router.put("/users/:id/toggle-active", adminAuth, toggleUserActive);

// project (job) management routes
router.get("/projects", adminAuth, getProjects);
router.put("/projects/:id/status", adminAuth, updateProjectStatus);
router.delete("/projects/:id", adminAuth, deleteProject);

// gig management routes
router.get("/gigs", adminAuth, getGigs);
router.put("/gigs/:id/status", adminAuth, updateGigStatus);
router.delete("/gigs/:id", adminAuth, deleteGig);

// gig order routes
router.get("/gig-orders", adminAuth, getGigOrders);
router.put("/gig-orders/:id/status", adminAuth, updateGigOrderStatus);

// transaction/contract routes
router.get("/transactions", adminAuth, getTransactions);

// admin wallet & payout routes
router.get("/wallet/stats", adminAuth, getPlatformWalletStats);
router.get("/wallet/withdrawals", adminAuth, getWithdrawalRequests);
router.post("/wallet/withdrawals/:id/approve", adminAuth, approveWithdrawal);
router.post("/wallet/withdrawals/:id/reject", adminAuth, rejectWithdrawal);

export default router;