import express from "express";
import { auth, checkApprovedFreelancer, checkApprovedClient } from "../middleware/auth.js";
import {
    saveFreelancerProfile,
    saveFreelancerSkills,
    saveFreelancerLanguages,
    saveFreelancerExperience,
    saveFreelancerEducation,
    saveFreelancerCertification,
    deleteFreelancerExperience,
    deleteFreelancerEducation,
    deleteFreelancerCertification,
    saveFreelancerProject,
    sendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    getFreelancerOnboardingStatus,
    getFreelancerOnboardingDetails,
    completeFreelancerOnboarding,
    getLanguages,
    updateFreelancerOnboardingStep,
    getPublicFreelancerProfile,
    getFreelancerContracts,
    getRecommendedClients,
    requestContractPayment,
    approveContractPayment,
    getPublicFreelancers,
    getRecommendedFreelancers,
    validateFreelancerSlug,
    getContractTimecards,
    submitTimecard,
    approveTimecard,
    requestTimecardPayment,
    declineTimecard,
    submitContractCompletion,
    approveContractCompletion,
    getPublicClientProfile
} from "../controllers/freelancerController.js";
import {
    createFreelancerGig,
    getFreelancerGigs,
    getCurrencies,
    getClientGigs,
    applyToFreelancerGig,
    getFreelancerGigApplications,
    updateGigApplicationStatus,
    getClientGigApplications,
    updateGigApplicationMilestones,
    deleteFreelancerGig,
    updateFreelancerGig,
    getClientGigById,
    getSimilarGigs,
    syncGigWishlist,
    createGigReview,
    validateGigSlug
} from "../controllers/gigController.js";

const router = express.Router();

router.get("/currencies", getCurrencies);
router.get("/client/gigs/validate-slug", validateGigSlug);
router.get("/client/gigs", getClientGigs);
router.get("/client/gigs/:id", getClientGigById);
router.get("/client/gigs/:id/similar", getSimilarGigs);
router.get("/profile/validate-slug", validateFreelancerSlug);
router.get("/profile/:id", getPublicFreelancerProfile);
router.get("/client-profile/:id", getPublicClientProfile);
router.get("/public/list", getPublicFreelancers);

// Apply auth middleware to all routes
router.use(auth);

router.get("/languages", getLanguages);

// Status and details
router.get("/onboarding/status", getFreelancerOnboardingStatus);
router.get("/onboarding/details", getFreelancerOnboardingDetails);
router.post("/onboarding/step", updateFreelancerOnboardingStep);

// Step 1 Saves
router.post("/onboarding/profile", saveFreelancerProfile);
router.post("/onboarding/skills", saveFreelancerSkills);
router.post("/onboarding/languages", saveFreelancerLanguages);

// Step 2 Saves
router.post("/onboarding/experience", saveFreelancerExperience);
router.post("/onboarding/education", saveFreelancerEducation);
router.post("/onboarding/certification", saveFreelancerCertification);
router.delete("/onboarding/experience/:id", deleteFreelancerExperience);
router.delete("/onboarding/education/:id", deleteFreelancerEducation);
router.delete("/onboarding/certification/:id", deleteFreelancerCertification);

// Step 3 OTP Verification
router.post("/onboarding/verify/email/send", sendEmailOtp);
router.post("/onboarding/verify/email/verify", verifyEmailOtp);
router.post("/onboarding/verify/phone/send", sendPhoneOtp);
router.post("/onboarding/verify/phone/verify", verifyPhoneOtp);

// Step 4 Save
router.post("/onboarding/project", saveFreelancerProject);
router.post("/onboarding/portfolio", saveFreelancerProject); // alias used by frontend portfolio submit

// Complete Onboarding
router.post("/onboarding/complete", completeFreelancerOnboarding);

// Gig management routes
router.post("/gigs", checkApprovedFreelancer, createFreelancerGig);
router.get("/gigs", getFreelancerGigs);
router.post("/client/gigs/apply", checkApprovedClient, applyToFreelancerGig);
router.get("/client/gigs/applications", getClientGigApplications);
router.get("/gigs/applications", getFreelancerGigApplications);
router.post("/client/gigs/:id/wishlist", syncGigWishlist);
router.post("/client/gigs/:id/review", createGigReview);
router.delete("/gigs/:id", checkApprovedFreelancer, deleteFreelancerGig);
router.put("/gigs/:id", checkApprovedFreelancer, updateFreelancerGig);
router.put("/gigs/applications/:id", updateGigApplicationStatus);
router.put("/gigs/applications/:id/milestones", updateGigApplicationMilestones);
router.get("/contracts", getFreelancerContracts);
router.get("/recommended-clients", getRecommendedClients);
router.get("/client/recommendations", getRecommendedFreelancers);
router.put("/contracts/:id/request-payment", requestContractPayment);
router.put("/contracts/:id/approve-payment", approveContractPayment);

// Hourly contract timecard routes
router.get("/contracts/:id/timecards", getContractTimecards);
router.post("/contracts/:id/timecards", submitTimecard);
router.post("/contracts/:id/timecards/request-payment", requestTimecardPayment);
router.put("/contracts/:id/timecards/:timecard_id/approve", approveTimecard);
router.put("/contracts/:id/timecards/:timecard_id/decline", declineTimecard);
router.put("/contracts/:id/submit-completion", submitContractCompletion);
router.put("/contracts/:id/approve-completion", approveContractCompletion);

export default router;
