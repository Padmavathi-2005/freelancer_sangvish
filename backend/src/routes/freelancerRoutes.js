import express from "express";
import auth from "../middleware/auth.js";
import {
    saveFreelancerProfile,
    saveFreelancerSkills,
    saveFreelancerLanguages,
    saveFreelancerExperience,
    saveFreelancerEducation,
    saveFreelancerCertification,
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
    getPublicFreelancerProfile
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
    updateGigApplicationMilestones
} from "../controllers/gigController.js";

const router = express.Router();

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

// Step 3 OTP Verification
router.post("/onboarding/verify/email/send", sendEmailOtp);
router.post("/onboarding/verify/email/verify", verifyEmailOtp);
router.post("/onboarding/verify/phone/send", sendPhoneOtp);
router.post("/onboarding/verify/phone/verify", verifyPhoneOtp);

// Step 4 Save
router.post("/onboarding/project", saveFreelancerProject);

// Complete Onboarding
router.post("/onboarding/complete", completeFreelancerOnboarding);

// Gig management routes
router.post("/gigs", createFreelancerGig);
router.get("/gigs", getFreelancerGigs);
router.get("/currencies", getCurrencies);
router.get("/client/gigs", getClientGigs);
router.post("/client/gigs/apply", applyToFreelancerGig);
router.get("/client/gigs/applications", getClientGigApplications);
router.get("/gigs/applications", getFreelancerGigApplications);
router.put("/gigs/applications/:id", updateGigApplicationStatus);
router.put("/gigs/applications/:id/milestones", updateGigApplicationMilestones);
router.get("/profile/:id", getPublicFreelancerProfile);

export default router;
