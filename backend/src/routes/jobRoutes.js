import express from "express";
import auth from "../middleware/auth.js";
import {
  createJob,
  getClientJobs,
  getAllJobs,
  updateJob
} from "../controllers/jobController.js";

const router = express.Router();

// Apply auth middleware to all job routes
router.use(auth);

// Job routes
router.post("/", createJob);
router.put("/:id", updateJob);
router.get("/client", getClientJobs);
router.get("/", getAllJobs);

export default router;
