import express from "express";
import { getAIChatResponse, getGigsForAI, getJobsForAI, getAIUserInfo, generateProposal, matchProjects, parseResume, generateGigDescription } from "../controllers/aiController.js";
import { aiChatMiddleware, aiSearchMiddleware } from "../middleware/aiMiddleware.js";

const router = express.Router();

// AI Chat endpoint — rate-limited, soft-authed, prompt-sanitized, logged
router.post("/chat", aiChatMiddleware, getAIChatResponse);

// AI Proposal Writer — rate-limited, soft-authed (requires user JWT)
router.post("/generate-proposal", [aiChatMiddleware[0], aiChatMiddleware[1], aiChatMiddleware[2]], generateProposal);

// AI Project Matching — rate-limited, soft-authed (requires freelancer JWT)
router.get("/match-projects", [aiChatMiddleware[0], aiChatMiddleware[1], aiChatMiddleware[2]], matchProjects);

// AI Resume Reader & Auto-fill — rate-limited, soft-authed (requires freelancer JWT)
router.post("/parse-resume", [aiChatMiddleware[0], aiChatMiddleware[1], aiChatMiddleware[2]], parseResume);

// AI Gig Description Generator — rate-limited, soft-authed (requires freelancer JWT)
router.post("/generate-gig-description", [aiChatMiddleware[0], aiChatMiddleware[1], aiChatMiddleware[2]], generateGigDescription);



// AI Database search links — rate-limited, soft-authed, logged, validated key
router.get("/gigs", aiSearchMiddleware, getGigsForAI);
router.get("/jobs", aiSearchMiddleware, getJobsForAI);

// AI User Info query — rate-limited, soft-authed, logged, validated key
router.get("/user-info", aiSearchMiddleware, getAIUserInfo);

export default router;
