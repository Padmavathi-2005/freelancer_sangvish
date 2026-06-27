import express from "express";
import auth from "../middleware/auth.js";
import {
  createProposal,
  getFreelancerProposals,
  getJobProposals,
  updateProposalStatus,
  updateProposalMilestones
} from "../controllers/proposalController.js";

const router = express.Router();

// Apply auth middleware to all proposal routes
router.use(auth);

// Proposal routes
router.post("/", createProposal);
router.get("/my-proposals", getFreelancerProposals);
router.get("/job/:jobId", getJobProposals);
router.patch("/:proposalId/status", updateProposalStatus);
router.patch("/:proposalId/milestones", updateProposalMilestones);

export default router;
