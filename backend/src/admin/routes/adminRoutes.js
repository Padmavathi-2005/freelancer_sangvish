import express from "express";
import {
    createAdmin,
    loginAdmin,
    getAdmins,
    deleteAdmin,
    getUsers,
    toggleUserActive,
    updateFreelancerVettingStatus,
    getProjects,
    updateProjectStatus,
    deleteProject,
    getGigs,
    updateGigStatus,
    deleteGig,
    getGigOrders,
    updateGigOrderStatus,
    getTransactions,
    getAdminLanguages,
    createLanguage,
    updateLanguage,
    deleteLanguage,
    getAdminTranslations,
    updateAdminTranslations,
    addGlobalTranslationKey,
    getAdminCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    getSubscriptionPlans,
    updateSubscriptionPlan,
    createSubscriptionPlan,
    deleteSubscriptionPlan,
    getFaqs,
    createFaq,
    deleteFaq,
    getWhyChooseFeatures,
    createWhyChooseFeature,
    deleteWhyChooseFeature,
    getHowItWorksSteps,
    createHowItWorksStep,
    deleteHowItWorksStep,
    cleanData,
    getPendingProposals,
    updateProposalVettingStatus,
    getBackups,
    createBackup,
    downloadBackup,
    deleteBackup,
    getAdminProfile,
    getAdminDisputes,
    getAdminDisputeMessages,
    reopenAdminDispute,
    getContactInquiries,
    updateContactInquiryStatus,
    deleteContactInquiry,
    replyContactInquiry,
    getNewsletterSubscribers,
    updateNewsletterSubscriberStatus,
    deleteNewsletterSubscriber,
    getCareerApplications,
    deleteCareerApplication
} from "../controllers/adminController.js";
import {
    getSettings,
    updateSetting
} from "../controllers/settingsController.js";
import {
    addFormFieldOption,
    deleteFormFieldOption
} from "../../controllers/formFieldController.js";
import {
    getPlatformWalletStats,
    getWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal,
    payToUser,
    getReferralPayouts,
    approveReferralPayout,
    rejectReferralPayout,
    getAdminAffiliateCommissions,
    approveAffiliateCommission,
    rejectAffiliateCommission
} from "../controllers/adminWalletController.js";

import { adminAuth } from "../middleware/adminAuth.js";
import { adminResolve } from "../../controllers/disputeController.js";

const router = express.Router();

// login
router.post("/login", loginAdmin);

// get profile
router.get("/me", adminAuth, getAdminProfile);

// create admin (protected)
router.post("/create", adminAuth, createAdmin);

// get all admins
router.get("/all", adminAuth, getAdmins);

// delete admin
router.delete("/delete/:id", adminAuth, deleteAdmin);

// settings
router.get("/settings", getSettings);
router.post("/settings", adminAuth, updateSetting);
router.post("/clean-data", adminAuth, cleanData);

// form fields management
router.post("/form-field-options", adminAuth, addFormFieldOption);
router.delete("/form-field-options/:id", adminAuth, deleteFormFieldOption);

// database backups
router.get("/backups", adminAuth, getBackups);
router.post("/backups", adminAuth, createBackup);
router.get("/backups/:filename/download", adminAuth, downloadBackup);
router.delete("/backups/:filename", adminAuth, deleteBackup);

// user management routes
router.get("/users", adminAuth, getUsers);
router.put("/users/:id/toggle-active", adminAuth, toggleUserActive);
router.put("/users/:id/vetting", adminAuth, updateFreelancerVettingStatus);

// project (job) management routes
router.get("/projects", adminAuth, getProjects);
router.put("/projects/:id/status", adminAuth, updateProjectStatus);
router.delete("/projects/:id", adminAuth, deleteProject);

// proposal vetting routes
router.get("/proposals/pending", adminAuth, getPendingProposals);
router.put("/proposals/:id/vetting", adminAuth, updateProposalVettingStatus);

// gig management routes
router.get("/gigs", adminAuth, getGigs);
router.put("/gigs/:id/status", adminAuth, updateGigStatus);
router.delete("/gigs/:id", adminAuth, deleteGig);

// gig order routes
router.get("/gig-orders", adminAuth, getGigOrders);
router.put("/gig-orders/:id/status", adminAuth, updateGigOrderStatus);

// transaction/contract routes
router.get("/transactions", adminAuth, getTransactions);

// languages CRUD routes
router.get("/languages", adminAuth, getAdminLanguages);
router.post("/languages", adminAuth, createLanguage);
router.put("/languages/:id", adminAuth, updateLanguage);
router.delete("/languages/:id", adminAuth, deleteLanguage);

// translation management routes
router.get("/translations/:code", adminAuth, getAdminTranslations);
router.post("/translations/:code", adminAuth, updateAdminTranslations);
router.post("/translations/add-key", adminAuth, addGlobalTranslationKey);

// currencies CRUD routes
router.get("/currencies", adminAuth, getAdminCurrencies);
router.post("/currencies", adminAuth, createCurrency);
router.put("/currencies/:id", adminAuth, updateCurrency);
router.delete("/currencies/:id", adminAuth, deleteCurrency);

// subscription plans routes
router.get("/subscription-plans", adminAuth, getSubscriptionPlans);
router.post("/subscription-plans", adminAuth, createSubscriptionPlan);
router.put("/subscription-plans/:id", adminAuth, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", adminAuth, deleteSubscriptionPlan);

// FAQ management routes
router.get("/faqs", adminAuth, getFaqs);
router.post("/faqs", adminAuth, createFaq);
router.delete("/faqs/:id", adminAuth, deleteFaq);

// Why Choose Us features admin routes
router.get("/why-choose-features", adminAuth, getWhyChooseFeatures);
router.post("/why-choose-features", adminAuth, createWhyChooseFeature);
router.delete("/why-choose-features/:id", adminAuth, deleteWhyChooseFeature);

// How It Works steps admin routes
router.get("/how-it-works-steps", adminAuth, getHowItWorksSteps);
router.post("/how-it-works-steps", adminAuth, createHowItWorksStep);
router.delete("/how-it-works-steps/:id", adminAuth, deleteHowItWorksStep);

// admin wallet & payout routes
router.get("/wallet/stats", adminAuth, getPlatformWalletStats);
router.get("/wallet/withdrawals", adminAuth, getWithdrawalRequests);
router.post("/wallet/withdrawals/:id/approve", adminAuth, approveWithdrawal);
router.post("/wallet/withdrawals/:id/reject", adminAuth, rejectWithdrawal);
router.post("/wallet/pay", adminAuth, payToUser);

// admin referrals routes
router.get("/referrals/payouts", adminAuth, getReferralPayouts);
router.post("/referrals/payouts/:id/approve", adminAuth, approveReferralPayout);
router.post("/referrals/payouts/:id/reject", adminAuth, rejectReferralPayout);

// admin affiliates routes
router.get("/affiliates/commissions", adminAuth, getAdminAffiliateCommissions);
router.post("/affiliates/commissions/:id/approve", adminAuth, approveAffiliateCommission);
router.post("/affiliates/commissions/:id/reject", adminAuth, rejectAffiliateCommission);

// Admin dispute resolution route
router.get("/disputes", adminAuth, getAdminDisputes);
router.get("/disputes/:id/messages", adminAuth, getAdminDisputeMessages);
router.post("/disputes/:id/resolve", adminAuth, adminResolve);
router.post("/disputes/:id/reopen", adminAuth, reopenAdminDispute);

// Admin Contact Inquiries routes
router.get("/contact-inquiries", adminAuth, getContactInquiries);
router.patch("/contact-inquiries/:id/status", adminAuth, updateContactInquiryStatus);
router.post("/contact-inquiries/:id/reply", adminAuth, replyContactInquiry);
router.delete("/contact-inquiries/:id", adminAuth, deleteContactInquiry);

// Admin Newsletter Subscribers routes
router.get("/newsletter-subscribers", adminAuth, getNewsletterSubscribers);
router.patch("/newsletter-subscribers/:id/status", adminAuth, updateNewsletterSubscriberStatus);
router.delete("/newsletter-subscribers/:id", adminAuth, deleteNewsletterSubscriber);

// Admin Career Applications routes
router.get("/careers/applications", adminAuth, getCareerApplications);
router.delete("/careers/applications/:id", adminAuth, deleteCareerApplication);

export default router;