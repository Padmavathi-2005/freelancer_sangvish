import express from "express";
import { auth, checkApprovedFreelancer } from "../middleware/auth.js";
import {
  createProposal,
  getFreelancerProposals,
  getJobProposals,
  updateProposalStatus,
  updateProposalMilestones,
  createDirectHire,
  respondDirectHire,
  submitContractReview,
  getContractReview,
  checkProposalLimit
} from "../controllers/proposalController.js";

const router = express.Router();

// Apply auth middleware to all proposal routes
router.use(auth);

// Proposal limit check endpoint
router.get("/limit-check", checkProposalLimit);

// Direct hire endpoints
router.post("/direct-hire", createDirectHire);
router.post("/:proposalId/respond-direct-hire", respondDirectHire);

// Contract review endpoints
router.post("/contracts/:id/review", submitContractReview);
router.get("/contracts/:id/review", getContractReview);

// Proposal routes
router.post("/", checkApprovedFreelancer, createProposal);
router.get("/my-proposals", getFreelancerProposals);
router.get("/job/:jobId", getJobProposals);
router.patch("/:proposalId/status", updateProposalStatus);
router.patch("/:proposalId/milestones", updateProposalMilestones);

export default router;
