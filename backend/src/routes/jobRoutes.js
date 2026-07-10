import express from "express";
import { auth, checkApprovedFreelancer } from "../middleware/auth.js";
import {
  createJob,
  getClientJobs,
  getAllJobs,
  updateJob,
  validateJobSlug,
  getJobBySlugOrId,
  toggleJobFeature
} from "../controllers/jobController.js";

const router = express.Router();

// Public routes to fetch jobs (no auth needed)
router.get("/public", getAllJobs);
router.get("/public/:slugOrId", getJobBySlugOrId);

// Apply auth middleware to all other job routes
router.use(auth);

// Validate job slug route
router.get("/validate-slug", validateJobSlug);

// Job routes
router.post("/", checkApprovedFreelancer, createJob);
router.put("/:id", checkApprovedFreelancer, updateJob);
router.put("/:id/feature", toggleJobFeature);
router.get("/client", getClientJobs);
router.get("/", getAllJobs);

export default router;
